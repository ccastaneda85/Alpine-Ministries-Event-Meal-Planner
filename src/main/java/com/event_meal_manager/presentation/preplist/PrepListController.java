package com.event_meal_manager.presentation.preplist;

import com.event_meal_manager.application.preplist.PrepListService;
import com.event_meal_manager.domain.preplist.PrepList;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preplists")
@RequiredArgsConstructor
public class PrepListController {

    private final PrepListService prepListService;

    @PostMapping("/day/{dayId}")
    public ResponseEntity<PrepList> generatePrepListForDay(@PathVariable Long dayId) {
        PrepList prepList = prepListService.generatePrepListForDay(dayId);
        return ResponseEntity.ok(prepList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrepList> getPrepList(@PathVariable Long id) {
        PrepList prepList = prepListService.getPrepListById(id);
        return ResponseEntity.ok(prepList);
    }

    @GetMapping("/day/{dayId}")
    public ResponseEntity<PrepList> getPrepListByDay(@PathVariable Long dayId) {
        PrepList prepList = prepListService.getPrepListByDay(dayId);
        return ResponseEntity.ok(prepList);
    }
}
