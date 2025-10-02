/** @type {import('next').NextConfig} */
const nextConfig = {
  // A configuração foi movida para o nível principal, fora do "experimental"
  allowedDevOrigins: ["*.cloudworkstations.dev"],

  // Você pode manter o bloco experimental se tiver outras configs nele
  experimental: {
    // Ex: serverActions: true
  },
};

module.exports = nextConfig;