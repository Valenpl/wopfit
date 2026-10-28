package com.wopfit.entity.dto;

import java.time.LocalDate;
import java.util.List;

public record SlotDay(LocalDate date, List<Slot> slots) {}
