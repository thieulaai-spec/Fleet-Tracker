import React from 'react';
import { 
  Activity, 
  Truck, 
  ClipboardList, 
  AlertTriangle, 
  Clock,
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Order, Alert, Trip } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { connectSocket } from '@/lib/socket';

interface RecentActivityCardProps {
  orders: Order[];
  alerts: Alert[];
  trips?: Trip[];
}

interface ActivityItem {
  id: string;
  type: 'order' | 'alert' | 'trip';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  meta?: any;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ 
  orders, 
  alerts, 
  trips = [] 
}) => {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'all' | 'order' | 'trip' | 'alert'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [localActivities, setLocalActivities] = React.useState<ActivityItem[]>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Safe date parser to avoid RangeErrors
  const safeNewDate = (dateStr: any) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Synthesize ALL activities from orders, alerts, and trips
  const allActivities: ActivityItem[] = React.useMemo(() => {
    const items: ActivityItem[] = [];

    // 1. Map recent orders
    orders.forEach(order => {
      const createdDate = safeNewDate(order.createdAt);
      if (createdDate) {
        items.push({
          id: `order-created-${order.id}`,
          type: 'order',
          title: `Order Created`,
          description: `New order ORD-${order.id.substring(0, 4)} to ${order.deliveryAddress}`,
          timestamp: createdDate,
          status: 'pending',
          meta: { orderId: order.id }
        });
      }

      if (order.status && order.status !== 'pending') {
        const updatedDate = safeNewDate(order.updatedAt);
        if (updatedDate) {
          let actionWord = 'updated';
          if (order.status === 'assigned') actionWord = 'assigned to driver';
          else if (order.status === 'picked_up') actionWord = 'picked up cargo';
          else if (order.status === 'delivering') actionWord = 'departed for delivery';
          else if (order.status === 'delivered') actionWord = 'successfully delivered';
          else if (order.status === 'failed') actionWord = 'failed delivery';
          else if (order.status === 'cancelled') actionWord = 'cancelled';

          items.push({
            id: `order-status-${order.id}-${order.status}`,
            type: 'order',
            title: `Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
            description: `Order ORD-${order.id.substring(0, 4)} ${actionWord}`,
            timestamp: updatedDate,
            status: order.status,
            meta: { orderId: order.id }
          });
        }
      }
    });

    // 2. Map recent alerts
    alerts.forEach(alert => {
      // Only include speed violations and abnormal stops
      if (alert.type !== 'speed_violation' && alert.type !== 'abnormal_stop') return;

      const createdDate = safeNewDate(alert.createdAt);
      if (createdDate) {
        items.push({
          id: `alert-${alert.id}`,
          type: 'alert',
          title: alert.type.replace('_', ' ').toUpperCase(),
          description: `${alert.message} (${alert.vehicle?.plateNumber || 'Unknown Vehicle'})`,
          timestamp: createdDate,
          severity: alert.severity,
          meta: { vehicleId: alert.vehicleId, alertId: alert.id }
        });
      }
    });

    // 3. Map recent trips
    trips.forEach(trip => {
      // Trip Dispatched (Pending)
      const createdDate = safeNewDate(trip.createdAt);
      if (createdDate && trip.status === 'pending') {
        items.push({
          id: `trip-created-${trip.id}`,
          type: 'trip',
          title: 'Trip Dispatched',
          description: `New trip assigned to ${trip.driver?.fullName || 'Driver'} on vehicle ${trip.vehicle?.plateNumber || ''}`,
          timestamp: createdDate,
          status: 'pending',
          meta: { tripId: trip.id }
        });
      }

      // Status transitions
      const updatedDate = safeNewDate(trip.updatedAt);
      if (updatedDate) {
        if (trip.status === 'accepted') {
          items.push({
            id: `trip-accepted-${trip.id}`,
            type: 'trip',
            title: 'Trip Accepted',
            description: `Driver ${trip.driver?.fullName || 'Driver'} accepted the assigned trip.`,
            timestamp: updatedDate,
            status: 'accepted',
            meta: { tripId: trip.id }
          });
        } else if (trip.status === 'cancelled') {
          items.push({
            id: `trip-cancelled-${trip.id}`,
            type: 'trip',
            title: 'Trip Cancelled',
            description: `Trip for vehicle ${trip.vehicle?.plateNumber || ''} has been cancelled.`,
            timestamp: updatedDate,
            status: 'cancelled',
            meta: { tripId: trip.id }
          });
        }
      }

      if (trip.startedAt) {
        const startDate = safeNewDate(trip.startedAt);
        if (startDate) {
          items.push({
            id: `trip-start-${trip.id}`,
            type: 'trip',
            title: 'Trip Started',
            description: `Driver ${trip.driver?.fullName || 'Driver'} started trip on vehicle ${trip.vehicle?.plateNumber || ''}`,
            timestamp: startDate,
            status: 'in_progress',
            meta: { tripId: trip.id }
          });
        }
      }
      if (trip.completedAt) {
        const endDate = safeNewDate(trip.completedAt);
        if (endDate) {
          items.push({
            id: `trip-complete-${trip.id}`,
            type: 'trip',
            title: 'Trip Completed',
            description: `Driver ${trip.driver?.fullName || 'Driver'} finished trip. Distance: ${trip.totalDistanceKm || 0} km`,
            timestamp: endDate,
            status: 'completed',
            meta: { tripId: trip.id }
          });
        }
      }
    });

    // Sort chronologically (most recent first)
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [orders, alerts, trips]);

  // Keep local activities in sync with fetched database updates
  React.useEffect(() => {
    setLocalActivities(allActivities);
  }, [allActivities]);

  // Solution 3: Bind global WebSockets to prepend new activities instantly in real-time
  React.useEffect(() => {
    let socket: any;

    const setupSocket = async () => {
      try {
        socket = await connectSocket();

        // 1. Listen for new operational alerts
        socket.on('alert:new', (payload: any) => {
          // Only notify/log speed violations and abnormal stops
          if (payload.type !== 'speed_violation' && payload.type !== 'abnormal_stop') return;

          const newAlertItem: ActivityItem = {
            id: `live-alert-${payload.id || Date.now()}`,
            type: 'alert',
            title: (payload.type || 'ALERT').replace('_', ' ').toUpperCase(),
            description: `${payload.message || ''} (${payload.vehicle?.plateNumber || 'Unknown Vehicle'})`,
            timestamp: new Date(),
            severity: payload.severity,
            meta: { vehicleId: payload.vehicleId, alertId: payload.id }
          };
          setLocalActivities(prev => [newAlertItem, ...prev]);
        });

        // 2. Listen for trip updates
        socket.on('trip:status-changed', (payload: any) => {
          const statusText = payload.status === 'in_progress' ? 'started' : payload.status;
          const newTripItem: ActivityItem = {
            id: `live-trip-${payload.id}-${payload.status}-${Date.now()}`,
            type: 'trip',
            title: `Trip ${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}`,
            description: payload.status === 'accepted'
              ? `Driver ${payload.driverName || 'Driver'} accepted the assigned trip.`
              : payload.status === 'in_progress'
              ? `Driver ${payload.driverName || 'Driver'} started trip on vehicle ${payload.vehicleId || ''}.`
              : payload.status === 'completed'
              ? `Driver ${payload.driverName || 'Driver'} completed trip.`
              : `Trip is now ${statusText} for vehicle ${payload.vehicleId || ''}.`,
            timestamp: new Date(),
            status: payload.status,
            meta: { tripId: payload.id }
          };
          setLocalActivities(prev => [newTripItem, ...prev]);
        });

        // 3. Listen for order milestone verifications
        socket.on('order:verified', (payload: any) => {
          const newOrderItem: ActivityItem = {
            id: `live-order-${payload.orderId}-${Date.now()}`,
            type: 'order',
            title: 'Milestone Verified',
            description: `ORD-${payload.orderId.substring(0, 4)} verification success!`,
            timestamp: new Date(),
            status: 'verified',
            meta: { orderId: payload.orderId }
          };
          setLocalActivities(prev => [newOrderItem, ...prev]);
        });

      } catch (err) {
        console.error('Failed to set up real-time websocket activities:', err);
      }
    };

    setupSocket();

    return () => {
      if (socket) {
        socket.off('alert:new');
        socket.off('trip:status-changed');
        socket.off('order:verified');
      }
    };
  }, []);

  // Limit to Top 7 for the main dashboard display
  const dashboardActivities = React.useMemo(() => {
    return localActivities.slice(0, 7);
  }, [localActivities]);

  // Filter activities dynamically for the Modal View
  const filteredActivities = React.useMemo(() => {
    return localActivities.filter(activity => {
      const matchesTab = activeTab === 'all' || activity.type === activeTab;
      const matchesQuery = !searchQuery || 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [localActivities, activeTab, searchQuery]);

  const getActivityIcon = (type: 'order' | 'alert' | 'trip', status?: string) => {
    switch (type) {
      case 'alert':
        return (
          <div className="w-9 h-9 bg-danger/10 border border-danger/20 rounded-full flex items-center justify-center text-danger shrink-0">
            <AlertTriangle size={15} />
          </div>
        );
      case 'trip':
        return (
          <div className={`w-9 h-9 ${status === 'completed' ? 'bg-success/10 border border-success/20 text-success' : 'bg-primary/10 border border-primary/20 text-primary-light'} rounded-full flex items-center justify-center shrink-0`}>
            <Truck size={15} />
          </div>
        );
      case 'order':
      default:
        return (
          <div className={`w-9 h-9 ${status === 'delivered' ? 'bg-success/10 border border-success/20 text-success' : status === 'pending' ? 'bg-warning/10 border border-warning/20 text-warning' : 'bg-info/10 border border-info/20 text-info'} rounded-full flex items-center justify-center shrink-0`}>
            <ClipboardList size={15} />
          </div>
        );
    }
  };

  const renderActivityItem = (activity: ActivityItem) => (
    <div 
      key={activity.id} 
      className="relative flex gap-md group cursor-pointer"
      onClick={() => {
        setIsModalOpen(false);
        if (activity.type === 'order' && activity.meta?.orderId) {
          router.push(`/dispatch?orderId=${activity.meta.orderId}`);
        } else if (activity.type === 'alert' && activity.meta?.vehicleId) {
          router.push(`/dispatch?vehicleId=${activity.meta.vehicleId}`);
        } else if (activity.type === 'trip' && activity.meta?.tripId) {
          router.push(`/tracking`);
        }
      }}
    >
      <div className="absolute left-[-29px] top-0 transition-transform group-hover:scale-110">
        {getActivityIcon(activity.type, activity.status)}
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-surface-low hover:bg-surface-high p-md rounded-lg border border-border/40 hover:border-primary-light/30 transition-all duration-200">
        <div className="flex justify-between items-start gap-sm mb-1">
          <span className="font-semibold text-sm text-text-high group-hover:text-primary-light transition-colors">
            {activity.title}
          </span>
          <span className="text-[10px] text-text-dim flex items-center gap-1 shrink-0 font-mono">
            <Clock size={10} />
            {mounted ? `${formatDistanceToNow(activity.timestamp)} ago` : '...'}
          </span>
        </div>
        
        <p className="text-xs text-text-dim leading-relaxed truncate group-hover:text-text transition-colors">
          {activity.description}
        </p>

        {activity.status && (
          <div className="mt-2 flex items-center justify-between">
            <Badge 
              variant={
                activity.status === 'delivered' || activity.status === 'completed' ? 'success' :
                activity.status === 'pending' ? 'warning' :
                activity.status === 'failed' || activity.status === 'cancelled' ? 'danger' :
                'primary'
              }
              className="text-[9px] px-1.5 py-0.5"
            >
              {activity.status}
            </Badge>

            <span className="text-[9px] text-primary-light opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity font-medium">
              Detail <ArrowRight size={10} />
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <section className="bg-surface p-lg rounded-xl border border-border shadow-md flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-primary-light" />
            <h3 className="text-lg font-semibold text-text">Recent Activity</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            View All <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>

        <div className="relative flex-1 flex flex-col gap-lg pl-3 border-l border-border/60 ml-4 py-2">
          {dashboardActivities.length === 0 ? (
            <div className="text-text-dim text-center py-8 bg-surface-low rounded-lg border border-dashed border-border ml-[-1rem]">
              No recent activities
            </div>
          ) : (
            dashboardActivities.map((activity) => renderActivityItem(activity))
          )}
        </div>
      </section>

      {/* Solutions 1 & 2: "View All" Modal with full interactive Filtering and Search */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Operations Activities History"
        size="lg"
      >
        <div className="flex flex-col gap-xl">
          {/* Filters & Search Header */}
          <div className="flex flex-col sm:flex-row gap-lg justify-between items-stretch sm:items-center bg-surface-low/80 p-lg rounded-xl border border-border">
            {/* Filter Tabs */}
            <div className="flex gap-sm overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'order', 'trip', 'alert'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-md py-sm rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                    ${activeTab === tab 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-surface hover:bg-surface-high border border-border/50 text-text-dim'
                    }
                  `}
                >
                  {tab === 'all' ? 'All Activities' : `${tab}s`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-[280px]">
              <SearchInput
                placeholder="Search descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Activities List */}
          <div className="max-h-[50vh] overflow-y-auto px-lg">
            <div className="relative flex flex-col gap-lg pl-4 border-l border-border/60 ml-4 py-md">
              {filteredActivities.length === 0 ? (
                <div className="text-text-dim text-center py-12 bg-surface-low rounded-lg border border-dashed border-border ml-[-1rem]">
                  No matching activities found.
                </div>
              ) : (
                filteredActivities.map((activity) => renderActivityItem(activity))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
