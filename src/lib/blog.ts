import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'src/content/blog');

export type BlogPost = {
    slug: string;
    title: string;
    date: string;
    description: string;
    content: string;
    season?: number;
    episode?: number;
    tags?: string[];
};

export function getPostSlugs() {
    if (!fs.existsSync(contentDirectory)) {
        return [];
    }
    return fs.readdirSync(contentDirectory);
}

export function getPostBySlug(slug: string): BlogPost {
    const realSlug = slug.replace(/\.mdx$/, '');
    const fullPath = path.join(contentDirectory, `${realSlug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
        slug: realSlug,
        title: data.title || 'Untitled',
        date: data.date || '',
        description: data.description || '',
        content,
        season: data.season ?? undefined,
        episode: data.episode ?? undefined,
        tags: data.tags ?? undefined,
    };
}

export function getAllPosts(): BlogPost[] {
    const slugs = getPostSlugs();
    const posts = slugs
        .filter((slug) => slug.endsWith('.mdx'))
        .map((slug) => getPostBySlug(slug))
        .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
    return posts;
}
