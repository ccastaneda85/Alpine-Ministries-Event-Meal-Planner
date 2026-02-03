package com.event_meal_manager.presentation.web;

import com.event_meal_manager.application.reservation.GroupReservationService;
import com.event_meal_manager.domain.reservation.GroupReservation;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;

@Controller
@RequestMapping("/group-reservations")
@RequiredArgsConstructor
public class GroupReservationWebController {

    private final GroupReservationService groupReservationService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("reservations", groupReservationService.findAll());
        return "group-reservations/list";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("reservation", GroupReservation.builder()
            .defaultAdultCount(0)
            .defaultYouthCount(0)
            .defaultKidCount(0)
            .defaultCodeCount(0)
            .defaultCustomDietCount(0)
            .build());
        return "group-reservations/form";
    }

    @PostMapping
    public String create(@RequestParam String groupName,
                         @RequestParam int defaultAdultCount,
                         @RequestParam int defaultYouthCount,
                         @RequestParam int defaultKidCount,
                         @RequestParam int defaultCodeCount,
                         @RequestParam int defaultCustomDietCount,
                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate arrivalDate,
                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate departureDate,
                         @RequestParam(required = false) String customDietNotes,
                         @RequestParam(required = false) String notes,
                         RedirectAttributes redirectAttributes) {
        GroupReservation reservation = groupReservationService.create(
            groupName, defaultAdultCount, defaultYouthCount, defaultKidCount,
            defaultCodeCount, defaultCustomDietCount, arrivalDate, departureDate,
            customDietNotes, notes
        );
        redirectAttributes.addFlashAttribute("successMessage", "Reservation created successfully!");
        return "redirect:/group-reservations/" + reservation.getGroupReservationId();
    }

    @GetMapping("/{id}")
    public String view(@PathVariable Long id, Model model) {
        GroupReservation reservation = groupReservationService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        model.addAttribute("reservation", reservation);
        return "group-reservations/view";
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable Long id, Model model) {
        GroupReservation reservation = groupReservationService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        model.addAttribute("reservation", reservation);
        return "group-reservations/form";
    }

    @PostMapping("/{id}")
    public String update(@PathVariable Long id,
                         @RequestParam String groupName,
                         @RequestParam int defaultAdultCount,
                         @RequestParam int defaultYouthCount,
                         @RequestParam int defaultKidCount,
                         @RequestParam int defaultCodeCount,
                         @RequestParam int defaultCustomDietCount,
                         @RequestParam(required = false) String customDietNotes,
                         @RequestParam(required = false) String notes,
                         RedirectAttributes redirectAttributes) {
        groupReservationService.update(id, groupName, defaultAdultCount, defaultYouthCount,
            defaultKidCount, defaultCodeCount, defaultCustomDietCount, customDietNotes, notes);
        redirectAttributes.addFlashAttribute("successMessage", "Reservation updated successfully!");
        return "redirect:/group-reservations/" + id;
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        groupReservationService.delete(id);
        redirectAttributes.addFlashAttribute("successMessage", "Reservation deleted successfully!");
        return "redirect:/group-reservations";
    }
}
