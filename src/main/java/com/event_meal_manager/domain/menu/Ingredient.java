package com.event_meal_manager.domain.menu;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ingredients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ingredientId;

    @Column(nullable = false)
    private String ingredientName;

    @Column(nullable = false)
    private Float adultPortion;

    @Column(nullable = false)
    private Float youthPortion;

    @Column(nullable = false)
    private Float kidPortion;

    @Column(nullable = false)
    private String unitOfMeasure;
}
