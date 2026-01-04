import React, { useEffect, useState } from 'react';

const Particles: React.FC = () => {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number; dur: number; size: number }>>([]);

  useEffect(() => {
    const p = [];
    for (let i = 0; i < 20; i++) {
      p.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        dur: 3 + Math.random() * 5,
        size: 2 + Math.random() * 3,
      });
    }
    setParticles(p);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-yellow-500/20 blur-[1px]"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `float ${p.dur}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-50px) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Particles;