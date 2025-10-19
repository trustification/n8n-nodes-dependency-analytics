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

_TO DO_

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

