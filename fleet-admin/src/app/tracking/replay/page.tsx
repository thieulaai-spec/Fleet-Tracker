'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapBox } from '@/components/ui/MapBox';
import { useVehicles } from '@/hooks/use-vehicles';
import { Truck, Play, Pause, RotateCcw, FastForward, Calendar, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

// Transform API response to UI points
const transformHistory = (logs: any[]) => {
  return logs.map(log => ({
    lat: log.location.coordinates[1],
    lng: log.location.coordinates[0],
    speed: parseFloat(log.speedKmh) || 0,
    timestamp: new Date(log.recordedAt).getTime(),
  }));
};

export default function RouteReplayPage() {
  const { vehicles } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Load history when vehicle or date changes
  useEffect(() => {
    async function loadHistory() {
      if (selectedVehicleId) {
        try {
          const from = new Date(date);
          const to = new Date(date);
          to.setHours(23, 59, 59, 999);
          
          const response = await api.get<any[]>(`/tracking/vehicle/${selectedVehicleId}/history`, {
            params: { from: from.toISOString(), to: to.toISOString() }
          });
          
          const data = transformHistory(response);
          setHistory(data);
          setCurrentIndex(0);
          setIsPlaying(false);
        } catch (err) {
          console.error('Failed to load history:', err);
          setHistory([]);
        }
      }
    }
    loadHistory();
  }, [selectedVehicleId, date]);

  // Playback logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentIndex < history.length - 1) {
      interval = setInterval(() => {
        setCurrentIndex(prev => prev + 1);
      }, 1000 / playbackSpeed);
    } else if (currentIndex >= history.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, history.length, playbackSpeed]);

  const currentPoint = history[currentIndex];
  const currentTrail = useMemo(() => history.slice(0, currentIndex + 1), [history, currentIndex]);

  const mapMarkers = useMemo(() => {
    if (!currentPoint) return [];
    return [{
      id: 'replay-vehicle',
      lat: currentPoint.lat,
      lng: currentPoint.lng,
      label: vehicles.find(v => v.id === selectedVehicleId)?.plateNumber || 'Vehicle',
      color: '#3b82f6',
      icon: <Truck className="w-4 h-4 text-white" />,
      metadata: {
        speed: currentPoint.speed,
        plateNumber: vehicles.find(v => v.id === selectedVehicleId)?.plateNumber,
      }
    }];
  }, [currentPoint, vehicles, selectedVehicleId]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 overflow-hidden">
      {/* Header / Controls */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-wrap items-center gap-6 z-20 shadow-lg">
        <Link 
          href="/tracking"
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-white leading-tight">Route Replay</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Historical Playback</p>
        </div>

        <div className="h-10 w-[1px] bg-slate-800 mx-2 hidden md:block" />

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Vehicle</span>
            <select 
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plateNumber}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Date</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg py-1.5 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Playback Controls */}
        {selectedVehicleId && history.length > 0 && (
          <div className="flex items-center gap-4 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setCurrentIndex(0);
                  setIsPlaying(false);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
            </div>

            <div className="flex flex-col gap-1 px-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Speed</span>
                <span className="text-blue-400">{playbackSpeed}x</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      playbackSpeed === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Map */}
      <div className="flex-1 relative">
        <MapBox 
          markers={mapMarkers}
          path={currentTrail}
          center={currentPoint || { lat: 21.0285, lng: 105.8542 }}
          zoom={15}
        />

        {/* Timeline Slider Overlay */}
        {history.length > 0 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-slate-800 p-2 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-slate-200">
                      {new Date(currentPoint?.timestamp || 0).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Point {currentIndex + 1} of {history.length}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max={history.length - 1}
                    value={currentIndex}
                    onChange={(e) => {
                      setCurrentIndex(parseInt(e.target.value));
                      setIsPlaying(false);
                    }}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                {currentPoint && (
                  <div className="text-right min-w-[60px]">
                    <div className="text-lg font-black text-white leading-none">
                      {Math.round(currentPoint.speed)}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">km/h</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
