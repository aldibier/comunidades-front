import { useEffect, useState } from 'react'

export function PersonSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(value.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [value, onSearch])

  return (
    <label className="cf-field">
      <span>Buscar por nombre o celular</span>
      <input
        type="search"
        inputMode="search"
        autoComplete="off"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </label>
  )
}
