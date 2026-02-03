package com.event_meal_manager.application.planning;

import com.event_meal_manager.domain.planning.*;
import com.event_meal_manager.infrastructure.persistence.planning.EventDayRepository;
import com.event_meal_manager.infrastructure.persistence.planning.KitchenPrepListItemRepository;
import com.event_meal_manager.infrastructure.persistence.planning.KitchenPrepListRepository;
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
    public KitchenPrepList updateNotes(Long id, String notes) {
        KitchenPrepList prepList = kitchenPrepListRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("KitchenPrepList not found: " + id));

        prepList.setNotes(notes);
        return kitchenPrepListRepository.save(prepList);
    }

    @Transactional
    public KitchenPrepListItem addItem(Long kitchenPrepListId, String menuItemName, Integer adultServings,
                                        Integer youthServings, Integer kidServings, Integer codeServings, String notes) {
        KitchenPrepList prepList = kitchenPrepListRepository.findById(kitchenPrepListId)
            .orElseThrow(() -> new IllegalArgumentException("KitchenPrepList not found: " + kitchenPrepListId));

        KitchenPrepListItem item = KitchenPrepListItem.builder()
            .kitchenPrepList(prepList)
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
    public void deleteItem(Long itemId) {
        kitchenPrepListItemRepository.deleteById(itemId);
    }

    public List<KitchenPrepListItem> findItemsByPrepListId(Long kitchenPrepListId) {
        return kitchenPrepListItemRepository.findByKitchenPrepListKitchenPrepListId(kitchenPrepListId);
    }
}
