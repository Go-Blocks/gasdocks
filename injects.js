import './zreturn.js';

globalThis.htmlInject=async function(res,injects){
    
        let resBody = await res.text();

        if((/<\/head>/i).test(resBody)){
            resBody = resBody.replace((/(<\/head>)/i), `${injects}$1`);
        }else if((/<\/svg>/i).test(resBody)){
            resBody = resBody.replace((/(<\/svg>)/i), `${injects}$1`);
        }else{
            resBody = injects+resBody;
        }
    
        res = znewResponse(resBody, res);
      
    return res;
}

globalThis.scriptInject = async function(res,injects){
    
    let resBody = await res.text();

        resBody = resBody+`
        /* start */
        ${injects}`;


    res = znewResponse(resBody, res);
  
    return res;
}

