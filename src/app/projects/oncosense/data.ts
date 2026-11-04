import type { ProjectPageData } from "@/components/project-page/types";

export const data: ProjectPageData = {
  overview: [
    "OncoSense asks whether a low-cost wearable can use light to watch the skin continuously. A band holds near-infrared and red LEDs and a 10-channel spectral sensor against the arm and measures how skin scatters and returns light.",
    "Built in person at MIT Lincoln Laboratory with Eric Niu. The work began with nonlinear optics (second-harmonic generation from collagen). Expert review showed that needs femtosecond lasers, so the team pivoted to linear optics that LEDs can drive, aimed first at skin hydration as a step back toward screening. It is a research prototype, not a medical device.",
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
      title: "A neural net on the band",
      body: "A 12→16→12→5 network of about 480 parameters runs in under a millisecond on the SAMD21 and reports confidence plus an out-of-distribution score.",
    },
    {
      title: "A monitor in the browser",
      body: "The OncoSense Monitor runs a virtual band anywhere, or reads a real one over Web Serial in Chrome or Edge, using the same network weights.",
    },
  ],
  facts: [
    ["Where", "MIT Lincoln Laboratory"],
    ["Built with", "Eric Niu"],
    ["Sensor", "AS7341, 10 channels"],
    ["Optics", "660 / 850 nm"],
  ],
};
