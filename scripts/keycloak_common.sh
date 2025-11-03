#!/usr/bin/env bash

# Common functions for Keycloak client management scripts
# This file should be sourced by other scripts

# Default configuration
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8090}"
KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin123456}"
REALM="${REALM:-trustify}"
KEYCLOAK_SKIP_SSL="${KEYCLOAK_SKIP_SSL:-false}"

# Build curl SSL option: skip SSL if explicitly set, or if using HTTPS (likely self-signed certs in dev)
if [[ "$KEYCLOAK_SKIP_SSL" == "true" ]] || [[ "$KEYCLOAK_URL" =~ ^https:// ]]; then
    CURL_SSL_OPTS="-k"
else
    CURL_SSL_OPTS=""
fi

# Function to get access token
get_access_token() {
    local response
    response=$(curl $CURL_SSL_OPTS -s -X POST \
        "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=${KEYCLOAK_ADMIN}" \
        -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
        -d "grant_type=password" \
        -d "client_id=admin-cli")
    
    echo "$response" | jq -r '.access_token'
}

# Function to make authenticated API calls
kc_api() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    
    if [[ -n "$data" ]]; then
        curl $CURL_SSL_OPTS -s -X "$method" \
            "${KEYCLOAK_URL}/admin/realms/${REALM}${endpoint}" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl $CURL_SSL_OPTS -s -X "$method" \
            "${KEYCLOAK_URL}/admin/realms/${REALM}${endpoint}" \
            -H "Authorization: Bearer $token"
    fi
}

# Function to check if client exists
client_exists() {
    local client_name="$1"
    local token="$2"
    
    local result=$(kc_api "GET" "/clients?clientId=${client_name}" "" "$token" | jq -r '.[0].id // empty')
    echo "$result"
}

# Function to get client ID by name
get_client_id() {
    local client_name="$1"
    local token="$2"
    
    kc_api "GET" "/clients?clientId=${client_name}" "" "$token" | jq -r '.[0].id'
}

# Function to update client secret
update_client_secret() {
    local client_id="$1"
    local secret="$2"
    local token="$3"
    
    local secret_data="{\"type\": \"secret\", \"value\": \"${secret}\"}"
    kc_api "PUT" "/clients/${client_id}/client-secret" "$secret_data" "$token" > /dev/null
}

# Function to validate required tools
validate_dependencies() {
    local missing_tools=()
    
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo "Error: The following required tools are missing: ${missing_tools[*]}"
        echo "Please install them and try again."
        exit 1
    fi
}

# Function to authenticate and get token
authenticate() {
    local token=$(get_access_token)
    
    if [[ "$token" == "null" || -z "$token" ]]; then
        echo "Error: Failed to get access token. Check your credentials and Keycloak URL." >&2
        echo "Keycloak URL: $KEYCLOAK_URL" >&2
        echo "Admin User: $KEYCLOAK_ADMIN" >&2
        exit 1
    fi
    
    echo "$token"
}

# Function to convert comma-separated scopes to JSON array
scopes_to_json_array() {
    local scopes="$1"
    echo "[$(echo "$scopes" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | tr '\n' ',' | sed 's/,$//')]"
}

# Function to check if a client scope exists by name; returns ID or empty
client_scope_exists() {
    local scope_name="$1"
    local token="$2"
    kc_api "GET" "/client-scopes" "" "$token" | jq -r '.[] | select(.name == "'$scope_name'") | .id' | head -n 1
}

# Function to create a simple OIDC client scope with given name
create_client_scope() {
    local scope_name="$1"
    local token="$2"
    local scope_data='{ "name": "'"$scope_name"'", "protocol": "openid-connect" }'
    kc_api "POST" "/client-scopes" "$scope_data" "$token" > /dev/null
}

# Ensure a comma-separated list of client scopes exist
ensure_client_scopes() {
    local scopes_csv="$1"
    local token="$2"
    IFS=',' read -r -a scopes_arr <<< "$scopes_csv"
    for scope in "${scopes_arr[@]}"; do
        # trim whitespace
        local trimmed_scope
        trimmed_scope="$(echo "$scope" | sed 's/^ *//;s/ *$//')"
        if [[ -z "$trimmed_scope" ]]; then
            continue
        fi
        local existing_id
        existing_id="$(client_scope_exists "$trimmed_scope" "$token" || true)"
        if [[ -z "$existing_id" || "$existing_id" == "null" ]]; then
            echo "Creating client scope: $trimmed_scope"
            create_client_scope "$trimmed_scope" "$token"
            # brief pause to allow propagation
            sleep 1
        else
            echo "Client scope exists: $trimmed_scope ($existing_id)"
        fi
    done
}

# Link (assign) default client scopes to a client by scope name list
ensure_client_default_scopes() {
    local client_id="$1"
    local scopes_csv="$2"
    local token="$3"
    IFS=',' read -r -a scopes_arr <<< "$scopes_csv"
    for scope in "${scopes_arr[@]}"; do
        local trimmed_scope
        trimmed_scope="$(echo "$scope" | sed 's/^ *//;s/ *$//')"
        if [[ -z "$trimmed_scope" ]]; then
            continue
        fi
        local scope_id
        scope_id="$(client_scope_exists "$trimmed_scope" "$token" || true)"
        if [[ -z "$scope_id" || "$scope_id" == "null" ]]; then
            echo "Warning: scope '$trimmed_scope' not found; creating and retrying"
            create_client_scope "$trimmed_scope" "$token"
            sleep 1
            scope_id="$(client_scope_exists "$trimmed_scope" "$token" || true)"
        fi
        if [[ -n "$scope_id" && "$scope_id" != "null" ]]; then
            echo "Linking default scope '$trimmed_scope' to client ($client_id)"
            # Use PUT to link scope as default to client; ignore errors if already linked
            kc_api "PUT" "/clients/${client_id}/default-client-scopes/${scope_id}" "" "$token" > /dev/null || true
        else
            echo "Error: unable to resolve scope id for '$trimmed_scope'" >&2
        fi
    done
}

# Function to convert comma-separated values to JSON array
to_json_array() {
    local values="$1"
    if [[ -n "$values" ]]; then
        echo "[$(echo "$values" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | tr '\n' ',' | sed 's/,$//')]"
    else
        echo "[]"
    fi
}

# Function to add protocol mappers to a client
add_protocol_mappers() {
    local client_id="$1"
    local token="$2"
    
    echo "Adding protocol mappers..."
    
    # Add sub mapper
    local sub_mapper='{
        "name": "sub",
        "protocol": "openid-connect",
        "protocolMapper": "oidc-sub-mapper",
        "consentRequired": false,
        "config": {
            "access.token.claim": "true",
            "claim.name": "sub",
            "jsonType.label": "String"
        }
    }'
    
    kc_api "POST" "/clients/${client_id}/protocol-mappers/models" "$sub_mapper" "$token" > /dev/null
    
    # Add username mapper
    local username_mapper='{
        "name": "username",
        "protocol": "openid-connect",
        "protocolMapper": "oidc-usermodel-property-mapper",
        "consentRequired": false,
        "config": {
            "userinfo.token.claim": "true",
            "user.attribute": "username",
            "access.token.claim": "true",
            "claim.name": "preferred_username",
            "jsonType.label": "String"
        }
    }'
    
    kc_api "POST" "/clients/${client_id}/protocol-mappers/models" "$username_mapper" "$token" > /dev/null
}

