import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Opt out of static rendering so the blog updates dynamically when the Cron runs
export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  let posts: any[] = []
  try {
    posts = await prisma.academyArticle.findMany({
      orderBy: { publishedAt: 'desc' }
    });
  } catch (e) {
    console.error("Error reading articles from database", e)
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
            L'Academy di <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b4ff] to-purple-500">NeatX</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Guide, strategie e soluzioni per dominare il mercato degli appuntamenti.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-slate-500 py-20 bg-[#0b1221]/70 rounded-3xl shadow-sm border border-[#1a2642]">
            Nessun articolo pubblicato al momento. L'IA sta per scriverne uno!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.slug} href={`/academy/${post.slug}`} className="group h-full">
                <div className="bg-[#0b1221]/70 rounded-3xl p-6 h-full shadow-2xl hover:shadow-cyan-900/20 transition-all duration-300 border border-[#1a2642] flex flex-col justify-between hover:-translate-y-1 hover:border-[#00b4ff]/50">
                  <div>
                    {post.imageUrl && (
                      <div className="mb-4 rounded-xl overflow-hidden h-40">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="text-[#00b4ff] text-xs font-bold mb-3 tracking-wider uppercase">
                      {new Date(post.publishedAt).toLocaleDateString('it-IT')}
                    </div>
                    <h2 className="text-xl font-extrabold text-white mb-3 group-hover:text-[#00b4ff] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-slate-400 text-sm line-clamp-3 mb-6 font-medium">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="text-purple-400 text-sm font-bold inline-flex items-center group-hover:gap-2 transition-all">
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
