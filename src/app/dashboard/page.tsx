import { query } from '@/lib/db';
import Link from 'next/link';

// Server-side helper to apply the same anti-whale formula in TypeScript for visual validation.
function calculateProgressiveShares(points: number): number {
  if (points <= 1000) return points;
  if (points <= 5000) return 1000 + (points - 1000) * 0.50;
  const scaled = 1000 + 2000 + (points - 5000) * 0.10;
  return Math.min(scaled, 10000);
}

// Fetch dashboard data server-side
async function getDashboardData(memberEmail: string) {
  try {
    // 1. Fetch member profile
    const memberRes = await query(
      'SELECT id, email, partner_level, is_democratically_verified, has_employee_ownership FROM members WHERE email = $1',
      [memberEmail]
    );

    if (memberRes.rows.length === 0) {
      return null;
    }

    const member = memberRes.rows[0];

    // 2. Fetch current year shares
    const currentYear = new Date().getFullYear();
    const shareRes = await query(
      'SELECT points_raw, points_scaled FROM member_shares WHERE member_id = $1 AND year = $2',
      [member.id, currentYear]
    );

    const shares = shareRes.rows[0] || { points_raw: '0.00', points_scaled: '0.00' };

    // 3. Fetch democratic certificate
    const certRes = await query(
      'SELECT status, employee_ownership_percentage, document_url, verified_at FROM democratic_certificates WHERE member_id = $1 ORDER BY created_at DESC LIMIT 1',
      [member.id]
    );
    const certificate = certRes.rows[0] || null;

    // 4. Fetch recent transactions
    const txRes = await query(
      'SELECT shopify_order_id, amount, points_generated, status, created_at FROM transactions WHERE member_id = $1 ORDER BY created_at DESC LIMIT 5',
      [member.id]
    );

    // 5. Fetch payment gateways health
    const gatewayRes = await query(
      'SELECT name, status, priority FROM payment_gateways ORDER BY priority ASC'
    );

    return {
      member,
      shares: {
        raw: parseFloat(shares.points_raw),
        scaled: parseFloat(shares.points_scaled),
      },
      certificate,
      transactions: txRes.rows,
      gateways: gatewayRes.rows,
      isMock: false,
    };
  } catch (error) {
    console.warn('Database not ready or seeded. Falling back to sandbox mock data.', error);
    // Sandbox default data for elegant local visualization
    return {
      member: {
        id: 'mock-uuid-1234',
        email: memberEmail,
        partner_level: 'premium_partner',
        is_democratically_verified: true,
        has_employee_ownership: true,
      },
      shares: {
        raw: 7500.00,
        scaled: calculateProgressiveShares(7500.00), // Should result in 3250.00
      },
      certificate: {
        status: 'approved',
        employee_ownership_percentage: 65.50,
        document_url: 'https://ipfs.io/ipfs/QmXoyp1SARnYYy...',
        verified_at: new Date().toISOString(),
      },
      transactions: [
        { shopify_order_id: 'SH-4589', amount: '1200.00', points_generated: '1200.00', status: 'completed', created_at: new Date(Date.now() - 1000 * 60 * 120) },
        { shopify_order_id: 'SH-4512', amount: '3500.00', points_generated: '3500.00', status: 'completed', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        { shopify_order_id: 'SH-4491', amount: '2800.00', points_generated: '2800.00', status: 'completed', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48) },
        { shopify_order_id: 'SH-4480', amount: '500.00', points_generated: '500.00', status: 'refunded', created_at: new Date(Date.now() - 1000 * 60 * 60 * 96) },
      ],
      gateways: [
        { name: 'Stripe Router', status: 'active', priority: 1 },
        { name: 'Mollie Backup', status: 'active', priority: 2 },
        { name: 'Klarna HighRisk', status: 'frozen', priority: 3 },
      ],
      isMock: true,
    };
  }
}

