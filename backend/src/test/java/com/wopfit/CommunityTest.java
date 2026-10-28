package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.databind.JsonNode;
import com.wopfit.repository.CommunityProfileRepository;
import com.wopfit.service.CommunityProfileService;
import com.wopfit.service.CommunityProfileServiceImpl;

/** Comunidad: personas como vos, feed "para vos" paginado, me gusta, guardados, comentarios, seguir, publicar con foto y borrar. */
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
        call(get("/api/v1/people"), null, null, 401);
        call(get("/api/v1/posts"), null, null, 401);
        JsonNode people = call(get("/api/v1/people"), a, null, 200);
        assertThat(people.get("myGoal").asText()).isEqualTo("comer");
        assertThat(people.get("people").size()).isEqualTo(5);
        assertThat(people.at("/people/0/sharedGoal").asText()).isEqualTo("comer"); // primero quien comparte objetivos
        JsonNode feed = call(get("/api/v1/posts?size=50"), a, null, 200);
        assertThat(feed.get("content").size()).isGreaterThanOrEqualTo(5);
        assertThat(feed.at("/content/0/goal").asText()).isEqualTo("comer"); // "para vos": tu objetivo primero
        JsonNode recetas = call(get("/api/v1/posts?filter=recetas"), a, null, 200).get("content");
        for (JsonNode p : recetas) assertThat(p.get("type").asText()).isEqualTo("receta");

        // paginado: de a 2, sin repetir y con "last" en la última página
        long total = feed.get("totalElements").asLong();
        JsonNode p0 = call(get("/api/v1/posts?page=0&size=2"), a, null, 200);
        JsonNode p1 = call(get("/api/v1/posts?page=1&size=2"), a, null, 200);
        assertThat(p0.get("content").size()).isEqualTo(2);
        assertThat(p0.get("last").asBoolean()).isFalse();
        assertThat(p1.at("/content/0/id").asLong()).isEqualTo(feed.at("/content/2/id").asLong());
        JsonNode lastPage = call(get("/api/v1/posts?page=" + ((total - 1) / 2) + "&size=2"), a, null, 200);
        assertThat(lastPage.get("last").asBoolean()).isTrue();
        assertThat(call(get("/api/v1/posts?page=99&size=2"), a, null, 200).get("content").size()).isZero();
        JsonNode r0 = call(get("/api/v1/posts?filter=recetas&size=1"), a, null, 200);
        assertThat(r0.get("content").size()).isEqualTo(1);
        assertThat(r0.get("totalElements").asLong()).isEqualTo(recetas.size());

        // me gusta y guardar (idempotentes)
        JsonNode bowl = byTitle(feed.get("content"), "Bowl de lentejas");
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
        long martina = people.at("/people/0/id").asLong();
        call(put("/api/v1/people/" + martina + "/follow"), a, "{\"on\":true}", 200);
        assertThat(call(get("/api/v1/people"), a, null, 200).at("/people/0/following").asBoolean()).isTrue();
        call(put("/api/v1/people/" + people.get("me").asLong() + "/follow"), a, "{\"on\":true}", 400);
        call(put("/api/v1/people/99999/follow"), a, "{\"on\":true}", 404);
        call(put("/api/v1/people/" + martina + "/follow"), a, "{\"on\":false}", 200);

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
        assertThat(call(get("/api/v1/posts"), a, null, 200).at("/content/0/id").asLong()).isEqualTo(mine.get("id").asLong()); // lo tuyo primero

        // otra persona con tus mismos objetivos te ve primero en "Personas como vos" y no puede borrar lo tuyo.
        // A y B comparten dos objetivos que no tiene nadie más (los otros usuarios de los tests solo tienen "comer").
        String b = newUser("comu-b@mail.com");
        String sameGoals = "{\"goals\":[\"dormir\",\"fuerza\"],\"days\":[0,2,4],\"minutes\":30,\"budget\":\"medio\",\"activities\":[],"
                + "\"avoid\":[],\"otherAvoid\":\"\",\"health\":[],\"level\":\"principiante\",\"equipment\":[\"nada\"]}";
        call(put("/api/v1/users/me/preferences"), a, sameGoals, 200);
        call(put("/api/v1/users/me/preferences"), b, sameGoals, 200);
        JsonNode peopleB = call(get("/api/v1/people"), b, null, 200);
        assertThat(peopleB.at("/people/0/id").asLong()).isEqualTo(people.get("me").asLong());
        assertThat(peopleB.at("/people/0/goals").toString()).isEqualTo("[\"fuerza\",\"dormir\"]");
        call(delete("/api/v1/posts/" + mine.get("id").asLong()), b, null, 403);
        assertThat(call(delete("/api/v1/posts/" + mine.get("id").asLong()), a, null, 200).get("id").asLong()).isEqualTo(mine.get("id").asLong());
        assertThat(mvc.perform(get(url)).andReturn().getResponse().getStatus()).isEqualTo(404);
        call(get("/api/v1/posts/" + mine.get("id").asLong()), a, null, 404);
    }

    @Test
    void nombreEnLaComunidad() {
        assertThat(CommunityProfileServiceImpl.displayName("Lucía Fernández")).isEqualTo("Lucía F.");
        assertThat(CommunityProfileServiceImpl.displayName("  Ana María  López ")).isEqualTo("Ana L.");
        assertThat(CommunityProfileServiceImpl.displayName("Sofi")).isEqualTo("Sofi");
        assertThat(CommunityProfileServiceImpl.displayName(null)).isEqualTo("Vos");
    }

    @Autowired CommunityProfileRepository profiles;
    @Autowired CommunityProfileService communityProfiles;

    /** Quien ya existía sin perfil (usuarios de antes de crearlo al guardar el nombre) lo recibe al arrancar, y la comunidad le anda. */
    @Test
    void perfilesQueFaltan() throws Exception {
        String t = newUser("sin-perfil@mail.com");
        long me = call(get("/api/v1/people"), t, null, 200).get("me").asLong();
        profiles.deleteById(me);
        call(get("/api/v1/people"), t, null, 400); // sin perfil la comunidad no lo crea en una lectura
        assertThat(communityProfiles.createMissing()).isEqualTo(1);
        assertThat(communityProfiles.createMissing()).isZero();
        assertThat(call(get("/api/v1/people"), t, null, 200).get("people").size()).isEqualTo(5);
    }

    /** La pantalla de Comunidad pide personas y publicaciones a la vez: con un usuario nuevo no puede fallar ninguna. */
    @Test
    void personasYFeedEnParalelo() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(6);
        try {
            for (int u = 0; u < 4; u++) {
                String t = newUser("paralelo" + u + "@mail.com");
                List<Future<Integer>> status = new ArrayList<>();
                for (int k = 0; k < 6; k++) {
                    String path = k % 2 == 0 ? "/api/v1/people" : "/api/v1/posts";
                    status.add(pool.submit(() -> mvc.perform(get(path).header("Authorization", "Bearer " + t)).andReturn().getResponse().getStatus()));
                }
                for (Future<Integer> s : status) assertThat(s.get()).isEqualTo(200);
            }
        } finally {
            pool.shutdown();
        }
    }
}
