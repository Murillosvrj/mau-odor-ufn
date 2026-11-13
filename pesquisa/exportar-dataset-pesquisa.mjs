#!/usr/bin/env node
/* Exportação privada, somente leitura. Não usa credenciais do aplicativo Web. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,createHmac,randomBytes} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const categoryIds=['waste','container','sewer','ditch','organic','metabolic','chemical','other'];
const mapKeys=['latitude','longitude','intensidade_odor','tipo_odor','data','hora','temperatura','status_qualidade'];
const forbidden=new Set(['nome','name','email','e-mail','autor_uid','uid','provedor_auth','intensidade_humana','intensidade_odor','rotulos_ml','intensidade_nivel','intensidade_estimada','alvo']);
const hash=b=>createHash('sha256').update(b).digest('hex');
function check(ok,message){if(!ok)throw new Error(message);}
export function maskIntensity(text){return String(text||'').replace(/\b(?:intensidade|nota|n[ií]vel|escala)\s*(?:(?:de|do|da|[ée]|igual\s+a)\s*)?[:=\-]?\s*[0-5](?:\s*(?:\/|de)\s*5)?\b/giu,'[INTENSIDADE]').replace(/\b(?:muito\s+forte|muito\s+fraco|intermedi[aá]ri[oa]|moderad[oa]|forte|fraco)\b/giu,'[INTENSIDADE]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu,'[EMAIL]');}
export function assertInputs(value,trail='X'){
  if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){check(!forbidden.has(k.toLowerCase()),`Campo proibido nas entradas: ${trail}.${k}`);assertInputs(v,`${trail}.${k}`);}
}
function dimensions(b,mime){
  if(mime==='image/webp'){
    check(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP','Assinatura WebP inválida');
    let offset=12;
    while(offset+8<=b.length){const kind=b.toString('ascii',offset,offset+4),n=b.readUInt32LE(offset+4),p=offset+8;check(p+n<=b.length,'Chunk WebP truncado');
      if(kind==='VP8X'){check(n>=10,'VP8X truncado');return[b.readUIntLE(p+4,3)+1,b.readUIntLE(p+7,3)+1];}
      if(kind==='VP8L'){check(n>=5&&b[p]===0x2f,'VP8L inválido');const bits=b.readUInt32LE(p+1);return[(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];}
      if(kind==='VP8 '){check(n>=10&&b[p+3]===0x9d&&b[p+4]===1&&b[p+5]===0x2a,'VP8 inválido');return[b.readUInt16LE(p+6)&0x3fff,b.readUInt16LE(p+8)&0x3fff];}
      offset=p+n+(n%2);
    }
  }else{
    check(b[0]===255&&b[1]===216&&b[2]===255,'Assinatura JPEG inválida');let i=2;
    while(i+4<b.length){if(b[i++]!==255)continue;while(b[i]===255)i++;const m=b[i++];if(m===0xd9||m===0xda)break;if(m>=0xd0&&m<=0xd7)continue;const n=b.readUInt16BE(i);check(n>=2&&i+n<=b.length,'JPEG truncado');if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(m))return[b.readUInt16BE(i+5),b.readUInt16BE(i+3)];i+=n;}
  }
  throw new Error('Não foi possível validar dimensões da imagem');
}
export function photoBytes(photo,meta,p,id){
  check(photo&&meta,`Foto ausente: ${id}`);
  check(photo.relato_id===id&&['image/webp','image/jpeg'].includes(photo.mime_type),`Vínculo ou formato de foto inválido: ${id}`);
  for(const k of ['sha256','mime_type','tamanho_bytes','largura','altura','largura_original','altura_original'])check(photo[k]===meta[k],`Metadado divergente ${k}: ${id}`);
  if(p.autor_uid)check(photo.autor_uid===p.autor_uid,`Autor divergente na foto: ${id}`);
  const s=photo.dados_base64;check(typeof s==='string'&&s.length>0&&s.length<=200000&&s.length%4===0&&/^[A-Za-z0-9+/]+={0,2}$/.test(s),`Base64 inválido: ${id}`);
  const b=Buffer.from(s,'base64');check(b.toString('base64')===s&&b.length===photo.tamanho_bytes&&b.length<=143360,`Tamanho/binário inválido: ${id}`);
  check(hash(b)===photo.sha256,`SHA-256 divergente: ${id}`);
  const [w,h]=dimensions(b,photo.mime_type);check(w===photo.largura&&h===photo.altura&&w>0&&h>0&&w<=640&&h<=640,`Dimensões divergentes: ${id}`);
  const ml=photo.rotulos_ml;check(ml?.intensidade_nivel===p.intensidade_odor.nivel&&JSON.stringify(ml.categorias)===JSON.stringify(p.tipo_odor.categorias)&&JSON.stringify(ml.multi_hot)===JSON.stringify(p.tipo_odor.multi_hot)&&ml.sem_foco_visivel===p.sem_foco_visivel&&JSON.stringify(ml.visivel_por_perto)===JSON.stringify(p.visivel_por_perto),`Rótulos divergentes: ${id}`);
  return b;
}
function entries(c){if(Array.isArray(c))return new Map(c.map(v=>[v.id,v.data]));return new Map(Object.entries(c||{}));}
const finite=v=>Number.isFinite(v)?v:null;
const distance=(a,b)=>{const r=Math.PI/180,x=(a.latitude-b.latitude)*r,y=(a.longitude-b.longitude)*r;return 6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(x/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(y/2)**2)));};
export function groupRows(rows,{meters=100,minutes=120}={}){
  const parent=rows.map((_,i)=>i);const find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));const join=(i,j)=>{const a=find(i),b=find(j);if(a!==b)parent[b]=a;};const photos=new Map();
  rows.forEach((r,i)=>{const sha=r.controle_coleta_e_divisao.foto_sha256;if(sha){if(photos.has(sha))join(i,photos.get(sha));else photos.set(sha,i);}});
  for(let i=0;i<rows.length;i++)for(let j=0;j<i;j++){
    const a=rows[i].entradas_estruturadas,b=rows[j].entradas_estruturadas;
    const delta=Math.abs(Date.parse(`${a.data}T${a.hora}-03:00`)-Date.parse(`${b.data}T${b.hora}-03:00`));
    if(delta<=minutes*60000&&distance(a,b)<=meters)join(i,j);
  }
  const members=new Map();rows.forEach((r,i)=>{const p=find(i);if(!members.has(p))members.set(p,[]);members.get(p).push(r.controle_coleta_e_divisao.id);});
  rows.forEach((r,i)=>r.controle_coleta_e_divisao.grupo_ocorrencia_ou_foto='g-'+hash(members.get(find(i)).sort().join('\n')).slice(0,24));
}
export async function exportDataset({collections,out,salt,qa,meters=100,minutes=120,source='snapshot',technical=false}){
  check(Number.isFinite(meters)&&meters>0&&Number.isFinite(minutes)&&minutes>0,'Parâmetros de agrupamento inválidos');
  check(Buffer.byteLength(salt)>=32,'Salt local deve conter pelo menos 32 bytes');
  out=path.resolve(out);const parts=out.split(path.sep);check(!parts.some(p=>['publicacao-github','waind-preview','.git'].includes(p)),'Destino deve ficar fora do pacote público/fontes Web');
  try{await fs.access(path.join(out,'manifesto.json'));throw new Error('Destino já contém dataset. Use uma pasta nova para preservar a versão.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const research=entries(collections.relatos_pesquisa),maps=entries(collections.relatos_mapa),photos=entries(collections.relatos_fotos);
  const excluded=new Set(Object.values(qa).filter(Array.isArray).flat()),rows=[],images=[],ignored=[];
  for(const [id,p]of [...research].sort(([a],[b])=>a.localeCompare(b))){
    if(excluded.has(id)||(p.localizacao?.latitude===-80&&p.localizacao?.longitude===0)){ignored.push({id,motivo:'qa-tecnico'});continue;}
    check(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id),`UUID inválido: ${id}`);
    check(Number.isInteger(p.intensidade_odor?.nivel)&&p.intensidade_odor.nivel>=1&&p.intensidade_odor.nivel<=5,`Intensidade inválida: ${id}`);
    check(['atual','anterior'].includes(p.tipo_ocorrencia)&&/^\d{4}-\d{2}-\d{2}$/.test(p.data)&&/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(p.hora)&&new Date(p.data+'T12:00:00Z').toISOString().slice(0,10)===p.data,`Ocorrência inválida: ${id}`);
    const consent=p.consentimento;check(consent?.pesquisa===true&&['waind-pesquisa-mapa-0.5','waind-pesquisa-mapa-0.6','waind-pesquisa-mapa-0.7'].includes(consent.versao),`Consentimento não reconhecido: ${id}`);
    const m=maps.get(id);check(m&&JSON.stringify(Object.keys(m).sort())===JSON.stringify([...mapKeys].sort()),`Par público ausente ou com campos indevidos: ${id}`);
    check(m.latitude===p.localizacao.latitude&&m.longitude===p.localizacao.longitude&&m.data===p.data&&m.hora===p.hora&&m.intensidade_odor.nivel===p.intensidade_odor.nivel&&m.intensidade_odor.rotulo===p.intensidade_odor.rotulo&&m.temperatura===p.temperatura&&m.status_qualidade===p.status_qualidade,`Par divergente: ${id}`);
    const cats=p.tipo_odor?.categorias;check(Array.isArray(cats)&&cats.length>0&&new Set(cats).size===cats.length&&cats.every(c=>categoryIds.includes(c)),`Categorias inválidas: ${id}`);
    for(const k of categoryIds)check(p.tipo_odor.multi_hot[k]===Number(cats.includes(k))&&m.tipo_odor.multi_hot[k]===p.tipo_odor.multi_hot[k],`Multi-hot divergente: ${id}`);
    check(JSON.stringify(m.tipo_odor.categorias)===JSON.stringify(cats)&&JSON.stringify(m.tipo_odor.rotulos)===JSON.stringify(p.tipo_odor.rotulos),`Categorias públicas divergentes: ${id}`);
    const loc=p.localizacao;check(Number.isFinite(loc.latitude)&&Math.abs(loc.latitude)<=85&&Number.isFinite(loc.longitude)&&Math.abs(loc.longitude)<=180,`Coordenadas inválidas: ${id}`);
    const photo=photos.get(id),meta=p.foto_metadados;let visual={caminho:null,largura:null,altura:null,tem_foto:false},sha=null;
    if(meta?.imagem_enviada){const b=photoBytes(photo,meta,p,id),ext=photo.mime_type==='image/webp'?'webp':'jpg';visual={caminho:`fotos/${id}.${ext}`,largura:photo.largura,altura:photo.altura,tem_foto:true};sha=hash(b);images.push({relative:visual.caminho,bytes:b});}
    else check(!photo,`Imagem órfã/indevida: ${id}`);
    const current=p.tipo_ocorrencia==='atual',w=p.clima||{};
    // Clima vale para a ocorrência quando é atual, ou quando é anterior com clima horário histórico (0.8).
    // Direção do vento entra como seno/cosseno (variável circular: 359° fica perto de 1°).
    const weatherValid=current||(p.tipo_ocorrencia==='anterior'&&w.momento==='historico-horario'),pick=v=>weatherValid?finite(v):null;
    const dir=pick(w.vento_direcao_graus),rad=dir===null?null:dir*Math.PI/180;
    const weather={temperatura_c:pick(w.temperatura_c),umidade_pct:pick(w.umidade_pct),vento_kmh:pick(w.vento_kmh),rajada_kmh:pick(w.rajada_kmh),vento_dir_sin:rad===null?null:Math.round(Math.sin(rad)*1e6)/1e6,vento_dir_cos:rad===null?null:Math.round(Math.cos(rad)*1e6)/1e6,condicao_codigo:pick(w.condicao_codigo)};
    const other=p.tipo_odor.outro_descricao||'',observation=p.observacao||'',original=[other,observation].filter(Boolean).join(' | '),masked=maskIntensity(original);
    const controls={id,consentimento_versao:consent.versao,origem_localizacao:loc.origem,tem_foto:visual.tem_foto,tem_texto:!!original.trim(),status_qualidade:p.status_qualidade,grupo_ocorrencia_ou_foto:null,participante_pseudo_id:p.autor_uid?createHmac('sha256',salt).update('waind-participante\0'+p.autor_uid).digest('hex'):null,foto_sha256:sha,foto_tamanho_bytes:photo?.tamanho_bytes||null,clima_consultado_em:w.consultado_em||null,clima_momento:w.momento||null,texto_tem_indicio_direto:original!==masked,origem_dataset:technical||/sintetico|tecnico|emulador/i.test(source)?'sintetico-pipeline':'campo'};
    const structured={categorias:[...cats],multi_hot:Object.fromEntries(categoryIds.map(k=>[k,p.tipo_odor.multi_hot[k]])),visivel_por_perto:p.visivel_por_perto||[],sem_foco_visivel:!!p.sem_foco_visivel,data:p.data,hora:p.hora,tipo_ocorrencia:p.tipo_ocorrencia,latitude:loc.latitude,longitude:loc.longitude,clima_valido_para_ocorrencia:weatherValid&&Object.values(weather).some(v=>v!==null),clima:weather};
    const text={outro_descricao:other,observacao:observation,texto_original:original,texto_sem_indicio_direto:masked};
    assertInputs({entradas_estruturadas:structured,entradas_texto:text,entrada_visual:visual});
    rows.push({alvo:{intensidade_humana:p.intensidade_odor.nivel},entradas_estruturadas:structured,entradas_texto:text,entrada_visual:visual,controle_coleta_e_divisao:controls});
  }
  for(const [id,f]of photos)if(!research.has(id)&&!excluded.has(id))throw new Error(`Foto sem relato privado: ${id}`);
  groupRows(rows,{meters,minutes});await fs.mkdir(path.join(out,'fotos'),{recursive:true});
  for(const image of images)await fs.writeFile(path.join(out,image.relative),image.bytes,{flag:'wx'});
  const jsonl=rows.map(r=>JSON.stringify(r)).join('\n')+(rows.length?'\n':'');await fs.writeFile(path.join(out,'registros.jsonl'),jsonl,{flag:'wx'});
  const columns=['id','intensidade_humana','data','hora','tipo_ocorrencia','latitude','longitude',...categoryIds.map(k=>'multi_hot_'+k),'tem_foto','tem_texto','grupo_ocorrencia_ou_foto','participante_pseudo_id'];
  const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';const flat=rows.map(r=>{const e=r.entradas_estruturadas,c=r.controle_coleta_e_divisao;return[c.id,r.alvo.intensidade_humana,e.data,e.hora,e.tipo_ocorrencia,e.latitude,e.longitude,...categoryIds.map(k=>e.multi_hot[k]),c.tem_foto,c.tem_texto,c.grupo_ocorrencia_ou_foto,c.participante_pseudo_id];});
  await fs.writeFile(path.join(out,'tabela.csv'),[columns,...flat].map(r=>r.map(quote).join(',')).join('\n')+'\n',{flag:'wx'});
  const manifest={schema_version:'waind-dataset-0.7',gerado_em:new Date().toISOString(),fonte:source,registros:rows.length,fotos:images.length,excluidos:ignored,qa_ids:[...excluded],sha256_registros:hash(jsonl),agrupamento:{metros:meters,minutos:minutes,metodo:'componentes-conectados: mesmo SHA ou proximidade espaço-temporal; não confirma causa'},aviso:'Dataset privado. Intensidade humana é alvo, não entrada. Identificadores e grupos são controles, nunca características X. Fotografias e localização podem identificar pessoas.'};
  await fs.writeFile(path.join(out,'manifesto.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});return manifest;
}
async function main(){
  const opts={};for(let i=2;i<process.argv.length;i++){const a=process.argv[i];if(['--admin','--create-salt','--technical'].includes(a))opts[a]=true;else{check(a.startsWith('--')&&process.argv[i+1],`Argumento inválido: ${a}`);opts[a]=process.argv[++i];}}
  check(!!opts['--snapshot']!==!!opts['--admin'],'Use --snapshot ARQUIVO ou --admin --project PROJETO');check(opts['--out']&&opts['--salt-file'],'Informe --out e --salt-file');
  const saltPath=path.resolve(opts['--salt-file']);check(!saltPath.split(path.sep).some(v=>['publicacao-github','waind-preview'].includes(v)),'Salt deve ficar fora do pacote público');
  if(opts['--create-salt']){await fs.mkdir(path.dirname(saltPath),{recursive:true});await fs.writeFile(saltPath,randomBytes(32),{flag:'wx',mode:0o600});}
  const salt=await fs.readFile(saltPath),qa=JSON.parse(await fs.readFile(path.join(root,'waind-preview/qa-ids.json'),'utf8').catch(e=>{if(e.code!=='ENOENT')throw e;return fs.readFile(path.join(root,'qa-ids.json'),'utf8');}));let collections;
  if(opts['--snapshot']){const snapshot=JSON.parse(await fs.readFile(opts['--snapshot'],'utf8'));collections=snapshot.collections||snapshot;}
  else{
    check(opts['--project'],'Informe --project');if(opts['--emulator']){check(/^(localhost|127\.0\.0\.1):\d+$/.test(opts['--emulator'])&&opts['--project'].startsWith('demo-'),'Emulador exige host local e projeto demo-');process.env.FIRESTORE_EMULATOR_HOST=opts['--emulator'];}
    const {initializeApp,applicationDefault}=await import('firebase-admin/app'),{getFirestore}=await import('firebase-admin/firestore');
    initializeApp({projectId:opts['--project'],...(opts['--emulator']?{}:{credential:applicationDefault()})});const db=getFirestore();collections={};
    for(const col of ['relatos_pesquisa','relatos_mapa','relatos_fotos']){const all={};let cursor;for(;;){let q=db.collection(col).orderBy('__name__').limit(100);if(cursor)q=q.startAfter(cursor);const page=await q.get();for(const doc of page.docs)all[doc.id]=doc.data();if(page.size<100)break;cursor=page.docs.at(-1);}collections[col]=all;}
  }
  const result=await exportDataset({collections,out:opts['--out'],salt,qa,meters:Number(opts['--group-meters']||100),minutes:Number(opts['--group-minutes']||120),source:opts['--snapshot']?'snapshot-local':opts['--emulator']?'emulador-tecnico':'firebase-admin',technical:!!opts['--technical']});console.log(JSON.stringify({registros:result.registros,fotos:result.fotos,excluidos:result.excluidos.length,destino:path.resolve(opts['--out'])}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
