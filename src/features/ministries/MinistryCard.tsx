import { Link } from 'react-router-dom'
import type { Ministry } from '../../api/records'

function descriptionText(html: string | null): string {
  if (!html) return ''
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  return text.replace(/\s+/g, ' ').trim()
}

function MinistryMark() {
  return (
    <svg className="cf-ministry-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="6" fill="#CAA872" />
      <circle cx="32" cy="24" r="7" fill="#1E3146" />
      <path d="M18 48c2.2-8 7.2-12 14-12s11.8 4 14 12" fill="none" stroke="#1E3146" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function MinistryImage({ ministry }: { ministry: Ministry }) {
  if (ministry.logoUrl) return <img src={ministry.logoUrl} alt="" />
  return <MinistryMark />
}

export function MinistryCard({ ministry }: { ministry: Ministry }) {
  const text = descriptionText(ministry.descriptionHtml)
  return (
    <Link className="cf-ministry" to={`/comunidades/${ministry.id}`}>
      <MinistryImage ministry={ministry} />
      <span>
        <strong>{ministry.label}</strong>
        {text && <span className="cf-ministry-text">{text}</span>}
      </span>
    </Link>
  )
}

export function MinistryHeader({ ministry }: { ministry: Ministry }) {
  return (
    <div className="cf-ministry cf-ministry-space">
      <MinistryImage ministry={ministry} />
      <div>
        <h1>{ministry.label}</h1>
        {ministry.descriptionHtml && (
          <div className="cf-prose" dangerouslySetInnerHTML={{ __html: ministry.descriptionHtml }} />
        )}
      </div>
    </div>
  )
}
