#!/usr/bin/env bash

# Script to create an N8N client using the existing add_confidential_client.sh script
# This demonstrates how to use the confidential client script for N8N workflow automation

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Creating N8N Client ==="
echo "This script uses the existing add_confidential_client.sh to create an N8N client"
echo "N8N is a workflow automation tool that needs both user authentication and server-side capabilities"
echo

# Default values for N8N client
CLIENT_NAME="n8n-auth-code"
CLIENT_SECRET="n8n-secret-key-for-trustify-auth"
REDIRECT_URIS="http://localhost:5678/*,http://localhost:5678/rest/oauth2-credential/callback"
WEB_ORIGINS="http://localhost:5678"
DEFAULT_CLIENT_SCOPES="email,profile,roles,web-origins,create:document,read:document,delete:document"

# Read environment variables (or use defaults)
REALM="${REALM:-trustify}"
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8090}"

# Export to ensure they're available to child processes
export REALM KEYCLOAK_URL

echo "Creating N8N client with the following configuration:"
echo "- Client Name: $CLIENT_NAME"
echo "- Client Secret: $CLIENT_SECRET"
echo "- Redirect URIs: $REDIRECT_URIS"
echo "- Web Origins: $WEB_ORIGINS"
echo "- Default Scopes: $DEFAULT_CLIENT_SCOPES"
echo "- Using REALM: $REALM"
echo "- Using KEYCLOAK_URL: $KEYCLOAK_URL"
echo

# Call the existing add_confidential_client.sh script
# Environment variables REALM and KEYCLOAK_URL are now exported
echo "Executing add_confidential_client.sh..."
"${SCRIPT_DIR}/add_confidential_client.sh" \
    --name="$CLIENT_NAME" \
    --secret="$CLIENT_SECRET" \
    --redirect-uris="$REDIRECT_URIS" \
    --web-origins="$WEB_ORIGINS" \
    --defaultClientScopes="$DEFAULT_CLIENT_SCOPES" \
    --standard-flow=true \
    --direct-access-grants=true

echo
echo "=== N8N Client Created Successfully ==="
echo
echo "N8N Configuration for your workflow automation:"
echo "- Client ID: $CLIENT_NAME"
echo "- Authorization URL: $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/auth"
echo "- Token URL: $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token"
echo "- User Info URL: $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/userinfo"
echo "- Client Secret: $CLIENT_SECRET"
echo "- Redirect URIs: $REDIRECT_URIS"
echo "- Scopes: $DEFAULT_CLIENT_SCOPES"
echo
echo "Note: N8N is a server-side application that needs both user authentication and service capabilities."
echo "This is why we use a confidential client with redirect URIs - the standard OAuth2 pattern for server-side apps."
