'use strict';

var middlewareHostHeader = require('@aws-sdk/middleware-host-header');
var middlewareLogger = require('@aws-sdk/middleware-logger');
var middlewareRecursionDetection = require('@aws-sdk/middleware-recursion-detection');
var middlewareUserAgent = require('@aws-sdk/middleware-user-agent');
var configResolver = require('@smithy/config-resolver');
var core = require('@smithy/core');
var schema = require('@smithy/core/schema');
var middlewareContentLength = require('@smithy/middleware-content-length');
var middlewareEndpoint = require('@smithy/middleware-endpoint');
var middlewareRetry = require('@smithy/middleware-retry');
var smithyClient = require('@smithy/smithy-client');
var httpAuthSchemeProvider = require('./auth/httpAuthSchemeProvider');
var runtimeConfig = require('./runtimeConfig');
var regionConfigResolver = require('@aws-sdk/region-config-resolver');
var protocolHttp = require('@smithy/protocol-http');
var schemas_0 = require('./schemas/schemas_0');
var utilWaiter = require('@smithy/util-waiter');
var errors = require('./models/errors');
var SESServiceException = require('./models/SESServiceException');

const resolveClientEndpointParameters = (options) => {
    return Object.assign(options, {
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "ses",
    });
};
const commonParams = {
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
};

const getHttpAuthExtensionConfiguration = (runtimeConfig) => {
    const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
    let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
    let _credentials = runtimeConfig.credentials;
    return {
        setHttpAuthScheme(httpAuthScheme) {
            const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
            if (index === -1) {
                _httpAuthSchemes.push(httpAuthScheme);
            }
            else {
                _httpAuthSchemes.splice(index, 1, httpAuthScheme);
            }
        },
        httpAuthSchemes() {
            return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
            _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
            return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
            _credentials = credentials;
        },
        credentials() {
            return _credentials;
        },
    };
};
const resolveHttpAuthRuntimeConfig = (config) => {
    return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials(),
    };
};

const resolveRuntimeExtensions = (runtimeConfig, extensions) => {
    const extensionConfiguration = Object.assign(regionConfigResolver.getAwsRegionExtensionConfiguration(runtimeConfig), smithyClient.getDefaultExtensionConfiguration(runtimeConfig), protocolHttp.getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
    extensions.forEach((extension) => extension.configure(extensionConfiguration));
    return Object.assign(runtimeConfig, regionConfigResolver.resolveAwsRegionExtensionConfiguration(extensionConfiguration), smithyClient.resolveDefaultRuntimeConfig(extensionConfiguration), protocolHttp.resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};

class SESClient extends smithyClient.Client {
    config;
    constructor(...[configuration]) {
        const _config_0 = runtimeConfig.getRuntimeConfig(configuration || {});
        super(_config_0);
        this.initConfig = _config_0;
        const _config_1 = resolveClientEndpointParameters(_config_0);
        const _config_2 = middlewareUserAgent.resolveUserAgentConfig(_config_1);
        const _config_3 = middlewareRetry.resolveRetryConfig(_config_2);
        const _config_4 = configResolver.resolveRegionConfig(_config_3);
        const _config_5 = middlewareHostHeader.resolveHostHeaderConfig(_config_4);
        const _config_6 = middlewareEndpoint.resolveEndpointConfig(_config_5);
        const _config_7 = httpAuthSchemeProvider.resolveHttpAuthSchemeConfig(_config_6);
        const _config_8 = resolveRuntimeExtensions(_config_7, configuration?.extensions || []);
        this.config = _config_8;
        this.middlewareStack.use(schema.getSchemaSerdePlugin(this.config));
        this.middlewareStack.use(middlewareUserAgent.getUserAgentPlugin(this.config));
        this.middlewareStack.use(middlewareRetry.getRetryPlugin(this.config));
        this.middlewareStack.use(middlewareContentLength.getContentLengthPlugin(this.config));
        this.middlewareStack.use(middlewareHostHeader.getHostHeaderPlugin(this.config));
        this.middlewareStack.use(middlewareLogger.getLoggerPlugin(this.config));
        this.middlewareStack.use(middlewareRecursionDetection.getRecursionDetectionPlugin(this.config));
        this.middlewareStack.use(core.getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
            httpAuthSchemeParametersProvider: httpAuthSchemeProvider.defaultSESHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new core.DefaultIdentityProviderConfig({
                "aws.auth#sigv4": config.credentials,
            }),
        }));
        this.middlewareStack.use(core.getHttpSigningPlugin(this.config));
    }
    destroy() {
        super.destroy();
    }
}

class CloneReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CloneReceiptRuleSet", {})
    .n("SESClient", "CloneReceiptRuleSetCommand")
    .sc(schemas_0.CloneReceiptRuleSet$)
    .build() {
}

class CreateConfigurationSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateConfigurationSet", {})
    .n("SESClient", "CreateConfigurationSetCommand")
    .sc(schemas_0.CreateConfigurationSet$)
    .build() {
}

class CreateConfigurationSetEventDestinationCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateConfigurationSetEventDestination", {})
    .n("SESClient", "CreateConfigurationSetEventDestinationCommand")
    .sc(schemas_0.CreateConfigurationSetEventDestination$)
    .build() {
}

class CreateConfigurationSetTrackingOptionsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateConfigurationSetTrackingOptions", {})
    .n("SESClient", "CreateConfigurationSetTrackingOptionsCommand")
    .sc(schemas_0.CreateConfigurationSetTrackingOptions$)
    .build() {
}

class CreateCustomVerificationEmailTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateCustomVerificationEmailTemplate", {})
    .n("SESClient", "CreateCustomVerificationEmailTemplateCommand")
    .sc(schemas_0.CreateCustomVerificationEmailTemplate$)
    .build() {
}

class CreateReceiptFilterCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateReceiptFilter", {})
    .n("SESClient", "CreateReceiptFilterCommand")
    .sc(schemas_0.CreateReceiptFilter$)
    .build() {
}

class CreateReceiptRuleCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateReceiptRule", {})
    .n("SESClient", "CreateReceiptRuleCommand")
    .sc(schemas_0.CreateReceiptRule$)
    .build() {
}

class CreateReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateReceiptRuleSet", {})
    .n("SESClient", "CreateReceiptRuleSetCommand")
    .sc(schemas_0.CreateReceiptRuleSet$)
    .build() {
}

class CreateTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateTemplate", {})
    .n("SESClient", "CreateTemplateCommand")
    .sc(schemas_0.CreateTemplate$)
    .build() {
}

class DeleteConfigurationSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteConfigurationSet", {})
    .n("SESClient", "DeleteConfigurationSetCommand")
    .sc(schemas_0.DeleteConfigurationSet$)
    .build() {
}

class DeleteConfigurationSetEventDestinationCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteConfigurationSetEventDestination", {})
    .n("SESClient", "DeleteConfigurationSetEventDestinationCommand")
    .sc(schemas_0.DeleteConfigurationSetEventDestination$)
    .build() {
}

class DeleteConfigurationSetTrackingOptionsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteConfigurationSetTrackingOptions", {})
    .n("SESClient", "DeleteConfigurationSetTrackingOptionsCommand")
    .sc(schemas_0.DeleteConfigurationSetTrackingOptions$)
    .build() {
}

class DeleteCustomVerificationEmailTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteCustomVerificationEmailTemplate", {})
    .n("SESClient", "DeleteCustomVerificationEmailTemplateCommand")
    .sc(schemas_0.DeleteCustomVerificationEmailTemplate$)
    .build() {
}

class DeleteIdentityCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteIdentity", {})
    .n("SESClient", "DeleteIdentityCommand")
    .sc(schemas_0.DeleteIdentity$)
    .build() {
}

class DeleteIdentityPolicyCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteIdentityPolicy", {})
    .n("SESClient", "DeleteIdentityPolicyCommand")
    .sc(schemas_0.DeleteIdentityPolicy$)
    .build() {
}

class DeleteReceiptFilterCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteReceiptFilter", {})
    .n("SESClient", "DeleteReceiptFilterCommand")
    .sc(schemas_0.DeleteReceiptFilter$)
    .build() {
}

class DeleteReceiptRuleCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteReceiptRule", {})
    .n("SESClient", "DeleteReceiptRuleCommand")
    .sc(schemas_0.DeleteReceiptRule$)
    .build() {
}

class DeleteReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteReceiptRuleSet", {})
    .n("SESClient", "DeleteReceiptRuleSetCommand")
    .sc(schemas_0.DeleteReceiptRuleSet$)
    .build() {
}

class DeleteTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteTemplate", {})
    .n("SESClient", "DeleteTemplateCommand")
    .sc(schemas_0.DeleteTemplate$)
    .build() {
}

class DeleteVerifiedEmailAddressCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteVerifiedEmailAddress", {})
    .n("SESClient", "DeleteVerifiedEmailAddressCommand")
    .sc(schemas_0.DeleteVerifiedEmailAddress$)
    .build() {
}

class DescribeActiveReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DescribeActiveReceiptRuleSet", {})
    .n("SESClient", "DescribeActiveReceiptRuleSetCommand")
    .sc(schemas_0.DescribeActiveReceiptRuleSet$)
    .build() {
}

class DescribeConfigurationSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DescribeConfigurationSet", {})
    .n("SESClient", "DescribeConfigurationSetCommand")
    .sc(schemas_0.DescribeConfigurationSet$)
    .build() {
}

class DescribeReceiptRuleCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DescribeReceiptRule", {})
    .n("SESClient", "DescribeReceiptRuleCommand")
    .sc(schemas_0.DescribeReceiptRule$)
    .build() {
}

class DescribeReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DescribeReceiptRuleSet", {})
    .n("SESClient", "DescribeReceiptRuleSetCommand")
    .sc(schemas_0.DescribeReceiptRuleSet$)
    .build() {
}

class GetAccountSendingEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetAccountSendingEnabled", {})
    .n("SESClient", "GetAccountSendingEnabledCommand")
    .sc(schemas_0.GetAccountSendingEnabled$)
    .build() {
}

class GetCustomVerificationEmailTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetCustomVerificationEmailTemplate", {})
    .n("SESClient", "GetCustomVerificationEmailTemplateCommand")
    .sc(schemas_0.GetCustomVerificationEmailTemplate$)
    .build() {
}

class GetIdentityDkimAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityDkimAttributes", {})
    .n("SESClient", "GetIdentityDkimAttributesCommand")
    .sc(schemas_0.GetIdentityDkimAttributes$)
    .build() {
}

class GetIdentityMailFromDomainAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityMailFromDomainAttributes", {})
    .n("SESClient", "GetIdentityMailFromDomainAttributesCommand")
    .sc(schemas_0.GetIdentityMailFromDomainAttributes$)
    .build() {
}

class GetIdentityNotificationAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityNotificationAttributes", {})
    .n("SESClient", "GetIdentityNotificationAttributesCommand")
    .sc(schemas_0.GetIdentityNotificationAttributes$)
    .build() {
}

class GetIdentityPoliciesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityPolicies", {})
    .n("SESClient", "GetIdentityPoliciesCommand")
    .sc(schemas_0.GetIdentityPolicies$)
    .build() {
}

class GetIdentityVerificationAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityVerificationAttributes", {})
    .n("SESClient", "GetIdentityVerificationAttributesCommand")
    .sc(schemas_0.GetIdentityVerificationAttributes$)
    .build() {
}

class GetSendQuotaCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetSendQuota", {})
    .n("SESClient", "GetSendQuotaCommand")
    .sc(schemas_0.GetSendQuota$)
    .build() {
}

class GetSendStatisticsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetSendStatistics", {})
    .n("SESClient", "GetSendStatisticsCommand")
    .sc(schemas_0.GetSendStatistics$)
    .build() {
}

class GetTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetTemplate", {})
    .n("SESClient", "GetTemplateCommand")
    .sc(schemas_0.GetTemplate$)
    .build() {
}

class ListConfigurationSetsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListConfigurationSets", {})
    .n("SESClient", "ListConfigurationSetsCommand")
    .sc(schemas_0.ListConfigurationSets$)
    .build() {
}

class ListCustomVerificationEmailTemplatesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListCustomVerificationEmailTemplates", {})
    .n("SESClient", "ListCustomVerificationEmailTemplatesCommand")
    .sc(schemas_0.ListCustomVerificationEmailTemplates$)
    .build() {
}

class ListIdentitiesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListIdentities", {})
    .n("SESClient", "ListIdentitiesCommand")
    .sc(schemas_0.ListIdentities$)
    .build() {
}

class ListIdentityPoliciesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListIdentityPolicies", {})
    .n("SESClient", "ListIdentityPoliciesCommand")
    .sc(schemas_0.ListIdentityPolicies$)
    .build() {
}

class ListReceiptFiltersCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListReceiptFilters", {})
    .n("SESClient", "ListReceiptFiltersCommand")
    .sc(schemas_0.ListReceiptFilters$)
    .build() {
}

class ListReceiptRuleSetsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListReceiptRuleSets", {})
    .n("SESClient", "ListReceiptRuleSetsCommand")
    .sc(schemas_0.ListReceiptRuleSets$)
    .build() {
}

class ListTemplatesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListTemplates", {})
    .n("SESClient", "ListTemplatesCommand")
    .sc(schemas_0.ListTemplates$)
    .build() {
}

class ListVerifiedEmailAddressesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListVerifiedEmailAddresses", {})
    .n("SESClient", "ListVerifiedEmailAddressesCommand")
    .sc(schemas_0.ListVerifiedEmailAddresses$)
    .build() {
}

class PutConfigurationSetDeliveryOptionsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "PutConfigurationSetDeliveryOptions", {})
    .n("SESClient", "PutConfigurationSetDeliveryOptionsCommand")
    .sc(schemas_0.PutConfigurationSetDeliveryOptions$)
    .build() {
}

class PutIdentityPolicyCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "PutIdentityPolicy", {})
    .n("SESClient", "PutIdentityPolicyCommand")
    .sc(schemas_0.PutIdentityPolicy$)
    .build() {
}

class ReorderReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ReorderReceiptRuleSet", {})
    .n("SESClient", "ReorderReceiptRuleSetCommand")
    .sc(schemas_0.ReorderReceiptRuleSet$)
    .build() {
}

class SendBounceCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendBounce", {})
    .n("SESClient", "SendBounceCommand")
    .sc(schemas_0.SendBounce$)
    .build() {
}

class SendBulkTemplatedEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendBulkTemplatedEmail", {})
    .n("SESClient", "SendBulkTemplatedEmailCommand")
    .sc(schemas_0.SendBulkTemplatedEmail$)
    .build() {
}

class SendCustomVerificationEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendCustomVerificationEmail", {})
    .n("SESClient", "SendCustomVerificationEmailCommand")
    .sc(schemas_0.SendCustomVerificationEmail$)
    .build() {
}

class SendEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendEmail", {})
    .n("SESClient", "SendEmailCommand")
    .sc(schemas_0.SendEmail$)
    .build() {
}

class SendRawEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendRawEmail", {})
    .n("SESClient", "SendRawEmailCommand")
    .sc(schemas_0.SendRawEmail$)
    .build() {
}

class SendTemplatedEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendTemplatedEmail", {})
    .n("SESClient", "SendTemplatedEmailCommand")
    .sc(schemas_0.SendTemplatedEmail$)
    .build() {
}

class SetActiveReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetActiveReceiptRuleSet", {})
    .n("SESClient", "SetActiveReceiptRuleSetCommand")
    .sc(schemas_0.SetActiveReceiptRuleSet$)
    .build() {
}

class SetIdentityDkimEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityDkimEnabled", {})
    .n("SESClient", "SetIdentityDkimEnabledCommand")
    .sc(schemas_0.SetIdentityDkimEnabled$)
    .build() {
}

class SetIdentityFeedbackForwardingEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityFeedbackForwardingEnabled", {})
    .n("SESClient", "SetIdentityFeedbackForwardingEnabledCommand")
    .sc(schemas_0.SetIdentityFeedbackForwardingEnabled$)
    .build() {
}

class SetIdentityHeadersInNotificationsEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityHeadersInNotificationsEnabled", {})
    .n("SESClient", "SetIdentityHeadersInNotificationsEnabledCommand")
    .sc(schemas_0.SetIdentityHeadersInNotificationsEnabled$)
    .build() {
}

class SetIdentityMailFromDomainCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityMailFromDomain", {})
    .n("SESClient", "SetIdentityMailFromDomainCommand")
    .sc(schemas_0.SetIdentityMailFromDomain$)
    .build() {
}

class SetIdentityNotificationTopicCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityNotificationTopic", {})
    .n("SESClient", "SetIdentityNotificationTopicCommand")
    .sc(schemas_0.SetIdentityNotificationTopic$)
    .build() {
}

class SetReceiptRulePositionCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetReceiptRulePosition", {})
    .n("SESClient", "SetReceiptRulePositionCommand")
    .sc(schemas_0.SetReceiptRulePosition$)
    .build() {
}

class TestRenderTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "TestRenderTemplate", {})
    .n("SESClient", "TestRenderTemplateCommand")
    .sc(schemas_0.TestRenderTemplate$)
    .build() {
}

class UpdateAccountSendingEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateAccountSendingEnabled", {})
    .n("SESClient", "UpdateAccountSendingEnabledCommand")
    .sc(schemas_0.UpdateAccountSendingEnabled$)
    .build() {
}

class UpdateConfigurationSetEventDestinationCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateConfigurationSetEventDestination", {})
    .n("SESClient", "UpdateConfigurationSetEventDestinationCommand")
    .sc(schemas_0.UpdateConfigurationSetEventDestination$)
    .build() {
}

class UpdateConfigurationSetReputationMetricsEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateConfigurationSetReputationMetricsEnabled", {})
    .n("SESClient", "UpdateConfigurationSetReputationMetricsEnabledCommand")
    .sc(schemas_0.UpdateConfigurationSetReputationMetricsEnabled$)
    .build() {
}

class UpdateConfigurationSetSendingEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateConfigurationSetSendingEnabled", {})
    .n("SESClient", "UpdateConfigurationSetSendingEnabledCommand")
    .sc(schemas_0.UpdateConfigurationSetSendingEnabled$)
    .build() {
}

class UpdateConfigurationSetTrackingOptionsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateConfigurationSetTrackingOptions", {})
    .n("SESClient", "UpdateConfigurationSetTrackingOptionsCommand")
    .sc(schemas_0.UpdateConfigurationSetTrackingOptions$)
    .build() {
}

class UpdateCustomVerificationEmailTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateCustomVerificationEmailTemplate", {})
    .n("SESClient", "UpdateCustomVerificationEmailTemplateCommand")
    .sc(schemas_0.UpdateCustomVerificationEmailTemplate$)
    .build() {
}

class UpdateReceiptRuleCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateReceiptRule", {})
    .n("SESClient", "UpdateReceiptRuleCommand")
    .sc(schemas_0.UpdateReceiptRule$)
    .build() {
}

class UpdateTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateTemplate", {})
    .n("SESClient", "UpdateTemplateCommand")
    .sc(schemas_0.UpdateTemplate$)
    .build() {
}

class VerifyDomainDkimCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "VerifyDomainDkim", {})
    .n("SESClient", "VerifyDomainDkimCommand")
    .sc(schemas_0.VerifyDomainDkim$)
    .build() {
}

class VerifyDomainIdentityCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "VerifyDomainIdentity", {})
    .n("SESClient", "VerifyDomainIdentityCommand")
    .sc(schemas_0.VerifyDomainIdentity$)
    .build() {
}

class VerifyEmailAddressCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "VerifyEmailAddress", {})
    .n("SESClient", "VerifyEmailAddressCommand")
    .sc(schemas_0.VerifyEmailAddress$)
    .build() {
}

class VerifyEmailIdentityCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "VerifyEmailIdentity", {})
    .n("SESClient", "VerifyEmailIdentityCommand")
    .sc(schemas_0.VerifyEmailIdentity$)
    .build() {
}

const paginateListCustomVerificationEmailTemplates = core.createPaginator(SESClient, ListCustomVerificationEmailTemplatesCommand, "NextToken", "NextToken", "MaxResults");

const paginateListIdentities = core.createPaginator(SESClient, ListIdentitiesCommand, "NextToken", "NextToken", "MaxItems");

const checkState = async (client, input) => {
    let reason;
    try {
        let result = await client.send(new GetIdentityVerificationAttributesCommand(input));
        reason = result;
        try {
            const returnComparator = () => {
                let objectProjection_2 = Object.values(result.VerificationAttributes).map((element_1) => {
                    return element_1.VerificationStatus;
                });
                return objectProjection_2;
            };
            let allStringEq_4 = (returnComparator().length > 0);
            for (let element_3 of returnComparator()) {
                allStringEq_4 = allStringEq_4 && (element_3 == "Success");
            }
            if (allStringEq_4) {
                return { state: utilWaiter.WaiterState.SUCCESS, reason };
            }
        }
        catch (e) { }
    }
    catch (exception) {
        reason = exception;
    }
    return { state: utilWaiter.WaiterState.RETRY, reason };
};
const waitForIdentityExists = async (params, input) => {
    const serviceDefaults = { minDelay: 3, maxDelay: 120 };
    return utilWaiter.createWaiter({ ...serviceDefaults, ...params }, input, checkState);
};
const waitUntilIdentityExists = async (params, input) => {
    const serviceDefaults = { minDelay: 3, maxDelay: 120 };
    const result = await utilWaiter.createWaiter({ ...serviceDefaults, ...params }, input, checkState);
    return utilWaiter.checkExceptions(result);
};

