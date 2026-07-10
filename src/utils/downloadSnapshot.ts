import { toCanvas } from 'html-to-image'

const STABLE_FRAME_COUNT = 3
const IMAGE_DRAW_ATTEMPTS = 3
const SNAPSHOT_RENDER_ATTEMPTS = 4
const SNAPSHOT_RENDER_RETRY_DELAY_MS = 100
const INLINE_IMAGE_MIME_TYPE = 'image/png'
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
const IMAGE_RESOURCE_ATTRIBUTES = new Set(['src', 'srcset', 'sizes'])
const SNAPSHOT_MARKER_COLOR = [1, 254, 2] as const
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

function hasIntrinsicSize(img: HTMLImageElement) {
  return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
}

async function waitImage(img: HTMLImageElement) {
  if (!isConfiguredImage(img)) return

  if (!hasIntrinsicSize(img)) {
    await new Promise<void>((resolve, reject) => {
      const done = () => {
        img.removeEventListener('load', done)
        img.removeEventListener('error', failed)

        if (!hasIntrinsicSize(img)) {
          reject(new Error('Snapshot image loaded without drawable pixels.'))
          return
        }

        resolve()
      }
      const failed = () => {
        img.removeEventListener('load', done)
        img.removeEventListener('error', failed)
        reject(new Error('Snapshot image failed to load.'))
      }

      img.addEventListener('load', done, { once: true })
      img.addEventListener('error', failed, { once: true })

      // `complete` is also true for broken images. Re-check after installing the
      // listeners so a cached load cannot race between the first check and here.
      if (img.complete) done()
    })
  }

  if (img.decode) {
    try {
      await img.decode()
    } catch {
      // WebKit can reject decode() for an image that it has already painted.
      // The intrinsic-size and pixel probes below remain the source of truth.
    }
  }

  if (!hasIntrinsicSize(img)) throw new Error('Snapshot image is not drawable.')
  await waitFrame()
}

function hasVisiblePixels(source: CanvasImageSource) {
  const probe = document.createElement('canvas')
  probe.width = 12
  probe.height = 12

  const ctx = probe.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false

  ctx.clearRect(0, 0, probe.width, probe.height)
  ctx.drawImage(source, 0, 0, probe.width, probe.height)
  const pixels = ctx.getImageData(0, 0, probe.width, probe.height).data
  return pixels.some((channel, index) => index % 4 === 3 && channel > 0)
}

async function waitImages(root: HTMLElement, verifyPixels = false) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map(async img => {
    await waitImage(img)
    if (verifyPixels && isConfiguredImage(img) && !hasVisiblePixels(img)) {
      throw new Error('Snapshot image decoded without visible pixels.')
    }
  }))
}

function removeResponsive(root: HTMLElement) {
  const nodes = Array.from(root.querySelectorAll('img, source'))
  for (const node of nodes) {
    node.removeAttribute('srcset')
    node.removeAttribute('sizes')
  }
}

function imageSource(img: HTMLImageElement) {
  return img.currentSrc || img.src || img.getAttribute('src') || ''
}

function imageSourceKey(source: string) {
  if (!source || source.startsWith('data:') || source.startsWith('blob:')) return source

  try {
    const url = new URL(source, document.baseURI)
    url.hash = ''
    url.searchParams.delete('__refresh')
    url.searchParams.delete('__retry')
    return url.href
  } catch {
    return source
  }
}

function isInsideViewport(img: HTMLImageElement) {
  const rect = img.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight
}

function collectLoadedImages(root: HTMLElement) {
  const loaded = new Map<string, HTMLImageElement[]>()

  for (const img of Array.from(document.images)) {
    if (!hasIntrinsicSize(img)) continue

    const key = imageSourceKey(imageSource(img))
    if (!key) continue

    const candidates = loaded.get(key) ?? []
    candidates.push(img)
    loaded.set(key, candidates)
  }

  for (const candidates of loaded.values()) {
    candidates.sort((a, b) => {
      const score = (img: HTMLImageElement) =>
        (root.contains(img) ? 0 : 2) + (isInsideViewport(img) ? 1 : 0)
      return score(b) - score(a)
    })
  }

  return loaded
}

