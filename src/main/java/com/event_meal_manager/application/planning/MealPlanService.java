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
import java.util.Set;
import java.util.stream.Collectors;

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

        mealPlan = mealPlanRepository.save(mealPlan);
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

        // Remove event days that fall outside the new date range
        mealPlan.getEventDays().removeIf(day ->
            day.getDate().isBefore(startDate) || day.getDate().isAfter(endDate));

        // Add event days for any dates in the new range not already present
        Set<LocalDate> existingDates = mealPlan.getEventDays().stream()
            .map(EventDay::getDate)
            .collect(Collectors.toSet());

        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            if (!existingDates.contains(current)) {
                final LocalDate date = current;
                Optional<EventDay> existingDay = eventDayRepository.findFirstByDate(date);
                if (existingDay.isPresent() && existingDay.get().getMealPlan() == null) {
                    EventDay existing = existingDay.get();
                    existing.setMealPlan(mealPlan);
                    mealPlan.getEventDays().add(existing);
                } else if (existingDay.isEmpty()) {
                    EventDay eventDay = EventDay.builder()
                        .date(date)
                        .mealPlan(mealPlan)
                        .mealPeriods(new ArrayList<>())
                        .build();
                    initializeMealPeriods(eventDay);
                    mealPlan.getEventDays().add(eventDay);
                }
            }
            current = current.plusDays(1);
        }

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
