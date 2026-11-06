package com.wopfit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** CORS para el front publicado: el dominio de Vercel y sus deploys de prueba, y nada más. */
@TestPropertySource(properties = "wopfit.cors.origins=https://wopfit.vercel.app, https://wopfit-*.vercel.app")
class CorsTest extends ApiTest {
    private String allowed(String origin) throws Exception {
        return mvc.perform(options("/api/v1/auth/authenticate").header("Origin", origin).header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type")).andReturn().getResponse().getHeader("Access-Control-Allow-Origin");
    }

    @Test
    void soloLosDominiosDelFront() throws Exception {
        assertThat(allowed("https://wopfit.vercel.app")).isEqualTo("https://wopfit.vercel.app");
        assertThat(allowed("https://wopfit-git-feat-mapa-wopfit-valenpl.vercel.app")).isEqualTo("https://wopfit-git-feat-mapa-wopfit-valenpl.vercel.app");
        assertThat(allowed("https://otra-app.vercel.app")).isNull();
        assertThat(allowed("https://wopfit.vercel.app.malo.com")).isNull();
    }
}
