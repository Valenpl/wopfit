package com.wopfit.service;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.entity.Plan;
import com.wopfit.entity.Preferences;
import com.wopfit.entity.User;
import com.wopfit.entity.dto.AboutRequest;
import com.wopfit.entity.dto.MeResponse;
import com.wopfit.entity.dto.PlanResponse;
import com.wopfit.entity.dto.PreferencesRequest;
import com.wopfit.entity.dto.PreferencesResponse;
import com.wopfit.exceptions.InvalidDataException;
import com.wopfit.exceptions.SessionExpiredException;
import com.wopfit.repository.PlanRepository;
import com.wopfit.repository.PreferencesRepository;
import com.wopfit.repository.UserRepository;

@Service
public class ProfileServiceImpl implements ProfileService {
    private final UserRepository users;
    private final PreferencesRepository prefsRepo;
    private final PlanRepository plans;
    private final PremiumService premium;

    public ProfileServiceImpl(UserRepository users, PreferencesRepository prefsRepo, PlanRepository plans, PremiumService premium) {
        this.users = users;
        this.prefsRepo = prefsRepo;
        this.plans = plans;
        this.premium = premium;
    }

    @Override
    public User user(Long id) {
        return users.findById(id).orElseThrow(() -> new SessionExpiredException());
    }

    @Override
    public Preferences prefs(Long userId) {
        return prefsRepo.findByUserId(userId).orElseThrow(() -> new InvalidDataException("Primero contanos tus preferencias"));
    }

    @Transactional(readOnly = true)
    @Override
    public MeResponse me(Long userId) {
        User u = user(userId);
        Preferences p = prefsRepo.findByUserId(userId).orElse(null);
        Plan plan = plans.findByUserId(userId).orElse(null);
        return new MeResponse(u.getId(), u.getEmail(), u.getName(), u.getBirthDate(), u.getHeightCm(), u.getWeightKg(), u.isVerified(),
                p == null ? null : toDto(p), plan == null || p == null ? null : planDto(plan, p), premium.status(userId));
    }

    @Transactional
    @Override
    public MeResponse updateAbout(Long userId, AboutRequest r) {
        User u = user(userId);
        int age = Period.between(r.birthDate(), LocalDate.now()).getYears();
        if (age < 13 || age > 110) throw new InvalidDataException("Revisá la fecha: la app es para mayores de 13 años.");
        u.setName(r.name().trim());
        u.setBirthDate(r.birthDate());
        u.setHeightCm(r.heightCm());
        u.setWeightKg(r.weightKg());
        return me(userId);
    }

    private static Set<String> clean(Set<String> in, Map<String, String> valid, String what) {
        Set<String> out = new HashSet<>();
        if (in == null) return out;
        for (String s : in) {
            if (!valid.containsKey(s)) throw new InvalidDataException("Valor no válido en " + what + ": " + s);
            out.add(s);
        }
        return out;
    }

    /** Guarda las preferencias. Si ya hay un plan, anota qué cambió para pedir "Actualizar mi plan". */
    @Transactional
    @Override
    public MeResponse updatePreferences(Long userId, PreferencesRequest r) {
        User u = user(userId);
        if (!Catalog.BUDGETS.containsKey(r.budget())) throw new InvalidDataException("Elegí un presupuesto");
        if (!Catalog.LEVELS.containsKey(r.level())) throw new InvalidDataException("Elegí tu nivel");
        Set<String> goals = clean(r.goals(), Catalog.GOALS, "objetivos");
        Set<String> avoid = clean(r.avoid(), Catalog.AVOID, "alimentos");
        Set<String> health = clean(r.health(), Catalog.HEALTH, "salud");
        Set<String> acts = clean(r.activities(), Catalog.ACTIVITIES, "actividades");
        Set<String> equip = clean(r.equipment(), Catalog.EQUIPMENT, "equipamiento");
        if (equip.contains("nada")) equip = new HashSet<>(Set.of("nada"));
        String other = r.otherAvoid() == null ? "" : r.otherAvoid().trim();

        Preferences p = prefsRepo.findByUserId(userId).orElse(null);
        boolean hasPlan = plans.findByUserId(userId).isPresent();
        List<String> labels = new ArrayList<>();
        if (p == null) {
            p = new Preferences();
            p.setUser(u);
        } else if (hasPlan) {
            if (!p.getGoals().equals(goals)) labels.add("Tus objetivos");
            if (!p.getDays().equals(new HashSet<>(r.days())) || p.getMinutes() != r.minutes()) labels.add("Tus días y tiempo");
            if (!Objects.equals(p.getBudget(), r.budget())) labels.add("Tu presupuesto");
            if (!p.getEquipment().equals(equip)) labels.add("Tu equipamiento");
            if (!Objects.equals(p.getLevel(), r.level())) labels.add("Tu nivel");
            if (!p.getAvoid().equals(avoid) || !Objects.equals(p.getOtherAvoid(), other)) labels.add("Tus alimentos");
            if (!p.getActivities().equals(acts)) labels.add("Tus actividades");
            if (!p.getHealth().equals(health)) labels.add("Tu salud");
        }
        p.setGoals(goals);
        p.setDays(new HashSet<>(r.days()));
        p.setMinutes(r.minutes());
        p.setBudget(r.budget());
        p.setActivities(acts);
        p.setAvoid(avoid);
        p.setOtherAvoid(other);
        p.setHealth(health);
        p.setLevel(r.level());
        p.setEquipment(equip);
        p.getPendingChanges().addAll(labels);
        prefsRepo.save(p);
        return me(userId);
    }

