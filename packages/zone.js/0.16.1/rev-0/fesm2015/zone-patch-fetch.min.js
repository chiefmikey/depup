'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function _(A){A.__load_patch("fetch",(s,l,f)=>{let u=s.fetch;if(typeof u!="function")return;let y=s[f.symbol("fetch")];y&&(u=y);let P=s.Promise,T=f.symbol("thenPatched"),m=f.symbol("fetchTaskScheduling"),h=s.Response,g=function(){},b=(t,n,e,c,d,r)=>new Promise((p,v)=>{let a=l.current.scheduleMacroTask(t,g,n,()=>{let i,k=l.current;try{k[m]=!0,i=e.apply(c,d)}catch(o){v(o);return}finally{k[m]=!1}if(!(i instanceof P)){let o=i.constructor;o[T]||f.patchThen(o)}i.then(o=>{a.state!=="notScheduled"&&a.invoke(),p(o)},o=>{a.state!=="notScheduled"&&a.invoke(),v(o)})},()=>{r==null||r.abort()})});s.fetch=function(){let t=Array.prototype.slice.call(arguments),n=t.length>1?t[1]:{},e=n==null?void 0:n.signal,c=new AbortController,d=c.signal;n.signal=d,t[1]=n;let r;if(e){let p=e[l.__symbol__("addEventListener")]||e.addEventListener;r=()=>c.abort(),p.call(e,"abort",r,{once:!0})}return b("fetch",{fetchArgs:t},u,this,t,c).finally(()=>{e==null||e.removeEventListener("abort",r)})},h!=null&&h.prototype&&["arrayBuffer","blob","formData","json","text"].filter(t=>typeof h.prototype[t]=="function").forEach(t=>{f.patchMethod(h.prototype,t,n=>(e,c)=>b(`Response.${t}`,void 0,n,e,c,void 0))})})}_(Zone);
