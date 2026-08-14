export type Permission =
  | 'customer:write' | 'customer:delete'
  | 'product:write' | 'product:delete'
  | 'inquiry:write' | 'quotation:write' | 'quotation:approve'
  | 'order:create' | 'order:fulfill' | 'task:write' | 'tenant:admin' | 'data:export'

const rolePermissions: Record<string, Set<Permission>> = {
  OWNER: new Set(['customer:write', 'customer:delete', 'product:write', 'product:delete', 'inquiry:write', 'quotation:write', 'quotation:approve', 'order:create', 'order:fulfill', 'task:write', 'tenant:admin', 'data:export']),
  ADMIN: new Set(['customer:write', 'customer:delete', 'product:write', 'product:delete', 'inquiry:write', 'quotation:write', 'quotation:approve', 'order:create', 'order:fulfill', 'task:write', 'tenant:admin', 'data:export']),
  SALES: new Set(['customer:write', 'inquiry:write', 'quotation:write', 'order:create', 'task:write']),
  OPERATOR: new Set(['product:write', 'order:create', 'order:fulfill', 'task:write']),
  VIEWER: new Set()
}

export function hasPermission(role: string, permission: Permission) {
  return rolePermissions[role]?.has(permission) ?? false
}
