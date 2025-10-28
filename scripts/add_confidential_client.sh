#!/usr/bin/env bash

# Script to add a confidential client to Keycloak (for server-side applications)
# Usage: add_confidential_client.sh --name=client_name --realm=myrealm --secret=client_secret
#
# This script creates a CONFIDENTIAL client for server-side applications.
# Supports both service-to-service authentication and user authentication flows.

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common functions
source "${SCRIPT_DIR}/keycloak_common.sh"

# Default values
CLIENT_NAME=""
CLIENT_SECRET=""
DEFAULT_CLIENT_SCOPES="email,profile,roles,web-origins"
SERVICE_ACCOUNTS_ENABLED="false"
STANDARD_FLOW_ENABLED="true"
DIRECT_ACCESS_GRANTS_ENABLED="true"
REDIRECT_URIS=""
WEB_ORIGINS=""
ADD_PROTOCOL_MAPPERS="true"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --name=*)
            CLIENT_NAME="${arg#*=}"
            ;;
        --secret=*)
            CLIENT_SECRET="${arg#*=}"
            ;;
        --defaultClientScopes=*)
            DEFAULT_CLIENT_SCOPES="${arg#*=}"
            ;;
        --service-accounts=*)
            SERVICE_ACCOUNTS_ENABLED="${arg#*=}"
            ;;
        --standard-flow=*)
            STANDARD_FLOW_ENABLED="${arg#*=}"
            ;;
        --direct-access-grants=*)
            DIRECT_ACCESS_GRANTS_ENABLED="${arg#*=}"
            ;;
        --redirect-uris=*)
            REDIRECT_URIS="${arg#*=}"
            ;;
        --web-origins=*)
            WEB_ORIGINS="${arg#*=}"
            ;;
        --protocol-mappers=*)
            ADD_PROTOCOL_MAPPERS="${arg#*=}"
            ;;
        --help)
            echo "Usage: $0 --name=CLIENT_NAME --secret=CLIENT_SECRET [OPTIONS]"
            echo ""
            echo "Required:"
            echo "  --name=CLIENT_NAME           Client name"
            echo "  --secret=CLIENT_SECRET       Client secret"
            echo ""
            echo "Optional:"
            echo "  --defaultClientScopes=SCOPES Comma-separated scopes (default: email,profile,roles,web-origins)"
            echo "  --service-accounts=true|false Enable service accounts (default: false)"
            echo "  --standard-flow=true|false   Enable standard flow (default: true)"
            echo "  --direct-access-grants=true|false Enable direct access grants (default: true)"
            echo "  --redirect-uris=URIS        Comma-separated redirect URIs"
            echo "  --web-origins=ORIGINS        Comma-separated web origins"
            echo "  --protocol-mappers=true|false Add protocol mappers (default: true)"
            show_common_help
            exit 0
            ;;
        *)
            # Parse common arguments
            parse_common_args "$arg"
            ;;
    esac
done

# Validate required arguments
if [[ -z "$CLIENT_NAME" ]]; then
    echo "Error: --name is required"
    exit 1
fi

if [[ -z "$CLIENT_SECRET" ]]; then
    echo "Error: --secret is required"
    exit 1
fi

# Validate dependencies
validate_dependencies

echo "Adding confidential client '$CLIENT_NAME' to realm '$REALM'..."

# Authenticate
TOKEN=$(authenticate)

# Check if client already exists
echo "Checking if client already exists..."
EXISTING_CLIENT_ID=$(client_exists "$CLIENT_NAME" "$TOKEN")

