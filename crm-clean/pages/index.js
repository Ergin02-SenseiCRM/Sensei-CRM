import dynamic from 'next/dynamic'
const CRM = dynamic(() => import('../components/CRM'), { ssr: false })
export default function Home() { return <CRM /> }
