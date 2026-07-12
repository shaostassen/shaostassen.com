"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  categoryLabels,
  projectCategories,
  projectTracks,
  trackLabels,
  type Project,
} from "@/content/schema";
import { ProjectCard } from "@/components/projects/ProjectCard";

const ALL = "all";
type Filter = (typeof projectCategories)[number] | typeof ALL;

function isCategory(v: string | null): v is (typeof projectCategories)[number] {
  return (projectCategories as readonly string[]).includes(v ?? "");
}

/**
 * Category filter + track-grouped grid. All cards are in the prerendered
 * HTML (the default filter is "all"); the URL (?category=…) deep-links the
 * filter and is applied after hydration.
 */
export function ProjectsExplorer({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<Filter>(ALL);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("category");
    if (isCategory(fromUrl)) setActive(fromUrl);
  }, []);

  function select(filter: Filter) {
    setActive(filter);
    const url = filter === ALL ? "/projects" : `/projects?category=${filter}`;
    window.history.replaceState(null, "", url);
  }

  const filtered = projects.filter(
    (p) => active === ALL || p.category === active,
  );

  return (
    <div>
      <div
        role="group"
        aria-label="Filter projects by category"
        className="flex flex-wrap gap-2"
      >
        {([ALL, ...projectCategories] as Filter[]).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={active === c}
            onClick={() => select(c)}
            className={cn(
              "inline-flex h-11 items-center rounded-md border px-4 font-mono text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              active === c
                ? "border-accent text-accent"
                : "border-border text-muted hover:border-muted hover:text-foreground",
            )}
          >
            {c === ALL ? "All" : categoryLabels[c]}
          </button>
        ))}
      </div>

      {projectTracks.map((track) => {
        const group = filtered.filter((p) => p.track === track);
        const trackTotal = projects.filter((p) => p.track === track).length;
        return (
          <section
            key={track}
            aria-labelledby={`track-${track}`}
            className="mt-14"
          >
            <h2 id={`track-${track}`} className="font-display text-title">
              {trackLabels[track]}
            </h2>
            {group.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {group.map((p) => (
                  <ProjectCard
                    key={p.slug}
                    project={{
                      title: p.title,
                      description: p.oneLiner,
                      categoryLabel: categoryLabels[p.category],
                      tags: p.tags,
                      metric: p.metrics?.[0],
                      href: `/projects/${p.slug}`,
                      inProgress: p.status === "in-progress",
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 font-mono text-sm text-muted">
                {trackTotal === 0
                  ? "write-ups in progress"
                  : "no projects in this category yet"}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
