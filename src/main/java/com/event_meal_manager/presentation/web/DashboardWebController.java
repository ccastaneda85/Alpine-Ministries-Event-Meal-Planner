package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.catalog.IngredientService;
import com.event_meal_manager.application.catalog.MenuItemService;
import com.event_meal_manager.application.catalog.MenuService;
import com.event_meal_manager.application.planning.MealPlanService;
import com.event_meal_manager.application.purchasing.PurchaseListService;
import com.event_meal_manager.application.reservation.GroupReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardWebController {

    private final MealPlanService mealPlanService;
    private final MenuService menuService;
    private final MenuItemService menuItemService;
    private final IngredientService ingredientService;
    private final GroupReservationService groupReservationService;
    private final PurchaseListService purchaseListService;

    @GetMapping
    public String dashboard(Model model) {
        model.addAttribute("mealPlanCount", mealPlanService.findAll().size());
        model.addAttribute("menuCount", menuService.findAll().size());
        model.addAttribute("menuItemCount", menuItemService.findAll().size());
        model.addAttribute("ingredientCount", ingredientService.findAll().size());
        model.addAttribute("reservationCount", groupReservationService.findAll().size());
        model.addAttribute("purchaseListCount", purchaseListService.findAll().size());
        return "dashboard/index";
    }
}
