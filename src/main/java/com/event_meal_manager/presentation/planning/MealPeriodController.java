package com.event_meal_manager.presentation.planning;

import com.event_meal_manager.application.planning.MealPeriodService;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPeriodType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meal-periods")
@RequiredArgsConstructor
public class MealPeriodController {

    private final MealPeriodService mealPeriodService;

    @GetMapping
    public List<MealPeriod> findAll() {
        return mealPeriodService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MealPeriod> findById(@PathVariable Long id) {
        return mealPeriodService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/event-day/{eventDayId}")
    public List<MealPeriod> findByEventDayId(@PathVariable Long eventDayId) {
        return mealPeriodService.findByEventDayId(eventDayId);
    }

    @GetMapping("/event-day/{eventDayId}/type/{type}")
    public ResponseEntity<MealPeriod> findByEventDayIdAndType(
            @PathVariable Long eventDayId,
            @PathVariable MealPeriodType type) {
        return mealPeriodService.findByEventDayIdAndType(eventDayId, type)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/menu")
    public ResponseEntity<MealPeriod> assignMenu(@PathVariable Long id, @RequestBody AssignMenuRequest request) {
        MealPeriod mealPeriod = mealPeriodService.assignMenu(id, request.menuId());
        return ResponseEntity.ok(mealPeriod);
    }

    @DeleteMapping("/{id}/menu")
    public ResponseEntity<MealPeriod> clearMenu(@PathVariable Long id) {
        MealPeriod mealPeriod = mealPeriodService.clearMenu(id);
        return ResponseEntity.ok(mealPeriod);
    }

    public record AssignMenuRequest(Long menuId) {}
}
