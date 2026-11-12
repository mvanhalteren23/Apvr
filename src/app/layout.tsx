import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'APVR | AetherPlanes VR (Pico G2)',
  description:
    'Multiplayer 3D WebXR Trading Card Game for Pico G2 Firefox Reality (3DoF) and Vercel.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#060913',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#060913] text-slate-100">
        {children}
      </body>
    </html>
  );
}
