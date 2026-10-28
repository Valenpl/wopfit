package com.wopfit.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.PostMark;

public interface PostMarkRepository extends JpaRepository<PostMark, Long> {
    Optional<PostMark> findByPostIdAndProfileIdAndKind(Long postId, Long profileId, String kind);
    long countByPostIdAndKind(Long postId, String kind);
    List<PostMark> findByProfileIdAndKind(Long profileId, String kind);
    void deleteByPostId(Long postId);
}
