import PDFDocument, { font, opacity } from "pdfkit";

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

const INVOICE_LOGO_URL =
  "https://assets.velorona.com/logos/v2/icon-only/100x100px/png/transparent/blue.png";

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

const shouldAddNewPage = (
  doc: PDFKit.PDFDocument,
  rowHeight: number,
): boolean => {
  const { page } = doc;

  const currentPositionY = doc.y;
  const pageHeight = page.height - page.margins.top - page.margins.bottom;

  return currentPositionY + rowHeight > pageHeight;
};

const addLogo = async (doc: PDFKit.PDFDocument): Promise<void> => {
  const logoX = doc.page.margins.left;
  const logoY = doc.y;

  try {
    const response = await fetch(INVOICE_LOGO_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    doc.image(buffer, logoX, logoY, {
      width: 50,
      height: 50,
    });
  } catch (error) {
    console.error("Failed to load invoice logo:", error);
  }
};

export {
  createPDFDocument,
  addPageNumbers,
  shouldAddNewPage,
  type RenderOptions,
  TextStyles,
  addLogo,
};
