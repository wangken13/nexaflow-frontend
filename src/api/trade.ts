import { request, streamSse } from './http'

export interface CustomerView { id: string; tenantId: string; name: string; country: string; tag: string; ownerId: string; ownerName: string; departmentId: string; departmentName: string; createdAt: string }
export interface ContactView { id: string; customerId: string; name: string; email: string; phone: string; position: string; primary: boolean; createdAt: string }
export interface FollowupView { id: string; customerId: string; type: string; content: string; operatorName: string; createdAt: string }
export interface CustomerDetailView { customer: CustomerView; contacts: ContactView[]; timeline: FollowupView[] }
export interface ProductView { id: string; tenantId: string; sku: string; name: string; specification: string; currency: string; unitPrice: number; moq: number; active: boolean; createdAt: string }
export interface InquiryView { id: string; tenantId: string; customerId: string; subject: string; content: string; status: string; sourceChannel: string; externalId: string; ownerId: string; nextActionDue: string; createdAt: string }
export interface KnowledgeReference { id: string; title: string; category: string }
export interface InquiryAnalysis { intent: string; urgency: string; nextActions: string[]; modelSummary: string; replyDraft: string; quotationDraft: string; knowledgeSufficient: boolean; sources: KnowledgeReference[] }
export interface AiProviderStatus { provider: string; model: string; configured: boolean; fallbackEnabled: boolean }
export interface KnowledgeArticleView { id: string; tenantId: string; title: string; category: string; content: string; active: boolean; updatedBy: string; createdAt: string; updatedAt: string }
export interface ChannelConfigView { id: string; channelType: string; displayName: string; accountRef: string; enabled: boolean; connectionStatus: string; updatedAt: string }
export interface ChannelCredentialView { id: string; displayName: string; channelType: string; endpointPath: string; signingSecret: string; active: boolean; lastUsedAt: string; createdAt: string }
export interface EmailMailboxView { id: string; displayName: string; emailAddress: string; host: string; port: number; username: string; folder: string; active: boolean; connectionStatus: string; lastSyncAt: string; lastError: string; createdAt: string }
export interface IntegrationInvocationView { id: string; credentialId: string; requestId: string; httpMethod: string; requestPath: string; clientIp: string; outcome: string; durationMs: number; createdAt: string }
export interface SubscriptionView { planCode: string; planName: string; monthlyPrice: number; membersUsed: number; memberLimit: number; customersUsed: number; customerLimit: number; aiCreditsUsed: number; aiCreditLimit: number }
export interface PlanView { planCode: string; planName: string; memberLimit: number; customerLimit: number; aiCreditLimit: number; monthlyPrice: number }
export interface SubscriptionOrderView { id: string; planCode: string; planName: string; billingMonths: number; amount: number; status: string; checkoutUrl: string; providerTransactionId: string; createdAt: string; paidAt: string; expiresAt: string }
export interface InvoiceRequestView { id: string; orderId: string; invoiceTitle: string; taxNumber: string; recipientEmail: string; status: string; createdAt: string }
export interface RefundRequestView { id: string; orderId: string; reason: string; status: string; createdAt: string }
export interface BulkImportResult { jobId: string; received: number; imported: number; skipped: number; errors: string[] }
export interface ImportJobView { id: string; resourceType: string; status: string; received: number; imported: number; skipped: number; operatorId: string; createdAt: string; completedAt: string; errors: string[] }
export interface AiStreamEvent { type: 'delta' | 'complete' | 'error'; delta?: string; analysis?: InquiryAnalysis; message?: string }
export interface QuotationItemView { id: string; productId: string; productName: string; specification: string; quantity: number; unitPrice: number; amount: number }
export interface QuotationView { id: string; tenantId: string; customerId: string; quotationNo: string; productName: string; quantity: number; unitPrice: number; currency: string; tradeTerm: string; destinationPort: string; freight: number; totalAmount: number; validUntil: string; notes: string; approvalRequired: boolean; approvalReason: string; status: string; items: QuotationItemView[]; createdAt: string }
export interface QuotationApprovalView { id: string; quotationId: string; action: string; comment: string; operatorId: string; createdAt: string }
export interface ApprovalRuleView { id: string; tenantId: string; name: string; ruleType: string; thresholdAmount: number | null; conditionValue: string; enabled: boolean; createdAt: string; updatedAt: string }
export interface OrderView { id: string; tenantId: string; customerId: string; customerName: string; productId: string; productName: string; status: string; deliveryDate: string; risk: boolean }
export interface TaskView { id: string; tenantId: string; title: string; priority: string; status: string; dueAt: string; relatedType: string; relatedId: string }
export interface NotificationView { id: string; tenantId: string; title: string; content: string; read: boolean; createdAt: string }
export interface SupportMessageView { id: string; ticketId: string; authorId: string; content: string; createdAt: string }
export interface SupportTicketView { id: string; tenantId: string; createdBy: string; category: string; priority: string; subject: string; description: string; status: string; assignedTo: string; createdAt: string; updatedAt: string; messages: SupportMessageView[] }
export interface TenantProfileResponse { tenantId: string; name: string; plan: string; aiCreditsUsed: number; aiCreditsLimit: number }
export interface MemberView { id: string; tenantId: string; username: string; displayName: string; email: string; departmentId: string; departmentName: string; role: string; dataScope: string; status: string; createdAt: string }
export interface DepartmentView { id: string; tenantId: string; name: string; parentId: string; status: string; createdAt: string }
export interface AuditLogView { id: string; tenantId: string; actor: string; module: string; action: string; targetId: string; detail: string; createdAt: string }
export interface DailyReport { openTasks: number; newInquiries: number; riskyOrders: number; pendingApprovals: number; overdueTasks: number; summary: string }
export interface AuthLoginResponse { token: string; userId: string; tenantId: string; role: string; username: string; sessionId: string; expiresInSeconds: number }
export interface LoginCaptchaResponse { captchaId: string; imageDataUrl: string; expiresInSeconds: number }
export interface RegisterRequest { tenantName: string; username: string; password: string; displayName: string; phone: string; verificationCode: string }
export interface SmsCodeResponse { expiresInSeconds: number }
export interface WechatAuthorizationResponse { authorizationUrl: string }
export interface OnboardingStepView { code: string; title: string; description: string; completed: boolean; currentCount: number }
export interface OnboardingView { completedSteps: number; totalSteps: number; demoDataPresent: boolean; steps: OnboardingStepView[] }

