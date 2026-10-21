package com.bookingSeatApplication.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Anonymous browsing is public, booking and every private/admin operation is protected, enforced by the real
 * Spring Security chain. Each check prints PASS/FAIL; the test fails if any check failed.
 */
class SecurityIntegrationTest {

    @Test
    void publicBrowsingPrivateBookingAndRoleSeparation() throws Exception {
        assertEquals(0, SecurityHarness.runAll(), "one or more security checks failed - see the PASS/FAIL output");
    }
}
