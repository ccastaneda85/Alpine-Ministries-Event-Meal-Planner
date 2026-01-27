package com.event_meal_manager.infrastructure.persistence.menu;

import com.event_meal_manager.domain.menu.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    Optional<Ingredient> findByIngredientName(String ingredientName);
}
