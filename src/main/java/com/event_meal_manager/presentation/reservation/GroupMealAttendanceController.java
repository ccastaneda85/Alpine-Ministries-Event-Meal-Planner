package com.event_meal_manager.presentation.reservation;

import com.event_meal_manager.application.reservation.GroupMealAttendanceService;
import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

import java.util.List;

@RestController
@RequestMapping("/api/group-meal-attendances")
@RequiredArgsConstructor
public class GroupMealAttendanceController {

    private final GroupMealAttendanceService groupMealAttendanceService;

    @GetMapping
    public List<GroupMealAttendance> findAll() {
        return groupMealAttendanceService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupMealAttendance> findById(@PathVariable Long id) {
        return groupMealAttendanceService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/group-reservation/{groupReservationId}")
    public List<GroupMealAttendance> findByGroupReservationId(@PathVariable Long groupReservationId) {
        return groupMealAttendanceService.findByGroupReservationId(groupReservationId);
    }

    @GetMapping("/meal-period/{mealPeriodId}")
    public List<GroupMealAttendance> findByMealPeriodId(@PathVariable Long mealPeriodId) {
        return groupMealAttendanceService.findByMealPeriodId(mealPeriodId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupMealAttendance> updateCounts(
            @PathVariable Long id,
            @RequestBody UpdateCountsRequest request) {
        GroupMealAttendance attendance = groupMealAttendanceService.updateCounts(
            id,
            request.adultCount(),
            request.youthCount(),
            request.kidCount(),
            request.codeCount(),
            request.customDietCount()
        );
        return ResponseEntity.ok(attendance);
    }

    @DeleteMapping("/group-reservation/{groupId}/date/{date}")
    public ResponseEntity<Void> deleteByGroupAndDate(
            @PathVariable Long groupId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        groupMealAttendanceService.deleteByGroupAndDate(groupId, date);
        return ResponseEntity.noContent().build();
    }

    public record UpdateCountsRequest(
        int adultCount,
        int youthCount,
        int kidCount,
        int codeCount,
        int customDietCount
    ) {}
}
