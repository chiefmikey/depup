"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchRequestTooLong = exports.InvalidMessageContents = exports.KmsThrottled = exports.KmsOptInRequired = exports.KmsNotFound = exports.KmsInvalidState = exports.KmsInvalidKeyUsage = exports.KmsDisabled = exports.KmsAccessDenied = exports.PurgeQueueInProgress = exports.InvalidIdFormat = exports.QueueNameExists = exports.QueueDeletedRecently = exports.InvalidAttributeValue = exports.InvalidAttributeName = exports.TooManyEntriesInBatchRequest = exports.InvalidBatchEntryId = exports.EmptyBatchRequest = exports.BatchEntryIdsNotDistinct = exports.ReceiptHandleIsInvalid = exports.MessageNotInflight = exports.ResourceNotFoundException = exports.UnsupportedOperation = exports.RequestThrottled = exports.QueueDoesNotExist = exports.OverLimit = exports.InvalidSecurity = exports.InvalidAddress = void 0;
const SQSServiceException_1 = require("./SQSServiceException");
class InvalidAddress extends SQSServiceException_1.SQSServiceException {
    name = "InvalidAddress";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidAddress",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidAddress.prototype);
    }
}
exports.InvalidAddress = InvalidAddress;
class InvalidSecurity extends SQSServiceException_1.SQSServiceException {
    name = "InvalidSecurity";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidSecurity",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidSecurity.prototype);
    }
}
exports.InvalidSecurity = InvalidSecurity;
class OverLimit extends SQSServiceException_1.SQSServiceException {
    name = "OverLimit";
    $fault = "client";
    constructor(opts) {
        super({
            name: "OverLimit",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, OverLimit.prototype);
    }
}
exports.OverLimit = OverLimit;
class QueueDoesNotExist extends SQSServiceException_1.SQSServiceException {
    name = "QueueDoesNotExist";
    $fault = "client";
    constructor(opts) {
        super({
            name: "QueueDoesNotExist",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, QueueDoesNotExist.prototype);
    }
}
exports.QueueDoesNotExist = QueueDoesNotExist;
class RequestThrottled extends SQSServiceException_1.SQSServiceException {
    name = "RequestThrottled";
    $fault = "client";
    constructor(opts) {
        super({
            name: "RequestThrottled",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, RequestThrottled.prototype);
    }
}
exports.RequestThrottled = RequestThrottled;
class UnsupportedOperation extends SQSServiceException_1.SQSServiceException {
    name = "UnsupportedOperation";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UnsupportedOperation",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnsupportedOperation.prototype);
    }
}
exports.UnsupportedOperation = UnsupportedOperation;
class ResourceNotFoundException extends SQSServiceException_1.SQSServiceException {
    name = "ResourceNotFoundException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ResourceNotFoundException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
    }
}
exports.ResourceNotFoundException = ResourceNotFoundException;
class MessageNotInflight extends SQSServiceException_1.SQSServiceException {
    name = "MessageNotInflight";
    $fault = "client";
    constructor(opts) {
        super({
            name: "MessageNotInflight",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MessageNotInflight.prototype);
    }
}
exports.MessageNotInflight = MessageNotInflight;
class ReceiptHandleIsInvalid extends SQSServiceException_1.SQSServiceException {
    name = "ReceiptHandleIsInvalid";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ReceiptHandleIsInvalid",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ReceiptHandleIsInvalid.prototype);
    }
}
exports.ReceiptHandleIsInvalid = ReceiptHandleIsInvalid;
class BatchEntryIdsNotDistinct extends SQSServiceException_1.SQSServiceException {
    name = "BatchEntryIdsNotDistinct";
    $fault = "client";
    constructor(opts) {
        super({
            name: "BatchEntryIdsNotDistinct",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, BatchEntryIdsNotDistinct.prototype);
    }
}
exports.BatchEntryIdsNotDistinct = BatchEntryIdsNotDistinct;
class EmptyBatchRequest extends SQSServiceException_1.SQSServiceException {
    name = "EmptyBatchRequest";
    $fault = "client";
    constructor(opts) {
        super({
            name: "EmptyBatchRequest",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, EmptyBatchRequest.prototype);
    }
}
exports.EmptyBatchRequest = EmptyBatchRequest;
class InvalidBatchEntryId extends SQSServiceException_1.SQSServiceException {
    name = "InvalidBatchEntryId";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidBatchEntryId",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidBatchEntryId.prototype);
    }
}
exports.InvalidBatchEntryId = InvalidBatchEntryId;
class TooManyEntriesInBatchRequest extends SQSServiceException_1.SQSServiceException {
    name = "TooManyEntriesInBatchRequest";
    $fault = "client";
    constructor(opts) {
        super({
            name: "TooManyEntriesInBatchRequest",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TooManyEntriesInBatchRequest.prototype);
    }
}
exports.TooManyEntriesInBatchRequest = TooManyEntriesInBatchRequest;
class InvalidAttributeName extends SQSServiceException_1.SQSServiceException {
    name = "InvalidAttributeName";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidAttributeName",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidAttributeName.prototype);
    }
}
exports.InvalidAttributeName = InvalidAttributeName;
class InvalidAttributeValue extends SQSServiceException_1.SQSServiceException {
    name = "InvalidAttributeValue";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidAttributeValue",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidAttributeValue.prototype);
    }
}
exports.InvalidAttributeValue = InvalidAttributeValue;
class QueueDeletedRecently extends SQSServiceException_1.SQSServiceException {
    name = "QueueDeletedRecently";
    $fault = "client";
    constructor(opts) {
        super({
            name: "QueueDeletedRecently",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, QueueDeletedRecently.prototype);
    }
}
exports.QueueDeletedRecently = QueueDeletedRecently;
class QueueNameExists extends SQSServiceException_1.SQSServiceException {
    name = "QueueNameExists";
    $fault = "client";
    constructor(opts) {
        super({
            name: "QueueNameExists",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, QueueNameExists.prototype);
    }
}
exports.QueueNameExists = QueueNameExists;
class InvalidIdFormat extends SQSServiceException_1.SQSServiceException {
    name = "InvalidIdFormat";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidIdFormat",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidIdFormat.prototype);
    }
}
exports.InvalidIdFormat = InvalidIdFormat;
class PurgeQueueInProgress extends SQSServiceException_1.SQSServiceException {
    name = "PurgeQueueInProgress";
    $fault = "client";
    constructor(opts) {
        super({
            name: "PurgeQueueInProgress",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, PurgeQueueInProgress.prototype);
    }
}
exports.PurgeQueueInProgress = PurgeQueueInProgress;
class KmsAccessDenied extends SQSServiceException_1.SQSServiceException {
    name = "KmsAccessDenied";
    $fault = "client";
    constructor(opts) {
        super({
            name: "KmsAccessDenied",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, KmsAccessDenied.prototype);
    }
}
exports.KmsAccessDenied = KmsAccessDenied;
class KmsDisabled extends SQSServiceException_1.SQSServiceException {
    name = "KmsDisabled";
    $fault = "client";
    constructor(opts) {
        super({
            name: "KmsDisabled",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, KmsDisabled.prototype);
    }
}
exports.KmsDisabled = KmsDisabled;
class KmsInvalidKeyUsage extends SQSServiceException_1.SQSServiceException {
    name = "KmsInvalidKeyUsage";
    $fault = "client";
    constructor(opts) {
        super({
            name: "KmsInvalidKeyUsage",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, KmsInvalidKeyUsage.prototype);
    }
}
exports.KmsInvalidKeyUsage = KmsInvalidKeyUsage;
class KmsInvalidState extends SQSServiceException_1.SQSServiceException {
    name = "KmsInvalidState";
    $fault = "client";
    constructor(opts) {
        super({
            name: "KmsInvalidState",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, KmsInvalidState.prototype);
    }
}
exports.KmsInvalidState = KmsInvalidState;
class KmsNotFound extends SQSServiceException_1.SQSServiceException {
    name = "KmsNotFound";
    $fault = "client";
    constructor(opts) {
        super({
            name: "KmsNotFound",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, KmsNotFound.prototype);
    }
}
exports.KmsNotFound = KmsNotFound;
class KmsOptInRequired extends SQSServiceException_1.SQSServiceException {
    name = "KmsOptInRequired";
    $fault = "client";
    constructor(opts) {
        super({
            name: "KmsOptInRequired",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, KmsOptInRequired.prototype);
    }
}
exports.KmsOptInRequired = KmsOptInRequired;
class KmsThrottled extends SQSServiceException_1.SQSServiceException {
    name = "KmsThrottled";
    $fault = "client";
    constructor(opts) {
        super({
            name: "KmsThrottled",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, KmsThrottled.prototype);
    }
}
exports.KmsThrottled = KmsThrottled;
class InvalidMessageContents extends SQSServiceException_1.SQSServiceException {
    name = "InvalidMessageContents";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidMessageContents",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidMessageContents.prototype);
    }
}
exports.InvalidMessageContents = InvalidMessageContents;
class BatchRequestTooLong extends SQSServiceException_1.SQSServiceException {
    name = "BatchRequestTooLong";
    $fault = "client";
    constructor(opts) {
        super({
            name: "BatchRequestTooLong",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, BatchRequestTooLong.prototype);
    }
}
exports.BatchRequestTooLong = BatchRequestTooLong;
