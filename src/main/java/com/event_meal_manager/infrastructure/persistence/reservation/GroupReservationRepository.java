package com.event_meal_manager.infrastructure.persistence.reservation;

import com.event_meal_manager.domain.reservation.GroupReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GroupReservationRepository extends JpaRepository<GroupReservation, Long> {

    List<GroupReservation> findByGroupNameContainingIgnoreCase(String groupName);

    List<GroupReservation> findByArrivalDateBetween(LocalDate start, LocalDate end);

    List<GroupReservation> findByArrivalDateLessThanEqualAndDepartureDateGreaterThanEqual(LocalDate departureDate, LocalDate arrivalDate);
}
