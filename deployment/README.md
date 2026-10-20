# Put RushTwin on your own website

For the requested GitHub hosting, follow [GitHub Pages instructions](GITHUB_PAGES.md). The root-domain instructions below remain available for other providers.

RushTwin is a standalone web application. It does not depend on ChatGPT Sites, a ChatGPT login, or an OpenAI API. The same source builds the dashboard, workflow editor, simulation engine, playback, comparisons, imports, and documentation pages.

## Recommended first deployment: Netlify

1. Create/sign in to your own account at https://www.netlify.com/. If using the prepared archive, skip the build commands. To build from source with Node 24: `npm ci` then `npm run build`.
2. Choose the manual/drag-and-drop deployment option (https://app.netlify.com/drop).
3. Upload the **contents of `dist`**, or unzip `releases/rushtwin-website.zip` and upload the extracted folder. The deployed root must contain `index.html`, `_redirects`, and `assets/`.
4. Open the generated HTTPS site and test `/demo`, refresh it, run the baseline, and replay the staffing experiment.
5. In the site's domain settings, add a domain you own. Follow the DNS values Netlify provides for that particular site at your registrar. Do not guess DNS records or replace unrelated email records.
6. Wait for DNS and the HTTPS certificate to finish provisioning. Set the preferred primary hostname and test again using that exact address.

A custom domain is optional for the initial deployment. Domain registration and hosting services may have fees; choose and authorize those in your own account.

The included `_redirects` provides single-page-app routing for manual Netlify deployment. `netlify.toml` additionally configures the build and headers for a connected Git repository. Manual uploads do not apply the repository's netlify.toml build settings; they use the already-built files.

## Automatic deployments from GitHub

The complete source must first exist in your GitHub repository. A checkout with uncommitted files does not mean the code is on GitHub. After reviewing and committing/pushing the application, connect that repository in Netlify. Use the branch containing the application, build command `npm run build`, publish directory `dist`, and Node 24. Subsequent deployments rebuild from that branch's source and lockfile.

## Other hosting

Any static HTTPS host can serve `dist`. Configure a fallback to `/index.html` for app routes such as `/demo`, `/how-it-works`, and `/project/:projectId`. Keep actual asset and sample-file paths intact. Serve at the domain root, for example `https://your-domain.example/`, not a subdirectory. This build has root-relative routes and assets; subdirectory deployment needs a coordinated Vite base and router basename change.

Use `npm run preview` only for local production validation, not as a managed production hosting service.

## Keep your saved simulations

The application features travel with the website. Browser-stored projects do **not** automatically move between origins. Before changing sites/domains, export each project as `.rushtwin.json` from the old site, then import it on the new site. Rerun scenarios to regenerate results because project exports omit historical runs.

Visitors have their own browser-local workspace. Sharing a `/project/:id` link does not share the underlying project with another browser; export and share the JSON file instead. The public `/demo` works for every visitor because it creates its own demo project locally. There is no account, cloud sync, or shared database in the current product.

## Before announcing the website

- Open the final HTTPS domain in a fresh browser context.
- Open and refresh `/demo` and `/how-it-works` directly.
- Run baseline, pause/resume, use Max, apply the experiment, replay, and compare.
- Create a project, refresh, and confirm persistence on the same hostname/browser.
- Import `/samples/sample_rush.csv`, export the project, and reimport it.
- Check mobile layout and browser console errors.

The deployment files and archive prepare the app for hosting. They do not create a hosting account, register a domain, change DNS, or publish a live website.

## Verify the actual production package

Run `npm run test:e2e:production` before uploading a new build. This builds and browser-tests the static website rather than the development server. Local preview verifies the application; the final public hostname and provider routing must also be checked after deployment.
