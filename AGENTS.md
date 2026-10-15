# Project workflow

- Use vanilla TypeScript and Vite; do not introduce a UI framework.
- Do not start a development or preview server unless the user asks.
- After completing requested changes, run `npm run build`, then commit the task changes and push to `origin` on `main` without asking again. The user explicitly authorized this workflow.
- Preserve unrelated user changes. Do not force-push or overwrite remote work; resolve routine divergence safely.
- GitHub Actions handles Pages deployment after pushes to `main`. Report deployment as verified only when its successful status has been checked.
