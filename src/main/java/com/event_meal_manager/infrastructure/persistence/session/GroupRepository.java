package com.event_meal_manager.infrastructure.persistence.session;

import com.event_meal_manager.domain.session.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    Optional<Group> findByName(String name);

    boolean existsByName(String name);
}
