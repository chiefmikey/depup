"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateConfigurationSetEventDestinationRequest$ = exports.Content$ = exports.ConnectAction$ = exports.ConfigurationSet$ = exports.CloudWatchDimensionConfiguration$ = exports.CloudWatchDestination$ = exports.CloneReceiptRuleSetResponse$ = exports.CloneReceiptRuleSetRequest$ = exports.BulkEmailDestinationStatus$ = exports.BulkEmailDestination$ = exports.BouncedRecipientInfo$ = exports.BounceAction$ = exports.Body$ = exports.AddHeaderAction$ = exports.errorTypeRegistries = exports.TrackingOptionsDoesNotExistException$ = exports.TrackingOptionsAlreadyExistsException$ = exports.TemplateDoesNotExistException$ = exports.RuleSetDoesNotExistException$ = exports.RuleDoesNotExistException$ = exports.ProductionAccessNotGrantedException$ = exports.MissingRenderingAttributeException$ = exports.MessageRejected$ = exports.MailFromDomainNotVerifiedException$ = exports.LimitExceededException$ = exports.InvalidTrackingOptionsException$ = exports.InvalidTemplateException$ = exports.InvalidSnsTopicException$ = exports.InvalidSNSDestinationException$ = exports.InvalidS3ConfigurationException$ = exports.InvalidRenderingParameterException$ = exports.InvalidPolicyException$ = exports.InvalidLambdaFunctionException$ = exports.InvalidFirehoseDestinationException$ = exports.InvalidDeliveryOptionsException$ = exports.InvalidConfigurationSetException$ = exports.InvalidCloudWatchDestinationException$ = exports.FromEmailAddressNotVerifiedException$ = exports.EventDestinationDoesNotExistException$ = exports.EventDestinationAlreadyExistsException$ = exports.CustomVerificationEmailTemplateDoesNotExistException$ = exports.CustomVerificationEmailTemplateAlreadyExistsException$ = exports.CustomVerificationEmailInvalidContentException$ = exports.ConfigurationSetSendingPausedException$ = exports.ConfigurationSetDoesNotExistException$ = exports.ConfigurationSetAlreadyExistsException$ = exports.CannotDeleteException$ = exports.AlreadyExistsException$ = exports.AccountSendingPausedException$ = exports.SESServiceException$ = void 0;
exports.GetCustomVerificationEmailTemplateResponse$ = exports.GetCustomVerificationEmailTemplateRequest$ = exports.GetAccountSendingEnabledResponse$ = exports.ExtensionField$ = exports.EventDestination$ = exports.Destination$ = exports.DescribeReceiptRuleSetResponse$ = exports.DescribeReceiptRuleSetRequest$ = exports.DescribeReceiptRuleResponse$ = exports.DescribeReceiptRuleRequest$ = exports.DescribeConfigurationSetResponse$ = exports.DescribeConfigurationSetRequest$ = exports.DescribeActiveReceiptRuleSetResponse$ = exports.DescribeActiveReceiptRuleSetRequest$ = exports.DeliveryOptions$ = exports.DeleteVerifiedEmailAddressRequest$ = exports.DeleteTemplateResponse$ = exports.DeleteTemplateRequest$ = exports.DeleteReceiptRuleSetResponse$ = exports.DeleteReceiptRuleSetRequest$ = exports.DeleteReceiptRuleResponse$ = exports.DeleteReceiptRuleRequest$ = exports.DeleteReceiptFilterResponse$ = exports.DeleteReceiptFilterRequest$ = exports.DeleteIdentityResponse$ = exports.DeleteIdentityRequest$ = exports.DeleteIdentityPolicyResponse$ = exports.DeleteIdentityPolicyRequest$ = exports.DeleteCustomVerificationEmailTemplateRequest$ = exports.DeleteConfigurationSetTrackingOptionsResponse$ = exports.DeleteConfigurationSetTrackingOptionsRequest$ = exports.DeleteConfigurationSetResponse$ = exports.DeleteConfigurationSetRequest$ = exports.DeleteConfigurationSetEventDestinationResponse$ = exports.DeleteConfigurationSetEventDestinationRequest$ = exports.CustomVerificationEmailTemplate$ = exports.CreateTemplateResponse$ = exports.CreateTemplateRequest$ = exports.CreateReceiptRuleSetResponse$ = exports.CreateReceiptRuleSetRequest$ = exports.CreateReceiptRuleResponse$ = exports.CreateReceiptRuleRequest$ = exports.CreateReceiptFilterResponse$ = exports.CreateReceiptFilterRequest$ = exports.CreateCustomVerificationEmailTemplateRequest$ = exports.CreateConfigurationSetTrackingOptionsResponse$ = exports.CreateConfigurationSetTrackingOptionsRequest$ = exports.CreateConfigurationSetResponse$ = exports.CreateConfigurationSetRequest$ = exports.CreateConfigurationSetEventDestinationResponse$ = void 0;
exports.ReorderReceiptRuleSetRequest$ = exports.RecipientDsnFields$ = exports.ReceiptRuleSetMetadata$ = exports.ReceiptRule$ = exports.ReceiptIpFilter$ = exports.ReceiptFilter$ = exports.ReceiptAction$ = exports.RawMessage$ = exports.PutIdentityPolicyResponse$ = exports.PutIdentityPolicyRequest$ = exports.PutConfigurationSetDeliveryOptionsResponse$ = exports.PutConfigurationSetDeliveryOptionsRequest$ = exports.MessageTag$ = exports.MessageDsn$ = exports.Message$ = exports.ListVerifiedEmailAddressesResponse$ = exports.ListTemplatesResponse$ = exports.ListTemplatesRequest$ = exports.ListReceiptRuleSetsResponse$ = exports.ListReceiptRuleSetsRequest$ = exports.ListReceiptFiltersResponse$ = exports.ListReceiptFiltersRequest$ = exports.ListIdentityPoliciesResponse$ = exports.ListIdentityPoliciesRequest$ = exports.ListIdentitiesResponse$ = exports.ListIdentitiesRequest$ = exports.ListCustomVerificationEmailTemplatesResponse$ = exports.ListCustomVerificationEmailTemplatesRequest$ = exports.ListConfigurationSetsResponse$ = exports.ListConfigurationSetsRequest$ = exports.LambdaAction$ = exports.KinesisFirehoseDestination$ = exports.IdentityVerificationAttributes$ = exports.IdentityNotificationAttributes$ = exports.IdentityMailFromDomainAttributes$ = exports.IdentityDkimAttributes$ = exports.GetTemplateResponse$ = exports.GetTemplateRequest$ = exports.GetSendStatisticsResponse$ = exports.GetSendQuotaResponse$ = exports.GetIdentityVerificationAttributesResponse$ = exports.GetIdentityVerificationAttributesRequest$ = exports.GetIdentityPoliciesResponse$ = exports.GetIdentityPoliciesRequest$ = exports.GetIdentityNotificationAttributesResponse$ = exports.GetIdentityNotificationAttributesRequest$ = exports.GetIdentityMailFromDomainAttributesResponse$ = exports.GetIdentityMailFromDomainAttributesRequest$ = exports.GetIdentityDkimAttributesResponse$ = exports.GetIdentityDkimAttributesRequest$ = void 0;
exports.UpdateTemplateResponse$ = exports.UpdateTemplateRequest$ = exports.UpdateReceiptRuleResponse$ = exports.UpdateReceiptRuleRequest$ = exports.UpdateCustomVerificationEmailTemplateRequest$ = exports.UpdateConfigurationSetTrackingOptionsResponse$ = exports.UpdateConfigurationSetTrackingOptionsRequest$ = exports.UpdateConfigurationSetSendingEnabledRequest$ = exports.UpdateConfigurationSetReputationMetricsEnabledRequest$ = exports.UpdateConfigurationSetEventDestinationResponse$ = exports.UpdateConfigurationSetEventDestinationRequest$ = exports.UpdateAccountSendingEnabledRequest$ = exports.TrackingOptions$ = exports.TestRenderTemplateResponse$ = exports.TestRenderTemplateRequest$ = exports.TemplateMetadata$ = exports.Template$ = exports.StopAction$ = exports.SNSDestination$ = exports.SNSAction$ = exports.SetReceiptRulePositionResponse$ = exports.SetReceiptRulePositionRequest$ = exports.SetIdentityNotificationTopicResponse$ = exports.SetIdentityNotificationTopicRequest$ = exports.SetIdentityMailFromDomainResponse$ = exports.SetIdentityMailFromDomainRequest$ = exports.SetIdentityHeadersInNotificationsEnabledResponse$ = exports.SetIdentityHeadersInNotificationsEnabledRequest$ = exports.SetIdentityFeedbackForwardingEnabledResponse$ = exports.SetIdentityFeedbackForwardingEnabledRequest$ = exports.SetIdentityDkimEnabledResponse$ = exports.SetIdentityDkimEnabledRequest$ = exports.SetActiveReceiptRuleSetResponse$ = exports.SetActiveReceiptRuleSetRequest$ = exports.SendTemplatedEmailResponse$ = exports.SendTemplatedEmailRequest$ = exports.SendRawEmailResponse$ = exports.SendRawEmailRequest$ = exports.SendEmailResponse$ = exports.SendEmailRequest$ = exports.SendDataPoint$ = exports.SendCustomVerificationEmailResponse$ = exports.SendCustomVerificationEmailRequest$ = exports.SendBulkTemplatedEmailResponse$ = exports.SendBulkTemplatedEmailRequest$ = exports.SendBounceResponse$ = exports.SendBounceRequest$ = exports.S3Action$ = exports.ReputationOptions$ = exports.ReorderReceiptRuleSetResponse$ = void 0;
exports.ListVerifiedEmailAddresses$ = exports.ListTemplates$ = exports.ListReceiptRuleSets$ = exports.ListReceiptFilters$ = exports.ListIdentityPolicies$ = exports.ListIdentities$ = exports.ListCustomVerificationEmailTemplates$ = exports.ListConfigurationSets$ = exports.GetTemplate$ = exports.GetSendStatistics$ = exports.GetSendQuota$ = exports.GetIdentityVerificationAttributes$ = exports.GetIdentityPolicies$ = exports.GetIdentityNotificationAttributes$ = exports.GetIdentityMailFromDomainAttributes$ = exports.GetIdentityDkimAttributes$ = exports.GetCustomVerificationEmailTemplate$ = exports.GetAccountSendingEnabled$ = exports.DescribeReceiptRuleSet$ = exports.DescribeReceiptRule$ = exports.DescribeConfigurationSet$ = exports.DescribeActiveReceiptRuleSet$ = exports.DeleteVerifiedEmailAddress$ = exports.DeleteTemplate$ = exports.DeleteReceiptRuleSet$ = exports.DeleteReceiptRule$ = exports.DeleteReceiptFilter$ = exports.DeleteIdentityPolicy$ = exports.DeleteIdentity$ = exports.DeleteCustomVerificationEmailTemplate$ = exports.DeleteConfigurationSetTrackingOptions$ = exports.DeleteConfigurationSetEventDestination$ = exports.DeleteConfigurationSet$ = exports.CreateTemplate$ = exports.CreateReceiptRuleSet$ = exports.CreateReceiptRule$ = exports.CreateReceiptFilter$ = exports.CreateCustomVerificationEmailTemplate$ = exports.CreateConfigurationSetTrackingOptions$ = exports.CreateConfigurationSetEventDestination$ = exports.CreateConfigurationSet$ = exports.CloneReceiptRuleSet$ = exports.WorkmailAction$ = exports.VerifyEmailIdentityResponse$ = exports.VerifyEmailIdentityRequest$ = exports.VerifyEmailAddressRequest$ = exports.VerifyDomainIdentityResponse$ = exports.VerifyDomainIdentityRequest$ = exports.VerifyDomainDkimResponse$ = exports.VerifyDomainDkimRequest$ = void 0;
exports.VerifyEmailIdentity$ = exports.VerifyEmailAddress$ = exports.VerifyDomainIdentity$ = exports.VerifyDomainDkim$ = exports.UpdateTemplate$ = exports.UpdateReceiptRule$ = exports.UpdateCustomVerificationEmailTemplate$ = exports.UpdateConfigurationSetTrackingOptions$ = exports.UpdateConfigurationSetSendingEnabled$ = exports.UpdateConfigurationSetReputationMetricsEnabled$ = exports.UpdateConfigurationSetEventDestination$ = exports.UpdateAccountSendingEnabled$ = exports.TestRenderTemplate$ = exports.SetReceiptRulePosition$ = exports.SetIdentityNotificationTopic$ = exports.SetIdentityMailFromDomain$ = exports.SetIdentityHeadersInNotificationsEnabled$ = exports.SetIdentityFeedbackForwardingEnabled$ = exports.SetIdentityDkimEnabled$ = exports.SetActiveReceiptRuleSet$ = exports.SendTemplatedEmail$ = exports.SendRawEmail$ = exports.SendEmail$ = exports.SendCustomVerificationEmail$ = exports.SendBulkTemplatedEmail$ = exports.SendBounce$ = exports.ReorderReceiptRuleSet$ = exports.PutIdentityPolicy$ = exports.PutConfigurationSetDeliveryOptions$ = void 0;
const _A = "After";
const _AD = "ArrivalDate";
const _AEE = "AlreadyExistsException";
const _AHA = "AddHeaderAction";
const _ASPE = "AccountSendingPausedException";
const _Ac = "Actions";
const _Act = "Action";
const _B = "Bucket";
const _BA = "BounceAction";
const _BAc = "BccAddresses";
const _BED = "BulkEmailDestination";
const _BEDL = "BulkEmailDestinationList";
const _BEDS = "BulkEmailDestinationStatus";
const _BEDSL = "BulkEmailDestinationStatusList";
const _BN = "BucketName";
const _BOMXF = "BehaviorOnMXFailure";
const _BRI = "BouncedRecipientInfo";
const _BRIL = "BouncedRecipientInfoList";
const _BS = "BounceSender";
const _BSA = "BounceSenderArn";
const _BT = "BounceType";
const _BTo = "BounceTopic";
const _Bo = "Body";
const _Bou = "Bounces";
const _C = "Content";
const _CA = "ConnectAction";
const _CAc = "CcAddresses";
const _CCS = "CreateConfigurationSet";
const _CCSED = "CreateConfigurationSetEventDestination";
const _CCSEDR = "CreateConfigurationSetEventDestinationRequest";
const _CCSEDRr = "CreateConfigurationSetEventDestinationResponse";
const _CCSR = "CreateConfigurationSetRequest";
const _CCSRr = "CreateConfigurationSetResponse";
const _CCSTO = "CreateConfigurationSetTrackingOptions";
const _CCSTOR = "CreateConfigurationSetTrackingOptionsRequest";
const _CCSTORr = "CreateConfigurationSetTrackingOptionsResponse";
const _CCVET = "CreateCustomVerificationEmailTemplate";
const _CCVETR = "CreateCustomVerificationEmailTemplateRequest";
const _CDE = "CannotDeleteException";
const _CRD = "CustomRedirectDomain";
const _CRF = "CreateReceiptFilter";
const _CRFR = "CreateReceiptFilterRequest";
const _CRFRr = "CreateReceiptFilterResponse";
const _CRR = "CreateReceiptRule";
const _CRRR = "CreateReceiptRuleRequest";
const _CRRRr = "CreateReceiptRuleResponse";
const _CRRS = "CloneReceiptRuleSet";
const _CRRSR = "CloneReceiptRuleSetRequest";
const _CRRSRl = "CloneReceiptRuleSetResponse";
const _CRRSRr = "CreateReceiptRuleSetRequest";
const _CRRSRre = "CreateReceiptRuleSetResponse";
const _CRRSr = "CreateReceiptRuleSet";
const _CS = "ConfigurationSet";
const _CSAEE = "ConfigurationSetAlreadyExistsException";
const _CSAN = "ConfigurationSetAttributeNames";
const _CSDNEE = "ConfigurationSetDoesNotExistException";
const _CSN = "ConfigurationSetName";
const _CSSPE = "ConfigurationSetSendingPausedException";
const _CSo = "ConfigurationSets";
const _CT = "ComplaintTopic";
const _CTR = "CreateTemplateRequest";
const _CTRr = "CreateTemplateResponse";
const _CTr = "CreatedTimestamp";
const _CTre = "CreateTemplate";
const _CVEICE = "CustomVerificationEmailInvalidContentException";
const _CVET = "CustomVerificationEmailTemplate";
const _CVETAEE = "CustomVerificationEmailTemplateAlreadyExistsException";
const _CVETDNEE = "CustomVerificationEmailTemplateDoesNotExistException";
const _CVETN = "CustomVerificationEmailTemplateName";
const _CVETu = "CustomVerificationEmailTemplates";
const _CWD = "CloudWatchDestination";
const _CWDC = "CloudWatchDimensionConfiguration";
const _CWDCl = "CloudWatchDimensionConfigurations";
const _Ch = "Charset";
const _Ci = "Cidr";
const _Co = "Complaints";
const _D = "Destination";
const _DA = "DkimAttributes";
const _DARRS = "DescribeActiveReceiptRuleSet";
const _DARRSR = "DescribeActiveReceiptRuleSetRequest";
const _DARRSRe = "DescribeActiveReceiptRuleSetResponse";
const _DAe = "DeliveryAttempts";
const _DC = "DimensionConfigurations";
const _DCS = "DeleteConfigurationSet";
const _DCSED = "DeleteConfigurationSetEventDestination";
const _DCSEDR = "DeleteConfigurationSetEventDestinationRequest";
const _DCSEDRe = "DeleteConfigurationSetEventDestinationResponse";
const _DCSR = "DeleteConfigurationSetRequest";
const _DCSRe = "DeleteConfigurationSetResponse";
const _DCSRes = "DescribeConfigurationSetRequest";
const _DCSResc = "DescribeConfigurationSetResponse";
const _DCSTO = "DeleteConfigurationSetTrackingOptions";
const _DCSTOR = "DeleteConfigurationSetTrackingOptionsRequest";
const _DCSTORe = "DeleteConfigurationSetTrackingOptionsResponse";
const _DCSe = "DescribeConfigurationSet";
const _DCVET = "DeleteCustomVerificationEmailTemplate";
const _DCVETR = "DeleteCustomVerificationEmailTemplateRequest";
const _DCi = "DiagnosticCode";
const _DDV = "DefaultDimensionValue";
const _DE = "DkimEnabled";
const _DI = "DeleteIdentity";
const _DIP = "DeleteIdentityPolicy";
const _DIPR = "DeleteIdentityPolicyRequest";
const _DIPRe = "DeleteIdentityPolicyResponse";
const _DIR = "DeleteIdentityRequest";
const _DIRe = "DeleteIdentityResponse";
const _DN = "DimensionName";
const _DO = "DeliveryOptions";
const _DRF = "DeleteReceiptFilter";
const _DRFR = "DeleteReceiptFilterRequest";
const _DRFRe = "DeleteReceiptFilterResponse";
const _DRR = "DeleteReceiptRule";
const _DRRR = "DeleteReceiptRuleRequest";
const _DRRRe = "DeleteReceiptRuleResponse";
const _DRRRes = "DescribeReceiptRuleRequest";
const _DRRResc = "DescribeReceiptRuleResponse";
const _DRRS = "DeleteReceiptRuleSet";
const _DRRSR = "DeleteReceiptRuleSetRequest";
const _DRRSRe = "DeleteReceiptRuleSetResponse";
const _DRRSRes = "DescribeReceiptRuleSetRequest";
const _DRRSResc = "DescribeReceiptRuleSetResponse";
const _DRRSe = "DescribeReceiptRuleSet";
const _DRRe = "DescribeReceiptRule";
const _DSARN = "DeliveryStreamARN";
const _DT = "DkimTokens";
const _DTD = "DefaultTemplateData";
const _DTR = "DeleteTemplateRequest";
const _DTRe = "DeleteTemplateResponse";
const _DTe = "DeliveryTopic";
const _DTef = "DefaultTags";
const _DTel = "DeleteTemplate";
const _DVEA = "DeleteVerifiedEmailAddress";
const _DVEAR = "DeleteVerifiedEmailAddressRequest";
const _DVS = "DimensionValueSource";
const _DVSk = "DkimVerificationStatus";
const _Da = "Data";
const _De = "Destinations";
const _Do = "Domain";
const _E = "Error";
const _EA = "EmailAddress";
const _ED = "EventDestination";
const _EDAEE = "EventDestinationAlreadyExistsException";
const _EDDNEE = "EventDestinationDoesNotExistException";
const _EDN = "EventDestinationName";
const _EDv = "EventDestinations";
const _EF = "ExtensionField";
const _EFL = "ExtensionFieldList";
const _EFx = "ExtensionFields";
const _En = "Enabled";
const _Enc = "Encoding";
const _Ex = "Explanation";
const _F = "Filter";
const _FA = "FunctionArn";
const _FAr = "FromArn";
const _FE = "ForwardingEnabled";
const _FEA = "FromEmailAddress";
const _FEANVE = "FromEmailAddressNotVerifiedException";
const _FN = "FilterName";
const _FR = "FinalRecipient";
const _FRURL = "FailureRedirectionURL";
const _Fi = "Filters";
const _GASE = "GetAccountSendingEnabled";
const _GASER = "GetAccountSendingEnabledResponse";
const _GCVET = "GetCustomVerificationEmailTemplate";
const _GCVETR = "GetCustomVerificationEmailTemplateRequest";
const _GCVETRe = "GetCustomVerificationEmailTemplateResponse";
const _GIDA = "GetIdentityDkimAttributes";
const _GIDAR = "GetIdentityDkimAttributesRequest";
const _GIDARe = "GetIdentityDkimAttributesResponse";
const _GIMFDA = "GetIdentityMailFromDomainAttributes";
const _GIMFDAR = "GetIdentityMailFromDomainAttributesRequest";
const _GIMFDARe = "GetIdentityMailFromDomainAttributesResponse";
const _GINA = "GetIdentityNotificationAttributes";
const _GINAR = "GetIdentityNotificationAttributesRequest";
const _GINARe = "GetIdentityNotificationAttributesResponse";
const _GIP = "GetIdentityPolicies";
const _GIPR = "GetIdentityPoliciesRequest";
const _GIPRe = "GetIdentityPoliciesResponse";
const _GIVA = "GetIdentityVerificationAttributes";
const _GIVAR = "GetIdentityVerificationAttributesRequest";
const _GIVARe = "GetIdentityVerificationAttributesResponse";
const _GSQ = "GetSendQuota";
const _GSQR = "GetSendQuotaResponse";
const _GSS = "GetSendStatistics";
const _GSSR = "GetSendStatisticsResponse";
const _GT = "GetTemplate";
const _GTR = "GetTemplateRequest";
const _GTRe = "GetTemplateResponse";
const _H = "Html";
const _HIBNE = "HeadersInBounceNotificationsEnabled";
const _HICNE = "HeadersInComplaintNotificationsEnabled";
const _HIDNE = "HeadersInDeliveryNotificationsEnabled";
const _HN = "HeaderName";
const _HP = "HtmlPart";
const _HV = "HeaderValue";
const _I = "Identity";
const _IAMRARN = "IAMRoleARN";
const _IARN = "InstanceARN";
const _ICSE = "InvalidConfigurationSetException";
const _ICWDE = "InvalidCloudWatchDestinationException";
const _IDA = "IdentityDkimAttributes";
const _IDOE = "InvalidDeliveryOptionsException";
const _IF = "IpFilter";
const _IFDE = "InvalidFirehoseDestinationException";
const _ILFE = "InvalidLambdaFunctionException";
const _IMFDA = "IdentityMailFromDomainAttributes";
const _INA = "IdentityNotificationAttributes";
const _IPE = "InvalidPolicyException";
const _IRA = "IamRoleArn";
const _IRPE = "InvalidRenderingParameterException";
const _ISCE = "InvalidS3ConfigurationException";
const _ISNSDE = "InvalidSNSDestinationException";
const _ISTE = "InvalidSnsTopicException";
const _IT = "InvocationType";
const _ITE = "InvalidTemplateException";
const _ITOE = "InvalidTrackingOptionsException";
const _ITd = "IdentityType";
const _IVA = "IdentityVerificationAttributes";
const _Id = "Identities";
const _KFD = "KinesisFirehoseDestination";
const _KKA = "KmsKeyArn";
const _LA = "LambdaAction";
const _LAD = "LastAttemptDate";
const _LCS = "ListConfigurationSets";
const _LCSR = "ListConfigurationSetsRequest";
const _LCSRi = "ListConfigurationSetsResponse";
const _LCVET = "ListCustomVerificationEmailTemplates";
const _LCVETR = "ListCustomVerificationEmailTemplatesRequest";
const _LCVETRi = "ListCustomVerificationEmailTemplatesResponse";
const _LEE = "LimitExceededException";
const _LFS = "LastFreshStart";
const _LI = "ListIdentities";
const _LIP = "ListIdentityPolicies";
const _LIPR = "ListIdentityPoliciesRequest";
const _LIPRi = "ListIdentityPoliciesResponse";
const _LIR = "ListIdentitiesRequest";
const _LIRi = "ListIdentitiesResponse";
const _LRF = "ListReceiptFilters";
const _LRFR = "ListReceiptFiltersRequest";
const _LRFRi = "ListReceiptFiltersResponse";
const _LRRS = "ListReceiptRuleSets";
const _LRRSR = "ListReceiptRuleSetsRequest";
const _LRRSRi = "ListReceiptRuleSetsResponse";
const _LT = "ListTemplates";
const _LTR = "ListTemplatesRequest";
const _LTRi = "ListTemplatesResponse";
const _LVEA = "ListVerifiedEmailAddresses";
const _LVEAR = "ListVerifiedEmailAddressesResponse";
const _M = "Message";
const _MD = "MessageDsn";
const _MET = "MatchingEventTypes";
const _MFD = "MailFromDomain";
const _MFDA = "MailFromDomainAttributes";
const _MFDNVE = "MailFromDomainNotVerifiedException";
const _MFDS = "MailFromDomainStatus";
const _MHS = "Max24HourSend";
const _MI = "MessageId";
const _MIa = "MaxItems";
const _MR = "MessageRejected";
const _MRAE = "MissingRenderingAttributeException";
const _MRa = "MaxResults";
const _MSR = "MaxSendRate";
const _MT = "MessageTag";
const _MTL = "MessageTagList";
const _Me = "Metadata";
const _N = "Name";
const _NA = "NotificationAttributes";
const _NT = "NextToken";
const _NTo = "NotificationType";
const _OA = "OrganizationArn";
const _OKP = "ObjectKeyPrefix";
const _OMI = "OriginalMessageId";
const _ORSN = "OriginalRuleSetName";
const _P = "Policies";
const _PANGE = "ProductionAccessNotGrantedException";
const _PCSDO = "PutConfigurationSetDeliveryOptions";
const _PCSDOR = "PutConfigurationSetDeliveryOptionsRequest";
const _PCSDORu = "PutConfigurationSetDeliveryOptionsResponse";
const _PIP = "PutIdentityPolicy";
const _PIPR = "PutIdentityPolicyRequest";
const _PIPRu = "PutIdentityPolicyResponse";
const _PN = "PolicyName";
const _PNo = "PolicyNames";
const _Po = "Policy";
const _R = "Recipient";
const _RA = "RecipientArn";
const _RAL = "ReceiptActionsList";
const _RAe = "ReceiptAction";
const _RDF = "RecipientDsnFields";
const _RDNEE = "RuleDoesNotExistException";
const _RF = "ReceiptFilter";
const _RFL = "ReceiptFilterList";
const _RIF = "ReceiptIpFilter";
const _RM = "ReportingMta";
const _RME = "ReputationMetricsEnabled";
const _RMa = "RawMessage";
const _RMe = "RemoteMta";
const _RN = "RuleName";
const _RNu = "RuleNames";
const _RO = "ReputationOptions";
const _RP = "ReturnPath";
const _RPA = "ReturnPathArn";
const _RR = "ReceiptRule";
const _RRL = "ReceiptRulesList";
const _RRRS = "ReorderReceiptRuleSet";
const _RRRSR = "ReorderReceiptRuleSetRequest";
const _RRRSRe = "ReorderReceiptRuleSetResponse";
const _RRSL = "ReceiptRuleSetsLists";
const _RRSM = "ReceiptRuleSetMetadata";
const _RS = "RuleSets";
const _RSDNEE = "RuleSetDoesNotExistException";
const _RSN = "RuleSetName";
const _RT = "ReplacementTags";
const _RTA = "ReplyToAddresses";
const _RTD = "ReplacementTemplateData";
const _RTe = "RenderedTemplate";
const _Re = "Recipients";
const _Rej = "Rejects";
const _Ru = "Rule";
const _Rul = "Rules";
const _S = "Sender";
const _SA = "S3Action";
const _SARRS = "SetActiveReceiptRuleSet";
const _SARRSR = "SetActiveReceiptRuleSetRequest";
const _SARRSRe = "SetActiveReceiptRuleSetResponse";
const _SAo = "SourceArn";
const _SAt = "StopAction";
const _SB = "SendBounce";
const _SBR = "SendBounceRequest";
const _SBRe = "SendBounceResponse";
const _SBTE = "SendBulkTemplatedEmail";
const _SBTER = "SendBulkTemplatedEmailRequest";
const _SBTERe = "SendBulkTemplatedEmailResponse";
const _SC = "StatusCode";
const _SCVE = "SendCustomVerificationEmail";
const _SCVER = "SendCustomVerificationEmailRequest";
const _SCVERe = "SendCustomVerificationEmailResponse";
const _SDP = "SendDataPoints";
const _SDPL = "SendDataPointList";
const _SDPe = "SendDataPoint";
const _SE = "ScanEnabled";
const _SER = "SendEmailRequest";
const _SERe = "SendEmailResponse";
const _SEe = "SendingEnabled";
const _SEen = "SendEmail";
const _SIDE = "SetIdentityDkimEnabled";
const _SIDER = "SetIdentityDkimEnabledRequest";
const _SIDERe = "SetIdentityDkimEnabledResponse";
const _SIFFE = "SetIdentityFeedbackForwardingEnabled";
const _SIFFER = "SetIdentityFeedbackForwardingEnabledRequest";
const _SIFFERe = "SetIdentityFeedbackForwardingEnabledResponse";
const _SIHINE = "SetIdentityHeadersInNotificationsEnabled";
const _SIHINER = "SetIdentityHeadersInNotificationsEnabledRequest";
const _SIHINERe = "SetIdentityHeadersInNotificationsEnabledResponse";
const _SIMFD = "SetIdentityMailFromDomain";
const _SIMFDR = "SetIdentityMailFromDomainRequest";
const _SIMFDRe = "SetIdentityMailFromDomainResponse";
const _SINT = "SetIdentityNotificationTopic";
const _SINTR = "SetIdentityNotificationTopicRequest";
const _SINTRe = "SetIdentityNotificationTopicResponse";
const _SLH = "SentLast24Hours";
const _SNSA = "SNSAction";
const _SNSD = "SNSDestination";
const _SP = "SubjectPart";
const _SRC = "SmtpReplyCode";
const _SRE = "SendRawEmail";
const _SRER = "SendRawEmailRequest";
const _SRERe = "SendRawEmailResponse";
const _SRRP = "SetReceiptRulePosition";
const _SRRPR = "SetReceiptRulePositionRequest";
const _SRRPRe = "SetReceiptRulePositionResponse";
const _SRURL = "SuccessRedirectionURL";
const _ST = "SnsTopic";
const _STE = "SendTemplatedEmail";
const _STER = "SendTemplatedEmailRequest";
const _STERe = "SendTemplatedEmailResponse";
const _Sc = "Scope";
const _So = "Source";
const _St = "Status";
const _Su = "Subject";
const _T = "Topic";
const _TA = "TopicArn";
const _TARN = "TopicARN";
const _TAe = "TemplateArn";
const _TAo = "ToAddresses";
const _TC = "TemplateContent";
const _TD = "TemplateData";
const _TDNEE = "TemplateDoesNotExistException";
const _TM = "TemplatesMetadata";
const _TML = "TemplateMetadataList";
const _TMe = "TemplateMetadata";
const _TN = "TemplateName";
const _TO = "TrackingOptions";
const _TOAEE = "TrackingOptionsAlreadyExistsException";
const _TODNEE = "TrackingOptionsDoesNotExistException";
const _TP = "TlsPolicy";
const _TPe = "TextPart";
const _TRT = "TestRenderTemplate";
const _TRTR = "TestRenderTemplateRequest";
const _TRTRe = "TestRenderTemplateResponse";
const _TS = "TemplateSubject";
const _Ta = "Tags";
const _Te = "Text";
const _Tem = "Template";
const _Ti = "Timestamp";
const _UASE = "UpdateAccountSendingEnabled";
const _UASER = "UpdateAccountSendingEnabledRequest";
const _UCSED = "UpdateConfigurationSetEventDestination";
const _UCSEDR = "UpdateConfigurationSetEventDestinationRequest";
const _UCSEDRp = "UpdateConfigurationSetEventDestinationResponse";
const _UCSRME = "UpdateConfigurationSetReputationMetricsEnabled";
const _UCSRMER = "UpdateConfigurationSetReputationMetricsEnabledRequest";
const _UCSSE = "UpdateConfigurationSetSendingEnabled";
const _UCSSER = "UpdateConfigurationSetSendingEnabledRequest";
const _UCSTO = "UpdateConfigurationSetTrackingOptions";
const _UCSTOR = "UpdateConfigurationSetTrackingOptionsRequest";
const _UCSTORp = "UpdateConfigurationSetTrackingOptionsResponse";
const _UCVET = "UpdateCustomVerificationEmailTemplate";
const _UCVETR = "UpdateCustomVerificationEmailTemplateRequest";
const _URR = "UpdateReceiptRule";
const _URRR = "UpdateReceiptRuleRequest";
const _URRRp = "UpdateReceiptRuleResponse";
const _UT = "UpdateTemplate";
const _UTR = "UpdateTemplateRequest";
const _UTRp = "UpdateTemplateResponse";
const _V = "Value";
const _VA = "VerificationAttributes";
const _VDD = "VerifyDomainDkim";
const _VDDR = "VerifyDomainDkimRequest";
const _VDDRe = "VerifyDomainDkimResponse";
const _VDI = "VerifyDomainIdentity";
const _VDIR = "VerifyDomainIdentityRequest";
const _VDIRe = "VerifyDomainIdentityResponse";
const _VEA = "VerifiedEmailAddresses";
const _VEAR = "VerifyEmailAddressRequest";
const _VEAe = "VerifyEmailAddress";
const _VEI = "VerifyEmailIdentity";
const _VEIR = "VerifyEmailIdentityRequest";
const _VEIRe = "VerifyEmailIdentityResponse";
const _VS = "VerificationStatus";
const _VT = "VerificationToken";
const _WA = "WorkmailAction";
const _aQE = "awsQueryError";
const _c = "client";
const _e = "error";
const _hE = "httpError";
const _m = "message";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.ses";
const n0 = "com.amazonaws.ses";
const schema_1 = require("@smithy/core/schema");
const errors_1 = require("../models/errors");
const SESServiceException_1 = require("../models/SESServiceException");
const _s_registry = schema_1.TypeRegistry.for(_s);
exports.SESServiceException$ = [-3, _s, "SESServiceException", 0, [], []];
_s_registry.registerError(exports.SESServiceException$, SESServiceException_1.SESServiceException);
const n0_registry = schema_1.TypeRegistry.for(n0);
exports.AccountSendingPausedException$ = [-3, n0, _ASPE,
    { [_aQE]: [`AccountSendingPausedException`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.AccountSendingPausedException$, errors_1.AccountSendingPausedException);
exports.AlreadyExistsException$ = [-3, n0, _AEE,
    { [_aQE]: [`AlreadyExists`, 400], [_e]: _c, [_hE]: 400 },
    [_N, _m],
    [0, 0]
];
n0_registry.registerError(exports.AlreadyExistsException$, errors_1.AlreadyExistsException);
exports.CannotDeleteException$ = [-3, n0, _CDE,
    { [_aQE]: [`CannotDelete`, 400], [_e]: _c, [_hE]: 400 },
    [_N, _m],
    [0, 0]
];
n0_registry.registerError(exports.CannotDeleteException$, errors_1.CannotDeleteException);
exports.ConfigurationSetAlreadyExistsException$ = [-3, n0, _CSAEE,
    { [_aQE]: [`ConfigurationSetAlreadyExists`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _m],
    [0, 0]
];
n0_registry.registerError(exports.ConfigurationSetAlreadyExistsException$, errors_1.ConfigurationSetAlreadyExistsException);
exports.ConfigurationSetDoesNotExistException$ = [-3, n0, _CSDNEE,
    { [_aQE]: [`ConfigurationSetDoesNotExist`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _m],
    [0, 0]
];
n0_registry.registerError(exports.ConfigurationSetDoesNotExistException$, errors_1.ConfigurationSetDoesNotExistException);
exports.ConfigurationSetSendingPausedException$ = [-3, n0, _CSSPE,
    { [_aQE]: [`ConfigurationSetSendingPausedException`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _m],
    [0, 0]
];
n0_registry.registerError(exports.ConfigurationSetSendingPausedException$, errors_1.ConfigurationSetSendingPausedException);
exports.CustomVerificationEmailInvalidContentException$ = [-3, n0, _CVEICE,
    { [_aQE]: [`CustomVerificationEmailInvalidContent`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.CustomVerificationEmailInvalidContentException$, errors_1.CustomVerificationEmailInvalidContentException);
exports.CustomVerificationEmailTemplateAlreadyExistsException$ = [-3, n0, _CVETAEE,
    { [_aQE]: [`CustomVerificationEmailTemplateAlreadyExists`, 400], [_e]: _c, [_hE]: 400 },
    [_CVETN, _m],
    [0, 0]
];
n0_registry.registerError(exports.CustomVerificationEmailTemplateAlreadyExistsException$, errors_1.CustomVerificationEmailTemplateAlreadyExistsException);
exports.CustomVerificationEmailTemplateDoesNotExistException$ = [-3, n0, _CVETDNEE,
    { [_aQE]: [`CustomVerificationEmailTemplateDoesNotExist`, 400], [_e]: _c, [_hE]: 400 },
    [_CVETN, _m],
    [0, 0]
];
n0_registry.registerError(exports.CustomVerificationEmailTemplateDoesNotExistException$, errors_1.CustomVerificationEmailTemplateDoesNotExistException);
exports.EventDestinationAlreadyExistsException$ = [-3, n0, _EDAEE,
    { [_aQE]: [`EventDestinationAlreadyExists`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _EDN, _m],
    [0, 0, 0]
];
n0_registry.registerError(exports.EventDestinationAlreadyExistsException$, errors_1.EventDestinationAlreadyExistsException);
exports.EventDestinationDoesNotExistException$ = [-3, n0, _EDDNEE,
    { [_aQE]: [`EventDestinationDoesNotExist`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _EDN, _m],
    [0, 0, 0]
];
n0_registry.registerError(exports.EventDestinationDoesNotExistException$, errors_1.EventDestinationDoesNotExistException);
exports.FromEmailAddressNotVerifiedException$ = [-3, n0, _FEANVE,
    { [_aQE]: [`FromEmailAddressNotVerified`, 400], [_e]: _c, [_hE]: 400 },
    [_FEA, _m],
    [0, 0]
];
n0_registry.registerError(exports.FromEmailAddressNotVerifiedException$, errors_1.FromEmailAddressNotVerifiedException);
exports.InvalidCloudWatchDestinationException$ = [-3, n0, _ICWDE,
    { [_aQE]: [`InvalidCloudWatchDestination`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _EDN, _m],
    [0, 0, 0]
];
n0_registry.registerError(exports.InvalidCloudWatchDestinationException$, errors_1.InvalidCloudWatchDestinationException);
exports.InvalidConfigurationSetException$ = [-3, n0, _ICSE,
    { [_aQE]: [`InvalidConfigurationSet`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidConfigurationSetException$, errors_1.InvalidConfigurationSetException);
exports.InvalidDeliveryOptionsException$ = [-3, n0, _IDOE,
    { [_aQE]: [`InvalidDeliveryOptions`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidDeliveryOptionsException$, errors_1.InvalidDeliveryOptionsException);
exports.InvalidFirehoseDestinationException$ = [-3, n0, _IFDE,
    { [_aQE]: [`InvalidFirehoseDestination`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _EDN, _m],
    [0, 0, 0]
];
n0_registry.registerError(exports.InvalidFirehoseDestinationException$, errors_1.InvalidFirehoseDestinationException);
exports.InvalidLambdaFunctionException$ = [-3, n0, _ILFE,
    { [_aQE]: [`InvalidLambdaFunction`, 400], [_e]: _c, [_hE]: 400 },
    [_FA, _m],
    [0, 0]
];
n0_registry.registerError(exports.InvalidLambdaFunctionException$, errors_1.InvalidLambdaFunctionException);
exports.InvalidPolicyException$ = [-3, n0, _IPE,
    { [_aQE]: [`InvalidPolicy`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidPolicyException$, errors_1.InvalidPolicyException);
exports.InvalidRenderingParameterException$ = [-3, n0, _IRPE,
    { [_aQE]: [`InvalidRenderingParameter`, 400], [_e]: _c, [_hE]: 400 },
    [_TN, _m],
    [0, 0]
];
n0_registry.registerError(exports.InvalidRenderingParameterException$, errors_1.InvalidRenderingParameterException);
exports.InvalidS3ConfigurationException$ = [-3, n0, _ISCE,
    { [_aQE]: [`InvalidS3Configuration`, 400], [_e]: _c, [_hE]: 400 },
    [_B, _m],
    [0, 0]
];
n0_registry.registerError(exports.InvalidS3ConfigurationException$, errors_1.InvalidS3ConfigurationException);
exports.InvalidSNSDestinationException$ = [-3, n0, _ISNSDE,
    { [_aQE]: [`InvalidSNSDestination`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _EDN, _m],
    [0, 0, 0]
];
n0_registry.registerError(exports.InvalidSNSDestinationException$, errors_1.InvalidSNSDestinationException);
exports.InvalidSnsTopicException$ = [-3, n0, _ISTE,
    { [_aQE]: [`InvalidSnsTopic`, 400], [_e]: _c, [_hE]: 400 },
    [_T, _m],
    [0, 0]
];
n0_registry.registerError(exports.InvalidSnsTopicException$, errors_1.InvalidSnsTopicException);
exports.InvalidTemplateException$ = [-3, n0, _ITE,
    { [_aQE]: [`InvalidTemplate`, 400], [_e]: _c, [_hE]: 400 },
    [_TN, _m],
    [0, 0]
];
n0_registry.registerError(exports.InvalidTemplateException$, errors_1.InvalidTemplateException);
exports.InvalidTrackingOptionsException$ = [-3, n0, _ITOE,
    { [_aQE]: [`InvalidTrackingOptions`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidTrackingOptionsException$, errors_1.InvalidTrackingOptionsException);
exports.LimitExceededException$ = [-3, n0, _LEE,
    { [_aQE]: [`LimitExceeded`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.LimitExceededException$, errors_1.LimitExceededException);
exports.MailFromDomainNotVerifiedException$ = [-3, n0, _MFDNVE,
    { [_aQE]: [`MailFromDomainNotVerifiedException`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.MailFromDomainNotVerifiedException$, errors_1.MailFromDomainNotVerifiedException);
exports.MessageRejected$ = [-3, n0, _MR,
    { [_aQE]: [`MessageRejected`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.MessageRejected$, errors_1.MessageRejected);
exports.MissingRenderingAttributeException$ = [-3, n0, _MRAE,
    { [_aQE]: [`MissingRenderingAttribute`, 400], [_e]: _c, [_hE]: 400 },
    [_TN, _m],
    [0, 0]
];
n0_registry.registerError(exports.MissingRenderingAttributeException$, errors_1.MissingRenderingAttributeException);
exports.ProductionAccessNotGrantedException$ = [-3, n0, _PANGE,
    { [_aQE]: [`ProductionAccessNotGranted`, 400], [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.ProductionAccessNotGrantedException$, errors_1.ProductionAccessNotGrantedException);
exports.RuleDoesNotExistException$ = [-3, n0, _RDNEE,
    { [_aQE]: [`RuleDoesNotExist`, 400], [_e]: _c, [_hE]: 400 },
    [_N, _m],
    [0, 0]
];
n0_registry.registerError(exports.RuleDoesNotExistException$, errors_1.RuleDoesNotExistException);
exports.RuleSetDoesNotExistException$ = [-3, n0, _RSDNEE,
    { [_aQE]: [`RuleSetDoesNotExist`, 400], [_e]: _c, [_hE]: 400 },
    [_N, _m],
    [0, 0]
];
n0_registry.registerError(exports.RuleSetDoesNotExistException$, errors_1.RuleSetDoesNotExistException);
exports.TemplateDoesNotExistException$ = [-3, n0, _TDNEE,
    { [_aQE]: [`TemplateDoesNotExist`, 400], [_e]: _c, [_hE]: 400 },
    [_TN, _m],
    [0, 0]
];
n0_registry.registerError(exports.TemplateDoesNotExistException$, errors_1.TemplateDoesNotExistException);
exports.TrackingOptionsAlreadyExistsException$ = [-3, n0, _TOAEE,
    { [_aQE]: [`TrackingOptionsAlreadyExistsException`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _m],
    [0, 0]
];
n0_registry.registerError(exports.TrackingOptionsAlreadyExistsException$, errors_1.TrackingOptionsAlreadyExistsException);
exports.TrackingOptionsDoesNotExistException$ = [-3, n0, _TODNEE,
    { [_aQE]: [`TrackingOptionsDoesNotExistException`, 400], [_e]: _c, [_hE]: 400 },
    [_CSN, _m],
    [0, 0]
];
n0_registry.registerError(exports.TrackingOptionsDoesNotExistException$, errors_1.TrackingOptionsDoesNotExistException);
exports.errorTypeRegistries = [
    _s_registry,
    n0_registry,
];
exports.AddHeaderAction$ = [3, n0, _AHA,
    0,
    [_HN, _HV],
    [0, 0], 2
];
exports.Body$ = [3, n0, _Bo,
    0,
    [_Te, _H],
    [() => exports.Content$, () => exports.Content$]
];
exports.BounceAction$ = [3, n0, _BA,
    0,
    [_SRC, _M, _S, _TA, _SC],
    [0, 0, 0, 0, 0], 3
];
exports.BouncedRecipientInfo$ = [3, n0, _BRI,
    0,
    [_R, _RA, _BT, _RDF],
    [0, 0, 0, () => exports.RecipientDsnFields$], 1
];
exports.BulkEmailDestination$ = [3, n0, _BED,
    0,
    [_D, _RT, _RTD],
    [() => exports.Destination$, () => MessageTagList, 0], 1
];
exports.BulkEmailDestinationStatus$ = [3, n0, _BEDS,
    0,
    [_St, _E, _MI],
    [0, 0, 0]
];
exports.CloneReceiptRuleSetRequest$ = [3, n0, _CRRSR,
    0,
    [_RSN, _ORSN],
    [0, 0], 2
];
exports.CloneReceiptRuleSetResponse$ = [3, n0, _CRRSRl,
    0,
    [],
    []
];
exports.CloudWatchDestination$ = [3, n0, _CWD,
    0,
    [_DC],
    [() => CloudWatchDimensionConfigurations], 1
];
exports.CloudWatchDimensionConfiguration$ = [3, n0, _CWDC,
    0,
    [_DN, _DVS, _DDV],
    [0, 0, 0], 3
];
exports.ConfigurationSet$ = [3, n0, _CS,
    0,
    [_N],
    [0], 1
];
exports.ConnectAction$ = [3, n0, _CA,
    0,
    [_IARN, _IAMRARN],
    [0, 0], 2
];
exports.Content$ = [3, n0, _C,
    0,
    [_Da, _Ch],
    [0, 0], 1
];
exports.CreateConfigurationSetEventDestinationRequest$ = [3, n0, _CCSEDR,
    0,
    [_CSN, _ED],
    [0, () => exports.EventDestination$], 2
];
exports.CreateConfigurationSetEventDestinationResponse$ = [3, n0, _CCSEDRr,
    0,
    [],
    []
];
exports.CreateConfigurationSetRequest$ = [3, n0, _CCSR,
    0,
    [_CS],
    [() => exports.ConfigurationSet$], 1
];
exports.CreateConfigurationSetResponse$ = [3, n0, _CCSRr,
    0,
    [],
    []
];
exports.CreateConfigurationSetTrackingOptionsRequest$ = [3, n0, _CCSTOR,
    0,
    [_CSN, _TO],
    [0, () => exports.TrackingOptions$], 2
];
exports.CreateConfigurationSetTrackingOptionsResponse$ = [3, n0, _CCSTORr,
    0,
    [],
    []
];
exports.CreateCustomVerificationEmailTemplateRequest$ = [3, n0, _CCVETR,
    0,
    [_TN, _FEA, _TS, _TC, _SRURL, _FRURL],
    [0, 0, 0, 0, 0, 0], 6
];
exports.CreateReceiptFilterRequest$ = [3, n0, _CRFR,
    0,
    [_F],
    [() => exports.ReceiptFilter$], 1
];
exports.CreateReceiptFilterResponse$ = [3, n0, _CRFRr,
    0,
    [],
    []
];
exports.CreateReceiptRuleRequest$ = [3, n0, _CRRR,
    0,
    [_RSN, _Ru, _A],
    [0, () => exports.ReceiptRule$, 0], 2
];
exports.CreateReceiptRuleResponse$ = [3, n0, _CRRRr,
    0,
    [],
    []
];
exports.CreateReceiptRuleSetRequest$ = [3, n0, _CRRSRr,
    0,
    [_RSN],
    [0], 1
];
exports.CreateReceiptRuleSetResponse$ = [3, n0, _CRRSRre,
    0,
    [],
    []
];
exports.CreateTemplateRequest$ = [3, n0, _CTR,
    0,
    [_Tem],
    [() => exports.Template$], 1
];
exports.CreateTemplateResponse$ = [3, n0, _CTRr,
    0,
    [],
    []
];
exports.CustomVerificationEmailTemplate$ = [3, n0, _CVET,
    0,
    [_TN, _FEA, _TS, _SRURL, _FRURL],
    [0, 0, 0, 0, 0]
];
exports.DeleteConfigurationSetEventDestinationRequest$ = [3, n0, _DCSEDR,
    0,
    [_CSN, _EDN],
    [0, 0], 2
];
exports.DeleteConfigurationSetEventDestinationResponse$ = [3, n0, _DCSEDRe,
    0,
    [],
    []
];
exports.DeleteConfigurationSetRequest$ = [3, n0, _DCSR,
    0,
    [_CSN],
    [0], 1
];
exports.DeleteConfigurationSetResponse$ = [3, n0, _DCSRe,
    0,
    [],
    []
];
exports.DeleteConfigurationSetTrackingOptionsRequest$ = [3, n0, _DCSTOR,
    0,
    [_CSN],
    [0], 1
];
exports.DeleteConfigurationSetTrackingOptionsResponse$ = [3, n0, _DCSTORe,
    0,
    [],
    []
];
exports.DeleteCustomVerificationEmailTemplateRequest$ = [3, n0, _DCVETR,
    0,
    [_TN],
    [0], 1
];
exports.DeleteIdentityPolicyRequest$ = [3, n0, _DIPR,
    0,
    [_I, _PN],
    [0, 0], 2
];
exports.DeleteIdentityPolicyResponse$ = [3, n0, _DIPRe,
    0,
    [],
    []
];
exports.DeleteIdentityRequest$ = [3, n0, _DIR,
    0,
    [_I],
    [0], 1
];
exports.DeleteIdentityResponse$ = [3, n0, _DIRe,
    0,
    [],
    []
];
exports.DeleteReceiptFilterRequest$ = [3, n0, _DRFR,
    0,
    [_FN],
    [0], 1
];
exports.DeleteReceiptFilterResponse$ = [3, n0, _DRFRe,
    0,
    [],
    []
];
exports.DeleteReceiptRuleRequest$ = [3, n0, _DRRR,
    0,
    [_RSN, _RN],
    [0, 0], 2
];
exports.DeleteReceiptRuleResponse$ = [3, n0, _DRRRe,
    0,
    [],
    []
];
exports.DeleteReceiptRuleSetRequest$ = [3, n0, _DRRSR,
    0,
    [_RSN],
    [0], 1
];
exports.DeleteReceiptRuleSetResponse$ = [3, n0, _DRRSRe,
    0,
    [],
    []
];
exports.DeleteTemplateRequest$ = [3, n0, _DTR,
    0,
    [_TN],
    [0], 1
];
exports.DeleteTemplateResponse$ = [3, n0, _DTRe,
    0,
    [],
    []
];
exports.DeleteVerifiedEmailAddressRequest$ = [3, n0, _DVEAR,
    0,
    [_EA],
    [0], 1
];
exports.DeliveryOptions$ = [3, n0, _DO,
    0,
    [_TP],
    [0]
];
exports.DescribeActiveReceiptRuleSetRequest$ = [3, n0, _DARRSR,
    0,
    [],
    []
];
exports.DescribeActiveReceiptRuleSetResponse$ = [3, n0, _DARRSRe,
    0,
    [_Me, _Rul],
    [() => exports.ReceiptRuleSetMetadata$, () => ReceiptRulesList]
];
exports.DescribeConfigurationSetRequest$ = [3, n0, _DCSRes,
    0,
    [_CSN, _CSAN],
    [0, 64 | 0], 1
];
exports.DescribeConfigurationSetResponse$ = [3, n0, _DCSResc,
    0,
    [_CS, _EDv, _TO, _DO, _RO],
    [() => exports.ConfigurationSet$, () => EventDestinations, () => exports.TrackingOptions$, () => exports.DeliveryOptions$, () => exports.ReputationOptions$]
];
exports.DescribeReceiptRuleRequest$ = [3, n0, _DRRRes,
    0,
    [_RSN, _RN],
    [0, 0], 2
];
exports.DescribeReceiptRuleResponse$ = [3, n0, _DRRResc,
    0,
    [_Ru],
    [() => exports.ReceiptRule$]
];
exports.DescribeReceiptRuleSetRequest$ = [3, n0, _DRRSRes,
    0,
    [_RSN],
    [0], 1
];
exports.DescribeReceiptRuleSetResponse$ = [3, n0, _DRRSResc,
    0,
    [_Me, _Rul],
    [() => exports.ReceiptRuleSetMetadata$, () => ReceiptRulesList]
];
exports.Destination$ = [3, n0, _D,
    0,
    [_TAo, _CAc, _BAc],
    [64 | 0, 64 | 0, 64 | 0]
];
exports.EventDestination$ = [3, n0, _ED,
    0,
    [_N, _MET, _En, _KFD, _CWD, _SNSD],
    [0, 64 | 0, 2, () => exports.KinesisFirehoseDestination$, () => exports.CloudWatchDestination$, () => exports.SNSDestination$], 2
];
exports.ExtensionField$ = [3, n0, _EF,
    0,
    [_N, _V],
    [0, 0], 2
];
exports.GetAccountSendingEnabledResponse$ = [3, n0, _GASER,
    0,
    [_En],
    [2]
];
exports.GetCustomVerificationEmailTemplateRequest$ = [3, n0, _GCVETR,
    0,
    [_TN],
    [0], 1
];
exports.GetCustomVerificationEmailTemplateResponse$ = [3, n0, _GCVETRe,
    0,
    [_TN, _FEA, _TS, _TC, _SRURL, _FRURL],
    [0, 0, 0, 0, 0, 0]
];
exports.GetIdentityDkimAttributesRequest$ = [3, n0, _GIDAR,
    0,
    [_Id],
    [64 | 0], 1
];
exports.GetIdentityDkimAttributesResponse$ = [3, n0, _GIDARe,
    0,
    [_DA],
    [() => DkimAttributes], 1
];
exports.GetIdentityMailFromDomainAttributesRequest$ = [3, n0, _GIMFDAR,
    0,
    [_Id],
    [64 | 0], 1
];
exports.GetIdentityMailFromDomainAttributesResponse$ = [3, n0, _GIMFDARe,
    0,
    [_MFDA],
    [() => MailFromDomainAttributes], 1
];
exports.GetIdentityNotificationAttributesRequest$ = [3, n0, _GINAR,
    0,
    [_Id],
    [64 | 0], 1
];
exports.GetIdentityNotificationAttributesResponse$ = [3, n0, _GINARe,
    0,
    [_NA],
    [() => NotificationAttributes], 1
];
exports.GetIdentityPoliciesRequest$ = [3, n0, _GIPR,
    0,
    [_I, _PNo],
    [0, 64 | 0], 2
];
exports.GetIdentityPoliciesResponse$ = [3, n0, _GIPRe,
    0,
    [_P],
    [128 | 0], 1
];
exports.GetIdentityVerificationAttributesRequest$ = [3, n0, _GIVAR,
    0,
    [_Id],
    [64 | 0], 1
];
exports.GetIdentityVerificationAttributesResponse$ = [3, n0, _GIVARe,
    0,
    [_VA],
    [() => VerificationAttributes], 1
];
exports.GetSendQuotaResponse$ = [3, n0, _GSQR,
    0,
    [_MHS, _MSR, _SLH],
    [1, 1, 1]
];
exports.GetSendStatisticsResponse$ = [3, n0, _GSSR,
    0,
    [_SDP],
    [() => SendDataPointList]
];
exports.GetTemplateRequest$ = [3, n0, _GTR,
    0,
    [_TN],
    [0], 1
];
exports.GetTemplateResponse$ = [3, n0, _GTRe,
    0,
    [_Tem],
    [() => exports.Template$]
];
exports.IdentityDkimAttributes$ = [3, n0, _IDA,
    0,
    [_DE, _DVSk, _DT],
    [2, 0, 64 | 0], 2
];
exports.IdentityMailFromDomainAttributes$ = [3, n0, _IMFDA,
    0,
    [_MFD, _MFDS, _BOMXF],
    [0, 0, 0], 3
];
exports.IdentityNotificationAttributes$ = [3, n0, _INA,
    0,
    [_BTo, _CT, _DTe, _FE, _HIBNE, _HICNE, _HIDNE],
    [0, 0, 0, 2, 2, 2, 2], 4
];
exports.IdentityVerificationAttributes$ = [3, n0, _IVA,
    0,
    [_VS, _VT],
    [0, 0], 1
];
exports.KinesisFirehoseDestination$ = [3, n0, _KFD,
    0,
    [_IAMRARN, _DSARN],
    [0, 0], 2
];
exports.LambdaAction$ = [3, n0, _LA,
    0,
    [_FA, _TA, _IT],
    [0, 0, 0], 1
];
exports.ListConfigurationSetsRequest$ = [3, n0, _LCSR,
    0,
    [_NT, _MIa],
    [0, 1]
];
exports.ListConfigurationSetsResponse$ = [3, n0, _LCSRi,
    0,
    [_CSo, _NT],
    [() => ConfigurationSets, 0]
];
exports.ListCustomVerificationEmailTemplatesRequest$ = [3, n0, _LCVETR,
    0,
    [_NT, _MRa],
    [0, 1]
];
exports.ListCustomVerificationEmailTemplatesResponse$ = [3, n0, _LCVETRi,
    0,
    [_CVETu, _NT],
    [() => CustomVerificationEmailTemplates, 0]
];
exports.ListIdentitiesRequest$ = [3, n0, _LIR,
    0,
    [_ITd, _NT, _MIa],
    [0, 0, 1]
];
exports.ListIdentitiesResponse$ = [3, n0, _LIRi,
    0,
    [_Id, _NT],
    [64 | 0, 0], 1
];
exports.ListIdentityPoliciesRequest$ = [3, n0, _LIPR,
    0,
    [_I],
    [0], 1
];
exports.ListIdentityPoliciesResponse$ = [3, n0, _LIPRi,
    0,
    [_PNo],
    [64 | 0], 1
];
exports.ListReceiptFiltersRequest$ = [3, n0, _LRFR,
    0,
    [],
    []
];
exports.ListReceiptFiltersResponse$ = [3, n0, _LRFRi,
    0,
    [_Fi],
    [() => ReceiptFilterList]
];
exports.ListReceiptRuleSetsRequest$ = [3, n0, _LRRSR,
    0,
    [_NT],
    [0]
];
exports.ListReceiptRuleSetsResponse$ = [3, n0, _LRRSRi,
    0,
    [_RS, _NT],
    [() => ReceiptRuleSetsLists, 0]
];
exports.ListTemplatesRequest$ = [3, n0, _LTR,
    0,
    [_NT, _MIa],
    [0, 1]
];
exports.ListTemplatesResponse$ = [3, n0, _LTRi,
    0,
    [_TM, _NT],
    [() => TemplateMetadataList, 0]
];
exports.ListVerifiedEmailAddressesResponse$ = [3, n0, _LVEAR,
    0,
    [_VEA],
    [64 | 0]
];
exports.Message$ = [3, n0, _M,
    0,
    [_Su, _Bo],
    [() => exports.Content$, () => exports.Body$], 2
];
exports.MessageDsn$ = [3, n0, _MD,
    0,
    [_RM, _AD, _EFx],
    [0, 4, () => ExtensionFieldList], 1
];
exports.MessageTag$ = [3, n0, _MT,
    0,
    [_N, _V],
    [0, 0], 2
];
exports.PutConfigurationSetDeliveryOptionsRequest$ = [3, n0, _PCSDOR,
    0,
    [_CSN, _DO],
    [0, () => exports.DeliveryOptions$], 1
];
exports.PutConfigurationSetDeliveryOptionsResponse$ = [3, n0, _PCSDORu,
    0,
    [],
    []
];
exports.PutIdentityPolicyRequest$ = [3, n0, _PIPR,
    0,
    [_I, _PN, _Po],
    [0, 0, 0], 3
];
exports.PutIdentityPolicyResponse$ = [3, n0, _PIPRu,
    0,
    [],
    []
];
exports.RawMessage$ = [3, n0, _RMa,
    0,
    [_Da],
    [21], 1
];
exports.ReceiptAction$ = [3, n0, _RAe,
    0,
    [_SA, _BA, _WA, _LA, _SAt, _AHA, _SNSA, _CA],
    [() => exports.S3Action$, () => exports.BounceAction$, () => exports.WorkmailAction$, () => exports.LambdaAction$, () => exports.StopAction$, () => exports.AddHeaderAction$, () => exports.SNSAction$, () => exports.ConnectAction$]
];
exports.ReceiptFilter$ = [3, n0, _RF,
    0,
    [_N, _IF],
    [0, () => exports.ReceiptIpFilter$], 2
];
exports.ReceiptIpFilter$ = [3, n0, _RIF,
    0,
    [_Po, _Ci],
    [0, 0], 2
];
exports.ReceiptRule$ = [3, n0, _RR,
    0,
    [_N, _En, _TP, _Re, _Ac, _SE],
    [0, 2, 0, 64 | 0, () => ReceiptActionsList, 2], 1
];
exports.ReceiptRuleSetMetadata$ = [3, n0, _RRSM,
    0,
    [_N, _CTr],
    [0, 4]
];
exports.RecipientDsnFields$ = [3, n0, _RDF,
    0,
    [_Act, _St, _FR, _RMe, _DCi, _LAD, _EFx],
    [0, 0, 0, 0, 0, 4, () => ExtensionFieldList], 2
];
exports.ReorderReceiptRuleSetRequest$ = [3, n0, _RRRSR,
    0,
    [_RSN, _RNu],
    [0, 64 | 0], 2
];
exports.ReorderReceiptRuleSetResponse$ = [3, n0, _RRRSRe,
    0,
    [],
    []
];
exports.ReputationOptions$ = [3, n0, _RO,
    0,
    [_SEe, _RME, _LFS],
    [2, 2, 4]
];
exports.S3Action$ = [3, n0, _SA,
    0,
    [_BN, _TA, _OKP, _KKA, _IRA],
    [0, 0, 0, 0, 0], 1
];
exports.SendBounceRequest$ = [3, n0, _SBR,
    0,
    [_OMI, _BS, _BRIL, _Ex, _MD, _BSA],
    [0, 0, () => BouncedRecipientInfoList, 0, () => exports.MessageDsn$, 0], 3
];
exports.SendBounceResponse$ = [3, n0, _SBRe,
    0,
    [_MI],
    [0]
];
exports.SendBulkTemplatedEmailRequest$ = [3, n0, _SBTER,
    0,
    [_So, _Tem, _DTD, _De, _SAo, _RTA, _RP, _RPA, _CSN, _DTef, _TAe],
    [0, 0, 0, () => BulkEmailDestinationList, 0, 64 | 0, 0, 0, 0, () => MessageTagList, 0], 4
];
exports.SendBulkTemplatedEmailResponse$ = [3, n0, _SBTERe,
    0,
    [_St],
    [() => BulkEmailDestinationStatusList], 1
];
exports.SendCustomVerificationEmailRequest$ = [3, n0, _SCVER,
    0,
    [_EA, _TN, _CSN],
    [0, 0, 0], 2
];
exports.SendCustomVerificationEmailResponse$ = [3, n0, _SCVERe,
    0,
    [_MI],
    [0]
];
exports.SendDataPoint$ = [3, n0, _SDPe,
    0,
    [_Ti, _DAe, _Bou, _Co, _Rej],
    [4, 1, 1, 1, 1]
];
exports.SendEmailRequest$ = [3, n0, _SER,
    0,
    [_So, _D, _M, _RTA, _RP, _SAo, _RPA, _Ta, _CSN],
    [0, () => exports.Destination$, () => exports.Message$, 64 | 0, 0, 0, 0, () => MessageTagList, 0], 3
];
exports.SendEmailResponse$ = [3, n0, _SERe,
    0,
    [_MI],
    [0], 1
];
exports.SendRawEmailRequest$ = [3, n0, _SRER,
    0,
    [_RMa, _So, _De, _FAr, _SAo, _RPA, _Ta, _CSN],
    [() => exports.RawMessage$, 0, 64 | 0, 0, 0, 0, () => MessageTagList, 0], 1
];
exports.SendRawEmailResponse$ = [3, n0, _SRERe,
    0,
    [_MI],
    [0], 1
];
exports.SendTemplatedEmailRequest$ = [3, n0, _STER,
    0,
    [_So, _D, _Tem, _TD, _RTA, _RP, _SAo, _RPA, _Ta, _CSN, _TAe],
    [0, () => exports.Destination$, 0, 0, 64 | 0, 0, 0, 0, () => MessageTagList, 0, 0], 4
];
exports.SendTemplatedEmailResponse$ = [3, n0, _STERe,
    0,
    [_MI],
    [0], 1
];
exports.SetActiveReceiptRuleSetRequest$ = [3, n0, _SARRSR,
    0,
    [_RSN],
    [0]
];
exports.SetActiveReceiptRuleSetResponse$ = [3, n0, _SARRSRe,
    0,
    [],
    []
];
exports.SetIdentityDkimEnabledRequest$ = [3, n0, _SIDER,
    0,
    [_I, _DE],
    [0, 2], 2
];
exports.SetIdentityDkimEnabledResponse$ = [3, n0, _SIDERe,
    0,
    [],
    []
];
exports.SetIdentityFeedbackForwardingEnabledRequest$ = [3, n0, _SIFFER,
    0,
    [_I, _FE],
    [0, 2], 2
];
exports.SetIdentityFeedbackForwardingEnabledResponse$ = [3, n0, _SIFFERe,
    0,
    [],
    []
];
exports.SetIdentityHeadersInNotificationsEnabledRequest$ = [3, n0, _SIHINER,
    0,
    [_I, _NTo, _En],
    [0, 0, 2], 3
];
exports.SetIdentityHeadersInNotificationsEnabledResponse$ = [3, n0, _SIHINERe,
    0,
    [],
    []
];
exports.SetIdentityMailFromDomainRequest$ = [3, n0, _SIMFDR,
    0,
    [_I, _MFD, _BOMXF],
    [0, 0, 0], 1
];
exports.SetIdentityMailFromDomainResponse$ = [3, n0, _SIMFDRe,
    0,
    [],
    []
];
exports.SetIdentityNotificationTopicRequest$ = [3, n0, _SINTR,
    0,
    [_I, _NTo, _ST],
    [0, 0, 0], 2
];
exports.SetIdentityNotificationTopicResponse$ = [3, n0, _SINTRe,
    0,
    [],
    []
];
exports.SetReceiptRulePositionRequest$ = [3, n0, _SRRPR,
    0,
    [_RSN, _RN, _A],
    [0, 0, 0], 2
];
exports.SetReceiptRulePositionResponse$ = [3, n0, _SRRPRe,
    0,
    [],
    []
];
exports.SNSAction$ = [3, n0, _SNSA,
    0,
    [_TA, _Enc],
    [0, 0], 1
];
exports.SNSDestination$ = [3, n0, _SNSD,
    0,
    [_TARN],
    [0], 1
];
exports.StopAction$ = [3, n0, _SAt,
    0,
    [_Sc, _TA],
    [0, 0], 1
];
exports.Template$ = [3, n0, _Tem,
    0,
    [_TN, _SP, _TPe, _HP],
    [0, 0, 0, 0], 1
];
exports.TemplateMetadata$ = [3, n0, _TMe,
    0,
    [_N, _CTr],
    [0, 4]
];
exports.TestRenderTemplateRequest$ = [3, n0, _TRTR,
    0,
    [_TN, _TD],
    [0, 0], 2
];
exports.TestRenderTemplateResponse$ = [3, n0, _TRTRe,
    0,
    [_RTe],
    [0]
];
exports.TrackingOptions$ = [3, n0, _TO,
    0,
    [_CRD],
    [0]
];
exports.UpdateAccountSendingEnabledRequest$ = [3, n0, _UASER,
    0,
    [_En],
    [2]
];
exports.UpdateConfigurationSetEventDestinationRequest$ = [3, n0, _UCSEDR,
    0,
    [_CSN, _ED],
    [0, () => exports.EventDestination$], 2
];
exports.UpdateConfigurationSetEventDestinationResponse$ = [3, n0, _UCSEDRp,
    0,
    [],
    []
];
exports.UpdateConfigurationSetReputationMetricsEnabledRequest$ = [3, n0, _UCSRMER,
    0,
    [_CSN, _En],
    [0, 2], 2
];
exports.UpdateConfigurationSetSendingEnabledRequest$ = [3, n0, _UCSSER,
    0,
    [_CSN, _En],
    [0, 2], 2
];
exports.UpdateConfigurationSetTrackingOptionsRequest$ = [3, n0, _UCSTOR,
    0,
    [_CSN, _TO],
    [0, () => exports.TrackingOptions$], 2
];
exports.UpdateConfigurationSetTrackingOptionsResponse$ = [3, n0, _UCSTORp,
    0,
    [],
    []
];
exports.UpdateCustomVerificationEmailTemplateRequest$ = [3, n0, _UCVETR,
    0,
    [_TN, _FEA, _TS, _TC, _SRURL, _FRURL],
    [0, 0, 0, 0, 0, 0], 1
];
exports.UpdateReceiptRuleRequest$ = [3, n0, _URRR,
    0,
    [_RSN, _Ru],
    [0, () => exports.ReceiptRule$], 2
];
exports.UpdateReceiptRuleResponse$ = [3, n0, _URRRp,
    0,
    [],
    []
];
exports.UpdateTemplateRequest$ = [3, n0, _UTR,
    0,
    [_Tem],
    [() => exports.Template$], 1
];
exports.UpdateTemplateResponse$ = [3, n0, _UTRp,
    0,
    [],
    []
];
exports.VerifyDomainDkimRequest$ = [3, n0, _VDDR,
    0,
    [_Do],
    [0], 1
];
exports.VerifyDomainDkimResponse$ = [3, n0, _VDDRe,
    0,
    [_DT],
    [64 | 0], 1
];
exports.VerifyDomainIdentityRequest$ = [3, n0, _VDIR,
    0,
    [_Do],
    [0], 1
];
exports.VerifyDomainIdentityResponse$ = [3, n0, _VDIRe,
    0,
    [_VT],
    [0], 1
];
exports.VerifyEmailAddressRequest$ = [3, n0, _VEAR,
    0,
    [_EA],
    [0], 1
];
exports.VerifyEmailIdentityRequest$ = [3, n0, _VEIR,
    0,
    [_EA],
    [0], 1
];
exports.VerifyEmailIdentityResponse$ = [3, n0, _VEIRe,
    0,
    [],
    []
];
exports.WorkmailAction$ = [3, n0, _WA,
    0,
    [_OA, _TA],
    [0, 0], 1
];
var __Unit = "unit";
var AddressList = 64 | 0;
var BouncedRecipientInfoList = [1, n0, _BRIL,
    0, () => exports.BouncedRecipientInfo$
];
var BulkEmailDestinationList = [1, n0, _BEDL,
    0, () => exports.BulkEmailDestination$
];
var BulkEmailDestinationStatusList = [1, n0, _BEDSL,
    0, () => exports.BulkEmailDestinationStatus$
];
var CloudWatchDimensionConfigurations = [1, n0, _CWDCl,
    0, () => exports.CloudWatchDimensionConfiguration$
];
var ConfigurationSetAttributeList = 64 | 0;
var ConfigurationSets = [1, n0, _CSo,
    0, () => exports.ConfigurationSet$
];
var CustomVerificationEmailTemplates = [1, n0, _CVETu,
    0, () => exports.CustomVerificationEmailTemplate$
];
var EventDestinations = [1, n0, _EDv,
    0, () => exports.EventDestination$
];
var EventTypes = 64 | 0;
var ExtensionFieldList = [1, n0, _EFL,
    0, () => exports.ExtensionField$
];
var IdentityList = 64 | 0;
var MessageTagList = [1, n0, _MTL,
    0, () => exports.MessageTag$
];
var PolicyNameList = 64 | 0;
var ReceiptActionsList = [1, n0, _RAL,
    0, () => exports.ReceiptAction$
];
var ReceiptFilterList = [1, n0, _RFL,
    0, () => exports.ReceiptFilter$
];
var ReceiptRuleNamesList = 64 | 0;
var ReceiptRuleSetsLists = [1, n0, _RRSL,
    0, () => exports.ReceiptRuleSetMetadata$
];
var ReceiptRulesList = [1, n0, _RRL,
    0, () => exports.ReceiptRule$
];
var RecipientsList = 64 | 0;
var SendDataPointList = [1, n0, _SDPL,
    0, () => exports.SendDataPoint$
];
var TemplateMetadataList = [1, n0, _TML,
    0, () => exports.TemplateMetadata$
];
var VerificationTokenList = 64 | 0;
var DkimAttributes = [2, n0, _DA,
    0, 0, () => exports.IdentityDkimAttributes$
];
var MailFromDomainAttributes = [2, n0, _MFDA,
    0, 0, () => exports.IdentityMailFromDomainAttributes$
];
var NotificationAttributes = [2, n0, _NA,
    0, 0, () => exports.IdentityNotificationAttributes$
];
var PolicyMap = 128 | 0;
var VerificationAttributes = [2, n0, _VA,
    0, 0, () => exports.IdentityVerificationAttributes$
];
exports.CloneReceiptRuleSet$ = [9, n0, _CRRS,
    0, () => exports.CloneReceiptRuleSetRequest$, () => exports.CloneReceiptRuleSetResponse$
];
exports.CreateConfigurationSet$ = [9, n0, _CCS,
    0, () => exports.CreateConfigurationSetRequest$, () => exports.CreateConfigurationSetResponse$
];
exports.CreateConfigurationSetEventDestination$ = [9, n0, _CCSED,
    0, () => exports.CreateConfigurationSetEventDestinationRequest$, () => exports.CreateConfigurationSetEventDestinationResponse$
];
exports.CreateConfigurationSetTrackingOptions$ = [9, n0, _CCSTO,
    0, () => exports.CreateConfigurationSetTrackingOptionsRequest$, () => exports.CreateConfigurationSetTrackingOptionsResponse$
];
exports.CreateCustomVerificationEmailTemplate$ = [9, n0, _CCVET,
    0, () => exports.CreateCustomVerificationEmailTemplateRequest$, () => __Unit
];
exports.CreateReceiptFilter$ = [9, n0, _CRF,
    0, () => exports.CreateReceiptFilterRequest$, () => exports.CreateReceiptFilterResponse$
];
exports.CreateReceiptRule$ = [9, n0, _CRR,
    0, () => exports.CreateReceiptRuleRequest$, () => exports.CreateReceiptRuleResponse$
];
exports.CreateReceiptRuleSet$ = [9, n0, _CRRSr,
    0, () => exports.CreateReceiptRuleSetRequest$, () => exports.CreateReceiptRuleSetResponse$
];
exports.CreateTemplate$ = [9, n0, _CTre,
    0, () => exports.CreateTemplateRequest$, () => exports.CreateTemplateResponse$
];
exports.DeleteConfigurationSet$ = [9, n0, _DCS,
    0, () => exports.DeleteConfigurationSetRequest$, () => exports.DeleteConfigurationSetResponse$
];
exports.DeleteConfigurationSetEventDestination$ = [9, n0, _DCSED,
    0, () => exports.DeleteConfigurationSetEventDestinationRequest$, () => exports.DeleteConfigurationSetEventDestinationResponse$
];
exports.DeleteConfigurationSetTrackingOptions$ = [9, n0, _DCSTO,
    0, () => exports.DeleteConfigurationSetTrackingOptionsRequest$, () => exports.DeleteConfigurationSetTrackingOptionsResponse$
];
exports.DeleteCustomVerificationEmailTemplate$ = [9, n0, _DCVET,
    0, () => exports.DeleteCustomVerificationEmailTemplateRequest$, () => __Unit
];
exports.DeleteIdentity$ = [9, n0, _DI,
    0, () => exports.DeleteIdentityRequest$, () => exports.DeleteIdentityResponse$
];
exports.DeleteIdentityPolicy$ = [9, n0, _DIP,
    0, () => exports.DeleteIdentityPolicyRequest$, () => exports.DeleteIdentityPolicyResponse$
];
exports.DeleteReceiptFilter$ = [9, n0, _DRF,
    0, () => exports.DeleteReceiptFilterRequest$, () => exports.DeleteReceiptFilterResponse$
];
exports.DeleteReceiptRule$ = [9, n0, _DRR,
    0, () => exports.DeleteReceiptRuleRequest$, () => exports.DeleteReceiptRuleResponse$
];
exports.DeleteReceiptRuleSet$ = [9, n0, _DRRS,
    0, () => exports.DeleteReceiptRuleSetRequest$, () => exports.DeleteReceiptRuleSetResponse$
];
exports.DeleteTemplate$ = [9, n0, _DTel,
    0, () => exports.DeleteTemplateRequest$, () => exports.DeleteTemplateResponse$
];
exports.DeleteVerifiedEmailAddress$ = [9, n0, _DVEA,
    0, () => exports.DeleteVerifiedEmailAddressRequest$, () => __Unit
];
exports.DescribeActiveReceiptRuleSet$ = [9, n0, _DARRS,
    0, () => exports.DescribeActiveReceiptRuleSetRequest$, () => exports.DescribeActiveReceiptRuleSetResponse$
];
exports.DescribeConfigurationSet$ = [9, n0, _DCSe,
    0, () => exports.DescribeConfigurationSetRequest$, () => exports.DescribeConfigurationSetResponse$
];
exports.DescribeReceiptRule$ = [9, n0, _DRRe,
    0, () => exports.DescribeReceiptRuleRequest$, () => exports.DescribeReceiptRuleResponse$
];
exports.DescribeReceiptRuleSet$ = [9, n0, _DRRSe,
    0, () => exports.DescribeReceiptRuleSetRequest$, () => exports.DescribeReceiptRuleSetResponse$
];
exports.GetAccountSendingEnabled$ = [9, n0, _GASE,
    0, () => __Unit, () => exports.GetAccountSendingEnabledResponse$
];
exports.GetCustomVerificationEmailTemplate$ = [9, n0, _GCVET,
    0, () => exports.GetCustomVerificationEmailTemplateRequest$, () => exports.GetCustomVerificationEmailTemplateResponse$
];
exports.GetIdentityDkimAttributes$ = [9, n0, _GIDA,
    0, () => exports.GetIdentityDkimAttributesRequest$, () => exports.GetIdentityDkimAttributesResponse$
];
exports.GetIdentityMailFromDomainAttributes$ = [9, n0, _GIMFDA,
    0, () => exports.GetIdentityMailFromDomainAttributesRequest$, () => exports.GetIdentityMailFromDomainAttributesResponse$
];
exports.GetIdentityNotificationAttributes$ = [9, n0, _GINA,
    0, () => exports.GetIdentityNotificationAttributesRequest$, () => exports.GetIdentityNotificationAttributesResponse$
];
exports.GetIdentityPolicies$ = [9, n0, _GIP,
    0, () => exports.GetIdentityPoliciesRequest$, () => exports.GetIdentityPoliciesResponse$
];
exports.GetIdentityVerificationAttributes$ = [9, n0, _GIVA,
    0, () => exports.GetIdentityVerificationAttributesRequest$, () => exports.GetIdentityVerificationAttributesResponse$
];
exports.GetSendQuota$ = [9, n0, _GSQ,
    0, () => __Unit, () => exports.GetSendQuotaResponse$
];
exports.GetSendStatistics$ = [9, n0, _GSS,
    0, () => __Unit, () => exports.GetSendStatisticsResponse$
];
exports.GetTemplate$ = [9, n0, _GT,
    0, () => exports.GetTemplateRequest$, () => exports.GetTemplateResponse$
];
exports.ListConfigurationSets$ = [9, n0, _LCS,
    0, () => exports.ListConfigurationSetsRequest$, () => exports.ListConfigurationSetsResponse$
];
exports.ListCustomVerificationEmailTemplates$ = [9, n0, _LCVET,
    0, () => exports.ListCustomVerificationEmailTemplatesRequest$, () => exports.ListCustomVerificationEmailTemplatesResponse$
];
exports.ListIdentities$ = [9, n0, _LI,
    0, () => exports.ListIdentitiesRequest$, () => exports.ListIdentitiesResponse$
];
exports.ListIdentityPolicies$ = [9, n0, _LIP,
    0, () => exports.ListIdentityPoliciesRequest$, () => exports.ListIdentityPoliciesResponse$
];
exports.ListReceiptFilters$ = [9, n0, _LRF,
    0, () => exports.ListReceiptFiltersRequest$, () => exports.ListReceiptFiltersResponse$
];
exports.ListReceiptRuleSets$ = [9, n0, _LRRS,
    0, () => exports.ListReceiptRuleSetsRequest$, () => exports.ListReceiptRuleSetsResponse$
];
exports.ListTemplates$ = [9, n0, _LT,
    0, () => exports.ListTemplatesRequest$, () => exports.ListTemplatesResponse$
];
exports.ListVerifiedEmailAddresses$ = [9, n0, _LVEA,
    0, () => __Unit, () => exports.ListVerifiedEmailAddressesResponse$
];
exports.PutConfigurationSetDeliveryOptions$ = [9, n0, _PCSDO,
    0, () => exports.PutConfigurationSetDeliveryOptionsRequest$, () => exports.PutConfigurationSetDeliveryOptionsResponse$
];
exports.PutIdentityPolicy$ = [9, n0, _PIP,
    0, () => exports.PutIdentityPolicyRequest$, () => exports.PutIdentityPolicyResponse$
];
exports.ReorderReceiptRuleSet$ = [9, n0, _RRRS,
    0, () => exports.ReorderReceiptRuleSetRequest$, () => exports.ReorderReceiptRuleSetResponse$
];
exports.SendBounce$ = [9, n0, _SB,
    0, () => exports.SendBounceRequest$, () => exports.SendBounceResponse$
];
exports.SendBulkTemplatedEmail$ = [9, n0, _SBTE,
    0, () => exports.SendBulkTemplatedEmailRequest$, () => exports.SendBulkTemplatedEmailResponse$
];
exports.SendCustomVerificationEmail$ = [9, n0, _SCVE,
    0, () => exports.SendCustomVerificationEmailRequest$, () => exports.SendCustomVerificationEmailResponse$
];
exports.SendEmail$ = [9, n0, _SEen,
    0, () => exports.SendEmailRequest$, () => exports.SendEmailResponse$
];
exports.SendRawEmail$ = [9, n0, _SRE,
    0, () => exports.SendRawEmailRequest$, () => exports.SendRawEmailResponse$
];
exports.SendTemplatedEmail$ = [9, n0, _STE,
    0, () => exports.SendTemplatedEmailRequest$, () => exports.SendTemplatedEmailResponse$
];
exports.SetActiveReceiptRuleSet$ = [9, n0, _SARRS,
    0, () => exports.SetActiveReceiptRuleSetRequest$, () => exports.SetActiveReceiptRuleSetResponse$
];
exports.SetIdentityDkimEnabled$ = [9, n0, _SIDE,
    0, () => exports.SetIdentityDkimEnabledRequest$, () => exports.SetIdentityDkimEnabledResponse$
];
exports.SetIdentityFeedbackForwardingEnabled$ = [9, n0, _SIFFE,
    0, () => exports.SetIdentityFeedbackForwardingEnabledRequest$, () => exports.SetIdentityFeedbackForwardingEnabledResponse$
];
exports.SetIdentityHeadersInNotificationsEnabled$ = [9, n0, _SIHINE,
    0, () => exports.SetIdentityHeadersInNotificationsEnabledRequest$, () => exports.SetIdentityHeadersInNotificationsEnabledResponse$
];
exports.SetIdentityMailFromDomain$ = [9, n0, _SIMFD,
    0, () => exports.SetIdentityMailFromDomainRequest$, () => exports.SetIdentityMailFromDomainResponse$
];
exports.SetIdentityNotificationTopic$ = [9, n0, _SINT,
    0, () => exports.SetIdentityNotificationTopicRequest$, () => exports.SetIdentityNotificationTopicResponse$
];
exports.SetReceiptRulePosition$ = [9, n0, _SRRP,
    0, () => exports.SetReceiptRulePositionRequest$, () => exports.SetReceiptRulePositionResponse$
];
exports.TestRenderTemplate$ = [9, n0, _TRT,
    0, () => exports.TestRenderTemplateRequest$, () => exports.TestRenderTemplateResponse$
];
exports.UpdateAccountSendingEnabled$ = [9, n0, _UASE,
    0, () => exports.UpdateAccountSendingEnabledRequest$, () => __Unit
];
exports.UpdateConfigurationSetEventDestination$ = [9, n0, _UCSED,
    0, () => exports.UpdateConfigurationSetEventDestinationRequest$, () => exports.UpdateConfigurationSetEventDestinationResponse$
];
exports.UpdateConfigurationSetReputationMetricsEnabled$ = [9, n0, _UCSRME,
    0, () => exports.UpdateConfigurationSetReputationMetricsEnabledRequest$, () => __Unit
];
exports.UpdateConfigurationSetSendingEnabled$ = [9, n0, _UCSSE,
    0, () => exports.UpdateConfigurationSetSendingEnabledRequest$, () => __Unit
];
exports.UpdateConfigurationSetTrackingOptions$ = [9, n0, _UCSTO,
    0, () => exports.UpdateConfigurationSetTrackingOptionsRequest$, () => exports.UpdateConfigurationSetTrackingOptionsResponse$
];
exports.UpdateCustomVerificationEmailTemplate$ = [9, n0, _UCVET,
    0, () => exports.UpdateCustomVerificationEmailTemplateRequest$, () => __Unit
];
exports.UpdateReceiptRule$ = [9, n0, _URR,
    0, () => exports.UpdateReceiptRuleRequest$, () => exports.UpdateReceiptRuleResponse$
];
exports.UpdateTemplate$ = [9, n0, _UT,
    0, () => exports.UpdateTemplateRequest$, () => exports.UpdateTemplateResponse$
];
exports.VerifyDomainDkim$ = [9, n0, _VDD,
    0, () => exports.VerifyDomainDkimRequest$, () => exports.VerifyDomainDkimResponse$
];
exports.VerifyDomainIdentity$ = [9, n0, _VDI,
    0, () => exports.VerifyDomainIdentityRequest$, () => exports.VerifyDomainIdentityResponse$
];
exports.VerifyEmailAddress$ = [9, n0, _VEAe,
    0, () => exports.VerifyEmailAddressRequest$, () => __Unit
];
exports.VerifyEmailIdentity$ = [9, n0, _VEI,
    0, () => exports.VerifyEmailIdentityRequest$, () => exports.VerifyEmailIdentityResponse$
];
