package com.event_meal_manager.presentation.purchasing;

import com.event_meal_manager.application.purchasing.PurchaseListService;
import com.event_meal_manager.domain.purchasing.PurchaseList;
import com.event_meal_manager.domain.purchasing.PurchaseListStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-lists")
@RequiredArgsConstructor
public class PurchaseListController {

    private final PurchaseListService purchaseListService;

    @GetMapping
    public List<PurchaseList> findAll() {
        return purchaseListService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseList> findById(@PathVariable Long id) {
        return purchaseListService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/meal-plan/{mealPlanId}")
    public List<PurchaseList> findByMealPlanId(@PathVariable Long mealPlanId) {
        return purchaseListService.findByMealPlanId(mealPlanId);
    }

    @PostMapping("/generate/{mealPlanId}")
    public ResponseEntity<PurchaseList> generateForMealPlan(@PathVariable Long mealPlanId) {
        PurchaseList purchaseList = purchaseListService.generateForMealPlan(mealPlanId);
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseList);
    }

    @PostMapping("/empty/{mealPlanId}")
    public ResponseEntity<PurchaseList> createEmpty(@PathVariable Long mealPlanId) {
        PurchaseList purchaseList = purchaseListService.createEmpty(mealPlanId);
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseList);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PurchaseList> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        PurchaseList purchaseList = purchaseListService.updateStatus(id, request.status());
        return ResponseEntity.ok(purchaseList);
    }

    @PatchMapping("/{id}/notes")
    public ResponseEntity<PurchaseList> updateNotes(@PathVariable Long id, @RequestBody UpdateNotesRequest request) {
        PurchaseList purchaseList = purchaseListService.updateNotes(id, request.notes());
        return ResponseEntity.ok(purchaseList);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        purchaseListService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record UpdateStatusRequest(PurchaseListStatus status) {}
    public record UpdateNotesRequest(String notes) {}
}
