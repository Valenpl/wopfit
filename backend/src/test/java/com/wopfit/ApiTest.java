package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.time.Clock;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wopfit.service.TimeService;

/** Base de los tests contra la API (H2 en memoria): llamar, crear un usuario con plan y fijar "hoy" (miércoles 21/10/2026). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
abstract class ApiTest {
    static final LocalDate TODAY = LocalDate.of(2026, 10, 21);

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired TimeService time;

    JsonNode call(MockHttpServletRequestBuilder req, String token, Object body, int expected) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(body instanceof String s ? s : om.writeValueAsString(body));
        var res = mvc.perform(req).andReturn().getResponse();
        res.setCharacterEncoding("UTF-8");
        String txt = res.getContentAsString();
        assertThat(res.getStatus()).as(txt).isEqualTo(expected);
        return txt.isEmpty() ? null : om.readTree(txt);
    }

    void setToday(LocalDate d) {
        time.setClock(Clock.fixed(d.atStartOfDay(TimeService.ZONE).plusHours(12).toInstant(), TimeService.ZONE));
    }

    @BeforeEach
    void today() {
        setToday(TODAY);
    }

    /** Usuario con plan, sin TACC. Devuelve el token. */
    String newUser(String email) throws Exception {
        JsonNode reg = call(post("/api/auth/register"), null, "{\"email\":\"" + email + "\",\"password\":\"clave1234\"}", 201);
        String t = call(post("/api/auth/verify"), null, "{\"email\":\"" + email + "\",\"code\":\"" + reg.get("devCode").asText() + "\"}", 200)
                .get("token").asText();
        call(put("/api/me/about"), t, "{\"name\":\"Sofi\",\"birthDate\":\"1992-08-14\",\"heightCm\":160,\"weightKg\":58}", 200);
        call(put("/api/me/preferences"), t, "{\"goals\":[\"comer\"],\"days\":[0,2,4],\"minutes\":30,\"budget\":\"medio\",\"activities\":[],"
                + "\"avoid\":[\"tacc\"],\"otherAvoid\":\"\",\"health\":[],\"level\":\"principiante\",\"equipment\":[\"nada\"]}", 200);
        call(post("/api/plan"), t, null, 200);
        return t;
    }
}
