package com.event_meal_manager.presentation.catalog;

import com.event_meal_manager.application.catalog.MenuItemRecipeService;
import com.event_meal_manager.domain.catalog.MenuItemRecipe;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-item-recipes")
@RequiredArgsConstructor
public class MenuItemRecipeController {

    private final MenuItemRecipeService menuItemRecipeService;

    @GetMapping("/menu-item/{menuItemId}")
    public List<MenuItemRecipe> findByMenuItemId(@PathVariable Long menuItemId) {
        return menuItemRecipeService.findByMenuItemId(menuItemId);
    }

    @GetMapping("/ingredient/{ingredientId}")
    public List<MenuItemRecipe> findByIngredientId(@PathVariable Long ingredientId) {
        return menuItemRecipeService.findByIngredientId(ingredientId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItemRecipe> findById(@PathVariable Long id) {
        return menuItemRecipeService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MenuItemRecipe> create(@RequestBody CreateMenuItemRecipeRequest request) {
        MenuItemRecipe recipe = menuItemRecipeService.create(
            request.menuItemId(),
            request.ingredientId(),
            request.adultPortion(),
            request.youthPortion(),
            request.kidPortion(),
            request.codePortion(),
            request.notes()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(recipe);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuItemRecipe> update(@PathVariable Long id, @RequestBody UpdateMenuItemRecipeRequest request) {
        MenuItemRecipe recipe = menuItemRecipeService.update(
            id,
            request.adultPortion(),
            request.youthPortion(),
            request.kidPortion(),
            request.codePortion(),
            request.notes()
        );
        return ResponseEntity.ok(recipe);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuItemRecipeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateMenuItemRecipeRequest(
        Long menuItemId,
        Long ingredientId,
        float adultPortion,
        float youthPortion,
        float kidPortion,
        float codePortion,
        String notes
    ) {}

    public record UpdateMenuItemRecipeRequest(
        float adultPortion,
        float youthPortion,
        float kidPortion,
        float codePortion,
        String notes
    ) {}
}
