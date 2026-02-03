package com.event_meal_manager.domain.services;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class IngredientAggregationService {

    public Map<String, AggregatedIngredient> aggregate(Map<String, AggregatedIngredient> existing, String ingredientName, String uom, float quantity) {
        Map<String, AggregatedIngredient> result = new HashMap<>(existing);
        String key = createKey(ingredientName, uom);

        if (result.containsKey(key)) {
            AggregatedIngredient current = result.get(key);
            result.put(key, new AggregatedIngredient(
                current.ingredientName(),
                current.uom(),
                current.quantity() + quantity,
                current.ingredientId()
            ));
        } else {
            result.put(key, new AggregatedIngredient(ingredientName, uom, quantity, null));
        }

        return result;
    }

    public Map<String, AggregatedIngredient> aggregateWithId(Map<String, AggregatedIngredient> existing, String ingredientName, String uom, float quantity, Long ingredientId) {
        Map<String, AggregatedIngredient> result = new HashMap<>(existing);
        String key = createKey(ingredientName, uom);

        if (result.containsKey(key)) {
            AggregatedIngredient current = result.get(key);
            result.put(key, new AggregatedIngredient(
                current.ingredientName(),
                current.uom(),
                current.quantity() + quantity,
                ingredientId != null ? ingredientId : current.ingredientId()
            ));
        } else {
            result.put(key, new AggregatedIngredient(ingredientName, uom, quantity, ingredientId));
        }

        return result;
    }

    private String createKey(String ingredientName, String uom) {
        return ingredientName.toLowerCase().trim() + "|" + uom.toLowerCase().trim();
    }

    public record AggregatedIngredient(
        String ingredientName,
        String uom,
        float quantity,
        Long ingredientId
    ) {}
}
