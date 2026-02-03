package com.event_meal_manager.infrastructure.persistence.planning;

import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPeriodType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MealPeriodRepository extends JpaRepository<MealPeriod, Long> {

    List<MealPeriod> findByEventDayEventDayId(Long eventDayId);

    Optional<MealPeriod> findByEventDayEventDayIdAndMealPeriodType(Long eventDayId, MealPeriodType type);

    List<MealPeriod> findByMenuMenuId(Long menuId);
}
