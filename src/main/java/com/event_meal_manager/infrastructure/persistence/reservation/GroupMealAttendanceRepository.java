package com.event_meal_manager.infrastructure.persistence.reservation;

import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

@Repository
public interface GroupMealAttendanceRepository extends JpaRepository<GroupMealAttendance, Long> {

    List<GroupMealAttendance> findByGroupReservationGroupReservationId(Long groupReservationId);

    List<GroupMealAttendance> findByMealPeriodMealPeriodId(Long mealPeriodId);

    List<GroupMealAttendance> findByMealPeriodEventDayEventDayId(Long eventDayId);

    Optional<GroupMealAttendance> findByGroupReservationGroupReservationIdAndMealPeriodMealPeriodId(Long groupReservationId, Long mealPeriodId);

    void deleteByGroupReservationGroupReservationIdAndMealPeriodEventDayDate(Long groupReservationId, LocalDate date);
}
