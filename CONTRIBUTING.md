# Contributing to RushTwin

Thanks for taking a look. The most useful feedback is something concrete: a workflow that behaves incorrectly, an import that fails, or a screen that is difficult to use.

## Report a problem

Open a bug report with the steps to reproduce it, the expected result, and what actually happened. Include your browser, the station settings, and the seed when relevant. Use anonymous sample data. Do not put real customer information, passwords, or private project exports in a public issue.

For a simulation problem, a small example is especially helpful. Three arrivals and a fixed service time are easier to investigate than an entire busy day.

## Propose a change

Explain the problem before proposing a feature. Keep changes focused and include a test when they affect simulation behavior. Playback must remain independent of the mathematical results, and replay must preserve demand.

```sh
npm ci
npm run lint
npm run typecheck
npm run test
npm run test:e2e:production
npm run test:e2e:pages
```

Run the browser checks sequentially because they build different deployment targets into `dist`.

Describe any AI assistance in the pull request. An automated test pass does not replace understanding the code being proposed.

## Licensing

No open-source license has been selected for this repository. Public visibility allows review but is not a blanket grant to reuse or redistribute the application. Third-party dependencies retain their own licenses. Ask the repository owner before proposing a licensing change.
