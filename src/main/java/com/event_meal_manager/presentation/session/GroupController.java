package com.event_meal_manager.presentation.session;

import com.event_meal_manager.application.session.GroupService;
import com.event_meal_manager.domain.session.Group;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody CreateGroupRequest request) {
        Group group = groupService.createGroup(request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(group);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroup(@PathVariable Long id) {
        Group group = groupService.getGroupById(id);
        return ResponseEntity.ok(group);
    }

    @GetMapping
    public ResponseEntity<List<Group>> getAllGroups() {
        List<Group> groups = groupService.getAllGroups();
        return ResponseEntity.ok(groups);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Group> updateGroup(
            @PathVariable Long id,
            @RequestBody CreateGroupRequest request) {
        Group group = groupService.updateGroup(id, request.name());
        return ResponseEntity.ok(group);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }

    record CreateGroupRequest(String name) {}
}
