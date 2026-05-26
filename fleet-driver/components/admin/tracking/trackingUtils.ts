export const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${hours}:${minutes} - ${day}/${month}`;
  } catch (e) {
    return '00:00';
  }
};

export const normalizePlate = (plate: string) => {
  return plate.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return '#10b981';
    case 'on_trip': return '#6366f1';
    case 'maintenance': return '#f59e0b';
    default: return '#64748b';
  }
};
