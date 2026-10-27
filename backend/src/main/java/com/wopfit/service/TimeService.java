package com.wopfit.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

import org.springframework.stereotype.Service;

/** "Hoy" según Buenos Aires. Se puede reemplazar el reloj en los tests. */
@Service
public class TimeService {
    public static final ZoneId ZONE = ZoneId.of("America/Argentina/Buenos_Aires");
    private Clock clock = Clock.system(ZONE);

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    public LocalTime now() {
        return LocalTime.now(clock);
    }

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
