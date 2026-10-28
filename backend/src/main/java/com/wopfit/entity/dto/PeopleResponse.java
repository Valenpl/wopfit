package com.wopfit.entity.dto;

import java.util.List;

/** Personas como vos, más tu perfil de la comunidad (`me`) y tu objetivo principal. */
public record PeopleResponse(Long me, String myGoal, String myGoalName, List<PersonResponse> people) {}
