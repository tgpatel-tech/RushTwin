import { test, expect } from "@playwright/test";
test("create, run, duplicate, replay, compare, reload, and CSV import", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Test the rush before it happens." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "New Simulation", exact: true })
    .click();
  await page.getByLabel("Project name", { exact: true }).fill("Test Café");
  await page.getByLabel("Template", { exact: true }).selectOption("Café Rush");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create Simulation", exact: true })
    .click();
  await expect(page.getByLabel("Scenario name")).toHaveValue("Baseline");
  const url = page.url();
  await page.getByRole("button", { name: "Run Rush", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const time = await page.getByLabel("Simulation timeline").inputValue();
  await page.waitForTimeout(300);
  expect(await page.getByLabel("Simulation timeline").inputValue()).toBe(time);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByLabel("Playback speed").selectOption("0");
  await expect(
    page.getByText("Completed orders", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Customers", exact: true }).click();
  await page.getByRole("button", { name: "#001", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Order #001" })).toBeVisible();
  await page.getByRole("button", { name: "Close inspector" }).click();
  await page
    .getByRole("button", { name: "Duplicate Scenario", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Scenario name")
    .fill("More Drink Capacity");
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await page.locator(".react-flow__node").filter({ hasText: "Drinks" }).click();
  await page.getByRole("button", { name: "Add worker", exact: true }).click();
  await expect(page.getByLabel("Workers", { exact: true })).toHaveValue("2");
  await page
    .locator(".react-flow__node")
    .filter({ hasText: "Order" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Remove worker", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Replay Same Rush", exact: true })
    .click();
  await expect(
    page.getByText("Completed orders", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Compare", exact: true }).click();
  await expect(
    page.getByText(
      "✓ Same customers. Same arrivals. Same order mix. Same seed.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("No additional workers were added."),
  ).toBeVisible();
  await page.goto(url);
  await expect(page.getByLabel("Scenario name")).toHaveValue(
    "More Drink Capacity",
  );
  await page.reload();
  await expect(page.getByLabel("Scenario name")).toHaveValue(
    "More Drink Capacity",
  );
  await page.getByRole("link", { name: "Import CSV", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles("public/samples/sample_rush.csv");
  await page.getByRole("button", { name: "Validate Data" }).click();
  await expect(page.getByText("valid arrivals")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Create Replay Scenario" }).click();
  await expect(page.getByLabel("Scenario name")).toHaveValue(
    "Imported · sample_rush",
  );
  await page.getByRole("button", { name: "Run Rush", exact: true }).click();
  await page.getByLabel("Playback speed").selectOption("0");
  await expect(page.getByText("90 / 90", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("demo, project export and import, malformed CSV, mobile dashboard", async ({
  page,
}) => {
  await page.goto("/demo");
  await expect(
    page.getByRole("button", { name: "Run Baseline" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run Baseline" }).click();
  await page.getByLabel("Playback speed").selectOption("0");
  await page.getByRole("button", { name: "Test a Change" }).click();
  await page.getByRole("button", { name: "Apply Experiment" }).click();
  await page.getByRole("button", { name: "Replay Same Rush" }).click();
  await expect(
    page.getByRole("button", { name: "Compare the results" }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const f = await download;
  const path = await f.path();
  expect(path).toBeTruthy();
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles(path!);
  await expect(
    page.getByRole("heading", { name: "Morning Café Rush", exact: true }),
  ).toHaveCount(3);
  await page.goto("/project/demo/import");
  await page
    .locator("input[type=file]")
    .setInputFiles("public/samples/sample_invalid_rush.csv");
  await page.getByRole("button", { name: "Validate Data" }).click();
  await expect(
    page.getByText("Duplicate order ID", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip Invalid Rows" }).click();
  await expect(
    page.getByRole("heading", { name: "2 arrivals ready to replay." }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "New Simulation", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
