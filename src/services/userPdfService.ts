import PDFDocument, { font, opacity } from "pdfkit";
import { Request, Response } from "express";

type PageSize = "a4";
type PageOrientation = "portrait";

type RenderOptions = {
  orientation: PageOrientation;
  pageSize: PageSize;
  pageNumbers: boolean;
  filename: string;
  margin: number;
  tableHeaders: {
    users: Array<{
      label: string;
      width: number;
    }>;
  };
};

type UserDetails = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const TextStyles = {
  header: {
    size: 18,
    color: "#000000",
    font: "Helvetica-Bold",
    opacity: 0.8,
  },
  tableRow: {
    size: 12,
    color: "#220f0f",
    font: "Helvetica",
    opacity: 0.6,
  },
  pageNumber: {
    size: 10,
    color: "#c81515",
    font: "Helvetica",
    opacity: 0.9,
  },
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

const usersCount = 1001;
const roles = ["Admin", "Editor", "Viewer"];
const listOfUsers = Array.from({ length: usersCount }, (_, i) => {
  const index = i + 1;

  return {
    id: index,
    name: `usr-${index}`,
    email: `user${index}@example.com`,
    role: roles[i % roles.length],
    createdAt: new Date(2026, 0, index).toISOString().slice(0, 10),
  };
});

const createPDFDocument = (options: RenderOptions): PDFKit.PDFDocument => {
  const { orientation, pageSize, margin } = options;

  return new PDFDocument({
    size: pageSize,
    layout: orientation,
    margin: margin,
    bufferPages: true,
    displayTitle: true,
  });
};

const addPageNumbers = (doc: PDFKit.PDFDocument): void => {
  const { page } = doc;
  const totalPages = doc.bufferedPageRange().count;

  for (let pageCount = 0; pageCount < totalPages; pageCount++) {
    doc.switchToPage(pageCount);

    const bottom = page.height - page.margins.bottom - page.margins.top;
    const usableWidth = page.width - page.margins.left - page.margins.right;

    doc
      .fontSize(TextStyles.pageNumber.size)
      .fillColor(TextStyles.pageNumber.color)
      .font(TextStyles.pageNumber.font)
      .opacity(TextStyles.pageNumber.opacity)
      .text(`Page ${pageCount + 1}`, page.margins.left, bottom, {
        width: usableWidth,
        align: "center",
      });
  }
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

const shouldAddNewPage = (
  doc: PDFKit.PDFDocument,
  rowHeight: number,
): boolean => {
  const { page } = doc;

  const currentPosition = doc.y;
  const pageHeight = page.height - page.margins.top - page.margins.bottom;

  return currentPosition + rowHeight > pageHeight;
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

const renderUserListPdf = async (req: Request, res: Response) => {
  const doc = createPDFDocument(DEFAULT_PDF_OPTIONS);

  addTableHeaders(doc, DEFAULT_PDF_OPTIONS.tableHeaders.users);

  listOfUsers.forEach((user) => {
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
