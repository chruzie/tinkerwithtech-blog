'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { BlogPost } from '@/lib/blog';

interface Props {
    episodePosts: BlogPost[];
    standalonePosts: BlogPost[];
    bySeason: Record<number, BlogPost[]>;
    sortedSeasons: number[];
}

function EpisodeRow({ post }: { post: BlogPost }) {
    return (
        <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 group">
            <div className="flex items-baseline gap-3 flex-1">
                {post.episode != null && (
                    <span className="text-xs font-mono text-accent/70 shrink-0 w-8">
                        E{String(post.episode).padStart(2, '0')}
                    </span>
                )}
                <Link
                    href={`/blog/${post.slug}`}
                    className="text-base font-medium text-secondary group-hover:text-accent transition-colors"
                >
                    {post.title}
                </Link>
            </div>
            <span className="text-xs text-foreground/40 font-mono tracking-tighter ml-11 sm:ml-0">
                {post.date}
            </span>
        </li>
    );
}

export function EpisodesSearch({ episodePosts, standalonePosts, bySeason, sortedSeasons }: Props) {
    const [query, setQuery] = useState('');

    const allPosts = [...episodePosts, ...standalonePosts];
    const q = query.trim().toLowerCase();

    const filtered = q
        ? allPosts.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
        )
        : [];

    return (
        <div className="flex flex-col gap-8">
            {/* Search bar */}
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="search episodes…"
                    className="w-full bg-foreground/5 border border-foreground/10 rounded-md px-4 py-2 pr-10 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                />
                {q && (
                    <button
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 transition-colors text-lg leading-none"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Search results */}
            {q ? (
                filtered.length === 0 ? (
                    <p className="text-foreground/50 italic text-sm">No episodes match &ldquo;{query}&rdquo;.</p>
                ) : (
                    <section className="flex flex-col gap-3">
                        <p className="text-xs text-foreground/40 font-mono">
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                        </p>
                        <ul className="flex flex-col gap-4">
                            {filtered.map((post) => (
                                <EpisodeRow key={post.slug} post={post} />
                            ))}
                        </ul>
                    </section>
                )
            ) : (
                <>
                    {/* Season groups */}
                    {sortedSeasons.map((season) => (
                        <section key={season} className="flex flex-col gap-4">
                            <h2 className="text-sm font-mono text-accent uppercase tracking-widest border-b border-foreground/10 pb-2">
                                Season {season}
                            </h2>
                            <ul className="flex flex-col gap-4">
                                {bySeason[season].map((post) => (
                                    <EpisodeRow key={post.slug} post={post} />
                                ))}
                            </ul>
                        </section>
                    ))}

                    {/* Standalone posts */}
                    {standalonePosts.length > 0 && (
                        <section className="flex flex-col gap-4">
                            <h2 className="text-sm font-mono text-accent uppercase tracking-widest border-b border-foreground/10 pb-2">
                                Other
                            </h2>
                            <ul className="flex flex-col gap-4">
                                {standalonePosts.map((post) => (
                                    <EpisodeRow key={post.slug} post={post} />
                                ))}
                            </ul>
                        </section>
                    )}

                    {sortedSeasons.length === 0 && standalonePosts.length === 0 && (
                        <p className="text-foreground/50 italic text-sm">No episodes yet.</p>
                    )}
                </>
            )}
        </div>
    );
}
