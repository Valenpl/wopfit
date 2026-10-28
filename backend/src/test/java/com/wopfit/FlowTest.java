package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;

/** Recorre el MVP completo contra la API real (H2 en memoria). */
class FlowTest extends ApiTest {
    @Test
    void fullFlow() throws Exception {
        LocalDate mon = LocalDate.of(2026, 10, 19); // lunes
        setToday(mon);

        call(get("/api/health"), null, null, 200);
        call(get("/api/me"), null, null, 401);
        call(post("/api/auth/register"), null, "{\"email\":\"mal\",\"password\":\"corta\"}", 400);

        JsonNode reg = call(post("/api/auth/register"), null, "{\"email\":\"Lucia@mail.com\",\"password\":\"clave1234\"}", 201);
        String code = reg.get("devCode").asText();
        call(post("/api/auth/login"), null, "{\"email\":\"lucia@mail.com\",\"password\":\"clave1234\"}", 403);
        call(post("/api/auth/verify"), null, "{\"email\":\"lucia@mail.com\",\"code\":\"000000\"}".replace("000000", code.equals("000000") ? "111111" : "000000"), 400);
        JsonNode auth = call(post("/api/auth/verify"), null, "{\"email\":\"lucia@mail.com\",\"code\":\"" + code + "\"}", 200);
        String t = auth.get("token").asText();
        call(post("/api/auth/login"), null, "{\"email\":\"lucia@mail.com\",\"password\":\"otra12345\"}", 401);
        t = call(post("/api/auth/login"), null, "{\"email\":\"lucia@mail.com\",\"password\":\"clave1234\"}", 200).get("token").asText();

        call(put("/api/me/about"), t, "{\"name\":\"Lucía\",\"birthDate\":\"1990-05-02\",\"heightCm\":165,\"weightKg\":70}", 200);
        call(post("/api/plan"), t, null, 400); // sin preferencias
        String prefs = "{\"goals\":[\"mover\",\"comer\"],\"days\":[0,2,4],\"minutes\":30,\"budget\":\"bajo\",\"activities\":[\"caminar\"],"
                + "\"avoid\":[\"tacc\"],\"otherAvoid\":\"\",\"health\":[\"diabetes\"],\"level\":\"principiante\",\"equipment\":[\"nada\"]}";
        call(put("/api/me/preferences"), t, prefs, 200);
        JsonNode plan = call(post("/api/plan"), t, null, 200);
        assertThat(plan.at("/plan/healthNotes").size()).isGreaterThan(0);

        JsonNode today = call(get("/api/workouts/today"), t, null, 200);
        long sid = today.at("/session/id").asLong();
        assertThat(today.at("/session/content/blocks").size()).isEqualTo(3);
        assertThat(today.get("next").size()).isEqualTo(3);

        JsonNode week = call(get("/api/workouts/week"), t, null, 200);
        assertThat(week.get("total").asInt()).isEqualTo(3);

        // "No pude" hoy por tiempo → propone versión exprés
        JsonNode rep = call(post("/api/workouts/" + sid + "/report"), t, "{\"reason\":\"tiempo\"}", 200);
        assertThat(rep.get("action").asText()).isEqualTo("PROPOSAL");
        assertThat(rep.at("/proposal/kind").asText()).isEqualTo("express");
        JsonNode acc = call(post("/api/workouts/" + sid + "/accept-alternative"), t, "{\"kind\":\"express\"}", 200);
        assertThat(acc.get("movedTo").asText()).isEqualTo("2026-10-20"); // martes libre
        call(post("/api/workouts/" + sid + "/done"), t, "{\"feel\":3}", 200);

        // comidas: sin TACC no puede aparecer avena
        JsonNode meals = call(get("/api/meals/2026-10-19"), t, null, 200);
        assertThat(meals.get("meals").size()).isEqualTo(3);
        for (JsonNode m : meals.get("meals")) assertThat(m.get("ingredients").asText().toLowerCase()).doesNotContain("avena");
        call(post("/api/meals/2026-10-19/0/eaten"), t, null, 200);
        JsonNode prop = call(post("/api/meals/2026-10-19/1/report"), t, "{\"reason\":\"tiempo\"}", 200);
        String alt = prop.at("/alternative/name").asText();
        JsonNode after = call(post("/api/meals/2026-10-19/1/accept"), t, om.writeValueAsString(java.util.Map.of("name", alt)), 200);
        assertThat(after.at("/meals/1/name").asText()).isEqualTo(alt);
        String before = after.at("/meals/2/name").asText();
        JsonNode swapped = call(post("/api/meals/2026-10-19/2/swap"), t, null, 200);
        assertThat(swapped.at("/meals/2/name").asText()).isNotEqualTo(before);

        // hábitos y metas
        call(put("/api/habits/2026-10-19"), t, "{\"date\":\"2026-10-19\",\"water\":true,\"walk\":true,\"sleep\":false}", 200);
        call(put("/api/habits/2026-10-25"), t, "{\"date\":\"2026-10-25\",\"water\":true,\"walk\":true,\"sleep\":false}", 400);
        JsonNode goal = call(post("/api/goals"), t, "{\"objective\":\"mover\",\"what\":\"Caminar 20 min\",\"timesPerWeek\":1,\"weeks\":1}", 201);
        JsonNode chk = call(post("/api/goals/" + goal.get("id").asLong() + "/check"), t, null, 200);
        assertThat(chk.get("done").asBoolean()).isTrue();

        JsonNode prog = call(get("/api/progress"), t, null, 200);
        assertThat(prog.get("sessionsDone").asInt()).isEqualTo(1);
        assertThat(prog.get("habitsToday").asInt()).isEqualTo(2);
        JsonNode mover = prog.get("objectives").get(0);
        assertThat(mover.get("code").asText()).isEqualTo("mover");
        assertThat(mover.get("percent").asInt()).isGreaterThan(0);

        // la semana siguiente: se saltean dos sesiones → sugiere alivianar
        setToday(mon.plusDays(7));
        JsonNode w1 = call(get("/api/workouts/week?start=2026-10-19"), t, null, 200);
        for (JsonNode d : w1.get("days")) {
            if (d.get("session").isNull()) continue;
            String st = d.at("/session/status").asText();
            if (st.equals("MISSED")) {
                JsonNode r = call(post("/api/workouts/" + d.at("/session/id").asLong() + "/report"), t, "{\"reason\":\"cansada\"}", 200);
                assertThat(r.get("action").asText()).isEqualTo("MOVED");
            }
        }
        prog = call(get("/api/progress"), t, null, 200);
        assertThat(prog.at("/suggestion/type").asText()).isEqualTo("LIGHTEN");
        JsonNode light = call(post("/api/adjust/lighten"), t, null, 200);
        assertThat(light.get("minutes").asInt()).isEqualTo(20);
        prog = call(get("/api/progress"), t, null, 200);
        assertThat(prog.get("suggestion").isNull()).isTrue();

        // cambiar preferencias → pendiente → actualizar plan con diff
        call(put("/api/me/preferences"), t, prefs.replace("[0,2,4]", "[1,3]"), 200);
        JsonNode me = call(get("/api/me"), t, null, 200);
        assertThat(me.at("/preferences/pendingChanges").size()).isEqualTo(1);
        JsonNode upd = call(post("/api/plan"), t, null, 200);
        assertThat(upd.get("changes").size()).isGreaterThan(0);
        JsonNode w2 = call(get("/api/workouts/week"), t, null, 200);
        for (JsonNode d : w2.get("days")) {
            if (d.get("session").isNull() || !d.at("/session/movedFrom").isNull()) continue;
            int dow = LocalDate.parse(d.get("date").asText()).getDayOfWeek().getValue() - 1;
            if (!d.at("/session/status").asText().equals("DONE")) assertThat(dow).isIn(1, 3);
        }

        JsonNode hist = call(get("/api/history"), t, null, 200);
        assertThat(hist.get("weeks").size()).isEqualTo(2);
        assertThat(hist.get("difficulties").size()).isGreaterThanOrEqualTo(3);
        assertThat(hist.get("mostCommon").asText()).isNotBlank();

        call(get("/api/catalog"), null, null, 200);
    }
}
