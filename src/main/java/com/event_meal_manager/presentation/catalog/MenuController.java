package com.event_meal_manager.presentation.catalog;

import com.event_meal_manager.application.catalog.MenuService;
import com.event_meal_manager.domain.catalog.Menu;
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

    @GetMapping
    public List<Menu> findAll() {
        return menuService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Menu> findById(@PathVariable Long id) {
        return menuService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Menu> search(@RequestParam String name) {
        return menuService.search(name);
    }

    @PostMapping
    public ResponseEntity<Menu> create(@RequestBody CreateMenuRequest request) {
        Menu menu = menuService.create(request.menuName());
        return ResponseEntity.status(HttpStatus.CREATED).body(menu);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Menu> update(@PathVariable Long id, @RequestBody UpdateMenuRequest request) {
        Menu menu = menuService.update(id, request.menuName());
        return ResponseEntity.ok(menu);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateMenuRequest(String menuName) {}
    public record UpdateMenuRequest(String menuName) {}
}
