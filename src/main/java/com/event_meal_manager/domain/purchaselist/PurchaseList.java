package com.event_meal_manager.domain.purchaselist;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.event_meal_manager.domain.session.Session;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "purchase_lists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long purchaseListId;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PurchaseListStatus status;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private Session session;

    @OneToMany(mappedBy = "purchaseList", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseListItem> items = new ArrayList<>();
}
