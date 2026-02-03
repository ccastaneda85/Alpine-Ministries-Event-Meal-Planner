package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.planning.KitchenPrepService;
import com.event_meal_manager.domain.planning.KitchenPrepList;
import com.event_meal_manager.domain.planning.PrepItemStatus;
import com.event_meal_manager.infrastructure.persistence.planning.KitchenPrepListRepository;
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
                          RedirectAttributes redirectAttributes) {
        kitchenPrepService.addItem(id, menuItemName, adultServings, youthServings, kidServings, codeServings, notes);
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

    @PostMapping("/{prepId}/items/{itemId}/delete")
    public String deleteItem(@PathVariable Long prepId, @PathVariable Long itemId,
                             RedirectAttributes redirectAttributes) {
        kitchenPrepService.deleteItem(itemId);
        redirectAttributes.addFlashAttribute("successMessage", "Item deleted!");
        return "redirect:/kitchen-prep/" + prepId;
    }
}
