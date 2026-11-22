import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { useStatus } from '../lib/store'

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'Players', to: '/players' },
  { label: 'Submit a Result', to: '/submit' },
  { label: 'Admin', to: '/admin' },
]

function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const active = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-mist/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[120rem] items-center justify-between gap-4 px-5 lg:px-10">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink">
            <span className="h-3.5 w-3.5 rounded-full bg-court" />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-[13px] font-extrabold uppercase tracking-[0.18em] text-ink">Podium DB</span>
            <span className="block text-[11px] font-medium text-athletic">Bacolod · Negros Occidental</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-2 font-heading text-xs font-bold uppercase tracking-[0.14em] transition ${active(n.to) ? 'bg-ink text-white' : 'text-athletic hover:bg-ink/5 hover:text-ink'}`}
            >
              {n.label === 'Admin' && <ShieldCheck className="h-3.5 w-3.5" />}
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-ink/10 text-ink md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-ink/10 bg-mist px-5 py-3 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 border-b border-ink/5 py-3 font-heading text-sm font-bold uppercase tracking-[0.14em] last:border-0 ${active(n.to) ? 'text-court-deep' : 'text-ink'}`}
            >
              {n.label === 'Admin' && <ShieldCheck className="h-4 w-4" />}
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-white">
      <div className="mx-auto grid max-w-[120rem] gap-10 px-5 py-14 lg:grid-cols-3 lg:px-10">
        <div>
          <p className="font-heading text-sm font-extrabold uppercase tracking-[0.16em] text-ink">Bacolod / NegOcc Podium Database</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-athletic">
            A community-maintained record of verified pickleball tournament podium finishes by players from Bacolod City and across
            Negros Occidental. All records are based on publicly available social media posts published by pickleball clubs,
            tournament organizers, and patrons.
          </p>
        </div>
        <div>
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-athletic">Browse</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/" className="text-ink hover:text-court-deep">Home</Link></li>
            <li><Link to="/players" className="text-ink hover:text-court-deep">Players &amp; rankings</Link></li>
            <li><Link to="/admin" className="text-ink hover:text-court-deep">Admin sign-in</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-athletic">Records &amp; corrections</p>
          <p className="mt-4 text-sm leading-relaxed text-athletic">
            Records are limited and incomplete. Corrections, additional results, and suggestions are welcome. Pro players, genderless
            open tournaments, mini-tournaments, small fundraising tournaments, club in-house tournaments, age-bracket categories, and
            DUPR tournaments are not included in the database.
          </p>
        </div>
      </div>
      <div className="border-t border-ink/10 px-5 py-6 lg:px-10">
        <div className="mx-auto max-w-[120rem] text-xs text-athletic">
          © {new Date().getFullYear()} Negros Occidental pickleball community. All records published with permission.
        </div>
      </div>
    </footer>
  )
}

export default function Layout() {
  const { ready, error } = useStatus()
  return (
    <div className="flex min-h-screen flex-col bg-mist text-ink">
      <Header />
      <main className="flex-1">
        {error && (
          <p role="alert" className="border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-center text-sm text-destructive">
            The database could not be reached, so records may be missing. ({error})
          </p>
        )}
        {ready ? <Outlet /> : <p className="px-5 py-24 text-center text-sm text-athletic">Loading records…</p>}
      </main>
      <Footer />
    </div>
  )
}
