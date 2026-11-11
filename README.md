# Yang–Mills, made visible

A responsive, interactive field guide to the Yang–Mills existence and mass-gap problem, with a separate research-level technical companion. The guide explains the statement, the obstacles, lattice regularization, and the constructive renormalization-group route. It explains the released 28 October 2026 existence construction using the committee’s 10 November assessment and pinned source declarations, keeping it separate from the unresolved mass gap.

## Preview locally

Requires Node.js 18 or later. No package installation or build is needed to read the site locally.

```sh
node scripts/serve.mjs
```

Open http://127.0.0.1:4173/ . To check the same subdirectory behavior as GitHub project Pages, use `node scripts/serve.mjs --project-path` and open http://127.0.0.1:4173/yang-mills/ . Set `PORT` to use a different port.

Choose **Technical notes** in the navigation, or open `technical.html` under the same site URL. Part I retains ten sections on the foundations. Part II adds eleven sections on the released construction: the theorem’s quantifiers, Wilson law, exact RG, operator mixing, cutoff limits, phase decomposition, symmetry, Ward and trace identities, OPE bounds, and validation. The page assumes graduate QFT, Lie groups, and basic functional analysis. Equations are numbered, and long expressions scroll horizontally on narrow screens.

## GitHub Pages

The included workflow checks the site, prepares a `dist/` artifact, and deploys on pushes to `main` or a manual workflow run.

1. Push this site, including the files in `references/`, to the repository.
2. In the GitHub repository, open **Settings → Pages** and select **GitHub Actions** as the source.
3. Run **Publish field guide to GitHub Pages**, or push a new change to `main`.

Project URLs: [visual guide](https://alexisdpc.github.io/yang-mills/) and [technical notes](https://alexisdpc.github.io/yang-mills/technical.html). Both pages are published from the same repository and deployment.

The repository excludes cloned proof sources (`upstream/`), previews (`.preview/`), generated output (`dist/`), temporary work, local configuration and credentials. The deployment artifact contains only the two pages, their assets, the cited reference files and `.nojekyll`.

All asset and document URLs are relative, so the site also works under another project subdirectory. The root files can alternatively be served directly using Pages' branch deployment, without a build.

## Content and maintenance

- `index.html`: editorial content, mathematical statements, accessible page structure.
- `technical.html`: research-level exposition, equations, and primary-source bibliography.
- `assets/styles.css`: responsive design and locally hosted typography.
- `assets/technical.css` and `assets/technical.js`: technical-page reading layout, contents navigation, and reading progress. All mathematical content is static HTML; math rendering remains independent.
- `assets/app.js`: six-stage proof-map tabs, navigation, and bibliography loading. Proof-map content is static HTML and remains readable without JavaScript.
- `assets/release.css`: release cards, proof map, diagrams and scope notes.
- `assets/counters.js` and `assets/counters.css`: the overall Visits badge, using HitsCounter.dev’s JSON response. One request per page load updates the existing project counter.
- `assets/math.js`: independent, ordered equation initialization. Static equations also render when the HTML is opened directly; use the local server for the ES-module-based interactions and full bibliography.
- `assets/visuals.js`: animated hero lattice and lattice-refinement interaction; these are explanatory models, not simulations of Yang–Mills theory.
- `assets/spectrum-gapped.svg` and `assets/spectrum-gapless.svg`: static comparison of energy spectra, visible without JavaScript.
- `assets/proof-limits.svg`, `assets/proof-mixing.svg`, and `assets/proof-phases.svg`: labeled schematic diagrams for the released construction.
- `assets/references.json`: bibliography metadata and reading guidance for the supplied files.
- `references/`: source documents supplied for this project, retained unchanged.

Release edition: **11 November 2026**. Source links are pinned to `3456e5e75cf8d4cd558955a5c7638fba2d68f464` in `yang-mills-group/OpenAI-YM-20261028` and `55ba9fc36293b3f4d52c6b1f813169a0be76ee98` in `yang-mills-group/YM`. The assessment is copied unchanged to `references/assessment-1-2026-11-10.pdf`, with its license and notice alongside it. The local source clones in ignored `upstream/` are reading material only and are excluded from the Pages artifact.

The verification history described on the site belongs to the committee’s recorded checks. Website validation checks presentation, mathematics rendering, and navigation. Future updates should preserve the exact theorem hypotheses and distinguish existence, phase clustering, a positive spectral gap, and confinement.

The supplied `balaban.pdf` is the 1984 Bałaban–Imbrie–Jaffe chapter on exact renormalization, not the later 1989 four-dimensional stability paper. `intro to confinement.pdf` is a reading sample. `solution.jpeg` is a committee announcement, not the proof manuscript.

## Validation

```sh
node scripts/check.mjs
node scripts/build.mjs
```

The content check verifies local links and cross-page anchors, bibliography files, font references, JavaScript syntax, and LaTeX across both pages and the route panels. Browser review should additionally check the technical page and static spectrum comparison on desktop and mobile, and exercise the lattice slider, route tabs (including keyboard arrows), expandable explanations, mobile navigation, and reduced-motion behavior.

## Dependencies and accessibility

The website uses plain HTML, CSS, and JavaScript. KaTeX 0.16.22 and its fonts are vendored locally, as are DM Sans and Instrument Serif. Their licenses and provenance are included alongside the assets. The core guide renders without third-party network requests; Visits loads HitsCounter.dev’s JSON response, while Hits loads the Hits.sh badge image.

The author byline links to [Alexis Plascencia](https://alexisplascencia.com). Both badges have project-specific identifiers, separate from the author's GitHub profile counters: **Visits** uses [HitsCounter.dev](https://hitscounter.dev/) with the URL key `https://alexisdpc.github.io/yang-mills/`, and **Hits** uses Hits.sh with key `alexisdpc.github.io/yang-mills`. Both pages share these identifiers, so each provider counts visits across the guide and technical notes. Visits displays **only the overall total**, using the provider’s `output=json` response and its `total_hits` field. The original image is not also requested, so a page load makes one HitsCounter.dev request. Both existing counter identifiers and accumulated totals are retained. These are page-request counters, not unique-visitor analytics; preview loads can contribute, and the providers can show different totals. If JavaScript is disabled or the service cannot be reached, Visits shows a dash instead of a misleading zero. Change the `data-counter-url` and Hits.sh image URL in both HTML files if the project identifiers change.

The guide includes keyboard-accessible controls, a skip link, live descriptions of interactive values, reduced-motion support, a motion pause control, mobile navigation, MathML generated by KaTeX, and a print stylesheet. Diagrams are explicitly marked as schematic. Core text and direct reference links remain available without JavaScript.
