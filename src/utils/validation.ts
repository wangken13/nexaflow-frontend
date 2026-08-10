export const invalidWorkEmailMessage = '请输入正确的工作邮箱格式，例如 name@company.com'

export function workEmailValidationMessage(value: string | undefined) {
  const email = value?.trim() || ''
  if (!email) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : invalidWorkEmailMessage
}
