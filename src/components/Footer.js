import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-3 border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 text-center">
        <Link href="/pp" className="text-sm text-gray-600 hover:text-gray-900">
          Política de Privacidad
        </Link>
      </div>
    </footer>
  );
}