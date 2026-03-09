"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionAccessNotGrantedException = exports.MissingRenderingAttributeException = exports.MessageRejected = exports.MailFromDomainNotVerifiedException = exports.InvalidRenderingParameterException = exports.InvalidPolicyException = exports.InvalidDeliveryOptionsException = exports.TemplateDoesNotExistException = exports.TrackingOptionsDoesNotExistException = exports.EventDestinationDoesNotExistException = exports.CustomVerificationEmailTemplateDoesNotExistException = exports.InvalidTemplateException = exports.RuleDoesNotExistException = exports.InvalidSnsTopicException = exports.InvalidS3ConfigurationException = exports.InvalidLambdaFunctionException = exports.FromEmailAddressNotVerifiedException = exports.CustomVerificationEmailTemplateAlreadyExistsException = exports.CustomVerificationEmailInvalidContentException = exports.TrackingOptionsAlreadyExistsException = exports.InvalidTrackingOptionsException = exports.InvalidSNSDestinationException = exports.InvalidFirehoseDestinationException = exports.InvalidCloudWatchDestinationException = exports.EventDestinationAlreadyExistsException = exports.InvalidConfigurationSetException = exports.ConfigurationSetSendingPausedException = exports.ConfigurationSetDoesNotExistException = exports.ConfigurationSetAlreadyExistsException = exports.RuleSetDoesNotExistException = exports.LimitExceededException = exports.CannotDeleteException = exports.AlreadyExistsException = exports.AccountSendingPausedException = void 0;
const SESServiceException_1 = require("./SESServiceException");
class AccountSendingPausedException extends SESServiceException_1.SESServiceException {
    name = "AccountSendingPausedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "AccountSendingPausedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, AccountSendingPausedException.prototype);
    }
}
exports.AccountSendingPausedException = AccountSendingPausedException;
class AlreadyExistsException extends SESServiceException_1.SESServiceException {
    name = "AlreadyExistsException";
    $fault = "client";
    Name;
    constructor(opts) {
        super({
            name: "AlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, AlreadyExistsException.prototype);
        this.Name = opts.Name;
    }
}
exports.AlreadyExistsException = AlreadyExistsException;
class CannotDeleteException extends SESServiceException_1.SESServiceException {
    name = "CannotDeleteException";
    $fault = "client";
    Name;
    constructor(opts) {
        super({
            name: "CannotDeleteException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CannotDeleteException.prototype);
        this.Name = opts.Name;
    }
}
exports.CannotDeleteException = CannotDeleteException;
class LimitExceededException extends SESServiceException_1.SESServiceException {
    name = "LimitExceededException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "LimitExceededException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, LimitExceededException.prototype);
    }
}
exports.LimitExceededException = LimitExceededException;
class RuleSetDoesNotExistException extends SESServiceException_1.SESServiceException {
    name = "RuleSetDoesNotExistException";
    $fault = "client";
    Name;
    constructor(opts) {
        super({
            name: "RuleSetDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, RuleSetDoesNotExistException.prototype);
        this.Name = opts.Name;
    }
}
exports.RuleSetDoesNotExistException = RuleSetDoesNotExistException;
class ConfigurationSetAlreadyExistsException extends SESServiceException_1.SESServiceException {
    name = "ConfigurationSetAlreadyExistsException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "ConfigurationSetAlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ConfigurationSetAlreadyExistsException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
}
exports.ConfigurationSetAlreadyExistsException = ConfigurationSetAlreadyExistsException;
class ConfigurationSetDoesNotExistException extends SESServiceException_1.SESServiceException {
    name = "ConfigurationSetDoesNotExistException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "ConfigurationSetDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ConfigurationSetDoesNotExistException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
}
exports.ConfigurationSetDoesNotExistException = ConfigurationSetDoesNotExistException;
class ConfigurationSetSendingPausedException extends SESServiceException_1.SESServiceException {
    name = "ConfigurationSetSendingPausedException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "ConfigurationSetSendingPausedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ConfigurationSetSendingPausedException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
}
exports.ConfigurationSetSendingPausedException = ConfigurationSetSendingPausedException;
class InvalidConfigurationSetException extends SESServiceException_1.SESServiceException {
    name = "InvalidConfigurationSetException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidConfigurationSetException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidConfigurationSetException.prototype);
    }
}
exports.InvalidConfigurationSetException = InvalidConfigurationSetException;
class EventDestinationAlreadyExistsException extends SESServiceException_1.SESServiceException {
    name = "EventDestinationAlreadyExistsException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "EventDestinationAlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, EventDestinationAlreadyExistsException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
}
exports.EventDestinationAlreadyExistsException = EventDestinationAlreadyExistsException;
class InvalidCloudWatchDestinationException extends SESServiceException_1.SESServiceException {
    name = "InvalidCloudWatchDestinationException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "InvalidCloudWatchDestinationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidCloudWatchDestinationException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
}
exports.InvalidCloudWatchDestinationException = InvalidCloudWatchDestinationException;
class InvalidFirehoseDestinationException extends SESServiceException_1.SESServiceException {
    name = "InvalidFirehoseDestinationException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "InvalidFirehoseDestinationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidFirehoseDestinationException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
}
exports.InvalidFirehoseDestinationException = InvalidFirehoseDestinationException;
class InvalidSNSDestinationException extends SESServiceException_1.SESServiceException {
    name = "InvalidSNSDestinationException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "InvalidSNSDestinationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidSNSDestinationException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
}
exports.InvalidSNSDestinationException = InvalidSNSDestinationException;
class InvalidTrackingOptionsException extends SESServiceException_1.SESServiceException {
    name = "InvalidTrackingOptionsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidTrackingOptionsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidTrackingOptionsException.prototype);
    }
}
exports.InvalidTrackingOptionsException = InvalidTrackingOptionsException;
class TrackingOptionsAlreadyExistsException extends SESServiceException_1.SESServiceException {
    name = "TrackingOptionsAlreadyExistsException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "TrackingOptionsAlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TrackingOptionsAlreadyExistsException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
}
exports.TrackingOptionsAlreadyExistsException = TrackingOptionsAlreadyExistsException;
class CustomVerificationEmailInvalidContentException extends SESServiceException_1.SESServiceException {
    name = "CustomVerificationEmailInvalidContentException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "CustomVerificationEmailInvalidContentException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CustomVerificationEmailInvalidContentException.prototype);
    }
}
exports.CustomVerificationEmailInvalidContentException = CustomVerificationEmailInvalidContentException;
class CustomVerificationEmailTemplateAlreadyExistsException extends SESServiceException_1.SESServiceException {
    name = "CustomVerificationEmailTemplateAlreadyExistsException";
    $fault = "client";
    CustomVerificationEmailTemplateName;
    constructor(opts) {
        super({
            name: "CustomVerificationEmailTemplateAlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CustomVerificationEmailTemplateAlreadyExistsException.prototype);
        this.CustomVerificationEmailTemplateName = opts.CustomVerificationEmailTemplateName;
    }
}
exports.CustomVerificationEmailTemplateAlreadyExistsException = CustomVerificationEmailTemplateAlreadyExistsException;
class FromEmailAddressNotVerifiedException extends SESServiceException_1.SESServiceException {
    name = "FromEmailAddressNotVerifiedException";
    $fault = "client";
    FromEmailAddress;
    constructor(opts) {
        super({
            name: "FromEmailAddressNotVerifiedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, FromEmailAddressNotVerifiedException.prototype);
        this.FromEmailAddress = opts.FromEmailAddress;
    }
}
exports.FromEmailAddressNotVerifiedException = FromEmailAddressNotVerifiedException;
class InvalidLambdaFunctionException extends SESServiceException_1.SESServiceException {
    name = "InvalidLambdaFunctionException";
    $fault = "client";
    FunctionArn;
    constructor(opts) {
        super({
            name: "InvalidLambdaFunctionException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidLambdaFunctionException.prototype);
        this.FunctionArn = opts.FunctionArn;
    }
}
exports.InvalidLambdaFunctionException = InvalidLambdaFunctionException;
class InvalidS3ConfigurationException extends SESServiceException_1.SESServiceException {
    name = "InvalidS3ConfigurationException";
    $fault = "client";
    Bucket;
    constructor(opts) {
        super({
            name: "InvalidS3ConfigurationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidS3ConfigurationException.prototype);
        this.Bucket = opts.Bucket;
    }
}
exports.InvalidS3ConfigurationException = InvalidS3ConfigurationException;
class InvalidSnsTopicException extends SESServiceException_1.SESServiceException {
    name = "InvalidSnsTopicException";
    $fault = "client";
    Topic;
    constructor(opts) {
        super({
            name: "InvalidSnsTopicException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidSnsTopicException.prototype);
        this.Topic = opts.Topic;
    }
}
exports.InvalidSnsTopicException = InvalidSnsTopicException;
class RuleDoesNotExistException extends SESServiceException_1.SESServiceException {
    name = "RuleDoesNotExistException";
    $fault = "client";
    Name;
    constructor(opts) {
        super({
            name: "RuleDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, RuleDoesNotExistException.prototype);
        this.Name = opts.Name;
    }
}
exports.RuleDoesNotExistException = RuleDoesNotExistException;
class InvalidTemplateException extends SESServiceException_1.SESServiceException {
    name = "InvalidTemplateException";
    $fault = "client";
    TemplateName;
    constructor(opts) {
        super({
            name: "InvalidTemplateException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidTemplateException.prototype);
        this.TemplateName = opts.TemplateName;
    }
}
exports.InvalidTemplateException = InvalidTemplateException;
class CustomVerificationEmailTemplateDoesNotExistException extends SESServiceException_1.SESServiceException {
    name = "CustomVerificationEmailTemplateDoesNotExistException";
    $fault = "client";
    CustomVerificationEmailTemplateName;
    constructor(opts) {
        super({
            name: "CustomVerificationEmailTemplateDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CustomVerificationEmailTemplateDoesNotExistException.prototype);
        this.CustomVerificationEmailTemplateName = opts.CustomVerificationEmailTemplateName;
    }
}
exports.CustomVerificationEmailTemplateDoesNotExistException = CustomVerificationEmailTemplateDoesNotExistException;
class EventDestinationDoesNotExistException extends SESServiceException_1.SESServiceException {
    name = "EventDestinationDoesNotExistException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "EventDestinationDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, EventDestinationDoesNotExistException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
}
exports.EventDestinationDoesNotExistException = EventDestinationDoesNotExistException;
class TrackingOptionsDoesNotExistException extends SESServiceException_1.SESServiceException {
    name = "TrackingOptionsDoesNotExistException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "TrackingOptionsDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TrackingOptionsDoesNotExistException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
}
exports.TrackingOptionsDoesNotExistException = TrackingOptionsDoesNotExistException;
class TemplateDoesNotExistException extends SESServiceException_1.SESServiceException {
    name = "TemplateDoesNotExistException";
    $fault = "client";
    TemplateName;
    constructor(opts) {
        super({
            name: "TemplateDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TemplateDoesNotExistException.prototype);
        this.TemplateName = opts.TemplateName;
    }
}
exports.TemplateDoesNotExistException = TemplateDoesNotExistException;
class InvalidDeliveryOptionsException extends SESServiceException_1.SESServiceException {
    name = "InvalidDeliveryOptionsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidDeliveryOptionsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidDeliveryOptionsException.prototype);
    }
}
exports.InvalidDeliveryOptionsException = InvalidDeliveryOptionsException;
class InvalidPolicyException extends SESServiceException_1.SESServiceException {
    name = "InvalidPolicyException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidPolicyException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidPolicyException.prototype);
    }
}
exports.InvalidPolicyException = InvalidPolicyException;
class InvalidRenderingParameterException extends SESServiceException_1.SESServiceException {
    name = "InvalidRenderingParameterException";
    $fault = "client";
    TemplateName;
    constructor(opts) {
        super({
            name: "InvalidRenderingParameterException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidRenderingParameterException.prototype);
        this.TemplateName = opts.TemplateName;
    }
}
exports.InvalidRenderingParameterException = InvalidRenderingParameterException;
class MailFromDomainNotVerifiedException extends SESServiceException_1.SESServiceException {
    name = "MailFromDomainNotVerifiedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "MailFromDomainNotVerifiedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MailFromDomainNotVerifiedException.prototype);
    }
}
exports.MailFromDomainNotVerifiedException = MailFromDomainNotVerifiedException;
class MessageRejected extends SESServiceException_1.SESServiceException {
    name = "MessageRejected";
    $fault = "client";
    constructor(opts) {
        super({
            name: "MessageRejected",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MessageRejected.prototype);
    }
}
exports.MessageRejected = MessageRejected;
class MissingRenderingAttributeException extends SESServiceException_1.SESServiceException {
    name = "MissingRenderingAttributeException";
    $fault = "client";
    TemplateName;
    constructor(opts) {
        super({
            name: "MissingRenderingAttributeException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MissingRenderingAttributeException.prototype);
        this.TemplateName = opts.TemplateName;
    }
}
exports.MissingRenderingAttributeException = MissingRenderingAttributeException;
class ProductionAccessNotGrantedException extends SESServiceException_1.SESServiceException {
    name = "ProductionAccessNotGrantedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ProductionAccessNotGrantedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ProductionAccessNotGrantedException.prototype);
    }
}
exports.ProductionAccessNotGrantedException = ProductionAccessNotGrantedException;
