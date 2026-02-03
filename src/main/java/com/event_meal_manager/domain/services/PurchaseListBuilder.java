package com.event_meal_manager.domain.services;

import com.event_meal_manager.domain.planning.MealPlan;
import com.event_meal_manager.domain.purchasing.PurchaseList;
import com.event_meal_manager.domain.purchasing.PurchaseListItem;
import com.event_meal_manager.domain.purchasing.PurchaseListStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class PurchaseListBuilder {

    public PurchaseList buildFromAggregatedIngredients(
            MealPlan mealPlan,
            Map<String, IngredientAggregationService.AggregatedIngredient> aggregatedIngredients) {

        PurchaseList purchaseList = PurchaseList.builder()
            .mealPlan(mealPlan)
            .generatedAt(LocalDateTime.now())
            .status(PurchaseListStatus.DRAFT)
            .items(new ArrayList<>())
            .build();

        List<PurchaseListItem> items = aggregatedIngredients.values().stream()
            .map(agg -> PurchaseListItem.builder()
                .purchaseList(purchaseList)
                .purchaseListItemName(agg.ingredientName())
                .quantity(agg.quantity())
                .uom(agg.uom())
                .ingredientId(agg.ingredientId())
                .checked(false)
                .build())
            .toList();

        purchaseList.getItems().addAll(items);
        return purchaseList;
    }

    public PurchaseList buildEmpty(MealPlan mealPlan) {
        return PurchaseList.builder()
            .mealPlan(mealPlan)
            .generatedAt(LocalDateTime.now())
            .status(PurchaseListStatus.DRAFT)
            .items(new ArrayList<>())
            .build();
    }
}
