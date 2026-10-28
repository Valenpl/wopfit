package com.wopfit.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Post;

public interface PostRepository extends JpaRepository<Post, Long> {
    /** Con los autores en la misma consulta. */
    @EntityGraph(attributePaths = "author")
    List<Post> findAllByOrderByCreatedAtDesc();

    /** Un tipo de publicación, de a una página, las más nuevas primero. */
    @EntityGraph(attributePaths = "author")
    Page<Post> findByTypeOrderByCreatedAtDesc(String type, Pageable pageable);
}
