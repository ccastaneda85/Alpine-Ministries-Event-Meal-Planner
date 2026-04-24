package com.event_meal_manager.presentation.purchasing;

import com.event_meal_manager.application.purchasing.PurchaseListService;
import com.event_meal_manager.domain.purchasing.PurchaseList;
import com.event_meal_manager.domain.purchasing.PurchaseListStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/purchase-lists")
@RequiredArgsConstructor
public class PurchaseListController {

    private final PurchaseListService purchaseListService;

    @GetMapping
    public List<PurchaseListDTO> findAll() {
        return purchaseListService.findAll().stream().map(this::toDTO).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseListDTO> findById(@PathVariable Long id) {
        return purchaseListService.findById(id)
            .map(p -> ResponseEntity.ok(toDTO(p)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/meal-plan/{mealPlanId}")
    public List<PurchaseListDTO> findByMealPlanId(@PathVariable Long mealPlanId) {
        return purchaseListService.findByMealPlanId(mealPlanId).stream().map(this::toDTO).toList();
    }

    @PostMapping("/generate/{mealPlanId}")
    public ResponseEntity<PurchaseListDTO> generateForMealPlan(@PathVariable Long mealPlanId) {
        PurchaseList purchaseList = purchaseListService.generateForMealPlan(mealPlanId);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(purchaseList));
    }

    @PostMapping("/empty/{mealPlanId}")
    public ResponseEntity<PurchaseListDTO> createEmpty(@PathVariable Long mealPlanId) {
        PurchaseList purchaseList = purchaseListService.createEmpty(mealPlanId);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(purchaseList));
    }

    @PostMapping("/{id}/clear-generated")
    public ResponseEntity<Integer> clearGenerated(@PathVariable Long id) {
        int removed = purchaseListService.clearGeneratedItems(id);
        return ResponseEntity.ok(removed);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PurchaseListDTO> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        PurchaseList purchaseList = purchaseListService.updateStatus(id, request.status());
        return ResponseEntity.ok(toDTO(purchaseList));
    }

    @PatchMapping("/{id}/notes")
    public ResponseEntity<PurchaseListDTO> updateNotes(@PathVariable Long id, @RequestBody UpdateNotesRequest request) {
        PurchaseList purchaseList = purchaseListService.updateNotes(id, request.notes());
        return ResponseEntity.ok(toDTO(purchaseList));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        purchaseListService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private PurchaseListDTO toDTO(PurchaseList p) {
        return new PurchaseListDTO(
            p.getPurchaseListId(),
            p.getMealPlan() != null ? p.getMealPlan().getMealPlanId() : null,
            p.getGeneratedAt(),
            p.getNotes(),
            p.getStatus()
        );
    }

    public record PurchaseListDTO(
        Long purchaseListId,
        Long mealPlanId,
        LocalDateTime generatedAt,
        String notes,
        PurchaseListStatus status
    ) {}

    public record UpdateStatusRequest(PurchaseListStatus status) {}
    public record UpdateNotesRequest(String notes) {}
}
