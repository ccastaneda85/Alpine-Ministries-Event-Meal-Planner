package com.event_meal_manager.infrastructure.persistence.planning;

import com.event_meal_manager.domain.planning.KitchenPrepList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KitchenPrepListRepository extends JpaRepository<KitchenPrepList, Long> {

    Optional<KitchenPrepList> findByEventDayEventDayId(Long eventDayId);
}
