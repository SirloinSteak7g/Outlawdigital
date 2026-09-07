# Workshop Digital

A Hugo marketing site for an independent digital studio helping small businesses improve their websites, brands, business systems, and local visibility.

## Run & Operate

- `pnpm --filter @workspace/digital-studio run dev` — run the Hugo site locally using the workflow-provided `PORT` and `BASE_PATH`
- `pnpm --filter @workspace/digital-studio run build` — build the static Hugo output
- `pnpm --filter @workspace/api-server run dev` — run the shared API server when backend work is added

## Stack

- Hugo extended
- Markdown content and front matter
- Go templates, partials, shortcodes, and static SVG assets
- pnpm workspace wrapper for the managed preview workflow

## Where things live

- `artifacts/digital-studio/content/` — page content and project/service front matter
- `artifacts/digital-studio/layouts/` — Hugo templates and reusable partials
- `artifacts/digital-studio/assets/` — site CSS and JavaScript pipeline assets
- `artifacts/digital-studio/static/` — favicon and social preview assets
- `artifacts/digital-studio/hugo.toml` — site configuration and permalinks

## Architecture decisions

- The site is a real Hugo build, not a React-rendered shell; content and reusable page patterns stay editable in Markdown/front matter.
- The web artifact is used only to provide the managed preview and deployment lifecycle; its dev script runs Hugo directly.
- The homepage uses CSS/HTML product mockups and local SVG assets instead of remote stock imagery.
- Service and portfolio routes share template patterns so additional pages can be added without duplicating layouts.

## Product

The site presents Workshop Digital as a direct, independent digital partner for small businesses: websites, custom apps and CRM systems, branding, and local SEO. It includes responsive service pages, work and case-study content, a personal about page, a contact page with client-side validation, and technical SEO essentials.

## User preferences

- The user specifically requested a Hugo site rather than a JavaScript application.

## Gotchas

- The managed preview provides `PORT` and `BASE_PATH`; the Hugo dev command reads both from the environment.
- Keep the preview workflow on the artifact-managed command rather than adding a second web server workflow.

## Pointers

- See the `pnpm-workspace` skill for workspace structure and managed artifact conventions.
