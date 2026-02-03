package com.event_meal_manager.presentation.planning;

import com.event_meal_manager.application.planning.EventDayService;
import com.event_meal_manager.domain.planning.EventDay;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/event-days")
@RequiredArgsConstructor
public class EventDayController {

    private final EventDayService eventDayService;

    @GetMapping
    public List<EventDay> findAll() {
        return eventDayService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDay> findById(@PathVariable Long id) {
        return eventDayService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-date")
    public ResponseEntity<EventDay> findByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return eventDayService.findByDate(date)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/range")
    public List<EventDay> findByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return eventDayService.findByDateRange(start, end);
    }

    @GetMapping("/meal-plan/{mealPlanId}")
    public List<EventDay> findByMealPlanId(@PathVariable Long mealPlanId) {
        return eventDayService.findByMealPlanId(mealPlanId);
    }

    @PatchMapping("/{id}/notes")
    public ResponseEntity<EventDay> updateNotes(@PathVariable Long id, @RequestBody UpdateNotesRequest request) {
        EventDay eventDay = eventDayService.updateNotes(id, request.notes());
        return ResponseEntity.ok(eventDay);
    }

    public record UpdateNotesRequest(String notes) {}
}
