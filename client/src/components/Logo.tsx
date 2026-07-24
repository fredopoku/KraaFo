interface LogoMarkProps {
  size?: number;
  className?: string;
  dark?: boolean;
}

export function LogoMark({ size = 40, className = '', dark = false }: LogoMarkProps) {
  return (
    <img
      src="/krafo-logo.png"
      alt="KraaFo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size, filter: dark ? 'brightness(0) invert(1)' : 'none' }}
    />
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
  className?: string;
}

export function Logo({ size = 'md', dark = false, className = '' }: LogoProps) {
  const iconSize = size === 'sm' ? 28 : size === 'md' ? 36 : 52;
  const textCls =
    size === 'sm' ? 'text-base' :
    size === 'md' ? 'text-xl' :
                   'text-3xl';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={iconSize} dark={dark} />
      <span className={`font-black tracking-tight leading-none ${textCls} ${dark ? 'text-white' : 'text-slate-900'}`}>
        KraaFo
      </span>
    </div>
  );
}
