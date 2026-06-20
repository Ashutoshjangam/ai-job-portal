export default function Loader({ message = "Thinking..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-2 border-paper-300 rounded-full" />
        <div className="absolute inset-0 border-2 border-signal border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="font-mono text-sm text-ink-500">{message}</p>
    </div>
  );
}
