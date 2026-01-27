package com.event_meal_manager.domain.session;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.event_meal_manager.domain.mealperiod.MealPeriod;
import com.event_meal_manager.domain.preplist.PrepList;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "days")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Day {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate date;

    @OneToMany(mappedBy = "day", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MealPeriod> mealPeriods = new ArrayList<>();

    @ManyToMany(mappedBy = "days")
    @Builder.Default
    @JsonIgnore
    private List<Session> sessions = new ArrayList<>();

    @OneToOne(mappedBy = "day", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private PrepList prepList;
}
