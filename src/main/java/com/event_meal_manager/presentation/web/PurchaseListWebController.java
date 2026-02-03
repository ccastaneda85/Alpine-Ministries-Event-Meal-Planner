package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.planning.MealPlanService;
import com.event_meal_manager.application.purchasing.PurchaseListService;
import com.event_meal_manager.domain.purchasing.PurchaseList;
import com.event_meal_manager.domain.purchasing.PurchaseListStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/purchase-lists")
@RequiredArgsConstructor
public class PurchaseListWebController {

    private final PurchaseListService purchaseListService;
    private final MealPlanService mealPlanService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("purchaseLists", purchaseListService.findAll());
        model.addAttribute("mealPlans", mealPlanService.findAll());
        return "purchase-lists/list";
    }

    @PostMapping("/generate")
    public String generate(@RequestParam Long mealPlanId, RedirectAttributes redirectAttributes) {
        PurchaseList purchaseList = purchaseListService.generateForMealPlan(mealPlanId);
        redirectAttributes.addFlashAttribute("successMessage", "Purchase list generated successfully!");
        return "redirect:/purchase-lists/" + purchaseList.getPurchaseListId();
    }

    @GetMapping("/generate/{mealPlanId}")
    public String generateFromMealPlan(@PathVariable Long mealPlanId, RedirectAttributes redirectAttributes) {
        PurchaseList purchaseList = purchaseListService.generateForMealPlan(mealPlanId);
        redirectAttributes.addFlashAttribute("successMessage", "Purchase list generated successfully!");
        return "redirect:/purchase-lists/" + purchaseList.getPurchaseListId();
    }

    @GetMapping("/{id}")
    public String view(@PathVariable Long id, Model model) {
        PurchaseList purchaseList = purchaseListService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase list not found"));
        model.addAttribute("purchaseList", purchaseList);
        return "purchase-lists/view";
    }

    @PostMapping("/{id}/status")
    public String updateStatus(@PathVariable Long id, @RequestParam PurchaseListStatus status, RedirectAttributes redirectAttributes) {
        purchaseListService.updateStatus(id, status);
        redirectAttributes.addFlashAttribute("successMessage", "Status updated!");
        return "redirect:/purchase-lists/" + id;
    }

    @PostMapping("/{id}/notes")
    public String updateNotes(@PathVariable Long id, @RequestParam String notes, RedirectAttributes redirectAttributes) {
        purchaseListService.updateNotes(id, notes);
        redirectAttributes.addFlashAttribute("successMessage", "Notes updated!");
        return "redirect:/purchase-lists/" + id;
    }

    @PostMapping("/{id}/items")
    public String addItem(@PathVariable Long id,
                          @RequestParam String itemName,
                          @RequestParam float quantity,
                          @RequestParam String uom,
                          @RequestParam(required = false) String notes,
                          RedirectAttributes redirectAttributes) {
        purchaseListService.addItem(id, itemName, quantity, uom, notes);
        redirectAttributes.addFlashAttribute("successMessage", "Item added!");
        return "redirect:/purchase-lists/" + id;
    }

    @PostMapping("/{listId}/items/{itemId}/toggle")
    public String toggleItem(@PathVariable Long listId, @PathVariable Long itemId, RedirectAttributes redirectAttributes) {
        purchaseListService.toggleItemChecked(itemId);
        return "redirect:/purchase-lists/" + listId;
    }

    @PostMapping("/{listId}/items/{itemId}/delete")
    public String deleteItem(@PathVariable Long listId, @PathVariable Long itemId, RedirectAttributes redirectAttributes) {
        purchaseListService.deleteItem(itemId);
        redirectAttributes.addFlashAttribute("successMessage", "Item deleted!");
        return "redirect:/purchase-lists/" + listId;
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        purchaseListService.delete(id);
        redirectAttributes.addFlashAttribute("successMessage", "Purchase list deleted!");
        return "redirect:/purchase-lists";
    }
}
