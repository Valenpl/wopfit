package com.wopfit.service;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.Offer;
import com.wopfit.entity.Place;
import com.wopfit.entity.dto.Branch;
import com.wopfit.entity.dto.OfferResponse;
import com.wopfit.entity.dto.OffersResponse;
import com.wopfit.entity.dto.PlaceResponse;
import com.wopfit.exceptions.PremiumRequiredException;
import com.wopfit.repository.OfferRepository;
import com.wopfit.repository.PlaceRepository;
import com.wopfit.service.support.Catalog;

@RequiredArgsConstructor
@Service
public class PlaceServiceImpl implements PlaceService {
    private final PlaceRepository places;
    private final OfferRepository offers;
    private final PremiumService premium;
    private final MealService meals;
    private final TimeService time;

    private static boolean always(Place p) {
        return "00:00".equals(p.getOpens()) && "24:00".equals(p.getCloses());
    }

    static boolean openAt(Place p, LocalTime t) {
        if (always(p)) return true;
        LocalTime open = LocalTime.parse(p.getOpens());
        return !t.isBefore(open) && ("24:00".equals(p.getCloses()) || t.isBefore(LocalTime.parse(p.getCloses())));
    }

    private static boolean sameBrand(Place p, Offer o) {
        return p.getBrand() != null && p.getBrand().getId().equals(o.getBrand().getId());
    }

    private static String status(Place p, boolean open) {
        if (always(p)) return p.displayCategory().equals("parque") ? "Abierto siempre" : "Abierto 24 h";
        return open ? "Abierto hasta las " + p.getCloses() : "Cerrado · abre a las " + p.getOpens();
    }

    @Transactional(readOnly = true)
    @Override
    public List<PlaceResponse> places(Long userId) {
        if (!premium.isPremium(userId)) throw new PremiumRequiredException("El buscador de lugares cercanos es parte de Premium");
        LocalTime now = time.now();
        List<Offer> all = offers.findAll();
        return places.findAll().stream().sorted(Comparator.comparing(Place::getId)).map(p -> {
            boolean open = openAt(p, now);
            int n = p.getBrand() == null ? 0 : (int) all.stream().filter(o -> sameBrand(p, o)).count();
            return new PlaceResponse(p.getId(), p.displayName(), p.getBrand() == null ? null : p.getBrand().getCode(), p.displayCategory(), Catalog.PLACE_CATEGORIES.get(p.displayCategory()),
                    p.getAddress(), p.getBarrio(), p.getLat(), p.getLng(), open, status(p, open), n > 0, n);
        }).toList();
    }

    /** Días que le quedan al cupón: se renueva solo cada `days` días, así la demo nunca queda con cupones vencidos. */
    private int daysLeft(Offer o) {
        long since = ChronoUnit.DAYS.between(o.getStartDate(), time.today());
        return o.getDays() - (int) Math.floorMod(since, (long) o.getDays());
    }

    @Transactional(readOnly = true)
    @Override
    public OffersResponse offers(Long userId) {
        Set<String> list = meals.weekIngredients(userId, time.today());
        List<Place> all = places.findAll();
        List<OfferResponse> out = offers.findAll().stream().sorted(Comparator.comparing(Offer::getId)).map(o -> {
            List<Branch> branches = all.stream().filter(p -> sameBrand(p, o))
                    .map(p -> new Branch(p.getId(), p.getAddress(), p.getBarrio(), p.getLat(), p.getLng())).toList();
            List<String> ing = List.copyOf(o.getIngredients());
            return new OfferResponse(o.getId(), o.getCode(), o.getBrand().getName(), o.getCategory(), Catalog.OFFER_CATEGORIES.get(o.getCategory()),
                    o.getOff(), o.getUnit(), o.getDescription(), daysLeft(o), ing, list.stream().anyMatch(o::covers), branches);
        }).toList();
        return new OffersResponse(premium.isPremium(userId), out);
    }
}
