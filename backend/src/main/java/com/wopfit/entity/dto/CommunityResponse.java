package com.wopfit.entity.dto;

import java.util.List;

/** `myGoal`: el objetivo con el que se publica. */
public record CommunityResponse(Long me, String myGoal, String myGoalName, List<PersonResponse> people, List<PostResponse> posts) {}
