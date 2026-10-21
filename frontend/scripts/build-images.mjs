import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const originals = new URL('../image-originals/', import.meta.url);
let sources; try { sources=JSON.parse(await readFile(new URL('sources.json', originals),'utf8')); } catch { console.log('No verified originals installed. Keeping labelled illustration fallback. See docs/IMAGE-CREDITS.md.'); process.exit(0); }
const manifest={};
for(const [key,source] of Object.entries(sources)) {
 if(!/^[a-z0-9-]+$/.test(key)||!source.author||!source.license||!source.sourceUrl) throw new Error(`Missing credit metadata: ${key}`);
 const input=new URL(source.file, originals); const meta=await sharp(input).metadata();
 if(meta.width<3840) throw new Error(`${key}: original must be at least 3840px wide`);
 const output=new URL(`../public/images/${key}/`,import.meta.url); await mkdir(output,{recursive:true});
 const sets={avif:[],webp:[],jpeg:[]};
 for(const width of [640,960,1280,1920,2560,3840]) for(const format of Object.keys(sets)) {
 const filename=`${width}.${format==='jpeg'?'jpg':format}`;
 await sharp(input).rotate().resize({width}).toFormat(format,{quality:format==='avif'?50:78}).toFile(new URL(filename,output).pathname);
 sets[format].push(`/images/${key}/${filename} ${width}w`);
 }
 const tiny=await sharp(input).resize({width:24}).jpeg({quality:35}).toBuffer();
 manifest[key]={width:meta.width,height:meta.height,placeholder:`data:image/jpeg;base64,${tiny.toString('base64')}`,small:`/images/${key}/640.jpg`,...Object.fromEntries(Object.entries(sets).map(([k,v])=>[k,v.join(', ')]))};
}
await writeFile(new URL('../src/config/image-manifest.json',import.meta.url),JSON.stringify(manifest,null,2));
console.log(`Built ${Object.keys(manifest).length} credited image sets.`);
