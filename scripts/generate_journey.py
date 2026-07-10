# Journey film generator — Higgsfield API (via higgsfield-client SDK).
# Usage:
#   python scripts/generate_journey.py auth                # validate key (no spend)
#   python scripts/generate_journey.py keyframes           # K0-K4 stills (skips existing)
#   python scripts/generate_journey.py keyframe K2         # regenerate one still (next attempt #)
#   python scripts/generate_journey.py clip J2             # one clip (uses picked keyframes)
#   python scripts/generate_journey.py pick K2 2           # mark attempt 2 as the approved take
# Key: .higgsfield-key in repo root, single line "api_key:api_secret" (gitignored).
# All output lands in assets/journey-work/ (gitignored) — approved takes are
# copied to their final assets/ names by the stitch step, not by this script.
#
# HONESTY RULE (site-wide): these are ambient/abstract cinematic visuals of a
# FICTIONAL hero part — real facility claims on the site keep real photographs.
import json
import os
import shutil
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "assets", "journey-work")
KEYFILE = os.path.join(ROOT, ".higgsfield-key")

if not os.path.exists(KEYFILE):
    sys.exit("Missing .higgsfield-key — create it with 'api_key:api_secret' on one line.")
os.environ["HF_KEY"] = open(KEYFILE, encoding="utf-8").read().strip()

import higgsfield_client  # noqa: E402  (import after HF_KEY is set)

# ── the locked look ──────────────────────────────────────────────
HERO_PART = ("a machined titanium aerospace structural mount with two upright lugs, "
             "precision bearing bores, pocketed webs and chamfered edges, "
             "raw machined titanium finish")
GRADE = ("dark industrial cinematic, desaturated steel-blue and gunmetal color grade, "
         "single warm amber work light accent, subtle film grain, photorealistic, "
         "no text, no logos, no people, no faces")

IMAGE_MODEL = "higgsfield-ai/soul/standard"
VIDEO_MODEL = "kling-video/v2.1/pro/image-to-video"      # start+end frame conditioning
VIDEO_MODEL_PREMIUM = None  # resolved after auth probe — set to a Veo-class id if available

# Script rev 2 (2026-07-10, owner feedback): brand-new DMG-MORI-class machines,
# heavy coolant, NO factory-wide shot — act 3 is a straight rise off the roof.
MODERN = ("inside a brand-new latest-generation 5-axis CNC machining center in the design "
          "style of a modern DMG MORI DMU, pristine gleaming enclosure, bright cool LED "
          "light strip, spotless surfaces, completely unbranded, no lettering anywhere")
KEYFRAMES = {
    "K0": ("extreme macro shot, carbide endmill edge cutting titanium alloy on " + HERO_PART +
           ", high-pressure coolant flooding over the cut and spilling off the part in "
           "streams, bright metal chip curling away, very shallow depth of field, " +
           MODERN + ", " + GRADE),
    "K1": ("medium shot " + MODERN + ", carbide endmill in spindle above " + HERO_PART +
           " on a tilted trunnion table, high-pressure coolant jets spraying and spilling "
           "across the table, coolant mist hanging in air, single warm amber work light "
           "against cool LED, " + GRADE),
    "K2": ("tight three-quarter shot of a brand-new modern 5-axis CNC machining center seen "
           "from outside, sleek white and dark-grey panels in the design style of a modern "
           "DMG MORI, large glass viewing window glowing warm amber from the machining "
           "inside, polished dark floor with soft reflection, dark anonymous background "
           "falling to black, no other machines visible, completely unbranded, no lettering "
           "anywhere, " + GRADE),
    "K3": ("night exterior hovering just above an industrial building rooftop before dawn, "
           "dark roofline and one glowing amber skylight entering the bottom edge of frame, "
           "vast deep-blue pre-dawn sky filling the frame above, camera looking slightly "
           "upward, " + GRADE),
    "K4": ("high-altitude dawn sky at 30,000 feet, cloud deck far below, faint curvature of "
           "the earth, deep blue sky above, " + GRADE),
}

