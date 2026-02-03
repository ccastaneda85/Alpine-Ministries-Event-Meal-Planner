package com.event_meal_manager.presentation.catalog;

import com.event_meal_manager.application.catalog.MenuItemService;
import com.event_meal_manager.domain.catalog.MenuItem;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;

    @GetMapping
    public List<MenuItem> findAll() {
        return menuItemService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> findById(@PathVariable Long id) {
        return menuItemService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<MenuItem> search(@RequestParam String name) {
        return menuItemService.search(name);
    }

    @PostMapping
    public ResponseEntity<MenuItem> create(@RequestBody CreateMenuItemRequest request) {
        MenuItem menuItem = menuItemService.create(request.menuItemName());
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuItem> update(@PathVariable Long id, @RequestBody UpdateMenuItemRequest request) {
        MenuItem menuItem = menuItemService.update(id, request.menuItemName());
        return ResponseEntity.ok(menuItem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuItemService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateMenuItemRequest(String menuItemName) {}
    public record UpdateMenuItemRequest(String menuItemName) {}
}
