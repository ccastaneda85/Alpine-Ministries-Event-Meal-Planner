package com.event_meal_manager.domain.services;

import com.event_meal_manager.domain.catalog.MenuItemRecipe;
import org.springframework.stereotype.Component;

@Component
public class PortionCalculator {

    public float calculateTotalPortion(MenuItemRecipe recipe, int adultCount, int youthCount, int kidCount, int codeCount) {
        float total = 0.0f;
        total += recipe.getAdultPortion() * adultCount;
        total += recipe.getYouthPortion() * youthCount;
        total += recipe.getKidPortion() * kidCount;
        total += recipe.getCodePortion() * codeCount;
        return total;
    }

    public float calculateAdultPortions(MenuItemRecipe recipe, int count) {
        return recipe.getAdultPortion() * count;
    }

    public float calculateYouthPortions(MenuItemRecipe recipe, int count) {
        return recipe.getYouthPortion() * count;
    }

    public float calculateKidPortions(MenuItemRecipe recipe, int count) {
        return recipe.getKidPortion() * count;
    }

    public float calculateCodePortions(MenuItemRecipe recipe, int count) {
        return recipe.getCodePortion() * count;
    }
}
