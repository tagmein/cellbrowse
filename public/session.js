async function attachSession(sessionStub) {
 let session = sessionStub
 try {
  const fullSessionResponse = await fetch(
   `/data/session.${sessionStub.id}.json`
  )
  session = await fullSessionResponse.json()
 } catch (e) {}
 let loaderCount = 0
 function updateUrl(url) {
  urlInput.value = url
  newTabButton.setAttribute('href', url)
 }
 async function navigateTo(url, events) {
  if (!url?.length) {
   return
  }
  loaderCount++
  loader.style.opacity = '0.5'
  updateUrl(url)
  session = await POST('/sessions', {
   id: session.id,
   events,
   url,
  })
  setSessionInformation(session)
  loaderCount--
  if (loaderCount <= 0) {
   loader.style.opacity = '0'
  }
 }
 const loader = elem({
  attributes: {
   inditerminate: 'true',
  },
  classes: ['loader'],
  tagName: 'progress',
 })
 const urlInput = elem({
  attributes: {
   placeholder: 'Enter URL',
   value: session.url,
  },
  classes: ['url'],
  events: {
   keydown({ key }) {
    switch (key) {
     case 'Enter':
      navigateTo(urlInput.value)
      break
    }
   },
  },
  tagName: 'input',
 })
 const titleBar = elem({
  classes: ['title-bar'],
  textContent: 'Untitled',
 })
 const reloadButton = elem({
  attributes: {
   title: 'Reload',
  },
  events: {
   click() {
    navigateTo(urlInput.value)
   },
  },
  textContent: '↻',
  tagName: 'button',
 })
 const newSessionButton = elem({
  attributes: {
   title: 'Duplicate session',
  },
  events: {
   async click() {
    attachSession(
     await POST('/sessions', {
      url: urlInput.value,
     })
    )
   },
  },
  textContent: '↸',
  tagName: 'button',
 })
 const newTabButton = elem({
  attributes: {
   href: urlInput.value,
   target: '_blank',
   title: 'Open in new tab',
  },
  classes: ['button'],
  tagName: 'a',
  textContent: '↗',
 })
 const collapseSessionButton = elem({
  attributes: {
   title: 'Collapse session',
  },
  events: {
   click() {
    navigateTo(urlInput.value)
   },
  },
  textContent: '⇲',
  tagName: 'button',
 })
 const navigationBar = elem({
  classes: ['navigation-bar'],
  children: [
   collapseSessionButton,
   reloadButton,
   urlInput,
   newSessionButton,
   newTabButton,
  ],
 })
 const imageContainer = elem({
  classes: ['image-container'],
 })
 const inputProxyInput = elem({
  tagName: 'input',
 })
 const inputProxyTextarea = elem({
  tagName: 'textarea',
 })
 const inputProxySubmit = elem({
  events: {
   async click() {
    switch (
     inputProxyContainer.getAttribute(
      'data-mode'
     )
    ) {
     case 'input':
      navigateTo(urlInput.value, [
       {
        type: 'text',
        value: inputProxyInput.value,
       },
      ])
      break
     case 'textarea':
      navigateTo(urlInput.value, [
       {
        type: 'text',
        value: inputProxyTextarea.value,
       },
      ])
      break
     default:
      break
    }
   },
  },
  tagName: 'button',
  textContent: 'Send',
 })
 const inputProxyContainer = elem({
  classes: ['input-proxy-container'],
  children: [
   inputProxyInput,
   inputProxyTextarea,
   inputProxySubmit,
  ],
  style: {
   display: 'none',
  },
 })
 const container = elem({
  classes: ['session-container'],
  children: [
   titleBar,
   navigationBar,
   loader,
   imageContainer,
   inputProxyContainer,
  ],
 })
 function setSessionInformation(session) {
  updateUrl(session.url)
  setImage(session.image)
  if (session.data?.title) {
   titleBar.textContent = session.data.title
  }
  if (session.data?.links) {
   setLinks(session.data.links)
  }
  switch (
   session.data.focusedElement?.tagName
  ) {
   case 'INPUT':
    inputProxyContainer.setAttribute(
     'data-mode',
     'input'
    )
    inputProxyContainer.style.display = 'block'
    inputProxyInput.style.display = 'initial'
    inputProxyTextarea.style.display = 'none'
    inputProxyInput.setAttribute(
     'placeholder',
     session.data.focusedElement.placeholder ??
      ''
    )
    inputProxyInput.value =
     session.data.focusedElement.value
    break
   case 'TEXTAREA':
    inputProxyContainer.setAttribute(
     'data-mode',
     'textarea'
    )
    inputProxyContainer.style.display = 'block'
    inputProxyTextarea.style.display = 'none'
    inputProxyInput.style.display = 'initial'
    inputProxyTextarea.setAttribute(
     'placeholder',
     session.data.focusedElement.placeholder ??
      ''
    )
    inputProxyTextarea.value =
     session.data.focusedElement.value
    break
   default:
    inputProxyContainer.style.display = 'none'
    break
  }
 }
 function setImage(imageUrl) {
  imageContainer.innerHTML = ''
  imageContainer.appendChild(
   elem({
    attributes: {
     src: `/img/${imageUrl}`,
    },
    classes: ['image-full'],
    events: {
     mousedown(e) {
      const clickEvent = {
       type: 'click',
       x: e.layerX,
       y: e.layerY,
       button: ['left', 'middle', 'right'][
        e.button
       ],
      }
      navigateTo(urlInput.value, [clickEvent])
     },
    },
    tagName: 'img',
   })
  )
 }
 const linksContainer = elem({
  classes: ['links-container'],
 })
 function setLinks(links) {
  linksContainer.innerHTML = ''
  for (const link of links) {
   linksContainer.appendChild(
    elem({
     classes: ['link-row'],
     children: [
      elem({
       events: {
        click() {
         navigateTo(link.href)
        },
       },
       textContent:
        link.text || link.title || link.href,
      }),
      elem({
       attributes: {
        title: 'Open in new session',
       },
       events: {
        async click() {
         attachSession(
          await POST('/sessions', {
           url: link.href,
          })
         )
        },
       },
       textContent: '↸',
      }),
      elem({
       attributes: {
        href: link.href,
        target: '_blank',
        title: 'Open in new tab',
       },
       tagName: 'a',
       textContent: '↗',
      }),
     ],
    })
   )
  }
 }
 if (session.image) {
  setSessionInformation(session)
 } else {
  navigateTo(session.url)
 }
 const sessionRow = elem({
  classes: ['session-row'],
  children: [container, linksContainer],
 })
 insertAtStart(document.body, sessionRow)
}
