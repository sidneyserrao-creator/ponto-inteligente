import type { SVGProps } from 'react';
import Image from 'next/image';

// A definição de props é ajustada para extrair e ignorar `width` e `height`,
// evitando conflitos com as props do componente `Image` do Next.js.
export function Logo(props: Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
  const logoUrl = "/logo.png";
  
  // Desestrutura para remover width e height das props repassadas
  const { width, height, ...rest } = props;

  return (
    <Image
      src={logoUrl}
      alt="Bit Segurança Logo"
      // Define width e height fixos e numéricos para o Next.js
      width={200}
      height={80}
      // Repassa o restante das props
      {...rest}
    />
  );
}
