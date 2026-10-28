package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;

/** Ayuda profesional: agenda, reservas con Premium (2 por mes), turnos ocupados y cancelación. Hoy = miércoles 21/10/2026. */
class ProsTest extends ApiTest {
    private String body(String date, String t, String mode) throws Exception {
        return om.writeValueAsString(Map.of("date", date, "time", t, "mode", mode));
    }

    /** El primer turno libre (o el primero ocupado) de la agenda: [fecha, hora]. */
    private static String[] slot(JsonNode detail, boolean free) {
        for (JsonNode d : detail.get("days")) {
            for (JsonNode s : d.get("slots")) {
                if (s.get("free").asBoolean() == free) return new String[] {d.get("date").asText(), s.get("time").asText()};
            }
        }
        throw new AssertionError("no hay turnos " + (free ? "libres" : "ocupados"));
    }

    @Test
    void reservasConPremium() throws Exception {
        String free = newUser("pros-libre@mail.com");
        JsonNode list = call(get("/api/v1/professionals"), free, null, 200);
        assertThat(list.get("premium").asBoolean()).isFalse();
        assertThat(list.get("left").asInt()).isZero();
        assertThat(list.get("limit").asInt()).isEqualTo(2);
        assertThat(list.get("pros").size()).isEqualTo(6);
        long nutris = 0;
        for (JsonNode p : list.get("pros")) if (p.get("kind").asText().equals("nutri")) nutris++;
        assertThat(nutris).isEqualTo(3);
        long proId = list.at("/pros/0/id").asLong();

        JsonNode detail = call(get("/api/v1/professionals/" + proId), free, null, 200);
        assertThat(detail.get("days").size()).isEqualTo(4);
        assertThat(detail.get("days").findValuesAsText("date")).containsExactly("2026-10-22", "2026-10-23", "2026-10-24", "2026-10-26"); // sin domingo
        assertThat(detail.at("/days/0/slots").size()).isEqualTo(5);
        assertThat(om.convertValue(detail.get("modes"), List.class)).containsExactly("Videollamada", "Chat");
        String[] first = slot(detail, true);
        assertThat(detail.at("/pro/nextDate").asText() + " " + detail.at("/pro/nextTime").asText()).isEqualTo(first[0] + " " + first[1]);
        call(post("/api/v1/professionals/" + proId + "/consultations"), free, body(first[0], first[1], "Chat"), 403);
        call(get("/api/v1/professionals/9999"), free, null, 404);

        String prem = newUser("pros-premium@mail.com");
        call(post("/api/v1/users/me/subscription"), prem, "{\"period\":\"mensual\"}", 200);
        assertThat(call(get("/api/v1/users/me"), prem, null, 200).at("/subscription/consultsLeft").asInt()).isEqualTo(2);

        // validaciones
        call(post("/api/v1/professionals/" + proId + "/consultations"), prem, body(first[0], first[1], "Teléfono"), 400);
        call(post("/api/v1/professionals/" + proId + "/consultations"), prem, body("2026-10-21", "10:00", "Chat"), 400); // hoy no hay turnos
        call(post("/api/v1/professionals/" + proId + "/consultations"), prem, body("2026-10-25", "10:00", "Chat"), 400); // domingo
        call(post("/api/v1/professionals/" + proId + "/consultations"), prem, body(first[0], "11:00", "Chat"), 400);
        String[] busy = slot(detail, false);
        call(post("/api/v1/professionals/" + proId + "/consultations"), prem, body(busy[0], busy[1], "Chat"), 409);

        // reservar: baja el cupo y el turno queda ocupado para todos
        JsonNode booked = call(post("/api/v1/professionals/" + proId + "/consultations"), prem, body(first[0], first[1], "Videollamada"), 201);
        assertThat(booked.get("left").asInt()).isEqualTo(1);
        assertThat(booked.at("/consult/proName").asText()).isNotBlank();
        JsonNode after = call(get("/api/v1/professionals/" + proId), free, null, 200);
        assertThat(slot(after, true)).isNotEqualTo(first);
        String other = newUser("pros-otro@mail.com");
        call(post("/api/v1/users/me/subscription"), other, "{\"period\":\"mensual\"}", 200);
        JsonNode taken = call(post("/api/v1/professionals/" + proId + "/consultations"), other, body(first[0], first[1], "Chat"), 409);
        assertThat(taken.get("error").asText()).contains("ocupado");

        // segunda consulta con otro profesional y después ya no quedan
        long pro2 = list.at("/pros/3/id").asLong();
        String[] s2 = slot(call(get("/api/v1/professionals/" + pro2), prem, null, 200), true);
        assertThat(call(post("/api/v1/professionals/" + pro2 + "/consultations"), prem, body(s2[0], s2[1], "Chat"), 201).get("left").asInt()).isZero();
        String[] s3 = slot(call(get("/api/v1/professionals/" + pro2), prem, null, 200), true);
        JsonNode none = call(post("/api/v1/professionals/" + pro2 + "/consultations"), prem, body(s3[0], s3[1], "Chat"), 409);
        assertThat(none.get("error").asText()).isEqualTo("Ya usaste tus 2 consultas de este mes");

        JsonNode mine = call(get("/api/v1/professionals"), prem, null, 200).get("mine");
        assertThat(mine.size()).isEqualTo(2);
        List<String> when = List.of(mine.at("/0/date").asText() + mine.at("/0/time").asText(), mine.at("/1/date").asText() + mine.at("/1/time").asText());
        assertThat(when).isSorted();

        // cancelar devuelve el cupo; no se puede cancelar la de otro
        long cid = booked.at("/consult/id").asLong();
        call(delete("/api/v1/consultations/" + cid), other, null, 404);
        assertThat(call(delete("/api/v1/consultations/" + cid), prem, null, 200).get("left").asInt()).isEqualTo(1);
        call(delete("/api/v1/consultations/" + cid), prem, null, 404);
        assertThat(call(get("/api/v1/professionals"), prem, null, 200).get("left").asInt()).isEqualTo(1);

        // el mes que viene vuelven a ser 2
        setToday(TODAY.plusDays(12)); // 2 de noviembre
        JsonNode nov = call(get("/api/v1/professionals"), prem, null, 200);
        assertThat(nov.get("left").asInt()).isEqualTo(2);
        assertThat(nov.get("mine").size()).isZero(); // las de octubre ya pasaron
    }
}
