package com.event_meal_manager.application.purchasing;

import com.event_meal_manager.domain.purchasing.PurchaseList;
import com.event_meal_manager.domain.purchasing.PurchaseListItem;
import com.event_meal_manager.domain.purchasing.PurchaseListStatus;
import com.event_meal_manager.infrastructure.persistence.purchasing.PurchaseListItemRepository;
import com.event_meal_manager.infrastructure.persistence.purchasing.PurchaseListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PurchaseListService {

    private final PurchaseListRepository purchaseListRepository;
    private final PurchaseListItemRepository purchaseListItemRepository;
    private final PurchaseListGenerationService purchaseListGenerationService;

    public List<PurchaseList> findAll() {
        return purchaseListRepository.findAll();
    }

    public Optional<PurchaseList> findById(Long id) {
        return purchaseListRepository.findById(id);
    }

    public List<PurchaseList> findByMealPlanId(Long mealPlanId) {
        return purchaseListRepository.findByMealPlanMealPlanId(mealPlanId);
    }

    @Transactional
    public PurchaseList generateForMealPlan(Long mealPlanId) {
        return purchaseListGenerationService.generateFromMealPlan(mealPlanId);
    }

    @Transactional
    public PurchaseList createEmpty(Long mealPlanId) {
        return purchaseListGenerationService.createEmptyForMealPlan(mealPlanId);
    }

    @Transactional
    public PurchaseList updateStatus(Long id, PurchaseListStatus status) {
        PurchaseList purchaseList = purchaseListRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("PurchaseList not found: " + id));

        purchaseList.setStatus(status);
        return purchaseListRepository.save(purchaseList);
    }

    @Transactional
    public PurchaseList updateNotes(Long id, String notes) {
        PurchaseList purchaseList = purchaseListRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("PurchaseList not found: " + id));

        purchaseList.setNotes(notes);
        return purchaseListRepository.save(purchaseList);
    }

    @Transactional
    public PurchaseListItem addItem(Long purchaseListId, String itemName, float quantity, String uom, String notes) {
        PurchaseList purchaseList = purchaseListRepository.findById(purchaseListId)
            .orElseThrow(() -> new IllegalArgumentException("PurchaseList not found: " + purchaseListId));

        PurchaseListItem item = PurchaseListItem.builder()
            .purchaseList(purchaseList)
            .purchaseListItemName(itemName)
            .quantity(quantity)
            .uom(uom)
            .notes(notes)
            .checked(false)
            .build();

        return purchaseListItemRepository.save(item);
    }

    @Transactional
    public PurchaseListItem updateItem(Long itemId, String itemName, float quantity, String uom, String notes) {
        PurchaseListItem item = purchaseListItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("PurchaseListItem not found: " + itemId));

        item.setPurchaseListItemName(itemName);
        item.setQuantity(quantity);
        item.setUom(uom);
        item.setNotes(notes);

        return purchaseListItemRepository.save(item);
    }

    @Transactional
    public PurchaseListItem toggleItemChecked(Long itemId) {
        PurchaseListItem item = purchaseListItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("PurchaseListItem not found: " + itemId));

        item.setChecked(!item.getChecked());
        return purchaseListItemRepository.save(item);
    }

    @Transactional
    public void deleteItem(Long itemId) {
        purchaseListItemRepository.deleteById(itemId);
    }

    @Transactional
    public void delete(Long id) {
        purchaseListRepository.deleteById(id);
    }

    public List<PurchaseListItem> findItemsByPurchaseListId(Long purchaseListId) {
        return purchaseListItemRepository.findByPurchaseListPurchaseListId(purchaseListId);
    }
}
