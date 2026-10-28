package com.wopfit.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Lo que la persona cuenta en el onboarding: objetivos, tiempo, presupuesto, gustos, salud y equipamiento. Los días van de 0 (lunes) a 6 (domingo). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "preferences", uniqueConstraints = @UniqueConstraint(name = "uk_preferences_user", columnNames = "user_id"))
public class Preferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_preferences_user"))
    private User user;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_goals", joinColumns = @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_preference_goal_preferences")))
    @Column(name = "goal")
    private Set<String> goals = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_days", joinColumns = @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_preference_day_preferences")))
    @Column(name = "day_of_week")
    private Set<Integer> days = new HashSet<>();

    @Column(name = "minutes_per_session")
    private int minutes;

    @Column(length = 10)
    private String budget;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_activities", joinColumns = @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_preference_activity_preferences")))
    @Column(name = "activity")
    private Set<String> activities = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_avoid", joinColumns = @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_preference_avoid_preferences")))
    @Column(name = "food")
    private Set<String> avoid = new HashSet<>();

    @Column(length = 80)
    private String otherAvoid;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_health", joinColumns = @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_preference_health_preferences")))
    @Column(name = "condition_code")
    private Set<String> health = new HashSet<>();

    @Column(length = 20)
    private String level;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_equipment", joinColumns = @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_preference_equipment_preferences")))
    @Column(name = "item")
    private Set<String> equipment = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "preference_pending", joinColumns = @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_preference_pending_preferences")))
    @Column(name = "label")
    private Set<String> pendingChanges = new HashSet<>();
}
