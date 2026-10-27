package com.wopfit.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.domain.Offer;
import com.wopfit.domain.Place;
import com.wopfit.repo.OfferRepository;
import com.wopfit.repo.PlaceRepository;

/** Carga los lugares y cupones de demostración (resources/demo/*.tsv) la primera vez que arranca, si las tablas están vacías. */
@Component
public class DemoData implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoData.class);
    private final PlaceRepository places;
    private final OfferRepository offers;
    private final TimeService time;

    public DemoData(PlaceRepository places, OfferRepository offers, TimeService time) {
        this.places = places;
        this.offers = offers;
        this.time = time;
    }

    private static List<String[]> rows(String file) throws IOException {
        List<String[]> out = new ArrayList<>();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new ClassPathResource("demo/" + file).getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = r.readLine()) != null) {
                if (line.isBlank() || line.startsWith("#")) continue;
                out.add(line.split("\t", -1));
            }
        }
        return out;
    }

    private static String orNull(String s) {
        return s == null || s.isBlank() || s.equals("-") ? null : s;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (places.count() == 0) {
            for (String[] c : rows("places.tsv")) {
                Place p = new Place();
                p.setBrand(orNull(c[0]));
                p.setName(c[1]);
                p.setCategory(c[2]);
                p.setAddress(c[3]);
                p.setBarrio(c[4]);
                p.setOpens(c[5]);
                p.setCloses(c[6]);
                p.setDiscount(c[7].equals("1"));
                p.setLat(Double.parseDouble(c[8]));
                p.setLng(Double.parseDouble(c[9]));
                places.save(p);
            }
            log.info("Lugares de demostración cargados: {}", places.count());
        }
        if (offers.count() == 0) {
            for (String[] c : rows("offers.tsv")) {
                Offer o = new Offer();
                o.setCode(c[0]);
                o.setBrand(orNull(c[1]));
                o.setStore(c[2]);
                o.setCategory(c[3]);
                o.setOff(c[4]);
                o.setUnit(c[5]);
                o.setDescription(c[6]);
                o.setDays(Integer.parseInt(c[7]));
                o.setIngredients(orNull(c[8]));
                o.setStartDate(time.today());
                offers.save(o);
            }
            log.info("Cupones de demostración cargados: {}", offers.count());
        }
    }
}