export interface CreateCustomerRequest { name: string; country: string; tag: string }
export interface UpsertProductRequest { sku: string; name: string; specification: string; currency: string; unitPrice: number; moq: number; active: boolean }
export interface CreateInquiryRequest { customerId: string; subject: string; content: string; analysisMode?: 'ASYNC' | 'STREAM' }
export interface QuotationItemRequest { productId: string; productName: string; specification: string; quantity: number; unitPrice: number }
export interface CreateQuotationRequest { customerId: string; currency: string; tradeTerm: string; destinationPort: string; freight: number; validUntil: string; notes: string; items: QuotationItemRequest[] }
export interface CreateOrderRequest { customerId: string; productId: string; deliveryDate: string }
export interface CreateTaskRequest { title: string; priority: string; dueAt: string; relatedType?: string; relatedId?: string }
export interface CreateNotificationRequest { title: string; content: string }
export interface CreateMemberRequest { username: string; password: string; displayName: string; email: string; role: string }

export const tradeApi = {
  loginCaptcha: () => request<LoginCaptchaResponse>('/auth/captcha'),
  register: (data: RegisterRequest) => request<{ tenantId: string; username: string }>('/auth/register', { method: 'post', data }),
  sendSmsCode: (phone: string, purpose: 'LOGIN' | 'REGISTER') => request<SmsCodeResponse>('/auth/sms-codes', { method: 'post', data: { phone, purpose } }),
  smsLogin: (phone: string, verificationCode: string) => request<AuthLoginResponse>('/auth/sms-login', { method: 'post', data: { phone, verificationCode } }),
  wechatAuthorization: () => request<WechatAuthorizationResponse>('/auth/wechat/authorize'),
  refreshSession: () => request<AuthLoginResponse>('/auth/refresh', { method: 'post' }),
  logout: () => request<void>('/auth/logout', { method: 'post' }),
  wechatTicketLogin: (ticket: string) => request<AuthLoginResponse>('/auth/wechat/login', { method: 'post', data: { ticket } }),
  tenantProfile: () => request<TenantProfileResponse>('/tenant/profile'),
  members: () => request<MemberView[]>('/tenant/members'),
  createMember: (data: CreateMemberRequest) => request<MemberView>('/tenant/members', { method: 'post', data }),
  updateMemberRole: (id: string, role: string) => request<MemberView>(`/tenant/members/${id}/role/${role}`, { method: 'patch' }),
  updateMemberStatus: (id: string, status: string) => request<MemberView>(`/tenant/members/${id}/status/${status}`, { method: 'patch' }),
  updateMemberAccess: (id: string, data: { departmentId: string; dataScope: string }) => request<MemberView>(`/tenant/members/${id}/access`, { method: 'patch', data }),
  departments: () => request<DepartmentView[]>('/tenant/departments'),
  createDepartment: (data: { name: string; parentId: string }) => request<DepartmentView>('/tenant/departments', { method: 'post', data }),
  updateDepartmentStatus: (id: string, status: string) => request<DepartmentView>(`/tenant/departments/${id}/status/${status}`, { method: 'patch' }),
  auditLogs: (module = '', keyword = '') => request<AuditLogView[]>(`/tenant/audit-logs?module=${encodeURIComponent(module)}&keyword=${encodeURIComponent(keyword)}`),
  importJobs: () => request<ImportJobView[]>('/tenant/import-jobs'),
  onboarding: () => request<OnboardingView>('/tenant/onboarding'),
  createDemoData: () => request<OnboardingView>('/tenant/onboarding/demo-data', { method: 'post' }),
  clearDemoData: () => request<OnboardingView>('/tenant/onboarding/demo-data', { method: 'delete' }),
  knowledgeArticles: () => request<KnowledgeArticleView[]>('/tenant/knowledge'),
  createKnowledgeArticle: (data: { title: string; category: string; content: string; active: boolean }) => request<KnowledgeArticleView>('/tenant/knowledge', { method: 'post', data }),
  updateKnowledgeArticle: (id: string, data: { title: string; category: string; content: string; active: boolean }) => request<KnowledgeArticleView>(`/tenant/knowledge/${id}`, { method: 'put', data }),
  deleteKnowledgeArticle: (id: string) => request<void>(`/tenant/knowledge/${id}`, { method: 'delete' }),
  channels: () => request<ChannelConfigView[]>('/tenant/channels'),
  saveChannel: (data: { channelType: string; displayName: string; accountRef: string; enabled: boolean }) => request<ChannelConfigView>('/tenant/channels', { method: 'put', data }),
  channelCredentials: () => request<ChannelCredentialView[]>('/inquiry/channel-credentials'),
  createChannelCredential: (data: { displayName: string; channelType: string }) => request<ChannelCredentialView>('/inquiry/channel-credentials', { method: 'post', data }),
  revokeChannelCredential: (id: string) => request<void>(`/inquiry/channel-credentials/${id}`, { method: 'delete' }),
  integrationInvocations: () => request<IntegrationInvocationView[]>('/inquiry/channel-credentials/invocations'),
  emailMailboxes: () => request<EmailMailboxView[]>('/inquiry/email-mailboxes'),
  createEmailMailbox: (data: { displayName: string; emailAddress: string; host: string; port: number; username: string; password: string; folder: string }) => request<EmailMailboxView>('/inquiry/email-mailboxes', { method: 'post', data }),
  disableEmailMailbox: (id: string) => request<void>(`/inquiry/email-mailboxes/${id}`, { method: 'delete' }),
  subscription: () => request<SubscriptionView>('/tenant/subscription'),
  billingPlans: () => request<PlanView[]>('/tenant/billing/plans'),
  billingOrders: () => request<SubscriptionOrderView[]>('/tenant/billing/orders'),
  createBillingOrder: (data: { planCode: string; billingMonths: number }) => request<SubscriptionOrderView>('/tenant/billing/orders', { method: 'post', data }),
  invoiceRequests: () => request<InvoiceRequestView[]>('/tenant/billing/invoices'),
  createInvoiceRequest: (orderId: string, data: { invoiceTitle: string; taxNumber: string; recipientEmail: string }) => request<InvoiceRequestView>(`/tenant/billing/orders/${orderId}/invoice`, { method: 'post', data }),
  refundRequests: () => request<RefundRequestView[]>('/tenant/billing/refunds'),
  createRefundRequest: (orderId: string, reason: string) => request<RefundRequestView>(`/tenant/billing/orders/${orderId}/refund`, { method: 'post', data: { reason } }),
  dailyReport: () => request<DailyReport>('/task/daily-report'),
  customers: () => request<CustomerView[]>('/customer'),
  exportCustomers: () => request<CustomerView[]>('/customer/export', { method: 'post' }),
  customerTags: () => request<string[]>('/customer/tags'),
  customer: (id: string) => request<CustomerDetailView>(`/customer/${id}`),
  createCustomer: (data: CreateCustomerRequest) => request<CustomerView>('/customer', { method: 'post', data }),
  importCustomers: (rows: CreateCustomerRequest[]) => request<BulkImportResult>('/customer/import', { method: 'post', data: { rows } }),
  updateCustomer: (id: string, data: CreateCustomerRequest) => request<CustomerView>(`/customer/${id}`, { method: 'put', data }),
  assignCustomerOwner: (id: string, ownerId: string) => request<CustomerView>(`/customer/${id}/owner`, { method: 'patch', data: { ownerId } }),
  deleteCustomer: (id: string) => request<void>(`/customer/${id}`, { method: 'delete' }),
  addContact: (id: string, data: { name: string; email: string; phone: string; position: string; primary: boolean }) => request<ContactView>(`/customer/${id}/contacts`, { method: 'post', data }),
  addFollowup: (id: string, data: { type: string; content: string; operatorName: string }) => request<FollowupView>(`/customer/${id}/followups`, { method: 'post', data }),
  products: (keyword = '') => request<ProductView[]>(`/product?keyword=${encodeURIComponent(keyword)}`),
  exportProducts: () => request<ProductView[]>('/product/export', { method: 'post' }),
  product: (id: string) => request<ProductView>(`/product/${id}`),
  createProduct: (data: UpsertProductRequest) => request<ProductView>('/product', { method: 'post', data }),
  importProducts: (rows: UpsertProductRequest[]) => request<BulkImportResult>('/product/import', { method: 'post', data: { rows } }),
  updateProduct: (id: string, data: UpsertProductRequest) => request<ProductView>(`/product/${id}`, { method: 'put', data }),
  deleteProduct: (id: string) => request<void>(`/product/${id}`, { method: 'delete' }),
  inquiries: () => request<InquiryView[]>('/inquiry'),
  inquiry: (id: string) => request<InquiryView>(`/inquiry/${id}`),
  createInquiry: (data: CreateInquiryRequest) => request<InquiryView>('/inquiry', { method: 'post', data }),
  updateInquiryStatus: (id: string, status: string) => request<InquiryView>(`/inquiry/${id}/status/${status}`, { method: 'patch' }),
  analyzeInquiry: (inquiryId: string, content: string) => request<InquiryAnalysis>('/ai/analyze-inquiry', { method: 'post', data: { inquiryId, content } }),
  streamInquiryAnalysis: (inquiryId: string, content: string, onEvent: (event: AiStreamEvent) => void, signal?: AbortSignal) =>
    streamSse<AiStreamEvent>('/ai/analyze-inquiry/stream', { inquiryId, content }, message => onEvent(message.data), signal),
  analysisHistory: (inquiryId: string) => request<InquiryAnalysis[]>(`/ai/inquiries/${inquiryId}/history`),
  aiProviderStatus: () => request<AiProviderStatus>('/ai/provider-status'),
  quotations: () => request<QuotationView[]>('/quotation'),
  quotation: (id: string) => request<QuotationView>(`/quotation/${id}`),
  createQuotation: (data: CreateQuotationRequest) => request<QuotationView>('/quotation', { method: 'post', data }),
  updateQuotationStatus: (id: string, status: string) => request<QuotationView>(`/quotation/${id}/status/${status}`, { method: 'patch' }),
  quotationApprovals: (id: string) => request<QuotationApprovalView[]>(`/quotation/${id}/approvals`),
  approvalRules: () => request<ApprovalRuleView[]>('/quotation/approval-rules'),
  createApprovalRule: (data: { name: string; ruleType: string; thresholdAmount: number | null; conditionValue: string; enabled: boolean }) => request<ApprovalRuleView>('/quotation/approval-rules', { method: 'post', data }),
  updateApprovalRule: (id: string, data: { name: string; ruleType: string; thresholdAmount: number | null; conditionValue: string; enabled: boolean }) => request<ApprovalRuleView>(`/quotation/approval-rules/${id}`, { method: 'put', data }),
  deleteApprovalRule: (id: string) => request<void>(`/quotation/approval-rules/${id}`, { method: 'delete' }),
  submitQuotationApproval: (id: string, comment: string) => request<QuotationView>(`/quotation/${id}/submit-approval`, { method: 'post', data: { comment } }),
  decideQuotationApproval: (id: string, approved: boolean, comment: string) => request<QuotationView>(`/quotation/${id}/${approved ? 'approve' : 'reject'}`, { method: 'post', data: { comment } }),
  orders: () => request<OrderView[]>('/order'),
  exportOrders: () => request<OrderView[]>('/order/export', { method: 'post' }),
  createOrder: (data: CreateOrderRequest) => request<OrderView>('/order', { method: 'post', data }),
  updateOrderStatus: (id: string, status: string) => request<OrderView>(`/order/${id}/status/${status}`, { method: 'patch' }),
  tasks: () => request<TaskView[]>('/task'),
  createTask: (data: CreateTaskRequest) => request<TaskView>('/task', { method: 'post', data }),
  completeTask: (id: string) => request<TaskView>(`/task/${id}/done`, { method: 'patch' }),
  notifications: () => request<NotificationView[]>('/notification'),
  createNotification: (data: CreateNotificationRequest) => request<NotificationView>('/notification', { method: 'post', data }),
  markNotificationRead: (id: string) => request<NotificationView>(`/notification/${id}/read`, { method: 'patch' }),
  markAllNotificationsRead: () => request<number>('/notification/read-all', { method: 'patch' }),
  supportTickets: () => request<SupportTicketView[]>('/notification/tickets'),
  supportTicket: (id: string) => request<SupportTicketView>(`/notification/tickets/${id}`),
  createSupportTicket: (data: { category: string; priority: string; subject: string; description: string }) => request<SupportTicketView>('/notification/tickets', { method: 'post', data }),
  replySupportTicket: (id: string, content: string) => request<SupportMessageView>(`/notification/tickets/${id}/messages`, { method: 'post', data: { content } }),
  closeSupportTicket: (id: string) => request<SupportTicketView>(`/notification/tickets/${id}/close`, { method: 'patch' })
}
