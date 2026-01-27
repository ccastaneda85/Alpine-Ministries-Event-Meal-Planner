package com.event_meal_manager.infrastructure.persistence.session;

import com.event_meal_manager.domain.session.Day;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DayRepository extends JpaRepository<Day, Long> {

    Optional<Day> findByDate(LocalDate date);

    boolean existsByDate(LocalDate date);

    List<Day> findByDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT d FROM Day d WHERE d.date >= :startDate AND d.date <= :endDate ORDER BY d.date")
    List<Day> findDaysInRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
