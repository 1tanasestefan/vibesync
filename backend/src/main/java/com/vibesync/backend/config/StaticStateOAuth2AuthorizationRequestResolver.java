package com.vibesync.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * For local development, this forcibly overwrites the highly strict, randomly generated "state"
 * parameter with a static string. This ensures that even if local sessions drop on
 * 127.0.0.1, the state returned by Spotify ("DEVELOPMENT_STATE_BYPASS") will always exactly
 * match the repository, completely disabling the CSRF drop issue.
 */
public class StaticStateOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final OAuth2AuthorizationRequestResolver defaultResolver;
    public static final String STATIC_STATE = "DEVELOPMENT_STATE_BYPASS";

    public StaticStateOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest authorizationRequest = this.defaultResolver.resolve(request);
        return bypassState(authorizationRequest);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest authorizationRequest = this.defaultResolver.resolve(request, clientRegistrationId);
        return bypassState(authorizationRequest);
    }

    private OAuth2AuthorizationRequest bypassState(OAuth2AuthorizationRequest authorizationRequest) {
        if (authorizationRequest == null) {
            return null;
        }

        Map<String, Object> attributes = new HashMap<>(authorizationRequest.getAttributes());
        Map<String, Object> additionalParameters = new HashMap<>(authorizationRequest.getAdditionalParameters());

        // Forcibly overwrite the state parameter with our hardcoded bypass string
        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .state(STATIC_STATE)
                .attributes(attributes)
                .additionalParameters(additionalParameters)
                .build();
    }
}
