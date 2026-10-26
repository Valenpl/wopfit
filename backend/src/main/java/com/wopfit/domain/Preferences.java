package com.wopfit.domain;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

/** Lo que la persona cuenta en el onboarding: objetivos, tiempo, presupuesto, gustos, salud y equipamiento. Los días van de 0 (lunes) a 6 (domingo). */
@Entity
@Table(name = "preferences")
public class Preferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_goals", joinColumns = @JoinColumn(name = "owner_id"))
    @Column(name = "goal")
    private Set<String> goals = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_days", joinColumns = @JoinColumn(name = "owner_id"))
    @Column(name = "day_of_week")
    private Set<Integer> days = new HashSet<>();

    @Column(name = "minutes_per_session")
    private int minutes;

    @Column(length = 10)
    private String budget;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_activities", joinColumns = @JoinColumn(name = "owner_id"))
    @Column(name = "activity")
    private Set<String> activities = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_avoid", joinColumns = @JoinColumn(name = "owner_id"))
    @Column(name = "food")
    private Set<String> avoid = new HashSet<>();

    @Column(length = 80)
    private String otherAvoid;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_health", joinColumns = @JoinColumn(name = "owner_id"))
    @Column(name = "condition_code")
    private Set<String> health = new HashSet<>();

    @Column(length = 20)
    private String level;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_equipment", joinColumns = @JoinColumn(name = "owner_id"))
    @Column(name = "item")
    private Set<String> equipment = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_pending", joinColumns = @JoinColumn(name = "owner_id"))
    @Column(name = "label")
    private Set<String> pendingChanges = new HashSet<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Set<String> getGoals() { return goals; }
    public void setGoals(Set<String> goals) { this.goals = goals; }

    public Set<Integer> getDays() { return days; }
    public void setDays(Set<Integer> days) { this.days = days; }

    public int getMinutes() { return minutes; }
    public void setMinutes(int minutes) { this.minutes = minutes; }

    public String getBudget() { return budget; }
    public void setBudget(String budget) { this.budget = budget; }

    public Set<String> getActivities() { return activities; }
    public void setActivities(Set<String> activities) { this.activities = activities; }

    public Set<String> getAvoid() { return avoid; }
    public void setAvoid(Set<String> avoid) { this.avoid = avoid; }

    public String getOtherAvoid() { return otherAvoid; }
    public void setOtherAvoid(String otherAvoid) { this.otherAvoid = otherAvoid; }

    public Set<String> getHealth() { return health; }
    public void setHealth(Set<String> health) { this.health = health; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public Set<String> getEquipment() { return equipment; }
    public void setEquipment(Set<String> equipment) { this.equipment = equipment; }

    public Set<String> getPendingChanges() { return pendingChanges; }
    public void setPendingChanges(Set<String> pendingChanges) { this.pendingChanges = pendingChanges; }
}
