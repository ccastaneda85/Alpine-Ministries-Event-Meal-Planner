package com.event_meal_manager.presentation.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import com.event_meal_manager.application.preplist.PrepListService;
import com.event_meal_manager.domain.preplist.PrepList;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/preplists")
@RequiredArgsConstructor
public class PrepListWebController {

    private final PrepListService prepListService;

    @GetMapping("/day/{dayId}")
    public String viewPrepListForDay(@PathVariable Long dayId, Model model) {
        model.addAttribute("dayId", dayId);
        try {
            PrepList prepList = prepListService.getPrepListByDay(dayId);
            model.addAttribute("prepList", prepList);
        } catch (Exception e) {
            model.addAttribute("error", "PrepList not generated yet");
        }
        return "preplists/view";
    }
}
