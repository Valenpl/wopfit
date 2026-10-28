package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;

/** Cuenta (cambiar contraseña) y lista del súper. */
class AccountShoppingTest extends ApiTest {
    @Test
    void cambiarContrasena() throws Exception {
        String t = newUser("cuenta@mail.com");
        call(put("/api/v1/users/me/password"), null, "{\"current\":\"clave1234\",\"password\":\"nueva12345\"}", 401);
        call(put("/api/v1/users/me/password"), t, "{\"current\":\"otra1234\",\"password\":\"nueva12345\"}", 400);
        call(put("/api/v1/users/me/password"), t, "{\"current\":\"clave1234\",\"password\":\"clave1234\"}", 400);
        JsonNode weak = call(put("/api/v1/users/me/password"), t, "{\"current\":\"clave1234\",\"password\":\"sinnumeros\"}", 400);
        assertThat(weak.has("fields")).isTrue();

        call(put("/api/v1/users/me/password"), t, "{\"current\":\"clave1234\",\"password\":\"nueva12345\"}", 200);
        call(post("/api/v1/auth/authenticate"), null, "{\"email\":\"cuenta@mail.com\",\"password\":\"clave1234\"}", 401);
        call(post("/api/v1/auth/authenticate"), null, "{\"email\":\"cuenta@mail.com\",\"password\":\"nueva12345\"}", 200);
        call(get("/api/v1/users/me"), t, null, 200); // el token de antes sigue andando
    }

    @Test
    void listaDelSuper() throws Exception {
        String t = newUser("super@mail.com");
        call(get("/api/v1/shopping-lists/2026-10-21"), null, null, 401);

        JsonNode list = call(get("/api/v1/shopping-lists/2026-10-21"), t, null, 200);
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
        JsonNode day = call(get("/api/v1/meals/2026-10-21"), t, null, 200);
        assertThat(list.get("weekCost").asInt()).isEqualTo(day.get("weekCost").asInt());
        assertThat(list.get("budgetMax").asInt()).isEqualTo(day.get("budgetMax").asInt());

        // tildar y destildar; cualquier fecha de la semana es la misma lista
        String first = items.get(0).get("name").asText();
        JsonNode on = call(put("/api/v1/shopping-lists/2026-10-25"), t, om.writeValueAsString(java.util.Map.of("name", first.toUpperCase(), "checked", true)), 200);
        assertThat(on.at("/items/0/checked").asBoolean()).isTrue();
        call(put("/api/v1/shopping-lists/2026-10-19"), t, om.writeValueAsString(java.util.Map.of("name", first, "checked", true)), 200); // repetir no duplica
        assertThat(call(get("/api/v1/shopping-lists/2026-10-19"), t, null, 200).at("/items/0/checked").asBoolean()).isTrue();
        assertThat(call(get("/api/v1/shopping-lists/2026-10-26"), t, null, 200).at("/items/0/checked").asBoolean()).isFalse(); // otra semana
        call(put("/api/v1/shopping-lists/2026-10-21"), t, "{\"name\":\"caviar\",\"checked\":true}", 400);
        JsonNode off = call(put("/api/v1/shopping-lists/2026-10-21"), t, om.writeValueAsString(java.util.Map.of("name", first, "checked", false)), 200);
        assertThat(off.at("/items/0/checked").asBoolean()).isFalse();

        // "no pude" con una comida: deja de sumar al costo y a la lista
        int before = off.get("weekCost").asInt();
        call(post("/api/v1/meals/2026-10-21/1/skip"), t, null, 200);
        JsonNode after = call(get("/api/v1/shopping-lists/2026-10-21"), t, null, 200);
        assertThat(after.get("weekCost").asInt()).isLessThan(before);
        int totalAfter = 0;
        for (JsonNode i : after.get("items")) totalAfter += i.get("count").asInt();
        assertThat(totalAfter).isLessThan(total);
    }
}
