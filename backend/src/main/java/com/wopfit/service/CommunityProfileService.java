package com.wopfit.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import com.wopfit.entity.CommunityProfile;
import com.wopfit.entity.User;

/**
 * El perfil de cada persona en la comunidad. Solo guarda a quién representa: los datos salen de la cuenta y las
 * preferencias, o de DemoProfile en las personas de ejemplo.
 * Se crea cuando cambian el nombre o las preferencias: las pantallas de Comunidad lo leen y nunca lo crean,
 * así dos pedidos que llegan juntos no chocan al crearlo.
 */
public interface CommunityProfileService {
    /** Lo que se muestra de una persona en la comunidad. */
    record Person(String name, List<String> goals, int daysPerWeek) {}

    /** Crea el perfil de la persona si todavía no lo tiene. */
    void create(User user);

    Person person(CommunityProfile profile);

    /** Varias personas de una vez, por id de perfil, sin consultar por cada una. */
    Map<Long, Person> people(Collection<CommunityProfile> profiles);

    /** Al arrancar: crea el perfil de quienes ya tenían nombre y todavía no lo tienen (usuarios de antes de este cambio). */
    int createMissing();
}
