import type { ProjectPageData } from "@/components/project-page/types";

export const data: ProjectPageData = {
  overview: [
    "OncoSense asks whether a low-cost wearable can use light to watch the skin continuously. A band holds near-infrared and red LEDs and a 10-channel spectral sensor against the arm and measures how skin scatters and returns light.",
    "The work began with nonlinear optics (second-harmonic generation from collagen). Expert review showed that needs femtosecond lasers, so the team pivoted to linear optics that LEDs can drive, aimed first at skin hydration as a step back toward screening. It is a research prototype, not a medical device.",
  ],
  features: [
    {
      title: "Optics on the arm",
      body: "850 nm near-infrared and 660 nm red LEDs with an AS7341 spectral sensor on an Adafruit QT Py SAMD21, in a neoprene band.",
    },
    {
      title: "Room light, removed",
      body: "Each sample is read with the LED off and then on and the two are subtracted, with auto-ranging gain and averaged pairs.",
    },
    {
      title: "Firmware v2",
      body: "The summer sketches rebuilt as one modular C++ firmware with a host-tested skin model, compiled in CI.",
    },
    {
      title: "A monitor in the browser",
      body: "The OncoSense Monitor runs a virtual band anywhere, or reads a real one over Web Serial in Chrome or Edge.",
    },
  ],
  facts: [
    ["Where", "MIT Lincoln Laboratory"],
    ["When", "Summer research"],
    ["Sensor", "AS7341, 10 channels"],
    ["Optics", "660 / 850 nm"],
  ],
};
