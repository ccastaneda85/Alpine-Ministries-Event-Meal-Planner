package com.event_meal_manager.domain.planning;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "event_days", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventDayId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_id")
    private MealPlan mealPlan;

    @OneToMany(mappedBy = "eventDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MealPeriod> mealPeriods = new ArrayList<>();

    @OneToOne(mappedBy = "eventDay", cascade = CascadeType.ALL, orphanRemoval = true)
    private KitchenPrepList kitchenPrepList;
}
