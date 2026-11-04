/** Copy for /projects/walk-free. Facts follow the Walk-Free README, docs/HACKATHON.md and the live site. */

export const LINKS = {
  site: "https://walk-free.vercel.app/",
  demo: "https://walk-free.vercel.app/demo?area=ut-austin&tour=1",
  code: "https://github.com/AyanBhardwaj1/Walk-Free",
};

export const FACTS: [string, string][] = [
  [
    "6",
    "campuses ready to open: UT Austin, UC Berkeley, Michigan, UCLA, Stanford and Arizona State",
  ],
  [
    "10,000+",
    "buildings, each casting a modelled shadow for the hour you pick",
  ],
  ["900+ km", "of walking paths, coloured from full shade to full sun"],
  [
    "6",
    "route types: quickest, more shade, scenic, cool stops, step-free, lit at night",
  ],
];

export const ROUTE_TYPES: [string, string][] = [
  ["Quickest", "The shortest walk, whatever the sun."],
  ["More shade", "Weighted by the sun-aversion slider."],
  ["Scenic", ""],
  ["Cool stops", "Through air-conditioned libraries and unions."],
  ["Step-free", "Never takes mapped stairs or slopes over 8%."],
  ["Lit at night", "Keeps to lit streets after dark."],
];

/** The pipeline, printed as an itinerary slip. */
export const PIPELINE: { stage: string; rows: [string, string][] }[] = [
  {
    stage: "The ground",
    rows: [
      ["Streets, paths, buildings, trees from OpenStreetMap", "Overpass"],
      ["Tree crowns from 1 m canopy-height maps", "Meta + WRI"],
    ],
  },
  {
    stage: "The sky",
    rows: [
      ["Temperature, humidity, sunlight in W/m², UV", "Open-Meteo"],
      ["Heat and air-quality alerts, HeatRisk", "NWS"],
      ["Air quality (US AQI)", "CAMS"],
    ],
  },
  {
    stage: "The walk",
    rows: [
      ["Sun position for the chosen hour", "any hour"],
      ["Shade ray-traced against buildings and crowns", "per path"],
      ["Feels-like: heat index, plus up to 8 °C in sun", "estimate"],
      ["Shade-weighted shortest path", "6 types"],
    ],
  },
];

export const TOOLS = [
  "find_places",
  "plan_route",
  "best_time_to_leave",
  "compare_walks",
];

export const STACK = [
  "React 19",
  "TypeScript",
  "Vite",
  "three.js / React Three Fiber",
  "MapLibre",
  "Express 5 on Vercel",
  "Neon Postgres + Neon Auth",
  "Capacitor",
  "Meta Muse Spark",
];

export const SHOTS = {
  hero: {
    src: "/media/projects/walk-free/demo-utaustin.jpg",
    width: 1280,
    height: 800,
    alt: "Walk-Free at UT Austin: a 3D campus with green tree crowns, a blue and orange shade route from Start to Finish past the UT Tower, and route cards reading Quickest 14 min and More shade 15 min with 55% less sun.",
  },
  gallery: [
    {
      src: "/media/projects/walk-free/landing-heat.jpg",
      width: 1600,
      height: 1000,
      alt: "Landing page section titled Same street, different hour: a UT Austin map with paths coloured from blue shade to red sun, a 116 °F feels-like readout and a time-of-day slider.",
      place: "UT Austin",
      what: "Heat on the ground",
      note: "Paths coloured by feels-like at the chosen hour",
    },
    {
      src: "/media/projects/walk-free/demo-noir.jpg",
      width: 1280,
      height: 800,
      alt: "Noir Harbor, a fictional city at 9 PM: black towers with lit gold windows, falling rain and a zig-zag walking route.",
      place: "Noir Harbor",
      what: "A generated city",
      note: "Rain layer at 9 PM",
    },
    {
      src: "/media/projects/walk-free/landing-hero.jpg",
      width: 1600,
      height: 1000,
      alt: "Walk-Free landing page: a dark green hero with the headline The cooler way across campus is already there, over a glowing blue campus path network and a 117 °F callout.",
      place: "Landing",
      what: "The first screen",
      note: "Hemphill Park, 117 °F in full sun at 3 PM in July",
    },
    {
      src: "/media/projects/walk-free/mobile-demo.jpg",
      width: 739,
      height: 1600,
      alt: "Walk-Free on a phone: the map on top and a bottom sheet with route options below.",
      place: "Phone",
      what: "Bottom-sheet layout",
      note: "Installable PWA, works offline",
    },
  ],
};
