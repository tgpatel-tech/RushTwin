import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: '**/pages.spec.ts',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4175' },
  webServer: {
    command: 'npm run build:pages && npm run preview -- --mode github --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175/RushTwin/',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
