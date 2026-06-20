import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportToCSV', () => {
    it('should generate a valid CSV string in a Buffer', async () => {
      const headers = ['Name', 'Role', 'Status'];
      const rows = [
        ['Alice', 'Admin', 'Active'],
        ['Bob, Jr.', 'Manager', 'Inactive"Status"'],
      ];

      const buffer = await service.exportToCSV(headers, rows);
      expect(buffer).toBeInstanceOf(Buffer);

      const csvContent = buffer.toString('utf-8');
      const lines = csvContent.split('\r\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Name,Role,Status');
      expect(lines[1]).toBe('Alice,Admin,Active');
      // Escaping check for quotes and commas
      expect(lines[2]).toBe('"Bob, Jr.",Manager,"Inactive""Status"""');
    });
  });

  describe('exportToExcel', () => {
    it('should compile an excel spreadsheet and return a Buffer', async () => {
      const headers = ['Product', 'Stock', 'Price'];
      const rows = [
        ['Widget A', 100, 15.99],
        ['Widget B', 25, 9.99],
      ];

      const buffer = await service.exportToExcel('Inventory Report', headers, rows);
      expect(buffer).toBeInstanceOf(Buffer);
      // Excel files starts with PK ZIP header
      expect(buffer.slice(0, 2).toString()).toBe('PK');
    });
  });

  describe('exportToPDF', () => {
    it('should generate a PDF Buffer containing standard sections', async () => {
      const headers = ['ID', 'Description', 'Total'];
      const colWidths = [10, 50, 20];
      const rows = [
        ['1001', 'Sale transaction A', '$150.00'],
        ['1002', 'Sale transaction B', '$220.00'],
      ];
      const summaryLines = ['Total Count: 2', 'Total Sum: $370.00'];

      const buffer = await service.exportToPDF(
        'Sales Summary',
        'Date: 2026-06-20',
        headers,
        colWidths,
        rows,
        summaryLines,
      );

      expect(buffer).toBeInstanceOf(Buffer);
      // PDF file header is %PDF-
      expect(buffer.slice(0, 5).toString()).toBe('%PDF-');
    });
  });
});
