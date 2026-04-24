package com.event_meal_manager.presentation.planning;

import com.event_meal_manager.application.planning.EventDayService;
import com.event_meal_manager.application.planning.MealPlanService;
import com.event_meal_manager.application.reservation.GroupReservationService;
import com.event_meal_manager.domain.planning.EventDay;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPeriodType;
import com.event_meal_manager.domain.planning.MealPlan;
import com.event_meal_manager.domain.reservation.GroupReservation;
import com.event_meal_manager.infrastructure.persistence.planning.EventDayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/meal-plans")
@RequiredArgsConstructor
public class MealPlanController {

    private final MealPlanService mealPlanService;
    private final EventDayService eventDayService;
    private final GroupReservationService groupReservationService;
    private final EventDayRepository eventDayRepository;

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

    @GetMapping("/{id}/day-status")
    public ResponseEntity<List<EventDayService.DayStatus>> getDayStatus(@PathVariable Long id) {
        return ResponseEntity.ok(eventDayService.getDayStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        mealPlanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/detail")
    @Transactional(readOnly = true)
    public ResponseEntity<MealPlanDetailDTO> getDetail(@PathVariable Long id) {
        return mealPlanService.findById(id)
            .map(plan -> {
                List<GroupReservation> groups = groupReservationService.findByDateRange(plan.getStartDate(), plan.getEndDate());
                List<EventDay> days = eventDayRepository.findByDateBetween(plan.getStartDate(), plan.getEndDate());

                List<AttendingGroupDTO> attendingGroups = groups.stream()
                    .map(g -> new AttendingGroupDTO(
                        g.getGroupReservationId(),
                        g.getGroupName(),
                        g.getArrivalDate(),
                        g.getDepartureDate(),
                        g.getDefaultAdultCount(),
                        g.getDefaultYouthCount(),
                        g.getDefaultKidCount(),
                        g.getDefaultCodeCount(),
                        g.getDefaultCustomDietCount(),
                        g.getCustomDietNotes()
                    ))
                    .toList();

                int totalAdults = groups.stream().mapToInt(GroupReservation::getDefaultAdultCount).sum();
                int totalYouth = groups.stream().mapToInt(GroupReservation::getDefaultYouthCount).sum();
                int totalKids = groups.stream().mapToInt(GroupReservation::getDefaultKidCount).sum();
                int totalCode = groups.stream().mapToInt(GroupReservation::getDefaultCodeCount).sum();
                int totalCustomDiet = groups.stream().mapToInt(GroupReservation::getDefaultCustomDietCount).sum();
                TotalsDTO totals = new TotalsDTO(
                    totalAdults, totalYouth, totalKids, totalCode, totalCustomDiet,
                    totalAdults + totalYouth + totalKids + totalCode
                );

                List<EventDaySummaryDTO> eventDays = days.stream()
                    .sorted(Comparator.comparing(EventDay::getDate))
                    .map(day -> new EventDaySummaryDTO(
                        day.getEventDayId(),
                        day.getDate(),
                        menuNameFor(day.getMealPeriods(), MealPeriodType.BREAKFAST),
                        menuNameFor(day.getMealPeriods(), MealPeriodType.LUNCH),
                        menuNameFor(day.getMealPeriods(), MealPeriodType.DINNER)
                    ))
                    .toList();

                return ResponseEntity.ok(new MealPlanDetailDTO(
                    plan.getMealPlanId(),
                    plan.getName(),
                    plan.getStartDate(),
                    plan.getEndDate(),
                    attendingGroups,
                    totals,
                    eventDays
                ));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    private static String menuNameFor(List<MealPeriod> periods, MealPeriodType type) {
        return periods.stream()
            .filter(p -> p.getMealPeriodType() == type)
            .findFirst()
            .map(p -> p.getMenu() != null ? p.getMenu().getMenuName() : null)
            .orElse(null);
    }

    public record CreateMealPlanRequest(String name, LocalDate startDate, LocalDate endDate) {}
    public record UpdateMealPlanRequest(String name, LocalDate startDate, LocalDate endDate) {}

    public record MealPlanDetailDTO(
        Long mealPlanId,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        List<AttendingGroupDTO> attendingGroups,
        TotalsDTO totals,
        List<EventDaySummaryDTO> eventDays
    ) {}

    public record AttendingGroupDTO(
        Long groupReservationId,
        String groupName,
        LocalDate arrivalDate,
        LocalDate departureDate,
        int defaultAdultCount,
        int defaultYouthCount,
        int defaultKidCount,
        int defaultCodeCount,
        int defaultCustomDietCount,
        String customDietNotes
    ) {}

    public record TotalsDTO(
        int adults, int youth, int kids, int code, int customDiet, int grandTotal
    ) {}

    public record EventDaySummaryDTO(
        Long eventDayId,
        LocalDate date,
        String breakfastMenuName,
        String lunchMenuName,
        String dinnerMenuName
    ) {}
}
