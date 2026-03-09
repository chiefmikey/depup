import { ExceptionOptionType as __ExceptionOptionType } from "@smithy/smithy-client";
import { SQSServiceException as __BaseException } from "./SQSServiceException";
export declare class InvalidAddress extends __BaseException {
  readonly name: "InvalidAddress";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<InvalidAddress, __BaseException>);
}
export declare class InvalidSecurity extends __BaseException {
  readonly name: "InvalidSecurity";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<InvalidSecurity, __BaseException>);
}
export declare class OverLimit extends __BaseException {
  readonly name: "OverLimit";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<OverLimit, __BaseException>);
}
export declare class QueueDoesNotExist extends __BaseException {
  readonly name: "QueueDoesNotExist";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<QueueDoesNotExist, __BaseException>);
}
export declare class RequestThrottled extends __BaseException {
  readonly name: "RequestThrottled";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<RequestThrottled, __BaseException>);
}
export declare class UnsupportedOperation extends __BaseException {
  readonly name: "UnsupportedOperation";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UnsupportedOperation, __BaseException>
  );
}
export declare class ResourceNotFoundException extends __BaseException {
  readonly name: "ResourceNotFoundException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<ResourceNotFoundException, __BaseException>
  );
}
export declare class MessageNotInflight extends __BaseException {
  readonly name: "MessageNotInflight";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<MessageNotInflight, __BaseException>);
}
export declare class ReceiptHandleIsInvalid extends __BaseException {
  readonly name: "ReceiptHandleIsInvalid";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<ReceiptHandleIsInvalid, __BaseException>
  );
}
export declare class BatchEntryIdsNotDistinct extends __BaseException {
  readonly name: "BatchEntryIdsNotDistinct";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<BatchEntryIdsNotDistinct, __BaseException>
  );
}
export declare class EmptyBatchRequest extends __BaseException {
  readonly name: "EmptyBatchRequest";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<EmptyBatchRequest, __BaseException>);
}
export declare class InvalidBatchEntryId extends __BaseException {
  readonly name: "InvalidBatchEntryId";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<InvalidBatchEntryId, __BaseException>
  );
}
export declare class TooManyEntriesInBatchRequest extends __BaseException {
  readonly name: "TooManyEntriesInBatchRequest";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<TooManyEntriesInBatchRequest, __BaseException>
  );
}
export declare class InvalidAttributeName extends __BaseException {
  readonly name: "InvalidAttributeName";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<InvalidAttributeName, __BaseException>
  );
}
export declare class InvalidAttributeValue extends __BaseException {
  readonly name: "InvalidAttributeValue";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<InvalidAttributeValue, __BaseException>
  );
}
export declare class QueueDeletedRecently extends __BaseException {
  readonly name: "QueueDeletedRecently";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<QueueDeletedRecently, __BaseException>
  );
}
export declare class QueueNameExists extends __BaseException {
  readonly name: "QueueNameExists";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<QueueNameExists, __BaseException>);
}
export declare class InvalidIdFormat extends __BaseException {
  readonly name: "InvalidIdFormat";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<InvalidIdFormat, __BaseException>);
}
export declare class PurgeQueueInProgress extends __BaseException {
  readonly name: "PurgeQueueInProgress";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<PurgeQueueInProgress, __BaseException>
  );
}
export declare class KmsAccessDenied extends __BaseException {
  readonly name: "KmsAccessDenied";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<KmsAccessDenied, __BaseException>);
}
export declare class KmsDisabled extends __BaseException {
  readonly name: "KmsDisabled";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<KmsDisabled, __BaseException>);
}
export declare class KmsInvalidKeyUsage extends __BaseException {
  readonly name: "KmsInvalidKeyUsage";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<KmsInvalidKeyUsage, __BaseException>);
}
export declare class KmsInvalidState extends __BaseException {
  readonly name: "KmsInvalidState";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<KmsInvalidState, __BaseException>);
}
export declare class KmsNotFound extends __BaseException {
  readonly name: "KmsNotFound";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<KmsNotFound, __BaseException>);
}
export declare class KmsOptInRequired extends __BaseException {
  readonly name: "KmsOptInRequired";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<KmsOptInRequired, __BaseException>);
}
export declare class KmsThrottled extends __BaseException {
  readonly name: "KmsThrottled";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<KmsThrottled, __BaseException>);
}
export declare class InvalidMessageContents extends __BaseException {
  readonly name: "InvalidMessageContents";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<InvalidMessageContents, __BaseException>
  );
}
export declare class BatchRequestTooLong extends __BaseException {
  readonly name: "BatchRequestTooLong";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<BatchRequestTooLong, __BaseException>
  );
}
