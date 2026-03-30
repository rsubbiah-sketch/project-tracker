import { g } from '../tokens';

interface LogoProps {
  width?: number;
  height?: number;
  id?: string;
}

export function UpscaleLogo({ width = 155, height = 31, id = 'main' }: LogoProps) {
  const gId = `logoShimmer_${id}`;
  return (
    <svg viewBox="0 0 170 34" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={g.sh} />
          <stop offset="50%" stopColor={g.sl} />
          <stop offset="100%" stopColor={g.sh} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="32" height="32" rx="7" ry="7" stroke={`url(#${gId})`} strokeWidth="2" fill="none" />
      <g transform="translate(6.5, 8) scale(0.64)" stroke={`url(#${gId})`} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M0 0 L0 18 C0 24 4 28 10 28 C16 28 20 24 20 18 L20 0" />
        <path d="M20 0 L20 16" />
        <path d="M20 0 L25 0 C30 0 33 3 33 7.5 C33 12 30 15 25 15 L20 15" />
      </g>
      <text x="42" y="23" fontFamily="'Poppins', sans-serif" fontSize="20" fill={g.sh} letterSpacing="0.3">
        <tspan fontWeight="500">upscale</tspan>
        <tspan fontWeight="300"> ai</tspan>
      </text>
    </svg>
  );
}

interface LogoMarkProps {
  size?: number;
  id?: string;
}

export function UpscaleLogoMark({ size = 28, id = 'mark' }: LogoMarkProps) {
  const gId = `logoShimmer_${id}`;
  return (
    <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={g.sh} />
          <stop offset="50%" stopColor={g.sl} />
          <stop offset="100%" stopColor={g.sh} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="32" height="32" rx="7" ry="7" stroke={`url(#${gId})`} strokeWidth="2" fill="none" />
      <g transform="translate(6.5, 8) scale(0.64)" stroke={`url(#${gId})`} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M0 0 L0 18 C0 24 4 28 10 28 C16 28 20 24 20 18 L20 0" />
        <path d="M20 0 L20 16" />
        <path d="M20 0 L25 0 C30 0 33 3 33 7.5 C33 12 30 15 25 15 L20 15" />
      </g>
    </svg>
  );
}
