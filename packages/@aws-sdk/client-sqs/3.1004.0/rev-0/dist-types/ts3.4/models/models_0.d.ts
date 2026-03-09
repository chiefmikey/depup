import {
  MessageSystemAttributeName,
  MessageSystemAttributeNameForSends,
  QueueAttributeName,
} from "./enums";
export interface AddPermissionRequest {
  QueueUrl: string | undefined;
  Label: string | undefined;
  AWSAccountIds: string[] | undefined;
  Actions: string[] | undefined;
}
export interface CancelMessageMoveTaskRequest {
  TaskHandle: string | undefined;
}
export interface CancelMessageMoveTaskResult {
  ApproximateNumberOfMessagesMoved?: number | undefined;
}
export interface ChangeMessageVisibilityRequest {
  QueueUrl: string | undefined;
  ReceiptHandle: string | undefined;
  VisibilityTimeout: number | undefined;
}
export interface ChangeMessageVisibilityBatchRequestEntry {
  Id: string | undefined;
  ReceiptHandle: string | undefined;
  VisibilityTimeout?: number | undefined;
}
export interface ChangeMessageVisibilityBatchRequest {
  QueueUrl: string | undefined;
  Entries: ChangeMessageVisibilityBatchRequestEntry[] | undefined;
}
export interface BatchResultErrorEntry {
  Id: string | undefined;
  SenderFault: boolean | undefined;
  Code: string | undefined;
  Message?: string | undefined;
}
export interface ChangeMessageVisibilityBatchResultEntry {
  Id: string | undefined;
}
export interface ChangeMessageVisibilityBatchResult {
  Successful: ChangeMessageVisibilityBatchResultEntry[] | undefined;
  Failed: BatchResultErrorEntry[] | undefined;
}
export interface CreateQueueRequest {
  QueueName: string | undefined;
  Attributes?: Partial<Record<QueueAttributeName, string>> | undefined;
  tags?: Record<string, string> | undefined;
}
export interface CreateQueueResult {
  QueueUrl?: string | undefined;
}
export interface DeleteMessageRequest {
  QueueUrl: string | undefined;
  ReceiptHandle: string | undefined;
}
export interface DeleteMessageBatchRequestEntry {
  Id: string | undefined;
  ReceiptHandle: string | undefined;
}
export interface DeleteMessageBatchRequest {
  QueueUrl: string | undefined;
  Entries: DeleteMessageBatchRequestEntry[] | undefined;
}
export interface DeleteMessageBatchResultEntry {
  Id: string | undefined;
}
export interface DeleteMessageBatchResult {
  Successful: DeleteMessageBatchResultEntry[] | undefined;
  Failed: BatchResultErrorEntry[] | undefined;
}
export interface DeleteQueueRequest {
  QueueUrl: string | undefined;
}
export interface GetQueueAttributesRequest {
  QueueUrl: string | undefined;
  AttributeNames?: QueueAttributeName[] | undefined;
}
export interface GetQueueAttributesResult {
  Attributes?: Partial<Record<QueueAttributeName, string>> | undefined;
}
export interface GetQueueUrlRequest {
  QueueName: string | undefined;
  QueueOwnerAWSAccountId?: string | undefined;
}
export interface GetQueueUrlResult {
  QueueUrl?: string | undefined;
}
export interface ListDeadLetterSourceQueuesRequest {
  QueueUrl: string | undefined;
  NextToken?: string | undefined;
  MaxResults?: number | undefined;
}
export interface ListDeadLetterSourceQueuesResult {
  queueUrls: string[] | undefined;
  NextToken?: string | undefined;
}
export interface ListMessageMoveTasksRequest {
  SourceArn: string | undefined;
  MaxResults?: number | undefined;
}
export interface ListMessageMoveTasksResultEntry {
  TaskHandle?: string | undefined;
  Status?: string | undefined;
  SourceArn?: string | undefined;
  DestinationArn?: string | undefined;
  MaxNumberOfMessagesPerSecond?: number | undefined;
  ApproximateNumberOfMessagesMoved?: number | undefined;
  ApproximateNumberOfMessagesToMove?: number | undefined;
  FailureReason?: string | undefined;
  StartedTimestamp?: number | undefined;
}
export interface ListMessageMoveTasksResult {
  Results?: ListMessageMoveTasksResultEntry[] | undefined;
}
export interface ListQueuesRequest {
  QueueNamePrefix?: string | undefined;
  NextToken?: string | undefined;
  MaxResults?: number | undefined;
}
export interface ListQueuesResult {
  QueueUrls?: string[] | undefined;
  NextToken?: string | undefined;
}
export interface ListQueueTagsRequest {
  QueueUrl: string | undefined;
}
export interface ListQueueTagsResult {
  Tags?: Record<string, string> | undefined;
}
export interface PurgeQueueRequest {
  QueueUrl: string | undefined;
}
export interface ReceiveMessageRequest {
  QueueUrl: string | undefined;
  AttributeNames?: QueueAttributeName[] | undefined;
  MessageSystemAttributeNames?: MessageSystemAttributeName[] | undefined;
  MessageAttributeNames?: string[] | undefined;
  MaxNumberOfMessages?: number | undefined;
  VisibilityTimeout?: number | undefined;
  WaitTimeSeconds?: number | undefined;
  ReceiveRequestAttemptId?: string | undefined;
}
export interface MessageAttributeValue {
  StringValue?: string | undefined;
  BinaryValue?: Uint8Array | undefined;
  StringListValues?: string[] | undefined;
  BinaryListValues?: Uint8Array[] | undefined;
  DataType: string | undefined;
}
export interface Message {
  MessageId?: string | undefined;
  ReceiptHandle?: string | undefined;
  MD5OfBody?: string | undefined;
  Body?: string | undefined;
  Attributes?: Partial<Record<MessageSystemAttributeName, string>> | undefined;
  MD5OfMessageAttributes?: string | undefined;
  MessageAttributes?: Record<string, MessageAttributeValue> | undefined;
}
export interface ReceiveMessageResult {
  Messages?: Message[] | undefined;
}
export interface RemovePermissionRequest {
  QueueUrl: string | undefined;
  Label: string | undefined;
}
export interface MessageSystemAttributeValue {
  StringValue?: string | undefined;
  BinaryValue?: Uint8Array | undefined;
  StringListValues?: string[] | undefined;
  BinaryListValues?: Uint8Array[] | undefined;
  DataType: string | undefined;
}
export interface SendMessageRequest {
  QueueUrl: string | undefined;
  MessageBody: string | undefined;
  DelaySeconds?: number | undefined;
  MessageAttributes?: Record<string, MessageAttributeValue> | undefined;
  MessageSystemAttributes?:
    | Partial<
        Record<MessageSystemAttributeNameForSends, MessageSystemAttributeValue>
      >
    | undefined;
  MessageDeduplicationId?: string | undefined;
  MessageGroupId?: string | undefined;
}
export interface SendMessageResult {
  MD5OfMessageBody?: string | undefined;
  MD5OfMessageAttributes?: string | undefined;
  MD5OfMessageSystemAttributes?: string | undefined;
  MessageId?: string | undefined;
  SequenceNumber?: string | undefined;
}
export interface SendMessageBatchRequestEntry {
  Id: string | undefined;
  MessageBody: string | undefined;
  DelaySeconds?: number | undefined;
  MessageAttributes?: Record<string, MessageAttributeValue> | undefined;
  MessageSystemAttributes?:
    | Partial<
        Record<MessageSystemAttributeNameForSends, MessageSystemAttributeValue>
      >
    | undefined;
  MessageDeduplicationId?: string | undefined;
  MessageGroupId?: string | undefined;
}
export interface SendMessageBatchRequest {
  QueueUrl: string | undefined;
  Entries: SendMessageBatchRequestEntry[] | undefined;
}
export interface SendMessageBatchResultEntry {
  Id: string | undefined;
  MessageId: string | undefined;
  MD5OfMessageBody: string | undefined;
  MD5OfMessageAttributes?: string | undefined;
  MD5OfMessageSystemAttributes?: string | undefined;
  SequenceNumber?: string | undefined;
}
export interface SendMessageBatchResult {
  Successful: SendMessageBatchResultEntry[] | undefined;
  Failed: BatchResultErrorEntry[] | undefined;
}
export interface SetQueueAttributesRequest {
  QueueUrl: string | undefined;
  Attributes: Partial<Record<QueueAttributeName, string>> | undefined;
}
export interface StartMessageMoveTaskRequest {
  SourceArn: string | undefined;
  DestinationArn?: string | undefined;
  MaxNumberOfMessagesPerSecond?: number | undefined;
}
export interface StartMessageMoveTaskResult {
  TaskHandle?: string | undefined;
}
export interface TagQueueRequest {
  QueueUrl: string | undefined;
  Tags: Record<string, string> | undefined;
}
export interface UntagQueueRequest {
  QueueUrl: string | undefined;
  TagKeys: string[] | undefined;
}
