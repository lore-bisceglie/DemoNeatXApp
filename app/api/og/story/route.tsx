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

          {/* Gradient Overlay to make logo pop (Top and Bottom) */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '25%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
            }}
          />

          {/* Top Badge: Nuovo Post */}
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              padding: '20px 40px',
              borderRadius: '50px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <span
              style={{
                fontSize: 45,
                fontWeight: 800,
                color: '#3b82f6',
                fontFamily: 'sans-serif',
                letterSpacing: '-1px',
              }}
            >
              NUOVO POST SUL PROFILO
            </span>
          </div>

          {/* Glassmorphism Bar at the bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.75)',
              padding: '60px 40px',
              borderTop: '3px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <span
                style={{
                  fontSize: 100,
                  fontWeight: 900,
                  color: 'white',
                  fontFamily: 'sans-serif',
                  letterSpacing: '-4px',
                }}
              >
                Neat
              </span>
              <span
                style={{
                  fontSize: 100,
                  fontWeight: 900,
                  color: '#3b82f6', // The blue X
                  fontFamily: 'sans-serif',
                  letterSpacing: '-4px',
                }}
              >
                X
              </span>
            </div>

            {/* Slogan */}
            <span
              style={{
                fontSize: 42,
                color: 'white',
                fontWeight: 600,
                fontFamily: 'sans-serif',
                marginBottom: 16,
                letterSpacing: '-1px',
                textAlign: 'center',
              }}
            >
              Il gestionale definitivo per il tuo Salone
            </span>

            {/* CTA */}
            <span
              style={{
                fontSize: 34,
                color: '#60a5fa', // Lighter blue for the link
                fontWeight: 500,
                fontFamily: 'sans-serif',
                textAlign: 'center',
              }}
            >
              👇 Prova gratis su neatx.it
            </span>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920, // Instagram Story format (9:16)
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
