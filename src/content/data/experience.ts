import { z } from "zod";
import { experienceSchema, type Experience } from "@/content/schema";

// Confirmed facts only. Titles/dates pending Shao's confirmation are kept
// descriptive and minimal — see docs/drafts/REVIEW.md.
export const experience: Experience[] = z.array(experienceSchema).parse([
  {
    company: "Smith & Nephew",
    title: "Embedded software — medical devices",
    start: "2026",
    bullets: [
      "Embedded software for medical devices under IEC 62304, targeting MicroBlaze soft-core FPGAs.",
    ],
  },
  {
    company: "EmPRISE Lab, Cornell",
    title: "Undergraduate researcher",
    start: "Fall 2024",
    end: "Spring 2026",
    bullets: [
      "Research on vision-language models and diffusion models for robot learning.",
    ],
  },
]);
