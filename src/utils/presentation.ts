export const inquiryStatusLabels: Record<string, string> = {
  PENDING_AI: '等待分析',
  ANALYZED: '已完成分析',
  QUOTED: '已发送报价',
  FOLLOWING: '持续跟进中',
  CLOSED: '已结束'
}

export const quotationStatusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_APPROVAL: '等待审批',
  APPROVED: '已批准',
  SENT: '已发送给客户',
  ACCEPTED: '客户已接受',
  REJECTED: '已拒绝',
  EXPIRED: '已过期'
}

export const orderStatusLabels: Record<string, string> = {
  RISK_REVIEW: '等待风险确认',
  CONFIRMED: '订单已确认',
  PRODUCING: '生产中',
  PRODUCTION: '生产中',
  READY_TO_SHIP: '等待发运',
  SHIPPED: '运输中',
  DELIVERED: '已交付',
  CANCELLED: '已取消'
}

export const priorityLabels: Record<string, string> = {
  HIGH: '紧急',
  NORMAL: '普通',
  LOW: '低优先级'
}

export const roleLabels: Record<string, string> = {
  OWNER: '企业负责人',
  ADMIN: '管理员',
  SALES: '销售人员',
  OPERATOR: '运营人员',
  VIEWER: '只读成员'
}

export const currencyOptions = [
  { value: 'USD', label: '美元（USD）' },
  { value: 'EUR', label: '欧元（EUR）' },
  { value: 'CNY', label: '人民币（CNY）' },
  { value: 'GBP', label: '英镑（GBP）' }
]

export const countryOptions = [
  { value: 'AU', label: '澳大利亚' },
  { value: 'BR', label: '巴西' },
  { value: 'CA', label: '加拿大' },
  { value: 'CL', label: '智利' },
  { value: 'CN', label: '中国大陆' },
  { value: 'EG', label: '埃及' },
  { value: 'FR', label: '法国' },
  { value: 'DE', label: '德国' },
  { value: 'IN', label: '印度' },
  { value: 'ID', label: '印度尼西亚' },
  { value: 'IT', label: '意大利' },
  { value: 'JP', label: '日本' },
  { value: 'KR', label: '韩国' },
  { value: 'MY', label: '马来西亚' },
  { value: 'MX', label: '墨西哥' },
  { value: 'NL', label: '荷兰' },
  { value: 'PH', label: '菲律宾' },
  { value: 'PL', label: '波兰' },
  { value: 'RU', label: '俄罗斯' },
  { value: 'SA', label: '沙特阿拉伯' },
  { value: 'SG', label: '新加坡' },
  { value: 'ES', label: '西班牙' },
  { value: 'TH', label: '泰国' },
  { value: 'TR', label: '土耳其' },
  { value: 'AE', label: '阿联酋' },
  { value: 'GB', label: '英国' },
  { value: 'US', label: '美国' },
  { value: 'VN', label: '越南' }
]

export const customerTagOptions = [
  { value: 'new', label: '新客户' },
  { value: 'vip', label: '重点客户' },
  { value: 'quoted', label: '已报价客户' },
  { value: 'at-risk', label: '需关注客户' }
]

export const contactPositionOptions = [
  { value: 'OWNER', label: '企业负责人' },
  { value: 'GENERAL_MANAGER', label: '总经理' },
  { value: 'PURCHASING_DIRECTOR', label: '采购总监' },
  { value: 'PURCHASING_MANAGER', label: '采购经理' },
  { value: 'PROCUREMENT_SPECIALIST', label: '采购专员' },
  { value: 'SALES_MANAGER', label: '销售经理' },
  { value: 'PROJECT_MANAGER', label: '项目经理' },
  { value: 'FINANCE_MANAGER', label: '财务负责人' },
  { value: 'LOGISTICS_MANAGER', label: '物流负责人' },
  { value: 'OTHER', label: '其他职能' }
]

export const destinationPortOptions = [
  { value: 'CNSHA', label: '上海港（中国）' },
  { value: 'CNNGB', label: '宁波舟山港（中国）' },
  { value: 'CNSZX', label: '深圳港（中国）' },
  { value: 'HKHKG', label: '香港港（中国香港）' },
  { value: 'SGSIN', label: '新加坡港（新加坡）' },
  { value: 'NLRTM', label: '鹿特丹港（荷兰）' },
  { value: 'DEHAM', label: '汉堡港（德国）' },
  { value: 'GBFXT', label: '费利克斯托港（英国）' },
  { value: 'USLAX', label: '洛杉矶港（美国）' },
  { value: 'USNYC', label: '纽约港（美国）' },
  { value: 'AUMEL', label: '墨尔本港（澳大利亚）' },
  { value: 'AEJEA', label: '杰贝阿里港（阿联酋）' }
]

export const tradeTermOptions = [
  { value: 'EXW', label: '工厂交货（EXW）' },
  { value: 'FOB', label: '船上交货（FOB）' },
  { value: 'CIF', label: '成本、保险加运费（CIF）' },
  { value: 'CFR', label: '成本加运费（CFR）' },
  { value: 'DDP', label: '完税后交货（DDP）' }
]

export function labelOf(labels: Record<string, string>, value: string | undefined, fallback = '处理中') {
  return value ? labels[value] || fallback : fallback
}

export function formatDateTime(value: string | undefined) {
  if (!value) return '未设置'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '时间待确认'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date)
}

export function formatDate(value: string | undefined) {
  if (!value) return '未设置'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '日期待确认'
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

export function currencyLabel(value: string) {
  return currencyOptions.find(item => item.value === value)?.label || '其他币种'
}

function optionLabel(options: Array<{ value: string; label: string }>, value: string, fallback: string) {
  return options.find(item => item.value === value)?.label || fallback
}

export function countryLabel(value: string | undefined) {
  if (!value) return '地区待补充'
  const aliases: Record<string, string> = { USA: 'US', China: 'CN', 中国: 'CN', UK: 'GB' }
  return optionLabel(countryOptions, aliases[value] || value, value)
}

export function customerTagLabel(value: string | undefined) {
  if (!value) return '未分组'
  return optionLabel(customerTagOptions, value, value)
}

export function contactPositionLabel(value: string | undefined) {
  if (!value) return '职位待补充'
  return optionLabel(contactPositionOptions, value, value)
}

export function destinationPortLabel(value: string | undefined) {
  if (!value) return ''
  return optionLabel(destinationPortOptions, value, value)
}

export function tradeTermLabel(value: string) {
  return tradeTermOptions.find(item => item.value === value)?.label || '贸易条款待确认'
}

export function humanizeSystemText(value: string | undefined) {
  if (!value) return '暂无内容'
  return value
    .replaceAll('**', '')
    .replace(/\bHIGH\b/g, '紧急')
    .replace(/\bNORMAL\b/g, '普通')
    .replace(/\bLOW\b/g, '低优先级')
    .replace(/\bINQUIRY\b/g, '客户询盘')
    .replace(/\bOWNER\b/g, '企业负责人')
    .replace(/\bADMIN\b/g, '管理员')
    .replace(/\bSALES\b/g, '销售人员')
    .replace(/\bOPERATOR\b/g, '运营人员')
    .replace(/\bVIEWER\b/g, '只读成员')
    .replace(/\bACTIVE\b/g, '已启用')
    .replace(/\bDISABLED\b/g, '已停用')
}
