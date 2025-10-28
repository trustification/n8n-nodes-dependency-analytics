import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TrustifyAuthCodeOAuth2Api implements ICredentialType {
  name = 'trustifyAuthCodeOAuth2Api';
  displayName = 'Trustify (Authorization Code - User Authentication) OAuth2 API';
  documentationUrl = 'https://access.redhat.com/products/red-hat-trusted-profile-analyzer';
  extends = ['oAuth2Api'];
  properties: INodeProperties[] = [
    {
      displayName: 'Authorization URL',
      name: 'authUrl',
      type: process.env['TRUSTIFY_SSO_URL'] ? ('hidden' as const) : ('string' as const),
      default: process.env['TRUSTIFY_SSO_URL']
        ? `${process.env['TRUSTIFY_SSO_URL']}/protocol/openid-connect/auth`
        : 'https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/auth',
      description: 'URL where users authorize the application (required for user authentication)',
      required: true,
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: process.env['TRUSTIFY_SSO_URL'] ? ('hidden' as const) : ('string' as const),
      default: process.env['TRUSTIFY_SSO_URL']
        ? `${process.env['TRUSTIFY_SSO_URL']}/protocol/openid-connect/token`
        : 'https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token',
      description: 'URL for exchanging credentials for access token',
      required: true,
    },
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: process.env['TRUSTIFY_CLIENT_ID'] ? ('hidden' as const) : ('string' as const),
      default: process.env['TRUSTIFY_CLIENT_ID'] ?? '',
      description: 'OAuth2 client ID',
      required: true,
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: process.env['TRUSTIFY_CLIENT_SECRET'] ? ('hidden' as const) : ('string' as const),
      default: process.env['TRUSTIFY_CLIENT_SECRET'] ?? '',
      description: 'OAuth2 client secret',
      required: true,
      typeOptions: { password: true },
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: process.env['TRUSTIFY_SCOPE'] ? ('hidden' as const) : ('string' as const),
      default: process.env['TRUSTIFY_SCOPE'] || 'openid',
      description: 'Scopes to request (space-separated)',
      required: true,
      placeholder: 'e.g. openid',
    },
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden' as const,
      default: 'authorizationCode',
    },
    {
      displayName: 'Authentication',
      name: 'authentication',
      type: 'hidden' as const,
      default: 'header',
    },
  ];
}
