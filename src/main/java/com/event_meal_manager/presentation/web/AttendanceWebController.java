package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.reservation.GroupMealAttendanceService;
import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceWebController {

    private final GroupMealAttendanceService groupMealAttendanceService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("attendances", groupMealAttendanceService.findAll());
        return "attendance/list";
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable Long id, Model model) {
        GroupMealAttendance attendance = groupMealAttendanceService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Attendance not found"));
        model.addAttribute("attendance", attendance);
        return "attendance/edit";
    }

    @PostMapping("/{id}")
    public String update(@PathVariable Long id,
                         @RequestParam int adultCount,
                         @RequestParam int youthCount,
                         @RequestParam int kidCount,
                         @RequestParam int codeCount,
                         @RequestParam int customDietCount,
                         RedirectAttributes redirectAttributes) {
        GroupMealAttendance attendance = groupMealAttendanceService.updateCounts(
            id, adultCount, youthCount, kidCount, codeCount, customDietCount
        );
        redirectAttributes.addFlashAttribute("successMessage", "Attendance updated successfully!");
        return "redirect:/group-reservations/" + attendance.getGroupReservation().getGroupReservationId();
    }
}
