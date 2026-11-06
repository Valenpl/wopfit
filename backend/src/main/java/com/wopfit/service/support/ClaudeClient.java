package com.wopfit.service.support;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;

/**
 * La IA de Wopi: Claude, de Anthropic, por su SDK oficial. La key sale de ANTHROPIC_API_KEY (variable de entorno o .env)
 * y nunca llega al front. Sin key, {@link #enabled()} es false y Wopi responde con las reglas de siempre.
 */
@Component
public class ClaudeClient {
    private static final Logger log = LoggerFactory.getLogger(ClaudeClient.class);
    // Si el modelo se niega a responder algo, la API reintenta sola con otro modelo (no lo admiten todos).
    private static final String FALLBACK_BETA = "server-side-fallback-2026-07-01";

    private final AnthropicClient client;
    private final String model;

    public ClaudeClient(@Value("${wopfit.ai.api-key:}") String apiKey, @Value("${wopfit.ai.model:claude-opus-5-5}") String model) {
        this.model = model;
        this.client = apiKey == null || apiKey.isBlank() ? null
                : AnthropicOkHttpClient.builder().apiKey(apiKey).timeout(Duration.ofSeconds(45)).maxRetries(1).build();
        if (client == null) log.info("Wopi sin IA: falta ANTHROPIC_API_KEY. Responde con las reglas de siempre.");
        else log.info("Wopi con IA: {}", model);
    }

    public boolean enabled() {
        return client != null;
    }

    /** Un pedido con el modelo configurado. */
    public MessageCreateParams.Builder request(long maxTokens) {
        MessageCreateParams.Builder b = MessageCreateParams.builder().model(model).maxTokens(maxTokens);
        if (model.startsWith("claude-opus-5") || model.startsWith("claude-fable-5") || model.equals("claude-sonnet-5-5")) {
            b.putAdditionalHeader("anthropic-beta", FALLBACK_BETA).putAdditionalBodyProperty("fallbacks", JsonValue.from("default"));
        }
        return b;
    }

    public Message create(MessageCreateParams params) {
        return client.messages().create(params);
    }
}
