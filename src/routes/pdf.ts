import express, { Request, Response, NextFunction } from "express";
import { renderUserListPdf } from "../services/userPdfService";
import { renderInvoicePdf } from "../services/invoicePdfService";

const router = express.Router();

router.get(
  "/users-report",
  (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    renderUserListPdf(req, res)
      .then(() => {
        const endTime = Date.now();
        console.log(`User list PDF generated in ${endTime - startTime} ms`);
      })
      .catch(next);
  },
);

router.get("/invoice", (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  renderInvoicePdf(req, res)
    .then(() => {
      const endTime = Date.now();
      console.log(`Invoice PDF generated in ${endTime - startTime} ms`);
    })
    .catch(next);
});

export default router;
