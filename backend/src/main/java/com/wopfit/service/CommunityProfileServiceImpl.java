package com.wopfit.service;

import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.entity.CommunityProfile;
import com.wopfit.entity.Preferences;
import com.wopfit.entity.User;
import com.wopfit.repository.CommunityProfileRepository;
import com.wopfit.repository.PreferencesRepository;
import com.wopfit.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommunityProfileServiceImpl implements CommunityProfileService {
    private final CommunityProfileRepository profiles;
    private final UserRepository users;
    private final PreferencesRepository prefs;

    /** "Lucía Fernández" → "Lucía F.": en la comunidad se ve el nombre y la inicial del apellido. */
    public static String displayName(String full) {
        if (full == null || full.isBlank()) return "Vos";
        String[] p = full.trim().split("\\s+");
        return p.length == 1 ? p[0] : p[0] + " " + Character.toUpperCase(p[p.length - 1].charAt(0)) + ".";
    }

    @Override
    @Transactional
    public void sync(User user, Preferences p) {
        CommunityProfile c = profiles.findByUserId(user.getId()).orElseGet(() -> {
            CommunityProfile n = new CommunityProfile();
            n.setUser(user);
            return n;
        });
        String name = displayName(user.getName());
        String goals = p == null ? c.getGoals() : String.join(",", Catalog.GOALS.keySet().stream().filter(p.getGoals()::contains).toList());
        int days = p == null ? c.getDaysPerWeek() : p.getDays().size();
        if (c.getId() != null && name.equals(c.getName()) && Objects.equals(goals, c.getGoals()) && days == c.getDaysPerWeek()) return;
        c.setName(name);
        c.setGoals(goals);
        c.setDaysPerWeek(days);
        profiles.save(c);
    }

    @Override
    @Transactional
    public int createMissing() {
        var missing = users.findWithNameAndNoCommunityProfile();
        missing.forEach(u -> sync(u, prefs.findByUserId(u.getId()).orElse(null)));
        return missing.size();
    }
}
