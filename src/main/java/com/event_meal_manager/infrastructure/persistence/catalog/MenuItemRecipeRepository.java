package com.event_meal_manager.infrastructure.persistence.catalog;

import com.event_meal_manager.domain.catalog.MenuItemRecipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRecipeRepository extends JpaRepository<MenuItemRecipe, Long> {

    List<MenuItemRecipe> findByMenuItemMenuItemId(Long menuItemId);

    List<MenuItemRecipe> findByIngredientIngredientId(Long ingredientId);
}
