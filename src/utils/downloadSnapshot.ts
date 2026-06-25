import { toPng } from 'html-to-image'

const STABLE_FRAME_COUNT = 3
const INLINE_IMAGE_MIME_TYPE = 'image/png'
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
const IMAGE_RESOURCE_ATTRIBUTES = new Set(['src', 'srcset', 'sizes'])
const SHADOW_CLASS_PATTERN = /^shadow(?:$|-|\[)/
const LIGHT_IOS_SNAPSHOT_SHADOW = 'inset 0 0 0 1px rgba(255, 255, 255, 0.48), 0 0 0 1px rgba(16, 32, 58, 0.06)'
const DARK_IOS_SNAPSHOT_SHADOW = 'inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 0 0 1px rgba(3, 7, 18, 0.18)'

function waitFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

async function waitStableFrames(count = STABLE_FRAME_COUNT) {
  for (let i = 0; i < count; i++) await waitFrame()
}

function isConfiguredImage(img: HTMLImageElement) {
  return Boolean(img.getAttribute('src') || img.getAttribute('srcset') || img.src)
}

async function waitImage(img: HTMLImageElement) {
  if (!isConfiguredImage(img)) return

  if (img.decode) {
    try {
      await img.decode()
    } catch {}
  }

  if (!img.complete) {
    await new Promise<void>(resolve => {
      const done = () => {
        img.removeEventListener('load', done)
        img.removeEventListener('error', done)
        resolve()
      }
      img.addEventListener('load', done, { once: true })
      img.addEventListener('error', done, { once: true })
      if (img.complete) done()
    })
  }

  if (img.naturalWidth && img.naturalHeight && img.decode) {
    try {
      await img.decode()
    } catch {}
  }
}

async function waitImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map(img => waitImage(img)))
}

function removeResponsive(root: HTMLElement) {
  const nodes = Array.from(root.querySelectorAll('img, source'))
  for (const node of nodes) {
    node.removeAttribute('srcset')
    node.removeAttribute('sizes')
  }
}

function imageToDataURL(img: HTMLImageElement, index: number) {
  if (!img.naturalWidth || !img.naturalHeight) {
    throw new Error(String(index))
  }

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(String(index))

  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL(INLINE_IMAGE_MIME_TYPE)
}

function skipAttr(el: Element, name: string) {
  const tag = el.localName.toLowerCase()
  return (tag === 'img' || tag === 'source') && IMAGE_RESOURCE_ATTRIBUTES.has(name.toLowerCase())
}

function cloneNode(node: Node): Node {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || '')
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return document.createComment((node as Comment).data)
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return document.createTextNode('')
  }

  const el = node as Element
  const tag = el.namespaceURI === HTML_NAMESPACE ? el.localName : el.tagName
  const clone = el.namespaceURI
      ? document.createElementNS(el.namespaceURI, tag)
      : document.createElement(tag)

  for (const attr of Array.from(el.attributes)) {
    if (skipAttr(el, attr.name)) continue
    clone.setAttribute(attr.name, attr.value)
  }

  for (const child of Array.from(el.childNodes)) {
    clone.appendChild(cloneNode(child))
  }

  return clone
}

function inlineImages(src: HTMLElement, clone: HTMLElement) {
  const srcImgs = Array.from(src.querySelectorAll('img')) as HTMLImageElement[]
  const cloneImgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[]

  removeResponsive(clone)

  cloneImgs.forEach((img, i) => {
    const srcImg = srcImgs[i]
    if (!srcImg || !isConfiguredImage(srcImg)) {
      img.removeAttribute('src')
      return
    }

    img.crossOrigin = 'anonymous'
    img.decoding = 'sync'
    img.src = imageToDataURL(srcImg, i)
  })
}

function isIOSWebKit() {
  const ua = navigator.userAgent
  const isIOS =
    /iP(ad|hone|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  return isIOS && /AppleWebKit/.test(ua)
}

function isLightSnapshot(root: HTMLElement) {
  return root.className.includes('text-[#10203a]') || root.style.backgroundColor === 'rgb(238, 243, 241)' || root.style.backgroundColor === '#eef3f1'
}

function removeShadowClasses(el: HTMLElement) {
  const className = el.getAttribute('class')
  if (!className) return false

  const nextClassName = className
    .split(/\s+/)
    .filter(token => !SHADOW_CLASS_PATTERN.test(token))
    .join(' ')

  if (nextClassName === className) return false

  el.setAttribute('class', nextClassName)
  return true
}

function stabilizeIOSWebKitSnapshotShadows(root: HTMLElement) {
  const fallbackShadow = isLightSnapshot(root) ? LIGHT_IOS_SNAPSHOT_SHADOW : DARK_IOS_SNAPSHOT_SHADOW
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]

  for (const el of nodes) {
    const hadInlineShadow = Boolean(el.style.boxShadow)
    const hadShadowClass = removeShadowClasses(el)

    if (hadInlineShadow || hadShadowClass) {
      // iOS WebKit can rasterize large html-to-image box shadows as clipped blocks.
      el.style.boxShadow = fallbackShadow
    }
  }
}

function assertNoExternal(root: HTMLElement) {
  const bad = Array.from(root.querySelectorAll('img')).find(img => {
    const src = img.getAttribute('src')
    return src && !src.startsWith('data:image/')
  })

  if (bad) throw new Error('')
}

function mount(clone: HTMLElement) {
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '0'
  host.style.top = '0'
  host.style.pointerEvents = 'none'
  host.setAttribute('aria-hidden', 'true')
  host.appendChild(clone)
  document.body.appendChild(host)

  const width = Math.ceil(clone.getBoundingClientRect().width || clone.scrollWidth || window.innerWidth)
  host.style.left = `-${width + 64}px`

  return () => host.remove()
}

async function prepare(element: HTMLElement) {
  await document.fonts?.ready
  await waitImages(element)
  await waitStableFrames()

  const clone = cloneNode(element) as HTMLElement
  inlineImages(element, clone)
  if (isIOSWebKit()) stabilizeIOSWebKitSnapshotShadows(clone)

  const unmount = mount(clone)

  try {
    await waitImages(clone)
    await waitStableFrames()
    assertNoExternal(clone)
    return { clone, unmount }
  } catch (e) {
    unmount()
    throw e
  }
}

export function buildReadingSnapshotFilename(name: string) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `space-tarot-${safe || 'reading'}-${stamp}.png`
}

export async function downloadElementAsPng(element: HTMLElement, filename: string, backgroundColor = '#0f131f') {
  const { clone, unmount } = await prepare(element)

  try {
    const dataUrl = await toPng(clone, {
      backgroundColor,
      pixelRatio: 2,
      skipFonts: true,
      cacheBust: false
    })

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    unmount()
  }
}
