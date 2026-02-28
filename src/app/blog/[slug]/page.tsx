import { notFound } from 'next/navigation';
import { getPostBySlug, getPostSlugs } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import remarkGfm from 'remark-gfm';

export async function generateStaticParams() {
    const posts = getPostSlugs();
    return posts.map((slug) => ({
        slug: slug.replace(/\.mdx$/, ''),
    }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    try {
        const post = getPostBySlug(params.slug);
        return {
            title: `${post.title} | TinkerWithTech`,
            description: post.description,
        };
    } catch {
        return { title: 'Post Not Found' };
    }
}

function readingTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

function formatDate(raw: string): string {
    try {
        return new Date(raw).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    } catch {
        return raw;
    }
}

const components = {
    h1: (props: any) => (
        <h1 className="text-2xl font-semibold mt-12 mb-4 text-secondary tracking-tight scroll-mt-20 group" {...props}>
            <span>{props.children}</span>
        </h1>
    ),
    h2: (props: any) => (
        <h2 className="text-xl font-semibold mt-10 mb-4 text-secondary tracking-tight scroll-mt-20 border-b border-foreground/10 pb-2" {...props} />
    ),
    h3: (props: any) => (
        <h3 className="text-base font-semibold mt-8 mb-3 text-accent/90 tracking-tight scroll-mt-20" {...props} />
    ),
    p: (props: any) => (
        <p className="leading-[1.8] mb-5 text-foreground/85" {...props} />
    ),
    a: (props: any) => (
        <a className="text-accent underline underline-offset-2 decoration-accent/40 hover:decoration-accent transition-colors" {...props} />
    ),
    ul: (props: any) => (
        <ul className="mb-6 text-foreground/85 space-y-1.5 pl-0 list-none" {...props} />
    ),
    ol: (props: any) => (
        <ol className="mb-6 text-foreground/85 space-y-1.5 list-decimal pl-5" {...props} />
    ),
    li: ({ children, ...props }: any) => (
        <li className="flex gap-2 leading-relaxed [ol_&]:pl-1" {...props}>
            <span className="text-accent/60 mt-0.5 flex-shrink-0 select-none [ol_&]:hidden">▸</span>
            <span>{children}</span>
        </li>
    ),
    blockquote: (props: any) => (
        <blockquote className="relative border-l-4 border-accent/60 pl-5 pr-4 py-3 my-6 bg-accent/5 rounded-r-lg text-foreground/75 italic" {...props} />
    ),
    code: (props: any) => (
        <code className="bg-foreground/8 text-accent/90 px-1.5 py-0.5 rounded text-[0.82em] font-mono border border-foreground/10" {...props} />
    ),
    pre: (props: any) => <CodeBlock {...props} />,
    strong: (props: any) => (
        <strong className="font-semibold text-secondary" {...props} />
    ),
    em: (props: any) => (
        <em className="italic text-foreground/80" {...props} />
    ),
    hr: () => (
        <div className="my-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-foreground/10" />
            <div className="text-accent/40 text-xs font-mono select-none">◆</div>
            <div className="flex-1 h-px bg-foreground/10" />
        </div>
    ),
    table: (props: any) => (
        <div className="overflow-x-auto my-8 rounded-xl border border-foreground/10 shadow-lg shadow-black/20">
            <table className="w-full text-sm border-collapse" {...props} />
        </div>
    ),
    thead: (props: any) => (
        <thead className="bg-foreground/5 border-b border-foreground/15" {...props} />
    ),
    tbody: (props: any) => (
        <tbody className="divide-y divide-foreground/8" {...props} />
    ),
    tr: (props: any) => (
        <tr className="hover:bg-foreground/4 transition-colors" {...props} />
    ),
    th: (props: any) => (
        <th className="px-4 py-3 text-left font-semibold text-secondary/90 text-xs uppercase tracking-widest whitespace-nowrap" {...props} />
    ),
    td: (props: any) => (
        <td className="px-4 py-2.5 text-foreground/75 leading-snug" {...props} />
    ),
};

export default async function BlogPost(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    let post;
    try {
        post = getPostBySlug(params.slug);
    } catch {
        notFound();
    }

    const minutes = readingTime(post.content);
    const formattedDate = formatDate(post.date);
    const episodeLabel = (post.season && post.episode)
        ? `S${post.season} · E${String(post.episode).padStart(2, '0')}`
        : null;

    return (
        <article className="w-full">
            {/* ── Header ── */}
            <header className="mb-10 pb-8 border-b border-foreground/10">
                {/* Episode badge */}
                {episodeLabel && (
                    <div className="mb-4 inline-flex items-center gap-2">
                        <span className="font-mono text-xs text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full tracking-widest uppercase">
                            {episodeLabel}
                        </span>
                    </div>
                )}

                <h1 className="text-3xl font-semibold tracking-tight text-secondary leading-tight mb-4">
                    {post.title}
                </h1>

                {post.description && (
                    <p className="text-foreground/60 text-base leading-relaxed mb-5 max-w-prose">
                        {post.description}
                    </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/50 font-mono">
                    <time dateTime={post.date}>{formattedDate}</time>
                    <span className="text-foreground/20">·</span>
                    <span>{minutes} min read</span>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs font-mono text-foreground/50 bg-foreground/5 border border-foreground/10 px-2.5 py-1 rounded-full hover:border-accent/30 hover:text-foreground/70 transition-colors"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </header>

            {/* ── Body ── */}
            <div className="w-full prose-content">
                <MDXRemote
                    source={post.content}
                    components={components}
                    options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
                />
            </div>

            {/* ── Footer ── */}
            <div className="mt-16 pt-8 border-t border-foreground/10 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-accent hover:text-accent/80 transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                    <span>←</span>
                    <span>all posts</span>
                </Link>
                {episodeLabel && (
                    <span className="font-mono text-xs text-foreground/30">{episodeLabel}</span>
                )}
            </div>
        </article>
    );
}
