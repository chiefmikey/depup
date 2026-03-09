'use strict';

var middlewareHostHeader = require('@aws-sdk/middleware-host-header');
var middlewareLogger = require('@aws-sdk/middleware-logger');
var middlewareRecursionDetection = require('@aws-sdk/middleware-recursion-detection');
var middlewareSdkSqs = require('@aws-sdk/middleware-sdk-sqs');
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
var errors = require('./models/errors');
var SQSServiceException = require('./models/SQSServiceException');

const resolveClientEndpointParameters = (options) => {
    return Object.assign(options, {
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "sqs",
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

class SQSClient extends smithyClient.Client {
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
        const _config_7 = middlewareSdkSqs.resolveQueueUrlConfig(_config_6);
        const _config_8 = httpAuthSchemeProvider.resolveHttpAuthSchemeConfig(_config_7);
        const _config_9 = resolveRuntimeExtensions(_config_8, configuration?.extensions || []);
        this.config = _config_9;
        this.middlewareStack.use(schema.getSchemaSerdePlugin(this.config));
        this.middlewareStack.use(middlewareUserAgent.getUserAgentPlugin(this.config));
        this.middlewareStack.use(middlewareRetry.getRetryPlugin(this.config));
        this.middlewareStack.use(middlewareContentLength.getContentLengthPlugin(this.config));
        this.middlewareStack.use(middlewareHostHeader.getHostHeaderPlugin(this.config));
        this.middlewareStack.use(middlewareLogger.getLoggerPlugin(this.config));
        this.middlewareStack.use(middlewareRecursionDetection.getRecursionDetectionPlugin(this.config));
        this.middlewareStack.use(middlewareSdkSqs.getQueueUrlPlugin(this.config));
        this.middlewareStack.use(core.getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
            httpAuthSchemeParametersProvider: httpAuthSchemeProvider.defaultSQSHttpAuthSchemeParametersProvider,
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

class AddPermissionCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "AddPermission", {})
    .n("SQSClient", "AddPermissionCommand")
    .sc(schemas_0.AddPermission$)
    .build() {
}

class CancelMessageMoveTaskCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "CancelMessageMoveTask", {})
    .n("SQSClient", "CancelMessageMoveTaskCommand")
    .sc(schemas_0.CancelMessageMoveTask$)
    .build() {
}

class ChangeMessageVisibilityBatchCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "ChangeMessageVisibilityBatch", {})
    .n("SQSClient", "ChangeMessageVisibilityBatchCommand")
    .sc(schemas_0.ChangeMessageVisibilityBatch$)
    .build() {
}

class ChangeMessageVisibilityCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "ChangeMessageVisibility", {})
    .n("SQSClient", "ChangeMessageVisibilityCommand")
    .sc(schemas_0.ChangeMessageVisibility$)
    .build() {
}

class CreateQueueCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "CreateQueue", {})
    .n("SQSClient", "CreateQueueCommand")
    .sc(schemas_0.CreateQueue$)
    .build() {
}

class DeleteMessageBatchCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "DeleteMessageBatch", {})
    .n("SQSClient", "DeleteMessageBatchCommand")
    .sc(schemas_0.DeleteMessageBatch$)
    .build() {
}

class DeleteMessageCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "DeleteMessage", {})
    .n("SQSClient", "DeleteMessageCommand")
    .sc(schemas_0.DeleteMessage$)
    .build() {
}

class DeleteQueueCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "DeleteQueue", {})
    .n("SQSClient", "DeleteQueueCommand")
    .sc(schemas_0.DeleteQueue$)
    .build() {
}

class GetQueueAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "GetQueueAttributes", {})
    .n("SQSClient", "GetQueueAttributesCommand")
    .sc(schemas_0.GetQueueAttributes$)
    .build() {
}

class GetQueueUrlCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "GetQueueUrl", {})
    .n("SQSClient", "GetQueueUrlCommand")
    .sc(schemas_0.GetQueueUrl$)
    .build() {
}

class ListDeadLetterSourceQueuesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "ListDeadLetterSourceQueues", {})
    .n("SQSClient", "ListDeadLetterSourceQueuesCommand")
    .sc(schemas_0.ListDeadLetterSourceQueues$)
    .build() {
}

class ListMessageMoveTasksCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "ListMessageMoveTasks", {})
    .n("SQSClient", "ListMessageMoveTasksCommand")
    .sc(schemas_0.ListMessageMoveTasks$)
    .build() {
}

class ListQueuesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "ListQueues", {})
    .n("SQSClient", "ListQueuesCommand")
    .sc(schemas_0.ListQueues$)
    .build() {
}

class ListQueueTagsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "ListQueueTags", {})
    .n("SQSClient", "ListQueueTagsCommand")
    .sc(schemas_0.ListQueueTags$)
    .build() {
}

class PurgeQueueCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "PurgeQueue", {})
    .n("SQSClient", "PurgeQueueCommand")
    .sc(schemas_0.PurgeQueue$)
    .build() {
}

class ReceiveMessageCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [
        middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions()),
        middlewareSdkSqs.getReceiveMessagePlugin(config),
    ];
})
    .s("AmazonSQS", "ReceiveMessage", {})
    .n("SQSClient", "ReceiveMessageCommand")
    .sc(schemas_0.ReceiveMessage$)
    .build() {
}

class RemovePermissionCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "RemovePermission", {})
    .n("SQSClient", "RemovePermissionCommand")
    .sc(schemas_0.RemovePermission$)
    .build() {
}

class SendMessageBatchCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [
        middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions()),
        middlewareSdkSqs.getSendMessageBatchPlugin(config),
    ];
})
    .s("AmazonSQS", "SendMessageBatch", {})
    .n("SQSClient", "SendMessageBatchCommand")
    .sc(schemas_0.SendMessageBatch$)
    .build() {
}

class SendMessageCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [
        middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions()),
        middlewareSdkSqs.getSendMessagePlugin(config),
    ];
})
    .s("AmazonSQS", "SendMessage", {})
    .n("SQSClient", "SendMessageCommand")
    .sc(schemas_0.SendMessage$)
    .build() {
}

class SetQueueAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "SetQueueAttributes", {})
    .n("SQSClient", "SetQueueAttributesCommand")
    .sc(schemas_0.SetQueueAttributes$)
    .build() {
}

class StartMessageMoveTaskCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "StartMessageMoveTask", {})
    .n("SQSClient", "StartMessageMoveTaskCommand")
    .sc(schemas_0.StartMessageMoveTask$)
    .build() {
}

class TagQueueCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "TagQueue", {})
    .n("SQSClient", "TagQueueCommand")
    .sc(schemas_0.TagQueue$)
    .build() {
}

class UntagQueueCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonSQS", "UntagQueue", {})
    .n("SQSClient", "UntagQueueCommand")
    .sc(schemas_0.UntagQueue$)
    .build() {
}

const paginateListDeadLetterSourceQueues = core.createPaginator(SQSClient, ListDeadLetterSourceQueuesCommand, "NextToken", "NextToken", "MaxResults");

const paginateListQueues = core.createPaginator(SQSClient, ListQueuesCommand, "NextToken", "NextToken", "MaxResults");

const commands = {
    AddPermissionCommand,
    CancelMessageMoveTaskCommand,
    ChangeMessageVisibilityCommand,
    ChangeMessageVisibilityBatchCommand,
    CreateQueueCommand,
    DeleteMessageCommand,
    DeleteMessageBatchCommand,
    DeleteQueueCommand,
    GetQueueAttributesCommand,
    GetQueueUrlCommand,
    ListDeadLetterSourceQueuesCommand,
    ListMessageMoveTasksCommand,
    ListQueuesCommand,
    ListQueueTagsCommand,
    PurgeQueueCommand,
    ReceiveMessageCommand,
    RemovePermissionCommand,
    SendMessageCommand,
    SendMessageBatchCommand,
    SetQueueAttributesCommand,
    StartMessageMoveTaskCommand,
    TagQueueCommand,
    UntagQueueCommand,
};
const paginators = {
    paginateListDeadLetterSourceQueues,
    paginateListQueues,
};
class SQS extends SQSClient {
}
smithyClient.createAggregatedClient(commands, SQS, { paginators });

