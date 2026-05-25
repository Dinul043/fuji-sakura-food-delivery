'use client';

import { useState, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface LocationData {
  latitude: number;
  longitude: number;
  full_address: string;
  city: string;
  area: string;
  state?: string;
  postcode?: string;
}

interface LocationDetectorProps {
  onLocationDetected: (location: LocationData) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  style?: React.CSSProperties;
  compact?: boolean; // Smaller button for inline use
}

/**
 * LocationDetector — reusable component for GPS detection + reverse geocoding.
 * 
 * Usage:
 *   <LocationDetector onLocationDetected={(loc) => setLocation(loc)} />
 * 
 * Flow:
 *   1. User clicks button
 *   2. Browser asks for GPS permission
 *   3. Gets coordinates
 *   4. Calls backend /api/geocode/reverse to get address
 *   5. Returns full LocationData to parent
 */
export default function LocationDetector({
  onLocationDetected,
  onError,
  buttonText = '📍 Use My Location',
  style,
  compact = false,
}: LocationDetectorProps) {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);

    try {
      // Step 1: Get GPS coordinates from browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Cache for 1 minute
        });
      });

      const { latitude, longitude } = position.coords;

      // Step 2: Reverse geocode via backend
      const response = await fetch(
        `${API_BASE_URL}/api/geocode/reverse?lat=${latitude}&lng=${longitude}`
      );

      if (response.ok) {
        const data = await response.json();
        onLocationDetected({
          latitude,
          longitude,
          full_address: data.full_address,
          city: data.city,
          area: data.area,
          state: data.state,
          postcode: data.postcode,
        });
      } else {
        // Reverse geocode failed — still return coordinates with generic address
        onLocationDetected({
          latitude,
          longitude,
          full_address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: '',
          area: '',
        });
        onError?.('Could not determine address, but location coordinates saved');
      }
    } catch (err: unknown) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            onError?.('Location permission denied. Please allow location access in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            onError?.('Location unavailable. Please check your device GPS.');
            break;
          case err.TIMEOUT:
            onError?.('Location request timed out. Please try again.');
            break;
        }
      } else {
        onError?.('Failed to detect location. Please try again or enter address manually.');
      }
    } finally {
      setIsDetecting(false);
    }
  }, [onLocationDetected, onError]);

  const defaultStyle: React.CSSProperties = compact
    ? {
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: '2px solid #FF5722',
        background: 'white',
        color: '#FF5722',
        fontWeight: '600',
        fontSize: '0.85rem',
        cursor: isDetecting ? 'not-allowed' : 'pointer',
        opacity: isDetecting ? 0.7 : 1,
        transition: 'all 0.2s',
      }
    : {
        width: '100%',
        padding: '0.875rem 1.5rem',
        borderRadius: '12px',
        border: '2px solid #FF5722',
        background: 'linear-gradient(135deg, #fff5f2, #ffffff)',
        color: '#FF5722',
        fontWeight: '700',
        fontSize: '0.95rem',
        cursor: isDetecting ? 'not-allowed' : 'pointer',
        opacity: isDetecting ? 0.7 : 1,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      };

  return (
    <button
      type="button"
      onClick={detectLocation}
      disabled={isDetecting}
      style={{ ...defaultStyle, ...style }}
    >
      {isDetecting ? (
        <>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
          {' '}Detecting...
        </>
      ) : (
        buttonText
      )}
    </button>
  );
}
