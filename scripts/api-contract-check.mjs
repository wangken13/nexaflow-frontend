import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(resolve(root, 'src/api/trade.ts'), 'utf8')

const requiredEndpoints = [
  '/tenant/profile',
  '/tenant/members',
  '/tenant/audit-logs',
  '/task/daily-report',
  '/customer',
  '/product',
  '/inquiry',
  '/ai/analyze-inquiry',
  '/quotation',
  '/order',
  '/task',
  '/notification'
]

const missing = requiredEndpoints.filter((endpoint) => !source.includes(endpoint))

if (missing.length > 0) {
  console.error(`Missing API contract endpoints: ${missing.join(', ')}`)
  process.exit(1)
}

console.log('API contract check passed')
