package com.event_meal_manager.application.catalog;

import com.event_meal_manager.domain.catalog.MenuItem;
import com.event_meal_manager.infrastructure.persistence.catalog.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;

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
        menuItemRepository.deleteById(id);
    }
}
