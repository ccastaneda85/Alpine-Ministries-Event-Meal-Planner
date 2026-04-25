package com.event_meal_manager.application.catalog;

import com.event_meal_manager.domain.catalog.Menu;
import com.event_meal_manager.domain.catalog.MenuEntry;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository menuRepository;

    public List<Menu> findAll() {
        return menuRepository.findAll();
    }

    public Optional<Menu> findById(Long id) {
        return menuRepository.findById(id);
    }

    public List<Menu> search(String name) {
        return menuRepository.findByMenuNameContainingIgnoreCase(name);
    }

    @Transactional
    public Menu create(String menuName) {
        Menu menu = Menu.builder()
            .menuName(menuName)
            .menuEntries(new ArrayList<>())
            .build();

        return menuRepository.save(menu);
    }

    @Transactional
    public Menu update(Long id, String menuName) {
        Menu menu = menuRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Menu not found: " + id));

        menu.setMenuName(menuName);
        return menuRepository.save(menu);
    }

    @Transactional
    public void delete(Long id) {
        menuRepository.deleteById(id);
    }

    public record MenuItemSummary(Long menuItemId, String menuItemName, Integer displayOrder) {}

    @Transactional(readOnly = true)
    public List<MenuItemSummary> getMenuItems(Long menuId) {
        Menu menu = menuRepository.findById(menuId)
            .orElseThrow(() -> new IllegalArgumentException("Menu not found: " + menuId));

        return menu.getMenuEntries().stream()
            .sorted(Comparator.comparingInt(e -> e.getDisplayOrder() != null ? e.getDisplayOrder() : Integer.MAX_VALUE))
            .map(e -> new MenuItemSummary(
                e.getMenuItem().getMenuItemId(),
                e.getMenuItem().getMenuItemName(),
                e.getDisplayOrder()
            ))
            .collect(java.util.stream.Collectors.toList());
    }
}
