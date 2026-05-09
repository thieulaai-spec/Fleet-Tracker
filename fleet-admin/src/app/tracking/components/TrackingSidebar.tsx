'use client';

import React, { useState } from 'react';
import { Vehicle, GpsUpdate } from '@/types';
import { Search, Filter, Truck, Signal, SignalLow, MapPin, History } from 'lucide-react';
import Link from 'next/link';

interface TrackingSidebarProps {
  vehicles: Vehicle[];
  vehicleLocations: Record<string, GpsUpdate>;
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  isLoading: boolean;
}

export function TrackingSidebar({
  vehicles,
  vehicleLocations,
  selectedVehicleId,
  onSelectVehicle,
  isLoading
}: TrackingSidebarProps) {
  const [search, setSearch] = useState('');

  const filteredVehicles = vehicles.filter(v => 
    v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white mb-4">Fleet Monitor</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search vehicles..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading vehicles...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No vehicles found</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredVehicles.map((v) => {
              const isSelected = selectedVehicleId === v.id;
              const liveData = vehicleLocations[v.id];
              const isOnline = !!liveData;

              return (
                <button
                  key={v.id}
                  onClick={() => onSelectVehicle(v.id)}
                  className={`w-full text-left p-4 hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-bold text-white uppercase">{v.plateNumber}</div>
                      <div className="text-xs text-slate-400 capitalize">{v.type} • {v.status}</div>
                    </div>
                    {isOnline ? (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        <Signal className="w-3 h-3" />
                        Live
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <SignalLow className="w-3 h-3" />
                        Offline
                      </div>
                    )}
                  </div>

                  {liveData ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        <span className="truncate">{liveData.lat.toFixed(4)}, {liveData.lng.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Speed: {Math.round(liveData.speed)} km/h</span>
                        <span>Heading: {Math.round(liveData.heading)}°</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic">
                      Last seen: {v.lastKnownLocation ? `${v.lastKnownLocation.lat.toFixed(2)}, ${v.lastKnownLocation.lng.toFixed(2)}` : 'Unknown'}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <Link 
                      href={`/tracking/replay?vehicleId=${v.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <History className="w-3 h-3" />
                      View History
                    </Link>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
