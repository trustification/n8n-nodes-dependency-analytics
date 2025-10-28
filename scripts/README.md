# Keycloak Client Management Scripts

This directory contains scripts for managing Keycloak clients using the HTTP API. The scripts follow OAuth2/OIDC security best practices by separating user authentication from service-to-service authentication.

## Devmode Integration

The scripts provide instructions for using new clients in devmode development. Simply set the `TRUSTD_DEVMODE_ADDITIONAL_CLIENTS` environment variable with the client names.

## Security Best Practices

### Implemented Security Pattern
- **Public Client**: For user authentication (Authorization Code flow)
- **Confidential Client**: For service-to-service authentication (Client Credentials flow)

## Available Scripts

### 1. `add_web_client.sh` - Public Client for User Authentication

**Purpose**: Creates public clients for interactive user authentication flows.

**Usage**:
```bash
./add_web_client.sh \
  --name=my-frontend-app \
  --redirectUri=http://localhost:3000/callback \
  --webOrigins=http://localhost:3000 \
  --defaultClientScopes=email,profile,roles
```

**Features**:
- ✅ Public client (no secret)
- ✅ Authorization Code flow (standard flow)
- ✅ Implicit flow support
- ✅ Redirect URIs and Web Origins
- ✅ Protocol mappers (sub, username)
- ❌ No service accounts
- ❌ No direct access grants

**Use Cases**:
- Single Page Applications (SPA)
- Mobile applications
- Desktop applications
- Any client that needs to authenticate users

### 2. `add_confidential_client.sh` - Confidential Client for Server-Side Applications

**Purpose**: Creates confidential clients for server-side applications that need both user authentication and service capabilities.

**Usage**:
```bash
./add_confidential_client.sh \
  --name=my-backend-service \
  --secret=my-service-secret \
  --service-accounts=true \
  --defaultClientScopes=email,profile,roles
```

**Features**:
- ✅ Confidential client (with secret)
- ✅ Client Credentials flow (direct access grants)
- ✅ Authorization Code flow (standard flow)
- ✅ Redirect URIs and Web Origins support
- ✅ Service accounts
- ✅ Protocol mappers

**Use Cases**:
- Server-side applications (N8N, workflow automation)
- Backend services with user authentication
- API gateways that need user context
- Microservices with OAuth2 flows
- Any server-side app that needs both user auth and service capabilities

## Configuration Options

### Common Options (Both Scripts)
- `--name=CLIENT_NAME` - Client name (required)
- `--realm=REALM` - Realm name (default: trustify)
- `--keycloak-url=URL` - Keycloak URL (default: http://localhost:8090)
- `--admin-user=USER` - Admin username (default: admin)
- `--admin-password=PASS` - Admin password (default: admin123456)
- `--defaultClientScopes=SCOPES` - Comma-separated scopes
- `--protocol-mappers=BOOL` - Add protocol mappers (default: true)

### Web Client Specific
- `--redirectUri=URI` - Redirect URI (required)
- `--webOrigins=ORIGINS` - Web origins (required)
- `--implicit-flow=BOOL` - Enable implicit flow (default: true)
- `--standard-flow=BOOL` - Enable standard flow (default: true)

### Confidential Client Specific
- `--secret=SECRET` - Client secret (required)
- `--service-accounts=BOOL` - Enable service accounts (default: false)
- `--direct-access-grants=BOOL` - Enable direct access grants (default: true)

## Examples

### Frontend Application (React/Vue/Angular)
```bash
./add_web_client.sh \
  --name=my-spa \
  --redirectUri=http://localhost:3000/callback \
  --webOrigins=http://localhost:3000 \
  --defaultClientScopes=email,profile,roles,read:document
```

### Backend API Service
```bash
./add_confidential_client.sh \
  --name=api-service \
  --secret=api-secret-123 \
  --service-accounts=true \
  --defaultClientScopes=email,profile,roles,create:document,read:document
```

### Background Worker
```bash
./add_confidential_client.sh \
  --name=worker-service \
  --secret=worker-secret-456 \
  --service-accounts=true \
  --defaultClientScopes=email,profile,roles,read:document
```

## Prerequisites

- **jq**: For JSON processing
- **curl**: For HTTP requests
- **Keycloak**: Running and accessible
- **Realm**: Must exist (default: trustify)

## Security Notes

1. **Automatic separation**: Scripts enforce proper OAuth2 patterns automatically
2. **Public clients**: Never have secrets, only use for user authentication (enforced by script)
3. **Confidential clients**: Only use client credentials flow for service authentication (enforced by script)
4. **Redirect URIs**: Only available for public clients (enforced by script)
5. **Service accounts**: Only for confidential clients that need to act on behalf of the service
6. **Protocol mappers**: Automatically added for proper JWT token claims

## Troubleshooting

### Common Issues

1. **"Failed to get access token"**
   - Check Keycloak URL and admin credentials
   - Ensure Keycloak is running and accessible

2. **"Client already exists"**
   - Scripts will update existing clients
   - Check the output for confirmation

3. **"jq is required"**
   - Install jq: `brew install jq` (macOS) or `apt-get install jq` (Ubuntu)

4. **"curl is required"**
   - Install curl: Usually pre-installed on most systems

### Debug Mode

Add `set -x` at the top of scripts to see detailed execution:
```bash
#!/usr/bin/env bash
set -x  # Add this line for debug output
```

## Using Additional Clients in Devmode

After creating clients with the scripts, you can use them in devmode by setting the environment variable:

### Starting the Application

```bash
# Set the environment variable with your new client(s)
export TRUSTD_DEVMODE_ADDITIONAL_CLIENTS="n8n,my-other-client"
cargo run --bin trustd api --devmode --infrastructure-enabled

# Or for a single client
export TRUSTD_DEVMODE_ADDITIONAL_CLIENTS="n8n"
cargo run --bin trustd api --devmode --infrastructure-enabled
```

### How It Works

1. **Scripts create clients** in Keycloak
2. **Scripts show instructions** for setting the environment variable
3. **Set `TRUSTD_DEVMODE_ADDITIONAL_CLIENTS`** with comma-separated client names
4. **Application dynamically loads** additional clients via the environment variable

This approach is flexible and doesn't require recompiling the application when adding new clients.

## Migration from Old Scripts

If you're migrating from the original scripts:

1. **Web clients**: Use `add_web_client.sh` (same functionality, better security)
2. **Confidential clients**: Use `add_confidential_client.sh` (supports redirect URIs for server-side apps)
3. **Hybrid scenarios**: Create separate public and confidential clients instead

## Contributing

When adding new features:
- Follow OAuth2/OIDC security best practices
- Keep user authentication and service authentication separate
- Add comprehensive help documentation
- Test with both existing and new clients
