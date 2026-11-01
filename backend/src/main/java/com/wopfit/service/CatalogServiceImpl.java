package com.wopfit.service;

import org.springframework.stereotype.Service;

import com.wopfit.entity.dto.CatalogResponse;
import com.wopfit.service.support.Catalog;

@Service
public class CatalogServiceImpl implements CatalogService {
    @Override
    public CatalogResponse catalog() {
        return new CatalogResponse(Catalog.GOALS, Catalog.ACTIVITIES, Catalog.AVOID, Catalog.HEALTH, Catalog.EQUIPMENT, Catalog.LEVELS,
                Catalog.BUDGETS, Catalog.WORKOUT_REASONS, Catalog.MEAL_REASONS, Catalog.GOAL_OPTIONS, Catalog.PREMIUM_PERIODS,
                Catalog.PLACE_CATEGORIES, Catalog.OFFER_CATEGORIES);
    }
}
