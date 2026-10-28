package com.wopfit.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.entity.CommunityProfile;
import com.wopfit.entity.Offer;
import com.wopfit.entity.Place;
import com.wopfit.entity.Post;
import com.wopfit.entity.PostComment;
import com.wopfit.entity.Professional;
import com.wopfit.repository.CommunityProfileRepository;
import com.wopfit.repository.OfferRepository;
import com.wopfit.repository.PlaceRepository;
import com.wopfit.repository.PostCommentRepository;
import com.wopfit.repository.PostRepository;
import com.wopfit.repository.ProfessionalRepository;

/** Carga los lugares, cupones, profesionales y la comunidad de demostración (resources/demo/*.tsv) la primera vez que arranca, si las tablas están vacías. */
@Component
public class DemoData implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoData.class);
    private final PlaceRepository places;
    private final OfferRepository offers;
    private final ProfessionalRepository pros;
    private final CommunityProfileRepository people;
    private final PostRepository posts;
    private final PostCommentRepository comments;
    private final TimeService time;

    public DemoData(PlaceRepository places, OfferRepository offers, ProfessionalRepository pros, CommunityProfileRepository people, PostRepository posts,
                    PostCommentRepository comments, TimeService time) {
        this.places = places;
        this.offers = offers;
        this.pros = pros;
        this.people = people;
        this.posts = posts;
        this.comments = comments;
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

    /** Personas, publicaciones y comentarios de ejemplo. Las fechas son relativas a hoy ("hace 2 h"). */
    private void loadCommunity() throws IOException {
        Map<String, CommunityProfile> byKey = new HashMap<>();
        for (String[] c : rows("people.tsv")) {
            CommunityProfile p = new CommunityProfile();
            p.setName(c[1]);
            p.setGoals(c[2]);
            p.setDaysPerWeek(Integer.parseInt(c[3]));
            p.setDemo(true);
            byKey.put(c[0], people.save(p));
        }
        Instant now = Instant.now();
        Map<String, Post> postByKey = new HashMap<>();
        for (String[] c : rows("posts.tsv")) {
            Post p = new Post();
            p.setAuthor(byKey.get(c[1]));
            p.setGoal(c[2]);
            p.setType(c[3]);
            p.setTitle(c[4]);
            p.setBody(c[5]);
            p.setEmoji(orNull(c[6]));
            p.setBg(orNull(c[7]));
            p.setTags(orNull(c[8]));
            p.setBaseLikes(Integer.parseInt(c[9]));
            p.setCreatedAt(now.minus(Long.parseLong(c[10]), ChronoUnit.HOURS));
            postByKey.put(c[0], posts.save(p));
        }
        for (String[] c : rows("comments.tsv")) {
            PostComment m = new PostComment();
            m.setPost(postByKey.get(c[0]));
            m.setAuthor(byKey.get(c[1]));
            m.setText(c[2]);
            m.setCreatedAt(now.minus(Long.parseLong(c[3]), ChronoUnit.HOURS));
            comments.save(m);
        }
        log.info("Comunidad de demostración cargada: {} personas, {} publicaciones", byKey.size(), postByKey.size());
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
        if (pros.count() == 0) {
            for (String[] c : rows("professionals.tsv")) {
                Professional p = new Professional();
                p.setKind(c[0]);
                p.setName(c[1]);
                p.setSpecialty(c[2]);
                p.setLicense(c[3]);
                p.setRating(Double.parseDouble(c[4]));
                p.setExperience(c[5]);
                p.setBio(c[6]);
                pros.save(p);
            }
            log.info("Profesionales de demostración cargados: {}", pros.count());
        }
        if (!people.existsByDemoTrue()) loadCommunity();
    }
}
