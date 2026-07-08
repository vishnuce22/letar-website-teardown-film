// TRACE film shots — Seedance 2.0 text-to-video via fal.ai.
// Usage:
//   node scripts/trace-shots.mjs take            → all shots, 720p takes
//   node scripts/trace-shots.mjs take hero orbit → specific shots
//   node scripts/trace-shots.mjs final [names]   → 1080p + high bitrate → <shot>-final.mp4
// NOTE: this endpoint has no seed INPUT (seed is output-only) — finals are
// fresh generations; review them against the picked takes before swapping in.
// Takes land in assets/gen/<shot>-t<N>.mp4 with a manifest of seeds.
// HONESTY RULE: these are representative/ambient cinematic visuals — real
// facility claims on the site stay on real photographs.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const FAL_KEY = readFileSync(path.join(root, '.fal-key'), 'utf8').trim()
const MODEL = 'bytedance/seedance-2.0/text-to-video'

const SHOTS = {
  hero: {
    duration: '8',
    prompt: 'Cinematic aerial shot of a sleek unmarked silver private business jet cruising above dramatic snow-capped mountain ridges at golden hour, camera flying alongside slightly above, warm sun glinting off the polished aluminum fuselage, thin clouds drifting far below, photorealistic, shallow depth of field, 8k film still quality, smooth steady motion',
  },
  orbit: {
    duration: '6',
    prompt: 'Slow orbital camera arc around a completely unmarked silver business jet in level flight high above bright sunlit cloud tops — bare polished metal fuselage with absolutely no lettering, no registration marks, no logos, no text anywhere — deep blue sky, sunlight sweeping across the metal as the camera circles the aircraft, photorealistic aerial cinematography, smooth motion',
  },
  teardown: {
    duration: '6',
    prompt: 'Engineering exploded-view animation seen from a three-quarter side angle: an unmarked silver business jet suspended in a bright white studio void, already mid-disassembly from the very first frame — wings, engines, tail and fuselage sections visibly separated and drifting slowly further apart like a technical exploded diagram, gaps between components growing throughout the shot, clean minimalist product-film lighting, photorealistic CGI render, slow elegant motion',
  },
  machining: {
    duration: '6',
    prompt: 'Extreme macro slow motion of a 5-axis CNC endmill actively cutting into an aluminum aerospace bracket from the very first frame — bright silver chips curling and flying off the spinning cutter continuously, fine coolant mist spraying, the tool visibly carving a pocket as it moves, clean bright machine shop, high-key white lighting, cinematic shallow depth of field, photorealistic',
  },
  cmm: {
    duration: '6',
    prompt: 'Extreme close-up of a coordinate measuring machine ruby-tipped probe in sharp focus descending and making gentle contact with the surface of a precision machined aluminum aerospace bracket that fills the lower frame on a dark granite metrology table — the ruby tip visibly touches the metal surface — bright clean laboratory lighting, slow motion, cinematic shallow depth of field, photorealistic',
  },
  ret: {
    duration: '6',
    prompt: 'Cinematic shot of an unmarked silver business jet climbing gracefully into golden sunlight above endless cloud tops, subtle lens flare, thin contrails, photorealistic aerial film, smooth steady camera',
  },
  hangar: {
    duration: '6',
    prompt: 'Slow cinematic dolly through a bright pristine aircraft maintenance hangar, an unmarked silver business jet with open engine cowlings under inspection, tools neatly arranged, morning light streaming through huge hangar doors, photorealistic, high-key lighting',
  },
}

async function submit(prompt, duration, resolution, bitrate) {
  const res = await fetch(`https://queue.fal.run/${MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt, duration, resolution,
      aspect_ratio: '16:9', generate_audio: false, bitrate_mode: bitrate,
    }),
  })
  if (!res.ok) throw new Error(`submit: ${res.status} ${await res.text()}`)
  return res.json()
}

async function poll(job) {
  for (;;) {
    const res = await fetch(job.status_url, { headers: { Authorization: `Key ${FAL_KEY}` } })
    const s = await res.json()
    if (s.status === 'COMPLETED') {
      const r = await fetch(job.response_url, { headers: { Authorization: `Key ${FAL_KEY}` } })
      return r.json()
    }
    if (s.status === 'FAILED' || s.error) throw new Error(JSON.stringify(s).slice(0, 400))
    await new Promise((r) => setTimeout(r, 5000))
  }
}

const outDir = path.join(root, 'assets', 'gen')
mkdirSync(outDir, { recursive: true })
const manifestFile = path.join(outDir, 'manifest.json')
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {}

const mode = process.argv[2] || 'take'
const wanted = process.argv.slice(3)
const resolution = mode === 'final' ? '1080p' : '720p'
const bitrate = mode === 'final' ? 'high' : 'standard'
const names = wanted.length ? wanted.map((w) => w.split('=')[0]) : Object.keys(SHOTS)

console.log(`mode=${mode} res=${resolution} bitrate=${bitrate} shots: ${names.join(', ')}`)

// submit all in parallel, then poll all
const jobs = []
for (const name of names) {
  const shot = SHOTS[name]
  if (!shot) { console.error(`unknown shot: ${name}`); continue }
  const takeN = (manifest[name]?.takes?.length || 0) + 1
  console.log(`queue  ${name} (take ${takeN})`)
  jobs.push(
    submit(shot.prompt, shot.duration, resolution, bitrate)
      .then((job) => ({ name, takeN, job }))
      .catch((e) => ({ name, takeN, error: e.message }))
  )
}
const queued = await Promise.all(jobs)

for (const q of queued) {
  if (q.error) { console.error(`FAILED to queue ${q.name}: ${q.error}`); continue }
  try {
    const result = await poll(q.job)
    const url = result.video?.url
    if (!url) throw new Error(`no video url: ${JSON.stringify(result).slice(0, 200)}`)
    const fname = mode === 'final' ? `${q.name}-final.mp4` : `${q.name}-t${q.takeN}.mp4`
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
    writeFileSync(path.join(outDir, fname), buf)
    manifest[q.name] = manifest[q.name] || { takes: [] }
    manifest[q.name].takes.push({ file: fname, seed: result.seed, res: resolution })
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2))
    console.log(`saved  ${fname}  ${(buf.length / 1e6).toFixed(1)} MB  seed=${result.seed}`)
  } catch (e) {
    console.error(`FAILED ${q.name}: ${e.message}`)
  }
}
console.log('done.')
