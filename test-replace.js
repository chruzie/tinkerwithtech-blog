const fs = require('fs');

const path = 'src/content/blog/ep02-kubernetes-operators.mdx';
let mdx = fs.readFileSync(path, 'utf8');

mdx = mdx.replace(/<Diagram content={`([\s\S]*?)`} \/>/g, (match, p1) => {
    return `<Diagram>\n{\`${p1}\`}\n</Diagram>`;
});

fs.writeFileSync(path, mdx);
console.log("Replaced ep02");
