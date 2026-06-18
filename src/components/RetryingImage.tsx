import {
  type ImgHTMLAttributes,
  type SyntheticEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AssetRefreshContext } from '../utils/assetRefresh';

interface RetryingImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  retryDelayMs?: number;
  maxRetryDelayMs?: number;
}

function withReloadParams(src: string, attempt: number, refreshKey: number) {
  if ((attempt === 0 && refreshKey === 0) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  try {
    const url = new URL(src, window.location.href);
    if (refreshKey > 0) {
      url.searchParams.set('__refresh', String(refreshKey));
    }
    if (attempt > 0) {
      url.searchParams.set('__retry', String(attempt));
    }
    return url.href;
  } catch {
    const hashIndex = src.indexOf('#');
    const path = hashIndex >= 0 ? src.slice(0, hashIndex) : src;
    const hash = hashIndex >= 0 ? src.slice(hashIndex) : '';
    const separator = path.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    if (refreshKey > 0) {
      params.set('__refresh', String(refreshKey));
    }
    if (attempt > 0) {
      params.set('__retry', String(attempt));
    }
    return `${path}${separator}${params.toString()}${hash}`;
  }
}

export default function RetryingImage({
  src,
  retryDelayMs = 700,
  maxRetryDelayMs = 5000,
  onError,
  onLoad,
  ...imgProps
}: RetryingImageProps) {
  const [attempt, setAttempt] = useState(0);
  const refreshKey = useContext(AssetRefreshContext);
  const retryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setAttempt(0);

    return () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [src, refreshKey]);

  const clearRetry = () => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    onError?.(event);

    if (retryTimeoutRef.current !== null) {
      return;
    }

    const delay = Math.min(maxRetryDelayMs, retryDelayMs * 2 ** Math.min(attempt, 4));
    retryTimeoutRef.current = window.setTimeout(() => {
      retryTimeoutRef.current = null;
      setAttempt(currentAttempt => currentAttempt + 1);
    }, delay);
  };

  const handleLoad = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    clearRetry();
    onLoad?.(event);
  };

  return (
    <img
      {...imgProps}
      src={withReloadParams(src, attempt, refreshKey)}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
