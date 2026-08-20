import { useState } from 'react';

const PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#1c1917"/>
  <rect x="120" y="150" width="360" height="260" rx="36" fill="#f97316" opacity="0.25"/>
  <circle cx="300" cy="285" r="90" fill="#292524"/>
  <circle cx="300" cy="270" r="74" fill="#f59e0b"/>
  <text x="300" y="330" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#fff" text-anchor="middle">Kintal Lanches</text>
</svg>`)}`;

export default function SmartImage({ src, alt = '', className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  const actualSrc = failed || !src ? PLACEHOLDER : src;
  return (
    <img
      src={actualSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
