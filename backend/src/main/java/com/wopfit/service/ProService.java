package com.wopfit.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.domain.Consultation;
import com.wopfit.domain.Professional;
import com.wopfit.repo.ConsultationRepository;
import com.wopfit.repo.ProfessionalRepository;
import com.wopfit.repo.UserRepository;
import com.wopfit.web.dto.Dtos.BookResponse;
import com.wopfit.web.dto.Dtos.ConsultDto;
import com.wopfit.web.dto.Dtos.ProDetailDto;
import com.wopfit.web.dto.Dtos.ProDto;
import com.wopfit.web.dto.Dtos.ProsDto;
import com.wopfit.web.dto.Dtos.Slot;
import com.wopfit.web.dto.Dtos.SlotDay;

/**
 * Ayuda profesional: nutricionistas y entrenadores de ejemplo, sus turnos y las reservas.
 * Con Premium hay 2 consultas por mes. La agenda trae algunos turnos ya ocupados para que la demo se vea real.
 */
@Service
public class ProService {
    public static final List<String> TIMES = List.of("10:00", "14:30", "18:00", "19:00", "20:30");
    public static final List<String> MODES = List.of("Videollamada", "Chat");
    private static final int DAYS = 4;

    private final ProfessionalRepository pros;
    private final ConsultationRepository consults;
    private final UserRepository users;
    private final PremiumService premium;
    private final TimeService time;

    public ProService(ProfessionalRepository pros, ConsultationRepository consults, UserRepository users, PremiumService premium, TimeService time) {
        this.pros = pros;
        this.consults = consults;
        this.users = users;
        this.premium = premium;
        this.time = time;
    }

    /** Los próximos 4 días con atención (de lunes a sábado), desde mañana. */
    List<LocalDate> days() {
        List<LocalDate> out = new ArrayList<>();
        for (LocalDate d = time.today().plusDays(1); out.size() < DAYS; d = d.plusDays(1)) {
            if (TimeService.dow(d) < 6) out.add(d);
        }
        return out;
    }

    /** Turnos que ya vienen ocupados en la demo: siempre los mismos para un profesional, día y hora (~3 de cada 10). */
    static boolean demoBusy(Long proId, LocalDate date, String t) {
        return Math.floorMod(Objects.hash(proId, date.toString(), t), 10) < 3;
    }

    private static String key(Long proId, LocalDate d, String t) {
        return proId + " " + d + " " + t;
    }

    /** Turnos ya reservados en los próximos días ("profesional fecha hora"), de uno o de todos los profesionales. */
    private Set<String> taken(List<LocalDate> days, Long proId) {
        LocalDate from = days.get(0), to = days.get(days.size() - 1);
        List<Consultation> list = proId == null ? consults.findByDateBetween(from, to) : consults.findByProfessionalIdAndDateBetween(proId, from, to);
        Set<String> out = new HashSet<>();
        list.forEach(c -> out.add(key(c.getProfessional().getId(), c.getDate(), c.getTime())));
        return out;
    }

    private static List<SlotDay> agenda(Professional p, List<LocalDate> days, Set<String> taken) {
        return days.stream().map(d -> new SlotDay(d, TIMES.stream()
                .map(t -> new Slot(t, !taken.contains(key(p.getId(), d, t)) && !demoBusy(p.getId(), d, t))).toList())).toList();
    }

    private List<SlotDay> agenda(Professional p) {
        List<LocalDate> days = days();
        return agenda(p, days, taken(days, p.getId()));
    }

    private static ProDto dto(Professional p, List<SlotDay> agenda) {
        LocalDate nd = null;
        String nt = null;
        outer:
        for (SlotDay d : agenda) {
            for (Slot s : d.slots()) {
                if (s.free()) { nd = d.date(); nt = s.time(); break outer; }
            }
        }
        return new ProDto(p.getId(), p.getKind(), p.getName(), p.getSpecialty(), p.getLicense(), p.getRating(), p.getExperience(), p.getBio(), nd, nt);
    }

    private static ConsultDto dto(Consultation c) {
        Professional p = c.getProfessional();
        return new ConsultDto(c.getId(), p.getId(), p.getName(), p.getSpecialty(), c.getDate(), c.getTime(), c.getMode());
    }

    private Professional pro(Long id) {
        return pros.findById(id).orElseThrow(() -> ApiException.notFound("No encontramos ese profesional"));
    }

    @Transactional(readOnly = true)
    public ProsDto list(Long userId) {
        List<ConsultDto> mine = consults.findByUserIdAndDateGreaterThanEqualOrderByDateAscTimeAsc(userId, time.today()).stream().map(ProService::dto).toList();
        List<LocalDate> days = days();
        Set<String> taken = taken(days, null); // una consulta para todos los profesionales
        List<ProDto> all = pros.findAll().stream().sorted(Comparator.comparing(Professional::getId)).map(p -> dto(p, agenda(p, days, taken))).toList();
        boolean pr = premium.isPremium(userId);
        return new ProsDto(pr, premium.consultsLeft(userId, pr), PremiumService.CONSULTS_PER_MONTH, mine, all);
    }

    @Transactional(readOnly = true)
    public ProDetailDto detail(Long userId, Long proId) {
        Professional p = pro(proId);
        List<SlotDay> agenda = agenda(p);
        boolean pr = premium.isPremium(userId);
        return new ProDetailDto(dto(p, agenda), agenda, MODES, pr, premium.consultsLeft(userId, pr));
    }

    @Transactional
    public BookResponse book(Long userId, Long proId, LocalDate date, String t, String mode) {
        Professional p = pro(proId);
        if (!premium.isPremium(userId)) throw ApiException.forbidden("Las consultas con profesionales están incluidas en Premium");
        if (premium.consultsLeft(userId, true) <= 0) throw ApiException.conflict("Ya usaste tus 2 consultas de este mes");
        if (!MODES.contains(mode)) throw ApiException.badRequest("Elegí videollamada o chat");
        SlotDay day = agenda(p).stream().filter(d -> d.date().equals(date)).findFirst()
                .orElseThrow(() -> ApiException.badRequest("Elegí uno de los próximos días con turnos"));
        Slot slot = day.slots().stream().filter(s -> s.time().equals(t)).findFirst()
                .orElseThrow(() -> ApiException.badRequest("Elegí uno de los horarios disponibles"));
        if (!slot.free()) throw ApiException.conflict("Ese turno ya está ocupado. Elegí otro horario.");
        Consultation c = new Consultation();
        c.setUser(users.getReferenceById(userId));
        c.setProfessional(p);
        c.setDate(date);
        c.setTime(t);
        c.setMode(mode);
        c.setBookedOn(time.today());
        consults.save(c);
        return new BookResponse(dto(c), premium.consultsLeft(userId, true));
    }

    /** Cancelar una consulta que todavía no pasó: libera el turno y devuelve el cupo del mes. */
    @Transactional
    public void cancel(Long userId, Long consultId) {
        Consultation c = consults.findById(consultId).filter(x -> x.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("No encontramos esa consulta"));
        if (c.getDate().isBefore(time.today())) throw ApiException.badRequest("Esa consulta ya pasó");
        consults.delete(c);
    }
}
