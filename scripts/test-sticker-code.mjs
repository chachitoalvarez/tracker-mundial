import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const dataPath = path.join(repoRoot, 'src', 'data', 'panini_mundial_2026_album_base_980.json')

const raw = JSON.parse(await fs.readFile(dataPath, 'utf8'))
const stickers = raw.figuritas ?? []
const stickerCodes = new Set(stickers.map(sticker => sticker.codigo_figura))
const prefixIndex = new Map()

for (const sticker of stickers) {
  const match = String(sticker.codigo_figura).match(/^([A-Z]{3})(\d{3})$/)
  if (!match) continue
  const prefix = match[1]
  const number = Number(match[2])
  const current = prefixIndex.get(prefix) ?? new Set()
  current.add(number)
  prefixIndex.set(prefix, current)
}

function parseStickerCode(input) {
  if (!input) return null
  const cleaned = String(input).trim().toUpperCase().replace(/[\s\-_]/g, '')
  const match = cleaned.match(/^([A-Z]{3})(\d{1,3})$/)
  if (!match) return null
  return {
    prefix: match[1],
    number: match[2],
    normalizedCode: `${match[1]}${match[2].padStart(3, '0')}`,
  }
}

function validateStickerCode(input) {
  const parsed = parseStickerCode(input)
  if (!parsed) return { status: 'not_found' }
  const prefixNumbers = prefixIndex.get(parsed.prefix)
  if (!prefixNumbers) return { status: 'prefix_invalid' }
  if (!prefixNumbers.has(Number(parsed.number))) return { status: 'number_invalid' }
  if (!stickerCodes.has(parsed.normalizedCode)) return { status: 'not_found' }
  return { status: 'valid', normalizedCode: parsed.normalizedCode }
}

const cases = [
  { input: 'CUW 8', display: 'CUW8', normalized: 'CUW008' },
  { input: 'cuw8', display: 'CUW8', normalized: 'CUW008' },
  { input: 'CUW-8', display: 'CUW8', normalized: 'CUW008' },
  { input: 'CUW008', display: 'CUW008', normalized: 'CUW008' },
  { input: 'ARG 12', display: 'ARG12', normalized: 'ARG012' },
  { input: 'ARG-10', display: 'ARG10', normalized: 'ARG010' },
]

for (const { input, display, normalized } of cases) {
  const parsed = parseStickerCode(input)
  if (!parsed || parsed.normalizedCode !== normalized) {
    throw new Error(`normalize failed for ${input}: ${parsed?.normalizedCode ?? 'null'} !== ${normalized}`)
  }
  const validation = validateStickerCode(input)
  if (validation.status !== 'valid' || validation.normalizedCode !== normalized) {
    throw new Error(`validation failed for ${input}: ${validation.status}`)
  }
  const shown = `${parsed.prefix}${parsed.number}`
  if (shown !== display) {
    throw new Error(`display failed for ${input}: ${shown} !== ${display}`)
  }
}

const invalid = validateStickerCode('XXZ 999')
if (invalid.status === 'valid') {
  throw new Error('Expected invalid code to fail')
}

console.log('OK: sticker code parsing and validation')
