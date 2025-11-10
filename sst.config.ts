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
    const webDomain = {
      production: "powerapp.rynebenson.com",
      development: "dev.powerapp.rynebenson.com"
    };

    const apiDomain = {
      production: "powerapp.api.rynebenson.com",
      development: "dev.powerapp.api.rynebenson.com"
    };

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
    
    api.route("GET /health", {
      handler: "backend/functions/health.handler",
      environment: {
        STAGE: $app.stage,
      },
      architecture: "arm64"
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
      },
    });
    
    return {
      api: api.url,
      web: web.url,
    };
  },
});