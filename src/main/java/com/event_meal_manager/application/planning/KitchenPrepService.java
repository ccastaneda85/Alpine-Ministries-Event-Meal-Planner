package com.event_meal_manager.application.planning;

import com.event_meal_manager.domain.catalog.MenuEntry;
import com.event_meal_manager.domain.planning.*;
import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import com.event_meal_manager.domain.services.AttendanceTotalsCalculator;
import com.event_meal_manager.infrastructure.persistence.planning.EventDayRepository;
import com.event_meal_manager.infrastructure.persistence.planning.KitchenPrepListItemRepository;
import com.event_meal_manager.infrastructure.persistence.planning.KitchenPrepListRepository;
import com.event_meal_manager.infrastructure.persistence.planning.MealPeriodRepository;
import com.event_meal_manager.infrastructure.persistence.reservation.GroupMealAttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KitchenPrepService {

    private final KitchenPrepListRepository kitchenPrepListRepository;
    private final KitchenPrepListItemRepository kitchenPrepListItemRepository;
    private final EventDayRepository eventDayRepository;
    private final MealPeriodRepository mealPeriodRepository;
    private final GroupMealAttendanceRepository groupMealAttendanceRepository;
    private final AttendanceTotalsCalculator attendanceTotalsCalculator;

    public Optional<KitchenPrepList> findById(Long id) {
        return kitchenPrepListRepository.findById(id);
    }

    public Optional<KitchenPrepList> findByEventDayId(Long eventDayId) {
        return kitchenPrepListRepository.findByEventDayEventDayId(eventDayId);
    }

    @Transactional
    public KitchenPrepList createForEventDay(Long eventDayId) {
        EventDay eventDay = eventDayRepository.findById(eventDayId)
            .orElseThrow(() -> new IllegalArgumentException("EventDay not found: " + eventDayId));

        KitchenPrepList prepList = KitchenPrepList.builder()
            .eventDay(eventDay)
            .items(new ArrayList<>())
            .build();

        return kitchenPrepListRepository.save(prepList);
    }

    @Transactional
    public KitchenPrepList updateStaffInstructions(Long id, String staffInstructions) {
        KitchenPrepList prepList = kitchenPrepListRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("KitchenPrepList not found: " + id));

        prepList.setStaffInstructions(staffInstructions);
        return kitchenPrepListRepository.save(prepList);
    }

    @Transactional
    public KitchenPrepListItem addItem(Long kitchenPrepListId, String menuItemName, Integer adultServings,
                                        Integer youthServings, Integer kidServings, Integer codeServings,
                                        String notes, Long mealPeriodId) {
        KitchenPrepList prepList = kitchenPrepListRepository.findById(kitchenPrepListId)
            .orElseThrow(() -> new IllegalArgumentException("KitchenPrepList not found: " + kitchenPrepListId));

        MealPeriod mealPeriod = mealPeriodId != null
            ? mealPeriodRepository.findById(mealPeriodId).orElse(null)
            : null;

        KitchenPrepListItem item = KitchenPrepListItem.builder()
            .kitchenPrepList(prepList)
            .mealPeriod(mealPeriod)
            .mealPeriodType(mealPeriod != null ? mealPeriod.getMealPeriodType() : null)
            .menuItemName(menuItemName)
            .adultServings(adultServings)
            .youthServings(youthServings)
            .kidServings(kidServings)
            .codeServings(codeServings)
            .notes(notes)
            .status(PrepItemStatus.TODO)
            .build();

        return kitchenPrepListItemRepository.save(item);
    }

    @Transactional
    public KitchenPrepListItem updateItemStatus(Long itemId, PrepItemStatus status) {
        KitchenPrepListItem item = kitchenPrepListItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("KitchenPrepListItem not found: " + itemId));

        item.setStatus(status);
        return kitchenPrepListItemRepository.save(item);
    }

    @Transactional
    public KitchenPrepListItem updateItemNotes(Long itemId, String notes) {
        KitchenPrepListItem item = kitchenPrepListItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("KitchenPrepListItem not found: " + itemId));

        item.setNotes(notes);
        return kitchenPrepListItemRepository.save(item);
    }

    @Transactional
    public KitchenPrepListItem updateItem(Long itemId, String menuItemName, Integer adultServings,
                                          Integer youthServings, Integer kidServings, Integer codeServings) {
        KitchenPrepListItem item = kitchenPrepListItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("KitchenPrepListItem not found: " + itemId));

        item.setMenuItemName(menuItemName);
        item.setAdultServings(adultServings);
        item.setYouthServings(youthServings);
        item.setKidServings(kidServings);
        item.setCodeServings(codeServings);
        if (Boolean.TRUE.equals(item.getAutoGenerated())) {
            item.setManuallyAdjusted(true);
        }
        return kitchenPrepListItemRepository.save(item);
    }

    @Transactional
    public void deleteItem(Long itemId) {
        kitchenPrepListItemRepository.deleteById(itemId);
    }

    @Transactional
    public void deletePrepList(Long kitchenPrepListId) {
        kitchenPrepListRepository.deleteById(kitchenPrepListId);
    }

    public List<KitchenPrepListItem> findItemsByPrepListId(Long kitchenPrepListId) {
        return kitchenPrepListItemRepository.findByKitchenPrepListKitchenPrepListId(kitchenPrepListId);
    }

    @Transactional
    public KitchenPrepList generateItemsFromEventDay(Long kitchenPrepListId) {
        KitchenPrepList prepList = kitchenPrepListRepository.findById(kitchenPrepListId)
            .orElseThrow(() -> new IllegalArgumentException("KitchenPrepList not found: " + kitchenPrepListId));

        // Clear any previously auto-generated items before regenerating
        kitchenPrepListItemRepository.deleteByKitchenPrepListKitchenPrepListIdAndAutoGeneratedTrue(kitchenPrepListId);

        EventDay eventDay = prepList.getEventDay();

        for (MealPeriod mealPeriod : eventDay.getMealPeriods()) {
            if (mealPeriod.getMenu() == null) continue;

            List<GroupMealAttendance> attendances = groupMealAttendanceRepository
                .findByMealPeriodMealPeriodId(mealPeriod.getMealPeriodId());
            AttendanceTotalsCalculator.AttendanceTotals totals =
                attendanceTotalsCalculator.calculateTotals(attendances);

            for (MenuEntry entry : mealPeriod.getMenu().getMenuEntries()) {
                KitchenPrepListItem item = KitchenPrepListItem.builder()
                    .kitchenPrepList(prepList)
                    .mealPeriod(mealPeriod)
                    .mealPeriodType(mealPeriod.getMealPeriodType())
                    .menuItemId(entry.getMenuItem().getMenuItemId())
                    .menuItemName(entry.getMenuItem().getMenuItemName())
                    .adultServings(totals.adultCount())
                    .youthServings(totals.youthCount())
                    .kidServings(totals.kidCount())
                    .codeServings(totals.codeCount())
                    .autoGenerated(true)
                    .status(PrepItemStatus.TODO)
                    .build();
                kitchenPrepListItemRepository.save(item);
            }
        }

        return kitchenPrepListRepository.findById(kitchenPrepListId).orElseThrow();
    }

    @Transactional
    public void clearAutoGeneratedItems(Long kitchenPrepListId) {
        kitchenPrepListItemRepository.deleteByKitchenPrepListKitchenPrepListIdAndAutoGeneratedTrue(kitchenPrepListId);
    }
}
