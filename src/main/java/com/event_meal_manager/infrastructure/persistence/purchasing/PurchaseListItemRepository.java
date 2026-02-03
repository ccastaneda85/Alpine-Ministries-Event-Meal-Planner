package com.event_meal_manager.infrastructure.persistence.purchasing;

import com.event_meal_manager.domain.purchasing.PurchaseListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseListItemRepository extends JpaRepository<PurchaseListItem, Long> {

    List<PurchaseListItem> findByPurchaseListPurchaseListId(Long purchaseListId);

    List<PurchaseListItem> findByPurchaseListPurchaseListIdAndChecked(Long purchaseListId, Boolean checked);
}
