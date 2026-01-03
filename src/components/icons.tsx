import type { SVGProps } from 'react';

export function DayflowLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.5 7.5a4.5 4.5 0 1 1 0 9H12v-9h5.5Z" />
      <path d="M12 16.5V22a2 2 0 0 0 2-2" />
      <path d="M12 7.5V2a2 2 0 0 1 2 2" />
    </svg>
  );
}
