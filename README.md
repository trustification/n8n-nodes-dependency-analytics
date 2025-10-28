[![ci](https://github.com/trustification/n8n-nodes-dependency-analytics/actions/workflows/ci.yaml/badge.svg)](https://github.com/trustification/n8n-nodes-dependency-analytics/actions/workflows/ci.yaml)
[![codecov](https://codecov.io/gh/trustification/n8n-nodes-dependency-analytics/graph/badge.svg?token=WIH8MUMZ7T)](https://codecov.io/gh/trustification/n8n-nodes-dependency-analytics)
# n8n-nodes-dependency-analytics

This is an [n8n](https://n8n.io/) community node for [Red Hat Dependency Analytics](https://github.com/trustification).

Dependency Analytics helps organizations explore the relationships between applications, dependencies, and vulnerabilities by consuming and managing:

- **Software Bill of Materials (SBOMs)**
- **Vulnerability Exploitability eXchange (VEX)** data
- **Vendor advisories** from vulnerability databases

It is designed for **DevSecOps teams and developers** to better understand and reduce organizational risk exposure.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node currently supports the following operations:

**SBOM Operations**

- **Get SBOM Details:** Retrieve metadata for a given SBOM.
- **List All SBOMs:** Query all SBOMs available in your Dependency Analytics instance.


**Advisory & Vulnerability Operations**

- **List Advisories:** Fetch advisories published.
- **Get Advisory Details:** Retrieve details for a specific advisory (CVE link, publication date, issuer).
- **Link Advisories to SBOMs:** Query advisories relevant to a specific SBOM.


**Search Operations**

- **Query by SBOM SHA256.**
- **Integrate Dependency Analytics queries into conditionals for downstream automation.**


## Credentials

This node supports two OAuth2 credential types for authenticating with Red Hat Dependency Analytics:

### 1. Trustify (Authorization Code - User Authentication) OAuth2 API

**Purpose:** User authentication flow where individual users authenticate through Red Hat SSO. This is ideal for interactive workflows where users need to authenticate themselves.

**Configuration:**
- **Authorization URL:** `https://sso.example.com/auth/realms/trustify/protocol/openid-connect/auth`
- **Access Token URL:** `https://sso.example.com/auth/realms/trustify/protocol/openid-connect/token`
- **Grant Type:** `authorizationCode`
- **Authentication:** `header`

### 2. Trustify Client Credentials (Machine-to-Machine) OAuth2 API

**Purpose:** Machine-to-machine authentication using client credentials. This is ideal for automated workflows, CI/CD pipelines, and server-to-server communication where no user interaction is required.

**Configuration:**
- **Access Token URL:** `https://sso.example.com/auth/realms/trustify/protocol/openid-connect/token`
- **Grant Type:** `clientCredentials`
- **Authentication:** `header`

### Environment Variables

Both credential types support the following environment variables for configuration:

| Environment Variable | Description | Default Value |
|---------------------|-------------|---------------|
| `TRUSTIFY_SSO_URL` | Base SSO URL (suffixed with `/protocol/openid-connect/auth` and `/protocol/openid-connect/token`) | `https://sso.example.com/auth/realms/trustify` |
| `TRUSTIFY_CLIENT_ID` | OAuth2 client ID | Empty string |
| `TRUSTIFY_CLIENT_SECRET` | OAuth2 client secret | Empty string |
| `TRUSTIFY_SCOPE` | OAuth2 scopes (space-separated) | `openid` |

**Note:** When `TRUSTIFY_SSO_URL` is defined, it automatically generates:
- Authorization URL: `${TRUSTIFY_SSO_URL}/protocol/openid-connect/auth`
- Access Token URL: `${TRUSTIFY_SSO_URL}/protocol/openid-connect/token`

### Environment Variable Behavior

- **When defined:** The corresponding credential field becomes hidden in the n8n UI and uses the environment variable value
- **When not defined:** The credential field is visible in the n8n UI and can be configured manually

### Choosing Between Credential Types

- **Use Authorization Code OAuth2** when:
  - Users need to authenticate individually
  - Interactive workflows requiring user consent
  - Personal or user-specific data access

- **Use Client Credentials OAuth2** when:
  - Automated workflows and CI/CD pipelines
  - Server-to-server communication
  - No user interaction required
  - Service account authentication


## Compatibility

- **Minimum tested n8n version:** 1.103.2

- **Node.js**: 22.20.0

- **Tested against Dependency Analytics API (latest release)**

## Usage

1. Add the Dependency Analytics node to your n8n workflow

2. Select an operation (e.g., “List SBOMs”)

3. Provide required inputs (e.g., SBOM SHA256)

4. Run the workflow and process the results

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Dependency Analytics GitHub](https://github.com/trustification)

## Version history

1.0.0 – Initial release with SBOM, vulnerability, and advisory operations

