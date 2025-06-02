"use client";

import { useState } from 'react';
import { testPrismaConnection } from '@/lib/testPrismaConnection';

export default function PrismaTestPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const testResult = await testPrismaConnection();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prisma Connection Test 2</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Prisma Connection'}
        </button>
        
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border`}>
            <h3 className="font-semibold mb-2">
              {result.success ? '✅ Success' : '❌ Error'}
            </h3>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Deploy your app to Vercel</li>
            <li>Navigate to <code>/test/prisma</code> on your deployed app</li>
            <li>Click &ldquo;Test Prisma Connection&rdquo;</li>
            <li>Check the result and Vercel function logs for detailed debugging</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
