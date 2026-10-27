package com.wopfit.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.PostComment;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    long countByPostId(Long postId);
    void deleteByPostId(Long postId);
}
