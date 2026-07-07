import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'

export default function BlogPage() {
  const blogDir = path.join(process.cwd(), 'content', 'blog')
  
  let posts: any[] = []
  try {
    const files = fs.readdirSync(blogDir)
    posts = files.map(filename => {
      const filePath = path.join(blogDir, filename)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(fileContent)
      return {
        title: data.title || filename.replace('.md', ''),
        date: data.date || 'Recente',
        description: data.description || '',
        slug: data.slug || filename.replace('.md', '')
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (e) {
    console.error("No blog directory found or error reading files", e)
  }

  return (
    <div className="min-h-screen bg-[#050814] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-slate-400 hover:text-[#00b4ff] transition-colors font-semibold">
            <span className="mr-2">←</span> Torna a NeatX
          </Link>
        </div>
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
            Il Blog di <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b4ff] to-purple-500">NeatX</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Guide, strategie e consigli su come automatizzare il tuo lavoro e moltiplicare i profitti.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-slate-500 py-20 bg-[#0b1221]/70 rounded-3xl shadow-sm border border-[#1a2642]">
            Nessun articolo pubblicato al momento. Usa la SEO Machine per generarne uno!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group h-full">
                <div className="bg-[#0b1221]/70 rounded-3xl p-8 h-full shadow-2xl hover:shadow-cyan-900/20 transition-all duration-300 border border-[#1a2642] flex flex-col justify-between hover:-translate-y-1 hover:border-[#00b4ff]/50">
                  <div>
                    <div className="text-[#00b4ff] text-sm font-bold mb-3 tracking-wider uppercase">
                      {post.date}
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mb-4 group-hover:text-[#00b4ff] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-slate-400 line-clamp-3 mb-6 font-medium">
                      {post.description}
                    </p>
                  </div>
                  <div className="text-purple-400 font-bold inline-flex items-center group-hover:gap-2 transition-all">
                    Leggi l'articolo <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
