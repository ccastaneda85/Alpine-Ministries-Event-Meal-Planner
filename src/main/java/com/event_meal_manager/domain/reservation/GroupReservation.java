package com.event_meal_manager.domain.reservation;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "group_reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long groupReservationId;

    @Column(nullable = false)
    private String groupName;

    @Column(nullable = false)
    private Integer defaultAdultCount;

    @Column(nullable = false)
    private Integer defaultYouthCount;

    @Column(nullable = false)
    private Integer defaultKidCount;

    @Column(nullable = false)
    private Integer defaultCodeCount;

    @Column(nullable = false)
    private Integer defaultCustomDietCount;

    @Column(nullable = false)
    private LocalDate arrivalDate;

    @Column(nullable = false)
    private LocalDate departureDate;

    @Column(columnDefinition = "TEXT")
    private String customDietNotes;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "groupReservation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GroupMealAttendance> groupMealAttendances = new ArrayList<>();
}
