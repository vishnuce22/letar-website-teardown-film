// Extract poster stills from the web-encoded chapter clips (index.html film).
// Posters serve two jobs: the pre-play frame on desktop (preload="none" shows
// them instead of a blank plate) and the ENTIRE chapter visual on phones,
// where the film is static and no video ever loads.
//
// Usage: node scripts/extract-posters.js
// Output: assets/gen/<name>-poster.jpg  (~0.8s in, 1280w, jpeg q3)
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const ffmpeg = require('ffmpeg-static')

const clips = ['hero', 'teardown', 'machining', 'cmm', 'ret']
const gen = path.join(__dirname, '..', 'assets', 'gen')

for (const name of clips) {
  const src = path.join(gen, `${name}-hd.mp4`)
  const out = path.join(gen, `${name}-poster.jpg`)
  execFileSync(ffmpeg, [
    '-y', '-ss', '0.8', '-i', src,
    '-frames:v', '1', '-update', '1', '-vf', 'scale=1280:-2', '-q:v', '3', out,
  ], { stdio: 'inherit' })
  console.log('ok:', path.basename(out))
}
