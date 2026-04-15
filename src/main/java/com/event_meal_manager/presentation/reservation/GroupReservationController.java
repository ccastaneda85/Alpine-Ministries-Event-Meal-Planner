package com.event_meal_manager.presentation.reservation;

import com.event_meal_manager.application.reservation.GroupReservationService;
import com.event_meal_manager.domain.reservation.GroupReservation;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/group-reservations")
@RequiredArgsConstructor
public class GroupReservationController {

    private final GroupReservationService groupReservationService;

    @GetMapping
    public List<GroupReservation> findAll() {
        return groupReservationService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupReservation> findById(@PathVariable Long id) {
        return groupReservationService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/range")
    public List<GroupReservation> findByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return groupReservationService.findByDateRange(start, end);
    }

    @PostMapping
    public ResponseEntity<GroupReservation> create(@RequestBody CreateGroupReservationRequest request) {
        GroupReservation reservation = groupReservationService.create(
            request.groupName(),
            request.defaultAdultCount(),
            request.defaultYouthCount(),
            request.defaultKidCount(),
            request.defaultCodeCount(),
            request.defaultCustomDietCount(),
            request.arrivalDate(),
            request.departureDate(),
            request.customDietNotes(),
            request.notes()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(reservation);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupReservation> update(@PathVariable Long id, @RequestBody UpdateGroupReservationRequest request) {
        GroupReservation reservation = groupReservationService.update(
            id,
            request.groupName(),
            request.defaultAdultCount(),
            request.defaultYouthCount(),
            request.defaultKidCount(),
            request.defaultCodeCount(),
            request.defaultCustomDietCount(),
            request.arrivalDate(),
            request.departureDate(),
            request.customDietNotes(),
            request.notes()
        );
        return ResponseEntity.ok(reservation);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        groupReservationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateGroupReservationRequest(
        String groupName,
        int defaultAdultCount,
        int defaultYouthCount,
        int defaultKidCount,
        int defaultCodeCount,
        int defaultCustomDietCount,
        LocalDate arrivalDate,
        LocalDate departureDate,
        String customDietNotes,
        String notes
    ) {}

    public record UpdateGroupReservationRequest(
        String groupName,
        int defaultAdultCount,
        int defaultYouthCount,
        int defaultKidCount,
        int defaultCodeCount,
        int defaultCustomDietCount,
        LocalDate arrivalDate,
        LocalDate departureDate,
        String customDietNotes,
        String notes
    ) {}
}
