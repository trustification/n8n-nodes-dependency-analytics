import {
	ICredentialType,
	INodeProperties
} from 'n8n-workflow';

export class TrustifyClientOAuth2Api implements ICredentialType {
	name = 'trustifyClientOAuth2Api';
	displayName = 'Trustify Client Credentials (Machine-to-Machine) OAuth2 API';
	documentationUrl = 'https://access.redhat.com/products/red-hat-trusted-profile-analyzer';
	extends = ['oAuth2Api'];
	properties: INodeProperties[] = [
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'string' as const,
			default: 'https://sso-trustify.apps.cluster.trustification.rocks/realms/chicken/protocol/openid-connect/token',
			description: 'URL for exchanging credentials for access token',
			required: true,
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string' as const,
			default: '',
			description: 'OAuth2 client ID',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string' as const,
			typeOptions: { password: true },
			default: '',
			description: 'OAuth2 client secret',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string' as const,
			default: 'read:document',
			placeholder: 'e.g. read:document',
			description: 'Scopes to request (space-separated)',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden' as const,
			default: 'clientCredentials',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden' as const,
			default: 'header',
		},
	];
}
