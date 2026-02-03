package com.event_meal_manager.presentation.purchasing;

import com.event_meal_manager.application.purchasing.PurchaseListService;
import com.event_meal_manager.domain.purchasing.PurchaseListItem;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-list-items")
@RequiredArgsConstructor
public class PurchaseListItemController {

    private final PurchaseListService purchaseListService;

    @GetMapping("/purchase-list/{purchaseListId}")
    public List<PurchaseListItem> findByPurchaseListId(@PathVariable Long purchaseListId) {
        return purchaseListService.findItemsByPurchaseListId(purchaseListId);
    }

    @PostMapping("/purchase-list/{purchaseListId}")
    public ResponseEntity<PurchaseListItem> addItem(
            @PathVariable Long purchaseListId,
            @RequestBody AddItemRequest request) {
        PurchaseListItem item = purchaseListService.addItem(
            purchaseListId,
            request.itemName(),
            request.quantity(),
            request.uom(),
            request.notes()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<PurchaseListItem> updateItem(
            @PathVariable Long itemId,
            @RequestBody UpdateItemRequest request) {
        PurchaseListItem item = purchaseListService.updateItem(
            itemId,
            request.itemName(),
            request.quantity(),
            request.uom(),
            request.notes()
        );
        return ResponseEntity.ok(item);
    }

    @PatchMapping("/{itemId}/toggle-checked")
    public ResponseEntity<PurchaseListItem> toggleChecked(@PathVariable Long itemId) {
        PurchaseListItem item = purchaseListService.toggleItemChecked(itemId);
        return ResponseEntity.ok(item);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long itemId) {
        purchaseListService.deleteItem(itemId);
        return ResponseEntity.noContent().build();
    }

    public record AddItemRequest(String itemName, float quantity, String uom, String notes) {}
    public record UpdateItemRequest(String itemName, float quantity, String uom, String notes) {}
}
