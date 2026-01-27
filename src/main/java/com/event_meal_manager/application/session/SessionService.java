package com.event_meal_manager.application.session;

import com.event_meal_manager.domain.session.Day;
import com.event_meal_manager.domain.session.Session;
import com.event_meal_manager.infrastructure.persistence.session.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;
    private final DayService dayService;

    public Session createSession(String name, LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new RuntimeException("Start date cannot be after end date");
        }

        Session session = Session.builder()
                .name(name)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        // Find or create days for the session's date range and link them
        List<Day> days = dayService.findOrCreateDaysInRange(startDate, endDate);
        session.setDays(days);

        return sessionRepository.save(session);
    }

    public Session getSessionById(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + id));
    }

    public List<Session> getAllSessions() {
        return sessionRepository.findAll();
    }

    public Session updateSession(Long id, String name, LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new RuntimeException("Start date cannot be after end date");
        }

        Session session = getSessionById(id);
        session.setName(name);
        session.setStartDate(startDate);
        session.setEndDate(endDate);

        // Update the days linked to this session
        List<Day> days = dayService.findOrCreateDaysInRange(startDate, endDate);
        session.setDays(days);

        return sessionRepository.save(session);
    }

    public void deleteSession(Long id) {
        if (!sessionRepository.existsById(id)) {
            throw new RuntimeException("Session not found with id: " + id);
        }
        sessionRepository.deleteById(id);
    }

    public List<Day> getDaysForSession(Long sessionId) {
        Session session = getSessionById(sessionId);
        return session.getDays();
    }
}
