import { useState, useEffect, useRef, useCallback } from 'react';

export const useMapCamera = (
  location: any,
  destination: { latitude: number; longitude: number } | null,
  activeTrip: any
) => {
  const mapRef = useRef<any>(null);
  const fitTimeoutRef = useRef<any>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isNavMode, setIsNavMode] = useState(false);

  // Auto-center/rotate when location updates
  useEffect(() => {
    if (!location || !mapRef.current) return;

    if (isNavMode) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: location.coords.heading || 0,
        pitch: 0,
        zoom: 18,
      }, { duration: 600 });
    } else if (isFollowing) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 600);
    }
  }, [location?.coords.latitude, location?.coords.longitude, location?.coords.heading, isFollowing, isNavMode]);

  // Fit to planned routes when trip changes
  useEffect(() => {
    if (activeTrip?.plannedRoute && activeTrip.plannedRoute.length > 0) {
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
      
      fitTimeoutRef.current = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(activeTrip.plannedRoute as any, {
            edgePadding: { top: 150, right: 60, bottom: 420, left: 60 },
            animated: true,
          });
        }
      }, 1000);
    }

    return () => {
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
    };
  }, [activeTrip?.id, activeTrip?.status]);

  const centerOnLocation = useCallback(() => {
    if (location && mapRef.current) {
      let nextNavMode = false;
      if (isFollowing && !isNavMode) {
        setIsNavMode(true);
        nextNavMode = true;
      } else {
        setIsFollowing(true);
        setIsNavMode(false);
      }
      
      const camera = {
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: nextNavMode ? (location.coords.heading || 0) : 0,
        pitch: 0,
        zoom: nextNavMode ? 18 : 15,
      };
      mapRef.current.animateCamera(camera, { duration: 600 });
    }
  }, [location, isFollowing, isNavMode]);

  const zoomToDestination = useCallback(() => {
    if (destination && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, [destination]);

  return {
    mapRef,
    isFollowing,
    setIsFollowing,
    isNavMode,
    setIsNavMode,
    centerOnLocation,
    zoomToDestination,
  };
};
