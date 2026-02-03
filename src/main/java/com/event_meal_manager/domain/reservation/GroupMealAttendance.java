package com.event_meal_manager.domain.reservation;

import com.event_meal_manager.domain.planning.MealPeriod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "group_meal_attendances", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"group_reservation_id", "meal_period_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMealAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long groupMealAttendanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_reservation_id", nullable = false)
    private GroupReservation groupReservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_period_id", nullable = false)
    private MealPeriod mealPeriod;

    @Column(nullable = false)
    private Integer adultCount;

    @Column(nullable = false)
    private Integer youthCount;

    @Column(nullable = false)
    private Integer kidCount;

    @Column(nullable = false)
    private Integer codeCount;

    @Column(nullable = false)
    private Integer customDietCount;
}
