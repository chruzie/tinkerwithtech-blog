import { compile } from '@mdx-js/mdx';

const mdxSource = `
<Diagram>
{\`┌─────────────────────────┐
│              Hub Cluster (Argo CD)                  │
└─────────────────────────┘\`}
</Diagram>
`;

const result = await compile(mdxSource, { jsx: true });
console.log(String(result));
