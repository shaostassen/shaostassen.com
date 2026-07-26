/**
 * Photo manifest. Derivatives are produced by scripts/process-photos.mjs
 * (640/1280/1920 in AVIF, WebP, JPEG); dimensions here are the largest
 * derivative and exist so the browser reserves layout space — they only
 * need to carry the correct aspect ratio.
 *
 * Alt text describes what is in the frame, factually. Captions are written
 * to the content-voice rules: specific, no filler.
 */
export type PhotoMeta = { alt: string; width: number; height: number };

export const photos = {
  "portrait-crc": {
    alt: "Shao Stassen in a Cornell Combat Robotics quarter-zip.",
    width: 1920,
    height: 1950,
  },
  "portrait-formal": {
    alt: "Formal portrait of Shao Stassen.",
    width: 1920,
    height: 1926,
  },
  "robot-guts": {
    alt: "The Fast Robots car with its electronics exposed — control board, sensor wiring, and battery held down with orange tape.",
    width: 1920,
    height: 2560,
  },
  "robot-bench": {
    alt: "The robot on a workbench, wiring loom and sensors visible, tools and 3D prints around it.",
    width: 1920,
    height: 1440,
  },
  "robot-traces": {
    alt: "A laptop plotting two live sensor traces beside the robot's microcontroller board on a breadboard.",
    width: 1920,
    height: 2560,
  },
  "robot-arena": {
    alt: "The taped-out test arena: a wooden-walled course on a lab floor with the robot parked inside.",
    width: 1920,
    height: 2560,
  },
  "robot-floor": {
    alt: "Top-down view of the differential-drive robot on a tiled floor.",
    width: 1920,
    height: 2560,
  },
  "robodog-team": {
    alt: "Shao and two teammates in the lab, holding the 3D-printed quadruped robot they built.",
    width: 1920,
    height: 2560,
  },
  "print-keychains": {
    alt: "Twelve multi-colour 3D-printed zodiac keychains laid out in rows on a wooden table.",
    width: 1920,
    height: 1440,
  },
  "field-alaska": {
    alt: "Shao standing on rocks at the water's edge in Alaska, mountains across the inlet behind him.",
    width: 1920,
    height: 2560,
  },
  "field-waterfall": {
    alt: "Shao in front of Multnomah Falls, the bridge and upper falls rising behind him.",
    width: 1920,
    height: 2560,
  },
} as const satisfies Record<string, PhotoMeta>;

export type PhotoSlug = keyof typeof photos;
