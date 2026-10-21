import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
const input=process.argv[2];
if(!input) throw new Error('Pass the source collage path');
// Extract the five supplied panels; trim numbers, gutters and the baked-in button.
const crops={hero:{left:245,top:20,width:447,height:350},auth:{left:875,top:65,width:510,height:308},driver:{left:23,top:440,width:475,height:267},service:{left:555,top:445,width:368,height:300},network:{left:950,top:445,width:432,height:265}};
const manifest={};
for(const [key,rect] of Object.entries(crops)){
 const dir=`public/images/${key}`;await mkdir(dir,{recursive:true});
 const buffer=await sharp(input).extract(rect).toBuffer();
 const widths=[320,rect.width];const sets={};
 for(const format of ['avif','webp','jpeg']){
 const entries=[];for(const width of widths){const name=`${width}.${format==='jpeg'?'jpg':format}`;await sharp(buffer).resize({width}).toFormat(format,{quality:format==='avif'?65:86}).toFile(`${dir}/${name}`);entries.push(`/images/${key}/${name} ${width}w`);}sets[format]=entries.join(', ');
 }
 const tiny=await sharp(buffer).resize({width:24}).jpeg({quality:40}).toBuffer();
 manifest[key]={width:rect.width,height:rect.height,placeholder:`data:image/jpeg;base64,${tiny.toString('base64')}`,small:`/images/${key}/320.jpg`,...sets};
}
await writeFile('src/config/image-manifest.json',JSON.stringify(manifest,null,2));
