# Redesign plan — Epic 14, "Show the work"

Opened 2026-10-30 at Shao's request: "the portfolio page looks kind of plain
and ugly — decide how to make it better from structure, color, display,
content, fonts, text and image size, and more."

This supersedes nothing in the art direction (Epic 11, instrument/lab). It
fixes how that direction is _used_. Tranche 1 (S14.1–S14.3) is built; the rest
is planned below and waits on review, per the epic-boundary rule in CLAUDE.md.

## Diagnosis

Taken from screenshots of the built site at 1440 and 375 px, not from taste.

1. **The work is invisible.** The home page's nine project cards are text on
   beige. The strongest material the site owns — two live instruments, a
   physics game, a controller swinging a pole up, real robot photos — appears
   nowhere on the page that is supposed to sell it. The only photographs are
   in a section at the very bottom.
2. **Everything has equal weight.** Nine identical boxes. No project is the
   lead, so a skimmer has nothing to land on. The home page also repeats, card
   for card, what `/projects` already shows.
3. **The scale is timid for a desktop.** The content column is 1024 px on a
   1440 px screen, the name is 52 px, and card copy is 14 px grey on beige. Wide
   margins are empty while the text is small.
4. **Tag noise.** 5–8 chips per card, about 60 on the home page, in the same
   grey as the content. They read as texture, not information.
5. **Dead space in cards.** The grid stretches every card to its row, tags are
   pinned to the bottom, and short cards grow a gap in the middle (Electrons,
   Parallel SpGEMM).
6. **Beige on beige.** Card surface against page background is about 1.1:1, and
   the border is faint, so the page reads washed rather than drafted.
7. **Mobile is 7,500 px long.** Nine text-only cards stack into one very tall,
   uniform column.

What I checked and found fine: the palette concept (amber, cyan, magenta on
warm paper or scope black), the three typefaces, the plate-and-caption photo
treatment, and the case-study copy. The home page's apparently empty "plates"
were lazy-loading in a full-page screenshot, not a bug (verified by scrolling
first: all six images load).

## Decisions

- **Fonts: keep Space Grotesk, Inter and JetBrains Mono.** The pairing suits
  the instrument direction, and the weakness is size and weight, not family.
  Swapping typefaces would cost layout shift and a design-system rewrite for no
  visible gain. Changed instead: the type scale (a hero size for the home page,
  16 px card copy, larger key numbers).
- **Color: keep the three channels; add depth, not hues.** No fourth accent.
  Raise surface/border separation so cards read as objects, and spend the amber
  on what it was reserved for, key numbers, at a size where they register.
  Tranche 1 darkens the light-theme border only. A fuller pass is S14.6.
- **Imagery: real artifacts only.** Covers come from the project's own output —
  instrument screenshots, game and plot frames, the project's own photos. A
  project with no honest visual gets a **readout tile**: its real headline
  metric, set large on the graph paper. Nothing is illustrated or invented.
- **Structure: lead, then list.** Three lead projects get large image cards;
  the rest become a compact list, and the complete grid lives on `/projects`.
  Which three lead is a content decision, kept in one typed file.

## Stories

| ID | Story | State |
| -- | ----- | ----- |
| S14.1 | Project covers and image-led cards | built, awaiting review |
| S14.2 | Home restructure: stronger hero, lead trio, compact list | built, awaiting review |
| S14.3 | Scale and depth: wider container, hero type token, border contrast | built, awaiting review |
| S14.4 | Case-study layout: cover at the top, an "at a glance" column, large metrics | planned |
| S14.5 | About, Coursework and Contact at the new scale; photo use | planned |
| S14.6 | Mobile density, color depth, motion polish | planned |

### Acceptance criteria

**S14.1** Every project renders a card with media: a real cover where one
exists, otherwise a readout tile. `cover` is `{ src, alt }`, so alt text cannot
be forgotten (schema-enforced). Covers are regenerable from one script. No card
shows more than three tags. Image weight stays small enough that `/projects`
holds the Lighthouse floor (Performance at least 90).

**S14.2** The home page leads with a larger hero. Three lead projects render as
large cards, the other featured projects as a compact list with their headline
metric, and a link goes to the full index. The lead set is typed and validated
against real slugs, so a rename fails the build. Existing behavioural tests
still pass unmodified.

**S14.3** One container width, one new hero type token, documented in the
design-system skill. No hard-coded sizes. All pages still pass axe in both
themes at 375 / 768 / 1440.

**S14.4** A case study opens with its cover. Key metrics sit in an "at a
glance" column beside the prose at desktop widths and above it on mobile. The
reading measure stays under about 70 characters.

**S14.5** About, Coursework and Contact adopt the new scale. Photographs appear
where they carry information, not only in the footer band.

**S14.6** The mobile home page is under roughly half its current length. Light
and dark both pass AA. Reduced-motion is honoured everywhere.

## Risks

- **Performance floor.** `/projects` measured 92 against a floor of 90 before
  this epic (F19). Images are the obvious threat, so covers are lazy, sized
  with explicit dimensions, WebP, about 1120 × 630 and a few tens of kilobytes.
  If a cover pushes a page under 90, the cover shrinks. The floor does not move.
- **Behavioural tests.** The smoke tests pin headings, links and a metric
  string on the home page. The new layout keeps each of those reachable, and
  the tests are not edited to fit it.
- **Taste is not testable.** The gates prove it is accessible and fast, not
  that it is better. Whether it is better is Shao's call, which is why this is
  on a branch and not on `main`.
