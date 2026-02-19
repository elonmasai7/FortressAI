'use client';

import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet';

type PhaseId = 'recon' | 'respond' | 'log';

type AttackRoute = {
  from: [number, number];
  fromLabel: string;
  to: [number, number];
  toLabel: string;
};

type HongKongLiveAttackMapProps = {
  phase: PhaseId;
  second: number;
  routes: AttackRoute[];
};

export function HongKongLiveAttackMap({ phase, second, routes }: HongKongLiveAttackMapProps) {
  const color = phase === 'recon' ? '#ef4444' : phase === 'respond' ? '#facc15' : '#10b981';
  const pulse = 0.3 + ((second % 2) * 0.35);

  return (
    <div className="h-56 overflow-hidden rounded-xl border border-slate-800">
      <MapContainer center={[22.3193, 114.1694]} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {routes.map((route, index) => (
          <div key={`${route.fromLabel}-${route.toLabel}`}>
            <Polyline
              positions={[route.from, route.to]}
              pathOptions={{
                color,
                weight: 4,
                opacity: phase === 'log' ? 0.45 : 0.85,
                dashArray: phase === 'recon' ? '10,10' : undefined,
              }}
            >
              <Tooltip>
                {route.fromLabel} -&gt; {route.toLabel}
              </Tooltip>
            </Polyline>

            <CircleMarker
              center={route.from}
              radius={6 + ((index + second) % 2)}
              pathOptions={{ color: '#fb7185', fillColor: '#fb7185', fillOpacity: pulse }}
            >
              <Tooltip>{route.fromLabel}</Tooltip>
            </CircleMarker>

            <CircleMarker
              center={route.to}
              radius={phase === 'recon' ? 8 : phase === 'respond' ? 7 : 6}
              pathOptions={{ color, fillColor: color, fillOpacity: phase === 'log' ? 0.35 : 0.7 }}
            >
              <Tooltip>{route.toLabel}</Tooltip>
            </CircleMarker>
          </div>
        ))}
      </MapContainer>
    </div>
  );
}
