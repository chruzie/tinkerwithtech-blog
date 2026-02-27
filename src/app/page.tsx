import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-secondary">
          hi, i'm Chruz.
        </h1>
        <p className="text-foreground text-lg leading-relaxed">
          I've been a Site Reliability Engineer and DevOps practitioner for the last 10 years, based out of Calgary, Alberta.
        </p>
        <p className="text-foreground text-lg leading-relaxed">
          I build resilient systems, automate the painful parts of infrastructure, and occasionally document the process. Welcome to the
          <span className="text-accent font-medium mx-1">TinkerWithTech</span>
          landing zone for extended write-ups, code snippets, and supplementary guides.
        </p>
      </header>

      <section className="flex flex-col gap-6 mt-8">
        <h2 className="text-xl font-medium text-secondary">writing</h2>

        {posts.length === 0 ? (
          <p className="text-foreground/70 italic text-sm">Nothing here yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {posts.map((post) => (
              <li key={post.slug} className="flex flex-col sm:flex-row sm:items-baseline gap-2 group">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-lg font-medium text-secondary group-hover:text-accent transition-colors"
                >
                  {post.title}
                </Link>
                <span className="text-sm text-foreground/50 font-mono tracking-tighter">
                  {post.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
