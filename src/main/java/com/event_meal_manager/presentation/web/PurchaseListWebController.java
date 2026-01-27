package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.purchaselist.PurchaseListService;
import com.event_meal_manager.domain.purchaselist.PurchaseList;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/purchaselists")
@RequiredArgsConstructor
public class PurchaseListWebController {

    private final PurchaseListService purchaseListService;

    @GetMapping("/session/{sessionId}")
    public String viewPurchaseListForSession(@PathVariable Long sessionId, Model model) {
        try {
            PurchaseList purchaseList = purchaseListService.getPurchaseListBySession(sessionId);
            model.addAttribute("purchaseList", purchaseList);
        } catch (Exception e) {
            model.addAttribute("sessionId", sessionId);
            model.addAttribute("error", "PurchaseList not generated yet");
        }
        return "purchaselists/view";
    }
}
