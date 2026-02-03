package com.event_meal_manager.application.catalog;

import com.event_meal_manager.domain.catalog.Ingredient;
import com.event_meal_manager.domain.catalog.MenuItem;
import com.event_meal_manager.domain.catalog.MenuItemRecipe;
import com.event_meal_manager.infrastructure.persistence.catalog.IngredientRepository;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuItemRecipeRepository;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MenuItemRecipeService {

    private final MenuItemRecipeRepository menuItemRecipeRepository;
    private final MenuItemRepository menuItemRepository;
    private final IngredientRepository ingredientRepository;

    public List<MenuItemRecipe> findByMenuItemId(Long menuItemId) {
        return menuItemRecipeRepository.findByMenuItemMenuItemId(menuItemId);
    }

    public List<MenuItemRecipe> findByIngredientId(Long ingredientId) {
        return menuItemRecipeRepository.findByIngredientIngredientId(ingredientId);
    }

    public Optional<MenuItemRecipe> findById(Long id) {
        return menuItemRecipeRepository.findById(id);
    }

    @Transactional
    public MenuItemRecipe create(Long menuItemId, Long ingredientId, float adultPortion,
                                  float youthPortion, float kidPortion, float codePortion, String notes) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
            .orElseThrow(() -> new IllegalArgumentException("MenuItem not found: " + menuItemId));

        Ingredient ingredient = ingredientRepository.findById(ingredientId)
            .orElseThrow(() -> new IllegalArgumentException("Ingredient not found: " + ingredientId));

        MenuItemRecipe recipe = MenuItemRecipe.builder()
            .menuItem(menuItem)
            .ingredient(ingredient)
            .adultPortion(adultPortion)
            .youthPortion(youthPortion)
            .kidPortion(kidPortion)
            .codePortion(codePortion)
            .notes(notes)
            .build();

        return menuItemRecipeRepository.save(recipe);
    }

    @Transactional
    public MenuItemRecipe update(Long id, float adultPortion, float youthPortion,
                                  float kidPortion, float codePortion, String notes) {
        MenuItemRecipe recipe = menuItemRecipeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("MenuItemRecipe not found: " + id));

        recipe.setAdultPortion(adultPortion);
        recipe.setYouthPortion(youthPortion);
        recipe.setKidPortion(kidPortion);
        recipe.setCodePortion(codePortion);
        recipe.setNotes(notes);

        return menuItemRecipeRepository.save(recipe);
    }

    @Transactional
    public void delete(Long id) {
        menuItemRecipeRepository.deleteById(id);
    }
}
