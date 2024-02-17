import express from 'express'
import { mkdirSync } from 'fs'
import { join } from 'path'
import { screenshot } from './lib/browse.mjs'
import { data } from './lib/data.mjs'
import { randomId } from './lib/randomId.mjs'

const STATIC_PATH = join(
 import.meta.dirname,
 'public'
)

const DATA_PATH = join(
 import.meta.dirname,
 'public',
 'data'
)
mkdirSync(DATA_PATH, { recursive: true })

const IMG_PATH = join(
 import.meta.dirname,
 'public',
 'img'
)
mkdirSync(IMG_PATH, { recursive: true })

const appData = data(DATA_PATH)

const app = express()

app.use(express.json())

async function readSessions() {
 return (await appData.read('sessions')) ?? []
}

async function updateSession({
 id,
 events,
 url,
}) {
 const sessionData = await readSessions()

 let session = sessionData.find(
  (x) => x.id === id
 )

 if (!session) {
  session = {
   id,
   time: Date.now(),
   url,
  }
  sessionData.push(session)
  await appData.write('sessions', sessionData)
 }

 const sessionKey = `session.${session.id}`

 session = Object.assign(
  {},
  session,
  await appData.read(sessionKey)
 )

 const {
  pageData,
  url: updatedUrl,
  imageUrl: image,
  thumbUrl: thumbImage,
 } = await screenshot(
  IMG_PATH,
  url,
  session.id,
  events
 )

 if (!('history' in session)) {
  session.history = []
 }
 if (
  session.url?.length > 0 &&
  session.history[session.history.length - 1]
   ?.url !== session.url
 ) {
  session.history.push({
   data: session.data,
   url: session.url,
   image: session.image,
   thumbImage: session.thumbImage,
  })
 }
 session.data = pageData
 session.url = updatedUrl
 session.image = image
 session.thumbImage = thumbImage
 await appData.write(sessionKey, session)
 return session
}

app.post(
 '/sessions',
 async function (req, res) {
  if ('id' in req.body) {
   return res.json(
    await updateSession(req.body)
   )
  }
  const newSession = {
   id: randomId(),
   time: Date.now(),
   url: req.body?.url ?? '',
  }
  await appData.write('sessions', [
   ...(await readSessions()),
   newSession,
  ])
  res.json(newSession)
 }
)

app.use(express.static(STATIC_PATH))

app.listen(7000, function () {
 console.log(
  'Server running on http://localhost:7000'
 )
 console.log(
  `Static content served from ${STATIC_PATH}`
 )
})
