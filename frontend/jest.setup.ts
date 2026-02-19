import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(global as typeof globalThis).ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

class IntersectionObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

(global as typeof globalThis).IntersectionObserver =
  IntersectionObserverMock as unknown as typeof IntersectionObserver;
