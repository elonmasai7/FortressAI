'use client';

import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { hkSpikes } from '@/data/mockData';

export function HongKongThreatMap() {
  return (
    <div className="h-72 overflow-hidden rounded-xl border border-fortress-red/50">
      <MapContainer center={[22.3027, 114.1772]} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hkSpikes.map((spike) => (
          <CircleMarker
            key={spike.name}
            center={spike.position}
            radius={Math.max(8, spike.count / 8)}
            pathOptions={{ color: '#E11D48', fillColor: '#E11D48', fillOpacity: 0.35 }}
          >
            <Tooltip>
              {spike.name}: {spike.count} active alerts
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
