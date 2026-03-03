import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Sprout, CloudRain, Thermometer } from 'lucide-react';

// Fix for default marker icons in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const districtCoordinates: Record<string, [number, number]> = {
  'Jalgaon': [21.0077, 75.5626],
  'Nagpur': [21.1458, 79.0882],
  'Nashik': [19.9975, 73.7898],
  'Pune': [18.5204, 73.8567],
  'Aurangabad': [19.8762, 75.3433],
  'Solapur': [17.6599, 75.9064],
  'Amravati': [20.9320, 77.7523],
  'Kolhapur': [16.7050, 74.2433]
};

const soilColors: Record<string, string> = {
  'Black': '#3E2723',
  'Loamy': '#8D6E63',
  'Sandy': '#D7CCC8',
  'Red': '#D32F2F',
  'Alluvial': '#795548'
};

const defaultCrops: Record<string, string[]> = {
  'Jalgaon': ['Banana', 'Cotton', 'Jowar'],
  'Nagpur': ['Orange', 'Cotton', 'Soybean'],
  'Nashik': ['Grapes', 'Onion', 'Wheat'],
  'Pune': ['Pomegranate', 'Sugarcane', 'Jowar'],
  'Aurangabad': ['Cotton', 'Maize', 'Bajra'],
  'Solapur': ['Pomegranate', 'Jowar', 'Sugarcane'],
  'Amravati': ['Cotton', 'Tur', 'Soybean'],
  'Kolhapur': ['Sugarcane', 'Rice', 'Groundnut']
};

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 8, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function MapComponent({ 
  selectedRegion, 
  selectedSoil, 
  dynamicCrops 
}: { 
  selectedRegion: string, 
  selectedSoil: string,
  dynamicCrops: any[] 
}) {
  const center = districtCoordinates[selectedRegion] || [19.7515, 75.7139]; // Default to Maharashtra center

  return (
    <div className="h-[400px] w-full rounded-3xl overflow-hidden border-2 border-forest-green/10 shadow-lg relative z-0">
      <MapContainer 
        center={center} 
        zoom={7} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />
        
        {Object.entries(districtCoordinates).map(([district, coords]) => {
          const isSelected = district === selectedRegion;
          const crops = isSelected && dynamicCrops.length > 0 
            ? dynamicCrops.map(c => c.name) 
            : defaultCrops[district];
          
          const soilColor = isSelected ? soilColors[selectedSoil] || '#2D6A4F' : '#2D6A4F';

          return (
            <CircleMarker
              key={district}
              center={coords}
              radius={isSelected ? 16 : 10}
              fillColor={soilColor}
              color={isSelected ? '#1B4332' : '#ffffff'}
              weight={isSelected ? 3 : 2}
              opacity={1}
              fillOpacity={0.8}
            >
              <Popup className="rounded-2xl">
                <div className="p-2 min-w-[200px]">
                  <h3 className="text-lg font-bold text-forest-green border-b border-gray-100 pb-2 mb-2">
                    {district} Zone
                  </h3>
                  
                  {isSelected && (
                    <div className="mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-earthy-brown">Current Soil</span>
                      <p className="text-sm font-bold text-forest-green flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: soilColors[selectedSoil] }}></span>
                        {selectedSoil} Soil
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-earthy-brown flex items-center gap-1">
                      <Sprout size={12} /> Recommended Crops
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {crops.map((crop, i) => (
                        <span key={i} className="px-2 py-1 bg-leaf-green/10 text-leaf-green rounded-md text-xs font-bold">
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
