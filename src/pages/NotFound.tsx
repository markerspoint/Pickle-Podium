import { Link, useLocation } from 'react-router-dom'

export default function NotFound() {
  const { pathname } = useLocation()
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="text-7xl font-light text-slate-300">404</h1>
      <div className="mx-auto mt-4 h-0.5 w-16 bg-slate-200" />
      <h2 className="mt-6 text-2xl font-medium text-slate-800">Page Not Found</h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        The page <span className="font-medium text-slate-700">"{pathname.slice(1)}"</span> could not be found.
      </p>
      <Link to="/" className="mt-6 inline-block font-medium text-court-deep hover:underline">Go home</Link>
    </div>
  )
}
