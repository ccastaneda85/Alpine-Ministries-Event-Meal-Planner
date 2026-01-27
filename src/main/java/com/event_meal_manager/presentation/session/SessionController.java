package com.event_meal_manager.presentation.session;

import com.event_meal_manager.application.session.GroupEventService;
import com.event_meal_manager.application.session.SessionService;
import com.event_meal_manager.domain.session.Day;
import com.event_meal_manager.domain.session.GroupEvent;
import com.event_meal_manager.domain.session.Session;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final GroupEventService groupEventService;

    @PostMapping
    public ResponseEntity<Session> createSession(@RequestBody CreateSessionRequest request) {
        Session session = sessionService.createSession(
                request.name(),
                request.startDate(),
                request.endDate()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Session> getSession(@PathVariable Long id) {
        Session session = sessionService.getSessionById(id);
        return ResponseEntity.ok(session);
    }

    @GetMapping
    public ResponseEntity<List<Session>> getAllSessions() {
        List<Session> sessions = sessionService.getAllSessions();
        return ResponseEntity.ok(sessions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Session> updateSession(
            @PathVariable Long id,
            @RequestBody CreateSessionRequest request) {
        Session session = sessionService.updateSession(
                id,
                request.name(),
                request.startDate(),
                request.endDate()
        );
        return ResponseEntity.ok(session);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        sessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/days")
    public ResponseEntity<List<Day>> getDays(@PathVariable Long id) {
        List<Day> days = sessionService.getDaysForSession(id);
        return ResponseEntity.ok(days);
    }

    @PostMapping("/{id}/groups")
    public ResponseEntity<GroupEvent> addGroupToSession(
            @PathVariable Long id,
            @RequestBody AddGroupRequest request) {
        GroupEvent groupEvent = groupEventService.createGroupEventForSession(
                id,
                request.groupName(),
                request.arrivalDate(),
                request.departureDate(),
                request.adultCount(),
                request.youthCount(),
                request.kidCount()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(groupEvent);
    }

    record CreateSessionRequest(String name, LocalDate startDate, LocalDate endDate) {}

    record AddGroupRequest(String groupName, LocalDate arrivalDate, LocalDate departureDate,
                           int adultCount, int youthCount, int kidCount) {}
}
