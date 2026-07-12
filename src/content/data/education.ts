import { z } from "zod";
import { educationSchema, type Education } from "@/content/schema";

// High-school entry pending content from Shao (school-work vision).
export const education: Education[] = z.array(educationSchema).parse([
  {
    school: "Cornell University",
    credential: "Electrical & Computer Engineering, Class of 2026",
    end: "2026",
    details: [
      "Coursework highlights: Fast Robots (ECE 4160), Advanced Computer Architecture (ECE 6750)",
      "Cornell Combat Robotics — led the autonomy subteam",
      "EmPRISE Lab — undergraduate research, robot learning",
    ],
  },
]);
