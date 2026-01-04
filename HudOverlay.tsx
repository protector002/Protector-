import React from 'react';

const HudOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      
      {/* 1. Face Tracking Brackets (Center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-yellow-500/20 rounded-lg">
          {/* Corners */}
          <div className="absolute top-[-1px] left-[-1px] w-4 h-4 border-t-2 border-l-2 border-yellow-500/60"></div>
          <div className="absolute top-[-1px] right-[-1px] w-4 h-4 border-t-2 border-r-2 border-yellow-500/60"></div>
          <div className="absolute bottom-[-1px] left-[-1px] w-4 h-4 border-b-2 border-l-2 border-yellow-500/60"></div>
          <div className="absolute bottom-[-1px] right-[-1px] w-4 h-4 border-b-2 border-r-2 border-yellow-500/60"></div>
          
          {/* Center Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-yellow-500/40"></div>
              <div className="absolute top-1/2 left-0 -translate-y-1/2 h-[1px] w-full bg-yellow-500/40"></div>
          </div>
          
          {/* Tracking Label */}
          <div className="absolute -top-6 left-0 flex items-center gap-2">
              <span className="text-[10px] font-mono text-yellow-500 bg-black/50 px-1">TARGET: USER</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
      </div>

      {/* 2. Scrolling Data (Left Side) */}
      <div className="absolute top-24 left-4 w-32 hidden md:flex flex-col gap-1 opacity-60">
         <div className="text-[8px] font-mono text-yellow-500/80 leading-tight whitespace-nowrap overflow-hidden">
             {Array.from({length: 12}).map((_, i) => (
                 <div key={i} className="animate-pulse" style={{animationDelay: `${i * 100}ms`}}>
                    {`> SCAN_SECTOR_${10 + i} [OK]`}
                 </div>
             ))}
         </div>
      </div>

      {/* 3. Compass / Orientation (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-8 border-b border-yellow-500/30 flex justify-between items-end px-2 text-[10px] text-yellow-500 font-mono">
          <span>NW</span>
          <span>N</span>
          <span>NE</span>
      </div>
      <div className="absolute top-11 left-1/2 -translate-x-1/2 w-2 h-2 border-l border-t border-yellow-500 transform rotate-45"></div>

      {/* 4. Bottom System Status */}
      <div className="absolute bottom-32 right-4 flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-yellow-500">VISION SYS</span>
              <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-yellow-500"></div>
                  <div className="w-1 h-3 bg-yellow-500"></div>
                  <div className="w-1 h-3 bg-yellow-500"></div>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-yellow-500">AUDIO SYS</span>
              <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-yellow-500"></div>
                  <div className="w-1 h-3 bg-yellow-500"></div>
                  <div className="w-1 h-3 bg-yellow-500/30"></div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default HudOverlay;