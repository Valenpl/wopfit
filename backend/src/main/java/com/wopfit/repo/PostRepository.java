package com.wopfit.repo;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.Post;

public interface PostRepository extends JpaRepository<Post, Long> {
    /** Con los autores en la misma consulta. */
    @EntityGraph(attributePaths = "author")
    List<Post> findAllByOrderByCreatedAtDesc();
}
