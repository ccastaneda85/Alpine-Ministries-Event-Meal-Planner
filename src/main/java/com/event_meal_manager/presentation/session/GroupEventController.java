package com.event_meal_manager.presentation.session;

import com.event_meal_manager.application.session.GroupEventService;
import com.event_meal_manager.domain.session.GroupEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/group-events")
@RequiredArgsConstructor
public class GroupEventController {

    private final GroupEventService groupEventService;

    @PostMapping
    public ResponseEntity<GroupEvent> createGroupEvent(@RequestBody CreateGroupEventRequest request) {
        GroupEvent groupEvent = groupEventService.createGroupEvent(
                request.groupId(),
                request.arrivalDate(),
                request.departureDate(),
                request.adultCount(),
                request.youthCount(),
                request.kidCount()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(groupEvent);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupEvent> getGroupEvent(@PathVariable Long id) {
        GroupEvent groupEvent = groupEventService.getGroupEventById(id);
        return ResponseEntity.ok(groupEvent);
    }

    @GetMapping
    public ResponseEntity<List<GroupEvent>> getAllGroupEvents() {
        List<GroupEvent> groupEvents = groupEventService.getAllGroupEvents();
        return ResponseEntity.ok(groupEvents);
    }

    @GetMapping("/by-group/{groupId}")
    public ResponseEntity<List<GroupEvent>> getGroupEventsByGroup(@PathVariable Long groupId) {
        List<GroupEvent> groupEvents = groupEventService.getGroupEventsByGroup(groupId);
        return ResponseEntity.ok(groupEvents);
    }

    @GetMapping("/by-date")
    public ResponseEntity<List<GroupEvent>> getGroupEventsForDate(@RequestParam LocalDate date) {
        List<GroupEvent> groupEvents = groupEventService.getGroupEventsForDate(date);
        return ResponseEntity.ok(groupEvents);
    }

    @GetMapping("/by-date-range")
    public ResponseEntity<List<GroupEvent>> getGroupEventsForDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<GroupEvent> groupEvents = groupEventService.getGroupEventsForDateRange(startDate, endDate);
        return ResponseEntity.ok(groupEvents);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupEvent> updateGroupEvent(
            @PathVariable Long id,
            @RequestBody UpdateGroupEventRequest request) {
        GroupEvent groupEvent = groupEventService.updateGroupEvent(
                id,
                request.arrivalDate(),
                request.departureDate(),
                request.adultCount(),
                request.youthCount(),
                request.kidCount()
        );
        return ResponseEntity.ok(groupEvent);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroupEvent(@PathVariable Long id) {
        groupEventService.deleteGroupEvent(id);
        return ResponseEntity.noContent().build();
    }

    record CreateGroupEventRequest(
            Long groupId,
            LocalDate arrivalDate,
            LocalDate departureDate,
            int adultCount,
            int youthCount,
            int kidCount
    ) {}

    record UpdateGroupEventRequest(
            LocalDate arrivalDate,
            LocalDate departureDate,
            int adultCount,
            int youthCount,
            int kidCount
    ) {}
}
