package com.event_meal_manager.application.session;

import com.event_meal_manager.domain.mealperiod.MealPeriod;
import com.event_meal_manager.domain.mealperiod.MealPeriodType;
import com.event_meal_manager.domain.session.Day;
import com.event_meal_manager.domain.session.GroupEvent;
import com.event_meal_manager.infrastructure.persistence.session.DayRepository;
import com.event_meal_manager.infrastructure.persistence.session.GroupEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DayService {

    private final DayRepository dayRepository;
    private final GroupEventRepository groupEventRepository;

    public Day findOrCreateDay(LocalDate date) {
        return dayRepository.findByDate(date)
                .orElseGet(() -> createDay(date));
    }

    private Day createDay(LocalDate date) {
        Day day = Day.builder()
                .date(date)
                .build();

        // Initialize 3 meal periods for each day
        List<MealPeriod> mealPeriods = new ArrayList<>();
        for (MealPeriodType type : MealPeriodType.values()) {
            MealPeriod mealPeriod = MealPeriod.builder()
                    .mealPeriodType(type)
                    .day(day)
                    .build();
            mealPeriods.add(mealPeriod);
        }
        day.setMealPeriods(mealPeriods);

        return dayRepository.save(day);
    }

    public Day getDayById(Long id) {
        return dayRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Day not found with id: " + id));
    }

    public Day getDayByDate(LocalDate date) {
        return dayRepository.findByDate(date)
                .orElseThrow(() -> new RuntimeException("Day not found for date: " + date));
    }

    public List<Day> getDaysInRange(LocalDate startDate, LocalDate endDate) {
        return dayRepository.findDaysInRange(startDate, endDate);
    }

    public List<Day> findOrCreateDaysInRange(LocalDate startDate, LocalDate endDate) {
        List<Day> days = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            days.add(findOrCreateDay(currentDate));
            currentDate = currentDate.plusDays(1);
        }

        return days;
    }

    public HeadCount calculateHeadcountForDate(LocalDate date) {
        List<GroupEvent> events = groupEventRepository.findByDateInRange(date);

        int adults = 0;
        int youth = 0;
        int kids = 0;

        for (GroupEvent event : events) {
            adults += event.getAdultCount();
            youth += event.getYouthCount();
            kids += event.getKidCount();
        }

        return new HeadCount(adults, youth, kids);
    }

    public record HeadCount(int adults, int youth, int kids) {}
}
