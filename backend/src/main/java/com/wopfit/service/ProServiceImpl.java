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

import com.wopfit.entity.Consultation;
import com.wopfit.entity.Professional;
import com.wopfit.entity.dto.BookResponse;
import com.wopfit.entity.dto.ConsultResponse;
import com.wopfit.entity.dto.ProDetailResponse;
import com.wopfit.entity.dto.ProResponse;
import com.wopfit.entity.dto.ProsResponse;
import com.wopfit.entity.dto.Slot;
import com.wopfit.entity.dto.SlotDay;
import com.wopfit.exceptions.ConsultationNotFoundException;
import com.wopfit.exceptions.InvalidDataException;
import com.wopfit.exceptions.LimitReachedException;
import com.wopfit.exceptions.PremiumRequiredException;
import com.wopfit.exceptions.ProfessionalNotFoundException;
import com.wopfit.exceptions.SlotTakenException;
import com.wopfit.repository.ConsultationRepository;
import com.wopfit.repository.ProfessionalRepository;
import com.wopfit.repository.UserRepository;

@Service
public class ProServiceImpl implements ProService {
    private static final int DAYS = 4;

    private final ProfessionalRepository pros;
    private final ConsultationRepository consults;
    private final UserRepository users;
    private final PremiumService premium;
    private final TimeService time;

    public ProServiceImpl(ProfessionalRepository pros, ConsultationRepository consults, UserRepository users, PremiumService premium, TimeService time) {
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
            if (TimeServiceImpl.dow(d) < 6) out.add(d);
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

    private static ProResponse dto(Professional p, List<SlotDay> agenda) {
        LocalDate nd = null;
        String nt = null;
        outer:
        for (SlotDay d : agenda) {
            for (Slot s : d.slots()) {
                if (s.free()) { nd = d.date(); nt = s.time(); break outer; }
            }
        }
        return new ProResponse(p.getId(), p.getKind(), p.getName(), p.getSpecialty(), p.getLicense(), p.getRating(), p.getExperience(), p.getBio(), nd, nt);
    }

    private static ConsultResponse dto(Consultation c) {
        Professional p = c.getProfessional();
        return new ConsultResponse(c.getId(), p.getId(), p.getName(), p.getSpecialty(), c.getDate(), c.getTime(), c.getMode());
    }

    private Professional pro(Long id) {
        return pros.findById(id).orElseThrow(() -> new ProfessionalNotFoundException());
    }

    @Transactional(readOnly = true)
    @Override
    public ProsResponse list(Long userId) {
        List<ConsultResponse> mine = consults.findByUserIdAndDateGreaterThanEqualOrderByDateAscTimeAsc(userId, time.today()).stream().map(ProServiceImpl::dto).toList();
        List<LocalDate> days = days();
        Set<String> taken = taken(days, null); // una consulta para todos los profesionales
        List<ProResponse> all = pros.findAll().stream().sorted(Comparator.comparing(Professional::getId)).map(p -> dto(p, agenda(p, days, taken))).toList();
        boolean pr = premium.isPremium(userId);
        return new ProsResponse(pr, premium.consultsLeft(userId, pr), PremiumService.CONSULTS_PER_MONTH, mine, all);
    }

    @Transactional(readOnly = true)
    @Override
    public ProDetailResponse detail(Long userId, Long proId) {
        Professional p = pro(proId);
        List<SlotDay> agenda = agenda(p);
        boolean pr = premium.isPremium(userId);
        return new ProDetailResponse(dto(p, agenda), agenda, MODES, pr, premium.consultsLeft(userId, pr));
    }

    @Transactional
    @Override
    public BookResponse book(Long userId, Long proId, LocalDate date, String t, String mode) {
        Professional p = pro(proId);
        if (!premium.isPremium(userId)) throw new PremiumRequiredException("Las consultas con profesionales están incluidas en Premium");
        if (premium.consultsLeft(userId, true) <= 0) throw new LimitReachedException("Ya usaste tus 2 consultas de este mes");
        if (!MODES.contains(mode)) throw new InvalidDataException("Elegí videollamada o chat");
        SlotDay day = agenda(p).stream().filter(d -> d.date().equals(date)).findFirst()
                .orElseThrow(() -> new InvalidDataException("Elegí uno de los próximos días con turnos"));
        Slot slot = day.slots().stream().filter(s -> s.time().equals(t)).findFirst()
                .orElseThrow(() -> new InvalidDataException("Elegí uno de los horarios disponibles"));
        if (!slot.free()) throw new SlotTakenException();
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
    @Override
    public void cancel(Long userId, Long consultId) {
        Consultation c = consults.findById(consultId).filter(x -> x.getUser().getId().equals(userId))
                .orElseThrow(() -> new ConsultationNotFoundException());
        if (c.getDate().isBefore(time.today())) throw new InvalidDataException("Esa consulta ya pasó");
        consults.delete(c);
    }
}
