import { test, expect } from "@playwright/test";

test("all nine chapters, inspection, configuration, persistence and export work", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#loading-screen")).toHaveClass(/is-loaded/);
  await expect(page.locator("#webgl-fallback")).toBeHidden();
  await expect(page.locator("body")).toHaveAttribute("data-section", "Intro");
  const chapters = [
    "Intro",
    "Disassembly",
    "Heart",
    "Presentation",
    "Bracelet",
    "Perspectives",
    "Configurator",
    "Reassembly",
    "Archive",
  ];
  for (const [index, chapter] of chapters.entries()) {
    await page.locator("#chapter-progress button").nth(index).click();
    await expect(page.locator("body")).toHaveAttribute("data-section", chapter);
    await expect(page.locator(".scene-overlay:not([inert])")).toHaveCount(1);
  }
  await page.locator("#chapter-progress button").nth(1).click();
  await page.locator(".layer-tab").nth(4).click();
  await expect(page.locator("#component-card")).toBeVisible();
  await expect(page.locator("#card-title")).toHaveText(
    "Escapement & Oscillator",
  );
  await page.locator("#btn-close-card").click();
  await expect(page.locator("#component-card")).toBeHidden();
  await page.locator("#chapter-progress button").nth(6).click();
  await page
    .getByRole("button", { name: "dial finish: Emerald", exact: true })
    .click();
  await page
    .getByRole("button", { name: "hardware & bridges: Rose gold", exact: true })
    .click();
  await expect(page.locator("#config-summary-text")).toContainText(
    "Emerald · Rose gold",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#btn-save-composition").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("aether-composition.txt");
  await page.reload();
  await page.locator("#chapter-progress button").nth(6).click();
  await expect(
    page.getByRole("button", { name: "dial finish: Emerald", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator("#chapter-progress button").nth(8).click();
  await page.locator('[data-preset="royal"]').click();
  await expect(page.locator('[data-preset="royal"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#btn-back-top").click();
  await expect(page.locator("body")).toHaveAttribute("data-section", "Intro");
  expect(errors).toEqual([]);
});

test("drawer is keyboard accessible and playback can be stopped outside the intro", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#btn-menu").click();
  await expect(page.locator("#chapter-nav")).toBeVisible();
  await expect(page.locator("#chapter-nav a").first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#btn-menu")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#chapter-nav")).toBeHidden();
  await page.locator("#btn-story-toggle").click();
  await expect(page.locator("#btn-story-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#btn-story-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.locator("#btn-motion")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("mobile layouts remain within the viewport and all controls remain reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#webgl-fallback")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile-intro.png" });
  await page.locator("#chapter-progress button").nth(6).click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-section",
    "Configurator",
  );
  await page
    .getByRole("button", { name: "bracelet finish: Bronze", exact: true })
    .click();
  await expect(page.locator("#config-summary-text")).toContainText("Bronze");
  await page.screenshot({ path: "test-results/mobile-configurator.png" });
  await page.locator("#btn-menu").click();
  await page.locator('#chapter-nav [data-section-target="Archive"]').click();
  await expect(page.locator("body")).toHaveAttribute("data-section", "Archive");
  await page.locator('[data-preset="phantom"]').click();
  await expect(page.locator('[data-preset="phantom"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("WebGL failure preserves the chapter experience", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type.includes("webgl")) return null;
      return getContext.call(this, type, ...args);
    };
  });
  await page.goto("/");
  await expect(page.locator("#webgl-fallback")).toBeVisible();
  await expect(page.locator("#loading-screen")).toHaveClass(/is-loaded/);
  await page.locator("#chapter-progress button").nth(6).click();
  await page
    .getByRole("button", { name: "dial finish: Midnight", exact: true })
    .click();
  await expect(page.locator("#config-summary-text")).toContainText("Midnight");
});

test("normal motion navigation reaches the final chapter and rotation changes the render", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("#btn-motion").click();
  await page.waitForTimeout(900);
  const clip = { x: 680, y: 170, width: 600, height: 620 };
  const before = await page.screenshot({ clip });
  await page.mouse.move(1000, 450);
  await page.mouse.down();
  await page.mouse.move(1130, 450, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  const after = await page.screenshot({ clip });
  expect(before.equals(after)).toBe(false);
  await page.locator("#chapter-progress button").nth(8).click();
  await expect(page.locator("body")).toHaveAttribute("data-section", "Archive");
  await expect(page.locator("#btn-next")).toBeDisabled();
  await page.locator("#btn-back-top").click();
  await expect(page.locator("body")).toHaveAttribute("data-section", "Intro");
});
