package com.event_meal_manager.presentation.mealperiod;

import com.event_meal_manager.application.mealperiod.MealPeriodService;
import com.event_meal_manager.domain.mealperiod.MealPeriod;
import com.event_meal_manager.domain.mealperiod.MealPeriodType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mealperiods")
@RequiredArgsConstructor
public class MealPeriodController {

    private final MealPeriodService mealPeriodService;

    @GetMapping("/{id}")
    public ResponseEntity<MealPeriod> getMealPeriod(@PathVariable Long id) {
        MealPeriod mealPeriod = mealPeriodService.getMealPeriodById(id);
        return ResponseEntity.ok(mealPeriod);
    }

    @GetMapping("/day/{dayId}")
    public ResponseEntity<List<MealPeriod>> getMealPeriodsByDay(@PathVariable Long dayId) {
        List<MealPeriod> mealPeriods = mealPeriodService.getMealPeriodsByDay(dayId);
        return ResponseEntity.ok(mealPeriods);
    }

    @GetMapping("/day/{dayId}/type/{type}")
    public ResponseEntity<MealPeriod> getMealPeriodByDayAndType(
            @PathVariable Long dayId,
            @PathVariable MealPeriodType type) {
        MealPeriod mealPeriod = mealPeriodService.getMealPeriodByDayAndType(dayId, type);
        return ResponseEntity.ok(mealPeriod);
    }

    @PutMapping("/{id}/menu/{menuId}")
    public ResponseEntity<MealPeriod> assignMenu(
            @PathVariable Long id,
            @PathVariable Long menuId) {
        MealPeriod mealPeriod = mealPeriodService.assignMenuToMealPeriod(id, menuId);
        return ResponseEntity.ok(mealPeriod);
    }

    @DeleteMapping("/{id}/menu")
    public ResponseEntity<MealPeriod> clearMenu(@PathVariable Long id) {
        MealPeriod mealPeriod = mealPeriodService.clearMenuFromMealPeriod(id);
        return ResponseEntity.ok(mealPeriod);
    }
}
