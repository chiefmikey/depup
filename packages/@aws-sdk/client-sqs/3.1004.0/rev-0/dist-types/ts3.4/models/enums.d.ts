export declare const QueueAttributeName: {
  readonly All: "All";
  readonly ApproximateNumberOfMessages: "ApproximateNumberOfMessages";
  readonly ApproximateNumberOfMessagesDelayed: "ApproximateNumberOfMessagesDelayed";
  readonly ApproximateNumberOfMessagesNotVisible: "ApproximateNumberOfMessagesNotVisible";
  readonly ContentBasedDeduplication: "ContentBasedDeduplication";
  readonly CreatedTimestamp: "CreatedTimestamp";
  readonly DeduplicationScope: "DeduplicationScope";
  readonly DelaySeconds: "DelaySeconds";
  readonly FifoQueue: "FifoQueue";
  readonly FifoThroughputLimit: "FifoThroughputLimit";
  readonly KmsDataKeyReusePeriodSeconds: "KmsDataKeyReusePeriodSeconds";
  readonly KmsMasterKeyId: "KmsMasterKeyId";
  readonly LastModifiedTimestamp: "LastModifiedTimestamp";
  readonly MaximumMessageSize: "MaximumMessageSize";
  readonly MessageRetentionPeriod: "MessageRetentionPeriod";
  readonly Policy: "Policy";
  readonly QueueArn: "QueueArn";
  readonly ReceiveMessageWaitTimeSeconds: "ReceiveMessageWaitTimeSeconds";
  readonly RedriveAllowPolicy: "RedriveAllowPolicy";
  readonly RedrivePolicy: "RedrivePolicy";
  readonly SqsManagedSseEnabled: "SqsManagedSseEnabled";
  readonly VisibilityTimeout: "VisibilityTimeout";
};
export type QueueAttributeName =
  (typeof QueueAttributeName)[keyof typeof QueueAttributeName];
export declare const MessageSystemAttributeName: {
  readonly AWSTraceHeader: "AWSTraceHeader";
  readonly All: "All";
  readonly ApproximateFirstReceiveTimestamp: "ApproximateFirstReceiveTimestamp";
  readonly ApproximateReceiveCount: "ApproximateReceiveCount";
  readonly DeadLetterQueueSourceArn: "DeadLetterQueueSourceArn";
  readonly MessageDeduplicationId: "MessageDeduplicationId";
  readonly MessageGroupId: "MessageGroupId";
  readonly SenderId: "SenderId";
  readonly SentTimestamp: "SentTimestamp";
  readonly SequenceNumber: "SequenceNumber";
};
export type MessageSystemAttributeName =
  (typeof MessageSystemAttributeName)[keyof typeof MessageSystemAttributeName];
export declare const MessageSystemAttributeNameForSends: {
  readonly AWSTraceHeader: "AWSTraceHeader";
};
export type MessageSystemAttributeNameForSends =
  (typeof MessageSystemAttributeNameForSends)[keyof typeof MessageSystemAttributeNameForSends];
