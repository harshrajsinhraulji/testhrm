import type { Metadata } from 'next';
import './globals.css';
import { ClientAuthProvider } from '@/components/providers/client-auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});


export const metadata: Metadata = {
  title: 'Dayflow HR',
  description: 'Streamline Your HR Operations',
  icons: {
    icon: `data:image/svg+xml;utf8,<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="8" fill="rgb(110 58 112)" /><path d="M12 8V24H18C22.4183 24 26 20.4183 26 16C26 11.5817 22.4183 8 18 8H12ZM16 12H18C20.2091 12 22 13.7909 22 16C22 18.2091 20.2091 20 18 20H16V12Z" fill="white" /></svg>`
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className={cn('font-body antialiased', fontInter.variable, fontPoppins.variable)}>
        <ClientAuthProvider>
          {children}
          <Toaster />
        </ClientAuthProvider>
      </body>
    </html>
  );
}
