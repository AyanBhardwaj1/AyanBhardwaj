/** Copy for /projects/oncosense. Facts follow the repo READMEs (main, neural-net, web-app branches) and the live monitor. */

export const LINKS = {
  monitor: "https://oncosense-monitor.vercel.app/",
  code: "https://github.com/AyanBhardwaj1/OncoSense-MIT-LL",
};

const M = "/media/projects/oncosense";

export const PHOTOS = {
  sketch: {
    src: `${M}/photo-sketch-sensor-patch.jpg`,
    width: 726,
    height: 674,
    alt: "Hand-drawn concept sketch on graph paper: a skin patch with an LED at the centre, a ring of photodiodes, a skin-safe adhesive layer and stitched signal traces.",
    caption:
      "The first idea: an LED ringed by photodiodes on a skin-safe patch.",
  },
  worn: {
    src: `${M}/photo-band-worn-electronics.jpg`,
    width: 1164,
    height: 910,
    alt: "The OncoSense band worn on a forearm: black neoprene with a battery pack, a QT Py microcontroller and red and black wiring on the outer face.",
    caption: "Outer face: QT Py SAMD21 and battery on a neoprene band.",
  },
  head: {
    src: `${M}/photo-optical-head-on-skin.jpg`,
    width: 1228,
    height: 820,
    alt: "The optical head pressed against skin, holding the LEDs and spectral sensor side by side.",
    caption: "The optical head against the skin.",
  },
  inside: {
    src: `${M}/photo-band-inside-optical-head.jpg`,
    width: 702,
    height: 1072,
    alt: "The inner face of the band, showing the optical head that sits against the arm.",
    caption: "Inner face: 850 nm and 660 nm LEDs beside the AS7341.",
  },
};

export const SCREENS = [
  {
    src: `${M}/monitor-ai.jpg`,
    width: 1440,
    height: 900,
    alt: "OncoSense Monitor, AI reading view: a large Normal result at 74% confidence, novelty still learning, unfamiliarity 0.3, and probability bars for very dry, dry, normal, well hydrated and occlusive.",
    caption:
      "AI reading: Normal, 74% confidence, with every class probability shown.",
  },
  {
    src: `${M}/monitor-spectrum.jpg`,
    width: 1440,
    height: 900,
    alt: "OncoSense Monitor, Spectrum view: a hydration history trace over shaded class bands, a 10-band bar chart drawn in each filter's colour, and virtual skin sliders.",
    caption:
      "Spectrum: ten bands in their filter colours, with the virtual skin controls.",
  },
  {
    src: `${M}/landing.jpg`,
    width: 1440,
    height: 900,
    alt: "OncoSense Monitor welcome screen: Connect your OncoSense Band, a three-step setup list, a Connect band button, a Try the virtual band button, and a photo of the band on a forearm.",
    caption: "Connect a real band over Web Serial, or try the virtual one.",
  },
];

export const SPECS: [string, string][] = [
  [
    "Light sources",
    "850 nm near-infrared LED (EPIGAP OSA, 3D-printed mount), 660 nm red LED, on-board white LED",
  ],
  [
    "Sensor",
    "Adafruit AS7341, 10 channels: eight bands from 415 to 680 nm, Clear and NIR",
  ],
  ["Brain", "Adafruit QT Py SAMD21"],
  ["Body", "Neoprene band with hook-and-loop, JST battery"],
  ["Geometry", "LED and sensor side by side: diffuse reflectance"],
];

export const MODES: [string, string][] = [
  [
    "Hydration",
    "660 or 850 nm, scored from 0 (dry reference) to 100 (moisturised reference).",
  ],
  [
    "Surface scan",
    "850 nm, percent change against a clean-skin baseline: normal, occlusive or reduced return.",
  ],
  [
    "Spectral",
    "White LED across all ten bands: a reflectance spectrum, melanin index and erythema index.",
  ],
  [
    "AI reading",
    "All three sources in turn, about 2.5 s, into the on-band network.",
  ],
];

export const FIXES: { fault: string; fix: string }[] = [
  {
    fault: "Room light leaked into every reading.",
    fix: "LED off/on differential read, trimmed mean of four pairs.",
  },
  {
    fault: "Bright readings silently clipped at 65,535 counts.",
    fix: "Auto-gain with saturation detection.",
  },
  {
    fault:
      "Fixed thresholds didn't carry from one person or session to the next.",
    fix: "Per-user two-point calibration, direction-agnostic.",
  },
  {
    fault: "Nothing warned when the band lost contact or let light in.",
    fix: "Quality flags: NO_CONTACT, AMBIENT_LEAK, SATURATED.",
  },
  {
    fault: "Waiting on while(!Serial) froze the band on battery.",
    fix: "Non-blocking boot; streams CSV when a host is there.",
  },
];

export const ROADMAP = [
  "UV autofluorescence",
  "940 nm water band",
  "Photodiode-ring detector",
  "Bluetooth Low Energy",
];

export const STACK = [
  "Arduino C++ (SAMD21)",
  "Adafruit_AS7341",
  "FlashStorage",
  "Python + numpy",
  "pytest",
  "Host-compiled C++ tests",
  "GitHub Actions",
  "Vanilla JS + Web Serial",
  "SVG charts",
  "Service worker PWA",
];
