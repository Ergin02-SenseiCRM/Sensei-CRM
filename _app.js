import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>SENSEİ CRM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#f4f5f8;font-family:'DM Sans',system-ui,sans-serif}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#e2e5ee;border-radius:3px}select option{background:#fff;color:#1a2744}input[type=checkbox]{cursor:pointer}button:hover{opacity:.88;transition:opacity .15s}table th,table td{vertical-align:middle}`}</style>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
