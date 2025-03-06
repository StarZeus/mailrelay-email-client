# OIDC Authentication Setup

This guide explains how to configure OpenID Connect (OIDC) authentication for the Mail Relay Email Client.

## Prerequisites

- A registered application with your OIDC provider (e.g., Auth0, Okta, Azure AD, etc.)
- Client ID and Client Secret from your OIDC provider
- OIDC provider's discovery endpoint URL

## Configuration Steps

1. **Get OIDC Provider Information**
   - Register a new application in your OIDC provider
   - Configure the following redirect URI:
     ```
     http://localhost:3000/api/auth/callback/oidc
     ```
   - Note down:
     - Client ID
     - Client Secret
     - OIDC Discovery URL (usually ends with `.well-known/openid-configuration`)

2. **Environment Variables**
   Update your `.env` file with the following OIDC-specific variables:
   ```env
   # OIDC Provider
   OIDC_ISSUER_URL=https://your-oidc-provider/.well-known/openid-configuration
   OIDC_CLIENT_ID=your-client-id
   OIDC_CLIENT_SECRET=your-client-secret
   
   # NextAuth.js (required for OIDC)
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-32-character-secret-key-here
   ```

3. **Provider-Specific Configuration**

   ### Auth0
   ```env
   OIDC_ISSUER_URL=https://{YOUR_AUTH0_DOMAIN}/.well-known/openid-configuration
   ```

   ### Okta
   ```env
   OIDC_ISSUER_URL=https://{YOUR_OKTA_DOMAIN}/.well-known/openid-configuration
   ```

   ### Azure AD
   ```env
   OIDC_ISSUER_URL=https://login.microsoftonline.com/{TENANT_ID}/v2.0/.well-known/openid-configuration
   ```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` file to version control
   - Use secure secrets management in production
   - Rotate client secrets periodically

2. **Production Setup**
   - Use HTTPS in production
   - Update `NEXTAUTH_URL` to your production URL
   - Configure appropriate CORS settings
   - Add production callback URLs in your OIDC provider

3. **Session Management**
   - Default session duration is 30 days
   - Customize in `app/api/auth/[...nextauth]/route.ts`:
     ```typescript
     session: {
       maxAge: 30 * 24 * 60 * 60, // 30 days
     }
     ```

## Troubleshooting

1. **Common Issues**
   - Incorrect redirect URI configuration
   - Mismatched client ID/secret
   - Invalid OIDC discovery URL
   - Missing required scopes

2. **Debugging**
   - Check browser console for errors
   - Verify OIDC provider logs
   - Ensure all environment variables are set
   - Validate callback URLs match exactly

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- Provider-specific documentation:
  - [Auth0](https://auth0.com/docs/authenticate/protocols/openid-connect-protocol)
  - [Okta](https://developer.okta.com/docs/concepts/oauth-openid/)
  - [Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc) 