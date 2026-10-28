package com.wopfit.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.wopfit.entity.PostComment;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    @EntityGraph(attributePaths = "author")
    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    long countByPostId(Long postId);
    /** [id de la publicación, cantidad de comentarios]. */
    @Query("select c.post.id, count(c) from PostComment c group by c.post.id")
    List<Object[]> countByPost();
    void deleteByPostId(Long postId);
}
