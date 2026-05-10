'use client';

import React, { useState } from 'react';
import { FileText, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface ExportActionsProps {
  reportName: string;
  params?: Record<string, string>;
}

export function ExportActions({ reportName, params = {} }: ExportActionsProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExport = async (type: 'PDF' | 'EXCEL') => {
    const setLoader = type === 'PDF' ? setIsExportingPdf : setIsExportingExcel;
    setLoader(true);

    try {
      const blob = await api.getBlob('/reports/export', {
        params: {
          report_name: reportName,
          type,
          ...params,
        },
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${reportName}.${type === 'PDF' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="export-actions">
      <Button 
        variant="secondary" 
        size="sm" 
        icon={<FileText size={16} />}
        onClick={() => handleExport('PDF')}
        isLoading={isExportingPdf}
      >
        Export PDF
      </Button>
      <Button 
        variant="secondary" 
        size="sm" 
        icon={<TableIcon size={16} />}
        onClick={() => handleExport('EXCEL')}
        isLoading={isExportingExcel}
      >
        Export Excel
      </Button>

      <style jsx>{`
        .export-actions {
          display: flex;
          gap: var(--space-sm);
        }
      `}</style>
    </div>
  );
}
