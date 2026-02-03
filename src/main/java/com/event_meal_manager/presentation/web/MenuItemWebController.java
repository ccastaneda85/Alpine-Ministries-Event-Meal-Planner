package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.catalog.IngredientService;
import com.event_meal_manager.application.catalog.MenuItemRecipeService;
import com.event_meal_manager.application.catalog.MenuItemService;
import com.event_meal_manager.domain.catalog.MenuItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/menu-items")
@RequiredArgsConstructor
public class MenuItemWebController {

    private final MenuItemService menuItemService;
    private final IngredientService ingredientService;
    private final MenuItemRecipeService menuItemRecipeService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("menuItems", menuItemService.findAll());
        return "menu-items/list";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("menuItem", MenuItem.builder().build());
        return "menu-items/form";
    }

    @PostMapping
    public String create(@RequestParam String menuItemName, RedirectAttributes redirectAttributes) {
        MenuItem menuItem = menuItemService.create(menuItemName);
        redirectAttributes.addFlashAttribute("successMessage", "Menu item created successfully!");
        return "redirect:/menu-items/" + menuItem.getMenuItemId();
    }

    @GetMapping("/{id}")
    public String view(@PathVariable Long id, Model model) {
        MenuItem menuItem = menuItemService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));
        model.addAttribute("menuItem", menuItem);
        model.addAttribute("ingredients", ingredientService.findAll());
        return "menu-items/view";
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable Long id, Model model) {
        MenuItem menuItem = menuItemService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));
        model.addAttribute("menuItem", menuItem);
        return "menu-items/form";
    }

    @PostMapping("/{id}")
    public String update(@PathVariable Long id, @RequestParam String menuItemName, RedirectAttributes redirectAttributes) {
        menuItemService.update(id, menuItemName);
        redirectAttributes.addFlashAttribute("successMessage", "Menu item updated successfully!");
        return "redirect:/menu-items/" + id;
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        menuItemService.delete(id);
        redirectAttributes.addFlashAttribute("successMessage", "Menu item deleted successfully!");
        return "redirect:/menu-items";
    }

    @PostMapping("/{id}/recipes")
    public String addRecipe(@PathVariable Long id,
                            @RequestParam Long ingredientId,
                            @RequestParam float adultPortion,
                            @RequestParam float youthPortion,
                            @RequestParam float kidPortion,
                            @RequestParam float codePortion,
                            @RequestParam(required = false) String notes,
                            RedirectAttributes redirectAttributes) {
        menuItemRecipeService.create(id, ingredientId, adultPortion, youthPortion, kidPortion, codePortion, notes);
        redirectAttributes.addFlashAttribute("successMessage", "Recipe line added!");
        return "redirect:/menu-items/" + id;
    }

    @PostMapping("/{itemId}/recipes/{recipeId}/delete")
    public String removeRecipe(@PathVariable Long itemId, @PathVariable Long recipeId, RedirectAttributes redirectAttributes) {
        menuItemRecipeService.delete(recipeId);
        redirectAttributes.addFlashAttribute("successMessage", "Recipe line removed!");
        return "redirect:/menu-items/" + itemId;
    }
}