const QueueAttributeName = {
    All: "All",
    ApproximateNumberOfMessages: "ApproximateNumberOfMessages",
    ApproximateNumberOfMessagesDelayed: "ApproximateNumberOfMessagesDelayed",
    ApproximateNumberOfMessagesNotVisible: "ApproximateNumberOfMessagesNotVisible",
    ContentBasedDeduplication: "ContentBasedDeduplication",
    CreatedTimestamp: "CreatedTimestamp",
    DeduplicationScope: "DeduplicationScope",
    DelaySeconds: "DelaySeconds",
    FifoQueue: "FifoQueue",
    FifoThroughputLimit: "FifoThroughputLimit",
    KmsDataKeyReusePeriodSeconds: "KmsDataKeyReusePeriodSeconds",
    KmsMasterKeyId: "KmsMasterKeyId",
    LastModifiedTimestamp: "LastModifiedTimestamp",
    MaximumMessageSize: "MaximumMessageSize",
    MessageRetentionPeriod: "MessageRetentionPeriod",
    Policy: "Policy",
    QueueArn: "QueueArn",
    ReceiveMessageWaitTimeSeconds: "ReceiveMessageWaitTimeSeconds",
    RedriveAllowPolicy: "RedriveAllowPolicy",
    RedrivePolicy: "RedrivePolicy",
    SqsManagedSseEnabled: "SqsManagedSseEnabled",
    VisibilityTimeout: "VisibilityTimeout",
};
const MessageSystemAttributeName = {
    AWSTraceHeader: "AWSTraceHeader",
    All: "All",
    ApproximateFirstReceiveTimestamp: "ApproximateFirstReceiveTimestamp",
    ApproximateReceiveCount: "ApproximateReceiveCount",
    DeadLetterQueueSourceArn: "DeadLetterQueueSourceArn",
    MessageDeduplicationId: "MessageDeduplicationId",
    MessageGroupId: "MessageGroupId",
    SenderId: "SenderId",
    SentTimestamp: "SentTimestamp",
    SequenceNumber: "SequenceNumber",
};
const MessageSystemAttributeNameForSends = {
    AWSTraceHeader: "AWSTraceHeader",
};

exports.$Command = smithyClient.Command;
exports.__Client = smithyClient.Client;
exports.SQSServiceException = SQSServiceException.SQSServiceException;
exports.AddPermissionCommand = AddPermissionCommand;
exports.CancelMessageMoveTaskCommand = CancelMessageMoveTaskCommand;
exports.ChangeMessageVisibilityBatchCommand = ChangeMessageVisibilityBatchCommand;
exports.ChangeMessageVisibilityCommand = ChangeMessageVisibilityCommand;
exports.CreateQueueCommand = CreateQueueCommand;
exports.DeleteMessageBatchCommand = DeleteMessageBatchCommand;
exports.DeleteMessageCommand = DeleteMessageCommand;
exports.DeleteQueueCommand = DeleteQueueCommand;
exports.GetQueueAttributesCommand = GetQueueAttributesCommand;
exports.GetQueueUrlCommand = GetQueueUrlCommand;
exports.ListDeadLetterSourceQueuesCommand = ListDeadLetterSourceQueuesCommand;
exports.ListMessageMoveTasksCommand = ListMessageMoveTasksCommand;
exports.ListQueueTagsCommand = ListQueueTagsCommand;
exports.ListQueuesCommand = ListQueuesCommand;
exports.MessageSystemAttributeName = MessageSystemAttributeName;
exports.MessageSystemAttributeNameForSends = MessageSystemAttributeNameForSends;
exports.PurgeQueueCommand = PurgeQueueCommand;
exports.QueueAttributeName = QueueAttributeName;
exports.ReceiveMessageCommand = ReceiveMessageCommand;
exports.RemovePermissionCommand = RemovePermissionCommand;
exports.SQS = SQS;
exports.SQSClient = SQSClient;
exports.SendMessageBatchCommand = SendMessageBatchCommand;
exports.SendMessageCommand = SendMessageCommand;
exports.SetQueueAttributesCommand = SetQueueAttributesCommand;
exports.StartMessageMoveTaskCommand = StartMessageMoveTaskCommand;
exports.TagQueueCommand = TagQueueCommand;
exports.UntagQueueCommand = UntagQueueCommand;
exports.paginateListDeadLetterSourceQueues = paginateListDeadLetterSourceQueues;
exports.paginateListQueues = paginateListQueues;
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
