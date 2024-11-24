//@ts-check
import './zreturn.js';


globalThis.headerIncludes=function(request,header,content){
  try{
    return request.headers.get(header).toLowerCase().includes(content);
  }catch(e){
    return false;
  }
}

globalThis.serializeHTTP=function(re){
    let reDTO=Object.create(null);
    reDTO.headers={};
    for(let a in re){
      if((re[a]===null)||(a=='headers')||(a=='fetcher')||(a=='signal')){continue;}
      reDTO[a]=re[a];
      if(typeof a == 'function'){continue;}
    }
    let reHeaders=(new Map(re.headers));
    for(let h of reHeaders){
      if(typeof h == 'function'){continue;}
      reDTO.headers[`${h}`.replace(/[^a-zA-Z]+/g,'-').replace(/[-]$/,'')] = reHeaders[`${h}`];
    }
    re.headers.forEach((value, key) => {
        reDTO.headers[`${key}`.replace(/[^a-zA-Z]+/g,'-').replace(/[-]$/,'')]=`${value}`;
    });
  return reDTO;
}


globalThis.cleanResponse=function(response) {
  response.headers.delete('Access-Control-Allow-Origin');
  response.headers.set('Access-Control-Allow-Origin', "*");
  response.headers.delete('Access-Control-Allow-Methods');
  response.headers.delete('Access-Control-Allow-Headers');
  response.headers.delete('Access-Control-Allow-Credentials');
  response.headers.delete('Access-Control-Max-Age');
  response.headers.delete('Referrer-Policy');
  response.headers.delete('Content-Security-Policy');
  response.headers.delete('X-Frame-Options');
  response.headers.delete('Strict-Transport-Security');
  response.headers.delete('X-Content-Type-Options');
  response.headers.delete('Cross-Origin-Embedder-Policy');
  response.headers.delete('Cross-Origin-Resource-Policy');
  response.headers.delete('Cross-Origin-Opener-Policy');
  response.headers.delete('content-security-policy-report-only');
  response.headers.delete('cross-origin-opener-policy-report-only');
  return response;
}

globalThis.createHostMap=function(mapObj){
  if(globalThis.hostMap){
    return globalThis.hostMap;
  } 
  mapObj.get=(key)=>{
    if(mapObj[key]){
      return mapObj[key];
    }
    if(mapObj.default){
        return mapObj.default;      
    }
    const last = Object.keys(mapObj)[0];
    if(last){
        return mapObj[last];
    }
    return "script.google.com";
  }
  return mapObj;
}

globalThis.getNewHost=function(request){
    const workerHost = request.url.split('/')[2];
    let host = globalThis.hostMap.get(workerHost)[0];
    if (headerIncludes(request,'referer','hostname=')){ 
      host = request.headers.get('referer').toLowerCase().split('hostname=')[1].split('?')[0].split('&')[0].split('#')[0];
    }
    if (request.url.toLowerCase().includes('hostname=')) { 
      host = request.url.toLowerCase().split('hostname=')[1].split('?')[0].split('&')[0].split('#')[0]; 
    }
    return host;
}


globalThis.addCacheHeaders=function(re){
    re.headers.set('Cloudflare-CDN-Cache-Control', 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000');
    re.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000');
    re.headers.set('CDN-Cache-Control', 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000');
    re.headers.set('Cache-Control', 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000');
    re.headers.set('Surrogate-Control', 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000');
    return re;
}

globalThis.addCacheObjectHeaders=function(obj){
    const objType = `${obj.constructor}`.toLowerCase();
    if(objType.includes('request')||objType.includes('response')){
        obj = serializeHTTP(obj);
        obj.redirect = 'follow'; 
        obj.headers.redirect = 'follow';
    }
    obj.headers['Cloudflare-CDN-Cache-Control'] = 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    obj.headers['Vercel-CDN-Cache-Control'] = 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    obj.headers['CDN-Cache-Control'] = 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    obj.headers['Cache-Control'] = 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    obj.headers['Surrogate-Control'] = 'public, max-age=96400, s-max-age=96400, stale-if-error=31535000, stale-while-revalidate=31535000';
    return obj;
}

globalThis.addRequestHeaders = function(url, workerHost, request){
    let re = serializeHTTP(request);
    re.redirect = 'follow'; 
    re.headers.redirect = 'follow';
    const keys = Object.keys(re.headers);
    const keys_length = keys.length;
    for(let i=0;i<keys_length;i++){
        if(re.headers[keys[i]]){
            re.headers[keys[i]] = re.headers[keys[i]].replace(workerHost,url.host);
        }
    }
    re.headers['Bot-Protection']=request.url;
    re.headers[workerHost.replaceAll('.','-')] = workerHost;
    re = addCacheObjectHeaders(re);
    request = addCacheHeaders(znewRequest(url.toString(),re));
    return request;
}

globalThis.addResponseHeaders = function(url, workerHost, res){
    if(res.headers){
      res.headers.forEach((value, key) => {
          if (key.toLowerCase() != 'content-length') { res.headers.set(key, value.replace(url.host, workerHost)); }
      });
    }
    if(`${url}`.toLowerCase().includes('preload=script')){
      res.headers.set('content-type','script');
    }
    return addCacheHeaders(cleanResponse(znewResponse(res.body, res)));
}

globalThis.requestRetry = async function(url, workerHost, request) {
    url.host = globalThis.hostMap.get(workerHost)[1];
    let req = znewRequest(url.toString(), request);
    let res = await zfetch(req);
    res = znewResponse(res.body, res);
    res.headers.forEach((value, key) => {
      res.headers.set(key, value.replace(url.host, workerHost));
      res.headers.delete('content-length');
      res.headers.delete('transfer-encoding');
    });
    return res;
  }

  function defineNonenumerable(obj,prop,val){
    Object.defineProperty(obj, prop, {
    value: val,
    writable: true,
    configurable: true,
    enumerable: false
  });
}
  defineNonenumerable(String.prototype,'includesAny' , function(arr) {
    let arr_length = arr.length;
    for (let i = 0; i < arr_length; i++) {
        if (this.includes(arr[i])) {
            return true;
        }
    }
    return false;
});
