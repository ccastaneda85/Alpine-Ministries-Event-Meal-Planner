package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.planning.MealPlanService;
import com.event_meal_manager.application.reservation.GroupReservationService;
import com.event_meal_manager.domain.planning.EventDay;
import com.event_meal_manager.domain.planning.MealPlan;
import com.event_meal_manager.domain.reservation.GroupReservation;
import com.event_meal_manager.infrastructure.persistence.planning.EventDayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/meal-plans")
@RequiredArgsConstructor
public class MealPlanWebController {

    private final MealPlanService mealPlanService;
    private final GroupReservationService groupReservationService;
    private final EventDayRepository eventDayRepository;

    @GetMapping
    public String list(Model model) {
        List<MealPlan> plans = mealPlanService.findAll();
        Map<Long, Long> daysByPlanId = plans.stream().collect(Collectors.toMap(
            MealPlan::getMealPlanId,
            p -> ChronoUnit.DAYS.between(p.getStartDate(), p.getEndDate()) + 1
        ));
        model.addAttribute("mealPlans", plans);
        model.addAttribute("daysByPlanId", daysByPlanId);
        return "meal-plans/list";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("mealPlan", MealPlan.builder().build());
        return "meal-plans/form";
    }

    @PostMapping
    public String create(@RequestParam String name,
                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                         RedirectAttributes redirectAttributes) {
        MealPlan mealPlan = mealPlanService.create(name, startDate, endDate);
        redirectAttributes.addFlashAttribute("successMessage", "Meal plan created successfully!");
        return "redirect:/meal-plans/" + mealPlan.getMealPlanId();
    }

    @GetMapping("/{id}")
    public String view(@PathVariable Long id, Model model) {
        MealPlan mealPlan = mealPlanService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Meal plan not found"));

        // Get groups that overlap with this meal plan's date range
        List<GroupReservation> attendingGroups = groupReservationService.findByDateRange(
            mealPlan.getStartDate(), mealPlan.getEndDate()
        );

        // Calculate totals
        int totalAdults = attendingGroups.stream().mapToInt(GroupReservation::getDefaultAdultCount).sum();
        int totalYouth = attendingGroups.stream().mapToInt(GroupReservation::getDefaultYouthCount).sum();
        int totalKids = attendingGroups.stream().mapToInt(GroupReservation::getDefaultKidCount).sum();
        int totalCode = attendingGroups.stream().mapToInt(GroupReservation::getDefaultCodeCount).sum();
        int totalCustomDiet = attendingGroups.stream().mapToInt(GroupReservation::getDefaultCustomDietCount).sum();

        List<EventDay> eventDays = eventDayRepository.findByDateBetween(
            mealPlan.getStartDate(), mealPlan.getEndDate()
        );
        long totalDays = ChronoUnit.DAYS.between(mealPlan.getStartDate(), mealPlan.getEndDate()) + 1;

        model.addAttribute("mealPlan", mealPlan);
        model.addAttribute("eventDays", eventDays);
        model.addAttribute("totalDays", totalDays);
        model.addAttribute("attendingGroups", attendingGroups);
        model.addAttribute("totalAdults", totalAdults);
        model.addAttribute("totalYouth", totalYouth);
        model.addAttribute("totalKids", totalKids);
        model.addAttribute("totalCode", totalCode);
        model.addAttribute("totalCustomDiet", totalCustomDiet);
        model.addAttribute("grandTotal", totalAdults + totalYouth + totalKids + totalCode);

        return "meal-plans/view";
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable Long id, Model model) {
        MealPlan mealPlan = mealPlanService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Meal plan not found"));
        model.addAttribute("mealPlan", mealPlan);
        return "meal-plans/form";
    }

    @PostMapping("/{id}")
    public String update(@PathVariable Long id,
                         @RequestParam String name,
                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                         RedirectAttributes redirectAttributes) {
        mealPlanService.update(id, name, startDate, endDate);
        redirectAttributes.addFlashAttribute("successMessage", "Meal plan updated successfully!");
        return "redirect:/meal-plans/" + id;
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        mealPlanService.delete(id);
        redirectAttributes.addFlashAttribute("successMessage", "Meal plan deleted successfully!");
        return "redirect:/meal-plans";
    }
}
