package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.mock.mockito.MockBean;

import com.anthropic.core.ObjectMappers;
import com.anthropic.errors.AnthropicException;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.fasterxml.jackson.databind.JsonNode;
import com.wopfit.service.support.ClaudeClient;

/** Wopi con IA, con Claude simulado: usa las herramientas, arma tarjetas, y si algo falla responden las reglas. */
class WopiAiTest extends ApiTest {
    @MockBean ClaudeClient claude;

    @BeforeEach
    void claudeApagado() {
        // Mientras se crea el usuario la IA está apagada (plan de siempre); cada test la prende cuando la necesita.
        when(claude.enabled()).thenReturn(false);
        when(claude.request(anyLong())).thenAnswer(i -> MessageCreateParams.builder().model("claude-opus-5-5").maxTokens((long) i.getArgument(0)));
    }

    /** Una respuesta de la API, como llega en JSON. */
    private static Message message(String stop, String content) throws Exception {
        return ObjectMappers.jsonMapper().readValue("""
                {"id":"msg_x","type":"message","role":"assistant","model":"claude-opus-5-5","stop_reason":"%s","stop_sequence":null,
                 "usage":{"input_tokens":10,"output_tokens":5},"content":%s}""".formatted(stop, content), Message.class);
    }

    private JsonNode ask(String t, String q) throws Exception {
        return call(post("/api/v1/wopi/messages"), t, om.writeValueAsString(Map.of("text", q)), 200);
    }

    @Test
    void elChatUsaLasHerramientasYMuestraTarjetas() throws Exception {
        String t = newUser("ia-chat@mail.com");
        when(claude.enabled()).thenReturn(true);
        when(claude.create(any())).thenReturn(
                message("tool_use", """
                        [{"type":"text","text":"Busco ideas."},
                         {"type":"tool_use","id":"toolu_1","name":"ideas_de_comida","input":{"comida":"cena","precio_maximo":3000}}]"""),
                message("end_turn", """
                        [{"type":"text","text":"¡Dale! Te dejo dos cenas **sin TACC** que entran en tu presupuesto."}]"""));

        assertThat(call(get("/api/v1/wopi/messages"), t, null, 200).get("ai").asBoolean()).isTrue();
        JsonNode r = ask(t, "¿Qué ceno hoy con 3000 pesos?");
        JsonNode reply = r.get("reply");
        assertThat(reply.get("text").asText()).isEqualTo("¡Dale! Te dejo dos cenas **sin TACC** que entran en tu presupuesto.");
        assertThat(reply.get("cards").size()).isEqualTo(2); // las comidas salen del catálogo, no de la IA
        assertThat(reply.at("/cards/0/action/kind").asText()).isEqualTo("meal");
        assertThat(reply.at("/cards/0/action/value").asText()).startsWith("2|");
        assertThat(r.get("left").asInt()).isEqualTo(2); // la consulta cuenta igual que siempre

        // La segunda vuelta lleva el resultado de la herramienta, y Claude tiene el contexto de la persona.
        ArgumentCaptor<MessageCreateParams> sent = ArgumentCaptor.forClass(MessageCreateParams.class);
        verify(claude, times(2)).create(sent.capture());
        String second = ObjectMappers.jsonMapper().writeValueAsString(sent.getAllValues().get(1)._body());
        assertThat(second).contains("tool_result").contains("toolu_1").contains("Te propongo estas ideas de cena");
        assertThat(second).contains("Se llama Sofi").contains("sin tacc").doesNotContain("ia-chat@mail.com");
        assertThat(second).contains("ideas_de_comida").contains("consejo_de_expertos");
    }

    @Test
    void siLaIaFallaRespondenLasReglas() throws Exception {
        String t = newUser("ia-falla@mail.com");
        when(claude.enabled()).thenReturn(true);
        when(claude.create(any())).thenThrow(new AnthropicException("sin conexión"));
        JsonNode reply = ask(t, "¿Qué almuerzo con $2.000?").get("reply");
        assertThat(reply.get("text").asText()).contains("almuerzo").contains("por menos de $2.000");
        assertThat(reply.get("cards").size()).isGreaterThan(0);

        // Si se niega a responder, también.
        doReturn(message("refusal", "[]")).when(claude).create(any());
        assertThat(ask(t, "¿Cuál es mi rutina de hoy?").at("/reply/text").asText()).startsWith("Tu rutina de hoy es");
    }

    @Test
    void elPlanLoPersonalizaWopi() throws Exception {
        String t = newUser("ia-plan@mail.com"); // entrena lunes, miércoles y viernes
        when(claude.enabled()).thenReturn(true);
        // Una rutina que no existe (7) y un día que no entrena (6) se descartan; sobra un consejo.
        when(claude.create(any())).thenReturn(message("end_turn", """
                [{"type":"text","text":"{\\"days\\":[{\\"day\\":0,\\"template\\":2},{\\"day\\":2,\\"template\\":2},{\\"day\\":4,\\"template\\":7},{\\"day\\":6,\\"template\\":1}],\\"summary\\":\\"Como querés comer mejor y arrancás de cero, empezamos con fuerza suave.\\",\\"tips\\":[\\"Dejá la ropa lista la noche anterior.\\",\\"Tomá agua antes de entrenar.\\",\\"Sumá una caminata los fines de semana.\\",\\"Sobra.\\"]}"}]"""));
        JsonNode plan = call(post("/api/v1/users/me/plan"), t, null, 200).get("plan");
        assertThat(plan.get("aiSummary").asText()).startsWith("Como querés comer mejor");
        assertThat(plan.get("aiTips").size()).isEqualTo(3);

        JsonNode week = call(get("/api/v1/workouts/week"), t, null, 200); // semana del lunes 19/10; hoy es miércoles
        assertThat(week.at("/days/2/session/template").asInt()).isEqualTo(2); // miércoles: la que eligió Wopi
        JsonNode next = call(get("/api/v1/workouts/week?start=2026-10-26"), t, null, 200);
        assertThat(next.at("/days/0/session/template").asInt()).isEqualTo(2); // lunes: la que eligió Wopi

        // Si la IA falla al actualizar, el plan vuelve a rotar las rutinas como siempre y no queda el resumen viejo.
        doThrow(new AnthropicException("sin conexión")).when(claude).create(any());
        plan = call(post("/api/v1/users/me/plan"), t, null, 200).get("plan");
        assertThat(plan.get("aiSummary").isNull()).isTrue();
        assertThat(plan.get("aiTips").size()).isZero();
    }

    @Test
    void sinKeyWopiEsElDeSiempre() throws Exception {
        String t = newUser("ia-apagada@mail.com");
        assertThat(call(get("/api/v1/wopi/messages"), t, null, 200).get("ai").asBoolean()).isFalse();
        assertThat(ask(t, "¿Cuál es mi rutina de hoy?").at("/reply/text").asText()).startsWith("Tu rutina de hoy es");
        assertThat(List.of(call(get("/api/v1/users/me/plan"), t, null, 200).get("aiTips").size())).containsExactly(0);
        verify(claude, times(0)).create(any());
    }
}
