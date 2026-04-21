package com.event_meal_manager.application.reservation;

import com.event_meal_manager.domain.planning.EventDay;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPeriodType;
import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import com.event_meal_manager.domain.reservation.GroupReservation;
import com.event_meal_manager.infrastructure.persistence.planning.EventDayRepository;
import com.event_meal_manager.infrastructure.persistence.reservation.GroupMealAttendanceRepository;
import com.event_meal_manager.infrastructure.persistence.reservation.GroupReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GroupReservationService {

    private final GroupReservationRepository groupReservationRepository;
    private final GroupMealAttendanceRepository groupMealAttendanceRepository;
    private final EventDayRepository eventDayRepository;

    public List<GroupReservation> findAll() {
        return groupReservationRepository.findAll();
    }

    public Optional<GroupReservation> findById(Long id) {
        return groupReservationRepository.findById(id);
    }

    public List<GroupReservation> findByDateRange(LocalDate start, LocalDate end) {
        return groupReservationRepository.findByArrivalDateLessThanEqualAndDepartureDateGreaterThanEqual(end, start);
    }

    @Transactional
    public GroupReservation create(String groupName, int defaultAdultCount, int defaultYouthCount,
                                    int defaultKidCount, int defaultCodeCount, int defaultCustomDietCount,
                                    LocalDate arrivalDate, LocalDate departureDate,
                                    String customDietNotes, String notes) {

        GroupReservation reservation = GroupReservation.builder()
            .groupName(groupName)
            .defaultAdultCount(defaultAdultCount)
            .defaultYouthCount(defaultYouthCount)
            .defaultKidCount(defaultKidCount)
            .defaultCodeCount(defaultCodeCount)
            .defaultCustomDietCount(defaultCustomDietCount)
            .arrivalDate(arrivalDate)
            .departureDate(departureDate)
            .customDietNotes(customDietNotes)
            .notes(notes)
            .groupMealAttendances(new ArrayList<>())
            .build();

        reservation = groupReservationRepository.save(reservation);
        initializeAttendance(reservation);

        return reservation;
    }

    @Transactional
    public GroupReservation update(Long id, String groupName, int defaultAdultCount, int defaultYouthCount,
                                    int defaultKidCount, int defaultCodeCount, int defaultCustomDietCount,
                                    LocalDate arrivalDate, LocalDate departureDate,
                                    String customDietNotes, String notes, boolean resetAttendance) {

        GroupReservation reservation = groupReservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("GroupReservation not found: " + id));

        reservation.setGroupName(groupName);
        reservation.setDefaultAdultCount(defaultAdultCount);
        reservation.setDefaultYouthCount(defaultYouthCount);
        reservation.setDefaultKidCount(defaultKidCount);
        reservation.setDefaultCodeCount(defaultCodeCount);
        reservation.setDefaultCustomDietCount(defaultCustomDietCount);
        reservation.setArrivalDate(arrivalDate);
        reservation.setDepartureDate(departureDate);
        reservation.setCustomDietNotes(customDietNotes);
        reservation.setNotes(notes);

        groupReservationRepository.save(reservation);

        List<GroupMealAttendance> attendances = groupMealAttendanceRepository.findByGroupReservationGroupReservationId(id);

        // Delete records outside the new date range
        List<GroupMealAttendance> toDelete = attendances.stream()
            .filter(a -> {
                LocalDate date = a.getMealPeriod().getEventDay().getDate();
                return date.isBefore(arrivalDate) || date.isAfter(departureDate);
            })
            .collect(java.util.stream.Collectors.toList());
        groupMealAttendanceRepository.deleteAll(toDelete);

        // Optionally reset counts on remaining records
        List<GroupMealAttendance> toKeep = attendances.stream()
            .filter(a -> {
                LocalDate date = a.getMealPeriod().getEventDay().getDate();
                return !date.isBefore(arrivalDate) && !date.isAfter(departureDate);
            })
            .collect(java.util.stream.Collectors.toList());
        if (resetAttendance) {
            for (GroupMealAttendance a : toKeep) {
                a.setAdultCount(defaultAdultCount);
                a.setYouthCount(defaultYouthCount);
                a.setKidCount(defaultKidCount);
                a.setCodeCount(defaultCodeCount);
                a.setCustomDietCount(defaultCustomDietCount);
                groupMealAttendanceRepository.save(a);
            }
        }

        // Create attendance records for any newly added days
        initializeAttendanceForRange(reservation, arrivalDate, departureDate, toKeep);

        return reservation;
    }

    @Transactional
    public void delete(Long id) {
        groupReservationRepository.deleteById(id);
    }

    private void initializeAttendanceForRange(GroupReservation reservation,
                                               LocalDate arrivalDate, LocalDate departureDate,
                                               List<GroupMealAttendance> existing) {
        // Collect meal period IDs that already have records so we don't duplicate
        java.util.Set<Long> existingMealPeriodIds = existing.stream()
            .map(a -> a.getMealPeriod().getMealPeriodId())
            .collect(java.util.stream.Collectors.toSet());

        LocalDate current = arrivalDate;
        while (!current.isAfter(departureDate)) {
            final LocalDate dateToProcess = current;
            EventDay eventDay = eventDayRepository.findFirstByDate(dateToProcess)
                .orElseGet(() -> createEventDayWithMealPeriods(dateToProcess));

            for (MealPeriod mealPeriod : eventDay.getMealPeriods()) {
                if (!existingMealPeriodIds.contains(mealPeriod.getMealPeriodId())) {
                    GroupMealAttendance attendance = GroupMealAttendance.builder()
                        .groupReservation(reservation)
                        .mealPeriod(mealPeriod)
                        .adultCount(reservation.getDefaultAdultCount())
                        .youthCount(reservation.getDefaultYouthCount())
                        .kidCount(reservation.getDefaultKidCount())
                        .codeCount(reservation.getDefaultCodeCount())
                        .customDietCount(reservation.getDefaultCustomDietCount())
                        .build();
                    groupMealAttendanceRepository.save(attendance);
                }
            }
            current = current.plusDays(1);
        }
    }

    private void initializeAttendance(GroupReservation reservation) {
        LocalDate current = reservation.getArrivalDate();

        while (!current.isAfter(reservation.getDepartureDate())) {
            final LocalDate dateToProcess = current;
            EventDay eventDay = eventDayRepository.findFirstByDate(dateToProcess)
                .orElseGet(() -> createEventDayWithMealPeriods(dateToProcess));

            for (MealPeriod mealPeriod : eventDay.getMealPeriods()) {
                GroupMealAttendance attendance = GroupMealAttendance.builder()
                    .groupReservation(reservation)
                    .mealPeriod(mealPeriod)
                    .adultCount(reservation.getDefaultAdultCount())
                    .youthCount(reservation.getDefaultYouthCount())
                    .kidCount(reservation.getDefaultKidCount())
                    .codeCount(reservation.getDefaultCodeCount())
                    .customDietCount(reservation.getDefaultCustomDietCount())
                    .build();

                groupMealAttendanceRepository.save(attendance);
            }

            current = current.plusDays(1);
        }
    }

    private EventDay createEventDayWithMealPeriods(LocalDate date) {
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
    }
}
