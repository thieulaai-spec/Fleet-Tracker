import React from 'react';
import { render } from '@testing-library/react-native';
import { FleetMarker } from '../components/map/FleetMarker';
import { TrackedVehicle } from '../store/useFleetTrackingStore';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  class MockMapView extends React.Component {
    render() {
      return <View testID="mock-map-view">{this.props.children}</View>;
    }
  }
  
  class MockMarker extends React.Component {
    render() {
      return <View testID="mock-marker" {...this.props}>{this.props.children}</View>;
    }
  }
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: () => null,
    PROVIDER_GOOGLE: 'google',
  };
});

describe('FleetMarker Component', () => {
  const mockVehicle: TrackedVehicle = {
    id: 'v1',
    vehicleId: 'v1',
    licensePlate: '29A-12345',
    driverName: 'Nguyen Van A',
    latitude: 21.0285,
    longitude: 105.8542,
    speed: 40,
    heading: 90,
    status: 'on_trip',
    lastUpdate: '2026-05-18T00:00:00Z',
  };

  it('renders successfully with correct coordinates and anchor', () => {
    const { getByTestId } = render(
      <FleetMarker vehicle={mockVehicle} />
    );

    const marker = getByTestId('mock-marker');
    expect(marker).toBeTruthy();
    expect(marker.props.coordinate).toEqual({
      latitude: mockVehicle.latitude,
      longitude: mockVehicle.longitude,
    });
    expect(marker.props.anchor).toEqual({ x: 0.5, y: 0.5 });
  });

  it('applies correct background color based on status', () => {
    const { rerender, getByTestId } = render(
      <FleetMarker vehicle={{ ...mockVehicle, status: 'available' }} />
    );
    
    // Available maps to #10b981
    let marker = getByTestId('mock-marker');
    let markerCircle = marker.props.children;
    expect(markerCircle.props.style).toContainEqual(expect.objectContaining({
      backgroundColor: '#10b981'
    }));

    // On trip maps to #6366f1
    rerender(<FleetMarker vehicle={{ ...mockVehicle, status: 'on_trip' }} />);
    marker = getByTestId('mock-marker');
    markerCircle = marker.props.children;
    expect(markerCircle.props.style).toContainEqual(expect.objectContaining({
      backgroundColor: '#6366f1'
    }));

    // Maintenance maps to #f59e0b
    rerender(<FleetMarker vehicle={{ ...mockVehicle, status: 'maintenance' }} />);
    marker = getByTestId('mock-marker');
    markerCircle = marker.props.children;
    expect(markerCircle.props.style).toContainEqual(expect.objectContaining({
      backgroundColor: '#f59e0b'
    }));

    // Offline maps to #64748b
    rerender(<FleetMarker vehicle={{ ...mockVehicle, status: 'offline' }} />);
    marker = getByTestId('mock-marker');
    markerCircle = marker.props.children;
    expect(markerCircle.props.style).toContainEqual(expect.objectContaining({
      backgroundColor: '#64748b'
    }));
  });

  it('rotates correctly based on vehicle heading', () => {
    const { getByTestId } = render(
      <FleetMarker vehicle={{ ...mockVehicle, heading: 180 }} />
    );

    const marker = getByTestId('mock-marker');
    const markerCircle = marker.props.children;
    
    // (heading - 90) = (180 - 90) = 90
    expect(markerCircle.props.style).toContainEqual(expect.objectContaining({
      transform: [{ rotate: '90deg' }]
    }));
  });
});
