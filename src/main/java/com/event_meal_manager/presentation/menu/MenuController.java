package com.event_meal_manager.presentation.menu;

import com.event_meal_manager.application.menu.MenuService;
import com.event_meal_manager.domain.menu.Ingredient;
import com.event_meal_manager.domain.menu.Menu;
import com.event_meal_manager.domain.menu.MenuItem;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @PostMapping
    public ResponseEntity<Menu> createMenu(@RequestBody CreateMenuRequest request) {
        Menu menu = menuService.createMenu(request.menuName());
        return ResponseEntity.status(HttpStatus.CREATED).body(menu);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Menu> getMenu(@PathVariable Long id) {
        Menu menu = menuService.getMenuById(id);
        return ResponseEntity.ok(menu);
    }

    @GetMapping
    public ResponseEntity<List<Menu>> getAllMenus() {
        List<Menu> menus = menuService.getAllMenus();
        return ResponseEntity.ok(menus);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Menu> updateMenu(
            @PathVariable Long id,
            @RequestBody CreateMenuRequest request) {
        Menu menu = menuService.updateMenu(id, request.menuName());
        return ResponseEntity.ok(menu);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenu(@PathVariable Long id) {
        menuService.deleteMenu(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{menuId}/items")
    public ResponseEntity<MenuItem> addMenuItem(
            @PathVariable Long menuId,
            @RequestBody AddMenuItemRequest request) {
        MenuItem menuItem = menuService.addMenuItemToMenu(
                menuId,
                request.menuItemName(),
                request.ingredientId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItem);
    }

    @DeleteMapping("/items/{menuItemId}")
    public ResponseEntity<Void> removeMenuItem(@PathVariable Long menuItemId) {
        menuService.removeMenuItemFromMenu(menuItemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/ingredients")
    public ResponseEntity<Ingredient> createIngredient(@RequestBody CreateIngredientRequest request) {
        Ingredient ingredient = menuService.createIngredient(
                request.name(),
                request.adultPortion(),
                request.youthPortion(),
                request.kidPortion(),
                request.unitOfMeasure()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ingredient);
    }

    @GetMapping("/ingredients")
    public ResponseEntity<List<Ingredient>> getAllIngredients() {
        List<Ingredient> ingredients = menuService.getAllIngredients();
        return ResponseEntity.ok(ingredients);
    }

    @GetMapping("/ingredients/{id}")
    public ResponseEntity<Ingredient> getIngredient(@PathVariable Long id) {
        Ingredient ingredient = menuService.getIngredientById(id);
        return ResponseEntity.ok(ingredient);
    }

    record CreateMenuRequest(String menuName) {}
    record AddMenuItemRequest(String menuItemName, Long ingredientId) {}
    record CreateIngredientRequest(
            String name,
            float adultPortion,
            float youthPortion,
            float kidPortion,
            String unitOfMeasure
    ) {}
}
