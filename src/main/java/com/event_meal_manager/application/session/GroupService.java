package com.event_meal_manager.application.session;

import com.event_meal_manager.domain.session.Group;
import com.event_meal_manager.infrastructure.persistence.session.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupService {

    private final GroupRepository groupRepository;

    public Group createGroup(String name) {
        if (groupRepository.existsByName(name)) {
            throw new RuntimeException("Group already exists with name: " + name);
        }

        Group group = Group.builder()
                .name(name)
                .build();

        return groupRepository.save(group);
    }

    public Group getGroupById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + id));
    }

    public Group getGroupByName(String name) {
        return groupRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Group not found with name: " + name));
    }

    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    public Group updateGroup(Long id, String name) {
        Group group = getGroupById(id);

        // Check if new name conflicts with another group
        groupRepository.findByName(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new RuntimeException("Another group already exists with name: " + name);
            }
        });

        group.setName(name);
        return groupRepository.save(group);
    }

    public void deleteGroup(Long id) {
        if (!groupRepository.existsById(id)) {
            throw new RuntimeException("Group not found with id: " + id);
        }
        groupRepository.deleteById(id);
    }
}
