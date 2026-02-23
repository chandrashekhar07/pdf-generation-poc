import express, { NextFunction, Request, Response } from 'express';
import pdfRoutes from './routes/pdf';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/pdf', pdfRoutes);

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
  next();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
