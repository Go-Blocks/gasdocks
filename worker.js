
import './zreturn.js';
import './base.js';
import './static.js';
import './injects.js';
import './html.js';
import './pako.js';
 
globalThis.gasResponse =  function(body,options){
  let obj = {}
  if(options){
      obj.headers=options.headers;
      if(options.headers.has('Content-Disposition')){
          obj.status = options.headers.get('Content-Disposition').split('filename="')['1'].split('"')[0];
      }
  }
  let image = false;
  let ct = '';
  if(`${obj.status}`.includes('image')||`${obj.status}`.includes('img')){
    image = true
    ct=obj.status;
    obj.status = 200;          
   } 
 let res = znewResponse(body,obj);
 if(image){
  res.headers.set('content-type',ct.replace('-','/'));         
  res.image=true; 
 } 
 return res;
} 

export default {
  fetch(request, env, ctx) {
    let response = zonRequest(request, env, ctx);
    ctx.waitUntil(response)
    return response
  },
  async scheduled(event, env, ctx) {
    let response = zonRequest(event, env, ctx);
    ctx?.waitUntil?.(response)
    return response
  },
};



globalThis.hostMap = createHostMap({
  "default": ["script.google.com", "developers.google.com"]
});



async function zonRequest(request, env, ctx) {
    try {
      return await onRequest(request, env, ctx);
  } catch (e) {
      console.log(e);
      return znewResponse(arguments[0]+'\n'+e.message+'\n'+e.stack, {
          status: 569,
          statusText: e.message
      });
  }
}

async function onRequest(request, env, ctx) {
  let staticRes = checkStatic(request);
  if(staticRes){return staticRes}
  let gasURL = 'https://script.google.com/macros/s/AKfycbzK058kcqn4hsqbhcy8S3PquOPQLLfbisWnI1CTVQR_ypY4npmkAknKhNHN-x2ZZwB_/exec';
  let url = new URL(request.url);
  const path = encodeURIComponent(`${url.pathname}${url.search}`.replace('/',''));
  let workerHost = url.host;
  if(url.pathname.split('#')[0].split('?')[0].length<2){
    return new Response('301',{status:301,headers:{location:`https://${url.host}/apps-script/`}});
  }
  url.host = getNewHost(request);
  let req = znewRequest(`${gasURL}?${path}`, request);
  let res = await zfetch(req);
  
  res = gasResponse(res.body, res);
  while(res.headers.has('location')){
    res = await zfetch(res.headers.get('location'));
    res = gasResponse(res.body, res);
  }

  if (res.status > 399) {
    res = await requestRetry(url, workerHost, request);
  }
  
  if(parseInt(res.headers.get('content-length'))>20000){
    return  addResponseHeaders(url, workerHost,res);
  }
  const contentType = `${res.headers.get('Content-Type')}`.toLowerCase();
  if(contentType.includes('vcard')){
    res.headers.set('Content-Type',contentType.replace('vcard','html'));
  }
  if(contentType.includes('csv')){
    res.headers.set('Content-Type',contentType.replace('csv','css'));
  }
  const importJSURL='https://patrick-ring-motive.github.io/baseline/static/imports.js';
  const importCSSURL="https://patrick-ring-motive.github.io/baseline/static/colors.css";
  if (`${res.headers.get('content-type')}`.toLowerCase().includesAny(['html','xml'])) {
    res = await htmlInject(res,
      `${makeStyle(importCSSURL)}
       ${makeScript(importJSURL)}
       <script>
       if(globalThis.hostTargetList){hostTargetList.push("${url.host}");hostTargetList.push("developers.google.com");}
       else{globalThis.hostTargetList=["${url.host}","developers.google.com"];}
       </script>
       <style>html{background-color:white;filter:invert(1);}</style>`
      );
      if(request.url.split('?')[0].split('#')[0].toLowerCase().endsWith('.svg')){
        res.headers.set('content-type','image/svg+xml');
      }
  }
  if (`${res.headers.get('content-type')}`.toLowerCase().includes('script')
      &&(!request.url.toLowerCase().includes('sw.js'))) {
    res = await scriptInject(res,
    `if(globalThis.hostTargetList){hostTargetList.push("${url.host}");}
    else{globalThis.hostTargetList=["${ globalThis.hostMap.get(workerHost)[0]}","${ globalThis.hostMap.get(workerHost)[1]}"];}
    if(!globalThis['${importJSURL}']){
      import('${importJSURL}');
    }
    globalThis['${importJSURL}']='${importJSURL}';
    `);
  }
  if (`${res.headers.get('content-type')}`.toLowerCase().includes('calendar')||res.image){
    let resBody = await res.text();
    let arrBody = pako.inflate(decodeBase64(resBody));//new Uint8Array((JSON.parse(resBody)));
    res = new Response(arrBody,res);
  }
  res.headers.delete('Content-Disposition');
  return cleanResponse(addResponseHeaders(url, workerHost,res));
}

function zatob(str){
  str=`${str}`;
  try{
    return atob(str);
  }catch(e){
    try{
      return btoa(str)
    }catch(e){
      return str;
    }
  }
}

function decodeBase64(str){
  str = zatob(str);
  const len = str.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes.buffer;
}
