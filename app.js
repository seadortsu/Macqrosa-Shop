/**
 * Phusion Passenger Entry Point for cPanel Node.js hosting.
 *
 * cPanel's "Setup Node.js App" expects an app.js in the application root.
 * Passenger will `require()` / `import()` this file and look for the
 * default export (an Express app or http.Server).
 *
 * All application logic lives in server/index.js — this file simply
 * re-exports the configured Express app instance.
 */

import app from './server/index.js';
export default app;
