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
    <article className="min-h-screen bg-[#050814]">
      {/* Header Articolo */}
      <header className="bg-[#0b1221] text-white py-24 px-4 text-center border-b border-[#1a2642]">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-6 mb-8 text-sm font-semibold uppercase tracking-widest">
            <Link href="/" className="text-slate-400 hover:text-[#00b4ff] transition-colors">
              ← NeatX Home
            </Link>
            <Link href="/blog" className="text-[#00b4ff] hover:text-white transition-colors">
              ← Torna al Blog
            </Link>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            {data.title || "Articolo Senza Titolo"}
          </h1>
          <div className="text-slate-400 text-lg">
            Pubblicato il: {data.date || "Oggi"}
          </div>
        </div>
      </header>

      {/* Corpo dell'Articolo (Markdown Renderizzato con Stili Tailwind personalizzati) */}
      <main className="max-w-3xl mx-auto py-16 px-6 text-slate-300 text-lg leading-relaxed font-medium">
        <ReactMarkdown
          components={{
            h2: ({node, ...props}) => <h2 className="text-3xl font-extrabold text-white mt-12 mb-6" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-2xl font-bold text-slate-100 mt-8 mb-4" {...props} />,
            p: ({node, ...props}) => <p className="mb-6" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-400" {...props} />,
            li: ({node, ...props}) => <li className="" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#00b4ff] pl-4 italic text-slate-400 my-6 bg-[#0b1221] py-3 pr-4 rounded-r-lg" {...props} />,
          }}
        >
          {contentWithoutH1}
        </ReactMarkdown>

        {/* Call to Action Finale */}
        <div className="mt-20 bg-[#0b1221] border border-[#1a2642] rounded-3xl p-10 text-center shadow-2xl">
          <h3 className="text-3xl font-extrabold text-white mb-4">Sei pronto a trasformare il tuo lavoro?</h3>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto font-medium">
            L'appuntamento mancato costa caro. Il tempo speso al telefono pure. Fai come i migliori professionisti, automatizza tutto con NeatX.
          </p>
          <Link href="/" className="inline-block bg-[#00b4ff] text-[#050814] font-extrabold text-lg px-8 py-4 rounded-2xl hover:bg-cyan-400 hover:scale-105 transition-all shadow-[0_0_30px_-5px_rgba(0,180,255,0.4)]">
            Scopri NeatX Gratis
          </Link>
        </div>
      </main>
    </article>
  )
}
