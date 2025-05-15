'use client';

export default function Loader({titulo}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 rounded-lg shadow-md dark:shadow-gray-900/50 border border-slate-500">
        <h1 className="text-2xl font-bold mb-4 text-center ">{titulo && titulo != '' ? titulo : 'Cargando Información ...'}</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)] dark:border-[var(--color-primary)]"></div>
        </div>
      </div>
    </div>
  );
}