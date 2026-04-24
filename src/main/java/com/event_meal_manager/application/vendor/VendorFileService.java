package com.event_meal_manager.application.vendor;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

/**
 * Stores vendor CSV files on the local filesystem. POC-grade: single directory,
 * no versioning, CSV-only. Uploading a file with the same name overwrites it
 * (makes re-uploads for pricing updates intentional and simple).
 */
@Service
public class VendorFileService {

    @Value("${app.vendor-files.dir:./vendor-files}")
    private String storageDirConfig;

    private Path storageDir;

    @PostConstruct
    public void init() throws IOException {
        storageDir = Path.of(storageDirConfig).toAbsolutePath().normalize();
        Files.createDirectories(storageDir);
    }

    /**
     * Files are named {vendor}__{originalName}.csv so the vendor can be
     * inferred from the filename alone. `vendor` is null for files uploaded
     * without a vendor tag (legacy / no-prefix files).
     */
    public record VendorFileInfo(String name, String vendor, String originalName, long size, long lastModified) {}

    private static final String VENDOR_SEPARATOR = "__";

    public List<VendorFileInfo> list() throws IOException {
        try (Stream<Path> stream = Files.list(storageDir)) {
            return stream
                .filter(Files::isRegularFile)
                .sorted(Comparator.comparing(Path::getFileName))
                .map(p -> {
                    String name = p.getFileName().toString();
                    String[] parts = splitVendorPrefix(name);
                    try {
                        return new VendorFileInfo(
                            name,
                            parts[0],
                            parts[1],
                            Files.size(p),
                            Files.getLastModifiedTime(p).toMillis()
                        );
                    } catch (IOException e) {
                        return new VendorFileInfo(name, parts[0], parts[1], 0, 0);
                    }
                })
                .toList();
        }
    }

    public VendorFileInfo store(String vendor, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            throw new IllegalArgumentException("Missing filename.");
        }
        if (!original.toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("Only .csv files are accepted.");
        }
        if (vendor == null || vendor.isBlank()) {
            throw new IllegalArgumentException("Vendor is required.");
        }
        String safeVendor = sanitizeVendorTag(vendor);
        String safeOriginal = sanitizeFilename(original);
        String storedName = safeVendor + VENDOR_SEPARATOR + safeOriginal;
        Path target = storageDir.resolve(storedName).normalize();
        if (!target.startsWith(storageDir)) {
            throw new IllegalArgumentException("Invalid filename.");
        }
        try (var in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        return new VendorFileInfo(
            storedName,
            safeVendor,
            safeOriginal,
            Files.size(target),
            Files.getLastModifiedTime(target).toMillis()
        );
    }

    public void delete(String name) throws IOException {
        String safeName = sanitizeFilename(name);
        Path target = storageDir.resolve(safeName).normalize();
        if (!target.startsWith(storageDir)) {
            throw new IllegalArgumentException("Invalid filename.");
        }
        Files.deleteIfExists(target);
    }

    private static String[] splitVendorPrefix(String storedName) {
        int idx = storedName.indexOf(VENDOR_SEPARATOR);
        if (idx <= 0 || idx + VENDOR_SEPARATOR.length() >= storedName.length()) {
            return new String[] { null, storedName };
        }
        return new String[] {
            storedName.substring(0, idx),
            storedName.substring(idx + VENDOR_SEPARATOR.length())
        };
    }

    private static String sanitizeFilename(String name) {
        String leaf = Path.of(name).getFileName().toString();
        return leaf.replaceAll("[^A-Za-z0-9._\\- ]", "_");
    }

    private static String sanitizeVendorTag(String vendor) {
        // Keep it tight for filenames: alphanumerics, dash, underscore. Spaces become underscores.
        String trimmed = vendor.trim();
        String replaced = trimmed.replaceAll("\\s+", "_");
        return replaced.replaceAll("[^A-Za-z0-9_\\-]", "");
    }
}
