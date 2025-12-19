import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: AddressDetails) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export interface AddressDetails {
  fullAddress: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  lat: string;
  lon: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter business address",
  label = "Business Address",
  required = true
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search addresses using Nominatim (OpenStreetMap)
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Nominatim API - completely FREE, no API key needed!
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `countrycodes=us&` + // Limit to US addresses
        `limit=5`,
        {
          headers: {
            'Accept': 'application/json',
            // Add a user agent to follow Nominatim usage policy
            'User-Agent': 'BarterExchange/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data: NominatimResult[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      searchAddress(query);
    }, 500); // Wait 500ms after user stops typing
  };

  // Handle address selection
  const handleSelectAddress = (result: NominatimResult) => {
    const addr = result.address;

    // Build street address
    const street = [
      addr.house_number,
      addr.road
    ].filter(Boolean).join(' ');

    // Get city (could be city, town, or village)
    const city = addr.city || addr.town || addr.village || '';

    // Extract state abbreviation from full state name
    const stateAbbr = getStateAbbreviation(addr.state || '');

    const addressDetails: AddressDetails = {
      fullAddress: result.display_name,
      street: street,
      city: city,
      state: stateAbbr,
      zipCode: addr.postcode || '',
      country: addr.country || 'USA',
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };

    setSearchQuery(result.display_name);
    setSuggestions([]);
    setShowSuggestions(false);

    // Set location for map
    setSelectedLocation({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    });

    onChange(addressDetails);
  };

  // Convert state name to abbreviation
  const getStateAbbreviation = (stateName: string): string => {
    const stateMap: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY'
    };

    return stateMap[stateName] || stateName;
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {label && (
        <Label htmlFor="address-autocomplete" className="text-base font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label} {required && '*'}
        </Label>
      )}

      <div className="relative">
        <Input
          id="address-autocomplete"
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="text-base"
          autoComplete="off"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((result) => (
              <div
                key={result.place_id}
                onClick={() => handleSelectAddress(result)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {result.address.house_number} {result.address.road}
                    </div>
                    <div className="text-gray-600 text-xs mt-0.5">
                      {result.address.city || result.address.town}, {result.address.state} {result.address.postcode}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && !isLoading && suggestions.length === 0 && searchQuery.length >= 3 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-sm text-gray-500 text-center">
            No addresses found. Try a different search.
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Start typing your business address (e.g., "123 Main St, San Francisco")
      </p>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>✓ Powered by</span>
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          OpenStreetMap
        </a>
        <span className="text-green-600 font-medium">(100% FREE)</span>
      </div>

      {/* Map Preview - Shows when location is selected */}
      {selectedLocation && (
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-blue-50 px-3 py-2 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Selected Location</span>
            </div>
          </div>
          <MapContainer
            center={[selectedLocation.lat, selectedLocation.lng]}
            zoom={15}
            style={{ height: '250px', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
              <Popup>
                <div className="text-sm">
                  <div className="font-medium">Your Business Location</div>
                  <div className="text-gray-600 text-xs mt-1">{selectedLocation.address}</div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
          <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</span>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
