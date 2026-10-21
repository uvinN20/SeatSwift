import sharp from 'sharp';
import {extname} from 'node:path';
import {mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
const sources=JSON.parse(await readFile('image-originals/travel-sources.json','utf8'));
const prefix=process.argv[2];
const manifest=prefix?JSON.parse(await readFile('src/config/image-manifest.json','utf8')):{};
for(const [key,source] of Object.entries(sources)){
 if(prefix&&!key.startsWith(prefix)) continue;
 const input=`image-originals/${source.file}`;
 const meta=await sharp(input).metadata();const dir=`public/images/${key}`;
 await rm(dir,{recursive:true,force:true});await mkdir(dir,{recursive:true});
 const original=`original${extname(source.file)}`;
 await copyFile(input,`${dir}/${original}`);
 const isDestination=key.startsWith('destination-');
 const widths=(isDestination?[480,800,meta.width]:[640,960,1280,meta.width]).filter((x,i,a)=>x<=meta.width&&a.indexOf(x)===i).sort((a,b)=>a-b);
 const sets={};for(const format of ['avif','webp','jpeg']){const entries=[];
 for(const width of widths){const file=`${width}.${format==='jpeg'?'jpg':format}`;await sharp(input).rotate().resize({width,withoutEnlargement:true}).toFormat(format,{quality:isDestination?(format==='avif'?65:86):(format==='avif'?80:94),effort:1,chromaSubsampling:'4:4:4'}).toFile(`${dir}/${file}`);entries.push(`/images/${key}/${file} ${width}w`);}sets[format]=entries.join(', ');}
 const tiny=await sharp(input).resize({width:24}).jpeg().toBuffer();
 manifest[key]={width:meta.width,height:meta.height,placeholder:`data:image/jpeg;base64,${tiny.toString('base64')}`,small:`/images/${key}/${widths[0]}.jpg`,original:`/images/${key}/${original}`,...sets};
 console.log(`${key}: ${meta.width} × ${meta.height}, ${widths.join('/')}px variants`);
}
await writeFile('src/config/image-manifest.json',JSON.stringify(manifest,null,2));
