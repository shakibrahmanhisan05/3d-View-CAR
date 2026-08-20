/**
 * /admin — the lead table (§15 Phase 8).
 *
 * Deliberately outside `[locale]`: it is an internal tool for four people, not part of the
 * bilingual site, so it does not carry the locale routing or the chrome.
 *
 * One shared password, a table, and CSV export. No auth system, no dashboard, no charts
 * (§17). Tasfia's CRM is a Google Sheet; this page exists to fill it.
 */

import type { Metadata } from 'next';
import { adminPassword, isAuthed } from '@/lib/admin';
import { isUsingDatabase, listBuilds, listLeads } from '@/lib/store';
import { formatBDT } from '@/lib/i18n/config';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;

  if (!adminPassword()) {
    return (
      <Shell>
        <p className="sheet-code">CONFIG</p>
        <p className="mt-2 max-w-md text-sm">
          <code className="num">ADMIN_PASSWORD</code> is not set. Add it to{' '}
          <code className="num">.env.local</code> and restart — until then this page lets nobody in,
          which is the correct failure direction.
        </p>
      </Shell>
    );
  }

  if (!(await isAuthed())) {
    return (
      <Shell>
        <form action="/api/admin" method="post" className="max-w-xs">
          <label htmlFor="password" className="sheet-code">
            PASSWORD
          </label>
          <input id="password" name="password" type="password" className="field mt-2" autoFocus />
          {e ? (
            <p role="alert" className="mt-2 text-xs text-signal">
              Wrong password.
            </p>
          ) : null}
          <button type="submit" className="tap mt-4 w-full bg-ink px-4 py-3 text-sm font-600 text-paper">
            Enter
          </button>
        </form>
      </Shell>
    );
  }

  const [leads, builds, usingDb] = await Promise.all([listLeads(), listBuilds(), isUsingDatabase()]);

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="sheet-code">
          STORE / {usingDb ? 'NEON POSTGRES' : 'LOCAL .data/*.json'} · LEADS{' '}
          <span className="num">{leads.length}</span> · BUILDS <span className="num">{builds.length}</span>
        </p>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=leads" className="tap flex items-center border border-ink px-3 text-xs">
            Leads CSV
          </a>
          <a href="/api/admin/export?type=builds" className="tap flex items-center border border-ink px-3 text-xs">
            Builds CSV
          </a>
        </div>
      </div>

      <h2 className="sheet-code mb-2">LEADS</h2>
      {leads.length ? (
        <div className="overflow-x-auto border border-rule">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="bg-paper-sunk text-left">
                {['When', 'Name', 'Business', 'Phone', 'Sells', 'Source', 'Message'].map((header) => (
                  <th key={header} className="sheet-code border-b border-rule px-3 py-2">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-rule-faint align-top">
                  <td className="num whitespace-nowrap px-3 py-2 text-xs text-ink-soft">
                    {new Date(lead.createdAt).toISOString().slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="px-3 py-2">{lead.name}</td>
                  <td className="px-3 py-2">{lead.business}</td>
                  <td className="num whitespace-nowrap px-3 py-2">
                    <a href={`tel:${lead.phone}`} className="hover:text-signal">
                      {lead.phone}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-xs">{lead.segment}</td>
                  <td className="num px-3 py-2 text-xs text-alu">{lead.source ?? '—'}</td>
                  <td className="max-w-xs px-3 py-2 text-xs text-ink-soft">{lead.message ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">No leads yet.</p>
      )}

      <h2 className="sheet-code mb-2 mt-10">SAVED BUILDS</h2>
      {builds.length ? (
        <div className="overflow-x-auto border border-rule">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <thead>
              <tr className="bg-paper-sunk text-left">
                {['When', 'Vehicle', 'Total', 'Configuration', 'Prospect'].map((header) => (
                  <th key={header} className="sheet-code border-b border-rule px-3 py-2">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {builds.map((build) => (
                <tr key={build.id} className="border-b border-rule-faint align-top">
                  <td className="num whitespace-nowrap px-3 py-2 text-xs text-ink-soft">
                    {new Date(build.createdAt).toISOString().slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="px-3 py-2 text-xs">{build.vehicleId}</td>
                  <td className="num whitespace-nowrap px-3 py-2">{formatBDT(build.totalBdt)}</td>
                  <td className="num max-w-md break-all px-3 py-2 text-xs text-ink-soft">{build.config}</td>
                  <td className="px-3 py-2 text-xs text-alu">{build.prospect ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">No saved builds yet.</p>
      )}

      {/*
        Playbook §9: which colour gets picked most, which trim gets abandoned. Worthless for a
        year, then it is demand data on the Chattogram market that exists nowhere else.
      */}
      <p className="mt-10 max-w-2xl text-xs text-alu">
        Every saved build is a stated preference somebody volunteered. Keep the exports.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-page px-4 py-10 sm:px-6">
      <p className="display-wide text-sm font-700 uppercase tracking-[0.2em]">PHOENIX / ADMIN</p>
      <div className="mt-8">{children}</div>
    </main>
  );
}
