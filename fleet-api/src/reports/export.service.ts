import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import PDFDocument from 'pdfkit';

@Injectable()
export class ExportService {
  async exportExcel(data: any, reportName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportName);

    if (
      reportName === 'kpi-leaderboard' &&
      Array.isArray(data) &&
      data.length > 0
    ) {
      // Setup column keys and widths manually to prevent auto-writing headers
      const colConfigs = [
        { col: 1, key: 'driverName', width: 25 },
        { col: 2, key: 'phone', width: 18 },
        { col: 3, key: 'totalTrips', width: 18 },
        { col: 4, key: 'completedTrips', width: 22 },
        { col: 5, key: 'completionRate', width: 22 },
        { col: 6, key: 'speedViolations', width: 18 },
        { col: 7, key: 'routeViolations', width: 18 },
        { col: 8, key: 'abnormalStops', width: 20 },
        { col: 9, key: 'incidents', width: 18 },
        { col: 10, key: 'totalViolations', width: 20 },
        { col: 11, key: 'kpiScore', width: 15 },
        { col: 12, key: 'updatedAt', width: 25 },
      ];

      colConfigs.forEach((cfg) => {
        const column = worksheet.getColumn(cfg.col);
        column.key = cfg.key;
        column.width = cfg.width;
      });

      // Title at Row 2
      worksheet.mergeCells('A2:L2');
      const titleCell = worksheet.getCell('A2');
      titleCell.value = 'BẢNG XẾP HẠNG KPI TÀI XẾ';
      titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FF1E3A8A' },
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 30;

      // Subtitle at Row 3
      worksheet.mergeCells('A3:L3');
      const dateCell = worksheet.getCell('A3');
      const nowStr = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      dateCell.value = `Ngày xuất báo cáo: ${nowStr}`;
      dateCell.font = {
        name: 'Arial',
        size: 10,
        italic: true,
        color: { argb: 'FF4B5563' },
      };
      dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(3).height = 20;

      // Headers at Row 5
      const headerRow = worksheet.getRow(5);
      headerRow.values = [
        'Họ tên tài xế',
        'Số điện thoại',
        'Tổng số chuyến',
        'Chuyến hoàn thành',
        'Tỷ lệ hoàn thành',
        'Vi phạm tốc độ',
        'Vi phạm lộ trình',
        'Dừng bất thường',
        'Sự cố / SOS',
        'Tổng số vi phạm',
        'Điểm KPI',
        'Ngày cập nhật',
      ];
      headerRow.height = 26;
      headerRow.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      // Style only columns 1 to 12 for the header row to avoid coloring the entire Excel row
      for (let col = 1; col <= 12; col++) {
        const cell = headerRow.getCell(col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' }, // Navy Blue
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
          left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
          bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
          right: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        };
      }

      // Data starting at Row 6
      data.forEach((item) => {
        const rowData = {
          driverName: item.driver?.user?.fullName || 'N/A',
          phone: item.driver?.user?.phone || 'N/A',
          totalTrips: Number(item.totalTrips) || 0,
          completedTrips: Number(item.completedTrips) || 0,
          completionRate: (Number(item.completionRate) || 0) / 100, // stored as decimal for % formatting
          speedViolations: Number(item.speedViolations) || 0,
          routeViolations: Number(item.routeViolations) || 0,
          abnormalStops: Number(item.abnormalStops) || 0,
          incidents: Number(item.incidents) || 0,
          totalViolations: Number(item.totalViolations) || 0,
          kpiScore: Number(item.kpiScore) || 0,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : 'N/A',
        };

        const row = worksheet.addRow(rowData);
        row.height = 20;

        row.getCell('driverName').alignment = {
          vertical: 'middle',
          horizontal: 'left',
        };
        row.getCell('phone').alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };
        row.getCell('totalTrips').alignment = {
          vertical: 'middle',
          horizontal: 'right',
        };
        row.getCell('totalTrips').numFmt = '#,##0';
        row.getCell('completedTrips').alignment = {
          vertical: 'middle',
          horizontal: 'right',
        };
        row.getCell('completedTrips').numFmt = '#,##0';
        row.getCell('completionRate').alignment = {
          vertical: 'middle',
          horizontal: 'right',
        };
        row.getCell('completionRate').numFmt = '0.00%';
        row.getCell('speedViolations').alignment = {
          vertical: 'middle',
          horizontal: 'right',
        };
        row.getCell('speedViolations').numFmt = '#,##0';
        row.getCell('routeViolations').alignment = {
          vertical: 'middle',
          horizontal: 'right',
        };
        row.getCell('routeViolations').numFmt = '#,##0';
        row.getCell('abnormalStops').alignment = {
          vertical: 'middle',
          horizontal: 'right',
        };
        row.getCell('abnormalStops').numFmt = '#,##0';
        row.getCell('incidents').alignment = {
          vertical: 'middle',
          horizontal: 'right',
        };
        row.getCell('incidents').numFmt = '#,##0';
        row.getCell('totalViolations').alignment = {
          vertical: 'middle',
          horizontal: 'right',
        };
        row.getCell('totalViolations').numFmt = '#,##0';
        row.getCell('kpiScore').alignment = {
          vertical: 'middle',
          horizontal: 'right',
        };
        row.getCell('kpiScore').numFmt = '0.00';

        const uDateCell = row.getCell('updatedAt');
        uDateCell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (uDateCell.value instanceof Date) {
          uDateCell.numFmt = 'yyyy-mm-dd hh:mm:ss';
        }

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
          cell.font = { name: 'Arial', size: 10 };
        });
      });

      // Summary row
      const lastDataRow = 5 + data.length;
      const summaryRowIndex = lastDataRow + 1;
      const summaryRow = worksheet.getRow(summaryRowIndex);
      summaryRow.height = 22;

      worksheet.mergeCells(`A${summaryRowIndex}:B${summaryRowIndex}`);
      const labelCell = worksheet.getCell(`A${summaryRowIndex}`);
      labelCell.value = 'Tổng cộng / Trung bình toàn đội';
      labelCell.font = { name: 'Arial', size: 10, bold: true };
      labelCell.alignment = { vertical: 'middle', horizontal: 'center' };

      const totalTripsCell = worksheet.getCell(`C${summaryRowIndex}`);
      totalTripsCell.value = { formula: `SUM(C6:C${lastDataRow})` };
      totalTripsCell.numFmt = '#,##0';
      totalTripsCell.font = { name: 'Arial', size: 10, bold: true };
      totalTripsCell.alignment = { vertical: 'middle', horizontal: 'right' };

      const completedTripsCell = worksheet.getCell(`D${summaryRowIndex}`);
      completedTripsCell.value = { formula: `SUM(D6:D${lastDataRow})` };
      completedTripsCell.numFmt = '#,##0';
      completedTripsCell.font = { name: 'Arial', size: 10, bold: true };
      completedTripsCell.alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };

      const avgCompletionRateCell = worksheet.getCell(`E${summaryRowIndex}`);
      avgCompletionRateCell.value = {
        formula: `IF(C${summaryRowIndex}>0, D${summaryRowIndex}/C${summaryRowIndex}, 0)`,
      };
      avgCompletionRateCell.numFmt = '0.00%';
      avgCompletionRateCell.font = { name: 'Arial', size: 10, bold: true };
      avgCompletionRateCell.alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };

      const speedViolationsCell = worksheet.getCell(`F${summaryRowIndex}`);
      speedViolationsCell.value = { formula: `SUM(F6:F${lastDataRow})` };
      speedViolationsCell.numFmt = '#,##0';
      speedViolationsCell.font = { name: 'Arial', size: 10, bold: true };
      speedViolationsCell.alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };

      const routeViolationsCell = worksheet.getCell(`G${summaryRowIndex}`);
      routeViolationsCell.value = { formula: `SUM(G6:G${lastDataRow})` };
      routeViolationsCell.numFmt = '#,##0';
      routeViolationsCell.font = { name: 'Arial', size: 10, bold: true };
      routeViolationsCell.alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };

      const abnormalStopsCell = worksheet.getCell(`H${summaryRowIndex}`);
      abnormalStopsCell.value = { formula: `SUM(H6:H${lastDataRow})` };
      abnormalStopsCell.numFmt = '#,##0';
      abnormalStopsCell.font = { name: 'Arial', size: 10, bold: true };
      abnormalStopsCell.alignment = { vertical: 'middle', horizontal: 'right' };

      const incidentsCell = worksheet.getCell(`I${summaryRowIndex}`);
      incidentsCell.value = { formula: `SUM(I6:I${lastDataRow})` };
      incidentsCell.numFmt = '#,##0';
      incidentsCell.font = { name: 'Arial', size: 10, bold: true };
      incidentsCell.alignment = { vertical: 'middle', horizontal: 'right' };

      const totalViolationsCell = worksheet.getCell(`J${summaryRowIndex}`);
      totalViolationsCell.value = { formula: `SUM(J6:J${lastDataRow})` };
      totalViolationsCell.numFmt = '#,##0';
      totalViolationsCell.font = { name: 'Arial', size: 10, bold: true };
      totalViolationsCell.alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };

      const avgKpiScoreCell = worksheet.getCell(`K${summaryRowIndex}`);
      avgKpiScoreCell.value = { formula: `AVERAGE(K6:K${lastDataRow})` };
      avgKpiScoreCell.numFmt = '0.00';
      avgKpiScoreCell.font = { name: 'Arial', size: 10, bold: true };
      avgKpiScoreCell.alignment = { vertical: 'middle', horizontal: 'right' };

      for (let col = 1; col <= 12; col++) {
        const cell = summaryRow.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
          bottom: { style: 'double', color: { argb: 'FF111827' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' },
        };
      }
    } else {
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
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPdf(data: any, reportTitle: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: any[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Document Title/Header
      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#0f172a')
        .text(reportTitle.toUpperCase().replace(/-/g, ' '), {
          align: 'center',
          underline: true,
        });
      doc.moveDown(1.5);

      // Helper function to format keys
      const formatKey = (key: string) =>
        key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

      // Content rendering
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          doc
            .font('Helvetica-Bold')
            .fontSize(12)
            .fillColor('#4f46e5')
            .text(`RECORD ${index + 1}`, { underline: true });
          doc.moveDown(0.2);
          doc.font('Helvetica').fillColor('#334155');

          Object.entries(item).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              doc
                .fontSize(9)
                .text(
                  `  ${formatKey(key)}: ${JSON.stringify(value).substring(0, 120)}...`,
                );
            } else {
              doc.fontSize(9).text(`  ${formatKey(key)}: ${value}`);
            }
          });
          doc.moveDown();
        });
      } else {
        doc.font('Helvetica');
        Object.entries(data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Render sub-list of entries (e.g. trends or rankings)
            doc
              .font('Helvetica-Bold')
              .fontSize(12)
              .fillColor('#4f46e5')
              .text(`${formatKey(key)}:`);
            doc.moveDown(0.3);
            doc.font('Helvetica').fillColor('#334155');

            value.slice(0, 15).forEach((item, idx) => {
              const formattedItem = Object.entries(item)
                .map(
                  ([k, v]) =>
                    `${formatKey(k)}: ${typeof v === 'number' && v > 1000 ? v.toLocaleString() : v}`,
                )
                .join(' | ');
              doc.fontSize(9).text(`  • ${formattedItem}`);
            });
            doc.moveDown();
          } else if (typeof value === 'object' && value !== null) {
            // Render sub-object
            doc
              .font('Helvetica-Bold')
              .fontSize(12)
              .fillColor('#4f46e5')
              .text(`${formatKey(key)}:`);
            doc.moveDown(0.3);
            doc.font('Helvetica').fillColor('#334155');

            Object.entries(value).forEach(([k, v]) => {
              doc.fontSize(9).text(`  ${formatKey(k)}: ${v}`);
            });
            doc.moveDown();
          } else {
            // Render standard metric
            const formattedVal =
              typeof value === 'number' && value > 1000
                ? value.toLocaleString()
                : value;
            doc
              .font('Helvetica')
              .fontSize(11)
              .fillColor('#1e293b')
              .text(`${formatKey(key)}: ${formattedVal}`);
            doc.moveDown(0.4);
          }
        });
      }

      doc.end();
    });
  }
}
