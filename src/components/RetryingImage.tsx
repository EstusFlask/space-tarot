import {
  type ImgHTMLAttributes,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

interface RetryingImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  retryDelayMs?: number;
  maxRetryDelayMs?: number;
}

function withRetryParam(src: string, attempt: number) {
  if (attempt === 0 || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  try {
    const url = new URL(src, window.location.href);
    url.searchParams.set('__retry', String(attempt));
    return url.href;
  } catch {
    const hashIndex = src.indexOf('#');
    const path = hashIndex >= 0 ? src.slice(0, hashIndex) : src;
    const hash = hashIndex >= 0 ? src.slice(hashIndex) : '';
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}__retry=${attempt}${hash}`;
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
  const retryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setAttempt(0);

    return () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [src]);

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
      src={withRetryParam(src, attempt)}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
