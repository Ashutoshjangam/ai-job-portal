export default function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "bg-paper-50 border border-paper-300 rounded-lg p-6",
        "shadow-[2px_2px_0_0_rgba(19,22,31,0.06)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
