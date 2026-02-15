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
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            Register for the Seminar
          </h2>
          <RegistrationForm />
        </main>

        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>In collaboration with Educational Development Council, Patna</p>
          <p className="mt-1">Contact: matasushilattc@gmail.com | 9262994128</p>
        </footer>
      </div>
    </div>
  );
}
