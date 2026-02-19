import express, { Request, Response, NextFunction } from "express";
import { renderUserListPdf } from "../services/userPdfService";

const router = express.Router();

router.get(
  "/users-report",
  (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    renderUserListPdf(req, res).catch(next);
    const endTime = Date.now();

    console.log(`User list PDF generated ${endTime - startTime} ms`);
  },
);

export default router;
