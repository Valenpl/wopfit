package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;

/** Preguntale a Wopi: respuestas con los datos de la persona y cupo de 3 (Gratuito) o 20 (Premium) por mes. */
class WopiTest extends ApiTest {
    private JsonNode ask(String t, String q, int expected) throws Exception {
        return call(post("/api/v1/wopi"), t, om.writeValueAsString(Map.of("text", q)), expected);
    }

    private static List<String> values(JsonNode actions) {
        List<String> out = new ArrayList<>();
        for (JsonNode a : actions) out.add(a.get("kind").asText() + " " + a.get("value").asText());
        return out;
    }

    @Test
    void cupoGratisYRespuestas() throws Exception {
        String t = newUser("wopi@mail.com"); // sin TACC, presupuesto medio, entrena hoy (miércoles)
        call(get("/api/v1/wopi"), null, null, 401);
        JsonNode chat = call(get("/api/v1/wopi"), t, null, 200);
        assertThat(chat.get("left").asInt()).isEqualTo(3);
        assertThat(chat.get("limit").asInt()).isEqualTo(3);
        assertThat(chat.get("messages").size()).isZero();
        assertThat(call(get("/api/v1/me"), t, null, 200).at("/subscription/wopiLeft").asInt()).isEqualTo(3);
        ask(t, "   ", 400);
        ask(t, "x".repeat(301), 400);

        // comida con precio: respeta sin TACC y el tope
        JsonNode r = ask(t, "¿Qué almuerzo con $2.000?", 200);
        assertThat(r.get("left").asInt()).isEqualTo(2);
        assertThat(r.at("/question/text").asText()).isEqualTo("¿Qué almuerzo con $2.000?");
        JsonNode reply = r.get("reply");
        assertThat(reply.get("role").asText()).isEqualTo("wopi");
        assertThat(reply.get("text").asText()).contains("almuerzo").contains("sin tacc").contains("por menos de $2.000");
        assertThat(reply.get("cards").size()).isBetween(1, 2);
        List<String> first = new ArrayList<>();
        for (JsonNode c : reply.get("cards")) {
            assertThat(c.at("/action/kind").asText()).isEqualTo("meal");
            assertThat(c.at("/action/value").asText()).startsWith("1|");
            assertThat(c.get("subtitle").asText().toLowerCase()).doesNotContain("avena");
            first.add(c.get("title").asText());
        }

        // "otras opciones" sigue con el mismo tema
        JsonNode more = ask(t, "Dame otras opciones", 200).get("reply");
        assertThat(more.get("text").asText()).contains("almuerzo");
        if (!more.get("text").asText().startsWith("Ya te mostré")) assertThat(more.at("/cards/0/title").asText()).isNotIn(first);

        // poco tiempo: versión corta que se puede usar en lugar de la rutina de hoy
        JsonNode quick = ask(t, "Tengo 10 minutos, ¿qué hago?", 200);
        assertThat(quick.get("left").asInt()).isZero();
        assertThat(quick.at("/reply/text").asText()).startsWith("¡Con poco tiempo también suma! Te propongo: **");
        assertThat(quick.at("/reply/more").asBoolean()).isTrue();
        assertThat(values(quick.at("/reply/actions")).get(0)).matches("alt \\d+\\|express");

        JsonNode none = ask(t, "hola", 409);
        assertThat(none.get("error").asText()).contains("3 consultas gratis");
        JsonNode msgs = call(get("/api/v1/wopi"), t, null, 200).get("messages");
        assertThat(msgs.size()).isEqualTo(6);
        for (int i = 0; i < 6; i++) assertThat(msgs.get(i).get("role").asText()).isEqualTo(i % 2 == 0 ? "user" : "wopi");

        // con Premium son 20 por mes (ya usó 3)
        call(post("/api/v1/subscription"), t, "{\"period\":\"mensual\"}", 200);
        assertThat(call(get("/api/v1/wopi"), t, null, 200).get("left").asInt()).isEqualTo(17);

        JsonNode pain = ask(t, "Me duele la rodilla", 200).get("reply");
        assertThat(pain.get("text").asText()).contains("consultá con un profesional");
        assertThat(values(pain.get("actions"))).contains("go /profesionales?tipo=entre");

        JsonNode list = ask(t, "Armame la lista del súper", 200).get("reply");
        assertThat(list.get("text").asText()).startsWith("Para esta semana necesitás principalmente: **");
        assertThat(values(list.get("actions"))).contains("go /comida?tab=super", "go /ofertas");

        JsonNode routine = ask(t, "¿Cuál es mi rutina de hoy?", 200).get("reply");
        assertThat(routine.get("text").asText()).startsWith("Tu rutina de hoy es **");
        assertThat(values(routine.get("actions")).get(0)).matches("go /entreno/\\d+");

        assertThat(ask(t, "Hoy no tengo ganas", 200).at("/reply/text").asText()).contains("Esta semana ya hiciste");
        assertThat(ask(t, "No puedo dormir", 200).at("/reply/text").asText()).contains("4-7-8");
        assertThat(ask(t, "hola", 200).at("/reply/text").asText()).startsWith("Puedo ayudarte con tu rutina");

        // el mes que viene se renueva
        setToday(TODAY.plusMonths(1).withDayOfMonth(1));
        assertThat(call(get("/api/v1/wopi"), t, null, 200).get("left").asInt()).isEqualTo(20);
    }
}
