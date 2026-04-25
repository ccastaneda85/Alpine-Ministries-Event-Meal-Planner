package com.event_meal_manager.presentation.planning;

import com.event_meal_manager.application.planning.MealPeriodService;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPeriodType;
import com.event_meal_manager.domain.services.AttendanceTotalsCalculator;
import com.event_meal_manager.infrastructure.persistence.reservation.GroupMealAttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meal-periods")
@RequiredArgsConstructor
public class MealPeriodController {

    private final MealPeriodService mealPeriodService;
    private final GroupMealAttendanceRepository groupMealAttendanceRepository;
    private final AttendanceTotalsCalculator attendanceTotalsCalculator;

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

    @GetMapping("/{id}/group-attendances")
    public List<GroupAttendanceDTO> getGroupAttendances(@PathVariable Long id) {
        return groupMealAttendanceRepository.findByMealPeriodMealPeriodId(id).stream()
            .map(a -> new GroupAttendanceDTO(
                a.getGroupReservation().getGroupName(),
                a.getAdultCount(),
                a.getYouthCount(),
                a.getKidCount(),
                a.getCodeCount(),
                a.getCustomDietCount(),
                a.getGroupReservation().getCustomDietNotes()
            ))
            .toList();
    }

    @GetMapping("/{id}/attendance-totals")
    public ResponseEntity<AttendanceTotalsResponse> getAttendanceTotalsForPeriod(@PathVariable Long id) {
        var attendances = groupMealAttendanceRepository.findByMealPeriodMealPeriodId(id);
        var totals = attendanceTotalsCalculator.calculateTotals(attendances);
        return ResponseEntity.ok(new AttendanceTotalsResponse(
            totals.adultCount(), totals.youthCount(), totals.kidCount(), totals.codeCount()
        ));
    }

    @GetMapping("/event-day/{eventDayId}/attendance-totals")
    public AttendanceTotalsResponse getAttendanceTotalsForDay(@PathVariable Long eventDayId) {
        var attendances = groupMealAttendanceRepository.findByMealPeriodEventDayEventDayId(eventDayId);
        var totals = attendanceTotalsCalculator.calculateTotals(attendances);
        return new AttendanceTotalsResponse(
            totals.adultCount(), totals.youthCount(), totals.kidCount(), totals.codeCount()
        );
    }

    public record AssignMenuRequest(Long menuId) {}
    public record AttendanceTotalsResponse(int adultCount, int youthCount, int kidCount, int codeCount) {}
    public record GroupAttendanceDTO(
        String groupName,
        int adultCount,
        int youthCount,
        int kidCount,
        int codeCount,
        int customDietCount,
        String customDietNotes
    ) {}
}
