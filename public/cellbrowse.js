async function GET(path) {
 const response = await fetch(path)
 if (!response.ok) {
  return
 }
 try {
  return response.json()
 } catch (e) {}
}
async function POST(path, bodyData) {
 const body = bodyData
  ? JSON.stringify(bodyData)
  : '{}'
 const response = await fetch(path, {
  method: 'POST',
  body,
  headers: {
   'Content-Type': 'application/json',
  },
 })
 if (!response.ok) {
  return
 }
 try {
  return response.json()
 } catch (e) {}
}
async function reload() {
 const sessions = await GET(
  '/data/sessions.json'
 )
 if (sessions?.length > 0) {
  sessions.forEach(attachSession)
 } else {
  attachSession(await POST('/sessions'))
 }
}

reload().catch((e) => console.error(e))
