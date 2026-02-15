import RegistrationForm from "@/components/RegistrationForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <header className="text-center mb-12">
          <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">
            Mata Sushila Institute of Education
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight">
            National Seminar on
            <br />
            <span className="text-teal-600">Education & Mental Health</span>
          </h1>
          <p className="text-slate-600 mt-3 text-lg">
            Bridging the Gap: Fostering Well-being in Academic Spaces
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
            <span>22 & 23 March 2026</span>
            <span>•</span>
            <span>Hilsa, Nalanda</span>
          </div>
        </header>

        <main className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100">
          <a
            href="/seminar-brochure.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start rounded-xl bg-slate-100 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 px-5 py-3.5 mb-6 text-slate-700 hover:text-teal-700 transition-colors group"
          >
            <svg
              className="w-5 h-5 text-teal-600 group-hover:text-teal-700 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="font-medium">Download Seminar Brochure (PDF)</span>
            <svg
              className="w-4 h-4 shrink-0 opacity-60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            Register for the Seminar
          </h2>
          <RegistrationForm />
        </main>

        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>In collaboration with Educational Development Council, Patna</p>
          <p className="mt-1">Contact: matasushilattc@gmail.com | 9262994128,9110904930</p>
        </footer>
      </div>
    </div>
  );
}
