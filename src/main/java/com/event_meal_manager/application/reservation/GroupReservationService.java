package com.event_meal_manager.application.reservation;

import com.event_meal_manager.application.planning.EventDayService;
import com.event_meal_manager.domain.planning.EventDay;
import com.event_meal_manager.domain.planning.MealPeriod;
import com.event_meal_manager.domain.planning.MealPeriodType;
import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import com.event_meal_manager.domain.reservation.GroupReservation;
import com.event_meal_manager.infrastructure.persistence.planning.EventDayRepository;
import com.event_meal_manager.infrastructure.persistence.planning.MealPlanRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupReservationService {

    private final GroupReservationRepository groupReservationRepository;
    private final GroupMealAttendanceRepository groupMealAttendanceRepository;
    private final EventDayRepository eventDayRepository;
    private final MealPlanRepository mealPlanRepository;

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
        
        boolean datesChanged = !reservation.getArrivalDate().equals(arrivalDate) || !reservation.getDepartureDate().equals(departureDate);
        if (datesChanged) {
            updateDates(reservation, arrivalDate, departureDate);
        }

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
            .collect(Collectors.toList());

        Set<Long> removedEventDayIds = toDelete.stream()
            .map(a -> a.getMealPeriod().getEventDay().getEventDayId())
            .collect(Collectors.toSet());

        groupMealAttendanceRepository.deleteAll(toDelete);

        for (Long eventDayId : removedEventDayIds) {
            if (groupMealAttendanceRepository.findByMealPeriodEventDayEventDayId(eventDayId).isEmpty()) {
                eventDayRepository.findById(eventDayId).ifPresent(eventDayRepository::delete);
            }
        }

        // Optionally reset counts on remaining records
        List<GroupMealAttendance> toKeep = attendances.stream()
            .filter(a -> {
                LocalDate date = a.getMealPeriod().getEventDay().getDate();
                return !date.isBefore(arrivalDate) && !date.isAfter(departureDate);
            })
            .collect(Collectors.toList());
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
        GroupReservation reservation = groupReservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("GroupReservation not found: " + id));

        List<EventDay> eventDaysToCheck = getDatesInRange(reservation.getArrivalDate(), reservation.getDepartureDate())
            .stream()
            .map(eventDayRepository::findFirstByDate)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toList());

        groupReservationRepository.deleteById(id);

        for (EventDay eventDay : eventDaysToCheck) {
            if (groupMealAttendanceRepository.findByMealPeriodEventDayEventDayId(eventDay.getEventDayId()).isEmpty()) {
                eventDayRepository.delete(eventDay);
            }
        }
    }

    @Transactional(readOnly = true)
    public ReservationImpact getDeletionImpact(Long id) {
        GroupReservation reservation = groupReservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("GroupReservation not found: " + id));

        List<DateImpact> impacts = getDatesInRange(reservation.getArrivalDate(), reservation.getDepartureDate())
            .stream()
            .map(date -> computeDateImpact(date, id))
            .collect(Collectors.toList());

        return new ReservationImpact(impacts);
    }

    @Transactional(readOnly = true)
    public ReservationImpact getShrinkImpact(Long id, LocalDate newStart, LocalDate newEnd) {
        GroupReservation reservation = groupReservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("GroupReservation not found: " + id));

        List<DateImpact> impacts = getDatesInRange(reservation.getArrivalDate(), reservation.getDepartureDate())
            .stream()
            .filter(date -> date.isBefore(newStart) || date.isAfter(newEnd))
            .map(date -> computeDateImpact(date, id))
            .collect(Collectors.toList());

        return new ReservationImpact(impacts);
    }

    public record DateImpact(LocalDate date, boolean isLastGroup, boolean hasMealPlan, boolean hasKitchenPrepList) {}
    public record ReservationImpact(List<DateImpact> affectedDates) {}

    private void initializeAttendanceForRange(GroupReservation reservation,
                                               LocalDate arrivalDate, LocalDate departureDate,
                                               List<GroupMealAttendance> existing) {
        // Collect meal period IDs that already have records so we don't duplicate
        Set<Long> existingMealPeriodIds = existing.stream()
            .map(a -> a.getMealPeriod().getMealPeriodId())
            .collect(Collectors.toSet());

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

    private List<LocalDate> getDatesInRange(LocalDate start, LocalDate end) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate current = start;
        while (!current.isAfter(end)) {
            dates.add(current);
            current = current.plusDays(1);
        }
        return dates;
    }

    private DateImpact computeDateImpact(LocalDate date, Long excludeReservationId) {
        Optional<EventDay> maybeEventDay = eventDayRepository.findFirstByDate(date);
        if (maybeEventDay.isEmpty()) {
            return new DateImpact(date, false, false, false);
        }
        EventDay eventDay = maybeEventDay.get();
        List<GroupMealAttendance> allAttendance = groupMealAttendanceRepository
            .findByMealPeriodEventDayEventDayId(eventDay.getEventDayId());
        long otherGroupCount = allAttendance.stream()
            .filter(a -> !a.getGroupReservation().getGroupReservationId().equals(excludeReservationId))
            .map(a -> a.getGroupReservation().getGroupReservationId())
            .distinct()
            .count();
        boolean hasMealPlan = mealPlanRepository
            .existsByStartDateLessThanEqualAndEndDateGreaterThanEqual(date, date);
        return new DateImpact(
            date,
            otherGroupCount == 0,
            hasMealPlan,
            eventDay.getKitchenPrepList() != null
        );
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
