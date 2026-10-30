/* GPT 0.6: reencodificação de pixels, sem copiar EXIF/GPS do arquivo original. */
(() => {
  'use strict';
  const MAX_BYTES=143360,MAX_BASE64=200000;
  const fail=message=>{throw new Error(message);};
  const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  const encode=async(canvas,mime,q)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível comprimir a imagem.')),mime,q));
  function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}
  async function process(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8388608||!file.size)fail('Escolha uma foto JPG, PNG ou WebP de até 8 MB.');
    if(!crypto.subtle)fail('O navegador precisa de conexão segura para preparar a fotografia.');
    const url=URL.createObjectURL(file),img=new Image(),canvas=document.createElement('canvas');
    try{
      img.src=url;await img.decode();const originalWidth=img.naturalWidth,originalHeight=img.naturalHeight;
      if(!originalWidth||!originalHeight||originalWidth>12000||originalHeight>12000)fail('A imagem deve ter dimensões de até 12000 × 12000 pixels.');
      let scale=Math.min(1,640/Math.max(originalWidth,originalHeight)),blob;
      for(let attempt=0;attempt<8;attempt++){
        canvas.width=Math.max(1,Math.round(originalWidth*scale));canvas.height=Math.max(1,Math.round(originalHeight*scale));
        const ctx=canvas.getContext('2d');if(!ctx)fail('Seu navegador não conseguiu preparar a imagem.');
        ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
        for(const quality of [.76,.66,.56]){
          blob=await encode(canvas,'image/webp',quality);
          if(blob.type!=='image/webp')blob=await encode(canvas,'image/jpeg',quality);
          if(!['image/webp','image/jpeg'].includes(blob.type))fail('O navegador não oferece compressão WebP ou JPEG.');
          if(blob.size<=MAX_BYTES&&Math.ceil(blob.size/3)*4<=MAX_BASE64)break;
        }
        if(blob.size<=MAX_BYTES&&Math.ceil(blob.size/3)*4<=MAX_BASE64)break;
        scale*=.8;
      }
      if(!blob?.size||blob.size>MAX_BYTES)fail('Não foi possível reduzir a foto ao limite. Escolha outra imagem.');
      const bytes=new Uint8Array(await blob.arrayBuffer()),sha256=await digest(bytes),dataBase64=base64(bytes);
      return {blob,photo:{name:`waind-${sha256.slice(0,16)}.${blob.type==='image/webp'?'webp':'jpg'}`,type:blob.type,sizeBytes:blob.size,width:canvas.width,height:canvas.height,originalWidth,originalHeight,sha256,dataBase64,retention:'private-research',visionAnalysis:null}};
    }finally{URL.revokeObjectURL(url);img.removeAttribute('src');canvas.width=canvas.height=0;}
  }
  async function validate(photo){
    if(!photo||!['image/webp','image/jpeg'].includes(photo.type)||!Number.isInteger(photo.sizeBytes)||photo.sizeBytes<1||photo.sizeBytes>MAX_BYTES||!/^([a-f0-9]{64})$/.test(photo.sha256||''))fail('Fotografia processada inválida.');
    for(const [value,max] of [[photo.width,640],[photo.height,640],[photo.originalWidth,12000],[photo.originalHeight,12000]])if(!Number.isInteger(value)||value<1||value>max)fail('Dimensões da fotografia inválidas.');
    const s=photo.dataBase64;if(typeof s!=='string'||!s.length||s.length>MAX_BASE64||s.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(s))fail('Dados da fotografia ausentes ou inválidos.');
    const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));if(bytes.length!==photo.sizeBytes||await digest(bytes)!==photo.sha256)fail('A integridade da fotografia não confere.');
  }
  function compact(report){
    if(report.photo&&report.syncStatus==='sincronizado'&&report.cloud?.confirmed){report.photo={...report.photo,storedIn:'relatos_fotos',imageSent:true};delete report.photo.dataBase64;}
    return report;
  }
  window.WaindPhoto=Object.freeze({process,validate,compact,MAX_BYTES,MAX_BASE64});
})();
