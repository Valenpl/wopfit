package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.time.Clock;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.wopfit.service.TimeService;

/** Lugares cercanos (solo Premium) y cupones de demostración. */
class PlacesOffersTest extends ApiTest {
    private void setTime(int hour, int minute) {
        time.setClock(Clock.fixed(TODAY.atTime(hour, minute).atZone(TimeService.ZONE).toInstant(), TimeService.ZONE));
    }

    private static Map<String, JsonNode> byAddress(JsonNode places) {
        Map<String, JsonNode> m = new HashMap<>();
        for (JsonNode p : places) m.put(p.get("address").asText(), p);
        return m;
    }

    @Test
    void lugaresSoloConPremium() throws Exception {
        String t = newUser("lugares@mail.com");
        call(get("/api/v1/places"), null, null, 401);
        JsonNode denied = call(get("/api/v1/places"), t, null, 403);
        assertThat(denied.get("error").asText()).contains("Premium");

        call(post("/api/v1/users/me/subscription"), t, "{\"period\":\"mensual\"}", 201);
        JsonNode places = call(get("/api/v1/places"), t, null, 200);
        assertThat(places.size()).isEqualTo(45);
        Set<String> cats = Set.of("super", "verdu", "diet", "gym", "parque");
        for (JsonNode p : places) {
            assertThat(cats).contains(p.get("category").asText());
            assertThat(p.get("lat").asDouble()).isBetween(-34.70, -34.48); // AMBA
            assertThat(p.get("lng").asDouble()).isBetween(-58.55, -58.35);
            if (p.get("category").asText().equals("parque")) {
                assertThat(p.get("brand").isNull()).isTrue();
                assertThat(p.get("status").asText()).isEqualTo("Abierto siempre");
                assertThat(p.get("offers").asInt()).isZero();
            }
        }

        // horarios: al mediodía los súper están abiertos; a las 22:30 depende de cada uno
        Map<String, JsonNode> noon = byAddress(places);
        assertThat(noon.get("Av. Belgrano 1100").get("openNow").asBoolean()).isTrue();
        assertThat(noon.get("Av. Belgrano 1100").get("status").asText()).isEqualTo("Abierto hasta las 21:00");
        assertThat(noon.get("Av. Belgrano 1100").get("offers").asInt()).isEqualTo(1);
        setTime(22, 30);
        Map<String, JsonNode> night = byAddress(call(get("/api/v1/places"), t, null, 200));
        assertThat(night.get("Av. Belgrano 1100").get("status").asText()).isEqualTo("Cerrado · abre a las 08:00");
        assertThat(night.get("Defensa 900").get("openNow").asBoolean()).isFalse(); // cierra 22:00
        assertThat(night.get("Moreno 950").get("openNow").asBoolean()).isTrue(); // cierra 23:00
        assertThat(night.get("Av. Pueyrredón 1500").get("status").asText()).isEqualTo("Abierto 24 h");
        setTime(7, 0);
        assertThat(byAddress(call(get("/api/v1/places"), t, null, 200)).get("Moreno 950").get("openNow").asBoolean()).isTrue(); // abre 07:00
    }

    @Test
    void ofertasParaTuLista() throws Exception {
        String t = newUser("ofertas@mail.com"); // sin TACC
        JsonNode res = call(get("/api/v1/offers"), t, null, 200);
        assertThat(res.get("alerts").asBoolean()).isFalse();
        JsonNode offers = res.get("offers");
        assertThat(offers.size()).isEqualTo(10);

        JsonNode list = call(get("/api/v1/shopping-lists/2026-10-21"), t, null, 200).get("items");
        int forList = 0;
        for (JsonNode o : offers) {
            int days = o.get("daysLeft").asInt();
            assertThat(days).isBetween(1, 30);
            boolean online = o.get("branches").isEmpty();
            assertThat(online).isEqualTo(Set.of("ropa", "supl").contains(o.get("category").asText()));
            // forList coincide con la lista del súper de la semana
            boolean covers = false;
            for (JsonNode i : list) for (JsonNode g : o.get("ingredients")) covers |= i.get("name").asText().contains(g.asText());
            assertThat(o.get("forList").asBoolean()).as(o.get("code").asText()).isEqualTo(covers);
            if (covers) forList++;
            if (o.get("code").asText().equals("VERDE2X1")) assertThat(o.get("branches").size()).isEqualTo(5);
            if (o.get("code").asText().equals("SEMILLA15")) assertThat(o.get("forList").asBoolean()).isFalse(); // sin avena ni granola
        }
        assertThat(forList).isGreaterThan(0);
        boolean anyTagged = false;
        for (JsonNode i : list) anyTagged |= i.get("offer").asBoolean();
        assertThat(anyTagged).isTrue();

        // los cupones se renuevan solos: nunca vencen en la demo
        setToday(TODAY.plusDays(40));
        for (JsonNode o : call(get("/api/v1/offers"), t, null, 200).get("offers")) assertThat(o.get("daysLeft").asInt()).isPositive();

        setToday(TODAY);
        call(post("/api/v1/users/me/subscription"), t, "{\"period\":\"anual\"}", 201);
        assertThat(call(get("/api/v1/offers"), t, null, 200).get("alerts").asBoolean()).isTrue();
    }
}
