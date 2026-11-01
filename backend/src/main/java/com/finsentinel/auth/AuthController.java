package com.finsentinel.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Session Management", description = "Endpoints for user authentication, JWT refresh rotation, and logout")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and issue JWT Access + Refresh token pair")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and issue a fresh access token")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke active token and blacklist in Redis")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @AuthenticationPrincipal User user) {
        String username = user != null ? user.getUsername() : null;
        authService.logout(authHeader, username);
        return ResponseEntity.ok(Map.of("message", "Successfully logged out and session revoked"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<UserProfileResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getProfile(user.getUsername()));
    }
}
