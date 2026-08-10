import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import ts from 'typescript'

async function loadTypeScriptModule(path) {
  const source = await readFile(resolve(process.cwd(), path), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
}

const validation = await loadTypeScriptModule('src/utils/validation.ts')
assert.equal(validation.workEmailValidationMessage(''), '')
assert.equal(validation.workEmailValidationMessage(' buyer@example.com '), '')
assert.equal(validation.workEmailValidationMessage('buyer.example.com'), validation.invalidWorkEmailMessage)
assert.equal(validation.workEmailValidationMessage('buyer@company'), validation.invalidWorkEmailMessage)

const presentation = await loadTypeScriptModule('src/utils/presentation.ts')
assert.equal(presentation.countryLabel('USA'), '美国')
assert.equal(presentation.countryLabel('中国'), '中国大陆')
assert.equal(presentation.currencyLabel('USD'), '美元（USD）')
assert.equal(presentation.labelOf(presentation.orderStatusLabels, 'SHIPPED'), '运输中')
assert.equal(presentation.humanizeSystemText('HIGH INQUIRY OWNER ACTIVE'), '紧急 客户询盘 企业负责人 已启用')
assert.equal(presentation.formatDate('not-a-date'), '日期待确认')

console.log('Frontend unit tests passed')
