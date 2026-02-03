package com.event_meal_manager.application.dashboard;

import com.event_meal_manager.domain.planning.EventDay;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import com.event_meal_manager.domain.services.AttendanceTotalsCalculator;
import com.event_meal_manager.infrastructure.persistence.planning.EventDayRepository;
import com.event_meal_manager.infrastructure.persistence.reservation.GroupMealAttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventDayDashboardQueryService {

    private final EventDayRepository eventDayRepository;
    private final GroupMealAttendanceRepository groupMealAttendanceRepository;
    private final AttendanceTotalsCalculator attendanceTotalsCalculator;

    public Optional<EventDayDashboard> getDashboard(LocalDate date) {
        return eventDayRepository.findFirstByDate(date)
            .map(this::buildDashboard);
    }

    public Optional<EventDayDashboard> getDashboard(Long eventDayId) {
        return eventDayRepository.findById(eventDayId)
            .map(this::buildDashboard);
    }

    public List<EventDayDashboard> getDashboardsForDateRange(LocalDate start, LocalDate end) {
        return eventDayRepository.findByDateBetween(start, end).stream()
            .map(this::buildDashboard)
            .toList();
    }

    private EventDayDashboard buildDashboard(EventDay eventDay) {
        Map<Long, MealPeriodSummary> mealPeriodSummaries = new HashMap<>();

        for (MealPeriod mealPeriod : eventDay.getMealPeriods()) {
            List<GroupMealAttendance> attendances = groupMealAttendanceRepository
                .findByMealPeriodMealPeriodId(mealPeriod.getMealPeriodId());

            AttendanceTotalsCalculator.AttendanceTotals totals = attendanceTotalsCalculator.calculateTotals(attendances);
            int grandTotal = attendanceTotalsCalculator.calculateGrandTotal(totals);

            String menuName = mealPeriod.getMenu() != null ? mealPeriod.getMenu().getMenuName() : null;

            MealPeriodSummary summary = new MealPeriodSummary(
                mealPeriod.getMealPeriodId(),
                mealPeriod.getMealPeriodType(),
                menuName,
                totals.adultCount(),
                totals.youthCount(),
                totals.kidCount(),
                totals.codeCount(),
                totals.customDietCount(),
                grandTotal,
                attendances.size()
            );

            mealPeriodSummaries.put(mealPeriod.getMealPeriodId(), summary);
        }

        return new EventDayDashboard(
            eventDay.getEventDayId(),
            eventDay.getDate(),
            eventDay.getNotes(),
            mealPeriodSummaries,
            eventDay.getKitchenPrepList() != null
        );
    }

    public record EventDayDashboard(
        Long eventDayId,
        LocalDate date,
        String notes,
        Map<Long, MealPeriodSummary> mealPeriodSummaries,
        boolean hasKitchenPrepList
    ) {}

    public record MealPeriodSummary(
        Long mealPeriodId,
        com.event_meal_manager.domain.planning.MealPeriodType mealPeriodType,
        String menuName,
        int adultCount,
        int youthCount,
        int kidCount,
        int codeCount,
        int customDietCount,
        int grandTotal,
        int groupCount
    ) {}
}
