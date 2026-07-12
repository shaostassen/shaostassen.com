import { z } from "zod";
import { skillGroupSchema, type SkillGroup } from "@/content/schema";

// Every item is evidenced by a confirmed project or role — no aspirational
// skills. Links point at the case study that backs the claim.
export const skillGroups: SkillGroup[] = z.array(skillGroupSchema).parse([
  {
    group: "Embedded",
    items: [
      { name: "ARM Cortex-M, bare-metal C++", href: "/projects/fast-robots" },
      { name: "BLE telemetry protocols", href: "/projects/fast-robots" },
      { name: "FPGA / MicroBlaze soft-core" },
      { name: "IEC 62304 (medical device software)" },
    ],
  },
  {
    group: "Controls & estimation",
    items: [
      { name: "Kalman filtering", href: "/projects/fast-robots" },
      { name: "Bayes-filter localization", href: "/projects/fast-robots" },
      { name: "PID / LQR control", href: "/projects/fast-robots" },
    ],
  },
  {
    group: "ML · CV",
    items: [
      { name: "PyTorch" },
      { name: "YOLO object detection" },
      { name: "VLMs & diffusion models (robot learning)" },
      { name: "ONNX → TensorRT edge deployment" },
    ],
  },
  {
    group: "Systems · HPC",
    items: [
      { name: "C++ / OpenMP", href: "/projects/parallel-spgemm" },
      {
        name: "Parallel algorithm design",
        href: "/projects/parallel-spgemm",
      },
      { name: "CUDA" },
      { name: "Linux, self-hosted ML infrastructure" },
    ],
  },
]);
