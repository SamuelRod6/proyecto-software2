// Polyfill for TextEncoder/TextDecoder for Jest (jsdom)
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder;
}

// --- Mock para evitar errores de Canvas/Lottie ---
jest.mock('lottie-react', () => {
  return function DummyLottie() {
    return null; // Renderiza nada, solo para evitar errores en tests
  };
}, { virtual: true });

jest.mock('lottie-web', () => ({
  loadAnimation: jest.fn(),
  registerAnimation: jest.fn(),
  setSpeed: jest.fn(),
  setDirection: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  destroy: jest.fn(),
}));