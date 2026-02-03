package com.event_meal_manager.application.reservation;

import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import com.event_meal_manager.infrastructure.persistence.reservation.GroupMealAttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GroupMealAttendanceService {

    private final GroupMealAttendanceRepository groupMealAttendanceRepository;

    public List<GroupMealAttendance> findAll() {
        return groupMealAttendanceRepository.findAll();
    }

    public Optional<GroupMealAttendance> findById(Long id) {
        return groupMealAttendanceRepository.findById(id);
    }

    public List<GroupMealAttendance> findByGroupReservationId(Long groupReservationId) {
        return groupMealAttendanceRepository.findByGroupReservationGroupReservationId(groupReservationId);
    }

    public List<GroupMealAttendance> findByMealPeriodId(Long mealPeriodId) {
        return groupMealAttendanceRepository.findByMealPeriodMealPeriodId(mealPeriodId);
    }

    @Transactional
    public GroupMealAttendance updateCounts(Long id, int adultCount, int youthCount,
                                             int kidCount, int codeCount, int customDietCount) {
        GroupMealAttendance attendance = groupMealAttendanceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("GroupMealAttendance not found: " + id));

        attendance.setAdultCount(adultCount);
        attendance.setYouthCount(youthCount);
        attendance.setKidCount(kidCount);
        attendance.setCodeCount(codeCount);
        attendance.setCustomDietCount(customDietCount);

        return groupMealAttendanceRepository.save(attendance);
    }
}
