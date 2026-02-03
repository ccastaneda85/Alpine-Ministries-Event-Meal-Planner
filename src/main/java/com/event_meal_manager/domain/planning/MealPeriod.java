package com.event_meal_manager.domain.planning;

import com.event_meal_manager.domain.catalog.Menu;
import com.event_meal_manager.domain.reservation.GroupMealAttendance;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meal_periods", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_day_id", "meal_period_type"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mealPeriodId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_day_id", nullable = false)
    private EventDay eventDay;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_period_type", nullable = false)
    private MealPeriodType mealPeriodType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id")
    private Menu menu;

    @OneToMany(mappedBy = "mealPeriod", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GroupMealAttendance> groupMealAttendances = new ArrayList<>();
}
