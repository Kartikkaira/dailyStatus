import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Day Status Tracker — Full Year Status & Progress Tracker',
  description:
    'Full-stack application to track and display milestones and status updates for every day of the year.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              Day Status Tracker &bull; Full-stack application with Next.js, Express &amp; PostgreSQL
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
