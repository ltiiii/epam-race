type CarIconProps = {
  color: string;
  width?: number;
};

function CarIcon({ color, width = 56 }: CarIconProps): JSX.Element {
  return (
    <svg width={width} height={24} viewBox="0 0 112 48" role="img" aria-label="car-icon">
      <rect x="18" y="18" width="76" height="18" rx="6" fill={color} />
      <path d="M34 18 L48 8 H76 L88 18 Z" fill={color} />
      <circle cx="34" cy="38" r="6" fill="#2f2f2f" />
      <circle cx="78" cy="38" r="6" fill="#2f2f2f" />
    </svg>
  );
}

export default CarIcon;
