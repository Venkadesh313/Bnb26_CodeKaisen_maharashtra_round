type RoundtableMarkProps = {
  compact?: boolean
}

export function RoundtableMark({ compact = false }: RoundtableMarkProps) {
  return (
    <div className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''}`} aria-label="Roundtable">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-mark__dot brand-mark__dot--one" />
        <span className="brand-mark__dot brand-mark__dot--two" />
        <span className="brand-mark__dot brand-mark__dot--three" />
        <span className="brand-mark__core" />
      </span>
      {!compact && <span className="brand-wordmark">roundtable<span className="brand-wordmark__period">.</span></span>}
    </div>
  )
}
