package com.event_meal_manager.infrastructure.persistence.purchasing;

import com.event_meal_manager.domain.purchasing.PurchaseList;
import com.event_meal_manager.domain.purchasing.PurchaseListStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseListRepository extends JpaRepository<PurchaseList, Long> {

    List<PurchaseList> findByMealPlanMealPlanId(Long mealPlanId);

    List<PurchaseList> findByStatus(PurchaseListStatus status);
}
