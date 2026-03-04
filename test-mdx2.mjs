import { compile } from '@mdx-js/mdx';

const mdxSource = `
<Diagram content={\`┌─────────────────────────┐
│              Hub Cluster (Argo CD)                  │
└─────────────────────────┘\`} />
`;

const result = await compile(mdxSource, { jsx: true });
console.log(String(result));
