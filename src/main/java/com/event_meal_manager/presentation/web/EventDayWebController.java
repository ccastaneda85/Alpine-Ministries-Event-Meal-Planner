package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.catalog.MenuService;
import com.event_meal_manager.application.planning.EventDayService;
import com.event_meal_manager.application.planning.KitchenPrepService;
import com.event_meal_manager.application.planning.MealPeriodService;
import com.event_meal_manager.domain.planning.EventDay;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/event-days")
@RequiredArgsConstructor
public class EventDayWebController {

    private final EventDayService eventDayService;
    private final MealPeriodService mealPeriodService;
    private final MenuService menuService;
    private final KitchenPrepService kitchenPrepService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("eventDaysWithGroups", eventDayService.findAllWithGroups());
        return "event-days/list";
    }

    @GetMapping("/{id}")
    public String view(@PathVariable Long id, Model model) {
        EventDay eventDay = eventDayService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Event day not found"));
        model.addAttribute("eventDay", eventDay);
        model.addAttribute("menus", menuService.findAll());
        return "event-days/view";
    }

    @PostMapping("/{id}/notes")
    public String updateNotes(@PathVariable Long id, @RequestParam String notes, RedirectAttributes redirectAttributes) {
        eventDayService.updateNotes(id, notes);
        redirectAttributes.addFlashAttribute("successMessage", "Notes updated successfully!");
        return "redirect:/event-days/" + id;
    }

    @PostMapping("/{dayId}/periods/{periodId}/menu")
    public String assignMenu(@PathVariable Long dayId, @PathVariable Long periodId,
                             @RequestParam(required = false) Long menuId,
                             RedirectAttributes redirectAttributes) {
        if (menuId != null) {
            mealPeriodService.assignMenu(periodId, menuId);
            redirectAttributes.addFlashAttribute("successMessage", "Menu assigned successfully!");
        }
        return "redirect:/event-days/" + dayId;
    }

    @GetMapping("/{dayId}/periods/{periodId}/clear-menu")
    public String clearMenu(@PathVariable Long dayId, @PathVariable Long periodId,
                            RedirectAttributes redirectAttributes) {
        mealPeriodService.clearMenu(periodId);
        redirectAttributes.addFlashAttribute("successMessage", "Menu cleared successfully!");
        return "redirect:/event-days/" + dayId;
    }

    @PostMapping("/{id}/create-prep-list")
    public String createPrepList(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        kitchenPrepService.createForEventDay(id);
        redirectAttributes.addFlashAttribute("successMessage", "Kitchen prep list created!");
        return "redirect:/event-days/" + id;
    }
}
