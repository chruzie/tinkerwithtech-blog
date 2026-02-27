import { getAllPosts } from '@/lib/blog';
import { EpisodesSearch } from '@/components/EpisodesSearch';

export const metadata = {
    title: 'Episodes | TinkerWithTech',
    description: 'All TinkerWithTech episodes — deep dives into CNCF tools, homelab infrastructure, and platform engineering.',
};

export default function EpisodesPage() {
    const posts = getAllPosts();

    // Separate episodic posts (have season/episode) from standalone posts
    const episodePosts = posts.filter((p) => p.season != null && p.episode != null);
    const standalonePosts = posts.filter((p) => p.season == null || p.episode == null);

    // Group by season
    const bySeason = episodePosts.reduce<Record<number, typeof episodePosts>>(
        (acc, post) => {
            const s = post.season!;
            if (!acc[s]) acc[s] = [];
            acc[s].push(post);
            return acc;
        },
        {}
    );

    // Sort each season by episode number
    for (const s of Object.keys(bySeason)) {
        bySeason[Number(s)].sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0));
    }

    const sortedSeasons = Object.keys(bySeason)
        .map(Number)
        .sort((a, b) => b - a); // Latest season first

    return (
        <div className="flex flex-col gap-10">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-secondary">episodes</h1>
                <p className="text-foreground/70 text-sm">
                    Every episode, organized by season. Search across titles and descriptions.
                </p>
            </header>

            <EpisodesSearch
                episodePosts={episodePosts}
                standalonePosts={standalonePosts}
                bySeason={bySeason}
                sortedSeasons={sortedSeasons}
            />
        </div>
    );
}
