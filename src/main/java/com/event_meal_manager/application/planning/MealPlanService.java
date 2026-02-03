package com.event_meal_manager.application.planning;

import com.event_meal_manager.domain.planning.EventDay;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPeriodType;
import com.event_meal_manager.domain.planning.MealPlan;
import com.event_meal_manager.infrastructure.persistence.planning.EventDayRepository;
import com.event_meal_manager.infrastructure.persistence.planning.MealPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final EventDayRepository eventDayRepository;

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
            .eventDays(new ArrayList<>())
            .build();

        initializeEventDays(mealPlan, startDate, endDate);
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

    private void initializeEventDays(MealPlan mealPlan, LocalDate startDate, LocalDate endDate) {
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            final LocalDate dateToProcess = current;
            Optional<EventDay> existingDay = eventDayRepository.findFirstByDate(dateToProcess);

            EventDay eventDay;
            if (existingDay.isPresent()) {
                EventDay existing = existingDay.get();
                if (existing.getMealPlan() == null) {
                    // Standalone EventDay - associate it with this MealPlan
                    existing.setMealPlan(mealPlan);
                    mealPlan.getEventDays().add(existing);
                }
                // If already has a MealPlan, skip it (don't steal from another MealPlan)
            } else {
                // Create new EventDay for this date
                eventDay = EventDay.builder()
                    .date(dateToProcess)
                    .mealPlan(mealPlan)
                    .mealPeriods(new ArrayList<>())
                    .build();
                initializeMealPeriods(eventDay);
                mealPlan.getEventDays().add(eventDay);
            }

            current = current.plusDays(1);
        }
    }

    private void initializeMealPeriods(EventDay eventDay) {
        for (MealPeriodType type : MealPeriodType.values()) {
            MealPeriod mealPeriod = MealPeriod.builder()
                .eventDay(eventDay)
                .mealPeriodType(type)
                .build();
            eventDay.getMealPeriods().add(mealPeriod);
        }
    }
}
