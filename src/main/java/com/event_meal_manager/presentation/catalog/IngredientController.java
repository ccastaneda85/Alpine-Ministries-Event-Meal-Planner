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
    public List<IngredientDTO> findAll() {
        return ingredientService.findAll().stream().map(this::toDTO).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<IngredientDTO> findById(@PathVariable Long id) {
        return ingredientService.findById(id)
            .map(i -> ResponseEntity.ok(toDTO(i)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<IngredientDTO> search(@RequestParam String name) {
        return ingredientService.search(name).stream().map(this::toDTO).toList();
    }

    @PostMapping
    public ResponseEntity<IngredientDTO> create(@RequestBody CreateIngredientRequest request) {
        Ingredient ingredient = ingredientService.create(request.ingredientName(), request.unitOfMeasure());
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(ingredient));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateIngredientRequest request) {
        try {
            Ingredient ingredient = ingredientService.update(id, request.ingredientName(), request.unitOfMeasure());
            return ResponseEntity.ok(toDTO(ingredient));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    private IngredientDTO toDTO(Ingredient i) {
        return new IngredientDTO(i.getIngredientId(), i.getIngredientName(), i.getUnitOfMeasure());
    }

    public record IngredientDTO(Long ingredientId, String ingredientName, String unitOfMeasure) {}

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        try {
            ingredientService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    public record CreateIngredientRequest(String ingredientName, String unitOfMeasure) {}
    public record UpdateIngredientRequest(String ingredientName, String unitOfMeasure) {}
}
