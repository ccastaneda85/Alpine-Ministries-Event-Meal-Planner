package com.event_meal_manager.presentation.vendor;

import com.event_meal_manager.application.vendor.VendorFileService;
import com.event_meal_manager.application.vendor.VendorFileService.VendorFileInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/vendor-files")
@RequiredArgsConstructor
public class VendorFileController {

    private final VendorFileService vendorFileService;

    @GetMapping
    public List<VendorFileInfo> list() throws IOException {
        return vendorFileService.list();
    }

    @PostMapping
    public ResponseEntity<VendorFileInfo> upload(
            @RequestParam("vendor") String vendor,
            @RequestParam("file") MultipartFile file) throws IOException {
        VendorFileInfo info = vendorFileService.store(vendor, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(info);
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<Void> delete(@PathVariable String name) throws IOException {
        vendorFileService.delete(name);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