# Function to create a client
create_client() {
    local client_data="$1"
    local token="$2"
    local client_name="$3"
    
    # Create the client using the working approach
    local response=$(curl $CURL_SSL_OPTS -s -X POST \
        "${KEYCLOAK_URL}/admin/realms/${REALM}/clients" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$client_data")
    
    # Wait a moment for the client to be created
    sleep 2
    
    # Get the client ID by querying for the client
    local client_id=$(get_client_id "$client_name" "$token")
    
    if [[ -z "$client_id" || "$client_id" == "null" ]]; then
        echo "Error: Failed to create client" >&2
        return 1
    fi
    
    echo "$client_id"
}

# Function to update a client
update_client() {
    local client_id="$1"
    local client_data="$2"
    local token="$3"
    
    kc_api "PUT" "/clients/${client_id}" "$client_data" "$token" > /dev/null
}

# Function to set client secret
set_client_secret() {
    local client_id="$1"
    local secret="$2"
    local token="$3"
    
    echo "Setting client secret..."
    local secret_data="{\"secret\": \"${secret}\"}"
    kc_api "PUT" "/clients/${client_id}" "$secret_data" "$token" > /dev/null
}

# Function to show devmode instructions
show_devmode_instructions() {
    local client_name="$1"
    echo ""
    echo "To use this client in devmode, set the environment variable:"
    echo "  export TRUSTD_DEVMODE_ADDITIONAL_CLIENTS=\"$client_name\""
    echo "  cargo run --bin trustd api --devmode --infrastructure-enabled"
}

# Function to show common help
show_common_help() {
    echo "Common Options:"
    echo "  --keycloak-url=URL             Keycloak URL (default: http://localhost:8090)"
    echo "  --admin-user=USER              Admin username (default: admin)"
    echo "  --admin-password=PASS          Admin password (default: admin123456)"
    echo "  --realm=REALM                  Realm name (default: trustify)"
    echo "  --help                         Show this help"
}

# Function to parse common arguments
parse_common_args() {
    for arg in "$@"; do
        case $arg in
            --keycloak-url=*)
                KEYCLOAK_URL="${arg#*=}"
                ;;
            --admin-user=*)
                KEYCLOAK_ADMIN="${arg#*=}"
                ;;
            --admin-password=*)
                KEYCLOAK_ADMIN_PASSWORD="${arg#*=}"
                ;;
            --realm=*)
                REALM="${arg#*=}"
                ;;
        esac
    done
}
