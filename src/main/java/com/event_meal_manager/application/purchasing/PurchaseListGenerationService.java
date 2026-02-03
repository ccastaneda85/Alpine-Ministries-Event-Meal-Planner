package com.event_meal_manager.application.purchasing;

import com.event_meal_manager.domain.catalog.MenuEntry;
import com.event_meal_manager.domain.catalog.MenuItemRecipe;
import com.event_meal_manager.domain.planning.EventDay;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPlan;
import com.event_meal_manager.domain.purchasing.PurchaseList;
import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import com.event_meal_manager.domain.services.AttendanceTotalsCalculator;
import com.event_meal_manager.domain.services.IngredientAggregationService;
import com.event_meal_manager.domain.services.PortionCalculator;
import com.event_meal_manager.domain.services.PurchaseListBuilder;
import com.event_meal_manager.infrastructure.persistence.planning.MealPlanRepository;
import com.event_meal_manager.infrastructure.persistence.purchasing.PurchaseListRepository;
import com.event_meal_manager.infrastructure.persistence.reservation.GroupMealAttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PurchaseListGenerationService {

    private final MealPlanRepository mealPlanRepository;
    private final PurchaseListRepository purchaseListRepository;
    private final GroupMealAttendanceRepository groupMealAttendanceRepository;
    private final PortionCalculator portionCalculator;
    private final IngredientAggregationService ingredientAggregationService;
    private final AttendanceTotalsCalculator attendanceTotalsCalculator;
    private final PurchaseListBuilder purchaseListBuilder;

    @Transactional
    public PurchaseList generateFromMealPlan(Long mealPlanId) {
        MealPlan mealPlan = mealPlanRepository.findById(mealPlanId)
            .orElseThrow(() -> new IllegalArgumentException("MealPlan not found: " + mealPlanId));

        Map<String, IngredientAggregationService.AggregatedIngredient> aggregated = new HashMap<>();

        for (EventDay eventDay : mealPlan.getEventDays()) {
            for (MealPeriod mealPeriod : eventDay.getMealPeriods()) {
                if (mealPeriod.getMenu() == null) {
                    continue;
                }

                List<GroupMealAttendance> attendances = groupMealAttendanceRepository
                    .findByMealPeriodMealPeriodId(mealPeriod.getMealPeriodId());

                AttendanceTotalsCalculator.AttendanceTotals totals = attendanceTotalsCalculator.calculateTotals(attendances);

                for (MenuEntry menuEntry : mealPeriod.getMenu().getMenuEntries()) {
                    for (MenuItemRecipe recipe : menuEntry.getMenuItem().getRecipes()) {
                        float quantity = portionCalculator.calculateTotalPortion(
                            recipe,
                            totals.adultCount(),
                            totals.youthCount(),
                            totals.kidCount(),
                            totals.codeCount()
                        );

                        aggregated = ingredientAggregationService.aggregateWithId(
                            aggregated,
                            recipe.getIngredient().getIngredientName(),
                            recipe.getIngredient().getUnitOfMeasure(),
                            quantity,
                            recipe.getIngredient().getIngredientId()
                        );
                    }
                }
            }
        }

        PurchaseList purchaseList = purchaseListBuilder.buildFromAggregatedIngredients(mealPlan, aggregated);
        return purchaseListRepository.save(purchaseList);
    }

    @Transactional
    public PurchaseList createEmptyForMealPlan(Long mealPlanId) {
        MealPlan mealPlan = mealPlanRepository.findById(mealPlanId)
            .orElseThrow(() -> new IllegalArgumentException("MealPlan not found: " + mealPlanId));

        PurchaseList purchaseList = purchaseListBuilder.buildEmpty(mealPlan);
        return purchaseListRepository.save(purchaseList);
    }
}
