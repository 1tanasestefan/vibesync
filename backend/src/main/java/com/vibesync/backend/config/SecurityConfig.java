package com.vibesync.backend.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${vibesync.frontend.base-url}")
    private String frontendBaseUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, 
            org.springframework.security.oauth2.client.registration.ClientRegistrationRepository clientRegistrationRepository) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
                .sessionFixation().migrateSession()
            )
            .exceptionHandling(exceptions -> exceptions
                .defaultAuthenticationEntryPointFor(
                    new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED),
                    new org.springframework.security.web.util.matcher.AntPathRequestMatcher("/api/**")
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/health", "/error", "/favicon.ico").permitAll()
                .requestMatchers("/login/**", "/oauth2/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(authz -> authz
                    .authorizationRequestResolver(new StaticStateOAuth2AuthorizationRequestResolver(clientRegistrationRepository))
                    .authorizationRequestRepository(new SingleUserOAuth2AuthorizationRequestRepository())
                )
                .successHandler(oAuth2LoginSuccessHandler())
                .failureHandler(oAuth2LoginFailureHandler())
            );

        return http.build();
    }

    /**
     * After successful Spotify OAuth2 login, clear cookies and redirect to frontend.
     */
    @Bean
    public AuthenticationSuccessHandler oAuth2LoginSuccessHandler() {
        return (HttpServletRequest request, HttpServletResponse response,
                Authentication authentication) -> {
            
            // Clear the authorization cookies now that we're logged in
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if (cookie.getName().equals("oauth2_auth_request") || 
                        cookie.getName().equals("redirect_uri")) {
                        cookie.setValue("");
                        cookie.setPath("/");
                        cookie.setMaxAge(0);
                        response.addCookie(cookie);
                    }
                }
            }
            
            System.out.println("✅ OAuth2 Login Successful for user: " + authentication.getName());
            response.sendRedirect(frontendBaseUrl + "/dashboard");
        };
    }

    /**
     * If login fails, redirect back to frontend with the error message in the URL,
     * so we don't get stuck on the generic Spring "Login with OAuth 2.0" white page.
     */
    @Bean
    public AuthenticationFailureHandler oAuth2LoginFailureHandler() {
        return (HttpServletRequest request, HttpServletResponse response,
                org.springframework.security.core.AuthenticationException exception) -> {
            
            System.err.println("❌ OAuth2 Login Failed: " + exception.getMessage());
            
            String targetUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl + "/")
                    .queryParam("error", exception.getLocalizedMessage())
                    .build().toUriString();

            response.sendRedirect(targetUrl);
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
