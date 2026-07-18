import { useRef, useState, useEffect } from 'react';

export function use3DTilt(maxTilt = 9) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const resting = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      resting.current = false;
      setTilt({ x: dy * -maxTilt, y: dx * maxTilt });
    };

    const onLeave = () => {
      resting.current = true;
      setTilt({ x: 0, y: 0 });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [maxTilt]);

  return {
    ref,
    style: {
      transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      transition: resting.current
        ? 'transform 0.7s cubic-bezier(0.16,1,0.3,1)'
        : 'transform 0.08s ease-out',
      transformStyle: 'preserve-3d' as const,
      willChange: 'transform',
    } as React.CSSProperties,
  };
}
