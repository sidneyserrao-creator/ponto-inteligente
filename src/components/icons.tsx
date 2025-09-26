import type { SVGProps } from 'react';
import Image from 'next/image';

export function Logo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // O logo.png deve estar na pasta /public na raiz do projeto.
  const logoUrl = "/logo.png";

  return (
    <img
      src={logoUrl}
      alt="Bit Segurança Logo"
      {...props}
    />
  );
}