export default async function DashboardPage() {
  const defaultUserEmail = 'kontakt@demokratisk-andel.dk';
  const data = await getDashboardData(defaultUserEmail);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-red-900/40 p-8 rounded-2xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Member Not Found</h2>
          <p className="text-slate-400">Could not resolve member details. Please seed database or check email configuration.</p>
        </div>
      </div>
    );
  }

  const { member, shares, certificate, transactions, gateways, isMock } = data;

  return (
    <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-900/80 bg-[#070b13]/85 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              C
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Digital Cooperative Portal
              </h1>
              <p className="text-xs text-slate-500">Andels-ledger &amp; Compliance Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {isMock && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
                Sandbox Mode
              </span>
            )}
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-300">{member.email}</p>
              <p className="text-xs text-slate-500">ID: {member.id.substring(0, 8)}...</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Profile & Verification */}
        <div className="flex flex-col gap-6">
          
          {/* Member Card */}
          <div className="bg-[#0b1322] border border-slate-800/60 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8" />
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Medlemskategori</h3>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-extrabold tracking-tight capitalize text-white">
                {member.partner_level.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                member.partner_level === 'premium_partner' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : member.partner_level === 'andelshaver' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {member.partner_level === 'premium_partner' ? 'Tier 3' : member.partner_level === 'andelshaver' ? 'Tier 2' : 'Tier 1'}
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Dette partnerniveau definerer din indflydelse, udbyttedeling og prioritering i vores kooperative forsyningskæde.
            </p>

            <div className="border-t border-slate-900/60 pt-4 flex justify-between items-center text-xs">
              <span className="text-slate-500">Demokratisk stemmeret:</span>
              <span className={`font-semibold ${member.partner_level !== 'medlem' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {member.partner_level !== 'medlem' ? 'Ja (1 andelhaver = 1 stemme)' : 'Nej (Kræver Andelshaver)'}
              </span>
            </div>
          </div>

          {/* Democratic Certificate (Governance-Vogteren) */}
          <div className="bg-[#0b1322] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Demokratisk Certificering</h3>
            
            {certificate ? (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                  <span className="text-xs text-slate-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                    certificate.status === 'approved' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : certificate.status === 'pending' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {certificate.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Medarbejderejerskab:</span>
                  <span className="text-emerald-400 font-semibold">{certificate.employee_ownership_percentage}%</span>
                </div>

                <div className="text-xs">
                  <p className="text-slate-400 mb-2 font-medium">Revisionsdokument (IPFS):</p>
                  <a 
                    href={certificate.document_url}
                    target="_blank" 
                    rel="noreferrer"
                    className="block truncate text-teal-400 hover:text-teal-300 hover:underline bg-[#070b13] p-2 rounded border border-slate-800"
                    data-sensor-id="cert-doc-click"
                  >
                    {certificate.document_url}
                  </a>
                </div>

                {certificate.verified_at && (
                  <p className="text-[10px] text-slate-500">
                    Godkendt den {new Date(certificate.verified_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
                <p className="text-slate-400 text-xs mb-3">Intet demokratisk certifikat uploadet.</p>
                <Link
                  href="/governance/apply"
                  className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Ansøg om Premium Certificering
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Anti-Whale Ledger (Væveren) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Shares / Points Card */}
          <div className="bg-[#0b1322] border border-slate-800/60 rounded-2xl p-6 relative overflow-hidden shadow-xl flex-1 flex flex-col">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Kooperativ Andelsværdi</h3>
                <h2 className="text-3xl font-extrabold tracking-tight text-white">Andelspoint &amp; Stemmevægte</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Regnskabsår: {new Date().getFullYear()}</p>
                <p className="text-[10px] text-emerald-400/90 font-medium">Beregnet via Anti-Hval Algoritme</p>
              </div>
            </div>

            {/* Points Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              
              <div className="bg-[#070b13] p-5 rounded-2xl border border-slate-850 relative overflow-hidden">
                <span className="text-xs text-slate-500 uppercase font-medium">Ubehandlede Købspoint (Raw)</span>
                <p className="text-4xl font-extrabold text-slate-400 mt-2">{shares.raw.toLocaleString()} pt</p>
                <p className="text-[10px] text-slate-500 mt-2">Dette er den samlede omsætning overført direkte fra Shopify-API checkout.</p>
              </div>

              <div className="bg-[#070b13]/80 p-5 rounded-2xl border border-emerald-950/20 relative overflow-hidden ring-1 ring-emerald-500/10">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg" />
                <span className="text-xs text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
                  Reelle Andelshaver-Stemmer (Scaled)
                </span>
                <p className="text-4xl font-extrabold text-emerald-400 mt-2">{shares.scaled.toLocaleString()} stemmer</p>
                <p className="text-[10px] text-emerald-500/70 mt-2">Points er dæmpet via den progressive andelskurve for at forhindre kapitalkontrol.</p>
              </div>
            </div>

            {/* Progressive Cap Visual Graph */}
            <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl mb-6 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Andels-Dæmpningskurve</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  For at holde kooperativet demokratisk, tæller dine point 1:1 op til 1.000. Mellem 1.000-5.000 tæller de 50%, og alt derover tæller 10%, med et hårdt loft ved 10.000.
                </p>
              </div>

              {/* Progress visual bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span>Loftsfordeling (Max 10.000 stemmer)</span>
                  <span>{((shares.scaled / 10000) * 100).toFixed(1)}% udfyldt</span>
                </div>
                <div className="h-3 bg-[#070b13] rounded-full overflow-hidden border border-slate-900 p-0.5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20"
                    style={{ width: `${(shares.scaled / 10000) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                  <span>0 pt (Medlem)</span>
                  <span>1.000 pt (1.000 stemmer)</span>
                  <span>5.000 pt (3.000 stemmer)</span>
                  <span>Capped (10.000 stemmer)</span>
                </div>
              </div>
            </div>

            {/* Payment Router Resilience Status (Drivkraften) */}
            <div className="border-t border-slate-900/60 pt-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Betalings-Resiliens (Router Status)</h4>
              <div className="flex flex-wrap gap-3">
                {gateways.map((g) => (
                  <div 
                    key={g.name} 
                    className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border bg-slate-950/60 ${
                      g.status === 'active' 
                        ? 'border-emerald-500/20 text-emerald-400' 
                        : 'border-red-500/20 text-red-500 opacity-60 line-through'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${g.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                    <span className="font-semibold text-slate-300">{g.name}</span>
                    <span className="text-[10px] text-slate-500">(Pri: {g.priority})</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Transactions Ledger */}
          <div className="bg-[#0b1322] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Nylige Webhook-Poster (Shopify)</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900/60 text-slate-500">
                    <th className="pb-3 font-semibold">Ordre-Ref</th>
                    <th className="pb-3 font-semibold">Beløb</th>
                    <th className="pb-3 font-semibold">Tildelte Point</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Registreret</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {transactions.map((tx) => (
                    <tr key={tx.shopify_order_id} className="text-slate-300 hover:bg-slate-900/20">
                      <td className="py-3 font-mono font-medium">{tx.shopify_order_id}</td>
                      <td className="py-3 font-medium">{parseFloat(tx.amount).toFixed(2)} DKK</td>
                      <td className="py-3 text-emerald-400 font-bold">+{parseFloat(tx.points_generated).toFixed(0)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                          tx.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                            : tx.status === 'refunded'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                              : 'bg-red-500/10 text-red-400 border border-red-500/10'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950/20 py-6 text-center text-xs text-slate-600">
        <p>© {new Date().getFullYear()} Digital Cooperative Core. Alle rettigheder forbeholdes. Ingen cookies anvendes.</p>
      </footer>
    </div>
  );
}
