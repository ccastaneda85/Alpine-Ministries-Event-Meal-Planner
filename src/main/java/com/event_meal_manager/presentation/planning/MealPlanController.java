package com.event_meal_manager.presentation.planning;

import com.event_meal_manager.application.planning.MealPlanService;
import com.event_meal_manager.domain.planning.MealPlan;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meal-plans")
@RequiredArgsConstructor
public class MealPlanController {

    private final MealPlanService mealPlanService;

    @GetMapping
    public List<MealPlan> findAll() {
        return mealPlanService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MealPlan> findById(@PathVariable Long id) {
        return mealPlanService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MealPlan> create(@RequestBody CreateMealPlanRequest request) {
        MealPlan mealPlan = mealPlanService.create(request.name(), request.startDate(), request.endDate());
        return ResponseEntity.status(HttpStatus.CREATED).body(mealPlan);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MealPlan> update(@PathVariable Long id, @RequestBody UpdateMealPlanRequest request) {
        MealPlan mealPlan = mealPlanService.update(id, request.name(), request.startDate(), request.endDate());
        return ResponseEntity.ok(mealPlan);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        mealPlanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateMealPlanRequest(String name, LocalDate startDate, LocalDate endDate) {}
    public record UpdateMealPlanRequest(String name, LocalDate startDate, LocalDate endDate) {}
}
