import dynamic from 'next/dynamic'

// Load CRM without SSR (uses localStorage)
const CRM = dynamic(() => import('../components/CRM'), { ssr: false })

export default function Home() {
  return <CRM />
}
