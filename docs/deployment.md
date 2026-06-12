# Deployment Guide

UniPlan is a static Vite application. It does not require a database, API server,
or secret environment variables.

## CodeSandbox from GitHub

Publishing the repository to GitHub first is the cleanest CodeSandbox workflow.

1. Open <https://codesandbox.io/dashboard/recent>.
2. Close the **Create** template dialog if it covers the dashboard.
3. Select **Import** near the top-right corner, immediately to the left of
   **Create**.
4. Authorize CodeSandbox to access GitHub if required.
5. Search for the repository or paste its GitHub URL.
6. Wait for dependencies to install.
7. If a command is requested, use:

   ```bash
   npm run dev
   ```

8. Open the generated preview and confirm that local storage is enabled.

CodeSandbox creates a separate project. It does not need to replace an older
course planner.

## GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`.

1. Push the repository to GitHub with `main` as the default branch.
2. Open **Settings → Pages** in the GitHub repository.
3. Under **Build and deployment**, select **GitHub Actions**.
4. Open the **Actions** tab and confirm that the deployment workflow succeeds.
5. GitHub will show the public URL in the deployment summary and Pages settings.

The workflow runs `npm ci`, `npm test`, and `npm run build` before deployment.

## Other Static Hosts

The `dist/` directory can be deployed to Netlify, Cloudflare Pages, Vercel static
hosting, or another static web host.

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

No environment variables are required.

## Updating a Deployment

Commit and push changes to `main`. GitHub Pages redeploys automatically. A
CodeSandbox project imported from GitHub can pull or re-import repository changes,
depending on the selected CodeSandbox project type.

## Data During Deployment Changes

User data belongs to the browser origin. Moving from one public URL to another
creates a new storage origin, so existing plans do not automatically appear on
the new URL. Export JSON from the old deployment and import it into the new one.
