import { DM_Sans } from 'next/font/google'
import { MaxWidthContainer } from '../components/Containers';
import { Providers } from './providers'
import { TopNavBar } from '../components/Navbar';
import { createGlobalStyle } from 'styled-components';

const dmsans = DM_Sans({ weight: ['400'], subsets: ['latin'] })

export const metadata = {
  title: 'NEXT.js + Wagmi + Rainbowkit',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={dmsans.className} style={{ margin: 0, padding: 0 }}>
        <Providers>
          <TopNavBar />
          <MaxWidthContainer>
            {children}
          </MaxWidthContainer>
        </Providers>
      </body>
    </html >
  )
}
