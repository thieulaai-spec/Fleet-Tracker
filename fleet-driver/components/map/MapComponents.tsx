import React from 'react';

let MapView: any, Marker: any, Polyline: any, PROVIDER_GOOGLE: any;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (e) {
  // Fallback for environments where react-native-maps is not available
  MapView = ({ children }: any) => <React.Fragment>{children}</React.Fragment>;
  Marker = ({ children }: any) => <React.Fragment>{children}</React.Fragment>;
  Polyline = () => null;
  PROVIDER_GOOGLE = 'google';
}

export const MapComponent = MapView;
export const MarkerComponent = Marker;
export const PolylineComponent = Polyline;
export { PROVIDER_GOOGLE };
