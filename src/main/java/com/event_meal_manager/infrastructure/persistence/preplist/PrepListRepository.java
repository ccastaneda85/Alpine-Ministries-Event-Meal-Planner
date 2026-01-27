package com.event_meal_manager.infrastructure.persistence.preplist;

import com.event_meal_manager.domain.preplist.PrepList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrepListRepository extends JpaRepository<PrepList, Long> {

    Optional<PrepList> findByDayId(Long dayId);
}
