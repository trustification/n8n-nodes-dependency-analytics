# Keycloak Client Management Scripts

This directory contains scripts for creating Keycloak clients for n8n using the HTTP API. Use the provided create scripts for common setups.

## Devmode Integration

The scripts provide instructions for using new clients in devmode development. Simply set the `TRUSTD_DEVMODE_ADDITIONAL_CLIENTS` environment variable with the client names.

## Security Best Practices

### Implemented Security Pattern
- **Confidential Client**: For user authentication (Authorization Code flow) and service-to-service authentication (Client Credentials flow)

## Available Scripts

### 1. `create_n8n_authCode.sh` – Confidential client for Authorization Code

Creates a confidential client suitable for n8n when you need user login via Authorization Code flow.

Default configuration includes redirect URIs, web origins for `http://localhost:5678`, and default client scopes.

**Configuration via Environment Variables:**

The script automatically reads these environment variables (with defaults if not set):
- `KEYCLOAK_URL` (default: `http://localhost:8090`)
- `REALM` (default: `trustify`)
- `KEYCLOAK_ADMIN` (default: `admin`)
- `KEYCLOAK_ADMIN_PASSWORD` (default: `admin123456`)

**Usage Examples:**

```bash
# Option 1: Export environment variables first (recommended for repeated use)
export KEYCLOAK_URL=https://sso-tpa.apps.example.com
export REALM=chicken
export KEYCLOAK_ADMIN=admin
export KEYCLOAK_ADMIN_PASSWORD=your-password
./scripts/create_n8n_authCode.sh

# Option 2: Pass environment variables inline
KEYCLOAK_URL=http://localhost:8090 \
REALM=trustify \
KEYCLOAK_ADMIN=admin \
KEYCLOAK_ADMIN_PASSWORD=admin123456 \
./scripts/create_n8n_authCode.sh
```

Outputs the client details (client ID, token/authorization endpoints, and scopes).

### 2. `create_n8n_clientCreds.sh` – Confidential client for Client Credentials

Creates a confidential client with service accounts enabled and no browser flows, for machine-to-machine usage by n8n.

**Configuration via Environment Variables:**

The script automatically reads these environment variables (with defaults if not set):
- `KEYCLOAK_URL` (default: `http://localhost:8090`)
- `REALM` (default: `trustify`)
- `KEYCLOAK_ADMIN` (default: `admin`)
- `KEYCLOAK_ADMIN_PASSWORD` (default: `admin123456`)

**Usage Examples:**

```bash
# Option 1: Export environment variables first (recommended for repeated use)
export KEYCLOAK_URL=https://sso-tpa.apps.example.com
export REALM=chicken
export KEYCLOAK_ADMIN=admin
export KEYCLOAK_ADMIN_PASSWORD=your-password
./scripts/create_n8n_clientCreds.sh

# Option 2: Pass environment variables inline
KEYCLOAK_URL=http://localhost:8090 \
REALM=trustify \
KEYCLOAK_ADMIN=admin \
KEYCLOAK_ADMIN_PASSWORD=admin123456 \
./scripts/create_n8n_clientCreds.sh
```

Outputs the token endpoint, client ID/secret, grant type, and scopes.

## Configuration Options

### Environment Variables

Both `create_n8n_*.sh` scripts automatically use these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `KEYCLOAK_URL` | Keycloak base URL | `http://localhost:8090` |
| `REALM` | Keycloak realm name | `trustify` |
| `KEYCLOAK_ADMIN` | Admin username | `admin` |
| `KEYCLOAK_ADMIN_PASSWORD` | Admin password | `admin123456` |

These can be set inline with the command or exported in your shell session.

### Advanced Configuration (add_confidential_client.sh)

The underlying `add_confidential_client.sh` script accepts command-line arguments that override environment variables:

**Common Options:**
- `--name=CLIENT_NAME` - Client name (required)
- `--realm=REALM` - Realm name (overrides `REALM` env var)
- `--keycloak-url=URL` - Keycloak URL (overrides `KEYCLOAK_URL` env var)
- `--admin-user=USER` - Admin username (overrides `KEYCLOAK_ADMIN` env var)
- `--admin-password=PASS` - Admin password (overrides `KEYCLOAK_ADMIN_PASSWORD` env var)
- `--defaultClientScopes=SCOPES` - Comma-separated scopes
- `--protocol-mappers=BOOL` - Add protocol mappers (default: true)

### Notes
- Scopes with colons (e.g., `create:document`) are supported. The scripts ensure scopes exist and link them to the client.
- Both scripts print devmode hints for `TRUSTD_DEVMODE_ADDITIONAL_CLIENTS`.

**Confidential Client Specific:**
- `--secret=SECRET` - Client secret (required)
- `--service-accounts=BOOL` - Enable service accounts (default: false)
- `--direct-access-grants=BOOL` - Enable direct access grants (default: true)
- `--standard-flow=BOOL` - Enable authorization code flow (default: true)
- `--redirect-uris=URIS` - Comma-separated redirect URIs
- `--web-origins=ORIGINS` - Comma-separated web origins

**Note:** The `create_n8n_*.sh` scripts use environment variables and don't require command-line arguments. Use `add_confidential_client.sh` directly for advanced customization.

## Examples

### Example: Use in devmode
```bash
export TRUSTD_DEVMODE_ADDITIONAL_CLIENTS="n8n-client-creds,n8n-auth-code"
cargo run --bin trustd api --devmode --infrastructure-enabled
```

### Custom Client Configuration
```bash
# Using environment variables
export KEYCLOAK_URL=https://sso-tpa.apps.example.com
export REALM=myrealm
./scripts/add_confidential_client.sh \
  --name=worker-service \
  --secret=worker-secret-456 \
  --service-accounts=true \
  --defaultClientScopes=email,profile,roles,read:document

# Or override environment variables with command-line arguments
./scripts/add_confidential_client.sh \
  --name=worker-service \
  --realm=myrealm \
  --keycloak-url=https://sso-tpa.apps.example.com \
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
export TRUSTD_DEVMODE_ADDITIONAL_CLIENTS="n8n-client-creds,n8n-auth-code"
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
