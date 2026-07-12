import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Prose } from "@/components/ui/Prose";
import { skillGroups } from "@/content/data/skills";

export const metadata: Metadata = {
  title: "About — Shao Stassen",
  description:
    "Cornell ECE engineer working across embedded systems, controls, ML/CV, and systems/HPC.",
};

export default function AboutPage() {
  return (
    <Section>
      <Container>
        <h1 className="font-display text-display">About</h1>

        <Prose className="mt-8">
          <p>
            I&apos;m Shao — an engineer who likes the layer where software has
            to answer to physics. I studied electrical and computer engineering
            at Cornell (Class of 2026), where my favorite work involved making
            real hardware do difficult things: a differential-drive robot that
            Kalman-filters its way past its own sensor latency, the autonomous
            side of a 3&nbsp;lb combat robot — I led the autonomy subteam at
            Cornell Combat Robotics — and a sparse-matrix kernel pushed to ~21×
            speedup on 32 cores.
          </p>
          <p>
            From Fall 2024 through Spring 2026 I was an undergraduate researcher
            in Cornell&apos;s EmPRISE Lab, working on vision-language models and
            diffusion models for robot learning. Today I write embedded software
            for medical devices at Smith&nbsp;&amp;&nbsp;Nephew (IEC 62304,
            MicroBlaze soft-core FPGAs) and run a personal training-to-edge ML
            setup — an RTX 5090 workstation feeding a Jetson Orin Nano — that
            carries in-progress projects like SpeechLens, a fully local
            speech-analysis pipeline.
          </p>
          <p>
            This site is one of those projects: static, fast, and{" "}
            <a href="https://github.com/shaostassen/shaostassen.com">
              built in the open
            </a>{" "}
            — the repo is part of the portfolio.
          </p>
        </Prose>

        <h2 className="mt-16 font-display text-title">Skills</h2>
        <p className="mt-2 font-mono text-sm text-muted">
          each item is backed by a project or role — links go to the evidence
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {skillGroups.map((g) => (
            <Card key={g.group}>
              <h3 className="font-display font-semibold">{g.group}</h3>
              <ul className="mt-3 space-y-2 font-mono text-sm">
                {g.items.map((item) => (
                  <li key={item.name} className="text-muted">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="text-foreground underline underline-offset-4 transition-colors hover:text-accent"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <p className="mt-12 font-mono text-sm text-muted">
          <Link
            href="/projects"
            className="text-accent underline underline-offset-4 hover:decoration-2"
          >
            see the projects →
          </Link>
        </p>
      </Container>
    </Section>
  );
}
