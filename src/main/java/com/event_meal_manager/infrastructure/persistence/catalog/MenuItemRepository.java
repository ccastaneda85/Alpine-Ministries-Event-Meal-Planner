package com.event_meal_manager.infrastructure.persistence.catalog;

import com.event_meal_manager.domain.catalog.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByMenuItemNameContainingIgnoreCase(String menuItemName);
}
