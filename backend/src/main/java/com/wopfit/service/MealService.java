package com.wopfit.service;

import java.time.LocalDate;
import java.util.Set;

import com.wopfit.entity.Plan;
import com.wopfit.entity.dto.MealDayResponse;
import com.wopfit.entity.dto.MealProposalResponse;
import com.wopfit.entity.dto.ShoppingResponse;

/** Plan de comidas: qué toca en cada momento del día, registros y alternativas. */
public interface MealService {
    MealDayResponse day(Long userId, LocalDate date);
    ShoppingResponse shopping(Long userId, LocalDate date);
    Set<String> weekIngredients(Long userId, LocalDate date);
    ShoppingResponse check(Long userId, LocalDate date, String name, boolean on);
    MealDayResponse eaten(Long userId, LocalDate date, int slot);
    MealProposalResponse report(Long userId, LocalDate date, int slot, String reason);
    MealDayResponse accept(Long userId, LocalDate date, int slot, String name);
    MealDayResponse skip(Long userId, LocalDate date, int slot);
    MealDayResponse swap(Long userId, LocalDate date, int slot);
}
