'use client';

import { useState, useRef, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AddressSuggestion {
  display_name: string;
  latitude: number;
  longitude: number;
  city: string;
  area: string;
}

interface AddressSearchProps {
  onAddressSelected: (address: AddressSuggestion) => void;
  placeholder?: string;
  initialValue?: string;
  style?: React.CSSProperties;
}

/**
 * AddressSearch — autocomplete address input using Nominatim via backend.
 * 
 * Usage:
 *   <AddressSearch onAddressSelected={(addr) => setDeliveryAddress(addr)} />
 * 
 * Features:
 *   - Debounced search (500ms) to avoid excessive API calls
 *   - Dropdown suggestions
 *   - Returns lat/lng + formatted address on selection
 */
export default function AddressSearch({
  onAddressSelected,
  placeholder = 'Search for your address...',
  initialValue = '',
  style,
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddresses = async (searchQuery: string) => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/geocode/search?q=${encodeURIComponent(searchQuery.trim())}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowDropdown(true);
      }
    } catch {
      // Silent fail — don't show errors for autocomplete
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);

    // Debounce: wait 500ms after user stops typing
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length >= 3) {
      timerRef.current = setTimeout(() => searchAddresses(value), 500);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    setQuery(suggestion.display_name);
    setShowDropdown(false);
    setSuggestions([]);
    onAddressSelected(suggestion);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fafafa',
    transition: 'border-color 0.2s',
    ...style,
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
        placeholder={placeholder}
        style={inputStyle}
      />
      
      {isSearching && (
        <div style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '0.8rem', color: '#9ca3af'
        }}>
          Searching...
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          marginTop: '4px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          zIndex: 1000,
          maxHeight: '250px',
          overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                transition: 'background 0.15s',
                fontSize: '0.875rem',
                color: '#374151',
                lineHeight: '1.4',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ fontWeight: '500' }}>
                📍 {s.area || s.city || s.display_name.split(',')[0]}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                {s.display_name.length > 80 ? s.display_name.slice(0, 80) + '...' : s.display_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
