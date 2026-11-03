package com.wopfit.service.support;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.databind.JsonNode;
import com.wopfit.entity.dto.NearbyPlaceResponse;
import com.wopfit.exceptions.PlacesUnavailableException;

/**
 * Cliente de Google Places API (New), "Nearby Search".
 *
 * La key sale de la variable de entorno GOOGLE_PLACES_KEY y nunca llega al navegador: el front le pide los lugares
 * a nuestro backend y el backend le pregunta a Google. Sin key, no busca nada y devuelve una lista vacía.
 *
 * Cada búsqueda cuesta, así que el resultado se guarda una hora por punto (lat/lng con 3 decimales, unos 100 m).
 */
@Component
public class GooglePlaces {
    private static final Logger log = LoggerFactory.getLogger(GooglePlaces.class);
    private static final Duration TTL = Duration.ofHours(1);
    private static final int MAX_POINTS = 500;
    private static final double RADIUS_M = 2000;
    private static final String FIELDS = "places.id,places.displayName,places.shortFormattedAddress,places.location,places.currentOpeningHours.openNow";

    /** Nuestra categoría y los tipos de Google que entran en ella. Una búsqueda por categoría: si una falla, las otras siguen. */
    public static final Map<String, List<String>> TYPES = new LinkedHashMap<>();
    static {
        TYPES.put("gym", List.of("gym", "fitness_center", "sports_club"));
        TYPES.put("parque", List.of("park"));
        TYPES.put("super", List.of("supermarket"));
        TYPES.put("tienda", List.of("sporting_goods_store"));
    }

    private record Saved(List<NearbyPlaceResponse> places, Instant at) {}

    private final String key;
    private final RestClient http;
    private final Map<String, Saved> cache = new ConcurrentHashMap<>();

    public GooglePlaces(@Value("${wopfit.google.places-key:}") String key, RestClient.Builder builder) {
        this.key = key == null ? "" : key.trim();
        SimpleClientHttpRequestFactory timeouts = new SimpleClientHttpRequestFactory();
        timeouts.setConnectTimeout(3000);
        timeouts.setReadTimeout(5000);
        this.http = builder.baseUrl("https://places.googleapis.com/v1").requestFactory(timeouts).build();
    }

    public boolean enabled() {
        return !key.isEmpty();
    }

    /** Lugares de Google a menos de 2 km del punto, de todas nuestras categorías. */
    public List<NearbyPlaceResponse> near(double lat, double lng) {
        if (!enabled()) return List.of();
        String point = String.format(Locale.ROOT, "%.3f,%.3f", lat, lng);
        Saved saved = cache.get(point);
        if (saved != null && saved.at().plus(TTL).isAfter(Instant.now())) return saved.places();

        List<NearbyPlaceResponse> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        int failed = 0;
        for (Map.Entry<String, List<String>> e : TYPES.entrySet()) {
            try {
                JsonNode res = http.post().uri("/places:searchNearby")
                        .header("X-Goog-Api-Key", key).header("X-Goog-FieldMask", FIELDS)
                        .contentType(MediaType.APPLICATION_JSON).body(request(lat, lng, e.getValue()))
                        .retrieve().body(JsonNode.class);
                for (NearbyPlaceResponse p : parse(res, e.getKey())) if (seen.add(p.id())) out.add(p);
            } catch (RestClientException ex) {
                failed++;
                log.warn("Google Places no respondió para {}: {}", e.getKey(), ex.getMessage());
            }
        }
        if (failed == TYPES.size()) throw new PlacesUnavailableException("No pudimos traer los lugares de Google. Probá de nuevo en un rato.");
        if (cache.size() >= MAX_POINTS) cache.clear();
        if (failed == 0) cache.put(point, new Saved(List.copyOf(out), Instant.now()));
        return out;
    }

    static Map<String, Object> request(double lat, double lng, List<String> types) {
        return Map.of(
                "includedTypes", types,
                "maxResultCount", 20,
                "rankPreference", "DISTANCE",
                "languageCode", "es",
                "regionCode", "AR",
                "locationRestriction", Map.of("circle", Map.of(
                        "center", Map.of("latitude", lat, "longitude", lng), "radius", RADIUS_M)));
    }

    /** Pasa la respuesta de Google a nuestros DTOs. Saltea los lugares sin id, nombre o coordenadas. */
    public static List<NearbyPlaceResponse> parse(JsonNode res, String category) {
        List<NearbyPlaceResponse> out = new ArrayList<>();
        if (res == null || !res.path("places").isArray()) return out;
        for (JsonNode p : res.path("places")) {
            String id = p.path("id").asText("");
            String name = p.path("displayName").path("text").asText("");
            JsonNode loc = p.path("location");
            if (id.isEmpty() || name.isEmpty() || !loc.has("latitude") || !loc.has("longitude")) continue;
            JsonNode open = p.path("currentOpeningHours").path("openNow");
            Boolean openNow = open.isBoolean() ? open.asBoolean() : null;
            String status = openNow == null ? "Sin horario en Google" : openNow ? "Abierto ahora" : "Cerrado ahora";
            out.add(new NearbyPlaceResponse(id, name, category, Catalog.PLACE_CATEGORIES.get(category),
                    p.path("shortFormattedAddress").asText(""), loc.get("latitude").asDouble(), loc.get("longitude").asDouble(), openNow, status));
        }
        return out;
    }
}
