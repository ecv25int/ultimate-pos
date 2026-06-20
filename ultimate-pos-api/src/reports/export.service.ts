import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ExportService {
  /**
   * Compiles Excel sheets using exceljs
   */
  async exportToExcel(title: string, headers: string[], rows: string[][]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    // Style elements
    worksheet.views = [{ showGridLines: true }];

    // Header row
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3F51B5' }, // indigo color matching the design
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 25;

    // Data rows
    rows.forEach((row) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 20;
      dataRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { vertical: 'middle' };
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLen = 10;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const value = cell.value;
        if (value !== null && value !== undefined) {
          let cellStr = '';
          if (value instanceof Date) {
            cellStr = value.toISOString();
          } else if (typeof value === 'object') {
            cellStr = JSON.stringify(value);
          } else {
            cellStr = String(value);
          }
          const len = cellStr.length;
          if (len > maxLen) {
            maxLen = len;
          }
        }
      });
      column.width = maxLen + 3;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  /**
   * Joins parameters as standard RFC-4180 CSV strings and returns a Buffer
   */
  exportToCSV(headers: string[], rows: string[][]): Promise<Buffer> {
    const escapeCsvVal = (val: string): string => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const headerLine = headers.map(escapeCsvVal).join(',');
    const rowLines = rows.map((row) => row.map(escapeCsvVal).join(','));
    const csvContent = [headerLine, ...rowLines].join('\r\n');

    return Promise.resolve(Buffer.from(csvContent, 'utf-8'));
  }

  /**
   * Formats reports using pdfkit
   */
  async exportToPDF(
    title: string,
    subtitle: string,
    headers: string[],
    colWidths: number[],
    rows: string[][],
    summaryLines?: string[],
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      doc.on('data', (chunk) => chunks.push(Buffer.from(chunk as Uint8Array)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 80; // left + right margin

      // Header block
      doc.rect(40, 30, pageWidth, 42).fill('#3F51B5');
      doc
        .fillColor('#ffffff')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(title, 50, 38, { width: pageWidth - 20 });
      doc
        .fillColor('#ccd3ff')
        .fontSize(9)
        .font('Helvetica')
        .text(subtitle, 50, 57, { width: pageWidth - 20 });
      doc.fillColor('#111827');

      // Table configuration
      const tableTop = 90;
      const rowH = 20;

      // Scale columns to match page width
      const totalW = colWidths.reduce((a, b) => a + b, 0);
      const scaledWidths = colWidths.map((w) => (w / totalW) * pageWidth);

      // Render Table headers
      doc.rect(40, tableTop, pageWidth, rowH).fill('#e8eaf6');
      doc.fillColor('#1a237e').fontSize(9).font('Helvetica-Bold');
      let xPos = 40;
      headers.forEach((h, i) => {
        doc.text(h, xPos + 4, tableTop + 6, {
          width: scaledWidths[i] - 8,
          align: i > 0 ? 'right' : 'left',
        });
        xPos += scaledWidths[i];
      });

      // Render Table rows
      doc.font('Helvetica').fontSize(8).fillColor('#111827');
      let y = tableTop + rowH;
      rows.forEach((row, ri) => {
        if (y + rowH > doc.page.height - 60) {
          doc.addPage();
          y = 40;
        }
        if (ri % 2 === 0) {
          doc.rect(40, y, pageWidth, rowH).fill('#fafafa');
        }
        doc.rect(40, y, pageWidth, rowH).stroke('#e5e7eb');
        doc.fillColor('#111827');
        xPos = 40;
        row.forEach((cell, i) => {
          const text = cell !== null && cell !== undefined ? String(cell) : '';
          doc.text(text, xPos + 4, y + 6, {
            width: scaledWidths[i] - 8,
            align: i > 0 ? 'right' : 'left',
          });
          xPos += scaledWidths[i];
        });
        y += rowH;
      });

      // Render Summary lines
      if (summaryLines && summaryLines.length > 0) {
        y += 10;
        if (y + summaryLines.length * 16 > doc.page.height - 40) {
          doc.addPage();
          y = 40;
        }
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a237e');
        summaryLines.forEach((line) => {
          doc.text(line, 40, y, { width: pageWidth });
          y += 16;
        });
      }

      // Render Footer on last page
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#9ca3af')
        .text(`Generated on ${new Date().toLocaleString()}`, 40, doc.page.height - 30, {
          width: pageWidth,
          align: 'center',
        });

      doc.end();
    });
  }
}
