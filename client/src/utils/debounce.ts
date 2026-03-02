export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

export const useDebounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  
  const flush = (...args: Parameters<T>) => {
    cancel();
    fn(...args);
  };
  
  return { debounced, cancel, flush };
};

export const useThrottle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) => {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  
  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    
    if (remaining <= 0) {
      lastCall = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  };
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  
  return { throttled, cancel };
};

export const useLoading = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): { run: (...args: Parameters<T>) => Promise<void>; loading: boolean } => {
  let loading = false;
  
  const run = async (...args: Parameters<T>) => {
    if (loading) return;
    loading = true;
    try {
      await fn(...args);
    } finally {
      loading = false;
    }
  };
  
  return { run, loading };
};
