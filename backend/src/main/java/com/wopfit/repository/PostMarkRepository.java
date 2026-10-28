package com.wopfit.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.wopfit.entity.PostMark;

public interface PostMarkRepository extends JpaRepository<PostMark, Long> {
    Optional<PostMark> findByPostIdAndProfileIdAndKind(Long postId, Long profileId, String kind);
    long countByPostIdAndKind(Long postId, String kind);
    /** [id de la publicación, cantidad de me gusta]. */
    @Query("select m.post.id, count(m) from PostMark m where m.kind = 'like' group by m.post.id")
    List<Object[]> countLikesByPost();
    List<PostMark> findByProfileIdAndKind(Long profileId, String kind);
    void deleteByPostId(Long postId);
}
