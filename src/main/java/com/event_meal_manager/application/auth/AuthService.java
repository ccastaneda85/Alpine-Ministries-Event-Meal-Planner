package com.event_meal_manager.application.auth;

import com.event_meal_manager.domain.auth.Role;
import com.event_meal_manager.domain.auth.User;
import com.event_meal_manager.infrastructure.persistence.auth.UserRepository;
import com.event_meal_manager.infrastructure.security.PasswordHashingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordHashingService passwordHashingService;

    public User createUser(String username, String password, Role role) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists: " + username);
        }

        String hashedPassword = passwordHashingService.hash(password);

        User user = User.builder()
                .username(username)
                .hashedPassword(hashedPassword)
                .role(role)
                .build();

        return userRepository.save(user);
    }

    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordHashingService.verify(password, user.getHashedPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        return user;
    }

    public void changePassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        String hashedPassword = passwordHashingService.hash(newPassword);
        user.setHashedPassword(hashedPassword);
        userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
}
