package com.event_meal_manager.application.planning;

import com.event_meal_manager.domain.planning.MealPlan;
import com.event_meal_manager.infrastructure.persistence.planning.MealPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;

    public List<MealPlan> findAll() {
        return mealPlanRepository.findAll();
    }

    public Optional<MealPlan> findById(Long id) {
        return mealPlanRepository.findById(id);
    }

    @Transactional
    public MealPlan create(String name, LocalDate startDate, LocalDate endDate) {
        MealPlan mealPlan = MealPlan.builder()
            .name(name)
            .startDate(startDate)
            .endDate(endDate)
            .build();
        return mealPlanRepository.save(mealPlan);
    }

    @Transactional
    public MealPlan update(Long id, String name, LocalDate startDate, LocalDate endDate) {
        MealPlan mealPlan = mealPlanRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("MealPlan not found: " + id));

        mealPlan.setName(name);
        mealPlan.setStartDate(startDate);
        mealPlan.setEndDate(endDate);

        return mealPlanRepository.save(mealPlan);
    }

    @Transactional
    public void delete(Long id) {
        mealPlanRepository.deleteById(id);
    }
}
