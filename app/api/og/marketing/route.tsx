import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bgUrl = searchParams.get('bg');

    if (!bgUrl) {
      return new Response('Missing bg parameter', { status: 400 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            position: 'relative',
            backgroundColor: '#000',
          }}
        >
          {/* Background Image */}
          <img
            src={bgUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Gradient Overlay to make logo pop */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            }}
          />

          {/* NeatX Logo / Badge in bottom right */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 40,
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '12px 24px',
              borderRadius: '20px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: 60,
                fontWeight: 900,
                color: 'white',
                fontFamily: 'sans-serif',
                letterSpacing: '-2px',
              }}
            >
              NeatX
            </span>
            <span
              style={{
                fontSize: 30,
                color: '#d8b4fe', // purple-300
                marginLeft: 12,
                fontWeight: 600,
                fontFamily: 'sans-serif',
              }}
            >
              Agenda
            </span>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
