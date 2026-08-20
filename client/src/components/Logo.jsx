import { Flame } from 'lucide-react';

export default function Logo({ logo, name }) {
  if (logo) {
    return (
      <span className="brand">
        <img src={logo} alt={name} className="brand-img" />
        <span className="brand-name">{name}</span>
      </span>
    );
  }
  return (
    <span className="brand">
      <span className="brand-mark">
        <Flame size={22} fill="currentColor" />
      </span>
      <span className="brand-name">{name}</span>
    </span>
  );
}
