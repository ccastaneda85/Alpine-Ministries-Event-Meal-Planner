package com.event_meal_manager.presentation.catalog;

import com.event_meal_manager.application.catalog.IngredientService;
import com.event_meal_manager.domain.catalog.Ingredient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
public class IngredientController {

    private final IngredientService ingredientService;

    @GetMapping
    public List<Ingredient> findAll() {
        return ingredientService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ingredient> findById(@PathVariable Long id) {
        return ingredientService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Ingredient> search(@RequestParam String name) {
        return ingredientService.search(name);
    }

    @PostMapping
    public ResponseEntity<Ingredient> create(@RequestBody CreateIngredientRequest request) {
        Ingredient ingredient = ingredientService.create(request.ingredientName(), request.unitOfMeasure());
        return ResponseEntity.status(HttpStatus.CREATED).body(ingredient);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ingredient> update(@PathVariable Long id, @RequestBody UpdateIngredientRequest request) {
        Ingredient ingredient = ingredientService.update(id, request.ingredientName(), request.unitOfMeasure());
        return ResponseEntity.ok(ingredient);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ingredientService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateIngredientRequest(String ingredientName, String unitOfMeasure) {}
    public record UpdateIngredientRequest(String ingredientName, String unitOfMeasure) {}
}
