/* Local Gaussian perception field + marching-squares contours. No ML inference. */
(() => {
  'use strict';
  const colors=['#0D9488','#65A30D','#D97706','#EA580C','#DC2626'];
  const rgb=colors.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function field(width,height,points,metersPerPixel){
    const step=4,cols=Math.ceil(width/step)+1,rows=Math.ceil(height/step)+1;
    const density=new Float32Array(cols*rows),red=new Float32Array(cols*rows),green=new Float32Array(cols*rows),blue=new Float32Array(cols*rows);
    for(const p of points){
      const level=clamp(Math.round(p.intensity),1,5),sigma=clamp((18+level*18)/metersPerPixel,5+level,140),radius=sigma*3;
      const x0=clamp(Math.floor((p.x-radius)/step),0,cols-1),x1=clamp(Math.ceil((p.x+radius)/step),0,cols-1);
      const y0=clamp(Math.floor((p.y-radius)/step),0,rows-1),y1=clamp(Math.ceil((p.y+radius)/step),0,rows-1),weight=.08+level*.23;
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const d2=(x*step-p.x)**2+(y*step-p.y)**2;if(d2>radius*radius)continue;
        const w=weight*Math.exp(-d2/(2*sigma*sigma)),i=y*cols+x;
        density[i]+=w;red[i]+=w*rgb[level-1][0];green[i]+=w*rgb[level-1][1];blue[i]+=w*rgb[level-1][2];
      }
    }
    return {cols,rows,step,density,red,green,blue};
  }
  function render(canvas,width,height,points,metersPerPixel){
    const ctx=canvas.getContext('2d');if(!ctx||!width||!height)return {points:0,maxDensity:0};
    const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!points.length)return {points:0,maxDensity:0};
    const f=field(width,height,points,metersPerPixel),{cols,rows,step,density,red,green,blue}=f;
    const small=document.createElement('canvas');small.width=cols;small.height=rows;
    const sc=small.getContext('2d'),im=sc.createImageData(cols,rows);let maxDensity=0;
    for(let i=0;i<density.length;i++){
      const d=density[i];maxDensity=Math.max(maxDensity,d);if(d<.005)continue;
      im.data[i*4]=red[i]/d;im.data[i*4+1]=green[i]/d;im.data[i*4+2]=blue[i]/d;im.data[i*4+3]=Math.round(255*.46*(1-Math.exp(-d*.95)));
    }
    sc.putImageData(im,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(small,0,0,cols*step,rows*step);
    const cases={1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[1,2]],5:[[3,0],[1,2]],6:[[0,2]],7:[[3,2]],8:[[2,3]],9:[[0,2]],10:[[0,1],[2,3]],11:[[1,2]],12:[[1,3]],13:[[0,1]],14:[[3,0]]};
    for(const threshold of [.08,.16,.28,.42,.64,.9,1.2,1.65,2.1,2.8]){
      if(threshold>maxDensity)break;ctx.beginPath();
      for(let y=0;y<rows-1;y++)for(let x=0;x<cols-1;x++){
        const i=y*cols+x,v=[density[i],density[i+1],density[i+cols+1],density[i+cols]];
        const code=v.reduce((n,z,k)=>n+(z>=threshold?1<<k:0),0);if(!code||code===15)continue;
        let pairs=cases[code];
        if((code===5||code===10)&&(v[0]+v[1]+v[2]+v[3])/4>=threshold)pairs=code===5?[[0,1],[2,3]]:[[3,0],[1,2]];
        const corners=[[x*step,y*step],[(x+1)*step,y*step],[(x+1)*step,(y+1)*step],[x*step,(y+1)*step]];
        const edge=e=>{const j=(e+1)%4,t=clamp((threshold-v[e])/(v[j]-v[e]||1),0,1);return [corners[e][0]+(corners[j][0]-corners[e][0])*t,corners[e][1]+(corners[j][1]-corners[e][1])*t];};
        for(const [a,b]of pairs){const p=edge(a),q=edge(b);ctx.moveTo(...p);ctx.lineTo(...q);}
      }
      ctx.strokeStyle=threshold>=.9?'rgba(71,62,49,.34)':'rgba(71,62,49,.20)';ctx.lineWidth=.55;ctx.stroke();
    }
    return {points:points.length,maxDensity};
  }
  window.OdorHeat=Object.freeze({field,render,colors});
})();
