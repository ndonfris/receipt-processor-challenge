import * as express from 'express';
import receiptRoutes from './routes/receipts';

const app = express.default();

// Middleware
app.use(express.default.json());

// Routes
app.use('/receipts', receiptRoutes);

/**
 * We separate `app.ts` and `index.ts` for testing purposes.
 * Exporting the middleware and routes in our `app` object, allows us to test
 * the API without starting the server.
 */
export default app;
