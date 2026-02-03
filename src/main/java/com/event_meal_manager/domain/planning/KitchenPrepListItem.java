package com.event_meal_manager.domain.planning;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "kitchen_prep_list_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenPrepListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long kitchenPrepListItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kitchen_prep_list_id", nullable = false)
    private KitchenPrepList kitchenPrepList;

    private Long menuItemId;

    private String menuItemName;

    private Integer adultServings;

    private Integer youthServings;

    private Integer kidServings;

    private Integer codeServings;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PrepItemStatus status = PrepItemStatus.TODO;

    private Integer priority;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
