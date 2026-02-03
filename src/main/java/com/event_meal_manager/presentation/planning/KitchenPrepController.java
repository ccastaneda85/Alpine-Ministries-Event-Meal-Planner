package com.event_meal_manager.presentation.planning;

import com.event_meal_manager.application.planning.KitchenPrepService;
import com.event_meal_manager.domain.planning.KitchenPrepList;
import com.event_meal_manager.domain.planning.KitchenPrepListItem;
import com.event_meal_manager.domain.planning.PrepItemStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kitchen-prep")
@RequiredArgsConstructor
public class KitchenPrepController {

    private final KitchenPrepService kitchenPrepService;

    @GetMapping("/{id}")
    public ResponseEntity<KitchenPrepList> findById(@PathVariable Long id) {
        return kitchenPrepService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/event-day/{eventDayId}")
    public ResponseEntity<KitchenPrepList> findByEventDayId(@PathVariable Long eventDayId) {
        return kitchenPrepService.findByEventDayId(eventDayId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/event-day/{eventDayId}")
    public ResponseEntity<KitchenPrepList> createForEventDay(@PathVariable Long eventDayId) {
        KitchenPrepList prepList = kitchenPrepService.createForEventDay(eventDayId);
        return ResponseEntity.status(HttpStatus.CREATED).body(prepList);
    }

    @PatchMapping("/{id}/notes")
    public ResponseEntity<KitchenPrepList> updateNotes(@PathVariable Long id, @RequestBody UpdateNotesRequest request) {
        KitchenPrepList prepList = kitchenPrepService.updateNotes(id, request.notes());
        return ResponseEntity.ok(prepList);
    }

    @GetMapping("/{kitchenPrepListId}/items")
    public List<KitchenPrepListItem> findItems(@PathVariable Long kitchenPrepListId) {
        return kitchenPrepService.findItemsByPrepListId(kitchenPrepListId);
    }

    @PostMapping("/{kitchenPrepListId}/items")
    public ResponseEntity<KitchenPrepListItem> addItem(
            @PathVariable Long kitchenPrepListId,
            @RequestBody AddItemRequest request) {
        KitchenPrepListItem item = kitchenPrepService.addItem(
            kitchenPrepListId,
            request.menuItemName(),
            request.adultServings(),
            request.youthServings(),
            request.kidServings(),
            request.codeServings(),
            request.notes()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @PatchMapping("/items/{itemId}/status")
    public ResponseEntity<KitchenPrepListItem> updateItemStatus(
            @PathVariable Long itemId,
            @RequestBody UpdateStatusRequest request) {
        KitchenPrepListItem item = kitchenPrepService.updateItemStatus(itemId, request.status());
        return ResponseEntity.ok(item);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long itemId) {
        kitchenPrepService.deleteItem(itemId);
        return ResponseEntity.noContent().build();
    }

    public record UpdateNotesRequest(String notes) {}
    public record AddItemRequest(String menuItemName, Integer adultServings, Integer youthServings,
                                  Integer kidServings, Integer codeServings, String notes) {}
    public record UpdateStatusRequest(PrepItemStatus status) {}
}
