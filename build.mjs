import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
let html=await fs.readFile(path.join(root,'mau-odor-nanquim.html'),'utf8');
for(const file of ['tailwind.css','styles.css','illustrations.css','map.css']){
  const css=await fs.readFile(path.join(root,file),'utf8');
  html=html.replace(`<link rel="stylesheet" href="${file}">`,()=>`<style>\n/* ${file} */\n${css}\n</style>`);
}
for(const file of ['illustrations.js','map.js','app.js']){
  const js=await fs.readFile(path.join(root,file),'utf8');
  html=html.replace(`<script src="${file}"></script>`,()=>`<script>\n/* ${file} */\n${js.replace(/<\/script/gi,'<\\/script')}\n</script>`);
}
await fs.mkdir(path.join(root,'entrega'),{recursive:true});
const output=path.join(root,'entrega','mau-odor-nanquim.html');
await fs.writeFile(output,html);
console.log(`HTML autocontido: ${output} (${Math.round(Buffer.byteLength(html)/1024)} KB)`);

// GitHub Pages publica a entrada da raiz.
await fs.writeFile(path.join(root,"index.html"),html);
