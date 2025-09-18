# n8n-nodes-TPA

Local node for Red Hat Trusted Profile Analyzer that can be connected to n8n. Red Hat Trusted Profile Analyzer allows exploration of the relationships between an organization's applications, vulnerabilities and dependencies by consuming and managing Software Bill of Materials (SBOMs), Vulnerability Exploitability eXchange (VEX) information from various vulnerability databases. Trusted Profile Analyzer is a tool for DevSecOps and developers to better understand the organization's risk profile.


## Prerequisites

You need the following installed on your development machine:

* [git](https://git-scm.com/downloads)
* Node.js and npm. Minimum version Node 20. You can find instructions on how to install both using nvm (Node Version Manager) for Linux, Mac, and WSL [here](https://github.com/nvm-sh/nvm). For Windows users, refer to Microsoft's guide to [Install NodeJS on Windows](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows).
* Install n8n with:
  ```
  npm install n8n -g
  ```
* Recommended: follow n8n's guide to [set up your development environment](https://docs.n8n.io/integrations/creating-nodes/build/node-development-environment/).

## Using this node

These are the basic steps for working with the node.

1. Clone the repo
2. Run `npm i` to install dependencies.
3. 
	In your node directory
	```
	npm run build
	npm link
	```
  
4. In the nodes directory within your n8n installation
	```
	npm link n8n-nodes-TPA
	```

* Check your directory

	Make sure you run npm link n8n-nodes-TPA in the nodes directory within your n8n installation. This can be:

	~/.n8n/custom/

5. Start n8n:
	```
	n8n start
	```

## Troubleshooting

There's no custom directory in ~/.n8n local installation.

You have to create custom directory manually and run npm init


In ~/.n8n directory run:
```
mkdir custom 
cd custom 
npm init
```

