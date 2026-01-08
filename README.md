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

[Installation](#installation) |
[Operations](#operations) |
[Credentials](#credentials) |
[Compatibility](#compatibility) |
[Usage](#usage) |
[Resources](#resources) |
[Version history](#version-history) 

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node provides three operation groups that mirror the Dependency Analytics API:

**SBOM operations**

- **Get SBOM** - Retrieve metadata for a single SBOM by its SHA (supports `sha256:`, `sha384:`, `sha512:` prefixes).
- **Get Many SBOMs** - List SBOMs in your instance with optional limit/sorting.

**Advisory operations**

- **Get Advisory** - Fetch a specific advisory (includes identifiers, issuer, dates, and CVE links where available).
- **Get Many Advisories** - List advisories with optional sorting.
- **Analyze** - Resolve advisories for supplied packages:
  - From **PURLs**: send one or more PURLs and receive advisories per package.
  - From an **SBOM SHA**: look up the SBOM, then return advisories associated with that SBOM.

**Vulnerability operations**

- **Get Vulnerability** - Retrieve a single vulnerability record (e.g., by CVE).
- **Get Many Vulnerabilities** - List vulnerability records with optional sorting.

### Sorting and limits

- List-style operations accept multiple sort rules; they are applied in order after the items are fetched.
- Supported sort fields:
  - `SBOMs (Get Many)`: published, name, packages (count), size
  - `Advisories (Get Many)`: published, title, size
  - `Advisories (Analyze)`: published, title, average score, average severity (Critical > High > Medium > Low > None > Unknown)
  - `Vulnerabilities (Get Many)`: published, title, average severity, average score
- The `Limit` option caps results (default 50, minimum 1). 

### Output modes

- `Simplified` (default): minimal, stable shape for each resource to keep payloads small.
- `Raw`: returns the API response as-is (use when you need every field).
- `Selected Fields`: pick the properties you want; identifiers are always included.
- Tip: When chaining nodes or using AI tools, prefer `Simplified` or a narrow `Selected Fields` set to avoid oversized items.


## Credentials

This node supports Client Credentials OAuth2 type for authenticating with Red Hat Dependency Analytics.

### RHTPA Client Credentials

- Use when connecting to RHTPA cloud services
- Required parameters: (Provided by the RHTPA team upon request)
  - Client ID
  - Client Secret

### Trustify Client Credentials

- Use when connecting to:
  - On premise Trustify instance
  - Local development
- It requires that in your SSO provider a confidential client exists
  - The Trustify instance accepts this client id
  - The Trustify instance can map the client or scope to the necessary permissions

For more information refer to the [Trustify - OIDC Docs](https://github.com/guacsec/trustify/blob/main/docs/oidc.md)

> **Note:** If you are running n8n locally and see the error *"The connection cannot be established, this usually occurs due to an incorrect host (domain) value"*, try:
> ```bash
> export NODE_TLS_REJECT_UNAUTHORIZED=0
> n8n start
> ```



## Usage

1. Add the Dependency Analytics node to your n8n workflow

2. Select an operation (e.g., “List SBOMs”)

3. Provide required inputs (e.g., SBOM SHA)

4. Run the workflow and process the results

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Dependency Analytics GitHub](https://github.com/trustification)
* [Trustify Documantation](https://docs.guac.sh/trustify/)
