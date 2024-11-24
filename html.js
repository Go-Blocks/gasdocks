globalThis.makeScript=function(url){
    return `<script src="${url}" href="${url}" ></script>`;
}

globalThis.makeStyle=function(url){
    return `<link rel="stylesheet" href="${url}"></link>
    <style>@import "${url}";</style>
    <link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="${url}" type="text/css"></link>`;
}
