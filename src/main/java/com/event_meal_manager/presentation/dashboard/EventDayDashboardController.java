package com.event_meal_manager.presentation.dashboard;

import com.event_meal_manager.application.dashboard.EventDayDashboardQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class EventDayDashboardController {

    private final EventDayDashboardQueryService dashboardQueryService;

    @GetMapping("/event-day/{eventDayId}")
    public ResponseEntity<EventDayDashboardQueryService.EventDayDashboard> getDashboardById(
            @PathVariable Long eventDayId) {
        return dashboardQueryService.getDashboard(eventDayId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/date")
    public ResponseEntity<EventDayDashboardQueryService.EventDayDashboard> getDashboardByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return dashboardQueryService.getDashboard(date)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/range")
    public List<EventDayDashboardQueryService.EventDayDashboard> getDashboardsForDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return dashboardQueryService.getDashboardsForDateRange(start, end);
    }
}
