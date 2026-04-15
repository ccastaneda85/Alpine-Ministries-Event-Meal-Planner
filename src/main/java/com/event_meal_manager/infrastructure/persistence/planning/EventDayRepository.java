package com.event_meal_manager.infrastructure.persistence.planning;

import com.event_meal_manager.domain.planning.EventDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventDayRepository extends JpaRepository<EventDay, Long> {

    List<EventDay> findByDate(LocalDate date);

    Optional<EventDay> findFirstByDate(LocalDate date);

    List<EventDay> findByDateBetween(LocalDate start, LocalDate end);

    List<EventDay> findByMealPlanMealPlanId(Long mealPlanId);

    @Query("SELECT ed FROM EventDay ed WHERE ed.mealPlan IS NULL AND NOT EXISTS (" +
           "SELECT gma FROM GroupMealAttendance gma WHERE gma.mealPeriod.eventDay = ed)")
    List<EventDay> findOrphanedEventDays();
}
