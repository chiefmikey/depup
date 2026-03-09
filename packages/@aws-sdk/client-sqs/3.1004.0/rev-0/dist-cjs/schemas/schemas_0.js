"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetQueueUrlRequest$ = exports.GetQueueAttributesResult$ = exports.GetQueueAttributesRequest$ = exports.DeleteQueueRequest$ = exports.DeleteMessageRequest$ = exports.DeleteMessageBatchResultEntry$ = exports.DeleteMessageBatchResult$ = exports.DeleteMessageBatchRequestEntry$ = exports.DeleteMessageBatchRequest$ = exports.CreateQueueResult$ = exports.CreateQueueRequest$ = exports.ChangeMessageVisibilityRequest$ = exports.ChangeMessageVisibilityBatchResultEntry$ = exports.ChangeMessageVisibilityBatchResult$ = exports.ChangeMessageVisibilityBatchRequestEntry$ = exports.ChangeMessageVisibilityBatchRequest$ = exports.CancelMessageMoveTaskResult$ = exports.CancelMessageMoveTaskRequest$ = exports.BatchResultErrorEntry$ = exports.AddPermissionRequest$ = exports.errorTypeRegistries = exports.UnsupportedOperation$ = exports.TooManyEntriesInBatchRequest$ = exports.ResourceNotFoundException$ = exports.RequestThrottled$ = exports.ReceiptHandleIsInvalid$ = exports.QueueNameExists$ = exports.QueueDoesNotExist$ = exports.QueueDeletedRecently$ = exports.PurgeQueueInProgress$ = exports.OverLimit$ = exports.MessageNotInflight$ = exports.KmsThrottled$ = exports.KmsOptInRequired$ = exports.KmsNotFound$ = exports.KmsInvalidState$ = exports.KmsInvalidKeyUsage$ = exports.KmsDisabled$ = exports.KmsAccessDenied$ = exports.InvalidSecurity$ = exports.InvalidMessageContents$ = exports.InvalidIdFormat$ = exports.InvalidBatchEntryId$ = exports.InvalidAttributeValue$ = exports.InvalidAttributeName$ = exports.InvalidAddress$ = exports.EmptyBatchRequest$ = exports.BatchRequestTooLong$ = exports.BatchEntryIdsNotDistinct$ = exports.SQSServiceException$ = void 0;
exports.TagQueue$ = exports.StartMessageMoveTask$ = exports.SetQueueAttributes$ = exports.SendMessageBatch$ = exports.SendMessage$ = exports.RemovePermission$ = exports.ReceiveMessage$ = exports.PurgeQueue$ = exports.ListQueueTags$ = exports.ListQueues$ = exports.ListMessageMoveTasks$ = exports.ListDeadLetterSourceQueues$ = exports.GetQueueUrl$ = exports.GetQueueAttributes$ = exports.DeleteQueue$ = exports.DeleteMessageBatch$ = exports.DeleteMessage$ = exports.CreateQueue$ = exports.ChangeMessageVisibilityBatch$ = exports.ChangeMessageVisibility$ = exports.CancelMessageMoveTask$ = exports.AddPermission$ = exports.UntagQueueRequest$ = exports.TagQueueRequest$ = exports.StartMessageMoveTaskResult$ = exports.StartMessageMoveTaskRequest$ = exports.SetQueueAttributesRequest$ = exports.SendMessageResult$ = exports.SendMessageRequest$ = exports.SendMessageBatchResultEntry$ = exports.SendMessageBatchResult$ = exports.SendMessageBatchRequestEntry$ = exports.SendMessageBatchRequest$ = exports.RemovePermissionRequest$ = exports.ReceiveMessageResult$ = exports.ReceiveMessageRequest$ = exports.PurgeQueueRequest$ = exports.MessageSystemAttributeValue$ = exports.MessageAttributeValue$ = exports.Message$ = exports.ListQueueTagsResult$ = exports.ListQueueTagsRequest$ = exports.ListQueuesResult$ = exports.ListQueuesRequest$ = exports.ListMessageMoveTasksResultEntry$ = exports.ListMessageMoveTasksResult$ = exports.ListMessageMoveTasksRequest$ = exports.ListDeadLetterSourceQueuesResult$ = exports.ListDeadLetterSourceQueuesRequest$ = exports.GetQueueUrlResult$ = void 0;
exports.UntagQueue$ = void 0;
const _A = "Actions";
const _AN = "ActionName";
const _ANOMM = "ApproximateNumberOfMessagesMoved";
const _ANOMTM = "ApproximateNumberOfMessagesToMove";
const _ANt = "AttributeNames";
const _ANtt = "AttributeName";
const _AP = "AddPermission";
const _APR = "AddPermissionRequest";
const _AWSAI = "AWSAccountIds";
const _AWSAIc = "AWSAccountId";
const _At = "Attributes";
const _Att = "Attribute";
const _B = "Body";
const _BEIND = "BatchEntryIdsNotDistinct";
const _BL = "BinaryList";
const _BLV = "BinaryListValues";
const _BLVi = "BinaryListValue";
const _BREE = "BatchResultErrorEntry";
const _BREEL = "BatchResultErrorEntryList";
const _BRTL = "BatchRequestTooLong";
const _BV = "BinaryValue";
const _C = "Code";
const _CMMT = "CancelMessageMoveTask";
const _CMMTR = "CancelMessageMoveTaskRequest";
const _CMMTRa = "CancelMessageMoveTaskResult";
const _CMV = "ChangeMessageVisibility";
const _CMVB = "ChangeMessageVisibilityBatch";
const _CMVBR = "ChangeMessageVisibilityBatchRequest";
const _CMVBRE = "ChangeMessageVisibilityBatchRequestEntry";
const _CMVBREL = "ChangeMessageVisibilityBatchRequestEntryList";
const _CMVBRELh = "ChangeMessageVisibilityBatchResultEntryList";
const _CMVBREh = "ChangeMessageVisibilityBatchResultEntry";
const _CMVBRh = "ChangeMessageVisibilityBatchResult";
const _CMVR = "ChangeMessageVisibilityRequest";
const _CQ = "CreateQueue";
const _CQR = "CreateQueueRequest";
const _CQRr = "CreateQueueResult";
const _DA = "DestinationArn";
const _DM = "DeleteMessage";
const _DMB = "DeleteMessageBatch";
const _DMBR = "DeleteMessageBatchRequest";
const _DMBRE = "DeleteMessageBatchRequestEntry";
const _DMBREL = "DeleteMessageBatchRequestEntryList";
const _DMBRELe = "DeleteMessageBatchResultEntryList";
const _DMBREe = "DeleteMessageBatchResultEntry";
const _DMBRe = "DeleteMessageBatchResult";
const _DMR = "DeleteMessageRequest";
const _DQ = "DeleteQueue";
const _DQR = "DeleteQueueRequest";
const _DS = "DelaySeconds";
const _DT = "DataType";
const _E = "Entries";
const _EBR = "EmptyBatchRequest";
const _F = "Failed";
const _FR = "FailureReason";
const _GQA = "GetQueueAttributes";
const _GQAR = "GetQueueAttributesRequest";
const _GQARe = "GetQueueAttributesResult";
const _GQU = "GetQueueUrl";
const _GQUR = "GetQueueUrlRequest";
const _GQURe = "GetQueueUrlResult";
const _I = "Id";
const _IA = "InvalidAddress";
const _IAN = "InvalidAttributeName";
const _IAV = "InvalidAttributeValue";
const _IBEI = "InvalidBatchEntryId";
const _IIF = "InvalidIdFormat";
const _IMC = "InvalidMessageContents";
const _IS = "InvalidSecurity";
const _K = "Key";
const _KAD = "KmsAccessDenied";
const _KD = "KmsDisabled";
const _KIKU = "KmsInvalidKeyUsage";
const _KIS = "KmsInvalidState";
const _KNF = "KmsNotFound";
const _KOIR = "KmsOptInRequired";
const _KT = "KmsThrottled";
const _L = "Label";
const _LDLSQ = "ListDeadLetterSourceQueues";
const _LDLSQR = "ListDeadLetterSourceQueuesRequest";
const _LDLSQRi = "ListDeadLetterSourceQueuesResult";
const _LMMT = "ListMessageMoveTasks";
const _LMMTR = "ListMessageMoveTasksRequest";
const _LMMTRE = "ListMessageMoveTasksResultEntry";
const _LMMTREL = "ListMessageMoveTasksResultEntryList";
const _LMMTRi = "ListMessageMoveTasksResult";
const _LQ = "ListQueues";
const _LQR = "ListQueuesRequest";
const _LQRi = "ListQueuesResult";
const _LQT = "ListQueueTags";
const _LQTR = "ListQueueTagsRequest";
const _LQTRi = "ListQueueTagsResult";
const _M = "Message";
const _MA = "MessageAttributes";
const _MAN = "MessageAttributeNames";
const _MANe = "MessageAttributeName";
const _MAV = "MessageAttributeValue";
const _MAe = "MessageAttribute";
const _MB = "MessageBody";
const _MBAM = "MessageBodyAttributeMap";
const _MBSAM = "MessageBodySystemAttributeMap";
const _MDI = "MessageDeduplicationId";
const _MDOB = "MD5OfBody";
const _MDOMA = "MD5OfMessageAttributes";
const _MDOMB = "MD5OfMessageBody";
const _MDOMSA = "MD5OfMessageSystemAttributes";
const _MGI = "MessageGroupId";
const _MI = "MessageId";
const _ML = "MessageList";
const _MNI = "MessageNotInflight";
const _MNOM = "MaxNumberOfMessages";
const _MNOMPS = "MaxNumberOfMessagesPerSecond";
const _MR = "MaxResults";
const _MSA = "MessageSystemAttributes";
const _MSAM = "MessageSystemAttributeMap";
const _MSAN = "MessageSystemAttributeNames";
const _MSAV = "MessageSystemAttributeValue";
const _MSAe = "MessageSystemAttribute";
const _Me = "Messages";
const _N = "Name";
const _NT = "NextToken";
const _OL = "OverLimit";
const _PQ = "PurgeQueue";
const _PQIP = "PurgeQueueInProgress";
const _PQR = "PurgeQueueRequest";
const _QAM = "QueueAttributeMap";
const _QDNE = "QueueDoesNotExist";
const _QDR = "QueueDeletedRecently";
const _QN = "QueueName";
const _QNE = "QueueNameExists";
const _QNP = "QueueNamePrefix";
const _QOAWSAI = "QueueOwnerAWSAccountId";
const _QU = "QueueUrl";
const _QUu = "QueueUrls";
const _R = "Results";
const _RH = "ReceiptHandle";
const _RHII = "ReceiptHandleIsInvalid";
const _RM = "ReceiveMessage";
const _RMR = "ReceiveMessageRequest";
const _RMRe = "ReceiveMessageResult";
const _RNFE = "ResourceNotFoundException";
const _RP = "RemovePermission";
const _RPR = "RemovePermissionRequest";
const _RRAI = "ReceiveRequestAttemptId";
const _RT = "RequestThrottled";
const _S = "Successful";
const _SA = "SourceArn";
const _SF = "SenderFault";
const _SL = "StringList";
const _SLV = "StringListValues";
const _SLVt = "StringListValue";
const _SM = "SendMessage";
const _SMB = "SendMessageBatch";
const _SMBR = "SendMessageBatchRequest";
const _SMBRE = "SendMessageBatchRequestEntry";
const _SMBREL = "SendMessageBatchRequestEntryList";
const _SMBRELe = "SendMessageBatchResultEntryList";
const _SMBREe = "SendMessageBatchResultEntry";
const _SMBRe = "SendMessageBatchResult";
const _SMMT = "StartMessageMoveTask";
const _SMMTR = "StartMessageMoveTaskRequest";
const _SMMTRt = "StartMessageMoveTaskResult";
const _SMR = "SendMessageRequest";
const _SMRe = "SendMessageResult";
const _SN = "SequenceNumber";
const _SQA = "SetQueueAttributes";
const _SQAR = "SetQueueAttributesRequest";
const _ST = "StartedTimestamp";
const _SV = "StringValue";
const _St = "Status";
const _T = "Tag";
const _TH = "TaskHandle";
const _TK = "TagKeys";
const _TKa = "TagKey";
const _TM = "TagMap";
const _TMEIBR = "TooManyEntriesInBatchRequest";
const _TQ = "TagQueue";
const _TQR = "TagQueueRequest";
const _Ta = "Tags";
const _UO = "UnsupportedOperation";
const _UQ = "UntagQueue";
const _UQR = "UntagQueueRequest";
const _V = "Value";
const _VT = "VisibilityTimeout";
const _WTS = "WaitTimeSeconds";
const _aQE = "awsQueryError";
const _c = "client";
const _e = "error";
const _hE = "httpError";
const _m = "message";
const _qU = "queueUrls";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.sqs";
const _t = "tags";
const _xF = "xmlFlattened";
const _xN = "xmlName";
const n0 = "com.amazonaws.sqs";
const schema_1 = require("@smithy/core/schema");
const errors_1 = require("../models/errors");
const SQSServiceException_1 = require("../models/SQSServiceException");
const _s_registry = schema_1.TypeRegistry.for(_s);
exports.SQSServiceException$ = [-3, _s, "SQSServiceException", 0, [], []];
_s_registry.registerError(exports.SQSServiceException$, SQSServiceException_1.SQSServiceException);
const n0_registry = schema_1.TypeRegistry.for(n0);
exports.BatchEntryIdsNotDistinct$ = [-3, n0, _BEIND,
    { [_aQE]: [`AWS.SimpleQueueService.BatchEntryIdsNotDistinct`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.BatchEntryIdsNotDistinct$, errors_1.BatchEntryIdsNotDistinct);
exports.BatchRequestTooLong$ = [-3, n0, _BRTL,
    { [_aQE]: [`AWS.SimpleQueueService.BatchRequestTooLong`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.BatchRequestTooLong$, errors_1.BatchRequestTooLong);
exports.EmptyBatchRequest$ = [-3, n0, _EBR,
    { [_aQE]: [`AWS.SimpleQueueService.EmptyBatchRequest`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.EmptyBatchRequest$, errors_1.EmptyBatchRequest);
exports.InvalidAddress$ = [-3, n0, _IA,
    { [_aQE]: [`InvalidAddress`, 404], [_e]: _c, [_hE]: 404 },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidAddress$, errors_1.InvalidAddress);
exports.InvalidAttributeName$ = [-3, n0, _IAN,
    { [_e]: _c },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidAttributeName$, errors_1.InvalidAttributeName);
exports.InvalidAttributeValue$ = [-3, n0, _IAV,
    { [_e]: _c },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidAttributeValue$, errors_1.InvalidAttributeValue);
exports.InvalidBatchEntryId$ = [-3, n0, _IBEI,
    { [_aQE]: [`AWS.SimpleQueueService.InvalidBatchEntryId`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidBatchEntryId$, errors_1.InvalidBatchEntryId);
exports.InvalidIdFormat$ = [-3, n0, _IIF,
    { [_e]: _c },
    [],
    []
];
n0_registry.registerError(exports.InvalidIdFormat$, errors_1.InvalidIdFormat);
exports.InvalidMessageContents$ = [-3, n0, _IMC,
    { [_e]: _c },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidMessageContents$, errors_1.InvalidMessageContents);
exports.InvalidSecurity$ = [-3, n0, _IS,
    { [_aQE]: [`InvalidSecurity`, 403], [_e]: _c, [_hE]: 403 },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidSecurity$, errors_1.InvalidSecurity);
exports.KmsAccessDenied$ = [-3, n0, _KAD,
    { [_aQE]: [`KMS.AccessDeniedException`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.KmsAccessDenied$, errors_1.KmsAccessDenied);
exports.KmsDisabled$ = [-3, n0, _KD,
    { [_aQE]: [`KMS.DisabledException`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.KmsDisabled$, errors_1.KmsDisabled);
exports.KmsInvalidKeyUsage$ = [-3, n0, _KIKU,
    { [_aQE]: [`KMS.InvalidKeyUsageException`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.KmsInvalidKeyUsage$, errors_1.KmsInvalidKeyUsage);
exports.KmsInvalidState$ = [-3, n0, _KIS,
    { [_aQE]: [`KMS.InvalidStateException`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.KmsInvalidState$, errors_1.KmsInvalidState);
exports.KmsNotFound$ = [-3, n0, _KNF,
    { [_aQE]: [`KMS.NotFoundException`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.KmsNotFound$, errors_1.KmsNotFound);
exports.KmsOptInRequired$ = [-3, n0, _KOIR,
    { [_aQE]: [`KMS.OptInRequired`, 403], [_e]: _c, [_hE]: 403 },
    [_m],
    [0]
];
n0_registry.registerError(exports.KmsOptInRequired$, errors_1.KmsOptInRequired);
exports.KmsThrottled$ = [-3, n0, _KT,
    { [_aQE]: [`KMS.ThrottlingException`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.KmsThrottled$, errors_1.KmsThrottled);
exports.MessageNotInflight$ = [-3, n0, _MNI,
    { [_aQE]: [`AWS.SimpleQueueService.MessageNotInflight`, 400], [_e]: _c, [_hE]: 400 },
    [],
    []
];
n0_registry.registerError(exports.MessageNotInflight$, errors_1.MessageNotInflight);
exports.OverLimit$ = [-3, n0, _OL,
    { [_aQE]: [`OverLimit`, 403], [_e]: _c, [_hE]: 403 },
    [_m],
    [0]
];
n0_registry.registerError(exports.OverLimit$, errors_1.OverLimit);
exports.PurgeQueueInProgress$ = [-3, n0, _PQIP,
    { [_aQE]: [`AWS.SimpleQueueService.PurgeQueueInProgress`, 403], [_e]: _c, [_hE]: 403 },
    [_m],
    [0]
];
n0_registry.registerError(exports.PurgeQueueInProgress$, errors_1.PurgeQueueInProgress);
exports.QueueDeletedRecently$ = [-3, n0, _QDR,
    { [_aQE]: [`AWS.SimpleQueueService.QueueDeletedRecently`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.QueueDeletedRecently$, errors_1.QueueDeletedRecently);
exports.QueueDoesNotExist$ = [-3, n0, _QDNE,
    { [_aQE]: [`AWS.SimpleQueueService.NonExistentQueue`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.QueueDoesNotExist$, errors_1.QueueDoesNotExist);
exports.QueueNameExists$ = [-3, n0, _QNE,
    { [_aQE]: [`QueueAlreadyExists`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.QueueNameExists$, errors_1.QueueNameExists);
exports.ReceiptHandleIsInvalid$ = [-3, n0, _RHII,
    { [_aQE]: [`ReceiptHandleIsInvalid`, 404], [_e]: _c, [_hE]: 404 },
    [_m],
    [0]
];
n0_registry.registerError(exports.ReceiptHandleIsInvalid$, errors_1.ReceiptHandleIsInvalid);
exports.RequestThrottled$ = [-3, n0, _RT,
    { [_aQE]: [`RequestThrottled`, 403], [_e]: _c, [_hE]: 403 },
    [_m],
    [0]
];
n0_registry.registerError(exports.RequestThrottled$, errors_1.RequestThrottled);
exports.ResourceNotFoundException$ = [-3, n0, _RNFE,
    { [_aQE]: [`ResourceNotFoundException`, 404], [_e]: _c, [_hE]: 404 },
    [_m],
    [0]
];
n0_registry.registerError(exports.ResourceNotFoundException$, errors_1.ResourceNotFoundException);
exports.TooManyEntriesInBatchRequest$ = [-3, n0, _TMEIBR,
    { [_aQE]: [`AWS.SimpleQueueService.TooManyEntriesInBatchRequest`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.TooManyEntriesInBatchRequest$, errors_1.TooManyEntriesInBatchRequest);
exports.UnsupportedOperation$ = [-3, n0, _UO,
    { [_aQE]: [`AWS.SimpleQueueService.UnsupportedOperation`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.UnsupportedOperation$, errors_1.UnsupportedOperation);
exports.errorTypeRegistries = [
    _s_registry,
    n0_registry,
];
exports.AddPermissionRequest$ = [3, n0, _APR,
    0,
    [_QU, _L, _AWSAI, _A],
    [0, 0, [64 | 0, { [_xF]: 1, [_xN]: _AWSAIc }], [64 | 0, { [_xF]: 1, [_xN]: _AN }]], 4
];
exports.BatchResultErrorEntry$ = [3, n0, _BREE,
    0,
    [_I, _SF, _C, _M],
    [0, 2, 0, 0], 3
];
exports.CancelMessageMoveTaskRequest$ = [3, n0, _CMMTR,
    0,
    [_TH],
    [0], 1
];
exports.CancelMessageMoveTaskResult$ = [3, n0, _CMMTRa,
    0,
    [_ANOMM],
    [1]
];
exports.ChangeMessageVisibilityBatchRequest$ = [3, n0, _CMVBR,
    0,
    [_QU, _E],
    [0, [() => ChangeMessageVisibilityBatchRequestEntryList, { [_xF]: 1, [_xN]: _CMVBRE }]], 2
];
exports.ChangeMessageVisibilityBatchRequestEntry$ = [3, n0, _CMVBRE,
    0,
    [_I, _RH, _VT],
    [0, 0, 1], 2
];
exports.ChangeMessageVisibilityBatchResult$ = [3, n0, _CMVBRh,
    0,
    [_S, _F],
    [[() => ChangeMessageVisibilityBatchResultEntryList, { [_xF]: 1, [_xN]: _CMVBREh }], [() => BatchResultErrorEntryList, { [_xF]: 1, [_xN]: _BREE }]], 2
];
exports.ChangeMessageVisibilityBatchResultEntry$ = [3, n0, _CMVBREh,
    0,
    [_I],
    [0], 1
];
exports.ChangeMessageVisibilityRequest$ = [3, n0, _CMVR,
    0,
    [_QU, _RH, _VT],
    [0, 0, 1], 3
];
exports.CreateQueueRequest$ = [3, n0, _CQR,
    0,
    [_QN, _At, _t],
    [0, [() => QueueAttributeMap, { [_xF]: 1, [_xN]: _Att }], [() => TagMap, { [_xF]: 1, [_xN]: _T }]], 1
];
exports.CreateQueueResult$ = [3, n0, _CQRr,
    0,
    [_QU],
    [0]
];
exports.DeleteMessageBatchRequest$ = [3, n0, _DMBR,
    0,
    [_QU, _E],
    [0, [() => DeleteMessageBatchRequestEntryList, { [_xF]: 1, [_xN]: _DMBRE }]], 2
];
exports.DeleteMessageBatchRequestEntry$ = [3, n0, _DMBRE,
    0,
    [_I, _RH],
    [0, 0], 2
];
exports.DeleteMessageBatchResult$ = [3, n0, _DMBRe,
    0,
    [_S, _F],
    [[() => DeleteMessageBatchResultEntryList, { [_xF]: 1, [_xN]: _DMBREe }], [() => BatchResultErrorEntryList, { [_xF]: 1, [_xN]: _BREE }]], 2
];
exports.DeleteMessageBatchResultEntry$ = [3, n0, _DMBREe,
    0,
    [_I],
    [0], 1
];
exports.DeleteMessageRequest$ = [3, n0, _DMR,
    0,
    [_QU, _RH],
    [0, 0], 2
];
exports.DeleteQueueRequest$ = [3, n0, _DQR,
    0,
    [_QU],
    [0], 1
];
exports.GetQueueAttributesRequest$ = [3, n0, _GQAR,
    0,
    [_QU, _ANt],
    [0, [64 | 0, { [_xF]: 1, [_xN]: _ANtt }]], 1
];
exports.GetQueueAttributesResult$ = [3, n0, _GQARe,
    0,
    [_At],
    [[() => QueueAttributeMap, { [_xF]: 1, [_xN]: _Att }]]
];
exports.GetQueueUrlRequest$ = [3, n0, _GQUR,
    0,
    [_QN, _QOAWSAI],
    [0, 0], 1
];
exports.GetQueueUrlResult$ = [3, n0, _GQURe,
    0,
    [_QU],
    [0]
];
exports.ListDeadLetterSourceQueuesRequest$ = [3, n0, _LDLSQR,
    0,
    [_QU, _NT, _MR],
    [0, 0, 1], 1
];
exports.ListDeadLetterSourceQueuesResult$ = [3, n0, _LDLSQRi,
    0,
    [_qU, _NT],
    [[64 | 0, { [_xF]: 1, [_xN]: _QU }], 0], 1
];
exports.ListMessageMoveTasksRequest$ = [3, n0, _LMMTR,
    0,
    [_SA, _MR],
    [0, 1], 1
];
exports.ListMessageMoveTasksResult$ = [3, n0, _LMMTRi,
    { [_xN]: _LMMTRi },
    [_R],
    [[() => ListMessageMoveTasksResultEntryList, { [_xF]: 1, [_xN]: _LMMTRE }]]
];
exports.ListMessageMoveTasksResultEntry$ = [3, n0, _LMMTRE,
    0,
    [_TH, _St, _SA, _DA, _MNOMPS, _ANOMM, _ANOMTM, _FR, _ST],
    [0, 0, 0, 0, 1, 1, 1, 0, 1]
];
exports.ListQueuesRequest$ = [3, n0, _LQR,
    0,
    [_QNP, _NT, _MR],
    [0, 0, 1]
];
exports.ListQueuesResult$ = [3, n0, _LQRi,
    0,
    [_QUu, _NT],
    [[64 | 0, { [_xF]: 1, [_xN]: _QU }], 0]
];
exports.ListQueueTagsRequest$ = [3, n0, _LQTR,
    0,
    [_QU],
    [0], 1
];
exports.ListQueueTagsResult$ = [3, n0, _LQTRi,
    0,
    [_Ta],
    [[() => TagMap, { [_xF]: 1, [_xN]: _T }]]
];
exports.Message$ = [3, n0, _M,
    0,
    [_MI, _RH, _MDOB, _B, _At, _MDOMA, _MA],
    [0, 0, 0, 0, [() => MessageSystemAttributeMap, { [_xF]: 1, [_xN]: _Att }], 0, [() => MessageBodyAttributeMap, { [_xF]: 1, [_xN]: _MAe }]]
];
exports.MessageAttributeValue$ = [3, n0, _MAV,
    0,
    [_DT, _SV, _BV, _SLV, _BLV],
    [0, 0, 21, [() => StringList, { [_xF]: 1, [_xN]: _SLVt }], [() => BinaryList, { [_xF]: 1, [_xN]: _BLVi }]], 1
];
exports.MessageSystemAttributeValue$ = [3, n0, _MSAV,
    0,
    [_DT, _SV, _BV, _SLV, _BLV],
    [0, 0, 21, [() => StringList, { [_xF]: 1, [_xN]: _SLVt }], [() => BinaryList, { [_xF]: 1, [_xN]: _BLVi }]], 1
];
exports.PurgeQueueRequest$ = [3, n0, _PQR,
    0,
    [_QU],
    [0], 1
];
exports.ReceiveMessageRequest$ = [3, n0, _RMR,
    0,
    [_QU, _ANt, _MSAN, _MAN, _MNOM, _VT, _WTS, _RRAI],
    [0, [64 | 0, { [_xF]: 1, [_xN]: _ANtt }], [64 | 0, { [_xF]: 1, [_xN]: _ANtt }], [64 | 0, { [_xF]: 1, [_xN]: _MANe }], 1, 1, 1, 0], 1
];
exports.ReceiveMessageResult$ = [3, n0, _RMRe,
    0,
    [_Me],
    [[() => MessageList, { [_xF]: 1, [_xN]: _M }]]
];
exports.RemovePermissionRequest$ = [3, n0, _RPR,
    0,
    [_QU, _L],
    [0, 0], 2
];
exports.SendMessageBatchRequest$ = [3, n0, _SMBR,
    0,
    [_QU, _E],
    [0, [() => SendMessageBatchRequestEntryList, { [_xF]: 1, [_xN]: _SMBRE }]], 2
];
exports.SendMessageBatchRequestEntry$ = [3, n0, _SMBRE,
    0,
    [_I, _MB, _DS, _MA, _MSA, _MDI, _MGI],
    [0, 0, 1, [() => MessageBodyAttributeMap, { [_xF]: 1, [_xN]: _MAe }], [() => MessageBodySystemAttributeMap, { [_xF]: 1, [_xN]: _MSAe }], 0, 0], 2
];
exports.SendMessageBatchResult$ = [3, n0, _SMBRe,
    0,
    [_S, _F],
    [[() => SendMessageBatchResultEntryList, { [_xF]: 1, [_xN]: _SMBREe }], [() => BatchResultErrorEntryList, { [_xF]: 1, [_xN]: _BREE }]], 2
];
exports.SendMessageBatchResultEntry$ = [3, n0, _SMBREe,
    0,
    [_I, _MI, _MDOMB, _MDOMA, _MDOMSA, _SN],
    [0, 0, 0, 0, 0, 0], 3
];
exports.SendMessageRequest$ = [3, n0, _SMR,
    0,
    [_QU, _MB, _DS, _MA, _MSA, _MDI, _MGI],
    [0, 0, 1, [() => MessageBodyAttributeMap, { [_xF]: 1, [_xN]: _MAe }], [() => MessageBodySystemAttributeMap, { [_xF]: 1, [_xN]: _MSAe }], 0, 0], 2
];
exports.SendMessageResult$ = [3, n0, _SMRe,
    0,
    [_MDOMB, _MDOMA, _MDOMSA, _MI, _SN],
    [0, 0, 0, 0, 0]
];
exports.SetQueueAttributesRequest$ = [3, n0, _SQAR,
    0,
    [_QU, _At],
    [0, [() => QueueAttributeMap, { [_xF]: 1, [_xN]: _Att }]], 2
];
exports.StartMessageMoveTaskRequest$ = [3, n0, _SMMTR,
    0,
    [_SA, _DA, _MNOMPS],
    [0, 0, 1], 1
];
exports.StartMessageMoveTaskResult$ = [3, n0, _SMMTRt,
    0,
    [_TH],
    [0]
];
exports.TagQueueRequest$ = [3, n0, _TQR,
    0,
    [_QU, _Ta],
    [0, [() => TagMap, { [_xF]: 1, [_xN]: _T }]], 2
];
exports.UntagQueueRequest$ = [3, n0, _UQR,
    0,
    [_QU, _TK],
    [0, [64 | 0, { [_xF]: 1, [_xN]: _TKa }]], 2
];
var __Unit = "unit";
var ActionNameList = 64 | 0;
var AttributeNameList = 64 | 0;
var AWSAccountIdList = 64 | 0;
var BatchResultErrorEntryList = [1, n0, _BREEL,
    0, () => exports.BatchResultErrorEntry$
];
var BinaryList = [1, n0, _BL,
    0, [21,
        { [_xN]: _BLVi }]
];
var ChangeMessageVisibilityBatchRequestEntryList = [1, n0, _CMVBREL,
    0, () => exports.ChangeMessageVisibilityBatchRequestEntry$
];
var ChangeMessageVisibilityBatchResultEntryList = [1, n0, _CMVBRELh,
    0, () => exports.ChangeMessageVisibilityBatchResultEntry$
];
var DeleteMessageBatchRequestEntryList = [1, n0, _DMBREL,
    0, () => exports.DeleteMessageBatchRequestEntry$
];
var DeleteMessageBatchResultEntryList = [1, n0, _DMBRELe,
    0, () => exports.DeleteMessageBatchResultEntry$
];
var ListMessageMoveTasksResultEntryList = [1, n0, _LMMTREL,
    0, () => exports.ListMessageMoveTasksResultEntry$
];
var MessageAttributeNameList = 64 | 0;
var MessageList = [1, n0, _ML,
    0, [() => exports.Message$,
        0]
];
var MessageSystemAttributeList = 64 | 0;
var QueueUrlList = 64 | 0;
var SendMessageBatchRequestEntryList = [1, n0, _SMBREL,
    0, [() => exports.SendMessageBatchRequestEntry$,
        0]
];
var SendMessageBatchResultEntryList = [1, n0, _SMBRELe,
    0, () => exports.SendMessageBatchResultEntry$
];
var StringList = [1, n0, _SL,
    0, [0,
        { [_xN]: _SLVt }]
];
var TagKeyList = 64 | 0;
var MessageBodyAttributeMap = [2, n0, _MBAM,
    0, [0,
        { [_xN]: _N }],
    [() => exports.MessageAttributeValue$,
        { [_xN]: _V }]
];
var MessageBodySystemAttributeMap = [2, n0, _MBSAM,
    0, [0,
        { [_xN]: _N }],
    [() => exports.MessageSystemAttributeValue$,
        { [_xN]: _V }]
];
var MessageSystemAttributeMap = [2, n0, _MSAM,
    0, [0,
        { [_xN]: _N }],
    [0,
        { [_xN]: _V }]
];
var QueueAttributeMap = [2, n0, _QAM,
    0, [0,
        { [_xN]: _N }],
    [0,
        { [_xN]: _V }]
];
var TagMap = [2, n0, _TM,
    0, [0,
        { [_xN]: _K }],
    [0,
        { [_xN]: _V }]
];
exports.AddPermission$ = [9, n0, _AP,
    0, () => exports.AddPermissionRequest$, () => __Unit
];
exports.CancelMessageMoveTask$ = [9, n0, _CMMT,
    0, () => exports.CancelMessageMoveTaskRequest$, () => exports.CancelMessageMoveTaskResult$
];
exports.ChangeMessageVisibility$ = [9, n0, _CMV,
    0, () => exports.ChangeMessageVisibilityRequest$, () => __Unit
];
exports.ChangeMessageVisibilityBatch$ = [9, n0, _CMVB,
    0, () => exports.ChangeMessageVisibilityBatchRequest$, () => exports.ChangeMessageVisibilityBatchResult$
];
exports.CreateQueue$ = [9, n0, _CQ,
    0, () => exports.CreateQueueRequest$, () => exports.CreateQueueResult$
];
exports.DeleteMessage$ = [9, n0, _DM,
    0, () => exports.DeleteMessageRequest$, () => __Unit
];
exports.DeleteMessageBatch$ = [9, n0, _DMB,
    0, () => exports.DeleteMessageBatchRequest$, () => exports.DeleteMessageBatchResult$
];
exports.DeleteQueue$ = [9, n0, _DQ,
    0, () => exports.DeleteQueueRequest$, () => __Unit
];
exports.GetQueueAttributes$ = [9, n0, _GQA,
    0, () => exports.GetQueueAttributesRequest$, () => exports.GetQueueAttributesResult$
];
exports.GetQueueUrl$ = [9, n0, _GQU,
    0, () => exports.GetQueueUrlRequest$, () => exports.GetQueueUrlResult$
];
exports.ListDeadLetterSourceQueues$ = [9, n0, _LDLSQ,
    0, () => exports.ListDeadLetterSourceQueuesRequest$, () => exports.ListDeadLetterSourceQueuesResult$
];
exports.ListMessageMoveTasks$ = [9, n0, _LMMT,
    0, () => exports.ListMessageMoveTasksRequest$, () => exports.ListMessageMoveTasksResult$
];
exports.ListQueues$ = [9, n0, _LQ,
    0, () => exports.ListQueuesRequest$, () => exports.ListQueuesResult$
];
exports.ListQueueTags$ = [9, n0, _LQT,
    0, () => exports.ListQueueTagsRequest$, () => exports.ListQueueTagsResult$
];
exports.PurgeQueue$ = [9, n0, _PQ,
    0, () => exports.PurgeQueueRequest$, () => __Unit
];
exports.ReceiveMessage$ = [9, n0, _RM,
    0, () => exports.ReceiveMessageRequest$, () => exports.ReceiveMessageResult$
];
exports.RemovePermission$ = [9, n0, _RP,
    0, () => exports.RemovePermissionRequest$, () => __Unit
];
exports.SendMessage$ = [9, n0, _SM,
    0, () => exports.SendMessageRequest$, () => exports.SendMessageResult$
];
exports.SendMessageBatch$ = [9, n0, _SMB,
    0, () => exports.SendMessageBatchRequest$, () => exports.SendMessageBatchResult$
];
exports.SetQueueAttributes$ = [9, n0, _SQA,
    0, () => exports.SetQueueAttributesRequest$, () => __Unit
];
exports.StartMessageMoveTask$ = [9, n0, _SMMT,
    0, () => exports.StartMessageMoveTaskRequest$, () => exports.StartMessageMoveTaskResult$
];
exports.TagQueue$ = [9, n0, _TQ,
    0, () => exports.TagQueueRequest$, () => __Unit
];
exports.UntagQueue$ = [9, n0, _UQ,
    0, () => exports.UntagQueueRequest$, () => __Unit
];
