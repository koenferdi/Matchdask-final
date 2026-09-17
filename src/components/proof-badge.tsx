export function ProofBadge({ className = "h-24 w-24", label = true }: { className?: string; label?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Matchdesk Exclusief-proof">
      <circle cx="60" cy="60" r="58" fill="#0e1b21" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="#48c6b3" strokeWidth="2" />
      <path d="M60 22 L92 36 V64 C92 84 76 98 60 104 C44 98 28 84 28 64 V36 Z" fill="#11252a" stroke="#b7e6dc" strokeWidth="1.5" />
      <text x="60" y="58" textAnchor="middle" fill="#b7e6dc" fontFamily="Manrope, Arial" fontSize="22" fontWeight="700">
        M
      </text>
      {label ? (
        <>
          <text x="60" y="74" textAnchor="middle" fill="#48c6b3" fontFamily="DM Sans, Arial" fontSize="7" letterSpacing="1.4">
            EXCLUSIEF-PROOF
          </text>
          <text x="60" y="84" textAnchor="middle" fill="#b7e6dc" fontFamily="DM Sans, Arial" fontSize="5.5" letterSpacing="0.6">
            GECONTROLEERD DOOR MATCHDESK
          </text>
        </>
      ) : null}
    </svg>
  );
}
