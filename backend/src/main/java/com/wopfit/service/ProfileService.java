package com.wopfit.service;

import com.wopfit.entity.Preferences;
import com.wopfit.entity.User;
import com.wopfit.entity.dto.AboutRequest;
import com.wopfit.entity.dto.MeResponse;
import com.wopfit.entity.dto.PreferencesRequest;

public interface ProfileService {
    User user(Long id);
    Preferences prefs(Long userId);
    MeResponse me(Long userId);
    MeResponse updateAbout(Long userId, AboutRequest r);
    MeResponse updatePreferences(Long userId, PreferencesRequest r);
}
