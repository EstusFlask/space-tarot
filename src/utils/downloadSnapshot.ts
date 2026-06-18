import { toPng } from 'html-to-image';

function waitForNextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function waitForImage(image: HTMLImageElement) {
  if (!image.complete || image.naturalWidth === 0) {
    await new Promise<void>(resolve => {
      const done = () => resolve();
      image.addEventListener('load', done, { once: true });
      image.addEventListener('error', done, { once: true });
    });
  }

  if (image.complete && image.naturalWidth > 0 && 'decode' in image) {
    await image.decode().catch(() => undefined);
  }
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map(waitForImage));
}

interface SnapshotImageState {
  image: HTMLImageElement;
  src: string | null;
  srcset: string | null;
  sizes: string | null;
}

async function inlineLoadedImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
  const states: SnapshotImageState[] = [];

  for (const image of images) {
    const source = image.currentSrc || image.src;
    if (!source || source.startsWith('data:') || source.startsWith('blob:')) {
      continue;
    }

    if (image.naturalWidth === 0 || image.naturalHeight === 0) {
      continue;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        continue;
      }

      context.drawImage(image, 0, 0);

      states.push({
        image,
        src: image.getAttribute('src'),
        srcset: image.getAttribute('srcset'),
        sizes: image.getAttribute('sizes'),
      });

      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
      image.src = canvas.toDataURL('image/png');
    } catch {
      // If a particular image cannot be inlined, leave it untouched and let html-to-image handle it.
    }
  }

  return () => {
    for (const state of states) {
      if (state.src === null) {
        state.image.removeAttribute('src');
      } else {
        state.image.setAttribute('src', state.src);
      }

      if (state.srcset === null) {
        state.image.removeAttribute('srcset');
      } else {
        state.image.setAttribute('srcset', state.srcset);
      }

      if (state.sizes === null) {
        state.image.removeAttribute('sizes');
      } else {
        state.image.setAttribute('sizes', state.sizes);
      }
    }
  };
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
  await waitForNextFrame();
  await document.fonts?.ready;
  await waitForImages(element);
  const restoreImages = await inlineLoadedImages(element);
  await waitForNextFrame();

  try {
    const dataUrl = await toPng(element, {
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
    restoreImages();
  }
}
