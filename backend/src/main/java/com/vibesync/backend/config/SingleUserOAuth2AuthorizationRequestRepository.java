package com.vibesync.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

/**
 * A foolproof authorization request repository for local development.
 * It stores the OAuth2 request in a global variable.
 * Since you are the only user testing locally, the "last saved request"
 * will always be YOUR request. 
 * This completely ignores browser cookies, sessions, and SameSite policies.
 */
public class SingleUserOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private OAuth2AuthorizationRequest lastRequest = null;

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return this.lastRequest;
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest, HttpServletRequest request, HttpServletResponse response) {
        if (authorizationRequest != null) {
            System.out.println("🚀 [OAuth2 Debug] Sending Redirect URI to Spotify: " + authorizationRequest.getRedirectUri());
            this.lastRequest = authorizationRequest;
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request, HttpServletResponse response) {
        return this.lastRequest;
    }
}
