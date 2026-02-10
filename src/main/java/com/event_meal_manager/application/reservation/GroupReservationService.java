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
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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
                                    String customDietNotes, String notes) {

        GroupReservation reservation = groupReservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("GroupReservation not found: " + id));
        
        if (!reservation.getArrivalDate().equals(arrivalDate) || !reservation.getDepartureDate().equals(departureDate)) {
        updateDates(reservation, arrivalDate, departureDate);
        }

        reservation.setGroupName(groupName);
        reservation.setDefaultAdultCount(defaultAdultCount);
        reservation.setDefaultYouthCount(defaultYouthCount);
        reservation.setDefaultKidCount(defaultKidCount);
        reservation.setDefaultCodeCount(defaultCodeCount);
        reservation.setDefaultCustomDietCount(defaultCustomDietCount);
        reservation.setCustomDietNotes(customDietNotes);
        reservation.setNotes(notes);

        return groupReservationRepository.save(reservation);
    }

    @Transactional
    public void delete(Long id) {
        groupReservationRepository.deleteById(id);
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

    @Transactional
    public void updateDates(GroupReservation reservation, LocalDate newArrivalDate, LocalDate newDepartureDate) {
        Set<LocalDate> oldDates = new HashSet<>();
        LocalDate current = reservation.getArrivalDate();
        while (!current.isAfter(reservation.getDepartureDate())) {
          oldDates.add(current);
          current = current.plusDays(1);
        }

        Set<LocalDate> newDates = new HashSet<>();
        current = newArrivalDate;
        while (!current.isAfter(newDepartureDate)) {
          newDates.add(current);
          current = current.plusDays(1);
        }

        // Dates that were in the old range but not in the new — delete their attendance
        Set<LocalDate> datesToRemove = new HashSet<>(oldDates);
        datesToRemove.removeAll(newDates);

        // Dates that are in the new range but weren't in the old — create attendance
        Set<LocalDate> datesToAdd = new HashSet<>(newDates);
        datesToAdd.removeAll(oldDates);

        for (LocalDate date : datesToRemove) {
          groupMealAttendanceRepository.deleteByGroupReservationGroupReservationIdAndMealPeriodEventDayDate(
              reservation.getGroupReservationId(), date);
        }

        for (LocalDate date : datesToAdd) {
            EventDay eventDay = eventDayRepository.findFirstByDate(date)
                .orElseGet(() -> createEventDayWithMealPeriods(date));

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
        }

        reservation.setArrivalDate(newArrivalDate);
        reservation.setDepartureDate(newDepartureDate);
    }
    
}
