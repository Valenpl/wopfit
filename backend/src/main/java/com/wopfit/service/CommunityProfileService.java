package com.wopfit.service;

import com.wopfit.entity.Preferences;
import com.wopfit.entity.User;

/**
 * El perfil de cada persona en la comunidad (nombre con inicial y objetivos).
 * Se escribe solo cuando cambian el nombre o las preferencias: las pantallas de Comunidad lo leen y nunca lo crean,
 * así dos pedidos que llegan juntos no chocan al crearlo.
 */
public interface CommunityProfileService {
    /** Crea o actualiza el perfil con el nombre y los objetivos de la persona. `prefs` puede ser null (todavía no las cargó). */
    void sync(User user, Preferences prefs);

    /** Al arrancar: crea el perfil de quienes ya tenían nombre y todavía no lo tienen (usuarios de antes de este cambio). */
    int createMissing();
}
