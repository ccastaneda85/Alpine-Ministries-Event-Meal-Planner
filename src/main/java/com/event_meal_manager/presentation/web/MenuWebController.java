package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.catalog.MenuEntryService;
import com.event_meal_manager.application.catalog.MenuItemService;
import com.event_meal_manager.application.catalog.MenuService;
import com.event_meal_manager.domain.catalog.Menu;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/menus")
@RequiredArgsConstructor
public class MenuWebController {

    private final MenuService menuService;
    private final MenuItemService menuItemService;
    private final MenuEntryService menuEntryService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("menus", menuService.findAll());
        return "menus/list";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("menu", Menu.builder().build());
        return "menus/form";
    }

    @PostMapping
    public String create(@RequestParam String menuName, RedirectAttributes redirectAttributes) {
        Menu menu = menuService.create(menuName);
        redirectAttributes.addFlashAttribute("successMessage", "Menu created successfully!");
        return "redirect:/menus/" + menu.getMenuId();
    }

    @GetMapping("/{id}")
    public String view(@PathVariable Long id, Model model) {
        Menu menu = menuService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Menu not found"));
        model.addAttribute("menu", menu);
        model.addAttribute("menuItems", menuItemService.findAll());
        return "menus/view";
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable Long id, Model model) {
        Menu menu = menuService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Menu not found"));
        model.addAttribute("menu", menu);
        return "menus/form";
    }

    @PostMapping("/{id}")
    public String update(@PathVariable Long id, @RequestParam String menuName, RedirectAttributes redirectAttributes) {
        menuService.update(id, menuName);
        redirectAttributes.addFlashAttribute("successMessage", "Menu updated successfully!");
        return "redirect:/menus/" + id;
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        menuService.delete(id);
        redirectAttributes.addFlashAttribute("successMessage", "Menu deleted successfully!");
        return "redirect:/menus";
    }

    @PostMapping("/{id}/entries")
    public String addEntry(@PathVariable Long id,
                           @RequestParam Long menuItemId,
                           @RequestParam(defaultValue = "0") Integer displayOrder,
                           RedirectAttributes redirectAttributes) {
        menuEntryService.addMenuItemToMenu(id, menuItemId, displayOrder);
        redirectAttributes.addFlashAttribute("successMessage", "Item added to menu!");
        return "redirect:/menus/" + id;
    }

    @PostMapping("/{menuId}/entries/{entryId}/delete")
    public String removeEntry(@PathVariable Long menuId, @PathVariable Long entryId, RedirectAttributes redirectAttributes) {
        menuEntryService.delete(entryId);
        redirectAttributes.addFlashAttribute("successMessage", "Item removed from menu!");
        return "redirect:/menus/" + menuId;
    }
}
