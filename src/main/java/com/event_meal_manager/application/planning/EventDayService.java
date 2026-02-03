package com.event_meal_manager.application.planning;

import com.event_meal_manager.domain.planning.EventDay;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPeriodType;
import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import com.event_meal_manager.domain.reservation.GroupReservation;
import com.event_meal_manager.infrastructure.persistence.planning.EventDayRepository;
import com.event_meal_manager.infrastructure.persistence.reservation.GroupMealAttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventDayService {

    private final EventDayRepository eventDayRepository;
    private final GroupMealAttendanceRepository groupMealAttendanceRepository;

    public List<EventDay> findAll() {
        return eventDayRepository.findAll();
    }

    public Optional<EventDay> findById(Long id) {
        return eventDayRepository.findById(id);
    }

    public Optional<EventDay> findByDate(LocalDate date) {
        return eventDayRepository.findFirstByDate(date);
    }

    public List<EventDay> findAllByDate(LocalDate date) {
        return eventDayRepository.findByDate(date);
    }

    public List<EventDay> findByDateRange(LocalDate start, LocalDate end) {
        return eventDayRepository.findByDateBetween(start, end);
    }

    public List<EventDay> findByMealPlanId(Long mealPlanId) {
        return eventDayRepository.findByMealPlanMealPlanId(mealPlanId);
    }

    @Transactional
    public EventDay createStandalone(LocalDate date) {
        return eventDayRepository.findFirstByDate(date)
            .orElseGet(() -> {
                EventDay eventDay = EventDay.builder()
                    .date(date)
                    .mealPeriods(new ArrayList<>())
                    .build();

                for (MealPeriodType type : MealPeriodType.values()) {
                    MealPeriod mealPeriod = MealPeriod.builder()
                        .eventDay(eventDay)
                        .mealPeriodType(type)
                        .build();
                    eventDay.getMealPeriods().add(mealPeriod);
                }

                return eventDayRepository.save(eventDay);
            });
    }

    @Transactional
    public EventDay updateNotes(Long id, String notes) {
        EventDay eventDay = eventDayRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("EventDay not found: " + id));

        eventDay.setNotes(notes);
        return eventDayRepository.save(eventDay);
    }

    @Transactional
    public void delete(Long id) {
        eventDayRepository.deleteById(id);
    }

    public List<GroupReservation> getGroupsForEventDay(Long eventDayId) {
        return groupMealAttendanceRepository.findByMealPeriodEventDayEventDayId(eventDayId).stream()
            .map(GroupMealAttendance::getGroupReservation)
            .distinct()
            .toList();
    }

    public Map<Long, List<GroupReservation>> getGroupsForAllEventDays() {
        List<EventDay> allDays = eventDayRepository.findAll();
        return allDays.stream()
            .collect(Collectors.toMap(
                EventDay::getEventDayId,
                day -> getGroupsForEventDay(day.getEventDayId())
            ));
    }

    public List<EventDayWithGroups> findAllWithGroups() {
        List<EventDay> allDays = eventDayRepository.findAll();
        return allDays.stream()
            .map(day -> new EventDayWithGroups(day, getGroupsForEventDay(day.getEventDayId())))
            .toList();
    }

    public record EventDayWithGroups(EventDay eventDay, List<GroupReservation> groups) {}
}
