import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Propa3 — Triple A Realty Projects Ltd';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          background: 'linear-gradient(135deg, #1a2744 0%, #243a5e 55%, #e87722 160%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.85 }}>
          Triple A Realty Projects
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>
          Propa<span style={{ color: '#e87722' }}>3</span>
        </div>
        <div style={{ fontSize: 28, marginTop: 24, maxWidth: 900, opacity: 0.92 }}>
          Property development, sales & artisan marketplace in Abuja
        </div>
      </div>
    ),
    { ...size },
  );
}
