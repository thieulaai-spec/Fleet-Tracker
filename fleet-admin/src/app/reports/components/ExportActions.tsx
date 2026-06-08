'use client';

import React, { useState } from 'react';
import { Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface ExportActionsProps {
  reportName: string;
  params?: Record<string, string>;
}

export function ExportActions({ reportName, params = {} }: ExportActionsProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExport = async () => {
    setIsExportingExcel(true);

    try {
      const blob = await api.getBlob('/reports/export', {
        params: {
          report_name: reportName,
          type: 'excel',
          ...params,
        },
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${reportName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="flex gap-sm">
      <Button 
        variant="secondary" 
        size="sm" 
        icon={<TableIcon size={16} />}
        onClick={handleExport}
        isLoading={isExportingExcel}
      >
        Export Excel
      </Button>
    </div>
  );
}
