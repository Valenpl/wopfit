package com.wopfit.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.wopfit.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    /** Usuarios con nombre que todavía no tienen perfil en la comunidad. */
    @Query("select u from User u where u.name is not null and not exists (select c from CommunityProfile c where c.user = u)")
    List<User> findWithNameAndNoCommunityProfile();
}
