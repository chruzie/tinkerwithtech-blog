const { compile } = require('@mdx-js/mdx');
const fs = require('fs');

async function test() {
  const file = fs.readFileSync('src/content/blog/ep01-argocd-agent.mdx', 'utf-8');
  const compiled = await compile(file, { jsx: true });
  console.log(String(compiled).substring(0, 1000));
}
test();