const commands = {
    CloneReceiptRuleSetCommand,
    CreateConfigurationSetCommand,
    CreateConfigurationSetEventDestinationCommand,
    CreateConfigurationSetTrackingOptionsCommand,
    CreateCustomVerificationEmailTemplateCommand,
    CreateReceiptFilterCommand,
    CreateReceiptRuleCommand,
    CreateReceiptRuleSetCommand,
    CreateTemplateCommand,
    DeleteConfigurationSetCommand,
    DeleteConfigurationSetEventDestinationCommand,
    DeleteConfigurationSetTrackingOptionsCommand,
    DeleteCustomVerificationEmailTemplateCommand,
    DeleteIdentityCommand,
    DeleteIdentityPolicyCommand,
    DeleteReceiptFilterCommand,
    DeleteReceiptRuleCommand,
    DeleteReceiptRuleSetCommand,
    DeleteTemplateCommand,
    DeleteVerifiedEmailAddressCommand,
    DescribeActiveReceiptRuleSetCommand,
    DescribeConfigurationSetCommand,
    DescribeReceiptRuleCommand,
    DescribeReceiptRuleSetCommand,
    GetAccountSendingEnabledCommand,
    GetCustomVerificationEmailTemplateCommand,
    GetIdentityDkimAttributesCommand,
    GetIdentityMailFromDomainAttributesCommand,
    GetIdentityNotificationAttributesCommand,
    GetIdentityPoliciesCommand,
    GetIdentityVerificationAttributesCommand,
    GetSendQuotaCommand,
    GetSendStatisticsCommand,
    GetTemplateCommand,
    ListConfigurationSetsCommand,
    ListCustomVerificationEmailTemplatesCommand,
    ListIdentitiesCommand,
    ListIdentityPoliciesCommand,
    ListReceiptFiltersCommand,
    ListReceiptRuleSetsCommand,
    ListTemplatesCommand,
    ListVerifiedEmailAddressesCommand,
    PutConfigurationSetDeliveryOptionsCommand,
    PutIdentityPolicyCommand,
    ReorderReceiptRuleSetCommand,
    SendBounceCommand,
    SendBulkTemplatedEmailCommand,
    SendCustomVerificationEmailCommand,
    SendEmailCommand,
    SendRawEmailCommand,
    SendTemplatedEmailCommand,
    SetActiveReceiptRuleSetCommand,
    SetIdentityDkimEnabledCommand,
    SetIdentityFeedbackForwardingEnabledCommand,
    SetIdentityHeadersInNotificationsEnabledCommand,
    SetIdentityMailFromDomainCommand,
    SetIdentityNotificationTopicCommand,
    SetReceiptRulePositionCommand,
    TestRenderTemplateCommand,
    UpdateAccountSendingEnabledCommand,
    UpdateConfigurationSetEventDestinationCommand,
    UpdateConfigurationSetReputationMetricsEnabledCommand,
    UpdateConfigurationSetSendingEnabledCommand,
    UpdateConfigurationSetTrackingOptionsCommand,
    UpdateCustomVerificationEmailTemplateCommand,
    UpdateReceiptRuleCommand,
    UpdateTemplateCommand,
    VerifyDomainDkimCommand,
    VerifyDomainIdentityCommand,
    VerifyEmailAddressCommand,
    VerifyEmailIdentityCommand,
};
const paginators = {
    paginateListCustomVerificationEmailTemplates,
    paginateListIdentities,
};
const waiters = {
    waitUntilIdentityExists,
};
class SES extends SESClient {
}
smithyClient.createAggregatedClient(commands, SES, { paginators, waiters });

const BehaviorOnMXFailure = {
    RejectMessage: "RejectMessage",
    UseDefaultValue: "UseDefaultValue",
};
const BounceType = {
    ContentRejected: "ContentRejected",
    DoesNotExist: "DoesNotExist",
    ExceededQuota: "ExceededQuota",
    MessageTooLarge: "MessageTooLarge",
    TemporaryFailure: "TemporaryFailure",
    Undefined: "Undefined",
};
const DsnAction = {
    DELAYED: "delayed",
    DELIVERED: "delivered",
    EXPANDED: "expanded",
    FAILED: "failed",
    RELAYED: "relayed",
};
const BulkEmailStatus = {
    AccountDailyQuotaExceeded: "AccountDailyQuotaExceeded",
    AccountSendingPaused: "AccountSendingPaused",
    AccountSuspended: "AccountSuspended",
    AccountThrottled: "AccountThrottled",
    ConfigurationSetDoesNotExist: "ConfigurationSetDoesNotExist",
    ConfigurationSetSendingPaused: "ConfigurationSetSendingPaused",
    Failed: "Failed",
    InvalidParameterValue: "InvalidParameterValue",
    InvalidSendingPoolName: "InvalidSendingPoolName",
    MailFromDomainNotVerified: "MailFromDomainNotVerified",
    MessageRejected: "MessageRejected",
    Success: "Success",
    TemplateDoesNotExist: "TemplateDoesNotExist",
    TransientFailure: "TransientFailure",
};
const DimensionValueSource = {
    EMAIL_HEADER: "emailHeader",
    LINK_TAG: "linkTag",
    MESSAGE_TAG: "messageTag",
};
const ConfigurationSetAttribute = {
    DELIVERY_OPTIONS: "deliveryOptions",
    EVENT_DESTINATIONS: "eventDestinations",
    REPUTATION_OPTIONS: "reputationOptions",
    TRACKING_OPTIONS: "trackingOptions",
};
const EventType = {
    BOUNCE: "bounce",
    CLICK: "click",
    COMPLAINT: "complaint",
    DELIVERY: "delivery",
    OPEN: "open",
    REJECT: "reject",
    RENDERING_FAILURE: "renderingFailure",
    SEND: "send",
};
const ReceiptFilterPolicy = {
    Allow: "Allow",
    Block: "Block",
};
const InvocationType = {
    Event: "Event",
    RequestResponse: "RequestResponse",
};
const SNSActionEncoding = {
    Base64: "Base64",
    UTF8: "UTF-8",
};
const StopScope = {
    RULE_SET: "RuleSet",
};
const TlsPolicy = {
    Optional: "Optional",
    Require: "Require",
};
const CustomMailFromStatus = {
    Failed: "Failed",
    Pending: "Pending",
    Success: "Success",
    TemporaryFailure: "TemporaryFailure",
};
const VerificationStatus = {
    Failed: "Failed",
    NotStarted: "NotStarted",
    Pending: "Pending",
    Success: "Success",
    TemporaryFailure: "TemporaryFailure",
};
const IdentityType = {
    Domain: "Domain",
    EmailAddress: "EmailAddress",
};
const NotificationType = {
    Bounce: "Bounce",
    Complaint: "Complaint",
    Delivery: "Delivery",
};

