import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BUSINESS_RULES, CUSTOM_ENDPOINTS, ENTITIES, PERMISSIONS } from '../src/design-system/backendSpec.js'
import { generateBackendMd, generateOpenApi, generateSql } from '../src/design-system/generators.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
mkdirSync(join(root, 'docs'), { recursive: true })
writeFileSync(join(root, 'docs/openapi.yaml'), generateOpenApi(ENTITIES, CUSTOM_ENDPOINTS))
writeFileSync(join(root, 'docs/schema.sql'), generateSql(ENTITIES))
writeFileSync(join(root, 'docs/BACKEND.md'), generateBackendMd({ entities: ENTITIES, custom: CUSTOM_ENDPOINTS, permissions: PERMISSIONS, rules: BUSINESS_RULES }))
console.log('Wrote docs/openapi.yaml, docs/schema.sql, docs/BACKEND.md')
