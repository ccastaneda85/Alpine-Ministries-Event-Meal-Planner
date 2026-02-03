package com.event_meal_manager.infrastructure.persistence.catalog;

import com.event_meal_manager.domain.catalog.MenuEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuEntryRepository extends JpaRepository<MenuEntry, Long> {

    List<MenuEntry> findByMenuMenuId(Long menuId);

    List<MenuEntry> findByMenuItemMenuItemId(Long menuItemId);

    List<MenuEntry> findByMenuMenuIdOrderByDisplayOrderAsc(Long menuId);
}
