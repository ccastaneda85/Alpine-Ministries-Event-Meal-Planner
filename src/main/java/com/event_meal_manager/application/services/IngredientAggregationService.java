package com.event_meal_manager.application.services;

import com.event_meal_manager.application.session.DayService;
import com.event_meal_manager.application.session.DayService.HeadCount;
import com.event_meal_manager.domain.mealperiod.MealPeriod;
import com.event_meal_manager.domain.menu.Ingredient;
import com.event_meal_manager.domain.services.PortionCalculator;
import com.event_meal_manager.domain.session.Day;
import com.event_meal_manager.domain.session.Session;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IngredientAggregationService {

    private final PortionCalculator portionCalculator;
    private final DayService dayService;

    public Map<Ingredient, Float> aggregateIngredientsForSession(Session session) {
        Map<Ingredient, Float> aggregatedIngredients = new HashMap<>();

        for (Day day : session.getDays()) {
            HeadCount headCount = dayService.calculateHeadcountForDate(day.getDate());

            for (MealPeriod mealPeriod : day.getMealPeriods()) {
                if (mealPeriod.getMenu() != null) {
                    Map<Ingredient, Float> dayIngredients =
                            portionCalculator.calculateIngredientsForMenu(
                                    mealPeriod.getMenu(),
                                    headCount.adults(),
                                    headCount.youth(),
                                    headCount.kids()
                            );

                    dayIngredients.forEach((ingredient, quantity) ->
                            aggregatedIngredients.merge(ingredient, quantity, Float::sum));
                }
            }
        }

        return aggregatedIngredients;
    }

    public Map<Ingredient, Float> aggregateIngredientsForDateRange(
            Session session, LocalDate startDate, LocalDate endDate) {
        Map<Ingredient, Float> aggregatedIngredients = new HashMap<>();

        List<Day> daysInRange = session.getDays().stream()
                .filter(day -> !day.getDate().isBefore(startDate) && !day.getDate().isAfter(endDate))
                .toList();

        for (Day day : daysInRange) {
            HeadCount headCount = dayService.calculateHeadcountForDate(day.getDate());

            for (MealPeriod mealPeriod : day.getMealPeriods()) {
                if (mealPeriod.getMenu() != null) {
                    Map<Ingredient, Float> dayIngredients =
                            portionCalculator.calculateIngredientsForMenu(
                                    mealPeriod.getMenu(),
                                    headCount.adults(),
                                    headCount.youth(),
                                    headCount.kids()
                            );

                    dayIngredients.forEach((ingredient, quantity) ->
                            aggregatedIngredients.merge(ingredient, quantity, Float::sum));
                }
            }
        }

        return aggregatedIngredients;
    }
}
