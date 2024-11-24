import './zreturn.js';
globalThis.checkStatic = function(request){
    if(request.url.includes('google9b9ccfe85609fdf9.html')){
        return zfetch('https://files.servleteer.com/google9b9ccfe85609fdf9.html');  
    }
    if(request.url.split('?')[0].split('#')[0].endsWith('robots.txt')){
        return znewResponse( 
    `User-agent: *
    Allow: /`);
    }   
} 
  
