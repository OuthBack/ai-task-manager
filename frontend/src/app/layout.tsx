import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Task Manager',
  description:
    'Gerenciador de tarefas inteligente com geração automática por IA',
  icons: {
    icon: '✓',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