CLIPS = {
    # name: (start_kf, end_kf_or_None, premium, prompt)
    "J1": ("K0", "K1", True,
           "Extreme macro shot, carbide endmill edge cutting titanium alloy on " + HERO_PART +
           ", bright metal chip curling away, coolant droplets in slow motion, shallow depth "
           "of field, camera pulling back slowly and continuously to reveal the tool in a "
           "machine spindle, " + GRADE),
    "J2": ("K1", "K2", False,
           "Camera pulling back continuously through the interior of a brand-new "
           "latest-generation 5-axis CNC machining center mid-cut, trunnion table tilting " +
           HERO_PART + ", high-pressure coolant spraying and spilling, chips flying, camera "
           "passing backward out through the glass enclosure door to frame the sleek modern "
           "machine, completely unbranded, dark surroundings, amber glow, " + GRADE),
    "J3": ("K2", "K3", False,
           "Camera rising straight up and away from a single sleek modern CNC machining "
           "center glowing amber in the dark, the machine and dark floor falling away below, "
           "camera emerging above the building rooftop into vast pre-dawn sky, roofline and "
           "one glowing skylight slipping into the bottom edge of frame, " + GRADE),
    "J4": ("K3", "K4", True,
           "Camera ascending from above an industrial rooftop into dawn sky, a twin-engine "
           "fighter jet in full afterburner climbing steeply past the camera, heat distortion "
           "behind engines, thin clouds, anamorphic lens flare, no insignia, " + GRADE),
    "J5": ("K4", None, False,
           "Camera rising from high-altitude dawn sky into the darkness of space, stars "
           "emerging, a communications satellite with extended solar panels glinting in "
           "sunlight above the dark curve of Earth, small blinking status lights, quiet "
           "cinematic, " + GRADE),
}

os.makedirs(WORK, exist_ok=True)


def _download(url, path):
    with urllib.request.urlopen(url) as r, open(path, "wb") as f:
        shutil.copyfileobj(r, f)
    print(f"saved  {os.path.relpath(path, ROOT)}  {os.path.getsize(path)/1e6:.1f} MB")


def _next_attempt(prefix, ext):
    n = 1
    while os.path.exists(os.path.join(WORK, f"{prefix}-a{n}.{ext}")):
        n += 1
    return n


def _picked(name, ext):
    """Return the approved take's path: explicit .pick file, else attempt 1."""
    pick = os.path.join(WORK, f"{name}.pick")
    n = open(pick).read().strip() if os.path.exists(pick) else "1"
    p = os.path.join(WORK, f"{name}-a{n}.{ext}")
    if not os.path.exists(p):
        sys.exit(f"{name}: picked attempt {n} not found ({p})")
    return p


def gen_image(name, force_new=False):
    existing = [f for f in os.listdir(WORK) if f.startswith(name + "-a") and f.endswith(".png")]
    if existing and not force_new:
        print(f"skip   {name} ({len(existing)} attempt(s) exist)")
        return
    n = _next_attempt(name, "png")
    print(f"queue  {name} attempt {n}  [{IMAGE_MODEL}]")
    result = higgsfield_client.subscribe(IMAGE_MODEL, arguments={
        "prompt": KEYFRAMES[name],
        "aspect_ratio": "16:9",
        "resolution": "1080p",
    })
    _download(result["images"][0]["url"], os.path.join(WORK, f"{name}-a{n}.png"))


def gen_clip(name):
    start_kf, end_kf, premium, prompt = CLIPS[name]
    model = (VIDEO_MODEL_PREMIUM or VIDEO_MODEL) if premium else VIDEO_MODEL
    n = _next_attempt(name, "mp4")
    if n > 3:
        sys.exit(f"{name}: attempt budget (3) exhausted — ask before generating more.")
    args = {
        "prompt": prompt,
        "duration": 5,   # Kling minimum on most tiers; trimmed to 4s at stitch
        "image_url": higgsfield_client.upload_file(_picked(start_kf, "png")),
    }
    if end_kf:
        args["end_image_url"] = higgsfield_client.upload_file(_picked(end_kf, "png"))
    print(f"queue  {name} attempt {n}  [{model}]  start={start_kf} end={end_kf}")
    result = higgsfield_client.subscribe(model, arguments=args)
    _download(result["video"]["url"], os.path.join(WORK, f"{name}-a{n}.mp4"))


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd == "auth":
        # cheapest possible validation: submit then immediately read status once.
        ctrl = higgsfield_client.submit(IMAGE_MODEL, arguments={
            "prompt": "gray card on a dark table, " + GRADE,
            "aspect_ratio": "16:9", "resolution": "720p",
        })
        print("auth OK — request accepted:", ctrl.request_id if hasattr(ctrl, "request_id") else "queued")
    elif cmd == "keyframes":
        for k in KEYFRAMES:
            gen_image(k)
    elif cmd == "keyframe":
        gen_image(sys.argv[2].upper(), force_new=True)
    elif cmd == "clip":
        gen_clip(sys.argv[2].upper())
    elif cmd == "pick":
        name, n = sys.argv[2].upper(), sys.argv[3]
        open(os.path.join(WORK, f"{name}.pick"), "w").write(n)
        print(f"picked {name} attempt {n}")
    else:
        print(__doc__ or "commands: auth | keyframes | keyframe <K#> | clip <J#> | pick <name> <n>")


if __name__ == "__main__":
    main()
