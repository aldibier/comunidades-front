import { expect, type Locator, type Page } from '@playwright/test'

export async function expectNoOverflow(page: Page) {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(extra).toBeLessThanOrEqual(1)
}

export async function expectChrome(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('El proyecto no fijó el viewport.')
  const nav = page.getByRole('navigation', { name: 'Secciones' })
  await expect(nav).toBeVisible()
  const box = await nav.boundingBox()
  if (!box) throw new Error('La navegación no tiene caja.')
  const mobile = viewport.width < 900

  if (mobile) {
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 2)
    expect(box.height).toBeLessThan(120)
    expect(box.width).toBeGreaterThan(viewport.width - 2)
    await expect(nav.getByRole('paragraph')).toBeHidden()
  } else {
    expect(box.x).toBeLessThanOrEqual(1)
    expect(box.width).toBeGreaterThan(180)
    expect(box.width).toBeLessThan(260)
    expect(box.height).toBeGreaterThan(viewport.height - 2)
    await expect(nav.getByRole('paragraph')).toBeVisible()
  }

  const links = nav.getByRole('link')
  await expect(links).toHaveCount(3)
  for (const link of await links.all()) {
    const linkBox = await link.boundingBox()
    if (!linkBox) throw new Error('Un enlace de la navegación no tiene caja.')
    expect(linkBox.x).toBeGreaterThanOrEqual(-1)
    expect(linkBox.x + linkBox.width).toBeLessThanOrEqual(viewport.width + 1)
    expect(linkBox.y).toBeGreaterThanOrEqual(-1)
    expect(linkBox.y + linkBox.height).toBeLessThanOrEqual(viewport.height + 1)
    expect(linkBox.height).toBeGreaterThanOrEqual(44)
    const overflow = await link.evaluate((element) => element.scrollWidth - element.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  }
}

export async function expectPrimaryWidth(page: Page, locator: Locator) {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('El proyecto no fijó el viewport.')
  const main = page.locator('main')
  const mainBox = await main.boundingBox()
  const buttonBox = await locator.boundingBox()
  if (!mainBox || !buttonBox) throw new Error('No se pudo medir el botón primario.')
  const pad = await main.evaluate((element) => {
    const style = getComputedStyle(element)
    return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  })
  const inner = mainBox.width - pad
  if (viewport.width < 900) {
    expect(Math.abs(buttonBox.width - inner)).toBeLessThan(2)
  } else {
    expect(buttonBox.width).toBeGreaterThan(160)
    expect(buttonBox.width).toBeLessThan(inner - 40)
  }
}

/** A control must sit fully in view, clear of the phone bar or the side column. */
export async function expectClearOfNav(page: Page, locator: Locator) {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('El proyecto no fijó el viewport.')
  const button = await locator.boundingBox()
  const nav = await page.getByRole('navigation', { name: 'Secciones' }).boundingBox()
  if (!button || !nav) throw new Error('No se pudo medir el control contra la navegación.')
  expect(button.y).toBeGreaterThanOrEqual(-1)
  expect(button.height).toBeGreaterThan(0)
  if (viewport.width < 900) {
    expect(button.y + button.height).toBeLessThanOrEqual(nav.y + 1)
  } else {
    expect(button.x).toBeGreaterThanOrEqual(nav.x + nav.width - 1)
    expect(button.y + button.height).toBeLessThanOrEqual(viewport.height + 1)
  }
}

export async function scrollToEnd(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
}
