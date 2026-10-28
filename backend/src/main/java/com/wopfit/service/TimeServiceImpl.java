package com.wopfit.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.stereotype.Service;

@Service
public class TimeServiceImpl implements TimeService {
    private Clock clock = Clock.system(ZONE);

    @Override
    public LocalDate today() {
        return LocalDate.now(clock);
    }

    @Override
    public LocalTime now() {
        return LocalTime.now(clock);
    }

    @Override
    public void setClock(Clock clock) {
        this.clock = clock;
    }

    /** 0 = lunes … 6 = domingo. */
    public static int dow(LocalDate d) {
        return d.getDayOfWeek().getValue() - 1;
    }

    public static LocalDate monday(LocalDate d) {
        return d.minusDays(dow(d));
    }
}
