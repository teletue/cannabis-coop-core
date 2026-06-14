import Link from 'next/link';
import { headers } from 'next/headers';
import { getCountryCompliance } from '@/lib/compliance';

export default async function HomePage() {
  // Read request headers set by our middleware
  const headersList = await headers();
  const countryCode = headersList.get('x-country-code') || 'DK';
  
  // Get compliance rules for the detected country
  const compliance = await getCountryCompliance(countryCode);

  return (
    <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] flex flex-col items-center justify-center font-sans p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10" />

      <main className="max-w-2xl w-full bg-[#0b1322]/80 border border-slate-800/60 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center">
        
        {/* Logo and Tagline */}
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 items-center justify-center font-extrabold text-slate-950 text-2xl shadow-lg shadow-emerald-500/20 mb-8">
          C
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mb-4">
          Digital Cooperative Core
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
          Welcome to the Digital Cooperative protocol. Your account is synced, and compliance limits are dynamically handled server-side.
        </p>

        {/* Vogteren Geofencing status card */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-5 mb-8 text-left">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            Vogteren Compliance Status
          </h2>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Detected Country</p>
              <p className="text-sm font-bold text-white mt-1">
                {compliance?.country_name || 'Denmark'} ({countryCode})
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">THC Limit</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">
                {compliance ? `${compliance.thc_threshold}%` : '0.30%'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Claims Forbidden</p>
              <p className="text-sm font-bold text-white mt-1">
                {compliance?.medical_claims_forbidden ? 'Yes (Strict Sanitizing)' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Requires Club Membership</p>
              <p className="text-sm font-bold text-white mt-1">
                {compliance?.requires_club_membership ? 'Yes (Social Club Required)' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions grid */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/10 text-center"
            data-sensor-id="btn-goto-dashboard"
          >
            Open Member Dashboard
          </Link>
          
          <button
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition border border-slate-700/40 text-center"
            data-sensor-id="btn-simulate-click"
          >
            Trigger Content Data Sensor
          </button>
        </div>

        <p className="text-[10px] text-slate-500 mt-6 leading-normal">
          Clicking the buttons above will log anonymous telemetry inside our logs/analytics.jsonl without cookies.
        </p>

      </main>
    </div>
  );
}
