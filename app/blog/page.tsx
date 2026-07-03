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
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
            Il Blog di <span className="text-indigo-600">NeatX</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Guide, strategie e consigli su come automatizzare il tuo lavoro e moltiplicare i profitti.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-slate-500 py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            Nessun articolo pubblicato al momento. Usa la SEO Machine per generarne uno!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group h-full">
                <div className="bg-white rounded-3xl p-8 h-full shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col justify-between hover:-translate-y-1">
                  <div>
                    <div className="text-indigo-600 text-sm font-semibold mb-3 tracking-wider uppercase">
                      {post.date}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-slate-600 line-clamp-3 mb-6">
                      {post.description}
                    </p>
                  </div>
                  <div className="text-indigo-600 font-medium inline-flex items-center group-hover:gap-2 transition-all">
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
