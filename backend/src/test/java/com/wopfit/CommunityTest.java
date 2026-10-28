package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.wopfit.service.CommunityServiceImpl;

/** Comunidad: feed "para vos", me gusta, guardados, comentarios, seguir, publicar con foto y borrar. */
class CommunityTest extends ApiTest {
    /** PNG de 1×1. */
    private static final String PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    private String json(Object... kv) throws Exception {
        Map<String, Object> m = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], kv[i + 1]);
        return om.writeValueAsString(m);
    }

    private static JsonNode byTitle(JsonNode posts, String start) {
        for (JsonNode p : posts) if (p.get("title").asText().startsWith(start)) return p;
        throw new AssertionError("no está: " + start);
    }

    @Test
    void comunidad() throws Exception {
        String a = newUser("comu-a@mail.com"); // objetivo: comer
        call(get("/api/v1/community"), null, null, 401);
        JsonNode feed = call(get("/api/v1/community"), a, null, 200);
        assertThat(feed.get("myGoal").asText()).isEqualTo("comer");
        assertThat(feed.get("people").size()).isEqualTo(5);
        assertThat(feed.at("/people/0/sharedGoal").asText()).isEqualTo("comer"); // primero quien comparte objetivos
        assertThat(feed.get("posts").size()).isGreaterThanOrEqualTo(5);
        assertThat(feed.at("/posts/0/goal").asText()).isEqualTo("comer"); // "para vos": tu objetivo primero
        JsonNode recetas = call(get("/api/v1/community?f=recetas"), a, null, 200).get("posts");
        for (JsonNode p : recetas) assertThat(p.get("type").asText()).isEqualTo("receta");

        // me gusta y guardar (idempotentes)
        JsonNode bowl = byTitle(feed.get("posts"), "Bowl de lentejas");
        long pid = bowl.get("id").asLong();
        int likes = bowl.get("likes").asInt();
        assertThat(call(put("/api/v1/posts/" + pid + "/like"), a, "{\"on\":true}", 200).get("likes").asInt()).isEqualTo(likes + 1);
        assertThat(call(put("/api/v1/posts/" + pid + "/like"), a, "{\"on\":true}", 200).get("likes").asInt()).isEqualTo(likes + 1);
        call(put("/api/v1/posts/" + pid + "/save"), a, "{\"on\":true}", 200);
        JsonNode d = call(get("/api/v1/posts/" + pid), a, null, 200);
        assertThat(d.at("/post/liked").asBoolean()).isTrue();
        assertThat(d.at("/post/saved").asBoolean()).isTrue();
        assertThat(call(put("/api/v1/posts/" + pid + "/like"), a, "{\"on\":false}", 200).get("likes").asInt()).isEqualTo(likes);
        call(put("/api/v1/posts/9999/like"), a, "{\"on\":true}", 404);

        // comentar
        int before = d.get("comments").size();
        call(post("/api/v1/posts/" + pid + "/comments"), a, "{\"text\":\"  \"}", 400);
        JsonNode c = call(post("/api/v1/posts/" + pid + "/comments"), a, json("text", "¡Gracias por la receta!"), 201);
        assertThat(c.get("mine").asBoolean()).isTrue();
        d = call(get("/api/v1/posts/" + pid), a, null, 200);
        assertThat(d.get("comments").size()).isEqualTo(before + 1);
        assertThat(d.at("/comments/" + before + "/author").asText()).isEqualTo("Sofi");
        assertThat(d.at("/post/comments").asInt()).isEqualTo(before + 1);

        // seguir
        long martina = feed.at("/people/0/id").asLong();
        call(put("/api/v1/community/people/" + martina + "/follow"), a, "{\"on\":true}", 200);
        assertThat(call(get("/api/v1/community"), a, null, 200).at("/people/0/following").asBoolean()).isTrue();
        call(put("/api/v1/community/people/" + feed.get("me").asLong() + "/follow"), a, "{\"on\":true}", 400);
        call(put("/api/v1/community/people/99999/follow"), a, "{\"on\":true}", 404);
        call(put("/api/v1/community/people/" + martina + "/follow"), a, "{\"on\":false}", 200);

        // publicar: validaciones, solo texto y con foto
        call(post("/api/v1/posts"), a, json("type", "chisme", "title", "Hola"), 400);
        call(post("/api/v1/posts"), a, json("type", "receta", "title", " ", "body", ""), 400);
        call(post("/api/v1/posts"), a, json("type", "receta", "title", "Con foto rota", "photo", "data:image/png;base64,AAAA"), 400);
        call(post("/api/v1/posts"), a, json("type", "receta", "title", "Con un gif", "photo", "data:image/gif;base64," + PNG), 400);
        byte[] big = new byte[1_600_000];
        big[0] = (byte) 0xFF;
        big[1] = (byte) 0xD8;
        JsonNode heavy = call(post("/api/v1/posts"), a, json("type", "receta", "title", "Pesada", "photo", "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(big)), 400);
        assertThat(heavy.get("error").asText()).contains("muy pesada");

        JsonNode text = call(post("/api/v1/posts"), a, json("type", "pregunta", "body", "¿Alguien conoce una verdulería barata en Caballito?"), 201);
        assertThat(text.get("title").asText()).isEqualTo("¿Alguien conoce una verdulería barata en Caballito?");
        assertThat(text.get("body").isNull()).isTrue();

        JsonNode mine = call(post("/api/v1/posts"), a, json("type", "receta", "title", "Tarta de zapallo", "body", "Fácil y rinde 4 porciones.", "photo", "data:image/png;base64," + PNG), 201);
        assertThat(mine.get("mine").asBoolean()).isTrue();
        assertThat(mine.get("author").asText()).isEqualTo("Sofi");
        assertThat(mine.get("goal").asText()).isEqualTo("comer");
        String url = mine.get("photoUrl").asText();
        assertThat(url).matches("/api/v1/photos/[0-9a-f-]{36}");
        var res = mvc.perform(get(url)).andReturn().getResponse(); // sin sesión: lo pide una <img>
        assertThat(res.getStatus()).isEqualTo(200);
        assertThat(res.getContentType()).isEqualTo("image/png");
        assertThat(res.getContentAsByteArray()).isEqualTo(Base64.getDecoder().decode(PNG));
        assertThat(call(get("/api/v1/community"), a, null, 200).at("/posts/0/id").asLong()).isEqualTo(mine.get("id").asLong()); // lo tuyo primero

        // otra persona con el mismo objetivo te ve en "Personas como vos" y no puede borrar lo tuyo
        String b = newUser("comu-b@mail.com");
        JsonNode feedB = call(get("/api/v1/community"), b, null, 200);
        boolean seesA = false;
        for (JsonNode p : feedB.get("people")) seesA |= p.get("id").asLong() == feed.get("me").asLong();
        assertThat(seesA).isTrue();
        call(delete("/api/v1/posts/" + mine.get("id").asLong()), b, null, 403);
        assertThat(call(delete("/api/v1/posts/" + mine.get("id").asLong()), a, null, 200).get("id").asLong()).isEqualTo(mine.get("id").asLong());
        assertThat(mvc.perform(get(url)).andReturn().getResponse().getStatus()).isEqualTo(404);
        call(get("/api/v1/posts/" + mine.get("id").asLong()), a, null, 404);
    }

    @Test
    void nombreEnLaComunidad() {
        assertThat(CommunityServiceImpl.displayName("Lucía Fernández")).isEqualTo("Lucía F.");
        assertThat(CommunityServiceImpl.displayName("  Ana María  López ")).isEqualTo("Ana L.");
        assertThat(CommunityServiceImpl.displayName("Sofi")).isEqualTo("Sofi");
        assertThat(CommunityServiceImpl.displayName(null)).isEqualTo("Vos");
    }
}
