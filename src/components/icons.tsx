import type { SVGProps } from 'react';
import Image from 'next/image';

export function Logo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // TODO: Adicione o seu arquivo de logo (ex: logo.png) à pasta /public na raiz do projeto.
  // O caminho abaixo já está configurado para funcionar assim que o arquivo for adicionado.
  const logoUrl = "/logo.png";

  return (
    <img
      src={logoUrl}
      alt="Bit Segurança Logo"
      {...props}
    />
  );
}
