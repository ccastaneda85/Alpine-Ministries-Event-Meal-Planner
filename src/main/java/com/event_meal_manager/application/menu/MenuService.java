package com.event_meal_manager.application.menu;

import com.event_meal_manager.domain.menu.Ingredient;
import com.event_meal_manager.domain.menu.Menu;
import com.event_meal_manager.domain.menu.MenuItem;
import com.event_meal_manager.infrastructure.persistence.menu.IngredientRepository;
import com.event_meal_manager.infrastructure.persistence.menu.MenuItemRepository;
import com.event_meal_manager.infrastructure.persistence.menu.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MenuService {

    private final MenuRepository menuRepository;
    private final MenuItemRepository menuItemRepository;
    private final IngredientRepository ingredientRepository;

    public Menu createMenu(String menuName) {
        Menu menu = Menu.builder()
                .menuName(menuName)
                .build();
        return menuRepository.save(menu);
    }

    public Menu getMenuById(Long id) {
        return menuRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu not found with id: " + id));
    }

    public List<Menu> getAllMenus() {
        return menuRepository.findAll();
    }

    public Menu updateMenu(Long id, String menuName) {
        Menu menu = getMenuById(id);
        menu.setMenuName(menuName);
        return menuRepository.save(menu);
    }

    public void deleteMenu(Long id) {
        menuRepository.deleteById(id);
    }

    public MenuItem addMenuItemToMenu(Long menuId, String menuItemName, Long ingredientId) {
        Menu menu = getMenuById(menuId);
        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + ingredientId));

        MenuItem menuItem = MenuItem.builder()
                .menuItemName(menuItemName)
                .menu(menu)
                .ingredient(ingredient)
                .build();

        return menuItemRepository.save(menuItem);
    }

    public void removeMenuItemFromMenu(Long menuItemId) {
        menuItemRepository.deleteById(menuItemId);
    }

    public Ingredient createIngredient(String name, float adultPortion, float youthPortion,
                                       float kidPortion, String unitOfMeasure) {
        Ingredient ingredient = Ingredient.builder()
                .ingredientName(name)
                .adultPortion(adultPortion)
                .youthPortion(youthPortion)
                .kidPortion(kidPortion)
                .unitOfMeasure(unitOfMeasure)
                .build();
        return ingredientRepository.save(ingredient);
    }

    public List<Ingredient> getAllIngredients() {
        return ingredientRepository.findAll();
    }

    public Ingredient getIngredientById(Long id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + id));
    }
}
