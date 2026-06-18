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
  await waitForNextFrame();

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
}
