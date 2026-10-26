package com.wopfit.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/** Meta concreta (ej. caminar 20 min, 3 veces por semana durante 4 semanas). Suma al objetivo del mismo nombre. */
@Entity
@Table(name = "goals")
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 20)
    private String objective;

    @Column(nullable = false, length = 120)
    private String what;

    private int timesPerWeek;

    private int weeks;

    @Column(nullable = false)
    private LocalDate startDate;

    private boolean done;

    private LocalDate doneAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "goal_checks", joinColumns = @JoinColumn(name = "goal_id"))
    @Column(name = "check_date")
    private Set<LocalDate> checks = new HashSet<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }

    public String getWhat() { return what; }
    public void setWhat(String what) { this.what = what; }

    public int getTimesPerWeek() { return timesPerWeek; }
    public void setTimesPerWeek(int timesPerWeek) { this.timesPerWeek = timesPerWeek; }

    public int getWeeks() { return weeks; }
    public void setWeeks(int weeks) { this.weeks = weeks; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }

    public LocalDate getDoneAt() { return doneAt; }
    public void setDoneAt(LocalDate doneAt) { this.doneAt = doneAt; }

    public Set<LocalDate> getChecks() { return checks; }
    public void setChecks(Set<LocalDate> checks) { this.checks = checks; }
}
