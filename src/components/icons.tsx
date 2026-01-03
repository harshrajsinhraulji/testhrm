import type { SVGProps } from 'react';

export function DayflowLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
      <path
        d="M12 8V24H18C22.4183 24 26 20.4183 26 16C26 11.5817 22.4183 8 18 8H12ZM16 12H18C20.2091 12 22 13.7909 22 16C22 18.2091 20.2091 20 18 20H16V12Z"
        fill="white"
      />
    </svg>
  );
}
