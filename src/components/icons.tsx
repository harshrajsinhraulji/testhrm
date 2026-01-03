import type { SVGProps } from 'react';

export function DayflowLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 140 28"
      width="140"
      height="28"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <style>{`
        .dayflow-d { fill: hsl(var(--primary)); }
        .dayflow-rest { fill: hsl(var(--foreground)); }
      `}</style>
      <text
        x="0"
        y="24"
        fontFamily="var(--font-poppins), sans-serif"
        fontSize="28"
        fontWeight="700"
      >
        <tspan className="dayflow-d">D</tspan>
        <tspan className="dayflow-rest">ayflow</tspan>
      </text>
    </svg>
  );
}
