package com.event_meal_manager.infrastructure.persistence.mealperiod;

import com.event_meal_manager.domain.mealperiod.MealPeriod;
import com.event_meal_manager.domain.mealperiod.MealPeriodType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MealPeriodRepository extends JpaRepository<MealPeriod, Long> {

    List<MealPeriod> findByDayId(Long dayId);

    Optional<MealPeriod> findByDayIdAndMealPeriodType(Long dayId, MealPeriodType type);
}
