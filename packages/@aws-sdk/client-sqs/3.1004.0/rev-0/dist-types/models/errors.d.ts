import type { ExceptionOptionType as __ExceptionOptionType } from "@smithy/smithy-client";
import { SQSServiceException as __BaseException } from "./SQSServiceException";
/**
 * <p>The specified ID is invalid.</p>
 * @public
 */
export declare class InvalidAddress extends __BaseException {
    readonly name: "InvalidAddress";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidAddress, __BaseException>);
}
/**
 * <p>The request was not made over HTTPS or did not use SigV4 for signing.</p>
 * @public
 */
export declare class InvalidSecurity extends __BaseException {
    readonly name: "InvalidSecurity";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidSecurity, __BaseException>);
}
/**
 * <p>The specified action violates a limit. For example, <code>ReceiveMessage</code>
 *             returns this error if the maximum number of in flight messages is reached and
 *                 <code>AddPermission</code> returns this error if the maximum number of permissions
 *             for the queue is reached.</p>
 * @public
 */
export declare class OverLimit extends __BaseException {
    readonly name: "OverLimit";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<OverLimit, __BaseException>);
}
/**
 * <p>Ensure that the <code>QueueUrl</code> is correct and that the queue has not been
 *             deleted.</p>
 * @public
 */
export declare class QueueDoesNotExist extends __BaseException {
    readonly name: "QueueDoesNotExist";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<QueueDoesNotExist, __BaseException>);
}
/**
 * <p>The request was denied due to request throttling.</p>
 *          <ul>
 *             <li>
 *                <p>Exceeds the permitted request rate for the queue or for the recipient of the
 *                     request.</p>
 *             </li>
 *             <li>
 *                <p>Ensure that the request rate is within the Amazon SQS limits for
 *                     sending messages. For more information, see <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-quotas.html#quotas-requests">Amazon SQS quotas</a> in the <i>Amazon SQS
 *                         Developer Guide</i>.</p>
 *             </li>
 *          </ul>
 * @public
 */
export declare class RequestThrottled extends __BaseException {
    readonly name: "RequestThrottled";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<RequestThrottled, __BaseException>);
}
/**
 * <p>Error code 400. Unsupported operation.</p>
 * @public
 */
export declare class UnsupportedOperation extends __BaseException {
    readonly name: "UnsupportedOperation";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UnsupportedOperation, __BaseException>);
}
/**
 * <p>One or more specified resources don't exist.</p>
 * @public
 */
export declare class ResourceNotFoundException extends __BaseException {
    readonly name: "ResourceNotFoundException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<ResourceNotFoundException, __BaseException>);
}
/**
 * <p>The specified message isn't in flight.</p>
 * @public
 */
export declare class MessageNotInflight extends __BaseException {
    readonly name: "MessageNotInflight";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<MessageNotInflight, __BaseException>);
}
/**
 * <p>The specified receipt handle isn't valid.</p>
 * @public
 */
export declare class ReceiptHandleIsInvalid extends __BaseException {
    readonly name: "ReceiptHandleIsInvalid";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<ReceiptHandleIsInvalid, __BaseException>);
}
/**
 * <p>Two or more batch entries in the request have the same <code>Id</code>.</p>
 * @public
 */
export declare class BatchEntryIdsNotDistinct extends __BaseException {
    readonly name: "BatchEntryIdsNotDistinct";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<BatchEntryIdsNotDistinct, __BaseException>);
}
/**
 * <p>The batch request doesn't contain any entries.</p>
 * @public
 */
export declare class EmptyBatchRequest extends __BaseException {
    readonly name: "EmptyBatchRequest";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<EmptyBatchRequest, __BaseException>);
}
/**
 * <p>The <code>Id</code> of a batch entry in a batch request doesn't abide by the
 *             specification.</p>
 * @public
 */
export declare class InvalidBatchEntryId extends __BaseException {
    readonly name: "InvalidBatchEntryId";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidBatchEntryId, __BaseException>);
}
/**
 * <p>The batch request contains more entries than permissible. For Amazon SQS, the
 *             maximum number of entries you can include in a single <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessageBatch.html">SendMessageBatch</a>, <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_DeleteMessageBatch.html">DeleteMessageBatch</a>, or <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ChangeMessageVisibilityBatch.html">ChangeMessageVisibilityBatch</a> request is 10.</p>
 * @public
 */
