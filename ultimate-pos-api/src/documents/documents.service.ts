import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bwipjs from 'bwip-js';
import { CreateInvoiceLayoutDto } from './dto/create-invoice-layout.dto';
import { CreateInvoiceSchemeDto } from './dto/create-invoice-scheme.dto';

const BARCODE_TYPE_MAP: Record<string, string> = {
  C128: 'code128',
  C39: 'code39',
  EAN8: 'ean8',
  EAN13: 'ean13',
  UPCA: 'upca',
  UPCE: 'upce',
  QR: 'qrcode',
  code128: 'code128',
  code39: 'code39',
  ean8: 'ean8',
  ean13: 'ean13',
  qrcode: 'qrcode',
};

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async generateBarcode(text: string, barcodeType = 'C128'): Promise<Buffer> {
    const bcid = BARCODE_TYPE_MAP[barcodeType] || 'code128';
    return bwipjs.toBuffer({
      bcid,
      text,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });
  }

  async generateProductBarcode(
    productId: number,
    businessId: number,
  ): Promise<{ buffer: Buffer; sku: string; name: string; barcodeType: string }> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
      select: { id: true, name: true, sku: true, barcodeType: true },
    });

    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }

    const buffer = await this.generateBarcode(product.sku, product.barcodeType);
    return { buffer, sku: product.sku, name: product.name, barcodeType: product.barcodeType };
  }

  /**
   * Return all data needed to render a printable invoice for a sale
   */
  async getInvoiceData(saleId: number, businessId: number) {
    const [sale, business] = await Promise.all([
      this.prisma.sale.findFirst({
        where: { id: saleId, businessId, deletedAt: null },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
              city: true,
              state: true,
              country: true,
              taxNumber: true,
            },
          },
          lines: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
          payments: {
            select: { id: true, amount: true, method: true, paymentDate: true, referenceNo: true },
            orderBy: { paymentDate: 'asc' },
          },
        },
      }),
      this.prisma.business.findUnique({
        where: { id: businessId },
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          taxNumber: true,
          logo: true,
        },
      }),
    ]);

    if (!sale) throw new NotFoundException(`Sale #${saleId} not found`);

    const subtotal = sale.lines.reduce((s, l) => s + Number(l.lineTotal), 0);
    const due = Number(sale.totalAmount) - Number(sale.paidAmount);

    return {
      business,
      sale: {
        ...sale,
        subtotal,
        due: Math.max(due, 0),
      },
    };
  }

  /**
   * Generate a self-contained printable receipt HTML string for a sale.
   * The client opens this in a new window and calls window.print().
   */
  async generateReceiptHtml(saleId: number, businessId: number): Promise<string> {
    const [{ business, sale }, layout] = await Promise.all([
      this.getInvoiceData(saleId, businessId),
      this.prisma.invoiceLayout.findFirst({
        where: { businessId, isDefault: true },
      }).then(l => l ?? this.prisma.invoiceLayout.findFirst({ where: { businessId } })),
    ]);

    // Apply layout overrides, falling back to sensible defaults
    const accentColor  = layout?.highlightColor ?? '#1976d2';
    const heading      = layout?.invoiceHeading ?? 'Tax Invoice';
    const invoiceLabel = layout?.invoiceNoLabel ?? 'Invoice #';
    const dateLabel    = layout?.dateLabel ?? 'Date';
    const headerText   = layout?.headerText ?? '';
    const footerText   = layout?.footerText ?? 'Thank you for your business!';
    const showEmail    = layout?.showEmail ?? false;
    const showMobile   = layout?.showMobileNumber ?? true;
    const showPayments = layout?.showPaymentMethods ?? false;
    const subHeadings  = [
      layout?.subHeading1, layout?.subHeading2, layout?.subHeading3,
      layout?.subHeading4, layout?.subHeading5,
    ].filter(Boolean) as string[];

    const formatCurrency = (n: number) =>
      n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDate = (d: Date | string) =>
      new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

    const linesHtml = (sale as any).lines
      .map(
        (l: any) => `
      <tr>
        <td>${l.product?.name ?? 'Item'}</td>
        <td class="center">${Number(l.quantity)}</td>
        <td class="right">$${formatCurrency(Number(l.unitPrice))}</td>
        <td class="right">$${formatCurrency(Number(l.lineTotal))}</td>
      </tr>`,
      )
      .join('');

    const paymentsHtml = (sale as any).payments?.length
      ? (sale as any).payments
          .map(
            (p: any) => `
        <tr>
          <td>${(p.method ?? 'cash').toUpperCase()}</td>
          <td class="right">$${formatCurrency(Number(p.amount))}</td>
        </tr>`,
          )
          .join('')
      : `<tr><td>CASH</td><td class="right">$${formatCurrency(Number((sale as any).paidAmount))}</td></tr>`;

    const subHeadingsHtml = subHeadings.map(s => `<p>${s}</p>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading} — ${(sale as any).invoiceNo ?? saleId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 8px; color: #111; }
    .center { text-align: center; }
    .right { text-align: right; }
    h1 { font-size: 16px; font-weight: bold; color: ${accentColor}; }
    h2.doc-heading { font-size: 13px; color: ${accentColor}; margin: 4px 0 2px; }
    .divider { border-top: 1px dashed #555; margin: 6px 0; }
    .accent-divider { border-top: 2px solid ${accentColor}; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 10px; text-transform: uppercase; border-bottom: 1px solid ${accentColor}; padding: 2px 0; color: ${accentColor}; }
    td { padding: 2px 0; vertical-align: top; }
    .totals td { padding: 1px 0; }
    .totals .label { font-weight: normal; }
    .totals .grand { font-size: 14px; font-weight: bold; }
    .header-text { font-size: 10px; color: #555; margin: 4px 0; }
    footer { font-size: 10px; text-align: center; margin-top: 10px; color: #555; }
    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="center">
    <h1>${(business as any)?.name ?? 'Store'}</h1>
    ${(business as any)?.address ? `<p>${(business as any).address}</p>` : ''}
    ${showMobile && (business as any)?.phone ? `<p>Tel: ${(business as any).phone}</p>` : ''}
    ${showEmail && (business as any)?.email ? `<p>${(business as any).email}</p>` : ''}
    ${headerText ? `<p class="header-text">${headerText}</p>` : ''}
    ${subHeadingsHtml}
  </div>

  <div class="accent-divider"></div>
  <h2 class="doc-heading center">${heading}</h2>
  <div class="divider"></div>

  <table>
    <tr><td>${invoiceLabel}</td><td class="right"><b>${(sale as any).invoiceNo ?? '#' + saleId}</b></td></tr>
    <tr><td>${dateLabel}</td><td class="right">${formatDate((sale as any).transactionDate)}</td></tr>
    ${(sale as any).contact ? `<tr><td>Customer</td><td class="right">${(sale as any).contact.name}</td></tr>` : ''}
    ${(sale as any).contact?.mobile && showMobile ? `<tr><td>Mobile</td><td class="right">${(sale as any).contact.mobile}</td></tr>` : ''}
  </table>

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="center">Qty</th>
        <th class="right">Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${linesHtml}</tbody>
  </table>

  <div class="divider"></div>

  <table class="totals">
    <tr><td class="label">Subtotal</td><td class="right">$${formatCurrency((sale as any).subtotal)}</td></tr>
    ${Number((sale as any).discountAmount) > 0 ? `<tr><td class="label">Discount</td><td class="right">-$${formatCurrency(Number((sale as any).discountAmount))}</td></tr>` : ''}
    ${Number((sale as any).taxAmount) > 0 ? `<tr><td class="label">Tax</td><td class="right">$${formatCurrency(Number((sale as any).taxAmount))}</td></tr>` : ''}
    ${Number((sale as any).shippingAmount) > 0 ? `<tr><td class="label">Shipping</td><td class="right">$${formatCurrency(Number((sale as any).shippingAmount))}</td></tr>` : ''}
    <tr class="grand"><td><b>TOTAL</b></td><td class="right"><b>$${formatCurrency(Number((sale as any).totalAmount))}</b></td></tr>
  </table>

  <div class="divider"></div>

  ${showPayments ? `
  <table>
    <tr><th colspan="2" style="text-align:left">Payments</th></tr>
    ${paymentsHtml}
    ${Number((sale as any).due) > 0 ? `<tr><td style="color:red"><b>Balance Due</b></td><td class="right" style="color:red"><b>$${formatCurrency(Number((sale as any).due))}</b></td></tr>` : ''}
  </table>
  <div class="divider"></div>
  ` : Number((sale as any).due) > 0 ? `
  <p class="right" style="color:red;font-weight:bold;margin:4px 0">Balance Due: $${formatCurrency(Number((sale as any).due))}</p>
  <div class="divider"></div>
  ` : ''}

  <footer>
    <p>${footerText}</p>
    ${(business as any)?.taxNumber ? `<p>Tax No: ${(business as any).taxNumber}</p>` : ''}
  </footer>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
  }

  // ─── Invoice Layouts ────────────────────────────────────────────────────────

  async getInvoiceLayouts(businessId: number) {
    return this.prisma.invoiceLayout.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getInvoiceLayout(id: number, businessId: number) {
    const layout = await this.prisma.invoiceLayout.findFirst({ where: { id, businessId } });
    if (!layout) throw new NotFoundException(`Invoice layout #${id} not found`);
    return layout;
  }

  async createInvoiceLayout(businessId: number, dto: CreateInvoiceLayoutDto) {
    if (dto.isDefault) {
      await this.prisma.invoiceLayout.updateMany({
        where: { businessId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.invoiceLayout.create({ data: { ...dto, businessId } });
  }

  async updateInvoiceLayout(id: number, businessId: number, dto: Partial<CreateInvoiceLayoutDto>) {
    await this.getInvoiceLayout(id, businessId);
    if (dto.isDefault) {
      await this.prisma.invoiceLayout.updateMany({
        where: { businessId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.invoiceLayout.update({ where: { id }, data: dto });
  }

  async removeInvoiceLayout(id: number, businessId: number) {
    await this.getInvoiceLayout(id, businessId);
    return this.prisma.invoiceLayout.delete({ where: { id } });
  }

  // ─── Invoice Schemes ────────────────────────────────────────────────────────

  async getInvoiceSchemes(businessId: number) {
    return this.prisma.invoiceScheme.findMany({
      where: { businessId },
      include: { invoiceLayout: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getInvoiceScheme(id: number, businessId: number) {
    const scheme = await this.prisma.invoiceScheme.findFirst({
      where: { id, businessId },
      include: { invoiceLayout: { select: { id: true, name: true } } },
    });
    if (!scheme) throw new NotFoundException(`Invoice scheme #${id} not found`);
    return scheme;
  }

  async createInvoiceScheme(businessId: number, dto: CreateInvoiceSchemeDto) {
    if (dto.isDefault) {
      await this.prisma.invoiceScheme.updateMany({
        where: { businessId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.invoiceScheme.create({ data: { ...dto, businessId } });
  }

  async updateInvoiceScheme(id: number, businessId: number, dto: Partial<CreateInvoiceSchemeDto>) {
    await this.getInvoiceScheme(id, businessId);
    if (dto.isDefault) {
      await this.prisma.invoiceScheme.updateMany({
        where: { businessId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.invoiceScheme.update({ where: { id }, data: dto });
  }

  async removeInvoiceScheme(id: number, businessId: number) {
    await this.getInvoiceScheme(id, businessId);
    return this.prisma.invoiceScheme.delete({ where: { id } });
  }
}
