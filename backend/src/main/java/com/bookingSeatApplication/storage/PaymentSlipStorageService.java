package com.bookingSeatApplication.storage;

import com.bookingSeatApplication.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Stores payment slips on disk under a configurable directory that must NOT be web-served.
 * Files are renamed to random UUIDs; the user-supplied filename is never used as a path.
 */
@Service
public class PaymentSlipStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");
    private static final Pattern STORED_NAME = Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|pdf)$");

    private final Path baseDir;
    private final long maxBytes;

    public PaymentSlipStorageService(@Value("${app.storage.payment-slips-dir}") String dir,
                                     @Value("${app.upload.max-bytes}") long maxBytes) throws IOException {
        this.baseDir = Paths.get(dir).toAbsolutePath().normalize();
        this.maxBytes = maxBytes;
        Files.createDirectories(this.baseDir);
    }

    /** Validates (extension, size, real content signature) then stores. Throws IllegalArgumentException on bad input. */
    public StoredSlip store(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Payment slip file is required");
        }
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("File is too large. Maximum size is " + (maxBytes / (1024 * 1024)) + " MB");
        }

        String original = file.getOriginalFilename();
        String ext = extensionOf(original);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Only JPG, JPEG, PNG or PDF files are allowed");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read the uploaded file");
        }

        String detected = detectType(bytes);
        if (detected == null) {
            throw new IllegalArgumentException("File content is not a valid JPG, PNG or PDF");
        }
        String normalizedExt = ext.equals("jpeg") ? "jpg" : ext;
        if (!detected.equals(normalizedExt)) {
            throw new IllegalArgumentException("File content does not match its extension");
        }

        String storedName = UUID.randomUUID() + "." + normalizedExt;
        Path target = baseDir.resolve(storedName).normalize();
        if (!target.startsWith(baseDir)) {
            throw new IllegalStateException("Invalid storage path");
        }

        try {
            Files.write(target, bytes, StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new RuntimeException("Could not store payment slip", e);
        }

        return new StoredSlip(storedName, sanitizeOriginal(original), contentTypeFor(normalizedExt), bytes.length, sha256(bytes));
    }

    /** Returns the file only if the stored name is a name we generated and resolves inside the base directory. */
    public Resource load(String storedName) {

        if (storedName == null || !STORED_NAME.matcher(storedName).matches()) {
            throw new NotFoundException("Payment slip not found");
        }
        Path path = baseDir.resolve(storedName).normalize();
        if (!path.startsWith(baseDir) || !Files.isRegularFile(path)) {
            throw new NotFoundException("Payment slip not found");
        }
        return new FileSystemResource(path);
    }

    public void deleteQuietly(String storedName) {
        try {
            if (storedName != null && STORED_NAME.matcher(storedName).matches()) {
                Files.deleteIfExists(baseDir.resolve(storedName).normalize());
            }
        } catch (IOException ignored) {
            // best effort cleanup
        }
    }

    public static String extensionForContentType(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            default -> "pdf";
        };
    }

    private static String extensionOf(String name) {
        if (name == null) return "";
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String detectType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "jpg";
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) return "png";
        if (b.length >= 5 && b[0] == '%' && b[1] == 'P' && b[2] == 'D' && b[3] == 'F' && b[4] == '-') return "pdf";
        return null;
    }

    private static String contentTypeFor(String ext) {
        return switch (ext) {
            case "jpg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> "application/pdf";
        };
    }

    /** Display-only copy of the user's filename: strip path parts and control characters, cap length. */
    private static String sanitizeOriginal(String name) {
        if (name == null) return null;
        String n = name.replace('\\', '/');
        n = n.substring(n.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "");
        return n.length() > 200 ? n.substring(0, 200) : n;
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
