package com.event_meal_manager.application.catalog;

import com.event_meal_manager.domain.catalog.Menu;
import com.event_meal_manager.domain.catalog.MenuEntry;
import com.event_meal_manager.domain.catalog.MenuItem;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuEntryRepository;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuItemRepository;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MenuEntryService {

    private final MenuEntryRepository menuEntryRepository;
    private final MenuRepository menuRepository;
    private final MenuItemRepository menuItemRepository;

    @Transactional(readOnly = true)
    public List<MenuEntry> findByMenuId(Long menuId) {
        List<MenuEntry> entries = menuEntryRepository.findByMenuMenuIdOrderByDisplayOrderAsc(menuId);
        // Force-initialize menuItem for each entry within this transaction
        entries.forEach(e -> {
            if (e.getMenuItem() != null) e.getMenuItem().getMenuItemName();
        });
        return entries;
    }

    public Optional<MenuEntry> findById(Long id) {
        return menuEntryRepository.findById(id);
    }

    @Transactional
    public MenuEntry addMenuItemToMenu(Long menuId, Long menuItemId, Integer displayOrder) {
        Menu menu = menuRepository.findById(menuId)
            .orElseThrow(() -> new IllegalArgumentException("Menu not found: " + menuId));

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
            .orElseThrow(() -> new IllegalArgumentException("MenuItem not found: " + menuItemId));

        MenuEntry entry = MenuEntry.builder()
            .menu(menu)
            .menuItem(menuItem)
            .displayOrder(displayOrder)
            .build();

        return menuEntryRepository.save(entry);
    }

    @Transactional
    public MenuEntry updateDisplayOrder(Long entryId, Integer displayOrder) {
        MenuEntry entry = menuEntryRepository.findById(entryId)
            .orElseThrow(() -> new IllegalArgumentException("MenuEntry not found: " + entryId));

        entry.setDisplayOrder(displayOrder);
        return menuEntryRepository.save(entry);
    }

    @Transactional
    public void delete(Long id) {
        menuEntryRepository.deleteById(id);
    }
}
