package com.event_meal_manager.presentation.auth;

import com.event_meal_manager.application.auth.AuthService;
import com.event_meal_manager.domain.auth.Role;
import com.event_meal_manager.domain.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        User user = authService.createUser(request.username(), request.password(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        User user = authService.login(request.username(), request.password());
        LoginResponse response = new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getRole()
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/password/{userId}")
    public ResponseEntity<Void> changePassword(
            @PathVariable Long userId,
            @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userId, request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = authService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    record RegisterRequest(String username, String password, Role role) {}
    record LoginRequest(String username, String password) {}
    record ChangePasswordRequest(String newPassword) {}
    record LoginResponse(Long id, String username, Role role) {}
}
