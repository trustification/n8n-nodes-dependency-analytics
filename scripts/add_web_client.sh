#!/usr/bin/env bash

# Script to add a public web client to Keycloak (for interactive user authentication)
# Usage: add_web_client.sh --name=client_name --realm=myrealm --redirectUri=http://example.com --webOrigins=http://example.com --defaultClientScopes=a,b,c
#
# This script creates a PUBLIC client for user authentication flows only.
# For server-side applications, use add_confidential_client.sh instead.

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common functions
source "${SCRIPT_DIR}/keycloak_common.sh"

# Default values
CLIENT_NAME=""
REDIRECT_URI=""
WEB_ORIGINS=""
DEFAULT_CLIENT_SCOPES="email,profile,roles,web-origins"
IMPLICIT_FLOW_ENABLED="true"
STANDARD_FLOW_ENABLED="true"
ADD_PROTOCOL_MAPPERS="true"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --name=*)
            CLIENT_NAME="${arg#*=}"
            ;;
        --redirectUri=*)
            REDIRECT_URI="${arg#*=}"
            ;;
        --webOrigins=*)
            WEB_ORIGINS="${arg#*=}"
            ;;
        --defaultClientScopes=*)
            DEFAULT_CLIENT_SCOPES="${arg#*=}"
            ;;
        --implicit-flow=*)
            IMPLICIT_FLOW_ENABLED="${arg#*=}"
            ;;
        --standard-flow=*)
            STANDARD_FLOW_ENABLED="${arg#*=}"
            ;;
        --protocol-mappers=*)
            ADD_PROTOCOL_MAPPERS="${arg#*=}"
            ;;
        --help)
            echo "Usage: $0 --name=CLIENT_NAME --redirectUri=URI --webOrigins=ORIGINS [OPTIONS]"
            echo ""
            echo "Required:"
            echo "  --name=CLIENT_NAME           Client name"
            echo "  --redirectUri=URI            Redirect URI"
            echo "  --webOrigins=ORIGINS         Web origins"
            echo ""
            echo "Optional:"
            echo "  --defaultClientScopes=SCOPES Comma-separated scopes (default: email,profile,roles,web-origins)"
            echo "  --implicit-flow=true|false  Enable implicit flow (default: true)"
            echo "  --standard-flow=true|false  Enable standard flow (default: true)"
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

if [[ -z "$REDIRECT_URI" ]]; then
    echo "Error: --redirectUri is required"
    exit 1
fi

if [[ -z "$WEB_ORIGINS" ]]; then
    echo "Error: --webOrigins is required"
    exit 1
fi

# Validate dependencies
validate_dependencies

echo "Adding web client '$CLIENT_NAME' to realm '$REALM'..."

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
    "publicClient": true,
    "implicitFlowEnabled": ${IMPLICIT_FLOW_ENABLED},
    "standardFlowEnabled": ${STANDARD_FLOW_ENABLED},
    "directAccessGrantsEnabled": false,
    "serviceAccountsEnabled": false,
    "redirectUris": ["${REDIRECT_URI}"],
    "webOrigins": ["${WEB_ORIGINS}"],
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
    
    echo "Client updated successfully!"
else
    echo "Creating new client..."
    
    # Create new client
    CLIENT_DATA=$(cat <<EOF
{
    "clientId": "${CLIENT_NAME}",
    "enabled": true,
    "publicClient": true,
    "implicitFlowEnabled": ${IMPLICIT_FLOW_ENABLED},
    "standardFlowEnabled": ${STANDARD_FLOW_ENABLED},
    "directAccessGrantsEnabled": false,
    "serviceAccountsEnabled": false,
    "redirectUris": ["${REDIRECT_URI}"],
    "webOrigins": ["${WEB_ORIGINS}"],
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
    
    CLIENT_ID=$(create_client "$CLIENT_DATA" "$TOKEN" "$CLIENT_NAME")
    if [[ $? -ne 0 ]]; then
        echo "Failed to create client"
        exit 1
    fi
    
    # Add protocol mappers if requested
    if [[ "$ADD_PROTOCOL_MAPPERS" == "true" ]]; then
        add_protocol_mappers "$CLIENT_ID" "$TOKEN"
    fi
    
    echo "Client created successfully!"
fi

echo "Web client '$CLIENT_NAME' is ready!"
echo "Redirect URI: $REDIRECT_URI"
echo "Web Origins: $WEB_ORIGINS"
echo "Implicit Flow: $IMPLICIT_FLOW_ENABLED"
echo "Standard Flow: $STANDARD_FLOW_ENABLED"
echo "Protocol Mappers: $ADD_PROTOCOL_MAPPERS"
echo "Default Scopes: $DEFAULT_CLIENT_SCOPES"

show_devmode_instructions "$CLIENT_NAME"