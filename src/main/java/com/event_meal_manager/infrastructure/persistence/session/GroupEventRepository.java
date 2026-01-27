package com.event_meal_manager.infrastructure.persistence.session;

import com.event_meal_manager.domain.session.GroupEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GroupEventRepository extends JpaRepository<GroupEvent, Long> {

    List<GroupEvent> findByGroupId(Long groupId);

    @Query("SELECT ge FROM GroupEvent ge WHERE ge.arrivalDate <= :date AND ge.departureDate >= :date")
    List<GroupEvent> findByDateInRange(@Param("date") LocalDate date);

    @Query("SELECT ge FROM GroupEvent ge WHERE " +
           "(ge.arrivalDate <= :endDate AND ge.departureDate >= :startDate)")
    List<GroupEvent> findByDateRangeOverlap(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
