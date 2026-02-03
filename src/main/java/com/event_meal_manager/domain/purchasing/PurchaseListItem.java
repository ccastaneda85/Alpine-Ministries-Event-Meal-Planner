package com.event_meal_manager.domain.purchasing;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "purchase_list_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long purchaseListItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_list_id", nullable = false)
    private PurchaseList purchaseList;

    @Column(nullable = false)
    private String purchaseListItemName;

    @Column(nullable = false)
    private Float quantity;

    @Column(nullable = false)
    private String uom;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean checked = false;

    private Long ingredientId;
}
