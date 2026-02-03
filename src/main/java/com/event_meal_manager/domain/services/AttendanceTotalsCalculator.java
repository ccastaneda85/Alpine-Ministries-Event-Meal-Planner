package com.event_meal_manager.domain.services;

import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AttendanceTotalsCalculator {

    public AttendanceTotals calculateTotals(List<GroupMealAttendance> attendances) {
        int totalAdults = 0;
        int totalYouth = 0;
        int totalKids = 0;
        int totalCode = 0;
        int totalCustomDiet = 0;

        for (GroupMealAttendance attendance : attendances) {
            totalAdults += attendance.getAdultCount();
            totalYouth += attendance.getYouthCount();
            totalKids += attendance.getKidCount();
            totalCode += attendance.getCodeCount();
            totalCustomDiet += attendance.getCustomDietCount();
        }

        return new AttendanceTotals(totalAdults, totalYouth, totalKids, totalCode, totalCustomDiet);
    }

    public int calculateGrandTotal(AttendanceTotals totals) {
        return totals.adultCount() + totals.youthCount() + totals.kidCount() + totals.codeCount();
    }

    public record AttendanceTotals(
        int adultCount,
        int youthCount,
        int kidCount,
        int codeCount,
        int customDietCount
    ) {}
}