async function imageToDataURL(candidates: HTMLImageElement[], index: number) {
  let lastError: unknown

  for (const img of candidates) {
    try {
      await waitImage(img)

      for (let attempt = 0; attempt < IMAGE_DRAW_ATTEMPTS; attempt++) {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error(`Snapshot image ${index + 1} could not create a canvas.`)

        ctx.drawImage(img, 0, 0)

        if (hasVisiblePixels(canvas)) {
          const dataURL = canvas.toDataURL(INLINE_IMAGE_MIME_TYPE)
          canvas.width = 0
          canvas.height = 0
          return dataURL
        }

        canvas.width = 0
        canvas.height = 0
        await waitFrame()
      }

      lastError = new Error(`Snapshot image ${index + 1} decoded as an empty raster.`)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error(`Snapshot image ${index + 1} has no loaded source.`)
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

async function inlineImages(src: HTMLElement, clone: HTMLElement) {
  const srcImgs = Array.from(src.querySelectorAll('img')) as HTMLImageElement[]
  const cloneImgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[]
  const loadedImages = collectLoadedImages(src)

  removeResponsive(clone)

  for (let i = 0; i < cloneImgs.length; i++) {
    const img = cloneImgs[i]
    const srcImg = srcImgs[i]
    if (!srcImg || !isConfiguredImage(srcImg)) {
      img.removeAttribute('src')
      continue
    }

    const source = imageSource(srcImg)
    const reusable = loadedImages.get(imageSourceKey(source)) ?? []
    const candidates = [...new Set([...reusable, srcImg])]

    // Prefer the already painted card from the reveal/chat UI. The hidden
    // snapshot template is only the fallback because iOS may defer its decode.
    img.decoding = 'sync'
    img.src = await imageToDataURL(candidates, i)
  }
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

function delay(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms))
}

function installImageRenderMarkers(root: HTMLElement) {
  const markers: HTMLElement[] = []

  for (const img of Array.from(root.querySelectorAll('img'))) {
    if (!isConfiguredImage(img) || !img.parentElement) continue

    const parent = img.parentElement
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'

    const marker = document.createElement('span')
    marker.setAttribute('aria-hidden', 'true')
    Object.assign(marker.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: '6px',
      height: '6px',
      transform: 'translate(-50%, -50%)',
      backgroundColor: `rgb(${SNAPSHOT_MARKER_COLOR.join(', ')})`,
      pointerEvents: 'none',
      zIndex: '0',
    })

    img.style.position = 'relative'
    img.style.zIndex = '1'
    parent.insertBefore(marker, img)
    markers.push(marker)
  }

  return markers
}

function isMarkerColor(r: number, g: number, b: number, a: number) {
  return a > 200 && r < 20 && g > 230 && b < 30
}

function hasVisibleRenderMarker(canvas: HTMLCanvasElement, root: HTMLElement, markers: HTMLElement[]) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const rootRect = root.getBoundingClientRect()
  if (!ctx || !rootRect.width || !rootRect.height) {
    throw new Error('Snapshot canvas could not be verified.')
  }

  const scaleX = canvas.width / rootRect.width
  const scaleY = canvas.height / rootRect.height

  return markers.some(marker => {
    const rect = marker.getBoundingClientRect()
    const x = Math.max(0, Math.min(canvas.width - 1, Math.round((rect.left + rect.width / 2 - rootRect.left) * scaleX)))
    const y = Math.max(0, Math.min(canvas.height - 1, Math.round((rect.top + rect.height / 2 - rootRect.top) * scaleY)))
    const radius = 2
    const left = Math.max(0, x - radius)
    const top = Math.max(0, y - radius)
    const width = Math.min(canvas.width - left, radius * 2 + 1)
    const height = Math.min(canvas.height - top, radius * 2 + 1)
    const pixels = ctx.getImageData(left, top, width, height).data

    for (let i = 0; i < pixels.length; i += 4) {
      if (isMarkerColor(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3])) return true
    }

    return false
  })
}

async function renderSnapshot(clone: HTMLElement, backgroundColor: string) {
  const markers = installImageRenderMarkers(clone)
  let lastError: unknown

  for (let attempt = 0; attempt < SNAPSHOT_RENDER_ATTEMPTS; attempt++) {
    try {
      const canvas = await toCanvas(clone, {
        backgroundColor,
        pixelRatio: 2,
        skipFonts: true,
        cacheBust: false,
      })

      if (!hasVisibleRenderMarker(canvas, clone, markers)) {
        return canvas.toDataURL(INLINE_IMAGE_MIME_TYPE)
      }

      canvas.width = 0
      canvas.height = 0
      lastError = new Error('Snapshot renderer omitted one or more card images.')
    } catch (error) {
      lastError = error
    }

    if (attempt < SNAPSHOT_RENDER_ATTEMPTS - 1) {
      await delay(SNAPSHOT_RENDER_RETRY_DELAY_MS)
      await waitStableFrames(1)
    }
  }

  throw lastError ?? new Error('Snapshot renderer did not produce an image.')
}

async function prepare(element: HTMLElement) {
  await document.fonts?.ready
  await waitStableFrames()

  const clone = cloneNode(element) as HTMLElement
  await inlineImages(element, clone)
  if (isIOSWebKit()) stabilizeIOSWebKitSnapshotShadows(clone)

  const unmount = mount(clone)

  try {
    await waitImages(clone, true)
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
    const dataUrl = await renderSnapshot(clone, backgroundColor)

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
