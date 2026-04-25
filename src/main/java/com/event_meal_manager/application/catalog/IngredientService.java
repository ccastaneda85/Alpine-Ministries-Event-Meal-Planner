package com.event_meal_manager.application.catalog;

import com.event_meal_manager.domain.catalog.Ingredient;
import com.event_meal_manager.domain.catalog.MenuItemRecipe;
import com.event_meal_manager.infrastructure.persistence.catalog.IngredientRepository;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuItemRecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final MenuItemRecipeRepository menuItemRecipeRepository;

    public List<Ingredient> findAll() {
        return ingredientRepository.findAllByOrderByIngredientNameAsc();
    }

    public Optional<Ingredient> findById(Long id) {
        return ingredientRepository.findById(id);
    }

    public List<Ingredient> search(String name) {
        return ingredientRepository.findByIngredientNameContainingIgnoreCase(name);
    }

    @Transactional
    public Ingredient create(String ingredientName, String unitOfMeasure) {
        Ingredient ingredient = Ingredient.builder()
            .ingredientName(ingredientName)
            .unitOfMeasure(unitOfMeasure)
            .recipes(new ArrayList<>())
            .build();

        return ingredientRepository.save(ingredient);
    }

    @Transactional
    public Ingredient update(Long id, String ingredientName, String unitOfMeasure) {
        List<MenuItemRecipe> usages = menuItemRecipeRepository.findByIngredientIngredientId(id);
        if (!usages.isEmpty()) {
            String names = usages.stream()
                .map(r -> r.getMenuItem().getMenuItemName())
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .collect(Collectors.joining(", "));
            throw new IllegalStateException(
                "Cannot edit: ingredient is used in the following menu item(s): " + names
                + ". Remove it from those recipes first."
            );
        }

        Ingredient ingredient = ingredientRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Ingredient not found: " + id));

        ingredient.setIngredientName(ingredientName);
        ingredient.setUnitOfMeasure(unitOfMeasure);
        return ingredientRepository.save(ingredient);
    }

    @Transactional
    public void delete(Long id) {
        List<MenuItemRecipe> usages = menuItemRecipeRepository.findByIngredientIngredientId(id);
        if (!usages.isEmpty()) {
            String names = usages.stream()
                .map(r -> r.getMenuItem().getMenuItemName())
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .collect(Collectors.joining(", "));
            throw new IllegalStateException(
                "Cannot delete: ingredient is used in the following menu item(s): " + names
                + ". Remove it from those recipes first."
            );
        }
        ingredientRepository.deleteById(id);
    }
}
