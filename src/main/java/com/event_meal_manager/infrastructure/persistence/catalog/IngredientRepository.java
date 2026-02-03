package com.event_meal_manager.infrastructure.persistence.catalog;

import com.event_meal_manager.domain.catalog.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    List<Ingredient> findByIngredientNameContainingIgnoreCase(String ingredientName);
}
