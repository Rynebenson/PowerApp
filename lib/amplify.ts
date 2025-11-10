import { Amplify, ResourcesConfig } from 'aws-amplify';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      loginWith: {
        email: true,
        phone: true,
        oauth: {
          domain: `${process.env.NEXT_PUBLIC_USER_POOL_DOMAIN}.auth.us-east-1.amazoncognito.com`,
          scopes: ['email', 'openid', 'profile', 'aws.cognito.signin.user.admin'],
          redirectSignIn: [getBaseUrl()],
          redirectSignOut: [getBaseUrl()],
          responseType: 'code' as const,
          providers: ['Google']
        }
      }
    }
  }
} satisfies ResourcesConfig;

Amplify.configure(amplifyConfig);

export default amplifyConfig;