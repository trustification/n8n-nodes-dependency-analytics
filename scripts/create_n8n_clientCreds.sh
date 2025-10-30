#!/usr/bin/env bash

# Script to create an N8N client using the existing add_confidential_client.sh script
# This demonstrates how to use the confidential client script for N8N workflow automation

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Creating N8N Client (Client Credentials) ==="
echo "This script uses the existing add_confidential_client.sh to create an N8N client"
echo "This client is for machine-to-machine (client credentials) access using clientId and secret"
echo

# Default values for N8N client
CLIENT_NAME="n8n-client-creds"
REALM="trustify"
CLIENT_SECRET="n8n-secret-key-for-trustify-auth"
DEFAULT_CLIENT_SCOPES="email,profile,roles,web-origins,create:document,read:document,delete:document"

echo "Creating N8N client with the following configuration:"
echo "- Client Name: $CLIENT_NAME"
echo "- Realm: $REALM"
echo "- Client Secret: $CLIENT_SECRET"
echo "- Default Scopes: $DEFAULT_CLIENT_SCOPES"
echo

# Call the existing add_confidential_client.sh script
echo "Executing add_confidential_client.sh..."
"${SCRIPT_DIR}/add_confidential_client.sh" \
    --name="$CLIENT_NAME" \
    --realm="$REALM" \
    --secret="$CLIENT_SECRET" \
    --defaultClientScopes="$DEFAULT_CLIENT_SCOPES" \
    --service-accounts=true \
    --standard-flow=false \
    --direct-access-grants=false

echo
echo "=== N8N Client Created Successfully ==="
echo
echo "N8N Configuration (Client Credentials):"
echo "- Client ID: $CLIENT_NAME"
echo "- Token URL: http://localhost:8090/realms/$REALM/protocol/openid-connect/token"
echo "- Client Secret: $CLIENT_SECRET"
echo "- Grant Type: client_credentials"
echo "- Scopes: $DEFAULT_CLIENT_SCOPES"
echo
echo "Note: This is a confidential client with service accounts enabled for machine-to-machine flows."
echo "Use OAuth2 client_credentials with the client ID and secret."
