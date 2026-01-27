package com.event_meal_manager.infrastructure.security;

import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class PasswordHashingService {

    private static final int SALT_LENGTH = 16;

    public String hash(String plainPassword) {
        try {
            byte[] salt = generateSalt();
            byte[] hash = hashPasswordWithSalt(plainPassword, salt);

            String saltString = Base64.getEncoder().encodeToString(salt);
            String hashString = Base64.getEncoder().encodeToString(hash);

            return saltString + ":" + hashString;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    public boolean verify(String plainPassword, String hashedPassword) {
        try {
            String[] parts = hashedPassword.split(":");
            if (parts.length != 2) {
                return false;
            }

            byte[] salt = Base64.getDecoder().decode(parts[0]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[1]);
            byte[] actualHash = hashPasswordWithSalt(plainPassword, salt);

            return MessageDigest.isEqual(expectedHash, actualHash);
        } catch (Exception e) {
            return false;
        }
    }

    private byte[] generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[SALT_LENGTH];
        random.nextBytes(salt);
        return salt;
    }

    private byte[] hashPasswordWithSalt(String password, byte[] salt) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        md.update(salt);
        return md.digest(password.getBytes());
    }
}
