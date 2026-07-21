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

          {/* Glassmorphism Bar at the bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.75)',
              padding: '40px 60px',
              borderTop: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 70,
                  fontWeight: 900,
                  color: 'white',
                  fontFamily: 'sans-serif',
                  letterSpacing: '-3px',
                }}
              >
                Neat
              </span>
              <span
                style={{
                  fontSize: 70,
                  fontWeight: 900,
                  color: '#3b82f6', // The blue X
                  fontFamily: 'sans-serif',
                  letterSpacing: '-3px',
                }}
              >
                X
              </span>
            </div>

            {/* Slogan and Link */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span
                style={{
                  fontSize: 32,
                  color: 'white',
                  fontWeight: 600,
                  fontFamily: 'sans-serif',
                  marginBottom: 10,
                  letterSpacing: '-1px',
                }}
              >
                Il gestionale per il tuo Salone
              </span>
              <span
                style={{
                  fontSize: 26,
                  color: '#60a5fa', // Lighter blue for the link
                  fontWeight: 500,
                  fontFamily: 'sans-serif',
                }}
              >
                Prova gratis su neatx.it
              </span>
            </div>
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
