package com.event_meal_manager.domain.planning;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "kitchen_prep_lists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenPrepList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long kitchenPrepListId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_day_id", nullable = false, unique = true)
    private EventDay eventDay;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "kitchenPrepList", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<KitchenPrepListItem> items = new ArrayList<>();
}
