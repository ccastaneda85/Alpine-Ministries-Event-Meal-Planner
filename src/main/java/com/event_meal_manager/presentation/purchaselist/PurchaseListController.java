package com.event_meal_manager.presentation.purchaselist;

import com.event_meal_manager.application.purchaselist.PurchaseListService;
import com.event_meal_manager.domain.purchaselist.PurchaseList;
import com.event_meal_manager.domain.purchaselist.PurchaseListStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/purchaselists")
@RequiredArgsConstructor
public class PurchaseListController {

    private final PurchaseListService purchaseListService;

    @PostMapping("/session/{sessionId}")
    public ResponseEntity<PurchaseList> generatePurchaseListForSession(@PathVariable Long sessionId) {
        PurchaseList purchaseList = purchaseListService.generatePurchaseListForSession(sessionId);
        return ResponseEntity.ok(purchaseList);
    }

    @PostMapping("/session/{sessionId}/daterange")
    public ResponseEntity<PurchaseList> generatePurchaseListForDateRange(
            @PathVariable Long sessionId,
            @RequestBody DateRangeRequest request) {
        PurchaseList purchaseList = purchaseListService.generatePurchaseListForDateRange(
                sessionId,
                request.startDate(),
                request.endDate()
        );
        return ResponseEntity.ok(purchaseList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseList> getPurchaseList(@PathVariable Long id) {
        PurchaseList purchaseList = purchaseListService.getPurchaseListById(id);
        return ResponseEntity.ok(purchaseList);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<PurchaseList> getPurchaseListBySession(@PathVariable Long sessionId) {
        PurchaseList purchaseList = purchaseListService.getPurchaseListBySession(sessionId);
        return ResponseEntity.ok(purchaseList);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PurchaseList> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        PurchaseList purchaseList = purchaseListService.updatePurchaseListStatus(id, request.status());
        return ResponseEntity.ok(purchaseList);
    }

    record DateRangeRequest(LocalDate startDate, LocalDate endDate) {}
    record UpdateStatusRequest(PurchaseListStatus status) {}
}
