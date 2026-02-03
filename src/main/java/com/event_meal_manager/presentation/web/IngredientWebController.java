package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.catalog.IngredientService;
import com.event_meal_manager.domain.catalog.Ingredient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/ingredients")
@RequiredArgsConstructor
public class IngredientWebController {

    private final IngredientService ingredientService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("ingredients", ingredientService.findAll());
        return "ingredients/list";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("ingredient", Ingredient.builder().build());
        return "ingredients/form";
    }

    @PostMapping
    public String create(@RequestParam String ingredientName,
                         @RequestParam String unitOfMeasure,
                         RedirectAttributes redirectAttributes) {
        ingredientService.create(ingredientName, unitOfMeasure);
        redirectAttributes.addFlashAttribute("successMessage", "Ingredient created successfully!");
        return "redirect:/ingredients";
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable Long id, Model model) {
        Ingredient ingredient = ingredientService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Ingredient not found"));
        model.addAttribute("ingredient", ingredient);
        return "ingredients/form";
    }

    @PostMapping("/{id}")
    public String update(@PathVariable Long id,
                         @RequestParam String ingredientName,
                         @RequestParam String unitOfMeasure,
                         RedirectAttributes redirectAttributes) {
        ingredientService.update(id, ingredientName, unitOfMeasure);
        redirectAttributes.addFlashAttribute("successMessage", "Ingredient updated successfully!");
        return "redirect:/ingredients";
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        ingredientService.delete(id);
        redirectAttributes.addFlashAttribute("successMessage", "Ingredient deleted successfully!");
        return "redirect:/ingredients";
    }
}
