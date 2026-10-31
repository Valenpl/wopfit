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

        call(get("/api/v1/users/me"), t, null, 200);
    }

    @Test
    void tokensQueNoSirven() throws Exception {
        call(post("/api/v1/auth/authenticate"), null, "{\"email\":\"nadie@mail.com\",\"password\":\"clave1234\"}", 401);
        call(get("/api/v1/users/me"), "no-es-un-token", null, 401);

        // Firma cambiada: el payload dice otra cosa y la firma ya no coincide.
        String t = newUser("firma@mail.com");
        String[] parts = t.split("\\.");
        String other = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"otra@mail.com\",\"role\":\"ADMIN\"}".getBytes(StandardCharsets.UTF_8));
        call(get("/api/v1/users/me"), parts[0] + "." + other + "." + parts[2], null, 401);
    }

    @Test
    void recuperarLaContrasena() throws Exception {
        newUser("olvido@mail.com");
        // Un email sin cuenta recibe la misma respuesta, sin código.
        JsonNode nobody = call(post("/api/v1/auth/forgot"), null, "{\"email\":\"nadie@mail.com\"}", 200);
        assertThat(nobody.get("message").asText()).startsWith("Si nadie@mail.com tiene una cuenta");
        assertThat(nobody.get("devCode").isNull()).isTrue();

        String code = call(post("/api/v1/auth/forgot"), null, "{\"email\":\"Olvido@mail.com\"}", 200).get("devCode").asText();
        String wrong = code.equals("000000") ? "111111" : "000000";
        call(post("/api/v1/auth/reset"), null, "{\"email\":\"olvido@mail.com\",\"code\":\"" + code + "\",\"password\":\"corta\"}", 400);
        assertThat(call(post("/api/v1/auth/reset"), null, "{\"email\":\"olvido@mail.com\",\"code\":\"" + wrong + "\",\"password\":\"nueva5678\"}", 400)
                .get("error").asText()).isEqualTo("El código no coincide. Pedí uno nuevo.");
        // Después de un intento equivocado el código ya no sirve, ni siquiera el correcto.
        call(post("/api/v1/auth/reset"), null, "{\"email\":\"olvido@mail.com\",\"code\":\"" + code + "\",\"password\":\"nueva5678\"}", 400);

        code = call(post("/api/v1/auth/forgot"), null, "{\"email\":\"olvido@mail.com\"}", 200).get("devCode").asText();
        JsonNode in = call(post("/api/v1/auth/reset"), null, "{\"email\":\"olvido@mail.com\",\"code\":\"" + code + "\",\"password\":\"nueva5678\"}", 200);
        assertThat(in.at("/me/name").asText()).isEqualTo("Sofi");
        call(get("/api/v1/users/me"), in.get("token").asText(), null, 200);
        call(post("/api/v1/auth/authenticate"), null, "{\"email\":\"olvido@mail.com\",\"password\":\"clave1234\"}", 401);
        call(post("/api/v1/auth/authenticate"), null, "{\"email\":\"olvido@mail.com\",\"password\":\"nueva5678\"}", 200);
        // El código se usa una sola vez.
        call(post("/api/v1/auth/reset"), null, "{\"email\":\"olvido@mail.com\",\"code\":\"" + code + "\",\"password\":\"otra91234\"}", 400);
    }

    @Test
    void lasRutasDeAdminPidenRolAdmin() throws Exception {
        String t = newUser("comun@mail.com");
        call(get("/api/v1/admin/cualquier-cosa"), t, null, 403);
    }
}
