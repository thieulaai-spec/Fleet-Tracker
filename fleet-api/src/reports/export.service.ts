import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import PDFDocument from 'pdfkit';

@Injectable()
export class ExportService {
  async exportExcel(data: any, reportName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportName);

    if (Array.isArray(data) && data.length > 0) {
      // Get headers from first object keys
      const headers = Object.keys(data[0]);
      worksheet.columns = headers.map((h) => ({
        header: h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' '),
        key: h,
        width: 20,
      }));

      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' },
      };

      // Add rows
      data.forEach((item) => {
        worksheet.addRow(item);
      });
    } else if (typeof data === 'object') {
      // Handle single object summary (like fleet performance)
      worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object') {
          worksheet.addRow({ metric: key, value: JSON.stringify(value) });
        } else {
          worksheet.addRow({ metric: key, value });
        }
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPdf(data: any, reportTitle: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: any[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(25).text(reportTitle, { align: 'center' });
      doc.moveDown();

      // Content
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          doc.fontSize(12).text(`Item ${index + 1}:`);
          Object.entries(item).forEach(([key, value]) => {
            doc.fontSize(10).text(`${key}: ${value}`);
          });
          doc.moveDown();
        });
      } else {
        Object.entries(data).forEach(([key, value]) => {
          doc.fontSize(12).text(`${key}: ${value}`);
        });
      }

      doc.end();
    });
  }
}
