package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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

/** Cuenta (cambiar contraseña) y lista del súper. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class AccountShoppingTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired TimeService time;

    private JsonNode call(MockHttpServletRequestBuilder req, String token, Object body, int expected) throws Exception {
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (body != null) req.contentType(MediaType.APPLICATION_JSON).content(body instanceof String s ? s : om.writeValueAsString(body));
        var res = mvc.perform(req).andReturn().getResponse();
        res.setCharacterEncoding("UTF-8");
        String txt = res.getContentAsString();
        assertThat(res.getStatus()).as(txt).isEqualTo(expected);
        return txt.isEmpty() ? null : om.readTree(txt);
    }

    /** Usuario con plan, sin TACC. Devuelve el token. */
    private String newUser(String email) throws Exception {
        JsonNode reg = call(post("/api/auth/register"), null, "{\"email\":\"" + email + "\",\"password\":\"clave1234\"}", 201);
        String t = call(post("/api/auth/verify"), null, "{\"email\":\"" + email + "\",\"code\":\"" + reg.get("devCode").asText() + "\"}", 200)
                .get("token").asText();
        call(put("/api/me/about"), t, "{\"name\":\"Sofi\",\"birthDate\":\"1992-08-14\",\"heightCm\":160,\"weightKg\":58}", 200);
        call(put("/api/me/preferences"), t, "{\"goals\":[\"comer\"],\"days\":[0,2,4],\"minutes\":30,\"budget\":\"medio\",\"activities\":[],"
                + "\"avoid\":[\"tacc\"],\"otherAvoid\":\"\",\"health\":[],\"level\":\"principiante\",\"equipment\":[\"nada\"]}", 200);
        call(post("/api/plan"), t, null, 200);
        return t;
    }

    @BeforeEach
    void today() {
        time.setClock(Clock.fixed(LocalDate.of(2026, 10, 21).atStartOfDay(TimeService.ZONE).plusHours(12).toInstant(), TimeService.ZONE));
    }

    @Test
    void cambiarContrasena() throws Exception {
        String t = newUser("cuenta@mail.com");
        call(put("/api/me/password"), null, "{\"current\":\"clave1234\",\"password\":\"nueva12345\"}", 401);
        call(put("/api/me/password"), t, "{\"current\":\"otra1234\",\"password\":\"nueva12345\"}", 400);
        call(put("/api/me/password"), t, "{\"current\":\"clave1234\",\"password\":\"clave1234\"}", 400);
        JsonNode weak = call(put("/api/me/password"), t, "{\"current\":\"clave1234\",\"password\":\"sinnumeros\"}", 400);
        assertThat(weak.has("fields")).isTrue();

        call(put("/api/me/password"), t, "{\"current\":\"clave1234\",\"password\":\"nueva12345\"}", 200);
        call(post("/api/auth/login"), null, "{\"email\":\"cuenta@mail.com\",\"password\":\"clave1234\"}", 401);
        call(post("/api/auth/login"), null, "{\"email\":\"cuenta@mail.com\",\"password\":\"nueva12345\"}", 200);
        call(get("/api/me"), t, null, 200); // el token de antes sigue andando
    }

    @Test
    void listaDelSuper() throws Exception {
        String t = newUser("super@mail.com");
        call(get("/api/shopping/2026-10-21"), null, null, 401);

        JsonNode list = call(get("/api/shopping/2026-10-21"), t, null, 200);
        assertThat(list.get("monday").asText()).isEqualTo("2026-10-19");
        JsonNode items = list.get("items");
        assertThat(items.size()).isGreaterThan(3);
        List<Integer> counts = new ArrayList<>();
        for (JsonNode i : items) {
            assertThat(i.get("name").asText()).doesNotContain("avena").isEqualTo(i.get("name").asText().toLowerCase());
            assertThat(i.get("checked").asBoolean()).isFalse();
            counts.add(i.get("count").asInt());
        }
        assertThat(counts).isSortedAccordingTo((a, b) -> b - a);
        int total = counts.stream().mapToInt(Integer::intValue).sum();
        assertThat(total).isGreaterThanOrEqualTo(21); // 7 días × 3 comidas, al menos un ingrediente cada una

        // mismo costo semanal que la pantalla de comida
        JsonNode day = call(get("/api/meals/2026-10-21"), t, null, 200);
        assertThat(list.get("weekCost").asInt()).isEqualTo(day.get("weekCost").asInt());
        assertThat(list.get("budgetMax").asInt()).isEqualTo(day.get("budgetMax").asInt());

        // tildar y destildar; cualquier fecha de la semana es la misma lista
        String first = items.get(0).get("name").asText();
        JsonNode on = call(put("/api/shopping/2026-10-25"), t, om.writeValueAsString(java.util.Map.of("name", first.toUpperCase(), "checked", true)), 200);
        assertThat(on.at("/items/0/checked").asBoolean()).isTrue();
        call(put("/api/shopping/2026-10-19"), t, om.writeValueAsString(java.util.Map.of("name", first, "checked", true)), 200); // repetir no duplica
        assertThat(call(get("/api/shopping/2026-10-19"), t, null, 200).at("/items/0/checked").asBoolean()).isTrue();
        assertThat(call(get("/api/shopping/2026-10-26"), t, null, 200).at("/items/0/checked").asBoolean()).isFalse(); // otra semana
        call(put("/api/shopping/2026-10-21"), t, "{\"name\":\"caviar\",\"checked\":true}", 400);
        JsonNode off = call(put("/api/shopping/2026-10-21"), t, om.writeValueAsString(java.util.Map.of("name", first, "checked", false)), 200);
        assertThat(off.at("/items/0/checked").asBoolean()).isFalse();

        // "no pude" con una comida: deja de sumar al costo y a la lista
        int before = off.get("weekCost").asInt();
        call(post("/api/meals/2026-10-21/1/skip"), t, null, 200);
        JsonNode after = call(get("/api/shopping/2026-10-21"), t, null, 200);
        assertThat(after.get("weekCost").asInt()).isLessThan(before);
        int totalAfter = 0;
        for (JsonNode i : after.get("items")) totalAfter += i.get("count").asInt();
        assertThat(totalAfter).isLessThan(total);
    }
}
