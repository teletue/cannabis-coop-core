import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'weeds_admin_token';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const expected = process.env.ADMIN_SECRET;

  if (!expected) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-lg font-bold text-red-600 mb-2">ADMIN_SECRET not set</h2>
          <p className="text-sm text-stone-500">
            Add <code className="bg-stone-100 px-1 rounded">ADMIN_SECRET=your-secret</code> to your environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (token !== expected) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <form
          action="/api/admin/login"
          method="POST"
          className="bg-white border border-stone-200 rounded-xl p-8 max-w-sm w-full shadow-sm"
        >
          <h2 className="text-lg font-bold text-stone-800 mb-1">Admin Access</h2>
          <p className="text-sm text-stone-500 mb-6">Enter your admin secret to continue.</p>
          <input
            type="password"
            name="secret"
            required
            placeholder="Admin secret"
            className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg mb-4 focus:outline-none focus:border-stone-400"
          />
          <button
            type="submit"
            className="w-full text-sm py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition font-medium"
          >
            Log ind
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
