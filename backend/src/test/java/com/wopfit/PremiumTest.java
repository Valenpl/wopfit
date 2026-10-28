package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;

/** Premium de demostración: se activa sin pagar, cambia de período, vence y se puede volver al Gratuito. */
class PremiumTest extends ApiTest {
    @Test
    void premiumDeDemostracion() throws Exception {
        String t = newUser("premium@mail.com");
        call(post("/api/v1/subscription"), null, "{\"period\":\"anual\"}", 401);

        JsonNode me = call(get("/api/v1/me"), t, null, 200);
        assertThat(me.at("/subscription/premium").asBoolean()).isFalse();
        assertThat(me.at("/subscription/demo").asBoolean()).isTrue();

        call(post("/api/v1/subscription"), t, "{\"period\":\"vitalicio\"}", 400);
        call(post("/api/v1/subscription"), t, "{}", 400);

        me = call(post("/api/v1/subscription"), t, "{\"period\":\"anual\"}", 200);
        assertThat(me.at("/subscription/premium").asBoolean()).isTrue();
        assertThat(me.at("/subscription/period").asText()).isEqualTo("anual");
        assertThat(me.at("/subscription/periodName").asText()).isEqualTo("Anual");
        assertThat(me.at("/subscription/until").asText()).isEqualTo("2027-10-21");
        assertThat(call(get("/api/v1/me"), t, null, 200).at("/subscription/premium").asBoolean()).isTrue();

        // cambiar a mensual arranca de nuevo desde hoy
        me = call(post("/api/v1/subscription"), t, "{\"period\":\"mensual\"}", 200);
        assertThat(me.at("/subscription/until").asText()).isEqualTo("2026-11-21");

        // el último día sigue siendo Premium; al siguiente vence solo
        setToday(TODAY.plusMonths(1));
        assertThat(call(get("/api/v1/me"), t, null, 200).at("/subscription/premium").asBoolean()).isTrue();
        setToday(TODAY.plusMonths(1).plusDays(1));
        assertThat(call(get("/api/v1/me"), t, null, 200).at("/subscription/premium").asBoolean()).isFalse();

        // volver al Gratuito
        setToday(TODAY);
        call(post("/api/v1/subscription"), t, "{\"period\":\"semestral\"}", 200);
        me = call(delete("/api/v1/subscription"), t, null, 200);
        assertThat(me.at("/subscription/premium").asBoolean()).isFalse();
        assertThat(me.at("/subscription/until").isNull()).isTrue();
        call(delete("/api/v1/subscription"), t, null, 200); // sin suscripción no falla

        assertThat(call(get("/api/v1/catalog"), null, null, 200).at("/premiumPeriods/semestral").asText()).isEqualTo("Semestral");
    }
}
