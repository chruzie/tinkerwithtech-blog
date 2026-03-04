import fs from 'fs';
import path from 'path';

const dir = 'src/content/blog';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace <Diagram content={`...`} />
  content = content.replace(/<Diagram\s+content=\{`([\s\S]*?)`\}\s*\/>/g, (match, p1) => {
    return `\`\`\`diagram\n${p1}\n\`\`\``;
  });

  // Replace <Diagram>\n{`...`}\n</Diagram>
  content = content.replace(/<Diagram>\s*\{`([\s\S]*?)`\}\s*<\/Diagram>/g, (match, p1) => {
    return `\`\`\`diagram\n${p1}\n\`\`\``;
  });

  // Replace <Diagram>\n...\n</Diagram> without {`
  content = content.replace(/<Diagram>([\s\S]*?)<\/Diagram>/g, (match, p1) => {
    let inner = p1;
    // if inner starts and ends with {` `}, strip it (already caught by above but just in case)
    return `\`\`\`diagram\n${inner.trim()}\n\`\`\``;
  });

  // Replace <Diagram content="hello" />
  content = content.replace(/<Diagram\s+content="([^"]*)"\s*\/>/g, (match, p1) => {
    return `\`\`\`diagram\n${p1}\n\`\`\``;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
