import helmet from 'helmet';

/**
 * Helmet security middleware configuration
 * Sets secure HTTP headers to protect against common vulnerabilities
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      // 'wasm-unsafe-eval' lets shiki compile its WebAssembly highlighter.
      scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  frameguard: {
    action: 'deny', // prevent clickjacking
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
});

export default helmetConfig;
