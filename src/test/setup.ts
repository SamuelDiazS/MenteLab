import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

afterEach(() => {
  cleanup();
  localStorage.clear();
});
