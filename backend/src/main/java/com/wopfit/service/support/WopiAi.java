package com.wopfit.service.support;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.BiFunction;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicException;
import com.anthropic.models.messages.CacheControlEphemeral;
import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageParam;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.StopReason;
import com.anthropic.models.messages.TextBlockParam;
import com.anthropic.models.messages.Tool;
import com.anthropic.models.messages.ToolResultBlockParam;
import com.anthropic.models.messages.ToolUseBlock;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * El chat de Wopi con Claude. Claude no inventa comidas, rutinas ni datos: los pide con herramientas que corre el
 * backend (las mismas respuestas de siempre, con sus tarjetas y botones) y con eso escribe la respuesta.
 */
@RequiredArgsConstructor
@Component
public class WopiAi {
    private static final Logger log = LoggerFactory.getLogger(WopiAi.class);
    /** Más vueltas de herramientas que esto es raro en una pregunta del chat: se corta y responde lo de siempre. */
    private static final int MAX_ROUNDS = 4;

    private final ClaudeClient claude;
    private final ObjectMapper json;

    /** Un mensaje anterior de la charla: del usuario o de Wopi. */
    public record Turn(boolean user, String text) {}

    private static final String PERSONA = """
            Sos Wopi, el asistente de bienestar de la app WopFit. Hablás en español rioplatense, con voseo, cálido y simple, \
            como un amigo que sabe de hábitos saludables. Ayudás con la rutina de entrenamiento, las comidas, la lista del súper, \
            el sueño, el estrés y la motivación, siempre con el plan y las preferencias de la persona.

            Cómo responder:
            - Respuestas cortas: 2 a 4 oraciones, menos de 600 caracteres. Podés marcar lo importante con **negrita**; no uses \
            títulos, listas con guiones ni otro formato.
            - Para hablar de comidas, rutinas, la lista del súper, el progreso o una molestia física, usá las herramientas: \
            te dan los datos reales del plan y le muestran a la persona tarjetas y botones. No inventes comidas, ejercicios, \
            precios ni datos que no te dieron las herramientas o el contexto.
            - Para dudas de salud, alimentación, sueño o estrés, buscá primero un consejo de expertos con la herramienta.
            - Si alguien cuenta un dolor fuerte, síntomas, una lesión o una condición médica, no diagnostiques: sugerí \
            consultar a un profesional de la salud. Con embarazo, lesiones o problemas de salud, siempre opciones suaves.
            - Si te preguntan algo que no tiene que ver con bienestar, contá en una oración con qué podés ayudar.
            - No menciones las herramientas ni cómo funcionás por dentro.""";

    public boolean enabled() {
        return claude.enabled();
    }

    /**
     * Responde la pregunta, o vacío si la IA no está, falla o se niega (entonces Wopi usa las reglas de siempre).
     * {@code runTool} corre una herramienta con su entrada y devuelve el texto para Claude.
     */
    public Optional<String> reply(String context, List<Turn> history, String question, List<Tool> tools,
                                  BiFunction<String, JsonNode, String> runTool) {
        if (!claude.enabled()) return Optional.empty();
        List<MessageParam> convo = new ArrayList<>(conversation(history));
        convo.add(MessageParam.ofUser(question));
        try {
            for (int round = 0; round < MAX_ROUNDS; round++) {
                Message res = claude.create(claude.request(8000)
                        // La persona y las herramientas no cambian: quedan en caché. El contexto de cada persona va después.
                        .systemOfTextBlockParams(List.of(
                                TextBlockParam.builder().text(PERSONA).cacheControl(CacheControlEphemeral.builder().build()).build(),
                                TextBlockParam.builder().text(context).build()))
                        .tools(tools.stream().map(com.anthropic.models.messages.ToolUnion::ofTool).toList())
                        .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.LOW).build())
                        .messages(convo)
                        .build());
                StopReason stop = res.stopReason().orElse(StopReason.END_TURN);
                if (stop.equals(StopReason.TOOL_USE)) {
                    convo.add(res.toParam());
                    convo.add(MessageParam.ofUserOfContentBlockParams(res.content().stream()
                            .flatMap(b -> b.toolUse().stream()).map(t -> result(t, runTool)).toList()));
                    continue;
                }
                if (!stop.equals(StopReason.END_TURN)) {
                    log.warn("Wopi IA terminó con {}: responde con las reglas", stop);
                    return Optional.empty();
                }
                String text = String.join("\n", res.content().stream().flatMap(b -> b.text().stream()).map(t -> t.text().trim())
                        .filter(t -> !t.isEmpty()).toList());
                return text.isEmpty() ? Optional.empty() : Optional.of(text);
            }
            log.warn("Wopi IA usó demasiadas herramientas: responde con las reglas");
        } catch (AnthropicException e) {
            log.warn("Wopi IA no respondió ({}): responde con las reglas", e.getMessage());
        }
        return Optional.empty();
    }

    /** El historial como mensajes de usuario y asistente alternados, empezando por el usuario. */
    static List<MessageParam> conversation(List<Turn> history) {
        List<Turn> merged = new ArrayList<>();
        for (Turn t : history) {
            if (merged.isEmpty() && !t.user()) continue;
            if (!merged.isEmpty() && merged.get(merged.size() - 1).user() == t.user()) {
                Turn prev = merged.remove(merged.size() - 1);
                merged.add(new Turn(t.user(), prev.text() + "\n" + t.text()));
            } else {
                merged.add(t);
            }
        }
        // La pregunta nueva es del usuario: el historial tiene que terminar en una respuesta de Wopi.
        if (!merged.isEmpty() && merged.get(merged.size() - 1).user()) merged.remove(merged.size() - 1);
        return merged.stream().map(t -> t.user() ? MessageParam.ofUser(t.text()) : MessageParam.ofAssistant(t.text())).toList();
    }

    private ContentBlockParam result(ToolUseBlock t, BiFunction<String, JsonNode, String> runTool) {
        ToolResultBlockParam.Builder r = ToolResultBlockParam.builder().toolUseId(t.id());
        try {
            JsonNode input = json.valueToTree(t._input().convert(Map.class));
            r.content(runTool.apply(t.name(), input == null ? json.createObjectNode() : input));
        } catch (RuntimeException e) {
            log.warn("Herramienta {} falló: {}", t.name(), e.getMessage());
            r.content("No se pudo obtener ese dato ahora.").isError(true);
        }
        return ContentBlockParam.ofToolResult(r.build());
    }

    /** Una herramienta con sus parámetros (JSON Schema); {@code required} son los obligatorios. */
    public static Tool tool(String name, String description, Map<String, Object> properties, List<String> required) {
        Tool.InputSchema.Properties.Builder p = Tool.InputSchema.Properties.builder();
        properties.forEach((k, v) -> p.putAdditionalProperty(k, JsonValue.from(v)));
        return Tool.builder().name(name).description(description)
                .inputSchema(Tool.InputSchema.builder().properties(p.build()).required(required)
                        .putAdditionalProperty("additionalProperties", JsonValue.from(false)).build())
                .build();
    }

    /** Para leer los bloques de texto de una respuesta (lo usa también {@link PlanAi}). */
    static String text(Message res) {
        return String.join("", res.content().stream().flatMap((ContentBlock b) -> b.text().stream()).map(t -> t.text()).toList());
    }
}
