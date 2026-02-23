import { Request, Response } from "express";
import {
  addLogo,
  addPageNumbers,
  createPDFDocument,
  RenderOptions,
  shouldAddNewPage,
} from "./pdfService";

type InvoicePartyDetails = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type InvoiceTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
};

type InvoiceDetails = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  from: InvoicePartyDetails;
  to: InvoicePartyDetails;
  items: InvoiceItem[];
  totals: InvoiceTotals;
};

const DEFAULT_INVOICE_PDF_OPTIONS: RenderOptions = {
  orientation: "portrait",
  pageSize: "a4",
  pageNumbers: true,
  filename: "invoice.pdf",
  margin: 40,
  tableHeaders: {
    users: [],
  },
};

const InvoiceStyles = {
  header: {
    size: 24,
    color: "#000000",
    font: "Helvetica-Bold",
    opacity: 1,
  },
  partySection: {
    size: 14,
    color: "#000000",
    font: "Helvetica-Bold",
    opacity: 0.9,
  },
  normal: {
    size: 10,
    color: "#000000",
    font: "Helvetica",
    opacity: 0.8,
  },
  tableHeader: {
    size: 11,
    color: "#FFFFFF",
    font: "Helvetica-Bold",
    opacity: 1,
  },
  tableRow: {
    size: 10,
    color: "#000000",
    font: "Helvetica",
    opacity: 0.8,
  },
  totalLabel: {
    size: 11,
    color: "#000000",
    font: "Helvetica-Bold",
    opacity: 0.9,
  },
  totalValue: {
    size: 11,
    color: "#000000",
    font: "Helvetica",
    opacity: 0.8,
  },
  grandTotal: {
    size: 14,
    color: "#000000",
    font: "Helvetica-Bold",
    opacity: 1,
  },
};

