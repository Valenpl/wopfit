package com.wopfit.service;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.domain.Offer;
import com.wopfit.domain.Place;
import com.wopfit.repo.OfferRepository;
import com.wopfit.repo.PlaceRepository;
import com.wopfit.web.dto.Dtos.Branch;
import com.wopfit.web.dto.Dtos.OfferDto;
import com.wopfit.web.dto.Dtos.OffersDto;
import com.wopfit.web.dto.Dtos.PlaceDto;

/**
 * Lugares cercanos (Premium) y cupones de aliados, todo de demostración.
 * La distancia la calcula el front con la ubicación del celu: la ubicación nunca viaja al servidor.
 */
@Service
public class PlaceService {
    private final PlaceRepository places;
    private final OfferRepository offers;
    private final PremiumService premium;
    private final MealService meals;
    private final TimeService time;

    public PlaceService(PlaceRepository places, OfferRepository offers, PremiumService premium, MealService meals, TimeService time) {
        this.places = places;
        this.offers = offers;
        this.premium = premium;
        this.meals = meals;
        this.time = time;
    }

    private static boolean always(Place p) {
        return "00:00".equals(p.getOpens()) && "24:00".equals(p.getCloses());
    }

    static boolean openAt(Place p, LocalTime t) {
        if (always(p)) return true;
        LocalTime open = LocalTime.parse(p.getOpens());
        return !t.isBefore(open) && ("24:00".equals(p.getCloses()) || t.isBefore(LocalTime.parse(p.getCloses())));
    }

    private static String status(Place p, boolean open) {
        if (always(p)) return p.getCategory().equals("parque") ? "Abierto siempre" : "Abierto 24 h";
        return open ? "Abierto hasta las " + p.getCloses() : "Cerrado · abre a las " + p.getOpens();
    }

    @Transactional(readOnly = true)
    public List<PlaceDto> places(Long userId) {
        if (!premium.isPremium(userId)) throw ApiException.forbidden("El buscador de lugares cercanos es parte de Premium");
        LocalTime now = time.now();
        List<Offer> all = offers.findAll();
        return places.findAll().stream().sorted(Comparator.comparing(Place::getId)).map(p -> {
            boolean open = openAt(p, now);
            int n = p.getBrand() == null ? 0 : (int) all.stream().filter(o -> p.getBrand().equals(o.getBrand())).count();
            return new PlaceDto(p.getId(), p.getName(), p.getBrand(), p.getCategory(), Catalog.PLACE_CATEGORIES.get(p.getCategory()),
                    p.getAddress(), p.getBarrio(), p.getLat(), p.getLng(), open, status(p, open), p.isDiscount(), n);
        }).toList();
    }

    /** Días que le quedan al cupón: se renueva solo cada `days` días, así la demo nunca queda con cupones vencidos. */
    private int daysLeft(Offer o) {
        long since = ChronoUnit.DAYS.between(o.getStartDate(), time.today());
        return o.getDays() - (int) Math.floorMod(since, (long) o.getDays());
    }

    @Transactional(readOnly = true)
    public OffersDto offers(Long userId) {
        Set<String> list = meals.weekIngredients(userId, time.today());
        List<Place> all = places.findAll();
        List<OfferDto> out = offers.findAll().stream().sorted(Comparator.comparing(Offer::getId)).map(o -> {
            List<Branch> branches = o.getBrand() == null ? List.of() : all.stream().filter(p -> o.getBrand().equals(p.getBrand()))
                    .map(p -> new Branch(p.getId(), p.getAddress(), p.getBarrio(), p.getLat(), p.getLng())).toList();
            List<String> ing = o.getIngredients() == null ? List.of() : Arrays.stream(o.getIngredients().split(",")).map(String::trim).toList();
            return new OfferDto(o.getId(), o.getCode(), o.getStore(), o.getCategory(), Catalog.OFFER_CATEGORIES.get(o.getCategory()),
                    o.getOff(), o.getUnit(), o.getDescription(), daysLeft(o), ing, list.stream().anyMatch(o::covers), branches);
        }).toList();
        return new OffersDto(premium.isPremium(userId), out);
    }
}