    public static PreferencesResponse toDto(Preferences p) {
        return new PreferencesResponse(new HashSet<>(p.getGoals()), p.getDays().stream().sorted().toList(), p.getMinutes(), p.getBudget(),
                new HashSet<>(p.getActivities()), new HashSet<>(p.getAvoid()), p.getOtherAvoid(), new HashSet<>(p.getHealth()),
                p.getLevel(), new HashSet<>(p.getEquipment()), new HashSet<>(p.getPendingChanges()));
    }

    public static PlanResponse planDto(Plan plan, Preferences p) {
        return new PlanResponse(plan.getStartDate(), plan.getDays().stream().sorted().toList(), plan.getMinutes(), plan.getLevel(),
                Catalog.levelName(plan.getLevel()), trainingSummary(p), foodSummary(p), healthNotes(p));
    }

    public static String trainingSummary(Preferences p) {
        List<String> kinds = new ArrayList<>();
        Set<String> a = p.getActivities();
        if (a.contains("pesas") || p.getGoals().contains("fuerza") || a.isEmpty()) kinds.add("fuerza");
        if (a.contains("caminar")) kinds.add("caminata");
        if (a.contains("correr")) kinds.add("trote");
        if (a.contains("yoga")) kinds.add("yoga");
        if (a.contains("baile")) kinds.add("baile");
        if (a.contains("bici")) kinds.add("bici");
        List<String> k = kinds.subList(0, Math.min(3, kinds.size()));
        String txt = k.size() > 1 ? String.join(", ", k.subList(0, k.size() - 1)) + " y " + k.get(k.size() - 1) : k.get(0);
        String where = p.getEquipment().contains("gym") ? "en el gimnasio" : "en casa";
        String lv = switch (p.getLevel()) { case "intermedio" -> "de nivel intermedio"; case "avanzado" -> "de nivel avanzado"; default -> "para principiantes"; };
        return "Rutinas de " + txt + " " + where + ", " + lv + ".";
    }

    public static String foodSummary(Preferences p) {
        List<String> av = p.getAvoid().stream().map(k -> Catalog.AVOID.get(k).replaceFirst("^Sin", "sin")).sorted().toList();
        return "Comidas simples" + (av.isEmpty() ? "" : ", " + String.join(", ", av)) + ", dentro de tu presupuesto.";
    }

    public static List<String> healthNotes(Preferences p) {
        List<String> out = new ArrayList<>();
        if (p.getHealth().contains("diabetes")) out.add("Elegimos comidas sin azúcar agregada. Consultá con tu médico o nutricionista.");
        if (p.getHealth().contains("presion")) out.add("Priorizamos comidas bajas en sal y ejercicio moderado.");
        if (p.getHealth().contains("embarazo")) out.add("Entrenamientos suaves y de bajo impacto. Pedí el OK de tu médico antes de empezar.");
        if (p.getHealth().contains("lesion")) out.add("Evitamos ejercicios de impacto. Si algo duele, pará y consultá.");
        if (!out.isEmpty()) out.add("WopFit no reemplaza a un profesional de la salud.");
        return out;
    }
}
