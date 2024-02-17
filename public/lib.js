function localDateTime(dt) {
 const nowDate = new Date().toLocaleDateString()
 const dateString = dt.toLocaleDateString()
 if (dateString === nowDate) {
  return dt
   .toLocaleTimeString()
   .replace(/(:\d\d):\d\d/, (_, a) => a)
 }
 return dateString
}

function insertAfter(child, node) {
 if (child.nextElementSibling) {
  child.parentElement.insertBefore(
   node,
   child.nextElementSibling
  )
 } else {
  child.parentElement.appendChild(node)
 }
}

function insertAtStart(parent, node) {
 if (parent.firstElementChild) {
  parent.insertBefore(
   node,
   parent.firstElementChild
  )
 } else {
  parent.appendChild(node)
 }
}

function elem({
 attributes,
 classes,
 children,
 events,
 style,
 tagName = 'div',
 textContent,
} = {}) {
 const e = document.createElement(tagName)
 if (attributes) {
  for (const [k, v] of Object.entries(
   attributes
  )) {
   e.setAttribute(k, v)
  }
 }
 if (events) {
  for (const [k, v] of Object.entries(events)) {
   e.addEventListener(k, v)
  }
 }
 if (classes) {
  for (const c of classes) {
   e.classList.add(c)
  }
 }
 if (textContent) {
  e.textContent = textContent
 }
 if (children) {
  for (const c of children) {
   e.appendChild(c)
  }
 }
 if (style) {
  Object.assign(e.style, style)
 }
 return e
}
