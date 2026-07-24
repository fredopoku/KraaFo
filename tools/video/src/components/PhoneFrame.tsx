import React from 'react';

interface Props {
  children: React.ReactNode;
  /** Width of the inner screen area in px (composition space) */
  screenWidth?: number;
  /** Height of the inner screen area in px */
  screenHeight?: number;
}

export function PhoneFrame({ children, screenWidth = 390, screenHeight = 844 }: Props) {
  const bezelH = 24;
  const bezelV = 20;
  const frameW = screenWidth + bezelH * 2;
  const frameH = screenHeight + bezelV * 2 + 80; // extra for notch/chin

  return (
    <div style={{
      position: 'relative',
      width: frameW,
      height: frameH,
      borderRadius: 56,
      background: '#1a1a1a',
      boxShadow: '0 0 0 3px #2a2a2a, 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Dynamic island notch */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 126,
        height: 34,
        borderRadius: 17,
        background: '#000',
        zIndex: 10,
      }} />

      {/* Screen content */}
      <div style={{
        position: 'absolute',
        top: bezelV + 40,
        left: bezelH,
        width: screenWidth,
        height: screenHeight,
        borderRadius: '0 0 40px 40px',
        overflow: 'hidden',
        background: '#fff',
      }}>
        {children}
      </div>

      {/* Home indicator */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 120,
        height: 5,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.4)',
      }} />
    </div>
  );
}
