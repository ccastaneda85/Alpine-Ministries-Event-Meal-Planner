package com.event_meal_manager.infrastructure.persistence.catalog;

import com.event_meal_manager.domain.catalog.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {

    List<Menu> findByMenuNameContainingIgnoreCase(String menuName);
}
