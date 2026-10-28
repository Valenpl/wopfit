package com.wopfit.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** "Me gusta" (like) o "Guardado" (save) de una persona en una publicación. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "post_marks", uniqueConstraints = @UniqueConstraint(name = "uk_post_mark", columnNames = {"post_id", "profile_id", "kind"}))
public class PostMark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", foreignKey = @ForeignKey(name = "fk_post_mark_post"))
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id", foreignKey = @ForeignKey(name = "fk_post_mark_profile"))
    private CommunityProfile profile;

    @Column(nullable = false, length = 5)
    private String kind;
}
