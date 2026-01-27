package com.event_meal_manager.application.session;

import com.event_meal_manager.domain.session.Group;
import com.event_meal_manager.domain.session.GroupEvent;
import com.event_meal_manager.infrastructure.persistence.session.GroupEventRepository;
import com.event_meal_manager.infrastructure.persistence.session.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupEventService {

    private final GroupEventRepository groupEventRepository;
    private final GroupRepository groupRepository;
    private final DayService dayService;

    public GroupEvent createGroupEvent(Long groupId, LocalDate arrivalDate, LocalDate departureDate,
                                        int adultCount, int youthCount, int kidCount) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));

        if (arrivalDate.isAfter(departureDate)) {
            throw new RuntimeException("Arrival date cannot be after departure date");
        }

        GroupEvent groupEvent = GroupEvent.builder()
                .group(group)
                .arrivalDate(arrivalDate)
                .departureDate(departureDate)
                .adultCount(adultCount)
                .youthCount(youthCount)
                .kidCount(kidCount)
                .build();

        groupEvent = groupEventRepository.save(groupEvent);

        // Create days for the date range if they don't exist
        dayService.findOrCreateDaysInRange(arrivalDate, departureDate);

        return groupEvent;
    }

    public GroupEvent getGroupEventById(Long id) {
        return groupEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("GroupEvent not found with id: " + id));
    }

    public List<GroupEvent> getGroupEventsByGroup(Long groupId) {
        return groupEventRepository.findByGroupId(groupId);
    }

    public List<GroupEvent> getGroupEventsForDate(LocalDate date) {
        return groupEventRepository.findByDateInRange(date);
    }

    public List<GroupEvent> getGroupEventsForDateRange(LocalDate startDate, LocalDate endDate) {
        return groupEventRepository.findByDateRangeOverlap(startDate, endDate);
    }

    public List<GroupEvent> getAllGroupEvents() {
        return groupEventRepository.findAll();
    }

    public GroupEvent updateGroupEvent(Long id, LocalDate arrivalDate, LocalDate departureDate,
                                        int adultCount, int youthCount, int kidCount) {
        GroupEvent groupEvent = getGroupEventById(id);

        if (arrivalDate.isAfter(departureDate)) {
            throw new RuntimeException("Arrival date cannot be after departure date");
        }

        groupEvent.setArrivalDate(arrivalDate);
        groupEvent.setDepartureDate(departureDate);
        groupEvent.setAdultCount(adultCount);
        groupEvent.setYouthCount(youthCount);
        groupEvent.setKidCount(kidCount);

        groupEvent = groupEventRepository.save(groupEvent);

        // Ensure days exist for the new date range
        dayService.findOrCreateDaysInRange(arrivalDate, departureDate);

        return groupEvent;
    }

    public void deleteGroupEvent(Long id) {
        if (!groupEventRepository.existsById(id)) {
            throw new RuntimeException("GroupEvent not found with id: " + id);
        }
        groupEventRepository.deleteById(id);
    }
}
