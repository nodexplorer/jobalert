// CTA Component

export default function CTA() {
  return (
    <section className="py-12 lg:py-15 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-3xl lg:text-5xl font-extrabold text-gray-900 mb-8">
          Ready to land your next client?
        </h2>
        
        <a
          href="/register"
          className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 lg:px-12 py-4 lg:py-5 rounded-xl text-lg lg:text-xl font-bold hover:bg-gray-800 transition-all hover:scale-105 shadow-2xl"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/>
          </svg>
          Sign in with X
        </a>

        <p className="mt-6 text-gray-600 text-lg">
          Join 5,000+ freelancers already using{' '}
          <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
        </p>
      </div>
    </section>
  );
}