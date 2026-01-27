package com.event_meal_manager.domain.preplist;

import com.event_meal_manager.domain.session.Day;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "prep_lists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrepList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long prepListId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_id", nullable = false)
    @JsonIgnore
    private Day day;
}
