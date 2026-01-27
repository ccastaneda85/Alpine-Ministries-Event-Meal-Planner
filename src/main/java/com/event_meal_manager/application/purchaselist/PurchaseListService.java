package com.event_meal_manager.application.purchaselist;

import com.event_meal_manager.domain.menu.Ingredient;
import com.event_meal_manager.domain.purchaselist.PurchaseList;
import com.event_meal_manager.domain.purchaselist.PurchaseListItem;
import com.event_meal_manager.domain.purchaselist.PurchaseListStatus;
import com.event_meal_manager.application.services.IngredientAggregationService;
import com.event_meal_manager.domain.session.Session;
import com.event_meal_manager.infrastructure.persistence.purchaselist.PurchaseListRepository;
import com.event_meal_manager.infrastructure.persistence.session.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseListService {

    private final PurchaseListRepository purchaseListRepository;
    private final SessionRepository sessionRepository;
    private final IngredientAggregationService ingredientAggregationService;

    public PurchaseList generatePurchaseListForSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + sessionId));

        Map<Ingredient, Float> aggregatedIngredients =
                ingredientAggregationService.aggregateIngredientsForSession(session);

        PurchaseList purchaseList = session.getPurchaseList();
        if (purchaseList == null) {
            purchaseList = PurchaseList.builder()
                    .session(session)
                    .generatedAt(LocalDateTime.now())
                    .status(PurchaseListStatus.DRAFT)
                    .notes("Purchase list for session: " + session.getName())
                    .build();
        } else {
            purchaseList.getItems().clear();
            purchaseList.setGeneratedAt(LocalDateTime.now());
        }

        for (Map.Entry<Ingredient, Float> entry : aggregatedIngredients.entrySet()) {
            PurchaseListItem item = PurchaseListItem.builder()
                    .quantity(entry.getValue())
                    .uom(entry.getKey().getUnitOfMeasure())
                    .notes(entry.getKey().getIngredientName())
                    .purchaseList(purchaseList)
                    .build();
            purchaseList.getItems().add(item);
        }

        return purchaseListRepository.save(purchaseList);
    }

    public PurchaseList generatePurchaseListForDateRange(Long sessionId, LocalDate startDate, LocalDate endDate) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + sessionId));

        Map<Ingredient, Float> aggregatedIngredients =
                ingredientAggregationService.aggregateIngredientsForDateRange(session, startDate, endDate);

        PurchaseList purchaseList = session.getPurchaseList();
        if (purchaseList == null) {
            purchaseList = PurchaseList.builder()
                    .session(session)
                    .generatedAt(LocalDateTime.now())
                    .status(PurchaseListStatus.DRAFT)
                    .notes("Purchase list for session: " + session.getName() +
                            " (" + startDate + " to " + endDate + ")")
                    .build();
        } else {
            purchaseList.getItems().clear();
            purchaseList.setGeneratedAt(LocalDateTime.now());
        }

        for (Map.Entry<Ingredient, Float> entry : aggregatedIngredients.entrySet()) {
            PurchaseListItem item = PurchaseListItem.builder()
                    .quantity(entry.getValue())
                    .uom(entry.getKey().getUnitOfMeasure())
                    .notes(entry.getKey().getIngredientName())
                    .purchaseList(purchaseList)
                    .build();
            purchaseList.getItems().add(item);
        }

        return purchaseListRepository.save(purchaseList);
    }

    public PurchaseList getPurchaseListById(Long id) {
        return purchaseListRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PurchaseList not found with id: " + id));
    }

    public PurchaseList getPurchaseListBySession(Long sessionId) {
        return purchaseListRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("PurchaseList not found for session: " + sessionId));
    }

    public PurchaseList updatePurchaseListStatus(Long id, PurchaseListStatus status) {
        PurchaseList purchaseList = getPurchaseListById(id);
        purchaseList.setStatus(status);
        return purchaseListRepository.save(purchaseList);
    }
}
