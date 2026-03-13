import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const alt = 'Electrical Engineering Club';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: '#0a0a0a', // deep-space color
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* We can use the text "EEC" as the logo in the OG image to avoid loading external SVGs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ color: '#00d2ff', fontSize: 100, fontWeight: 'bold' }}>⚡</div>
          <div style={{ fontSize: 130, fontWeight: 900, letterSpacing: '-0.05em' }}>EEC</div>
        </div>
        <div style={{ fontSize: 40, marginTop: 40, color: '#a3a3a3' }}>
          Electrical Engineering Club
        </div>
        <div style={{ fontSize: 24, marginTop: 20, color: '#00d2ff' }}>
          KFUPM
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
