import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const blogDir = path.join(process.cwd(), 'content', 'blog')
  if (!fs.existsSync(blogDir)) return []
  
  const files = fs.readdirSync(blogDir)
  return files.map((file) => ({
    slug: file.replace('.md', ''),
  }))
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const blogDir = path.join(process.cwd(), 'content', 'blog')
  const filePath = path.join(blogDir, `${slug}.md`)
  
  if (!fs.existsSync(filePath)) {
    notFound()
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)

  // Rimuoviamo il titolo H1 dal Markdown perché lo renderizziamo noi custom in alto
  const contentWithoutH1 = content.replace(/^#\s+.+\n/, '');

  return (
    <article className="min-h-screen bg-white">
      {/* Header Articolo */}
      <header className="bg-slate-900 text-white py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog" className="text-indigo-400 font-semibold uppercase tracking-widest text-sm hover:text-white transition-colors mb-8 inline-block">
            ← Torna al Blog
          </Link>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            {data.title || "Articolo Senza Titolo"}
          </h1>
          <div className="text-slate-400 text-lg">
            Pubblicato il: {data.date || "Oggi"}
          </div>
        </div>
      </header>

      {/* Corpo dell'Articolo (Markdown Renderizzato con Stili Tailwind personalizzati) */}
      <main className="max-w-3xl mx-auto py-16 px-6 text-slate-800 text-lg leading-relaxed">
        <ReactMarkdown
          components={{
            h2: ({node, ...props}) => <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4" {...props} />,
            p: ({node, ...props}) => <p className="mb-6" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
            li: ({node, ...props}) => <li className="" {...props} />,
            strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-600 my-6 bg-slate-50 py-2 pr-4 rounded-r-lg" {...props} />,
          }}
        >
          {contentWithoutH1}
        </ReactMarkdown>

        {/* Call to Action Finale */}
        <div className="mt-20 bg-indigo-50 border border-indigo-100 rounded-3xl p-10 text-center shadow-lg">
          <h3 className="text-3xl font-bold text-slate-900 mb-4">Sei pronto a trasformare il tuo lavoro?</h3>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            L'appuntamento mancato costa caro. Il tempo speso al telefono pure. Fai come i migliori professionisti, automatizza tutto con NeatX.
          </p>
          <Link href="/" className="inline-block bg-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-indigo-700 hover:scale-105 transition-all shadow-md">
            Scopri NeatX Gratis
          </Link>
        </div>
      </main>
    </article>
  )
}
