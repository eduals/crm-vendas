let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

import JavaScriptObfuscator from 'webpack-obfuscator';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // swcMinify: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['images.unsplash.com', 's3.amazonaws.com', 'cdn.arbo.com.br', 'arbo.s3.amazonaws.com'],
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    serverMinification: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // webpack: (config, { dev, isServer }) => {
  //   // Apenas aplique ofuscação em produção e no cliente
  //   if (!dev && !isServer) {
  //     config.plugins.push(
  //       new JavaScriptObfuscator({
  //         // Configuração mínima e segura
  //         compact: true,
  //         identifierNamesGenerator: 'hexadecimal',
          
  //         // Desabilitar recursos que causam problemas
  //         stringArray: false,
  //         rotateStringArray: false,
  //         controlFlowFlattening: false,
  //         deadCodeInjection: false,
          
  //         // Excluir arquivos críticos da ofuscação
  //         exclude: [
  //           // Arquivos de API e manipulação de dados
  //           'api/**/*.js',
  //           'lib/**/*.js',
            
  //           // Arquivos que contêm lógica de fetch
  //           '**/get*.js',
  //           '**/fetch*.js',
            
  //           // Padrões generalizados para componentes críticos
  //           '**/properties*.js',
  //           '**/imoveis*.js',
            
  //           // Excluir node_modules
  //           'node_modules/**/*.js',
            
  //           '**/_error.js',
  //           '**/_document.js',
  //           '**/_app.js',
  //           '**/error.js',
  //           '**/not-found.js',
  //           // Arquivos essenciais do Next.js
  //           '**/next/**/*.js',
  //         ]
  //       })
  //     );
  //   }
    
  //   return config;
  // },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
