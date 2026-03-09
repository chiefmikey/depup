'use strict';
/**
 * @license Angular
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
var T=Object.defineProperty;var h=(c,e,n)=>e in c?T(c,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):c[e]=n;var s=(c,e,n)=>(h(c,typeof e!="symbol"?e+"":e,n),n);function o(c){class e{constructor(t){s(this,"runZone",c.current);s(this,"name");this.name="syncTestZone for "+t}onScheduleTask(t,u,a,r){switch(r.type){case"microTask":case"macroTask":throw new Error(`Cannot call ${r.source} from within a sync test (${this.name}).`);case"eventTask":r=t.scheduleTask(a,r);break}return r}}c.SyncTestZoneSpec=e}o(Zone);
