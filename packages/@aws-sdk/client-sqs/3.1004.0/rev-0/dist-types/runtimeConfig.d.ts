import { HashConstructor as __HashConstructor } from "@aws-sdk/types";
import { NodeHttpHandler as RequestHandler } from "@smithy/node-http-handler";
import type { SQSClientConfig } from "./SQSClient";
/**
 * @internal
 */
export declare const getRuntimeConfig: (config: SQSClientConfig) => {
    runtime: string;
    defaultsMode: import("@aws-sdk/types").Provider<import("@smithy/smithy-client").ResolvedDefaultsMode>;
    authSchemePreference: string[] | import("@aws-sdk/types").Provider<string[]>;
    bodyLengthChecker: import("@aws-sdk/types").BodyLengthCalculator;
    credentialDefaultProvider: ((input: any) => import("@aws-sdk/types").AwsCredentialIdentityProvider) | ((init?: import("@aws-sdk/credential-provider-node").DefaultProviderInit) => import("@aws-sdk/credential-provider-node/dist-types/runtime/memoize-chain").MemoizedRuntimeConfigAwsCredentialIdentityProvider);
    defaultUserAgentProvider: (config?: import("@aws-sdk/util-user-agent-node").PreviouslyResolved) => Promise<import("@aws-sdk/types").UserAgent>;
    maxAttempts: number | import("@aws-sdk/types").Provider<number>;
    md5: false | __HashConstructor;
    region: string | import("@aws-sdk/types").Provider<string>;
    requestHandler: RequestHandler | import("@smithy/protocol-http").HttpHandler<any>;
    retryMode: string | import("@aws-sdk/types").Provider<string>;
    sha256: __HashConstructor;
    streamCollector: import("@aws-sdk/types").StreamCollector;
    useDualstackEndpoint: boolean | import("@aws-sdk/types").Provider<boolean>;
    useFipsEndpoint: boolean | import("@aws-sdk/types").Provider<boolean>;
    userAgentAppId: string | import("@aws-sdk/types").Provider<string | undefined>;
    cacheMiddleware?: boolean | undefined;
    protocol: import("@smithy/types").ClientProtocol<any, any> | import("@smithy/types").ClientProtocolCtor<any, any> | typeof import("@aws-sdk/core").AwsJson1_0Protocol;
    protocolSettings: {
        defaultNamespace?: string;
        [setting: string]: unknown;
    };
    apiVersion: string;
    urlParser: import("@aws-sdk/types").UrlParser;
    base64Decoder: import("@aws-sdk/types").Decoder;
    base64Encoder: (_input: Uint8Array | string) => string;
    utf8Decoder: import("@aws-sdk/types").Decoder;
    utf8Encoder: (input: Uint8Array | string) => string;
    disableHostPrefix: boolean;
    serviceId: string;
    profile?: string;
    logger: import("@aws-sdk/types").Logger;
    extensions: import("./runtimeExtensions").RuntimeExtension[];
    customUserAgent?: string | import("@aws-sdk/types").UserAgent;
    retryStrategy?: import("@aws-sdk/types").RetryStrategy | import("@aws-sdk/types").RetryStrategyV2;
    endpoint?: ((string | import("@aws-sdk/types").Endpoint | import("@aws-sdk/types").Provider<import("@aws-sdk/types").Endpoint> | import("@aws-sdk/types").EndpointV2 | import("@aws-sdk/types").Provider<import("@aws-sdk/types").EndpointV2>) & (string | import("@aws-sdk/types").Provider<string> | import("@aws-sdk/types").Endpoint | import("@aws-sdk/types").Provider<import("@aws-sdk/types").Endpoint> | import("@aws-sdk/types").EndpointV2 | import("@aws-sdk/types").Provider<import("@aws-sdk/types").EndpointV2>)) | undefined;
    endpointProvider: (endpointParams: import("./endpoint/EndpointParameters").EndpointParameters, context?: {
        logger?: import("@aws-sdk/types").Logger;
    }) => import("@aws-sdk/types").EndpointV2;
    tls?: boolean;
    serviceConfiguredEndpoint?: never;
    useQueueUrlAsEndpoint?: boolean;
    httpAuthSchemes: import("@smithy/types").HttpAuthScheme[];
    httpAuthSchemeProvider: import("./auth/httpAuthSchemeProvider").SQSHttpAuthSchemeProvider;
    credentials?: import("@aws-sdk/types").AwsCredentialIdentity | import("@aws-sdk/types").AwsCredentialIdentityProvider;
    signer?: import("@aws-sdk/types").RequestSigner | ((authScheme?: import("@aws-sdk/types").AuthScheme) => Promise<import("@aws-sdk/types").RequestSigner>);
    signingEscapePath?: boolean;
    systemClockOffset?: number;
    signingRegion?: string;
    signerConstructor?: new (options: import("@smithy/signature-v4").SignatureV4Init & import("@smithy/signature-v4").SignatureV4CryptoInit) => import("@aws-sdk/types").RequestSigner;
};
