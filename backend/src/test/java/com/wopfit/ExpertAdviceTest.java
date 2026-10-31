package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;

/** Consejos de expertos en el plan y en la rutina, según la salud de la persona. */
class ExpertAdviceTest extends ApiTest {
    private static List<String> sources(JsonNode tips) {
        List<String> out = new ArrayList<>();
        for (JsonNode tip : tips) out.add(tip.get("source").asText());
        return out;
    }

    @Test
    void sinCondicionesSoloLoGeneral() throws Exception {
        String t = newUser("general@mail.com");
        JsonNode plan = call(get("/api/v1/users/me/plan"), t, null, 200);
        assertThat(plan.get("tips").size()).isEqualTo(2); // OMS (actividad) y celiaquía, porque es sin TACC
        assertThat(sources(plan.get("tips"))).containsExactly("Ministerio de Agricultura, Guía para la población celíaca",
                "OMS, Directrices sobre actividad física y hábitos sedentarios (2020)");
        assertThat(plan.at("/tips/1/text").asText()).contains("**150 y 300 minutos por semana**");
        assertThat(plan.at("/tips/1/url").asText()).startsWith("https://");
    }

    @Test
    void embarazoYDiabetes() throws Exception {
        String t = newUser("embarazo@mail.com");
        call(put("/api/v1/users/me/preferences"), t, "{\"goals\":[\"mover\"],\"days\":[0,2,4],\"minutes\":30,\"budget\":\"medio\",\"activities\":[],"
                + "\"avoid\":[],\"otherAvoid\":\"\",\"health\":[\"embarazo\",\"diabetes\"],\"level\":\"principiante\",\"equipment\":[\"nada\"]}", 200);
        JsonNode plan = call(post("/api/v1/users/me/plan"), t, null, 200).get("plan");
        assertThat(plan.at("/tips/0/text").asText()).contains("después del primer trimestre, los ejercicios boca arriba");
        assertThat(sources(plan.get("tips"))).containsExactly("OMS, Directrices sobre actividad física y hábitos sedentarios (2020)",
                "Asociación Americana de Diabetes, Actividad física y diabetes (2016)", "OMS, Directrices sobre actividad física y hábitos sedentarios (2020)");

        // La rutina de hoy no tiene ejercicios boca arriba y trae los consejos para ella.
        JsonNode s = call(get("/api/v1/workouts/today"), t, null, 200).get("session");
        assertThat(s.at("/content/blocks/2/items/0/name").asText()).isEqualTo("Patada de glúteo en cuatro apoyos");
        assertThat(s.get("tips").size()).isEqualTo(3);
        assertThat(s.at("/tips/2/text").asText()).startsWith("Si recién arrancás");
        // En la semana no viajan (no tienen el contenido de la rutina).
        JsonNode week = call(get("/api/v1/workouts/week"), t, null, 200);
        assertThat(week.at("/days/2/session/id").asLong()).isEqualTo(s.get("id").asLong());
        assertThat(week.at("/days/2/session/tips").size()).isZero();
    }
}
