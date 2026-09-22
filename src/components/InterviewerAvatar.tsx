// Professional male interviewer SVG avatar with subtle animation
export default function InterviewerAvatar({ speaking = false, size = 200 }: { speaking?: boolean; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background circle */}
        <circle cx="100" cy="100" r="96" fill="hsl(var(--primary))" opacity="0.08" />
        <circle cx="100" cy="100" r="88" fill="hsl(var(--primary))" opacity="0.05" />
        
        {/* Suit / Body */}
        <path d="M40 180 C40 145, 60 130, 100 125 C140 130, 160 145, 160 180" fill="hsl(var(--primary))" />
        {/* Shirt collar */}
        <path d="M85 130 L100 150 L115 130" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="0.5" />
        {/* Tie */}
        <path d="M97 135 L100 170 L103 135 Z" fill="hsl(var(--accent))" />
        
        {/* Neck */}
        <rect x="90" y="110" width="20" height="20" rx="3" fill="#D4A574" />
        
        {/* Head */}
        <ellipse cx="100" cy="85" rx="32" ry="36" fill="#D4A574" />
        
        {/* Hair */}
        <path d="M68 78 C68 55, 80 45, 100 45 C120 45, 132 55, 132 78 C132 68, 125 58, 100 58 C75 58, 68 68, 68 78 Z" fill="hsl(var(--primary))" />
        {/* Side hair */}
        <path d="M68 78 C66 85, 66 90, 68 95" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M132 78 C134 85, 134 90, 132 95" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeLinecap="round" />
        
        {/* Eyes */}
        <ellipse cx="87" cy="82" rx="5" ry="4" fill="white" />
        <ellipse cx="113" cy="82" rx="5" ry="4" fill="white" />
        <circle cx="88" cy="82" r="2.5" fill="hsl(var(--primary))" />
        <circle cx="114" cy="82" r="2.5" fill="hsl(var(--primary))" />
        <circle cx="88.5" cy="81.5" r="0.8" fill="white" />
        <circle cx="114.5" cy="81.5" r="0.8" fill="white" />
        
        {/* Eyebrows */}
        <path d="M80 76 Q87 73, 94 76" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M106 76 Q113 73, 120 76" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        
        {/* Nose */}
        <path d="M100 86 C98 93, 96 96, 98 97 C100 98, 102 97, 104 96" stroke="#C09060" strokeWidth="1" fill="none" strokeLinecap="round" />
        
        {/* Mouth */}
        {speaking ? (
          <ellipse cx="100" cy="104" rx="7" ry="4" fill="#C07060" className="animate-pulse" />
        ) : (
          <path d="M92 103 Q100 108, 108 103" stroke="#C07060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
        
        {/* Ears */}
        <ellipse cx="67" cy="85" rx="4" ry="7" fill="#D4A574" />
        <ellipse cx="133" cy="85" rx="4" ry="7" fill="#D4A574" />
        
        {/* Glasses */}
        <rect x="78" y="76" rx="3" width="18" height="13" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.2" opacity="0.7" />
        <rect x="104" y="76" rx="3" width="18" height="13" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.2" opacity="0.7" />
        <line x1="96" y1="82" x2="104" y2="82" stroke="hsl(var(--accent))" strokeWidth="1" opacity="0.7" />
        
        {/* Suit lapel lines */}
        <line x1="72" y1="145" x2="90" y2="130" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
        <line x1="128" y1="145" x2="110" y2="130" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
        
        {/* Pocket square */}
        <rect x="120" y="145" width="8" height="5" rx="1" fill="hsl(var(--accent))" opacity="0.6" />
      </svg>
      
      {/* Speaking indicator */}
      {speaking && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-[2px]">
          {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
            <div key={i} className="w-1 rounded-full bg-accent animate-pulse" 
              style={{ height: `${h * 12}px`, animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      )}
    </div>
  );
}
