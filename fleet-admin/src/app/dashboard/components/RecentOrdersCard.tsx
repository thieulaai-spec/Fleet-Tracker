import React from 'react';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Order } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface RecentOrdersCardProps {
  orders: Order[];
}

export const RecentOrdersCard: React.FC<RecentOrdersCardProps> = ({ orders }) => {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <section className="bg-surface p-lg rounded-xl border border-border shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-text">Recent Orders</h3>
        <Button 
          variant="ghost" 
          size="sm"
          href="/orders"
        >
          View All <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
      <div className="flex flex-col gap-md">
        {recentOrders.map((order) => (
          <div 
            key={order.id} 
            className="flex items-center gap-lg p-lg bg-surface-low rounded-lg border border-border cursor-pointer transition-all hover:bg-surface-high hover:-translate-y-0.5 hover:border-primary-light"
            onClick={() => router.push(`/dispatch?orderId=${order.id}`)}
          >
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-primary-light">
              <ClipboardList size={18} />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 font-medium truncate">
                <span className="text-primary-light">ORD-{order.id.substring(0, 4)}</span>
                <span className="text-text-dim text-sm">to</span>
                <span className="text-text truncate">{order.deliveryAddress}</span>
              </div>
              <span className="text-xs text-text-dim">
                {mounted ? `${formatDistanceToNow(new Date(order.createdAt))} ago` : '...'}
              </span>
            </div>
            <Badge variant={order.status === 'delivering' ? 'primary' : order.status === 'assigned' ? 'success' : 'warning'}>
              {order.status}
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
};
