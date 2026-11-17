import assert from "node:assert/strict";
const base=process.env.STUDIO_TEST_URL||"http://127.0.0.1:8787";
const health=await fetch(base+"/api/health");
assert.equal(health.status,200,"health endpoint must be available");
assert.equal((await health.json()).ok,true,"health response must be ok");
const page=await fetch(base+"/");
assert.equal(page.status,200,"editor page must be served");
const html=await page.text();
for(const marker of ["PROYEK LOKAL","STRUKTUR / LAYERS","Ekspor HTML","CAKUPAN PERUBAHAN","Terapkan Universal","data-dn-style-mobile","data-dn-style-tablet","customStepPx","Geser elemen sesuai langkah custom","Atur ukuran sesuai langkah custom"])assert.ok(html.includes(marker),"missing UI marker: "+marker);
for(const endpoint of ["/api/me","/api/projects","/api/projects/12345678"]){
 const r=await fetch(base+endpoint);
 assert.equal(r.status,401,"unauthenticated access must be rejected: "+endpoint);
}
const csrf=await fetch(base+"/api/projects",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:"test"})});
assert.equal(csrf.status,403,"cross-origin or missing-origin write must be rejected");
console.log("Smoke tests passed: health, editor shell, auth boundary, CSRF origin guard.");