export declare class TooManyEntriesInBatchRequest extends __BaseException {
    readonly name: "TooManyEntriesInBatchRequest";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<TooManyEntriesInBatchRequest, __BaseException>);
}
/**
 * <p>The specified attribute doesn't exist.</p>
 * @public
 */
export declare class InvalidAttributeName extends __BaseException {
    readonly name: "InvalidAttributeName";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidAttributeName, __BaseException>);
}
/**
 * <p>A queue attribute value is invalid.</p>
 * @public
 */
export declare class InvalidAttributeValue extends __BaseException {
    readonly name: "InvalidAttributeValue";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidAttributeValue, __BaseException>);
}
/**
 * <p>You must wait 60 seconds after deleting a queue before you can create another queue
 *             with the same name.</p>
 * @public
 */
export declare class QueueDeletedRecently extends __BaseException {
    readonly name: "QueueDeletedRecently";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<QueueDeletedRecently, __BaseException>);
}
/**
 * <p>A queue with this name already exists. Amazon SQS returns this error only if the request
 *             includes attributes whose values differ from those of the existing queue.</p>
 * @public
 */
export declare class QueueNameExists extends __BaseException {
    readonly name: "QueueNameExists";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<QueueNameExists, __BaseException>);
}
/**
 * <p>The specified receipt handle isn't valid for the current version.</p>
 *
 * @deprecated exception has been included in ReceiptHandleIsInvalid.
 * @public
 */
export declare class InvalidIdFormat extends __BaseException {
    readonly name: "InvalidIdFormat";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidIdFormat, __BaseException>);
}
/**
 * <p>Indicates that the specified queue previously received a <code>PurgeQueue</code>
 *             request within the last 60 seconds (the time it can take to delete the messages in the
 *             queue).</p>
 * @public
 */
export declare class PurgeQueueInProgress extends __BaseException {
    readonly name: "PurgeQueueInProgress";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<PurgeQueueInProgress, __BaseException>);
}
/**
 * <p>The caller doesn't have the required KMS access.</p>
 * @public
 */
export declare class KmsAccessDenied extends __BaseException {
    readonly name: "KmsAccessDenied";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<KmsAccessDenied, __BaseException>);
}
/**
 * <p>The request was denied due to request throttling.</p>
 * @public
 */
export declare class KmsDisabled extends __BaseException {
    readonly name: "KmsDisabled";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<KmsDisabled, __BaseException>);
}
/**
 * <p>The request was rejected for one of the following reasons:</p>
 *          <ul>
 *             <li>
 *                <p>The KeyUsage value of the KMS key is incompatible with the API
 *                     operation.</p>
 *             </li>
 *             <li>
 *                <p>The encryption algorithm or signing algorithm specified for the operation is
 *                     incompatible with the type of key material in the KMS key (KeySpec).</p>
 *             </li>
 *          </ul>
 * @public
 */
export declare class KmsInvalidKeyUsage extends __BaseException {
    readonly name: "KmsInvalidKeyUsage";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<KmsInvalidKeyUsage, __BaseException>);
}
/**
 * <p>The request was rejected because the state of the specified resource is not valid for
 *             this request.</p>
 * @public
 */
export declare class KmsInvalidState extends __BaseException {
    readonly name: "KmsInvalidState";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<KmsInvalidState, __BaseException>);
}
/**
 * <p>The request was rejected because the specified entity or resource could not be found.
 *         </p>
 * @public
 */
export declare class KmsNotFound extends __BaseException {
    readonly name: "KmsNotFound";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<KmsNotFound, __BaseException>);
}
/**
 * <p>The request was rejected because the specified key policy isn't syntactically or
 *             semantically correct.</p>
 * @public
 */
export declare class KmsOptInRequired extends __BaseException {
    readonly name: "KmsOptInRequired";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<KmsOptInRequired, __BaseException>);
}
/**
 * <p>Amazon Web Services KMS throttles requests for the following conditions.</p>
 * @public
 */
export declare class KmsThrottled extends __BaseException {
    readonly name: "KmsThrottled";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<KmsThrottled, __BaseException>);
}
/**
 * <p>The message contains characters outside the allowed set.</p>
 * @public
 */
export declare class InvalidMessageContents extends __BaseException {
    readonly name: "InvalidMessageContents";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidMessageContents, __BaseException>);
}
/**
 * <p>The length of all the messages put together is more than the limit.</p>
 * @public
 */
export declare class BatchRequestTooLong extends __BaseException {
    readonly name: "BatchRequestTooLong";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<BatchRequestTooLong, __BaseException>);
}
