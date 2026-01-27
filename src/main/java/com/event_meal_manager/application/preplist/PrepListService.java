package com.event_meal_manager.application.preplist;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.event_meal_manager.application.session.DayService;
import com.event_meal_manager.application.session.DayService.HeadCount;
import com.event_meal_manager.domain.mealperiod.MealPeriod;
import com.event_meal_manager.domain.menu.Ingredient;
import com.event_meal_manager.domain.preplist.PrepList;
import com.event_meal_manager.domain.services.PortionCalculator;
import com.event_meal_manager.domain.session.Day;
import com.event_meal_manager.infrastructure.persistence.preplist.PrepListRepository;
import com.event_meal_manager.infrastructure.persistence.session.DayRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PrepListService {

    private final PrepListRepository prepListRepository;
    private final DayRepository dayRepository;
    private final DayService dayService;
    private final PortionCalculator portionCalculator;

    public PrepList generatePrepListForDay(Long dayId) {
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new RuntimeException("Day not found with id: " + dayId));

        // Calculate headcounts dynamically from GroupEvents
        HeadCount headCount = dayService.calculateHeadcountForDate(day.getDate());

        StringBuilder notes = new StringBuilder();
        notes.append("Prep List for ").append(day.getDate()).append("\n\n");
        notes.append("Headcount - Adults: ").append(headCount.adults())
                .append(", Youth: ").append(headCount.youth())
                .append(", Kids: ").append(headCount.kids()).append("\n\n");

        for (MealPeriod mealPeriod : day.getMealPeriods()) {
            notes.append(mealPeriod.getMealPeriodType()).append(":\n");

            if (mealPeriod.getMenu() != null) {
                notes.append("Menu: ").append(mealPeriod.getMenu().getMenuName()).append("\n");

                Map<Ingredient, Float> ingredients =
                        portionCalculator.calculateIngredientsForMenu(
                                mealPeriod.getMenu(),
                                headCount.adults(),
                                headCount.youth(),
                                headCount.kids()
                        );

                notes.append("Ingredients:\n");
                ingredients.forEach((ingredient, quantity) ->
                        notes.append("  - ").append(ingredient.getIngredientName())
                                .append(": ").append(quantity)
                                .append(" ").append(ingredient.getUnitOfMeasure())
                                .append("\n"));
            } else {
                notes.append("No menu assigned\n");
            }
            notes.append("\n");
        }

        PrepList prepList = day.getPrepList();
        if (prepList == null) {
            prepList = PrepList.builder()
                    .day(day)
                    .notes(notes.toString())
                    .build();
        } else {
            prepList.setNotes(notes.toString());
        }

        return prepListRepository.save(prepList);
    }

    public PrepList getPrepListById(Long id) {
        return prepListRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PrepList not found with id: " + id));
    }

    public PrepList getPrepListByDay(Long dayId) {
        return prepListRepository.findByDayId(dayId)
                .orElseThrow(() -> new RuntimeException("PrepList not found for day: " + dayId));
    }
}
