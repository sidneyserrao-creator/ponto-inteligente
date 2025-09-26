import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    // TODO: Substitua o código SVG abaixo pelo novo logo da sua empresa.
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 28"
      {...props}
    >
      <text
        x="0"
        y="22"
        fill="currentColor"
        fontFamily="Inter, sans-serif"
        fontSize="24"
        fontWeight="bold"
      >
        Bit
        <tspan fill="hsl(var(--primary))">Segurança</tspan>
      </text>
    </svg>
  );
}
