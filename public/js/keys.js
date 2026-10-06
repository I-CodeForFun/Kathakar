/* Key registry (A2): one table shared by browser (boot.js) and server (index.js). sf-* = synced, xl-* = device-local. */
(function(root,factory){if(typeof module=='object'&&module.exports)module.exports=factory();else root.KEYREG=factory()})(typeof self!='undefined'?self:this,function(){
const KEYS=[
 {id:'cur',re:/^sf-cur$/,sync:true,validate:'storykey',merge:'local'},
 {id:'sbc',re:/^sf-sbc$/,sync:true,validate:'short',merge:'local'},
 {id:'lib',re:/^sf-lib$/,sync:true,validate:'storykeys',merge:'union'},
 {id:'ui',re:/^sf-ui$/,sync:true,validate:'obj',merge:'ui'},
 {id:'snaps',re:/^sf-snaps-[\w-]+$/,sync:true,validate:'list',merge:'byId:id:40'},
 {id:'baks',re:/^sf-baks-[\w-]+$/,sync:true,validate:'list',merge:'byId:ts:8'},
 {id:'wlog',re:/^sf-wlog-[\w-]+$/,sync:true,validate:'wlog',merge:'maxPerKey'},
 {id:'story',re:/^sf[\w-]*$/,sync:true,validate:'story',merge:'ask'},   // last: anything else starting with sf is a story
 {id:'local',re:/^xl-[\w-]+$/,sync:false}];
const SK=/^[\w-]{1,64}$/;
const find=k=>KEYS.find(x=>x.re.test(k))||null;
const isSynced=k=>{const x=find(k);return !!(x&&x.sync)};
function check(k,v,SCHEMA){const x=find(k);if(!x||!x.sync)return 'unknown key';if(typeof v!='string')return 'body must be text';
 if(v.length>5e6)return 'too large';let j;
 switch(x.validate){
  case 'storykey':return SK.test(v)?'':'sf-cur must be a story key';
  case 'short':return v.length<=20?'':'bad value';}
 try{j=JSON.parse(v)}catch(e){return 'invalid JSON'}
 switch(x.validate){
  case 'storykeys':return Array.isArray(j)&&j.every(s=>typeof s=='string'&&SK.test(s))?'':'sf-lib must be a list of story keys';
  case 'obj':return j&&typeof j=='object'&&!Array.isArray(j)?'':k+' must be an object';
  case 'list':return Array.isArray(j)?'':'must be a list';
  case 'wlog':return j&&typeof j=='object'&&!Array.isArray(j)&&Object.entries(j).every(([d,o])=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&o&&typeof o=='object')?'':'bad word log';
  case 'story':{if(!SCHEMA)return '';const r=SCHEMA.validate(j);return r.errors.length?'invalid story: '+r.errors.join('; '):''}}
 return ''}
return{KEYS,find,isSynced,check}});
