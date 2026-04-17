package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.planning.KitchenPrepService;
import com.event_meal_manager.domain.planning.KitchenPrepList;
import com.event_meal_manager.domain.planning.MealPeriodType;
import com.event_meal_manager.domain.planning.PrepItemStatus;
import com.event_meal_manager.infrastructure.persistence.planning.KitchenPrepListRepository;
import com.event_meal_manager.infrastructure.persistence.planning.MealPeriodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/kitchen-prep")
@RequiredArgsConstructor
public class KitchenPrepWebController {

    private final KitchenPrepService kitchenPrepService;
    private final KitchenPrepListRepository kitchenPrepListRepository;
    private final MealPeriodRepository mealPeriodRepository;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("prepLists", kitchenPrepListRepository.findAll());
        return "kitchen-prep/list";
    }

    @GetMapping("/{id}")
    public String view(@PathVariable Long id, Model model) {
        KitchenPrepList prepList = kitchenPrepService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Kitchen prep list not found"));
        model.addAttribute("prepList", prepList);
        model.addAttribute("mealPeriodTypes", MealPeriodType.values());
        model.addAttribute("mealPeriods", mealPeriodRepository.findByEventDayEventDayId(prepList.getEventDay().getEventDayId()));
        return "kitchen-prep/view";
    }

    @PostMapping("/{id}/notes")
    public String updateNotes(@PathVariable Long id, @RequestParam String notes, RedirectAttributes redirectAttributes) {
        kitchenPrepService.updateNotes(id, notes);
        redirectAttributes.addFlashAttribute("successMessage", "Notes updated!");
        return "redirect:/kitchen-prep/" + id;
    }

    @PostMapping("/{id}/items")
    public String addItem(@PathVariable Long id,
                          @RequestParam String menuItemName,
                          @RequestParam(defaultValue = "0") Integer adultServings,
                          @RequestParam(defaultValue = "0") Integer youthServings,
                          @RequestParam(defaultValue = "0") Integer kidServings,
                          @RequestParam(defaultValue = "0") Integer codeServings,
                          @RequestParam(required = false) String notes,
                          @RequestParam(required = false) Long mealPeriodId,
                          RedirectAttributes redirectAttributes) {
        kitchenPrepService.addItem(id, menuItemName, adultServings, youthServings, kidServings, codeServings, notes, mealPeriodId);
        redirectAttributes.addFlashAttribute("successMessage", "Item added!");
        return "redirect:/kitchen-prep/" + id;
    }

    @PostMapping("/{prepId}/items/{itemId}/status")
    public String updateItemStatus(@PathVariable Long prepId, @PathVariable Long itemId,
                                   @RequestParam PrepItemStatus status,
                                   RedirectAttributes redirectAttributes) {
        kitchenPrepService.updateItemStatus(itemId, status);
        redirectAttributes.addFlashAttribute("successMessage", "Status updated!");
        return "redirect:/kitchen-prep/" + prepId;
    }

    @PostMapping("/{prepId}/items/{itemId}/edit")
    public String updateItem(@PathVariable Long prepId, @PathVariable Long itemId,
                             @RequestParam String menuItemName,
                             @RequestParam(defaultValue = "0") Integer adultServings,
                             @RequestParam(defaultValue = "0") Integer youthServings,
                             @RequestParam(defaultValue = "0") Integer kidServings,
                             @RequestParam(defaultValue = "0") Integer codeServings,
                             RedirectAttributes redirectAttributes) {
        kitchenPrepService.updateItem(itemId, menuItemName, adultServings, youthServings, kidServings, codeServings);
        redirectAttributes.addFlashAttribute("successMessage", "Item updated!");
        return "redirect:/kitchen-prep/" + prepId;
    }

    @PostMapping("/{prepId}/items/{itemId}/notes")
    public String updateItemNotes(@PathVariable Long prepId, @PathVariable Long itemId,
                                  @RequestParam(required = false) String notes,
                                  RedirectAttributes redirectAttributes) {
        kitchenPrepService.updateItemNotes(itemId, notes);
        redirectAttributes.addFlashAttribute("successMessage", "Notes saved!");
        return "redirect:/kitchen-prep/" + prepId;
    }

    @PostMapping("/{prepId}/items/{itemId}/delete")
    public String deleteItem(@PathVariable Long prepId, @PathVariable Long itemId,
                             RedirectAttributes redirectAttributes) {
        kitchenPrepService.deleteItem(itemId);
        redirectAttributes.addFlashAttribute("successMessage", "Item deleted!");
        return "redirect:/kitchen-prep/" + prepId;
    }

    @PostMapping("/{id}/generate")
    public String generateFromEventDay(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        kitchenPrepService.generateItemsFromEventDay(id);
        redirectAttributes.addFlashAttribute("successMessage", "Prep list generated from event day data!");
        return "redirect:/kitchen-prep/" + id;
    }

    @PostMapping("/{id}/clear-generated")
    public String clearGeneratedItems(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        kitchenPrepService.clearAutoGeneratedItems(id);
        redirectAttributes.addFlashAttribute("successMessage", "Auto-generated items cleared.");
        return "redirect:/kitchen-prep/" + id;
    }
}
