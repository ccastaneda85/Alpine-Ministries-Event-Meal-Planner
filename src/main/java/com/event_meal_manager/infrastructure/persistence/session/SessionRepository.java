package com.event_meal_manager.infrastructure.persistence.session;

import com.event_meal_manager.domain.session.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    List<Session> findByStartDateBetween(LocalDate start, LocalDate end);

    List<Session> findByEndDateAfter(LocalDate date);
}
