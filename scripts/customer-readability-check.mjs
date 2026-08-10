import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const viewDirectory = resolve(root, 'src/views')
const files = [
  ...readdirSync(viewDirectory).filter(name => name.endsWith('.vue')).map(name => resolve(viewDirectory, name)),
  resolve(root, 'src/layouts/AppShell.vue')
]

const rawInternalField = /{{\s*[\w?.]+\.(customerId|productId|tenantId|relatedId|targetId|status|priority|relatedType)\s*}}/
const forbiddenVisibleText = ['>QUOTATION<', '>Global operations<', '>Private trade intelligence<']
const violations = []

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  if (rawInternalField.test(source)) violations.push(`${file}: directly displays an internal field`)
  for (const text of forbiddenVisibleText) {
    if (source.includes(text)) violations.push(`${file}: contains ${text}`)
  }
}

if (violations.length) {
  console.error(`Customer readability check failed:\n${violations.join('\n')}`)
  process.exit(1)
}

console.log('Customer readability check passed')
