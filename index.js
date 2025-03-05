import * as oauth from "oauth4webapi";
const allScopes = [
    "files:read",
    "file_variables:read", // enterprise only
    "file_variables:write", // enterprise only
    "file_comments:write",
    "file_dev_resources:read",
    "file_dev_resources:write",
    "library_analytics:read",
    "webhooks:write",
    "org:activity_log_read",
];
const firstScopes = ["files:read", "file_comments:write"];
const oauthServer = {
    issuer: "https://www.figma.com",
    authorization_endpoint: "https://www.figma.com/oauth",
    token_endpoint: "https://api.figma.com/v1/oauth/token",
    // Figma does not provide a JWKS URI as it does not use JWTs for token exchange
    scopes_supported: allScopes,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: [
        "client_secret_post",
        "client_secret_basic",
    ],
    code_challenge_methods_supported: ["S256"],
    // Figma does not provide a userinfo endpoint in its standard OAuth 2.0 flow
};
const authorizeRedirect = async (redirectUri, getSecrets, scopes) => {
    const secrets = await getSecrets({
        CLIENT_ID: null,
        CLIENT_SECRET: null,
    });
    const scope = scopes ? scopes.join(" ") : firstScopes.join(" ");
    /**
     * The following MUST be generated for every redirect to the authorization_endpoint. You must store
     * the code_verifier and nonce in the end-user session such that it can be recovered as the user
     * gets redirected from the authorization server back to your application.
     */
    const code_verifier = oauth.generateRandomCodeVerifier();
    const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
    let state;
    // state is required by figma or you get `Parameter state is required` error
    state = code_challenge;
    // redirect user to as.authorization_endpoint
    const authorizationUrl = new URL(oauthServer.authorization_endpoint);
    authorizationUrl.searchParams.set("client_id", secrets.CLIENT_ID);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", scope);
    authorizationUrl.searchParams.set("code_challenge", code_challenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
    authorizationUrl.searchParams.set("state", state);
    /**
     * We cannot be sure the AS supports PKCE so we're going to use state too. Use of PKCE is
     * backwards compatible even if the AS doesn't support it which is why we're using it regardless.
     */
    // if (oauthServer.code_challenge_methods_supported?.includes("S256") !== true) {
    //   state = oauth.generateRandomState();
    //   authorizationUrl.searchParams.set("state", state);
    // }
    const sessionStorageValues = {
        codeVerifier: code_verifier,
        codeChallenge: code_challenge,
        state: state,
        scope: scope,
    };
    // now redirect the user to authorizationUrl.href
    return {
        url: authorizationUrl.href,
        sessionStorageValues: sessionStorageValues,
    };
};
const callback = async (requestUrl, originalRedirectUri, sessionStorageValues, getSecrets) => {
    const secrets = await getSecrets({
        CLIENT_ID: null,
        CLIENT_SECRET: null,
    });
    const oauth2Client = {
        client_id: secrets.CLIENT_ID,
    };
    const params = oauth.validateAuthResponse(oauthServer, oauth2Client, new URL(requestUrl), sessionStorageValues?.state ?? undefined);
    const clientAuth = oauth.ClientSecretPost(secrets.CLIENT_SECRET);
    const response = await oauth.authorizationCodeGrantRequest(oauthServer, oauth2Client, clientAuth, params, originalRedirectUri, sessionStorageValues?.codeVerifier);
    const result = await oauth.processAuthorizationCodeResponse(oauthServer, oauth2Client, response);
    const tokenResponse = result;
    console.log("Figma result", result);
    // make a call to https://api.figma.com/v1/me to get the user's email
    const userResponse = await fetch("https://api.figma.com/v1/me", {
        headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
        },
    });
    if (!userResponse.ok) {
        throw new Error("Failed to fetch figma user");
    }
    const user = await userResponse.json();
    const mappedResult = {
        providerAccountId: tokenResponse.user_id,
        accessToken: tokenResponse.access_token,
        email: null,
        type: "oauth",
        tokenType: tokenResponse.token_type,
        refreshToken: tokenResponse.refresh_token ?? null,
        expiresAt: tokenResponse.expires_in ?? null,
        idToken: null,
        /** space separated scopes */
        scope: sessionStorageValues?.scope ?? "",
        /** non-sensitive data to pass to the app/tools, possibly in llm calls */
        supplementalData: user,
        /** sensitive data to use in the app/tools, but not an llm call */
        secretData: null,
    };
    return mappedResult;
};
export const appConfig = {
    majorVersion: 1,
    minorVersion: 0,
    provider: "figma",
    displayName: "Figma",
    tier1UniqueId: "COM_FIGMA",
    iconSVG: '<svg class="svg" width="38" height="57" viewBox="0 0 38 57" xmlns="http://www.w3.org/2000/svg"><path d="M19 28.5c0-5.247 4.253-9.5 9.5-9.5 5.247 0 9.5 4.253 9.5 9.5 0 5.247-4.253 9.5-9.5 9.5-5.247 0-9.5-4.253-9.5-9.5z" fill-rule="nonzero" fill-opacity="1" fill="#1abcfe" stroke="none"></path><path d="M0 47.5C0 42.253 4.253 38 9.5 38H19v9.5c0 5.247-4.253 9.5-9.5 9.5C4.253 57 0 52.747 0 47.5z" fill-rule="nonzero" fill-opacity="1" fill="#0acf83" stroke="none"></path><path d="M19 0v19h9.5c5.247 0 9.5-4.253 9.5-9.5C38 4.253 33.747 0 28.5 0H19z" fill-rule="nonzero" fill-opacity="1" fill="#ff7262" stroke="none"></path><path d="M0 9.5C0 14.747 4.253 19 9.5 19H19V0H9.5C4.253 0 0 4.253 0 9.5z" fill-rule="nonzero" fill-opacity="1" fill="#f24e1e" stroke="none"></path><path d="M0 28.5C0 33.747 4.253 38 9.5 38H19V19H9.5C4.253 19 0 23.253 0 28.5z" fill-rule="nonzero" fill-opacity="1" fill="#a259ff" stroke="none"></path></svg>',
    iconURL: null,
    defaultScopes: firstScopes,
};
export const appAuthConfig = {
    appConfig,
    useRedirectAndCallback: true,
    getAuthorizeRedirect: authorizeRedirect,
    handleAuthorizationCallback: callback,
};
