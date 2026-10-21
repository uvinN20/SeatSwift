package com.bookingSeatApplication.util;

import com.bookingSeatApplication.dao.AdminUserDao;
import com.bookingSeatApplication.dao.PassengerDao;
import com.bookingSeatApplication.dao.OwnerDao;
import com.bookingSeatApplication.model.AdminUser;
import com.bookingSeatApplication.model.Passenger;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Validates the bearer token and re-checks the user against the database on every request
 * (so a deleted/disabled user loses access immediately). A bad token simply leaves the request
 * unauthenticated; the security rules then answer 401/403.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AdminUserDao adminUserDao;

    @Autowired
    private PassengerDao passengerDao;

    @Autowired
    private OwnerDao ownerDao;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);

                if (jwtUtil.validateToken(token)) {
                    String subject = jwtUtil.extractUsername(token);
                    String role = jwtUtil.extractRole(token);
                    AuthPrincipal principal = resolve(role, subject);

                    if (principal != null) {
                        SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(
                                        principal,
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_" + principal.role()))));
                    }
                }
            } catch (Exception e) {
                log.warn("JWT processing failed: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private AuthPrincipal resolve(String role, String subject) {
        if (role == null || subject == null) {
            return null;
        }
        switch (role) {
            case AuthPrincipal.BUS_OWNER: {
                var owner = ownerDao.findByUsername(subject);
                return owner == null || !owner.active() || !"APPROVED".equals(owner.approvalStatus()) ? null : new AuthPrincipal(AuthPrincipal.BUS_OWNER, owner.ownerId(), owner.username());
            }
            case AuthPrincipal.ADMIN: {
                AdminUser admin = adminUserDao.findByUsername(subject);
                return admin == null ? null : new AuthPrincipal(AuthPrincipal.ADMIN, admin.getAdminId(), admin.getUsername());
            }
            case AuthPrincipal.PASSENGER: {
                Passenger p = passengerDao.findByEmail(subject);
                return p == null ? null : new AuthPrincipal(AuthPrincipal.PASSENGER, p.getPassengerId(), p.getEmail());
            }
            default:
                return null;
        }
    }
}
