import type { MetaFunction } from 'react-router';

import { MediaForm } from '../components/media-form';

export const meta: MetaFunction = () => {
  return [
    { title: 'Mediainfo' },
    // ❌ description removed as requested
  ];
};

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-start px-4 pt-4 lg:px-8">
        <MediaForm />
      </main>

      {/* ✅ Footer replaced */}
      <footer className="bg-muted/50 border-t backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <p className="text-muted-foreground text-center text-sm font-medium">
            Naa istam
          </p>
        </div>
      </footer>
    </div>
  );
}
