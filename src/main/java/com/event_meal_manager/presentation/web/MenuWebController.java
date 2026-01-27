package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.menu.MenuService;
import com.event_meal_manager.domain.menu.Ingredient;
import com.event_meal_manager.domain.menu.Menu;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/menus")
@RequiredArgsConstructor
public class MenuWebController {

    private final MenuService menuService;

    @GetMapping
    public String listMenus(Model model) {
        List<Menu> menus = menuService.getAllMenus();
        model.addAttribute("menus", menus);
        return "menus/list";
    }

    @GetMapping("/new")
    public String newMenu(Model model) {
        List<Ingredient> ingredients = menuService.getAllIngredients();
        model.addAttribute("ingredients", ingredients);
        return "menus/form";
    }

    @GetMapping("/{id}")
    public String viewMenu(@PathVariable Long id, Model model) {
        Menu menu = menuService.getMenuById(id);
        List<Ingredient> ingredients = menuService.getAllIngredients();
        model.addAttribute("menu", menu);
        model.addAttribute("ingredients", ingredients);
        return "menus/view";
    }

    @GetMapping("/ingredients")
    public String listIngredients(Model model) {
        List<Ingredient> ingredients = menuService.getAllIngredients();
        model.addAttribute("ingredients", ingredients);
        return "ingredients/list";
    }

    @GetMapping("/ingredients/new")
    public String newIngredient() {
        return "ingredients/form";
    }
}
