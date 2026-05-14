import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import Tesseract from 'tesseract.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const fixturePath = path.join(repoRoot, 'public', 'fixtures', 'scan-cuw8.png')
const debugDir = path.join(repoRoot, 'tmp', 'ocr-debug')

const approxPercent = { x: 0.55, y: 0.06, width: 0.4, height: 0.16 }
const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function normalizeCode(raw) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const match = cleaned.match(/([A-Z]{3})(\d{1,3})/)
  if (!match) return { cleaned, match: null, normalized: null }
  return {
    cleaned,
    match: match[0],
    normalized: `${match[1]}${match[2].padStart(3, '0')}`,
  }
}

function componentKey(x, y) {
  return `${x}:${y}`
}

async function detectCapsule(regionBuffer, width, height) {
  const { data } = await sharp(regionBuffer).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const visited = new Uint8Array(width * height)
  let best = null

  const isDark = (x, y) => {
    const index = (y * width + x) * 3
    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    return (r + g + b) / 3 < 110
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      if (visited[index] || !isDark(x, y)) continue

      const queue = [[x, y]]
      visited[index] = 1
      let head = 0
      let x0 = x
      let x1 = x
      let y0 = y
      let y1 = y
      let area = 0

      while (head < queue.length) {
        const [cx, cy] = queue[head]
        head += 1
        area += 1
        x0 = Math.min(x0, cx)
        x1 = Math.max(x1, cx)
        y0 = Math.min(y0, cy)
        y1 = Math.max(y1, cy)

        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const nIndex = ny * width + nx
          if (visited[nIndex] || !isDark(nx, ny)) continue
          visited[nIndex] = 1
          queue.push([nx, ny])
        }
      }

      const boxWidth = x1 - x0 + 1
      const boxHeight = y1 - y0 + 1
      const ratio = boxWidth / Math.max(boxHeight, 1)
      if (area > 120 && ratio > 1.8 && boxWidth > width * 0.25) {
        if (!best || area > best.area) {
          best = { x0, y0, x1, y1, area }
        }
      }
    }
  }

  return best
}

async function main() {
  await fs.mkdir(debugDir, { recursive: true })
  const meta = await sharp(fixturePath).metadata()
  if (!meta.width || !meta.height) {
    throw new Error('Fixture image has no dimensions')
  }

  const approx = {
    left: Math.round(meta.width * approxPercent.x),
    top: Math.round(meta.height * approxPercent.y),
    width: Math.round(meta.width * approxPercent.width),
    height: Math.round(meta.height * approxPercent.height),
  }

  const originalBuffer = await sharp(fixturePath).png().toBuffer()
  await fs.writeFile(path.join(debugDir, 'original.png'), originalBuffer)

  const approxBuffer = await sharp(fixturePath).extract(approx).png().toBuffer()
  await fs.writeFile(path.join(debugDir, 'approx.png'), approxBuffer)

  const approxMeta = await sharp(approxBuffer).metadata()
  const capsule = await detectCapsule(approxBuffer, approxMeta.width ?? approx.width, approxMeta.height ?? approx.height)
  if (!capsule) {
    throw new Error('No capsule detected in the fixed top-right region')
  }

  const capsuleRect = {
    left: Math.max(0, approx.left + capsule.x0 - 6),
    top: Math.max(0, approx.top + capsule.y0 - 6),
    width: Math.min(meta.width - Math.max(0, approx.left + capsule.x0 - 6), capsule.x1 - capsule.x0 + 1 + 12),
    height: Math.min(meta.height - Math.max(0, approx.top + capsule.y0 - 6), capsule.y1 - capsule.y0 + 1 + 12),
  }

  const capsuleBuffer = await sharp(fixturePath).extract(capsuleRect).png().toBuffer()
  await fs.writeFile(path.join(debugDir, 'capsule.png'), capsuleBuffer)

  const preprocessedBuffer = await sharp(capsuleBuffer)
    .grayscale()
    .resize({
      width: Math.max(1, Math.round(capsuleRect.width * 5)),
      height: Math.max(1, Math.round(capsuleRect.height * 5)),
      kernel: sharp.kernel.cubic,
    })
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#ffffff' })
    .png()
    .toBuffer()
  await fs.writeFile(path.join(debugDir, 'preprocessed.png'), preprocessedBuffer)

  const worker = await Tesseract.createWorker('eng')
  try {
    await worker.setParameters({
      tessedit_char_whitelist: allowedChars,
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
    })

    const result = await worker.recognize(preprocessedBuffer)
    const rawText = result.data.text ?? ''
    const normalized = normalizeCode(rawText)

    console.log('originalSize:', { width: meta.width, height: meta.height })
    console.log('approxCrop:', approx)
    console.log('capsuleCrop:', capsuleRect)
    console.log('rawText:', JSON.stringify(rawText))
    console.log('cleanedText:', normalized.cleaned)
    console.log('regexMatch:', normalized.match)
    console.log('normalizedCode:', normalized.normalized)

    if (normalized.normalized !== 'CUW008') {
      throw new Error(`Expected CUW008, got ${normalized.normalized ?? 'null'}`)
    }

    console.log('OK: CUW008')
  } finally {
    await worker.terminate()
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
