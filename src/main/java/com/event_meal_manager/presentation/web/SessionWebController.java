package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.session.SessionService;
import com.event_meal_manager.domain.session.Session;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/sessions")
@RequiredArgsConstructor
public class SessionWebController {

    private final SessionService sessionService;

    @GetMapping
    public String listSessions(Model model) {
        List<Session> sessions = sessionService.getAllSessions();
        model.addAttribute("sessions", sessions);
        return "sessions/list";
    }

    @GetMapping("/new")
    public String newSession() {
        return "sessions/form";
    }

    @GetMapping("/{id}")
    public String viewSession(@PathVariable Long id, Model model) {
        Session sess = sessionService.getSessionById(id);
        model.addAttribute("sess", sess);
        return "sessions/view";
    }

    @GetMapping("/{id}/edit")
    public String editSession(@PathVariable Long id, Model model) {
        Session sess = sessionService.getSessionById(id);
        model.addAttribute("sess", sess);
        return "sessions/form";
    }
}
