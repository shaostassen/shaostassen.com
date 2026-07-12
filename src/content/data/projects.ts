// Interim typed content for the landing strip (S1.2). The full Zod-validated
// content layer replaces this in S2.1. Facts here are confirmed only —
// anything uncertain stays in docs/drafts/ until Shao signs it off.

export type ProjectCategory =
  "Embedded" | "Robotics" | "ML · CV" | "Systems · HPC";

export type FeaturedProject = {
  title: string;
  description: string;
  category: ProjectCategory;
  tags: string[];
  metric?: { label: string; value: string };
  /** Set once the case study exists at /projects/[slug]. */
  href?: string;
};

export const featuredProjects: FeaturedProject[] = [
  {
    title: "Fast Robots",
    description:
      "A hand-built differential-drive robot that localizes with a Bayes filter and uses a Kalman filter to act faster than its sensors update.",
    category: "Robotics",
    tags: ["kalman", "bayes", "pid", "embedded c++"],
    href: "/projects/fast-robots",
  },
  {
    title: "Huey — autonomous combat robot",
    description:
      "A combat robot that finds and attacks its opponent on its own: YOLO detection driving an orientation controller with anti-windup over a closed-loop drivetrain.",
    category: "Robotics",
    tags: ["yolo", "pid", "computer vision"],
    metric: { label: "weight class", value: "3 lb" },
  },
  {
    title: "Parallel SpGEMM",
    description:
      "Sparse matrix–matrix multiplication built on Gustavson's algorithm, parallelized against load imbalance and memory-bound accumulation.",
    category: "Systems · HPC",
    tags: ["c++", "sparse linear algebra"],
    metric: { label: "speedup", value: "~21× on 32 cores" },
  },
  {
    title: "SpeechLens",
    description:
      "A fully local speech-analysis stack — faster-whisper and Silero VAD behind a FastAPI service — running on an RTX 5090 and a Jetson Orin Nano.",
    category: "ML · CV",
    tags: ["asr", "fastapi", "jetson"],
  },
];
