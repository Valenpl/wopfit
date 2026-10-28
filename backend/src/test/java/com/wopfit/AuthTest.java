package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;

/** El JWT como en el e-commerce: /authenticate, y el token lleva sub (email), role y userId. */
class AuthTest extends ApiTest {
    @Test
    void tokenConEmailRolYId() throws Exception {
        newUser("token@mail.com");
        JsonNode auth = call(post("/api/v1/auth/authenticate"), null, "{\"email\":\"Token@mail.com\",\"password\":\"clave1234\"}", 200);
        String t = auth.get("token").asText();
        assertThat(auth.at("/me/email").asText()).isEqualTo("token@mail.com");

        JsonNode claims = om.readTree(Base64.getUrlDecoder().decode(t.split("\\.")[1]));
        assertThat(claims.get("sub").asText()).isEqualTo("token@mail.com");
        assertThat(claims.get("role").asText()).isEqualTo("USER");
        assertThat(claims.get("userId").asLong()).isEqualTo(auth.at("/me/id").asLong());

        call(get("/api/v1/me"), t, null, 200);
    }

    @Test
    void tokensQueNoSirven() throws Exception {
        call(post("/api/v1/auth/authenticate"), null, "{\"email\":\"nadie@mail.com\",\"password\":\"clave1234\"}", 401);
        call(get("/api/v1/me"), "no-es-un-token", null, 401);

        // Firma cambiada: el payload dice otra cosa y la firma ya no coincide.
        String t = newUser("firma@mail.com");
        String[] parts = t.split("\\.");
        String other = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"otra@mail.com\",\"role\":\"ADMIN\"}".getBytes(StandardCharsets.UTF_8));
        call(get("/api/v1/me"), parts[0] + "." + other + "." + parts[2], null, 401);
    }

    @Test
    void lasRutasDeAdminPidenRolAdmin() throws Exception {
        String t = newUser("comun@mail.com");
        call(get("/api/v1/admin/cualquier-cosa"), t, null, 403);
    }
}
