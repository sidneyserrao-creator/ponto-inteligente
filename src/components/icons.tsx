import type { SVGProps } from 'react';
import Image from 'next/image';

export function Logo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // TODO: Substitua a URL abaixo pela URL do seu arquivo de logo PNG.
  // Se você adicionar seu logo à pasta /public, o caminho será "/seu-logo.png".
  const logoUrl = "https://placehold.co/160x28/0f172a/FFF?text=BIT+Seguran%C3%A7a";

  return (
    <img
      src={logoUrl}
      alt="Bit Segurança Logo"
      {...props}
    />
  );
}
