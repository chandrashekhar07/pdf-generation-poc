import { Request, Response } from "express";
import {
  addPageNumbers,
  createPDFDocument,
  RenderOptions,
  shouldAddNewPage,
  TextStyles,
} from "./pdfService";

type UserDetails = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const DEFAULT_PDF_OPTIONS: RenderOptions = {
  orientation: "portrait",
  pageSize: "a4",
  pageNumbers: true,
  filename: "document.pdf",
  margin: 40,
  tableHeaders: {
    users: [
      { label: "ID", width: 50 },
      { label: "Name", width: 100 },
      { label: "Email", width: 200 },
      { label: "Role", width: 100 },
      { label: "Created", width: 100 },
    ],
  },
};

const listOfUsers = (usersCount: number): UserDetails[] => {
  const roles = ["Admin", "Editor", "Viewer"];
  return Array.from({ length: usersCount }, (_, i) => {
    const index = i + 1;

    return {
      id: index,
      name: `usr-${index}`,
      email: `user${index}@example.com`,
      role: roles[i % roles.length],
      createdAt: new Date(2026, 0, index).toISOString().slice(0, 10),
    };
  });
};

const addTableHeaders = (
  doc: PDFKit.PDFDocument,
  tableHeaders: RenderOptions["tableHeaders"]["users"],
): void => {
  let x = doc.page.margins.left;
  const y = doc.y;

  tableHeaders.forEach((header) => {
    doc
      .fontSize(TextStyles.header.size)
      .fillColor(TextStyles.header.color)
      .font(TextStyles.header.font)
      .opacity(TextStyles.header.opacity)
      .text(header.label, x, y, { width: header.width, align: "left" });
    x += header.width;
  });
};

const addTableRow = (
  doc: PDFKit.PDFDocument,
  row: UserDetails,
  tableHeaders: RenderOptions["tableHeaders"]["users"],
): void => {
  addNewPageIfNeeded(doc, 20);

  let x = doc.page.margins.left;
  const y = doc.y;

  const rowData = [
    row.id.toString(),
    row.name,
    row.email,
    row.role,
    row.createdAt,
  ];

  rowData.forEach((data, index) => {
    const header = tableHeaders[index];
    doc
      .fontSize(TextStyles.tableRow.size)
      .fillColor(TextStyles.tableRow.color)
      .font(TextStyles.tableRow.font)
      .opacity(TextStyles.tableRow.opacity)
      .text(data, x, y, { width: header.width, align: "left" });
    x += header.width;
  });
};

const addNewPageIfNeeded = (
  doc: PDFKit.PDFDocument,
  rowHeight: number,
): void => {
  if (shouldAddNewPage(doc, rowHeight)) {
    doc.addPage();
    addTableHeaders(doc, DEFAULT_PDF_OPTIONS.tableHeaders.users);
  }
};

const renderUserListPdf = async (_req: Request, res: Response) => {
  const doc = createPDFDocument(DEFAULT_PDF_OPTIONS);

  addTableHeaders(doc, DEFAULT_PDF_OPTIONS.tableHeaders.users);

  listOfUsers(1001).forEach((user) => {
    addTableRow(doc, user, DEFAULT_PDF_OPTIONS.tableHeaders.users);
  });

  addPageNumbers(doc);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${DEFAULT_PDF_OPTIONS.filename}"`,
  );

  doc.pipe(res);
  doc.end();
};

export { renderUserListPdf };
