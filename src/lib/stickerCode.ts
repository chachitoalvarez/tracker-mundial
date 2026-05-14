import { albumStickers, stickersByCode } from '@/data/albumData'
import type { Sticker } from '@/types/album'

export interface ParsedStickerCode {
  prefix: string
  number: string
  normalizedCode: string
}

export type StickerCodeValidationStatus = 'valid' | 'prefix_invalid' | 'number_invalid' | 'not_found'

export interface StickerCodeValidation {
  status: StickerCodeValidationStatus
  prefix?: string
  number?: string
  normalizedCode?: string
  sticker?: Sticker
}

interface PrefixInfo {
  stickerCount: number
  numbers: Set<number>
}

const prefixIndex = buildPrefixIndex()

function buildPrefixIndex(): Map<string, PrefixInfo> {
  const index = new Map<string, PrefixInfo>()

  for (const sticker of albumStickers) {
    const match = sticker.codigoFigura.match(/^([A-Z]{3})(\d{3})$/)
    if (!match) continue

    const prefix = match[1]
    const number = Number(match[2])
    const current = index.get(prefix) ?? { stickerCount: 0, numbers: new Set<number>() }
    current.stickerCount += 1
    current.numbers.add(number)
    index.set(prefix, current)
  }

  return index
}

function buildPrefixIndexFromCatalog(catalog: Sticker[]): Map<string, PrefixInfo> {
  const index = new Map<string, PrefixInfo>()

  for (const sticker of catalog) {
    const match = sticker.codigoFigura.match(/^([A-Z]{3})(\d{3})$/)
    if (!match) continue

    const prefix = match[1]
    const number = Number(match[2])
    const current = index.get(prefix) ?? { stickerCount: 0, numbers: new Set<number>() }
    current.stickerCount += 1
    current.numbers.add(number)
    index.set(prefix, current)
  }

  return index
}

export function getStickerPrefixes(): string[] {
  return Array.from(prefixIndex.keys()).sort()
}

export function parseStickerCode(input: string): ParsedStickerCode | null {
  if (!input) return null
  const cleaned = input.trim().toUpperCase().replace(/[\s\-_]/g, '')
  const match = cleaned.match(/^([A-Z]{3})(\d{1,3})$/)
  if (!match) return null

  const prefix = match[1]
  const number = match[2]
  return {
    prefix,
    number,
    normalizedCode: `${prefix}${number.padStart(3, '0')}`,
  }
}

export function getDisplayStickerCode(prefix: string, number: string): string {
  const cleanedPrefix = prefix.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
  const cleanedNumber = number.trim().replace(/\D/g, '').slice(0, 3)
  if (!cleanedPrefix || !cleanedNumber) return ''
  return `${cleanedPrefix}${cleanedNumber}`
}

export function normalizeStickerCode(prefixOrInput: string, number?: string): string | null {
  const parsed = number === undefined
    ? parseStickerCode(prefixOrInput)
    : parseStickerCode(`${prefixOrInput}${number}`)
  return parsed?.normalizedCode ?? null
}

export function validateStickerCode(input: string | ParsedStickerCode, catalog: Sticker[] = albumStickers): StickerCodeValidation {
  const parsed = typeof input === 'string' ? parseStickerCode(input) : input
  if (!parsed) return { status: 'not_found' }

  const prefixMap = catalog === albumStickers ? prefixIndex : buildPrefixIndexFromCatalog(catalog)
  const prefixInfo = prefixMap.get(parsed.prefix)
  if (!prefixInfo) {
    return {
      status: 'prefix_invalid',
      prefix: parsed.prefix,
      number: parsed.number,
      normalizedCode: parsed.normalizedCode,
    }
  }

  const number = Number(parsed.number)
  if (!prefixInfo.numbers.has(number)) {
    return {
      status: 'number_invalid',
      prefix: parsed.prefix,
      number: parsed.number,
      normalizedCode: parsed.normalizedCode,
    }
  }

  const sticker = catalog.find(item => item.codigoFigura === parsed.normalizedCode) ?? stickersByCode.get(parsed.normalizedCode) ?? null
  if (!sticker) {
    return {
      status: 'not_found',
      prefix: parsed.prefix,
      number: parsed.number,
      normalizedCode: parsed.normalizedCode,
    }
  }

  return {
    status: 'valid',
    prefix: parsed.prefix,
    number: parsed.number,
    normalizedCode: parsed.normalizedCode,
    sticker,
  }
}
