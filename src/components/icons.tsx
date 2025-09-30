import type { SVGProps } from 'react';
import Image from 'next/image';

export function Logo(props: Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
  // O logo.png deve estar na pasta /public na raiz do projeto.
  const logoUrl = "/logo.png";

  // Use o componente Image do Next.js para otimização.
  return (
    <Image
      src={logoUrl}
      alt="Bit Segurança Logo"
      width={200} // Largura base para a otimização
      height={80} // Altura base para a otimização
      {...props}
    />
  );
}
