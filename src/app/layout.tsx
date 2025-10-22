import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SettingsProvider } from '@/contexts/SettingsContext'
import DynamicTitle from '@/components/DynamicTitle'
import DynamicTheme from '@/components/DynamicTheme'
import DynamicMeta from '@/components/DynamicMeta'
import AdGlobalScripts from '@/components/AdGlobalScripts'
import CustomScripts from '@/components/CustomScripts'
import DataPreloader from '@/components/DataPreloader'
import { dbService } from '@/lib/database'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await dbService.getSettings()
    const title = settings?.seoTitle || settings?.siteName || ''
    const description = settings?.seoDescription || settings?.siteDescription || ''
    const faviconUrl = settings?.faviconUrl || ''
    
    return {
      title,
      description,
      ...(faviconUrl ? { icons: { icon: faviconUrl } } : {}),
      openGraph: {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
      },
      twitter: {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        card: 'summary_large_image',
      },
    }
  } catch {
    return {
      title: '',
      description: '',
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialSettings = await dbService.getSettings()
  return (
    <html lang="en">
      <head>
        {/* Inject theme variables from settings to avoid first-paint mismatch */}
        {initialSettings && (
          <style dangerouslySetInnerHTML={{ __html: `
            :root {
              ${initialSettings.primaryColor ? `--primary-500: ${initialSettings.primaryColor}; --primary-600: ${initialSettings.primaryColor}; --primary-700: ${initialSettings.primaryColor}; --primary-800: ${initialSettings.primaryColor}; --primary-900: ${initialSettings.primaryColor};` : ''}
              ${initialSettings.backgroundColor ? `--dark-900: ${initialSettings.backgroundColor}; --dark-800: ${initialSettings.backgroundColor}; --dark-700: ${initialSettings.backgroundColor}; --dark-600: ${initialSettings.backgroundColor};` : ''}
              ${initialSettings.textColor ? `--white: ${initialSettings.textColor}; --dark-100: ${initialSettings.textColor}; --dark-200: ${initialSettings.textColor}; --dark-300: ${initialSettings.textColor}; --dark-400: ${initialSettings.textColor};` : ''}
            }
          ` }} />
        )}
        <CustomScripts position="header" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <CustomScripts position="body" />
        <SettingsProvider initialSettings={initialSettings}>
          <DynamicTitle />
          <DynamicTheme />
          <DynamicMeta />
          <AdGlobalScripts />
          <DataPreloader />
          {children}
        </SettingsProvider>
        <CustomScripts position="footer" />
      </body>
    </html>
  )
}
