import {
 mkdir,
 readFile,
 writeFile,
} from 'fs/promises'
import ImageScript from 'imagescript'
import { join } from 'path'
import puppeteer from 'puppeteer'

function urlSafeEncode(value) {
 return btoa(value).replace(/=/g, '-')
}

let globalBrowserInstance
async function launchBrowser() {
 if (!globalBrowserInstance) {
  globalBrowserInstance =
   await puppeteer.launch({
    protocolTimeout: 60e3,
    userDataDir: './user_data',
   })
 }
 return globalBrowserInstance
}

const customUA =
 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0'

const pages = new Map()

async function getPageBySessionId(sessionId) {
 const browser = await launchBrowser()
 if (!pages.has(sessionId)) {
  const newPage = await browser.newPage()
  await newPage.setViewport({
   width: 640,
   height: 640,
   deviceScaleFactor: 1,
  })
  await newPage.setUserAgent(customUA)
  pages.set(sessionId, newPage)
  return newPage
 }
 return pages.get(sessionId)
}

export async function screenshot(
 imgDir,
 url,
 sessionId,
 events
) {
 const siteUrl = new URL(url)
 const screenshotDir1Name = urlSafeEncode(
  siteUrl.origin
 )
 const screenshotDir2Name = urlSafeEncode(url)
 await mkdir(
  join(
   imgDir,
   screenshotDir1Name,
   screenshotDir2Name
  ),
  { recursive: true }
 )
 const screenshotUrl = join(
  screenshotDir1Name,
  screenshotDir2Name,
  `${Date.now()}.png`
 )
 const screenshotFullPath = join(
  imgDir,
  screenshotUrl
 )
 const screenshotThumbUrl = join(
  screenshotDir1Name,
  screenshotDir2Name,
  `${Date.now()}.64.png`
 )
 const screenshotThumbFullPath = join(
  imgDir,
  screenshotThumbUrl
 )
 const page = await getPageBySessionId(
  sessionId
 )
 try {
  const pageUrl = page.url()
  if (pageUrl !== url) {
   await page.goto(url, {
    waitUntil: ['load', 'domcontentloaded'],
   })
   await page.waitForNavigation({
    timeout: 1000,
    waitUntil: 'networkidle0',
   })
  }
 } catch (e) {}
 const focusedElementHandle =
  await page.evaluateHandle(
   () => document.activeElement
  )
 if (events) {
  for (const event of events) {
   switch (event.type) {
    case 'click':
     const pagesToScrollDown = Math.floor(
      event.y / 640
     )
     await page.evaluate(
      `window.scrollTo(0, ${
       pagesToScrollDown * 640
      })`
     )
     await page.mouse.click(
      event.x,
      event.y - pagesToScrollDown * 640,
      {
       button: event.button ?? 'left',
      }
     )
     break
    case 'text':
     await focusedElementHandle.evaluate(
      (x) => (x.value = '')
     )
     await focusedElementHandle.type(
      event.value
     )
     break
   }
  }
 }
 const [tagName, placeholder, value] =
  await Promise.all([
   focusedElementHandle.evaluate(
    (x) => x.tagName
   ),
   focusedElementHandle.evaluate((x) =>
    x.getAttribute('placeholder')
   ),
   focusedElementHandle.evaluate((x) =>
    x.getAttribute('value')
   ),
  ])
 const pageData = {
  title: await page.title(),
  links: await page.$$eval('a', (as) =>
   as.map((a) => ({
    text: a.textContent,
    href: a.href,
    title: a.title,
   }))
  ),
  focusedElement: {
   tagName,
   placeholder,
   value,
  },
 }
 try {
  await page.waitForNetworkIdle({
   timeout: 2500,
  })
 } catch (e) {}
 await page.screenshot({
  fullPage: true,
  path: screenshotFullPath,
 })
 const image = await ImageScript.Image.decode(
  await readFile(screenshotFullPath)
 )
 await writeFile(
  screenshotThumbFullPath,
  await image.resize(64, 64).encode()
 )
 return {
  pageData,
  url: page.url(),
  imageUrl: screenshotUrl,
  thumbUrl: screenshotThumbUrl,
 }
}
