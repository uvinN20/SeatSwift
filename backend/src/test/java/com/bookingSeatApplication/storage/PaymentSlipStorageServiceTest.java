package com.bookingSeatApplication.storage;

import com.bookingSeatApplication.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class PaymentSlipStorageServiceTest {

    private static final byte[] JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16};
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0};
    private static final byte[] PDF = "%PDF-1.7\n".getBytes();

    @TempDir
    Path dir;

    PaymentSlipStorageService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new PaymentSlipStorageService(dir.toString(), 5 * 1024 * 1024);
    }

    private static MockMultipartFile file(String name, byte[] data) {
        return new MockMultipartFile("file", name, "application/octet-stream", data);
    }

    @Test
    void acceptsJpgPngPdfAndStoresUnderRandomName() {
        StoredSlip jpg = service.store(file("my slip.JPG", JPG));
        assertTrue(jpg.storedName().matches("[0-9a-f-]{36}\\.jpg"));
        assertEquals("image/jpeg", jpg.contentType());
        assertEquals("image/png", service.store(file("a.png", PNG)).contentType());
        assertEquals("application/pdf", service.store(file("a.pdf", PDF)).contentType());
        assertTrue(Files.exists(dir.resolve(jpg.storedName())));
    }

    @Test
    void rejectsWrongContentWrongExtensionEmptyAndOversized() {
        assertThrows(IllegalArgumentException.class, () -> service.store(file("virus.jpg", "MZ\u0090".getBytes())));
        assertThrows(IllegalArgumentException.class, () -> service.store(file("x.jpg", PNG)));
        assertThrows(IllegalArgumentException.class, () -> service.store(file("x.gif", JPG)));
        assertThrows(IllegalArgumentException.class, () -> service.store(file("noext", JPG)));
        assertThrows(IllegalArgumentException.class, () -> service.store(file("x.jpg", new byte[0])));
        assertThrows(IllegalArgumentException.class, () -> service.store(file("x.jpg", new byte[5 * 1024 * 1024 + 1])));
    }

    @Test
    void userSuppliedFilenameNeverBecomesAPath() {
        StoredSlip s = service.store(file("../../../etc/passwd.jpg", JPG));
        assertTrue(s.storedName().matches("[0-9a-f-]{36}\\.jpg"));
        assertEquals("passwd.jpg", s.originalName());
    }

    @Test
    void loadRefusesTraversalAndUnknownNames() {
        for (String bad : new String[]{"../secret.jpg", "..\\x.pdf", "/etc/passwd", "abc.jpg"}) {
            assertThrows(NotFoundException.class, () -> service.load(bad), bad);
        }
    }
}