const generateMockInvoiceData = (rowCount: number): InvoiceDetails => {
  const products = [
    "Web Development",
    "UI/UX Design",
    "Cloud Hosting",
    "Technical Support",
    "API Integration",
    "Database Setup",
    "Security Audit",
    "Performance Optimization",
  ];

  const items: InvoiceItem[] = Array.from({ length: rowCount }, (_, i) => {
    const quantity = (i % 5) + 1;
    const unitPrice = 100 + (i % 10) * 25;
    const amount = quantity * unitPrice;

    return {
      description: `${products[i % products.length]} - Service ${i + 1}`,
      quantity,
      unitPrice,
      amount,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discount = subtotal * 0.05;
  const tax = (subtotal - discount) * 0.1;
  const shipping = 0;
  const total = subtotal - discount + tax;

  return {
    invoiceNumber: "INV-001",
    invoiceDate: "2026-02-21",
    dueDate: "2026-03-21",
    from: {
      name: "Velorona LLC",
      address: "Kathmandu",
      city: "Kathmandu",
      state: "Bagmati",
      zip: "44600",
      country: "Nepal",
    },
    to: {
      name: "Client Name",
      address: "Lalitpur",
      city: "Lalitpur",
      state: "Bagmati",
      zip: "44700",
      country: "Nepal",
    },
    items,
    totals: {
      subtotal,
      discount,
      tax,
      shipping,
      total,
    },
  };
};

const addInvoiceInfoHeader = (
  doc: PDFKit.PDFDocument,
  invoice: InvoiceDetails,
): void => {
  const rightX = doc.page.width - doc.page.margins.right - 200;

  doc
    .fontSize(InvoiceStyles.header.size)
    .fillColor(InvoiceStyles.header.color)
    .font(InvoiceStyles.header.font)
    .opacity(InvoiceStyles.header.opacity)
    .text("INVOICE", rightX, doc.page.margins.top, {
      align: "right",
    });

  doc
    .fontSize(InvoiceStyles.normal.size)
    .fillColor(InvoiceStyles.normal.color)
    .font(InvoiceStyles.normal.font)
    .opacity(InvoiceStyles.normal.opacity)
    .text(`Invoice #: ${invoice.invoiceNumber}`, rightX, doc.y, {
      align: "right",
    })
    .text(`Date: ${invoice.invoiceDate}`, rightX, doc.y, {
      align: "right",
    })
    .text(`Due Date: ${invoice.dueDate}`, rightX, doc.y, {
      align: "right",
    });
};

const addInvoiceParties = (
  doc: PDFKit.PDFDocument,
  invoice: InvoiceDetails,
): void => {
  const leftX = doc.page.margins.left;
  const rightX = doc.page.width / 2 + 20;
  const startY = doc.y;

  doc
    .fontSize(InvoiceStyles.partySection.size)
    .fillColor(InvoiceStyles.partySection.color)
    .font(InvoiceStyles.partySection.font)
    .opacity(InvoiceStyles.partySection.opacity)
    .text("From:", leftX, startY);

  doc
    .fontSize(InvoiceStyles.normal.size)
    .fillColor(InvoiceStyles.normal.color)
    .text(invoice.from.name, leftX, doc.y)
    .font(InvoiceStyles.normal.font)
    .opacity(InvoiceStyles.normal.opacity)
    .text(invoice.from.address, leftX, doc.y)
    .text(
      `${invoice.from.city}, ${invoice.from.state} ${invoice.from.zip}`,
      leftX,
      doc.y,
    )
    .text(invoice.from.country, leftX, doc.y);

  doc
    .fontSize(InvoiceStyles.partySection.size)
    .fillColor(InvoiceStyles.partySection.color)
    .font(InvoiceStyles.partySection.font)
    .opacity(InvoiceStyles.partySection.opacity)
    .text("Bill To:", rightX, startY);

  doc
    .fontSize(InvoiceStyles.normal.size)
    .fillColor(InvoiceStyles.normal.color)
    .text(invoice.to.name, rightX, doc.y)
    .font(InvoiceStyles.normal.font)
    .opacity(InvoiceStyles.normal.opacity)
    .text(invoice.to.address, rightX, doc.y)
    .text(
      `${invoice.to.city}, ${invoice.to.state} ${invoice.to.zip}`,
      rightX,
      doc.y,
    )
    .text(invoice.to.country, rightX, doc.y);
};

const addInvoiceTableHeader = (doc: PDFKit.PDFDocument): void => {
  const startX = doc.page.margins.left;
  const startY = doc.y;
  const rowHeight = 25;

  const columns = [
    { label: "Description", x: startX, width: 200, align: "center" },
    { label: "Qty", x: startX + 200, width: 100, align: "center" },
    { label: "Unit Price", x: startX + 300, width: 100, align: "center" },
    { label: "Amount", x: startX + 400, width: 100, align: "center" },
  ];

  doc.rect(startX, startY, 500, rowHeight).fillColor("#333333").fill();

  columns.forEach((col) => {
    doc
      .fontSize(InvoiceStyles.tableHeader.size)
      .fillColor(InvoiceStyles.tableHeader.color)
      .font(InvoiceStyles.tableHeader.font)
      .opacity(InvoiceStyles.tableHeader.opacity)
      .text(col.label, col.x, startY + 5, {
        width: col.width,
        align: col.align as PDFKit.Mixins.TextOptions["align"],
      });
  });

  doc.y = startY + rowHeight;
};

const addInvoiceTableRow = (
  doc: PDFKit.PDFDocument,
  item: InvoiceItem,
  isAlternateRow: boolean,
): void => {
  const rowHeight = 20;

  if (shouldAddNewPage(doc, 2 * rowHeight)) {
    doc.addPage();
    addInvoiceTableHeader(doc);
  }

  const startX = doc.page.margins.left;
  const startY = doc.y;

  if (isAlternateRow) {
    doc.rect(startX, startY, 500, rowHeight).fillColor("#F5F5F5").fill();
  }

  const columns = [
    { value: item.description, x: startX, width: 200, align: "left" },
    {
      value: item.quantity.toString(),
      x: startX + 200,
      width: 100,
      align: "center",
    },
    {
      value: `$${item.unitPrice.toFixed(2)}`,
      x: startX + 300,
      width: 100,
      align: "center",
    },
    {
      value: `$${item.amount.toFixed(2)}`,
      x: startX + 400,
      width: 100,
      align: "center",
    },
  ];

  columns.forEach((col) => {
    doc
      .fontSize(InvoiceStyles.tableRow.size)
      .fillColor(InvoiceStyles.tableRow.color)
      .font(InvoiceStyles.tableRow.font)
      .opacity(InvoiceStyles.tableRow.opacity)
      .text(col.value, col.x, startY + 5, {
        width: col.width,
        align: col.align as PDFKit.Mixins.TextOptions["align"],
      });
  });
};

const addTotalsSection = (
  doc: PDFKit.PDFDocument,
  totals: InvoiceTotals,
): void => {
  const { page } = doc;

  const rightX = page.width - page.margins.right - 200;
  const labelX = rightX;
  const valueX = rightX + 100;

  const totalsData = [
    { label: "Subtotal:", value: `$${totals.subtotal.toFixed(2)}` },
    { label: "Discount:", value: `-$${totals.discount.toFixed(2)}` },
    { label: "Tax (13%):", value: `$${totals.tax.toFixed(2)}` },
    { label: "Shipping:", value: `$${totals.shipping.toFixed(2)}` },
  ];

  totalsData.forEach((item) => {
    doc
      .fontSize(InvoiceStyles.totalLabel.size)
      .fillColor(InvoiceStyles.totalLabel.color)
      .font(InvoiceStyles.totalLabel.font)
      .opacity(InvoiceStyles.totalLabel.opacity)
      .text(item.label, labelX, doc.y, {
        align: "left",
      });

    const currentY = doc.y;
    doc.y = currentY - InvoiceStyles.totalLabel.size;

    doc
      .fontSize(InvoiceStyles.totalValue.size)
      .fillColor(InvoiceStyles.totalValue.color)
      .font(InvoiceStyles.totalValue.font)
      .opacity(InvoiceStyles.totalValue.opacity)
      .text(item.value, valueX, doc.y, {
        align: "right",
      });
  });

  doc
    .moveTo(rightX, doc.y)
    .lineTo(rightX + 200, doc.y)
    .strokeColor("#000000")
    .stroke();

  doc
    .fontSize(InvoiceStyles.grandTotal.size)
    .fillColor(InvoiceStyles.grandTotal.color)
    .font(InvoiceStyles.grandTotal.font)
    .opacity(InvoiceStyles.grandTotal.opacity)
    .text("Total:", labelX, doc.y, {
      align: "left",
    });

  const totalY = doc.y;
  doc.y = totalY - InvoiceStyles.grandTotal.size;

  doc
    .fontSize(InvoiceStyles.grandTotal.size)
    .fillColor(InvoiceStyles.grandTotal.color)
    .font(InvoiceStyles.grandTotal.font)
    .opacity(InvoiceStyles.grandTotal.opacity)
    .text(`$${totals.total.toFixed(2)}`, valueX, doc.y, {
      align: "right",
    });
};

const renderInvoicePdf = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const doc = createPDFDocument(DEFAULT_INVOICE_PDF_OPTIONS);
  const invoiceData = generateMockInvoiceData(150);

  await addLogo(doc);
  addInvoiceInfoHeader(doc, invoiceData);
  addInvoiceParties(doc, invoiceData);
  addInvoiceTableHeader(doc);

  invoiceData.items.forEach((item, index) => {
    addInvoiceTableRow(doc, item, index % 2 === 1);
  });

  addTotalsSection(doc, invoiceData.totals);
  addPageNumbers(doc);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${DEFAULT_INVOICE_PDF_OPTIONS.filename}"`,
  );

  doc.pipe(res);
  doc.end();
};

export { renderInvoicePdf };
