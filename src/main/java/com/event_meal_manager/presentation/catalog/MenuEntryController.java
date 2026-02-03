package com.event_meal_manager.presentation.catalog;

import com.event_meal_manager.application.catalog.MenuEntryService;
import com.event_meal_manager.domain.catalog.MenuEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-entries")
@RequiredArgsConstructor
public class MenuEntryController {

    private final MenuEntryService menuEntryService;

    @GetMapping("/menu/{menuId}")
    public List<MenuEntry> findByMenuId(@PathVariable Long menuId) {
        return menuEntryService.findByMenuId(menuId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuEntry> findById(@PathVariable Long id) {
        return menuEntryService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MenuEntry> create(@RequestBody CreateMenuEntryRequest request) {
        MenuEntry entry = menuEntryService.addMenuItemToMenu(
            request.menuId(),
            request.menuItemId(),
            request.displayOrder()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(entry);
    }

    @PatchMapping("/{id}/display-order")
    public ResponseEntity<MenuEntry> updateDisplayOrder(
            @PathVariable Long id,
            @RequestBody UpdateDisplayOrderRequest request) {
        MenuEntry entry = menuEntryService.updateDisplayOrder(id, request.displayOrder());
        return ResponseEntity.ok(entry);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuEntryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateMenuEntryRequest(Long menuId, Long menuItemId, Integer displayOrder) {}
    public record UpdateDisplayOrderRequest(Integer displayOrder) {}
}
