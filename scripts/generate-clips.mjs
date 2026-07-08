// Seedance 1.0 (via fal.ai) — generates the site's ambient machining b-roll.
// Usage:  node scripts/generate-clips.mjs          (reads key from ../.fal-key)
// Clips land in assets/video/ with the exact names index.html probes for.
// HONESTY RULE: these are abstract/ambient machining visuals — real facility
// claims on the site keep real photographs.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const keyFile = path.join(root, '.fal-key')
if (!existsSync(keyFile)) {
  console.error('Missing .fal-key — create it with your fal.ai API key first.')
  process.exit(1)
}
const FAL_KEY = readFileSync(keyFile, 'utf8').trim()

const MODEL = 'fal-ai/bytedance/seedance/v1/lite/text-to-video'

const CLIPS = {
  'hero.mp4':
    'Bright daylight studio macro of a 5-axis CNC milling head cutting brushed aluminum, fine coolant mist, silver chips curling away, white and light-gray environment, high-key lighting, cinematic shallow depth of field, slow camera dolly right, photorealistic',
  'program.mp4':
    'Close-up of engineering CAD toolpaths glowing softly on a bright white monitor in a clean office, reflections on brushed aluminum desk, high-key lighting, slow push-in, photorealistic',
  'machine.mp4':
    'Macro slow motion of an end mill cutting a titanium block, delicate metal chip curls with faint blue-violet anodized sheen, bright clean machine shop, high-key white lighting, photorealistic',
  'inspect.mp4':
    'Coordinate measuring machine ruby probe gently touching a precision aluminum aerospace part on a granite table, bright laboratory lighting, extreme close-up, slow motion, photorealistic',
  'ship.mp4':
    'Finished anodized aerospace components with gold-violet-blue titanium sheen arranged on white foam packaging, soft studio light sweep across the metal, slow pan, photorealistic',
}

async function fal(pathname, body) {
  const res = await fetch(`https://queue.fal.run/${pathname}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${pathname}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function poll(statusUrl) {
  for (;;) {
    const res = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL_KEY}` } })
    const s = await res.json()
    if (s.status === 'COMPLETED') return s
    if (s.status === 'FAILED' || s.error) throw new Error(JSON.stringify(s))
    process.stdout.write('.')
    await new Promise((r) => setTimeout(r, 4000))
  }
}

const outDir = path.join(root, 'assets', 'video')
mkdirSync(outDir, { recursive: true })

for (const [name, prompt] of Object.entries(CLIPS)) {
  const out = path.join(outDir, name)
  if (existsSync(out)) { console.log(`skip   ${name} (exists)`); continue }
  console.log(`queue  ${name}`)
  const job = await fal(MODEL, {
    prompt,
    resolution: '720p',
    duration: '5',
    aspect_ratio: '16:9',
  })
  await poll(job.status_url)
  const resultRes = await fetch(job.response_url, { headers: { Authorization: `Key ${FAL_KEY}` } })
  const result = await resultRes.json()
  const url = result.video?.url || result.videos?.[0]?.url
  if (!url) throw new Error(`no video url in result for ${name}: ${JSON.stringify(result).slice(0, 300)}`)
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  writeFileSync(out, buf)
  console.log(`\nsaved  ${name}  ${(buf.length / 1e6).toFixed(1)} MB`)
}
console.log('\nAll clips done. Commit assets/video/ and push — the site auto-upgrades posters to video.')
