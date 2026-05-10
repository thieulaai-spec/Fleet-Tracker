'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Users, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { ExportActions } from '../components/ExportActions';
import { api } from '@/lib/api';
import { KpiLeaderboardItem } from '@/types/reports';

export default function KpiLeaderboardPage() {
  const [data, setData] = useState<KpiLeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<KpiLeaderboardItem[]>('/reports/kpi-leaderboard');
      setData(response);
    } catch (error) {
      console.error('Error fetching KPI leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const columns: Column<KpiLeaderboardItem>[] = [
    { 
      header: 'Rank', 
      accessor: (item: KpiLeaderboardItem) => (
        <span className="rank-badge">#{item.rank}</span>
      ),
      width: '80px'
    },
    { 
      header: 'Driver', 
      accessor: (item: KpiLeaderboardItem) => (
        <Link href={`/drivers?id=${item.driverId}`} className="driver-cell link">
          <div className="avatar">{item.driverName.charAt(0)}</div>
          <div className="driver-name-wrapper">
            <span>{item.driverName}</span>
            <ExternalLink size={12} className="link-icon" />
          </div>
        </Link>
      )
    },
    { 
      header: 'KPI Score', 
      accessor: (item: KpiLeaderboardItem) => (
        <div className="score-cell">
          <div className="score-bar-bg">
            <div 
              className="score-bar-fill" 
              style={{ 
                width: `${item.score}%`,
                background: getScoreColor(item.score)
              }} 
            />
          </div>
          <span style={{ color: getScoreColor(item.score), fontWeight: 'bold' }}>{item.score}%</span>
        </div>
      )
    },
    { header: 'Trips', accessor: 'tripsCount' as keyof KpiLeaderboardItem },
    { 
      header: 'Completion', 
      accessor: (item: KpiLeaderboardItem) => `${item.completionRate}%`
    },
    { 
      header: 'Violations', 
      accessor: (item: KpiLeaderboardItem) => (
        <span style={{ color: item.violationsCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {item.violationsCount}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: KpiLeaderboardItem) => (
        <Badge variant={item.score >= 80 ? 'success' : item.score >= 50 ? 'warning' : 'danger'}>
          {item.score >= 80 ? 'Excellent' : item.score >= 50 ? 'Good' : 'Needs Improvement'}
        </Badge>
      )
    }
  ];

  return (
    <div className="kpi-leaderboard">
      <div className="action-bar">
        <div className="info">
          <Trophy size={20} color="var(--color-warning)" />
          <span>Updated every 24 hours</span>
        </div>
        <ExportActions reportName="kpi_leaderboard" />
      </div>

      <DataTable 
        data={data} 
        columns={columns} 
        isLoading={isLoading}
        onRowClick={(item) => console.log('Driver clicked:', item.driverId)}
      />

      <style jsx>{`
        .kpi-leaderboard {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--color-text-dim);
          font-size: 14px;
        }

        .rank-badge {
          font-weight: 700;
          color: var(--color-primary-light);
        }

        .driver-cell {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .driver-cell.link {
          text-decoration: none;
          color: inherit;
          transition: color var(--transition-fast);
        }

        .driver-cell.link:hover {
          color: var(--color-primary-light);
        }

        .driver-name-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .link-icon {
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .driver-cell.link:hover .link-icon {
          opacity: 1;
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: var(--color-surface-high);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          color: var(--color-text);
        }

        .score-cell {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          min-width: 150px;
        }

        .score-bar-bg {
          flex: 1;
          height: 8px;
          background: var(--color-surface-high);
          border-radius: 4px;
          overflow: hidden;
        }

        .score-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1s ease-out;
        }
      `}</style>
    </div>
  );
}
