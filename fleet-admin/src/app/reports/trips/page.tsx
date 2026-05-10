'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Truck,
  User as UserIcon,
  ChevronRight,
  Info,
  AlertTriangle,
  History
} from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ExportActions } from '../components/ExportActions';
import { MapBox, MapMarker } from '@/components/ui/MapBox';
import { api } from '@/lib/api';
import { TripRecord, TripSummaryData } from '@/types/reports';

export default function TripSummaryPage() {
  const [data, setData] = useState<TripSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<TripSummaryData>('/reports/trip-summary', {
        params: dateRange
      });
      setData(response);
    } catch (error) {
      console.error('Error fetching trip summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const columns: Column<TripRecord>[] = [
    { 
      header: 'Trip ID', 
      accessor: (t: TripRecord) => <span className="font-mono text-xs">{t.id.slice(0, 8)}...</span>,
      width: '100px'
    },
    { header: 'Date', accessor: 'date' },
    { 
      header: 'Vehicle', 
      accessor: (t: TripRecord) => (
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-dim" />
          <span>{t.vehiclePlate}</span>
        </div>
      )
    },
    { 
      header: 'Driver', 
      accessor: (t: TripRecord) => (
        <div className="flex items-center gap-2">
          <UserIcon size={14} className="text-dim" />
          <span>{t.driverName}</span>
        </div>
      )
    },
    { 
      header: 'Distance', 
      accessor: (t: TripRecord) => `${t.distance} km` 
    },
    { 
      header: 'Status', 
      accessor: (t: TripRecord) => (
        <Badge variant={
          t.status === 'completed' ? 'success' : 
          t.status === 'ongoing' ? 'primary' : 
          t.status === 'delayed' ? 'warning' : 'neutral'
        }>
          {t.status}
        </Badge>
      )
    },
    {
      header: '',
      accessor: () => <ChevronRight size={18} className="text-dim" />,
      width: '40px'
    }
  ];

  return (
    <div className="trip-summary">
      <div className="action-bar">
        <DateRangeFilter onRangeChange={setDateRange} />
        <ExportActions reportName="trip_summary" params={dateRange} />
      </div>

      <div className="stats-grid">
        <StatCard 
          label="Total Trips" 
          value={data?.totalTrips || 0} 
          icon={Calendar} 
          color="var(--color-primary)"
        />
        <StatCard 
          label="Active Trips" 
          value={data?.activeTrips || 0} 
          icon={Truck} 
          color="var(--color-success)"
        />
        <StatCard 
          label="Delayed Trips" 
          value={data?.delayedTrips || 0} 
          icon={Clock} 
          color="var(--color-danger)"
        />
      </div>

      <section className="table-section card">
        <header className="section-header">
          <div className="title-group">
            <Info size={18} className="text-primary" />
            <h3>Trip History</h3>
          </div>
          <div className="results-count">Showing {data?.trips?.length || 0} results</div>
        </header>
        
        <DataTable 
          data={data?.trips || []} 
          columns={columns} 
          isLoading={isLoading}
          onRowClick={(trip) => setSelectedTrip(trip as TripRecord)}
        />
      </section>

      <Modal
        isOpen={Boolean(selectedTrip)}
        onClose={() => setSelectedTrip(null)}
        title="Trip Details"
      >
        {selectedTrip && (
          <div className="trip-detail-modal">
            <div className="detail-header">
              <Badge variant={
                selectedTrip.status === 'completed' ? 'success' : 
                selectedTrip.status === 'ongoing' ? 'primary' : 'warning'
              }>
                {selectedTrip.status}
              </Badge>
              <span className="trip-id">ID: {selectedTrip.id}</span>
            </div>

            <div className="detail-main-grid">
              <div className="detail-box">
                <label>Route</label>
                <div className="route-info">
                  <div className="route-point">
                    <MapPin size={16} className="text-primary" />
                    <span>{selectedTrip.startLocation}</span>
                  </div>
                  <div className="route-connector" />
                  <div className="route-point">
                    <MapPin size={16} className="text-danger" />
                    <span>{selectedTrip.endLocation}</span>
                  </div>
                </div>
              </div>

              <div className="detail-stats">
                <div className="stat-item">
                  <Clock size={16} />
                  <div>
                    <label>Duration</label>
                    <span>{selectedTrip.duration}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Truck size={16} />
                  <div>
                    <label>Distance</label>
                    <span>{selectedTrip.distance} km</span>
                  </div>
                </div>
                <div className="stat-item">
                  <UserIcon size={16} />
                  <div>
                    <label>Driver</label>
                    <span>{selectedTrip.driverName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="trip-map-container">
              <MapBox 
                path={selectedTrip.trail || [
                  { lat: 21.0285, lng: 105.8542 }, // Hanoi
                  { lat: 20.8449, lng: 106.6881 }  // Hai Phong
                ]}
                markers={[
                  {
                    id: 'start',
                    lat: (selectedTrip.trail?.[0]?.lat) || 21.0285,
                    lng: (selectedTrip.trail?.[0]?.lng) || 105.8542,
                    label: 'Start: ' + selectedTrip.startLocation,
                    color: 'var(--color-primary)',
                    icon: <MapPin size={12} className="text-white" />
                  },
                  {
                    id: 'end',
                    lat: (selectedTrip.trail?.[selectedTrip.trail.length - 1]?.lat) || 20.8449,
                    lng: (selectedTrip.trail?.[selectedTrip.trail.length - 1]?.lng) || 106.6881,
                    label: 'End: ' + selectedTrip.endLocation,
                    color: 'var(--color-danger)',
                    icon: <MapPin size={12} className="text-white" />
                  }
                ]}
                zoom={9}
                className="rounded-lg border border-slate-700"
              />
            </div>
            <div className="detail-tabs">
              <section className="timeline-section">
                <div className="section-title">
                  <History size={16} />
                  <h4>Trip Timeline</h4>
                </div>
                <div className="timeline-list">
                  {(selectedTrip.timeline || [
                    { status: 'Departed', time: '08:00 AM', location: selectedTrip.startLocation },
                    { status: 'Arrived', time: '10:30 AM', location: selectedTrip.endLocation }
                  ]).map((item, i) => (
                    <div key={i} className="timeline-item">
                      <div className="time">{item.time}</div>
                      <div className="status-dot" />
                      <div className="content">
                        <div className="status">{item.status}</div>
                        <div className="loc">{item.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="violations-section">
                <div className="section-title">
                  <AlertTriangle size={16} className="text-danger" />
                  <h4>Violations</h4>
                </div>
                <div className="violations-list">
                  {selectedTrip.violations?.length ? (
                    selectedTrip.violations.map((v, i) => (
                      <div key={i} className="violation-item">
                        <Badge variant="danger">{v.type}</Badge>
                        <span className="v-time">{v.time}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-violations">No violations recorded</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .trip-summary {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--space-lg);
        }

        .table-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          padding: 0;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-low);
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .section-header h3 {
          font: var(--font-h3);
          color: var(--color-text);
          margin: 0;
        }

        .results-count {
          font: var(--font-label-sm);
          color: var(--color-text-dim);
        }

        .trip-detail-modal {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .trip-id {
          font-family: monospace;
          font-size: 12px;
          color: var(--color-text-dim);
        }

        .detail-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-xl);
        }

        .detail-box label, .stat-item label {
          font: var(--font-label-sm);
          color: var(--color-text-dim);
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }

        .route-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
          padding: var(--space-md);
          background: var(--color-surface-low);
          border-radius: var(--radius-default);
          border-left: 3px solid var(--color-primary);
        }

        .route-point {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-weight: 500;
        }

        .route-connector {
          width: 1px;
          height: 12px;
          background: var(--color-border);
          margin-left: 7px;
        }

        .detail-stats {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-md);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-sm) var(--space-md);
          background: var(--color-surface-low);
          border-radius: var(--radius-default);
        }

        .detail-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-xl);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--color-border);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .section-title h4 {
          font: var(--font-label-sm);
          text-transform: uppercase;
          margin: 0;
          color: var(--color-text-dim);
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          position: relative;
        }

        .timeline-item {
          display: flex;
          gap: var(--space-md);
          font-size: 13px;
        }

        .timeline-item .time {
          width: 70px;
          color: var(--color-text-dim);
          font-variant-numeric: tabular-nums;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-primary);
          margin-top: 6px;
          position: relative;
          z-index: 1;
        }

        .timeline-item:not(:last-child) .status-dot::after {
          content: '';
          position: absolute;
          top: 8px;
          left: 4px;
          width: 1px;
          height: 24px;
          background: var(--color-border);
        }

        .timeline-item .status {
          font-weight: 600;
        }

        .timeline-item .loc {
          color: var(--color-text-dim);
          font-size: 12px;
        }

        .violations-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .violation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm);
          background: var(--color-danger-low);
          border-radius: var(--radius-sm);
        }

        .v-time {
          font-size: 11px;
          color: var(--color-text-dim);
        }

        .no-violations {
          font-size: 13px;
          color: var(--color-success);
          font-style: italic;
        }

        .trip-map-container {
          height: 300px;
          background: var(--color-surface-high);
          border-radius: var(--radius-lg);
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  );
}
