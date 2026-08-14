import { request, streamSse } from './http'

export interface CustomerView { id: string; tenantId: string; name: string; country: string; tag: string; createdAt: string }
export interface ContactView { id: string; customerId: string; name: string; email: string; phone: string; position: string; primary: boolean; createdAt: string }
export interface FollowupView { id: string; customerId: string; type: string; content: string; operatorName: string; createdAt: string }
export interface CustomerDetailView { customer: CustomerView; contacts: ContactView[]; timeline: FollowupView[] }
export interface ProductView { id: string; tenantId: string; sku: string; name: string; specification: string; currency: string; unitPrice: number; moq: number; active: boolean; createdAt: string }
export interface InquiryView { id: string; tenantId: string; customerId: string; subject: string; content: string; status: string; createdAt: string }
export interface InquiryAnalysis { intent: string; urgency: string; nextActions: string[]; modelSummary: string; replyDraft: string; quotationDraft: string }
export interface AiProviderStatus { provider: string; model: string; configured: boolean; fallbackEnabled: boolean }
export interface KnowledgeArticleView { id: string; tenantId: string; title: string; category: string; content: string; active: boolean; updatedBy: string; createdAt: string; updatedAt: string }
export interface ChannelConfigView { id: string; channelType: string; displayName: string; accountRef: string; enabled: boolean; connectionStatus: string; updatedAt: string }
export interface SubscriptionView { planCode: string; planName: string; monthlyPrice: number; membersUsed: number; memberLimit: number; customersUsed: number; customerLimit: number; aiCreditsUsed: number; aiCreditLimit: number }
export interface BulkImportResult { received: number; imported: number; skipped: number; errors: string[] }
export interface AiStreamEvent { type: 'delta' | 'complete' | 'error'; delta?: string; analysis?: InquiryAnalysis; message?: string }
export interface QuotationItemView { id: string; productId: string; productName: string; specification: string; quantity: number; unitPrice: number; amount: number }
export interface QuotationView { id: string; tenantId: string; customerId: string; quotationNo: string; productName: string; quantity: number; unitPrice: number; currency: string; tradeTerm: string; destinationPort: string; freight: number; totalAmount: number; validUntil: string; notes: string; status: string; items: QuotationItemView[]; createdAt: string }
export interface QuotationApprovalView { id: string; quotationId: string; action: string; comment: string; operatorId: string; createdAt: string }
export interface OrderView { id: string; tenantId: string; customerId: string; customerName: string; productId: string; productName: string; status: string; deliveryDate: string; risk: boolean }
export interface TaskView { id: string; tenantId: string; title: string; priority: string; status: string; dueAt: string; relatedType: string; relatedId: string }
export interface NotificationView { id: string; tenantId: string; title: string; content: string; read: boolean; createdAt: string }
export interface TenantProfileResponse { tenantId: string; name: string; plan: string; aiCreditsUsed: number; aiCreditsLimit: number }
export interface MemberView { id: string; tenantId: string; username: string; displayName: string; email: string; role: string; status: string; createdAt: string }
export interface AuditLogView { id: string; tenantId: string; actor: string; module: string; action: string; targetId: string; detail: string; createdAt: string }
export interface DailyReport { openTasks: number; newInquiries: number; riskyOrders: number; summary: string }
export interface AuthLoginResponse { token: string; userId: string; tenantId: string; role: string; username: string; sessionId: string; expiresInSeconds: number }
export interface LoginCaptchaResponse { captchaId: string; imageDataUrl: string; expiresInSeconds: number }
export interface RegisterRequest { tenantName: string; username: string; password: string; displayName: string; phone: string; verificationCode: string }
export interface SmsCodeResponse { expiresInSeconds: number }
export interface WechatAuthorizationResponse { authorizationUrl: string }

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
  auditLogs: (module = '', keyword = '') => request<AuditLogView[]>(`/tenant/audit-logs?module=${encodeURIComponent(module)}&keyword=${encodeURIComponent(keyword)}`),
  knowledgeArticles: () => request<KnowledgeArticleView[]>('/tenant/knowledge'),
  createKnowledgeArticle: (data: { title: string; category: string; content: string; active: boolean }) => request<KnowledgeArticleView>('/tenant/knowledge', { method: 'post', data }),
  updateKnowledgeArticle: (id: string, data: { title: string; category: string; content: string; active: boolean }) => request<KnowledgeArticleView>(`/tenant/knowledge/${id}`, { method: 'put', data }),
  deleteKnowledgeArticle: (id: string) => request<void>(`/tenant/knowledge/${id}`, { method: 'delete' }),
  channels: () => request<ChannelConfigView[]>('/tenant/channels'),
  saveChannel: (data: { channelType: string; displayName: string; accountRef: string; enabled: boolean }) => request<ChannelConfigView>('/tenant/channels', { method: 'put', data }),
  subscription: () => request<SubscriptionView>('/tenant/subscription'),
  dailyReport: () => request<DailyReport>('/task/daily-report'),
  customers: () => request<CustomerView[]>('/customer'),
  customerTags: () => request<string[]>('/customer/tags'),
  customer: (id: string) => request<CustomerDetailView>(`/customer/${id}`),
  createCustomer: (data: CreateCustomerRequest) => request<CustomerView>('/customer', { method: 'post', data }),
  importCustomers: (rows: CreateCustomerRequest[]) => request<BulkImportResult>('/customer/import', { method: 'post', data: { rows } }),
  updateCustomer: (id: string, data: CreateCustomerRequest) => request<CustomerView>(`/customer/${id}`, { method: 'put', data }),
  deleteCustomer: (id: string) => request<void>(`/customer/${id}`, { method: 'delete' }),
  addContact: (id: string, data: { name: string; email: string; phone: string; position: string; primary: boolean }) => request<ContactView>(`/customer/${id}/contacts`, { method: 'post', data }),
  addFollowup: (id: string, data: { type: string; content: string; operatorName: string }) => request<FollowupView>(`/customer/${id}/followups`, { method: 'post', data }),
  products: (keyword = '') => request<ProductView[]>(`/product?keyword=${encodeURIComponent(keyword)}`),
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
  submitQuotationApproval: (id: string, comment: string) => request<QuotationView>(`/quotation/${id}/submit-approval`, { method: 'post', data: { comment } }),
  decideQuotationApproval: (id: string, approved: boolean, comment: string) => request<QuotationView>(`/quotation/${id}/${approved ? 'approve' : 'reject'}`, { method: 'post', data: { comment } }),
  orders: () => request<OrderView[]>('/order'),
  createOrder: (data: CreateOrderRequest) => request<OrderView>('/order', { method: 'post', data }),
  updateOrderStatus: (id: string, status: string) => request<OrderView>(`/order/${id}/status/${status}`, { method: 'patch' }),
  tasks: () => request<TaskView[]>('/task'),
  createTask: (data: CreateTaskRequest) => request<TaskView>('/task', { method: 'post', data }),
  completeTask: (id: string) => request<TaskView>(`/task/${id}/done`, { method: 'patch' }),
  notifications: () => request<NotificationView[]>('/notification'),
  createNotification: (data: CreateNotificationRequest) => request<NotificationView>('/notification', { method: 'post', data }),
  markNotificationRead: (id: string) => request<NotificationView>(`/notification/${id}/read`, { method: 'patch' }),
  markAllNotificationsRead: () => request<number>('/notification/read-all', { method: 'patch' })
}
