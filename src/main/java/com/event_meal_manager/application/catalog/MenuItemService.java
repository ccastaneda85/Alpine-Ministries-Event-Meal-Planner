package com.event_meal_manager.application.catalog;

import com.event_meal_manager.domain.catalog.MenuEntry;
import com.event_meal_manager.domain.catalog.MenuItem;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuEntryRepository;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final MenuEntryRepository menuEntryRepository;

    public List<MenuItem> findAll() {
        return menuItemRepository.findAll();
    }

    public Optional<MenuItem> findById(Long id) {
        return menuItemRepository.findById(id);
    }

    public List<MenuItem> search(String name) {
        return menuItemRepository.findByMenuItemNameContainingIgnoreCase(name);
    }

    @Transactional
    public MenuItem create(String menuItemName) {
        MenuItem menuItem = MenuItem.builder()
            .menuItemName(menuItemName)
            .recipes(new ArrayList<>())
            .menuEntries(new ArrayList<>())
            .build();

        return menuItemRepository.save(menuItem);
    }

    @Transactional
    public MenuItem update(Long id, String menuItemName) {
        MenuItem menuItem = menuItemRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("MenuItem not found: " + id));

        menuItem.setMenuItemName(menuItemName);
        return menuItemRepository.save(menuItem);
    }

    @Transactional
    public void delete(Long id) {
        List<MenuEntry> usages = menuEntryRepository.findByMenuItemMenuItemId(id);
        if (!usages.isEmpty()) {
            String names = usages.stream()
                .map(e -> e.getMenu().getMenuName())
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .collect(Collectors.joining(", "));
            throw new IllegalStateException(
                "Cannot delete: menu item is used in the following menu(s): " + names
                + ". Remove it from those menus first."
            );
        }
        menuItemRepository.deleteById(id);
    }
}
