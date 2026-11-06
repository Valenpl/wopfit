package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Plan vigente: días, duración y nivel. generatedUntil marca hasta qué fecha ya se crearon sesiones. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "plans", uniqueConstraints = @UniqueConstraint(name = "uk_plan_user", columnNames = "user_id"))
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_plan_user"))
    private User user;

    @Column(nullable = false)
    private LocalDate startDate;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "plan_days", joinColumns = @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_plan_day_plan")))
    @Column(name = "day_of_week")
    private Set<Integer> days = new HashSet<>();

    @Column(name = "minutes_per_session")
    private int minutes;

    @Column(length = 20)
    private String level;

    @Column(nullable = false)
    private LocalDate generatedUntil;

    private LocalDate adjustSeenWeek;

    private LocalDate lightenSeenWeek;

    private Instant updatedAt;

    // Lo que propuso Wopi con IA (vacío si no hubo IA): qué rutina va cada día, por qué y consejos.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "plan_day_templates", joinColumns = @JoinColumn(name = "plan_id", foreignKey = @ForeignKey(name = "fk_plan_day_template_plan")))
    @MapKeyColumn(name = "day_of_week")
    @Column(name = "template", nullable = false)
    private Map<Integer, Integer> dayTemplates = new HashMap<>();

    @Column(length = 600)
    private String aiSummary;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "plan_ai_tips", joinColumns = @JoinColumn(name = "plan_id", foreignKey = @ForeignKey(name = "fk_plan_ai_tip_plan")))
    @OrderColumn(name = "position")
    @Column(name = "tip", nullable = false, length = 200)
    private List<String> aiTips = new ArrayList<>();
}