exports.$Command = smithyClient.Command;
exports.__Client = smithyClient.Client;
exports.SESServiceException = SESServiceException.SESServiceException;
exports.BehaviorOnMXFailure = BehaviorOnMXFailure;
exports.BounceType = BounceType;
exports.BulkEmailStatus = BulkEmailStatus;
exports.CloneReceiptRuleSetCommand = CloneReceiptRuleSetCommand;
exports.ConfigurationSetAttribute = ConfigurationSetAttribute;
exports.CreateConfigurationSetCommand = CreateConfigurationSetCommand;
exports.CreateConfigurationSetEventDestinationCommand = CreateConfigurationSetEventDestinationCommand;
exports.CreateConfigurationSetTrackingOptionsCommand = CreateConfigurationSetTrackingOptionsCommand;
exports.CreateCustomVerificationEmailTemplateCommand = CreateCustomVerificationEmailTemplateCommand;
exports.CreateReceiptFilterCommand = CreateReceiptFilterCommand;
exports.CreateReceiptRuleCommand = CreateReceiptRuleCommand;
exports.CreateReceiptRuleSetCommand = CreateReceiptRuleSetCommand;
exports.CreateTemplateCommand = CreateTemplateCommand;
exports.CustomMailFromStatus = CustomMailFromStatus;
exports.DeleteConfigurationSetCommand = DeleteConfigurationSetCommand;
exports.DeleteConfigurationSetEventDestinationCommand = DeleteConfigurationSetEventDestinationCommand;
exports.DeleteConfigurationSetTrackingOptionsCommand = DeleteConfigurationSetTrackingOptionsCommand;
exports.DeleteCustomVerificationEmailTemplateCommand = DeleteCustomVerificationEmailTemplateCommand;
exports.DeleteIdentityCommand = DeleteIdentityCommand;
exports.DeleteIdentityPolicyCommand = DeleteIdentityPolicyCommand;
exports.DeleteReceiptFilterCommand = DeleteReceiptFilterCommand;
exports.DeleteReceiptRuleCommand = DeleteReceiptRuleCommand;
exports.DeleteReceiptRuleSetCommand = DeleteReceiptRuleSetCommand;
exports.DeleteTemplateCommand = DeleteTemplateCommand;
exports.DeleteVerifiedEmailAddressCommand = DeleteVerifiedEmailAddressCommand;
exports.DescribeActiveReceiptRuleSetCommand = DescribeActiveReceiptRuleSetCommand;
exports.DescribeConfigurationSetCommand = DescribeConfigurationSetCommand;
exports.DescribeReceiptRuleCommand = DescribeReceiptRuleCommand;
exports.DescribeReceiptRuleSetCommand = DescribeReceiptRuleSetCommand;
exports.DimensionValueSource = DimensionValueSource;
exports.DsnAction = DsnAction;
exports.EventType = EventType;
exports.GetAccountSendingEnabledCommand = GetAccountSendingEnabledCommand;
exports.GetCustomVerificationEmailTemplateCommand = GetCustomVerificationEmailTemplateCommand;
exports.GetIdentityDkimAttributesCommand = GetIdentityDkimAttributesCommand;
exports.GetIdentityMailFromDomainAttributesCommand = GetIdentityMailFromDomainAttributesCommand;
exports.GetIdentityNotificationAttributesCommand = GetIdentityNotificationAttributesCommand;
exports.GetIdentityPoliciesCommand = GetIdentityPoliciesCommand;
exports.GetIdentityVerificationAttributesCommand = GetIdentityVerificationAttributesCommand;
exports.GetSendQuotaCommand = GetSendQuotaCommand;
exports.GetSendStatisticsCommand = GetSendStatisticsCommand;
exports.GetTemplateCommand = GetTemplateCommand;
exports.IdentityType = IdentityType;
exports.InvocationType = InvocationType;
exports.ListConfigurationSetsCommand = ListConfigurationSetsCommand;
exports.ListCustomVerificationEmailTemplatesCommand = ListCustomVerificationEmailTemplatesCommand;
exports.ListIdentitiesCommand = ListIdentitiesCommand;
exports.ListIdentityPoliciesCommand = ListIdentityPoliciesCommand;
exports.ListReceiptFiltersCommand = ListReceiptFiltersCommand;
exports.ListReceiptRuleSetsCommand = ListReceiptRuleSetsCommand;
exports.ListTemplatesCommand = ListTemplatesCommand;
exports.ListVerifiedEmailAddressesCommand = ListVerifiedEmailAddressesCommand;
exports.NotificationType = NotificationType;
exports.PutConfigurationSetDeliveryOptionsCommand = PutConfigurationSetDeliveryOptionsCommand;
exports.PutIdentityPolicyCommand = PutIdentityPolicyCommand;
exports.ReceiptFilterPolicy = ReceiptFilterPolicy;
exports.ReorderReceiptRuleSetCommand = ReorderReceiptRuleSetCommand;
exports.SES = SES;
exports.SESClient = SESClient;
exports.SNSActionEncoding = SNSActionEncoding;
exports.SendBounceCommand = SendBounceCommand;
exports.SendBulkTemplatedEmailCommand = SendBulkTemplatedEmailCommand;
exports.SendCustomVerificationEmailCommand = SendCustomVerificationEmailCommand;
exports.SendEmailCommand = SendEmailCommand;
exports.SendRawEmailCommand = SendRawEmailCommand;
exports.SendTemplatedEmailCommand = SendTemplatedEmailCommand;
exports.SetActiveReceiptRuleSetCommand = SetActiveReceiptRuleSetCommand;
exports.SetIdentityDkimEnabledCommand = SetIdentityDkimEnabledCommand;
exports.SetIdentityFeedbackForwardingEnabledCommand = SetIdentityFeedbackForwardingEnabledCommand;
exports.SetIdentityHeadersInNotificationsEnabledCommand = SetIdentityHeadersInNotificationsEnabledCommand;
exports.SetIdentityMailFromDomainCommand = SetIdentityMailFromDomainCommand;
exports.SetIdentityNotificationTopicCommand = SetIdentityNotificationTopicCommand;
exports.SetReceiptRulePositionCommand = SetReceiptRulePositionCommand;
exports.StopScope = StopScope;
exports.TestRenderTemplateCommand = TestRenderTemplateCommand;
exports.TlsPolicy = TlsPolicy;
exports.UpdateAccountSendingEnabledCommand = UpdateAccountSendingEnabledCommand;
exports.UpdateConfigurationSetEventDestinationCommand = UpdateConfigurationSetEventDestinationCommand;
exports.UpdateConfigurationSetReputationMetricsEnabledCommand = UpdateConfigurationSetReputationMetricsEnabledCommand;
exports.UpdateConfigurationSetSendingEnabledCommand = UpdateConfigurationSetSendingEnabledCommand;
exports.UpdateConfigurationSetTrackingOptionsCommand = UpdateConfigurationSetTrackingOptionsCommand;
exports.UpdateCustomVerificationEmailTemplateCommand = UpdateCustomVerificationEmailTemplateCommand;
exports.UpdateReceiptRuleCommand = UpdateReceiptRuleCommand;
exports.UpdateTemplateCommand = UpdateTemplateCommand;
exports.VerificationStatus = VerificationStatus;
exports.VerifyDomainDkimCommand = VerifyDomainDkimCommand;
exports.VerifyDomainIdentityCommand = VerifyDomainIdentityCommand;
exports.VerifyEmailAddressCommand = VerifyEmailAddressCommand;
exports.VerifyEmailIdentityCommand = VerifyEmailIdentityCommand;
exports.paginateListCustomVerificationEmailTemplates = paginateListCustomVerificationEmailTemplates;
exports.paginateListIdentities = paginateListIdentities;
exports.waitForIdentityExists = waitForIdentityExists;
exports.waitUntilIdentityExists = waitUntilIdentityExists;
Object.prototype.hasOwnProperty.call(schemas_0, '__proto__') &&
    !Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
    Object.defineProperty(exports, '__proto__', {
        enumerable: true,
        value: schemas_0['__proto__']
    });

Object.keys(schemas_0).forEach(function (k) {
    if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = schemas_0[k];
});
Object.prototype.hasOwnProperty.call(errors, '__proto__') &&
    !Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
    Object.defineProperty(exports, '__proto__', {
        enumerable: true,
        value: errors['__proto__']
    });

Object.keys(errors).forEach(function (k) {
    if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = errors[k];
});
