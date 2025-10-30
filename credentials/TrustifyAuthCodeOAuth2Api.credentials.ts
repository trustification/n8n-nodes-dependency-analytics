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
      type: 'string' as const,
      default: 'https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/auth',
      description: 'URL where users authorize the application (required for user authentication)',
      required: true,
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'string' as const,
      default: 'https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token',
      description: 'URL for exchanging credentials for access token',
      required: true,
    },
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string' as const,
      description: 'OAuth2 client ID',
      default: '',
      required: true,
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: 'string' as const,
      default: '',
      description: 'OAuth2 client secret',
      required: true,
      typeOptions: { password: true },
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'string' as const,
      default: 'openid',
      description: 'OAuth2 scopes to request (space-separated)',
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
