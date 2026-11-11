package com.wopfit.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.entity.CommunityProfile;
import com.wopfit.entity.DemoProfile;
import com.wopfit.entity.Preferences;
import com.wopfit.entity.User;
import com.wopfit.repository.CommunityProfileRepository;
import com.wopfit.repository.DemoProfileRepository;
import com.wopfit.repository.PreferencesRepository;
import com.wopfit.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import com.wopfit.service.support.Catalog;

@Service
@RequiredArgsConstructor
public class CommunityProfileServiceImpl implements CommunityProfileService {
    private final CommunityProfileRepository profiles;
    private final DemoProfileRepository demos;
    private final UserRepository users;
    private final PreferencesRepository prefs;

    /** "Lucía Fernández" → "Lucía F.": en la comunidad se ve el nombre y la inicial del apellido. */
    public static String displayName(String full) {
        if (full == null || full.isBlank()) return "Vos";
        String[] p = full.trim().split("\\s+");
        return p.length == 1 ? p[0] : p[0] + " " + Character.toUpperCase(p[p.length - 1].charAt(0)) + ".";
    }

    /** Los objetivos siempre en el orden del catálogo: el primero es el principal. */
    private static List<String> ordered(Set<String> goals) {
        return Catalog.GOALS.keySet().stream().filter(goals::contains).toList();
    }

    @Override
    @Transactional
    public void create(User user) {
        if (profiles.findByUserId(user.getId()).isPresent()) return;
        CommunityProfile c = new CommunityProfile();
        c.setUser(user);
        profiles.save(c);
    }

    @Override
    @Transactional(readOnly = true)
    public Person person(CommunityProfile profile) {
        return people(List.of(profile)).get(profile.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Person> people(Collection<CommunityProfile> list) {
        List<Long> userIds = list.stream().filter(c -> c.getUser() != null).map(c -> c.getUser().getId()).toList();
        List<Long> demoIds = list.stream().filter(c -> c.getUser() == null).map(CommunityProfile::getId).toList();
        Map<Long, Preferences> prefsByUser = new HashMap<>();
        prefs.findByUserIdIn(userIds).forEach(p -> prefsByUser.put(p.getUser().getId(), p));
        Map<Long, DemoProfile> demoById = new HashMap<>();
        demos.findAllById(demoIds).forEach(d -> demoById.put(d.getId(), d));

        Map<Long, Person> out = new HashMap<>();
        for (CommunityProfile c : list) {
            if (c.getUser() == null) {
                DemoProfile d = demoById.get(c.getId());
                out.put(c.getId(), new Person(d.getName(), ordered(d.getGoals()), d.getDaysPerWeek()));
            } else {
                Preferences p = prefsByUser.get(c.getUser().getId());
                out.put(c.getId(), new Person(displayName(c.getUser().getName()), p == null ? List.of() : ordered(p.getGoals()), p == null ? 0 : p.getDays().size()));
            }
        }
        return out;
    }

    @Override
    @Transactional
    public int createMissing() {
        var missing = users.findWithNameAndNoCommunityProfile();
        missing.forEach(this::create);
        return missing.size();
    }
}
