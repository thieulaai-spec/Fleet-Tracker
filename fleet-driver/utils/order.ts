export const getCategoryLabel = (category?: string) => {
  switch (category) {
    case 'bulk': return 'Dạng thô (Bulk)';
    case 'fragile': return 'Dễ vỡ (Fragile)';
    case 'bulky': return 'Hàng cồng kềnh (Bulky)';
    case 'dangerous': return 'Hàng nguy hiểm (Dangerous)';
    case 'other': return 'Khác';
    default: return 'Khác';
  }
};

export const getPriorityLabel = (priority?: string) => {
  switch (priority) {
    case 'high': return 'Cao';
    case 'medium': return 'Trung bình';
    case 'low': return 'Thấp';
    default: return 'Trung bình';
  }
};

export const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#f59e0b';
  }
};

export function formatCountdown(ms: number | null): { text: string; color: string } {
  if (ms === null) return { text: '', color: '#64748b' };
  if (ms <= 0) return { text: 'Quá hạn (Overdue)', color: '#ef4444' };
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const color = ms < 3600000 ? '#ef4444' : ms < 7200000 ? '#f59e0b' : '#10b981';
  if (d > 0) return { text: `${d}d ${h}h ${m}m`, color };
  if (h > 0) return { text: `${h}h ${m}m ${s}s`, color };
  return { text: `${m}m ${s}s`, color };
}
