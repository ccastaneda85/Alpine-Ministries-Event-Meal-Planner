package com.event_meal_manager.application.mealperiod;

import com.event_meal_manager.domain.mealperiod.MealPeriod;
import com.event_meal_manager.domain.mealperiod.MealPeriodType;
import com.event_meal_manager.domain.menu.Menu;
import com.event_meal_manager.infrastructure.persistence.mealperiod.MealPeriodRepository;
import com.event_meal_manager.infrastructure.persistence.menu.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MealPeriodService {

    private final MealPeriodRepository mealPeriodRepository;
    private final MenuRepository menuRepository;

    public MealPeriod getMealPeriodById(Long id) {
        return mealPeriodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MealPeriod not found with id: " + id));
    }

    public List<MealPeriod> getMealPeriodsByDay(Long dayId) {
        return mealPeriodRepository.findByDayId(dayId);
    }

    public MealPeriod assignMenuToMealPeriod(Long mealPeriodId, Long menuId) {
        MealPeriod mealPeriod = getMealPeriodById(mealPeriodId);
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new RuntimeException("Menu not found with id: " + menuId));

        mealPeriod.setMenu(menu);
        return mealPeriodRepository.save(mealPeriod);
    }

    public MealPeriod clearMenuFromMealPeriod(Long mealPeriodId) {
        MealPeriod mealPeriod = getMealPeriodById(mealPeriodId);
        mealPeriod.setMenu(null);
        return mealPeriodRepository.save(mealPeriod);
    }

    public MealPeriod getMealPeriodByDayAndType(Long dayId, MealPeriodType type) {
        return mealPeriodRepository.findByDayIdAndMealPeriodType(dayId, type)
                .orElseThrow(() -> new RuntimeException(
                        "MealPeriod not found for day: " + dayId + " and type: " + type));
    }
}
