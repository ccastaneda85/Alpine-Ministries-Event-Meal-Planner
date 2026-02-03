package com.event_meal_manager.domain.catalog;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "menu_item_recipes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItemRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long menuItemRecipeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false)
    private Float adultPortion;

    @Column(nullable = false)
    private Float youthPortion;

    @Column(nullable = false)
    private Float kidPortion;

    @Column(nullable = false)
    private Float codePortion;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
