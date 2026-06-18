import { toPng } from 'html-to-image';

const STABLE_FRAME_COUNT = 2;
const INLINE_IMAGE_MIME_TYPE = 'image/png';
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const IMAGE_RESOURCE_ATTRIBUTES = new Set(['src', 'srcset', 'sizes']);

function waitForNextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function waitForStableFrames(frameCount = STABLE_FRAME_COUNT) {
  for (let frame = 0; frame < frameCount; frame += 1) {
    await waitForNextFrame();
  }
}

function imageHasConfiguredSource(image: HTMLImageElement) {
  return Boolean(image.getAttribute('src') || image.getAttribute('srcset') || image.src);
}

async function waitForImage(image: HTMLImageElement) {
  if (!imageHasConfiguredSource(image)) {
    return;
  }

  if (!image.complete) {
    await new Promise<void>(resolve => {
      const done = () => {
        image.removeEventListener('load', done);
        image.removeEventListener('error', done);
        resolve();
      };

      image.addEventListener('load', done, { once: true });
      image.addEventListener('error', done, { once: true });

      if (image.complete) {
        done();
      }
    });
  }

  if (image.naturalWidth > 0 && typeof image.decode === 'function') {
    await image.decode().catch(() => undefined);
  }
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map(waitForImage));
}

function removeResponsiveImageAttributes(root: HTMLElement) {
  const responsiveNodes = Array.from(root.querySelectorAll('img, source'));

  for (const node of responsiveNodes) {
    node.removeAttribute('srcset');
    node.removeAttribute('sizes');
  }
}

function imageToPngDataUrl(image: HTMLImageElement, index: number) {
  if (image.naturalWidth === 0 || image.naturalHeight === 0) {
    throw new Error(`Snapshot image ${index + 1} is not loaded.`);
  }

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error(`Snapshot image ${index + 1} could not be rendered.`);
  }

  context.drawImage(image, 0, 0);

  return canvas.toDataURL(INLINE_IMAGE_MIME_TYPE);
}

function shouldSkipSnapshotAttribute(element: Element, attributeName: string) {
  const tagName = element.localName.toLowerCase();
  return (tagName === 'img' || tagName === 'source') && IMAGE_RESOURCE_ATTRIBUTES.has(attributeName.toLowerCase());
}

function cloneElementForSnapshot(element: Element) {
  const tagName = element.namespaceURI === HTML_NAMESPACE ? element.localName : element.tagName;
  const clone = element.namespaceURI
    ? document.createElementNS(element.namespaceURI, tagName)
    : document.createElement(tagName);

  for (const attribute of Array.from(element.attributes)) {
    if (shouldSkipSnapshotAttribute(element, attribute.name)) {
      continue;
    }

    if (attribute.namespaceURI) {
      clone.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
    } else {
      clone.setAttribute(attribute.name, attribute.value);
    }
  }

  for (const child of Array.from(element.childNodes)) {
    clone.appendChild(cloneNodeForSnapshot(child));
  }

  return clone;
}

function cloneNodeForSnapshot(node: Node): Node {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return cloneElementForSnapshot(node as Element);
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? '');
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return document.createComment((node as Comment).data);
  }

  return document.createTextNode('');
}

function inlineCloneImages(sourceRoot: HTMLElement, cloneRoot: HTMLElement) {
  const sourceImages = Array.from(sourceRoot.querySelectorAll('img')) as HTMLImageElement[];
  const cloneImages = Array.from(cloneRoot.querySelectorAll('img')) as HTMLImageElement[];

  removeResponsiveImageAttributes(cloneRoot);

  cloneImages.forEach((cloneImage, index) => {
    const sourceImage = sourceImages[index];

    if (!sourceImage || !imageHasConfiguredSource(sourceImage)) {
      cloneImage.removeAttribute('src');
      return;
    }

    cloneImage.decoding = 'sync';
    cloneImage.src = imageToPngDataUrl(sourceImage, index);
  });
}

function assertCloneImagesAreInlined(root: HTMLElement) {
  const responsiveResourceNode = root.querySelector('img[srcset], img[sizes], source[src], source[srcset], source[sizes]');
  if (responsiveResourceNode) {
    throw new Error('Snapshot clone still contains responsive image resource attributes.');
  }

  const externalImage = Array.from(root.querySelectorAll('img')).find(image => {
    const src = image.getAttribute('src');
    return src !== null && src !== '' && !src.startsWith('data:image/');
  });

  if (externalImage) {
    throw new Error('Snapshot clone still contains a non-inline image URL.');
  }
}

function cloneAndPrepareForSnapshot(element: HTMLElement) {
  const clone = cloneNodeForSnapshot(element) as HTMLElement;
  inlineCloneImages(element, clone);
  assertCloneImagesAreInlined(clone);
  return clone;
}

function mountSnapshotClone(clone: HTMLElement) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '-10000px';
  host.style.pointerEvents = 'none';
  host.appendChild(clone);
  document.body.appendChild(host);

  return () => {
    host.remove();
  };
}

async function prepareStableSnapshotClone(element: HTMLElement) {
  await document.fonts?.ready;
  await waitForImages(element);
  await waitForStableFrames();

  const clone = cloneAndPrepareForSnapshot(element);
  const unmountClone = mountSnapshotClone(clone);

  try {
    await waitForImages(clone);
    await waitForStableFrames();
    assertCloneImagesAreInlined(clone);
    return { clone, unmountClone };
  } catch (error) {
    unmountClone();
    throw error;
  }
}

export function buildReadingSnapshotFilename(spreadName: string) {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join('-') + `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const safeSpreadName = spreadName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return `space-tarot-${safeSpreadName || 'reading'}-${stamp}.png`;
}

export async function downloadElementAsPng(element: HTMLElement, filename: string) {
  const { clone, unmountClone } = await prepareStableSnapshotClone(element);

  try {
    const dataUrl = await toPng(clone, {
      backgroundColor: '#0f131f',
      fetchRequestInit: { cache: 'force-cache' },
      pixelRatio: 2,
      skipFonts: true,
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    unmountClone();
  }
}
