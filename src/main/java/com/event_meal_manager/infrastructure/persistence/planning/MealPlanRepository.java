package com.event_meal_manager.infrastructure.persistence.planning;

import com.event_meal_manager.domain.planning.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    List<MealPlan> findByStartDateBetween(LocalDate start, LocalDate end);

    List<MealPlan> findByNameContainingIgnoreCase(String name);
}
