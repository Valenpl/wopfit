package com.wopfit.entity.dto;

import java.time.LocalDate;
import java.util.List;

public record ShoppingResponse(LocalDate monday, int weekCost, int budgetMax, List<ShoppingItem> items) {}
