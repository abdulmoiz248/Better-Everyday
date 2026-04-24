export default function CheckinSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Check-in submitted</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Your response has been saved. This link cannot be used again.
        </p>
      </div>
    </div>
  );
}
