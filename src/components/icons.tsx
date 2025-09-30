import type { SVGProps } from 'react';
import Image from 'next/image';

export function Logo(props: Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
  // O logo.png deve estar na pasta /public na raiz do projeto.
  const logoUrl = "/logo.png";

  // Use o componente Image do Next.js para otimização e para evitar herança de estilos.
  return (
    <Image
      src={logoUrl}
      alt="Bit Segurança Logo"
      width={200} // Defina uma largura base, o className pode ajustar
      height={80} // Defina uma altura base, o className pode ajustar
      {...props}
    />
  );
}
