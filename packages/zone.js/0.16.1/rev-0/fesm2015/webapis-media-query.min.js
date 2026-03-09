'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
function u(d){d.__load_patch("mediaQuery",(i,y,o)=>{function p(r){o.patchMethod(r,"addListener",n=>(c,e)=>{let t=e.length>0?e[0]:null;if(typeof t=="function"){let a=y.current.wrap(t,"MediaQuery");return t[o.symbol("mediaQueryCallback")]=a,n.call(c,a)}else return n.apply(c,e)})}function l(r){o.patchMethod(r,"removeListener",n=>(c,e)=>{let t=e.length>0?e[0]:null;if(typeof t=="function"){let a=t[o.symbol("mediaQueryCallback")];return a?n.call(c,a):n.apply(c,e)}else return n.apply(c,e)})}if(i.MediaQueryList){let r=i.MediaQueryList.prototype;p(r),l(r)}else i.matchMedia&&o.patchMethod(i,"matchMedia",r=>(n,c)=>{let e=r.apply(n,c);if(e){let t=Object.getPrototypeOf(e);t&&t.addListener?(p(t),l(t),p(e),l(e)):e.addListener&&(p(e),l(e))}return e})})}u(Zone);
