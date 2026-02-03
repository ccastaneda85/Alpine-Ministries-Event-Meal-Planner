package com.event_meal_manager.application.planning;

import com.event_meal_manager.domain.catalog.Menu;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPeriodType;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuRepository;
import com.event_meal_manager.infrastructure.persistence.planning.MealPeriodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MealPeriodService {

    private final MealPeriodRepository mealPeriodRepository;
    private final MenuRepository menuRepository;

    public List<MealPeriod> findAll() {
        return mealPeriodRepository.findAll();
    }

    public Optional<MealPeriod> findById(Long id) {
        return mealPeriodRepository.findById(id);
    }

    public List<MealPeriod> findByEventDayId(Long eventDayId) {
        return mealPeriodRepository.findByEventDayEventDayId(eventDayId);
    }

    public Optional<MealPeriod> findByEventDayIdAndType(Long eventDayId, MealPeriodType type) {
        return mealPeriodRepository.findByEventDayEventDayIdAndMealPeriodType(eventDayId, type);
    }

    @Transactional
    public MealPeriod assignMenu(Long mealPeriodId, Long menuId) {
        MealPeriod mealPeriod = mealPeriodRepository.findById(mealPeriodId)
            .orElseThrow(() -> new IllegalArgumentException("MealPeriod not found: " + mealPeriodId));

        Menu menu = menuRepository.findById(menuId)
            .orElseThrow(() -> new IllegalArgumentException("Menu not found: " + menuId));

        mealPeriod.setMenu(menu);
        return mealPeriodRepository.save(mealPeriod);
    }

    @Transactional
    public MealPeriod clearMenu(Long mealPeriodId) {
        MealPeriod mealPeriod = mealPeriodRepository.findById(mealPeriodId)
            .orElseThrow(() -> new IllegalArgumentException("MealPeriod not found: " + mealPeriodId));

        mealPeriod.setMenu(null);
        return mealPeriodRepository.save(mealPeriod);
    }
}
