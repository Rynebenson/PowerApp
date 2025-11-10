// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "powerapp",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const GoogleClientId = new sst.Secret("GOOGLE_CLIENT_ID");
    const GoogleClientSecret = new sst.Secret("GOOGLE_CLIENT_SECRET");

    const appDataTable = new sst.aws.Dynamo("AppDataTable", {
      fields: {
        pk: "string",
        sk: "string",
        gsi1pk: "string",
        gsi1sk: "string",
        entityType: "string",
      },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      globalIndexes: {
        gsi1: { hashKey: "gsi1pk", rangeKey: "gsi1sk" },
        entityIndex: { hashKey: "entityType", rangeKey: "pk" },
      },
      ttl: "ttl",
    });
    const webDomain = {
      production: "powerapp.rynebenson.com",
      development: "dev.powerapp.rynebenson.com"
    };

    const apiDomain = {
      production: "powerapp.api.rynebenson.com",
      development: "dev.powerapp.api.rynebenson.com"
    };

    const smsRole = new aws.iam.Role("CognitoSMSRole", {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { Service: "cognito-idp.amazonaws.com" },
          Action: "sts:AssumeRole",
        }],
      }),
      inlinePolicies: [{
        name: "sns-publish",
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [{
            Effect: "Allow",
            Action: "sns:Publish",
            Resource: "*",
          }],
        }),
      }],
    });

    const userPool = new sst.aws.CognitoUserPool("UserPool", {
      usernames: ["email", "phone"],
      triggers: {
        postConfirmation: {
          handler: "backend/functions/auth/post-confirmation.handler",
          environment: {
            APP_DATA_TABLE: appDataTable.name,
          },
          link: [appDataTable],
        },
      },
      transform: {
        userPool: {
          autoVerifiedAttributes: ["email"],
          smsConfiguration: {
            externalId: `powerapp-${$app.stage}`,
            snsCallerArn: smsRole.arn,
          },
        },
      },
    });

    const googleProvider = userPool.addIdentityProvider("Google", {
      type: "google",
      details: {
        authorize_scopes: "email profile openid",
        client_id: GoogleClientId.value,
        client_secret: GoogleClientSecret.value,
      },
      attributes: {
        email: "email",
        name: "name",
        given_name: "given_name",
        family_name: "family_name",
        username: "sub",
        picture: "picture",
      },
    });

    const userPoolDomain = new aws.cognito.UserPoolDomain("UserPoolDomain", {
      domain: `powerapp-auth-${$app.stage}`,
      userPoolId: userPool.id,
    });

    const userPoolClient = new aws.cognito.UserPoolClient("UserPoolClient", {
      userPoolId: userPool.id,
      callbackUrls: [
        "http://localhost:3000",
        "https://powerapp.rynebenson.com",
        "https://dev.powerapp.rynebenson.com",
      ],
      logoutUrls: [
        "http://localhost:3000",
        "https://powerapp.rynebenson.com",
        "https://dev.powerapp.rynebenson.com",
      ],
      allowedOauthFlows: ["code"],
      allowedOauthScopes: ["email", "openid", "profile", "aws.cognito.signin.user.admin"],
      supportedIdentityProviders: ["COGNITO", googleProvider.providerName],
      allowedOauthFlowsUserPoolClient: true,
    });

    let webCertArn, apiCertArn;
    if ($app.stage === "development" || $app.stage === "production") {
      const usEast1 = new aws.Provider("useast1", { region: "us-east-1" });
      
      const webCert = new aws.acm.Certificate("webCert", {
        domainName: webDomain[$app.stage as keyof typeof webDomain],
        validationMethod: "DNS"
      }, { provider: usEast1 });

      const webCertValidation = new aws.acm.CertificateValidation("webCertValidation", {
        certificateArn: webCert.arn,
        validationRecordFqdns: [webCert.domainValidationOptions[0].resourceRecordName]
      }, { provider: usEast1 });
      
      const apiCert = new aws.acm.Certificate("apiCert", {
        domainName: apiDomain[$app.stage as keyof typeof apiDomain],
        validationMethod: "DNS"
      }, { provider: usEast1 });

      const apiCertValidation = new aws.acm.CertificateValidation("apiCertValidation", {
        certificateArn: apiCert.arn,
        validationRecordFqdns: [apiCert.domainValidationOptions[0].resourceRecordName]
      }, { provider: usEast1 });
      
      webCertArn = webCertValidation.certificateArn;
      apiCertArn = apiCertValidation.certificateArn;
    }

    const api = new sst.aws.ApiGatewayV2("Api", {
      cors: true,
      ...(apiCertArn && {
        domain: {
          name: apiDomain[$app.stage as keyof typeof apiDomain],
          cert: apiCertArn,
          dns: false
        }
      })
    });

    const authorizer = new aws.apigatewayv2.Authorizer("JwtAuthorizer", {
      apiId: api.nodes.api.id,
      authorizerType: "JWT",
      identitySources: ["$request.header.Authorization"],
      jwtConfiguration: {
        audiences: [userPoolClient.id],
        issuer: $interpolate`https://cognito-idp.${aws.getArnOutput(userPool).region}.amazonaws.com/${userPool.id}`,
      },
    });
    
    api.route("GET /health", {
      handler: "backend/functions/health.handler",
      environment: {
        STAGE: $app.stage,
      },
      architecture: "arm64"
    });

    api.route("GET /users/preferences", {
      handler: "backend/functions/users/preferences.handler",
      link: [appDataTable],
      architecture: "arm64",
    }, {
      auth: { jwt: { authorizer: authorizer.id } },
    });

    api.route("PUT /users/preferences", {
      handler: "backend/functions/users/preferences.handler",
      link: [appDataTable],
      architecture: "arm64",
    }, {
      auth: { jwt: { authorizer: authorizer.id } },
    });
    
    const web = new sst.aws.Nextjs("MyWeb", {
      ...(webCertArn && {
        domain: {
          name: webDomain[$app.stage as keyof typeof webDomain],
          cert: webCertArn,
          dns: false
        }
      }),
      environment: {
        NEXT_PUBLIC_API_URL: api.url,
        NEXT_PUBLIC_USER_POOL_ID: userPool.id,
        NEXT_PUBLIC_USER_POOL_CLIENT_ID: userPoolClient.id,
        NEXT_PUBLIC_USER_POOL_DOMAIN: userPoolDomain.domain,
      },
    });
    
    return {
      api: api.url,
      web: web.url,
      userPoolId: userPool.id,
      userPoolClientId: userPoolClient.id,
    };
  },
});