import { ThemeToggle } from '@/components';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white dark:bg-gray-900 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Chamuco Travel</h1>
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Group travel management platform
      </p>
    </main>
  );
}
