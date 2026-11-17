import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const DATA=path.resolve(process.env.STUDIO_DATA_DIR||path.join(ROOT,"data"));
const PORT=Number(process.env.PORT||8787),HOST=process.env.HOST||"127.0.0.1";
const sessions=new Map(),states=new Map();fs.mkdirSync(DATA,{recursive:true});
const json=(r,s,b)=>{r.writeHead(s,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"});r.end(JSON.stringify(b));};
const body=async req=>{let x="";for await(const c of req){x+=c;if(x.length>8e6)throw Error("Payload terlalu besar");}return x?JSON.parse(x):{};};
const getSession=req=>{const m=(req.headers.cookie||"").match(/dn_studio_session=([a-f0-9]{64})/);if(!m)return null;const s=sessions.get(m[1]);if(!s||s.expires<Date.now()){sessions.delete(m[1]);return null;}s.expires=Date.now()+432e5;return s;};
const auth=(req,res)=>{const s=getSession(req);if(!s)json(res,401,{error:"Login GitHub diperlukan"});return s;};
const gh=async(token,url,opts={})=>{const r=await fetch("https://api.github.com"+url,{...opts,headers:{accept:"application/vnd.github+json",authorization:"Bearer "+token,"x-github-api-version":"2022-11-28",...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||"GitHub API "+r.status);return d;};
const pfile=id=>path.join(DATA,"projects",id+".json");
const save=p=>{const dir=path.join(DATA,"projects");fs.mkdirSync(dir,{recursive:true});const f=pfile(p.id),tmp=f+".tmp";fs.writeFileSync(tmp,JSON.stringify(p,null,2),{mode:0o600});fs.renameSync(tmp,f);};
const staticFile=(res,url)=>{const rel=url==="/"?"index.html":decodeURIComponent(url.slice(1)),f=path.resolve(ROOT,rel);if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory())return false;const ext=path.extname(f),types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json"};res.writeHead(200,{"content-type":types[ext]||"application/octet-stream","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"});fs.createReadStream(f).pipe(res);return true;};
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,"http://localhost");
 if(req.method==="GET"&&u.pathname==="/api/health")return json(res,200,{ok:true,app:"Dicky News Design Studio Professional",version:"3.0.0"});
 if(req.method==="GET"&&u.pathname==="/auth/github"){
  if(!process.env.GITHUB_CLIENT_ID)return json(res,503,{error:"GitHub OAuth belum dikonfigurasi"});
  const state=crypto.randomBytes(24).toString("hex");states.set(state,Date.now()+600000);
  const x=new URL("https://github.com/login/oauth/authorize");x.searchParams.set("client_id",process.env.GITHUB_CLIENT_ID);x.searchParams.set("redirect_uri",process.env.GITHUB_CALLBACK_URL||process.env.STUDIO_BASE_URL+"/auth/github/callback");x.searchParams.set("scope","repo read:user");x.searchParams.set("state",state);res.writeHead(302,{location:x.toString()});return res.end();
 }
 if(req.method==="GET"&&u.pathname==="/auth/github/callback"){
  const state=u.searchParams.get("state"),expires=states.get(state);states.delete(state);if(!expires||expires<Date.now())return json(res,400,{error:"OAuth state tidak valid"});
  const tr=await fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{accept:"application/json","content-type":"application/json"},body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,code:u.searchParams.get("code"),redirect_uri:process.env.GITHUB_CALLBACK_URL||process.env.STUDIO_BASE_URL+"/auth/github/callback",state})});
  const td=await tr.json();if(!tr.ok||!td.access_token)return json(res,401,{error:"Autentikasi GitHub gagal"});
  const profile=await gh(td.access_token,"/user"),sid=crypto.randomBytes(32).toString("hex");sessions.set(sid,{token:td.access_token,user:{login:profile.login,id:profile.id,avatar_url:profile.avatar_url},expires:Date.now()+432e5});
  res.writeHead(302,{location:"/", "set-cookie":`dn_studio_session=${sid}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=43200`});return res.end();
 }
 if(req.method==="GET"&&u.pathname.startsWith("/api/")){
  const s=auth(req,res);if(!s)return;
  if(u.pathname==="/api/me")return json(res,200,{user:s.user});
  if(u.pathname==="/api/repos")return json(res,200,await gh(s.token,"/user/repos?per_page=100&sort=updated"));
  if(u.pathname==="/api/projects"){const dir=path.join(DATA,"projects");fs.mkdirSync(dir,{recursive:true});const all=fs.readdirSync(dir).filter(x=>x.endsWith(".json")).map(x=>JSON.parse(fs.readFileSync(path.join(dir,x),"utf8"))).filter(p=>p.owner===s.user.login);return json(res,200,{projects:all.map(({id,name,updatedAt,source})=>({id,name,updatedAt,source}))});}
 }
 if(req.method==="POST"&&u.pathname.startsWith("/api/")){
  const s=auth(req,res);if(!s)return;const b=await body(req);
  if(u.pathname==="/api/projects"){const p={id:crypto.randomUUID(),owner:s.user.login,name:String(b.name||"Proyek baru").slice(0,120),source:b.source||null,files:b.files||{},versions:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};save(p);return json(res,201,{project:p});}
  const m=u.pathname.match(/^\/api\/projects\/([\w-]+)\/(save|snapshot|restore)$/);
  if(m){const f=pfile(m[1]);if(!fs.existsSync(f))return json(res,404,{error:"Proyek tidak ditemukan"});const p=JSON.parse(fs.readFileSync(f,"utf8"));if(p.owner!==s.user.login)return json(res,403,{error:"Akses ditolak"});
   if(m[2]==="save"){p.files=b.files||p.files;p.name=String(b.name||p.name).slice(0,120);p.updatedAt=new Date().toISOString();save(p);return json(res,200,{ok:true,updatedAt:p.updatedAt});}
   if(m[2]==="snapshot"){p.versions.push({id:crypto.randomUUID(),label:String(b.label||"Snapshot").slice(0,120),createdAt:new Date().toISOString(),files:p.files});if(p.versions.length>100)p.versions.shift();save(p);return json(res,201,{versions:p.versions.map(v=>({id:v.id,label:v.label,createdAt:v.createdAt}))});}
   const v=p.versions.find(x=>x.id===b.versionId);if(!v)return json(res,404,{error:"Versi tidak ditemukan"});p.files=v.files;p.updatedAt=new Date().toISOString();save(p);return json(res,200,{ok:true,files:p.files});
  }
  if(u.pathname==="/api/github/commit"){const {owner,repo,branch,path:rp,content,message}=b;if(![owner,repo,branch,rp].every(x=>typeof x==="string"&&x.length<240)||typeof content!=="string")return json(res,400,{error:"Parameter commit tidak valid"});const ep=`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${rp.split("/").map(encodeURIComponent).join("/")}`;const old=await gh(s.token,ep+"?ref="+encodeURIComponent(branch)).catch(()=>null);const payload={message:String(message||"Update via Dicky News Design Studio"),content:Buffer.from(content).toString("base64"),branch};if(old?.sha)payload.sha=old.sha;const result=await gh(s.token,ep,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});return json(res,200,{commit:result.commit?.sha,path:result.content?.path});}
 }
 if(req.method==="GET"&&!u.pathname.startsWith("/api/")&&staticFile(res,u.pathname))return;
 return json(res,404,{error:"Not found"});
 }catch(e){return json(res,500,{error:e.message||"Internal server error"});}});
server.listen(PORT,HOST,()=>console.log(`Design Studio listening on http://${HOST}:${PORT}`));