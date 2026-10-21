package com.bookingSeatApplication.config;

import com.bookingSeatApplication.util.ApiResponses;
import com.bookingSeatApplication.util.JwtFilter;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    private final ObjectMapper mapper = new ObjectMapper();

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(401);
                            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            mapper.writeValue(res.getOutputStream(),
                                    ApiResponses.failure("401", "Authentication required or token expired"));
                        })
                        .accessDeniedHandler((req, res, e) -> {
                            res.setStatus(403);
                            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            mapper.writeValue(res.getOutputStream(),
                                    ApiResponses.failure("403", "You do not have permission to perform this action"));
                        })
                )

                .authorizeHttpRequests(auth -> auth
                        // CORS preflight carries no credentials
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // ---- PUBLIC: authentication entry points (no JWT yet) ----
                        .requestMatchers(HttpMethod.POST, "/api/passengers/register", "/api/passengers/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/owner-requests").permitAll()

                        // ---- PUBLIC: read-only browsing endpoints, listed one by one ----
                        .requestMatchers(HttpMethod.GET,
                                "/api/routes",
                                "/api/buses/*",
                                "/api/schedules/all",
                                "/api/schedules/search",
                                "/api/seats/*",
                                "/api/seats/schedule/*").permitAll()

                        // ---- ROLE-RESTRICTED (also re-checked by ownership in the services) ----
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/owner/**").hasRole("BUS_OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/schedules/add").hasRole("ADMIN")
                        .requestMatchers("/api/passenger/**").hasRole("PASSENGER")
                        .requestMatchers("/api/bookings/**").hasRole("PASSENGER")

                        // ---- DEFAULT DENY: anything not listed above needs a valid token ----
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
