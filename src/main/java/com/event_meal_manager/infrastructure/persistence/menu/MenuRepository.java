package com.event_meal_manager.infrastructure.persistence.menu;

import com.event_meal_manager.domain.menu.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {

    Optional<Menu> findByMenuName(String menuName);
}
