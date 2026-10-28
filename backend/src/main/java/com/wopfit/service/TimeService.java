package com.wopfit.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

/** "Hoy" según Buenos Aires. Se puede reemplazar el reloj en los tests. */
public interface TimeService {
    ZoneId ZONE = ZoneId.of("America/Argentina/Buenos_Aires");

    LocalDate today();
    LocalTime now();
    void setClock(Clock clock);
}
