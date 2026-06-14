import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-6xl font-light text-[#2D3748] mb-4">404</h1>
        <h2 className="text-xl text-[#4A5568] mb-4">Page Not Found</h2>
        <p className="text-[#718096] mb-8">The page you are looking for does not exist.</p>
        <Link 
          href="/" 
          className="inline-block px-6 py-3 bg-[#2D3748] text-white rounded-md hover:bg-[#4A5568] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