if [[ -n "$EXISTING_CLIENT_ID" ]]; then
    echo "Client '$CLIENT_NAME' already exists with ID: $EXISTING_CLIENT_ID"
    echo "Updating existing client..."
    
    # Update existing client
    CLIENT_DATA=$(cat <<EOF
{
    "clientId": "${CLIENT_NAME}",
    "enabled": true,
    "publicClient": false,
    "implicitFlowEnabled": false,
    "standardFlowEnabled": ${STANDARD_FLOW_ENABLED},
    "directAccessGrantsEnabled": ${DIRECT_ACCESS_GRANTS_ENABLED},
    "serviceAccountsEnabled": ${SERVICE_ACCOUNTS_ENABLED},
    "redirectUris": $(to_json_array "$REDIRECT_URIS"),
    "webOrigins": $(to_json_array "$WEB_ORIGINS"),
    "fullScopeAllowed": true,
    "defaultClientScopes": $(scopes_to_json_array "$DEFAULT_CLIENT_SCOPES"),
    "optionalClientScopes": [
        "address",
        "microprofile-jwt",
        "offline_access",
        "phone"
    ],
    "attributes": {
        "access.token.lifespan": "300",
        "post.logout.redirect.uris": "+"
    }
}
EOF
)
    
    update_client "$EXISTING_CLIENT_ID" "$CLIENT_DATA" "$TOKEN"
    set_client_secret "$EXISTING_CLIENT_ID" "$CLIENT_SECRET" "$TOKEN"
    
    echo "Client updated successfully!"
else
    echo "Creating new client..."
    
    # Create new client with minimal data first
    echo "Creating client with minimal configuration..."
    curl -s -X POST \
        "${KEYCLOAK_URL}/admin/realms/${REALM}/clients" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"clientId\": \"${CLIENT_NAME}\", \"enabled\": true}" > /dev/null
    
    # Wait for client to be created
    sleep 2
    
    # Get the client ID
    CLIENT_ID=$(get_client_id "$CLIENT_NAME" "$TOKEN")
    if [[ -z "$CLIENT_ID" || "$CLIENT_ID" == "null" ]]; then
        echo "Error: Failed to create client" >&2
        exit 1
    fi
    
    echo "Client created with ID: $CLIENT_ID"
    
    # Update client with full configuration
    CLIENT_DATA=$(cat <<EOF
{
    "clientId": "${CLIENT_NAME}",
    "enabled": true,
    "publicClient": false,
    "implicitFlowEnabled": false,
    "standardFlowEnabled": ${STANDARD_FLOW_ENABLED},
    "directAccessGrantsEnabled": ${DIRECT_ACCESS_GRANTS_ENABLED},
    "serviceAccountsEnabled": ${SERVICE_ACCOUNTS_ENABLED},
    "redirectUris": $(to_json_array "$REDIRECT_URIS"),
    "webOrigins": $(to_json_array "$WEB_ORIGINS"),
    "fullScopeAllowed": true,
    "defaultClientScopes": $(scopes_to_json_array "$DEFAULT_CLIENT_SCOPES"),
    "optionalClientScopes": [
        "address",
        "microprofile-jwt",
        "offline_access",
        "phone"
    ],
    "attributes": {
        "access.token.lifespan": "300",
        "post.logout.redirect.uris": "+"
    }
}
EOF
)
    
    update_client "$CLIENT_ID" "$CLIENT_DATA" "$TOKEN"
    set_client_secret "$CLIENT_ID" "$CLIENT_SECRET" "$TOKEN"
    
    # Add protocol mappers if requested
    if [[ "$ADD_PROTOCOL_MAPPERS" == "true" ]]; then
        add_protocol_mappers "$CLIENT_ID" "$TOKEN"
    fi
    
    echo "Client created successfully!"
fi

echo "Confidential client '$CLIENT_NAME' is ready!"
echo "Client Secret: $CLIENT_SECRET"
echo "Service Accounts Enabled: $SERVICE_ACCOUNTS_ENABLED"
echo "Standard Flow Enabled: $STANDARD_FLOW_ENABLED"
echo "Direct Access Grants Enabled: $DIRECT_ACCESS_GRANTS_ENABLED"
echo "Redirect URIs: ${REDIRECT_URIS:-'none'}"
echo "Web Origins: ${WEB_ORIGINS:-'none'}"
echo "Protocol Mappers: $ADD_PROTOCOL_MAPPERS"
echo "Default Scopes: $DEFAULT_CLIENT_SCOPES"

show_devmode_instructions "$CLIENT_NAME"