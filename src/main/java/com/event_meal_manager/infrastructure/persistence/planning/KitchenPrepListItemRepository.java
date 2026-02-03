package com.event_meal_manager.infrastructure.persistence.planning;

import com.event_meal_manager.domain.planning.KitchenPrepListItem;
import com.event_meal_manager.domain.planning.PrepItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KitchenPrepListItemRepository extends JpaRepository<KitchenPrepListItem, Long> {

    List<KitchenPrepListItem> findByKitchenPrepListKitchenPrepListId(Long kitchenPrepListId);

    List<KitchenPrepListItem> findByKitchenPrepListKitchenPrepListIdAndStatus(Long kitchenPrepListId, PrepItemStatus status);
}
