package com.wopfit.service.support;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicException;
import com.anthropic.models.messages.JsonOutputFormat;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.StopReason;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wopfit.entity.Preferences;

import lombok.RequiredArgsConstructor;

/**
 * Wopi personaliza el plan con Claude: elige qué rutina del catálogo va cada día y explica por qué, con consejos.
 * No inventa ejercicios: el contenido sale de {@link WorkoutCatalog}, que ya adapta todo a la salud de la persona.
 * Lo que devuelve se revisa acá; si algo no cierra o la IA no está, el plan queda como siempre.
 */
@RequiredArgsConstructor
@Component
public class PlanAi {
    private static final Logger log = LoggerFactory.getLogger(PlanAi.class);
    private static final String[] DAYS = {"lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"};
    static final int MAX_SUMMARY = 600, MAX_TIP = 200, MAX_TIPS = 3;

    private final ClaudeClient claude;
    private final ObjectMapper json;

    /** Lo que propuso Wopi: día de la semana (0 = lunes) → rutina del catálogo, el porqué y hasta 3 consejos. */
    public record Advice(Map<Integer, Integer> dayTemplates, String summary, List<String> tips) {}

    /** Lo que pide la salida estructurada (lo mismo que {@link #SCHEMA}). */
    record Raw(List<Day> days, String summary, List<String> tips) {}
    record Day(int day, int template) {}

    private static final Map<String, Object> SCHEMA = Map.of(
            "type", "object", "additionalProperties", false, "required", List.of("days", "summary", "tips"),
            "properties", Map.of(
                    "days", Map.of("type", "array", "description", "Una entrada por cada día de entrenamiento elegido",
                            "items", Map.of("type", "object", "additionalProperties", false, "required", List.of("day", "template"),
                                    "properties", Map.of(
                                            "day", Map.of("type", "integer", "description", "Día de la semana: 0 = lunes ... 6 = domingo"),
                                            "template", Map.of("type", "integer", "description", "Número de rutina del catálogo")))),
                    "summary", Map.of("type", "string", "description", "Por qué el plan es así, en 2 o 3 oraciones, hablándole de vos"),
                    "tips", Map.of("type", "array", "items", Map.of("type", "string"), "description", "3 consejos cortos y concretos para esta persona")));

    private static final String SYSTEM = """
            Sos Wopi, el asistente de WopFit. Armás planes de entrenamiento simples y seguros para personas que quieren \
            sumar hábitos saludables. Escribís en español rioplatense, con voseo, cálido y concreto.
            Elegís, para cada día de entrenamiento de la persona, una de las rutinas del catálogo que te pasan (por número), \
            buscando variedad y lo que más le sirve a sus objetivos. No inventes ejercicios ni rutinas nuevas.
            En el resumen explicá en 2 o 3 oraciones por qué el plan es así (sin repetir la lista de días). \
            En los consejos, 3 ideas cortas (menos de 150 caracteres cada una) para sostenerlo, según sus objetivos y su vida.
            Si hay embarazo, lesiones u otra condición de salud, sé prudente y sugerí consultar a un profesional; no diagnostiques.""";

    public Optional<Advice> personalize(Preferences p, String firstName, String levelName) {
        if (!claude.enabled()) return Optional.empty();
        try {
            Message res = claude.create(claude.request(8000)
                    .system(SYSTEM)
                    .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.LOW)
                            .format(JsonOutputFormat.builder().schema(schema()).build()).build())
                    .addUserMessage(describe(p, firstName, levelName))
                    .build());
            if (!res.stopReason().orElse(StopReason.END_TURN).equals(StopReason.END_TURN)) {
                log.warn("Wopi IA no armó el plan ({}): queda el de siempre", res.stopReason().orElse(null));
                return Optional.empty();
            }
            return validate(json.readValue(WopiAi.text(res), Raw.class), p.getDays());
        } catch (AnthropicException | JsonProcessingException e) {
            log.warn("Wopi IA no armó el plan ({}): queda el de siempre", e.getMessage());
            return Optional.empty();
        }
    }

    private static JsonOutputFormat.Schema schema() {
        JsonOutputFormat.Schema.Builder b = JsonOutputFormat.Schema.builder();
        SCHEMA.forEach((k, v) -> b.putAdditionalProperty(k, JsonValue.from(v)));
        return b.build();
    }

    /** Lo que sabe Wopi de la persona para armar el plan. Sin email ni datos que no hacen falta. */
    static String describe(Preferences p, String firstName, String levelName) {
        StringBuilder s = new StringBuilder();
        if (!firstName.isBlank()) s.append("Nombre: ").append(firstName).append('\n');
        s.append("Objetivos: ").append(names(p.getGoals(), Catalog.GOALS)).append('\n')
                .append("Días para entrenar: ").append(p.getDays().stream().sorted().map(d -> d + " (" + DAYS[d] + ")").collect(Collectors.joining(", "))).append('\n')
                .append("Minutos por sesión: ").append(p.getMinutes()).append('\n')
                .append("Nivel: ").append(levelName).append('\n')
                .append("Actividades que le gustan: ").append(names(p.getActivities(), Catalog.ACTIVITIES)).append('\n')
                .append("Equipamiento: ").append(names(p.getEquipment(), Catalog.EQUIPMENT)).append('\n')
                .append("Salud: ").append(p.getHealth().isEmpty() ? "nada para tener en cuenta" : names(p.getHealth(), Catalog.HEALTH)).append("\n\n")
                .append("Catálogo de rutinas (cada una se adapta sola a su nivel, sus minutos, su equipamiento y su salud):\n");
        for (int i = 0; i < WorkoutCatalog.TEMPLATES.length; i++) {
            s.append(i).append(": ").append(WorkoutCatalog.TEMPLATES[i][0]).append(". ").append(WorkoutCatalog.TEMPLATES[i][1]).append('\n');
        }
        return s.toString();
    }

    private static String names(Set<String> keys, Map<String, String> catalog) {
        return keys.isEmpty() ? "no dijo" : keys.stream().map(k -> catalog.getOrDefault(k, k)).collect(Collectors.joining(", "));
    }

    /** Solo días de la persona y rutinas que existen; textos cortos. Si no queda nada útil, no hay propuesta. */
    static Optional<Advice> validate(Raw raw, Set<Integer> days) {
        if (raw == null) return Optional.empty();
        Map<Integer, Integer> dt = new LinkedHashMap<>();
        if (raw.days() != null) {
            for (Day d : raw.days()) {
                if (d != null && days.contains(d.day()) && d.template() >= 0 && d.template() < WorkoutCatalog.TEMPLATES.length) dt.putIfAbsent(d.day(), d.template());
            }
        }
        String summary = raw.summary() == null ? "" : cut(raw.summary().trim(), MAX_SUMMARY);
        List<String> tips = new ArrayList<>();
        if (raw.tips() != null) {
            raw.tips().stream().filter(t -> t != null && !t.isBlank()).limit(MAX_TIPS).forEach(t -> tips.add(cut(t.trim(), MAX_TIP)));
        }
        if (dt.isEmpty() && summary.isEmpty()) return Optional.empty();
        return Optional.of(new Advice(dt, summary.isEmpty() ? null : summary, tips));
    }

    private static String cut(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1).trim() + "…";
    }
}
