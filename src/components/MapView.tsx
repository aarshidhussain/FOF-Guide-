import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { TreeSpecies } from '../lib/types';
import { TreeDeciduous, Info } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface MapViewProps {
  species: TreeSpecies[];
  onSelectSpecies: (species: TreeSpecies) => void;
}

// Center of the Forestry region
const FORESTRY_REGION_CENTER: [number, number] = [34.2541, 74.8329];

// Create a custom Lucide icon for markers
const treeIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="bg-forest-900 border-2 border-white p-1 rounded-full shadow-lg">
      <TreeDeciduous size={18} className="text-forest-200" />
    </div>
  ),
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

export default function MapView({ species, onSelectSpecies }: MapViewProps) {
  return (
    <div className="h-[500px] w-full rounded-3xl overflow-hidden border-4 border-forest-100 shadow-xl relative z-10">
      <MapContainer 
        center={FORESTRY_REGION_CENTER} 
        zoom={16} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {species.map((s) => {
          // Use provided coordinates OR random ones around center if missing for demo
          const lat = s.location.lat || FORESTRY_REGION_CENTER[0] + (Math.random() - 0.5) * 0.005;
          const lng = s.location.lng || FORESTRY_REGION_CENTER[1] + (Math.random() - 0.5) * 0.005;

          return (
            <Marker 
              key={s.id} 
              position={[lat, lng]} 
              icon={treeIcon}
            >
              <Popup>
                <div className="p-1 min-w-[120px]">
                  <h4 className="font-bold text-forest-900 m-0">{s.commonName}</h4>
                  <p className="text-[10px] italic text-forest-600 mb-2">{s.scientificName}</p>
                  <button 
                    onClick={() => onSelectSpecies(s)}
                    className="w-full mt-2 bg-forest-900 text-white py-1 px-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Info size={10} /> View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
