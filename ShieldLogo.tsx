import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

const ShieldLogo: React.FC<Props> = ({ className = "", size = 100 }) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size * 1.2 }}>
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]"
      >
        {/* Outer Shield Rim */}
        <path
          d="M50 5 L90 20 V50 C90 80 50 115 50 115 C50 115 10 80 10 50 V20 L50 5Z"
          stroke="url(#goldGradient)"
          strokeWidth="4"
          fill="rgba(0,0,0,0.6)"
        />
        {/* Inner Detail */}
        <path
          d="M50 12 L82 24 V50 C82 74 50 105 50 105 C50 105 18 74 18 50 V24 L50 12Z"
          stroke="url(#goldGradient)"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        
        {/* The "P" */}
        <path
          d="M38 35 H55 C65 35 65 55 55 55 H45 V80 H38 V35 Z M45 42 V48 H55 C58 48 58 42 55 42 H45 Z"
          fill="url(#goldGradient)"
        />

        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="100" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" /> {/* yellow-200 */}
            <stop offset="30%" stopColor="#eab308" /> {/* yellow-500 */}
            <stop offset="70%" stopColor="#854d0e" /> {/* yellow-800 */}
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default ShieldLogo;