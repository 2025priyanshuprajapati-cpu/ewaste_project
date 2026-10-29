/* ---------- In-memory data (same rows as the ewaste_db tables) ---------- */
const T=(k,r)=>r.map(v=>Object.fromEntries(k.map((x,i)=>[x,v[i]])));
const db={
 center:T(['center_id','center_name','city','capacity_kg'],[[1,'GreenCycle Andheri Hub','Mumbai',5000],[2,'EcoPoint Thane Center','Thane',3000],[3,'CleanTech Pune Depot','Pune',4000]]),
 collector:T(['collector_id','collector_name','center_id'],[[1,'Ramesh Patil',1],[2,'Suresh Yadav',1],[3,'Imran Shaikh',2],[4,'Vikas More',3],[5,'Prakash Jadhav',3]]),
 category:T(['category_id','category_name','hazard_level','rate_per_kg'],[[1,'Mobile Phones','Medium',120],[2,'Laptops and Computers','Medium',90],[3,'Batteries','High',60],[4,'CRT Monitors and TVs','High',25],[5,'Printers and Cartridges','Low',30],[6,'Cables and Chargers','Low',45]]),
 donor:T(['donor_id','donor_name','donor_type','phone','city'],[[1,'Aarav Sharma','Individual','9001000001','Mumbai'],[2,'Priya Nair','Individual','9001000002','Mumbai'],[3,'TechNova Pvt Ltd','Organization','9001000003','Mumbai'],[4,'Rahul Verma','Individual','9001000004','Thane'],[5,'Sunrise College','Organization','9001000005','Thane'],[6,'Neha Joshi','Individual','9001000006','Pune'],[7,'InfoSys Hub','Organization','9001000007','Pune'],[8,'Kiran Patel','Individual','9001000008','Mumbai']]),
 pickup:T(['pickup_id','donor_id','collector_id','center_id','pickup_date','status'],[[1,1,1,1,'2026-08-03','Completed'],[2,2,2,1,'2026-08-05','Completed'],[3,3,1,1,'2026-08-10','Completed'],[4,4,3,2,'2026-08-12','Completed'],[5,5,3,2,'2026-08-18','Completed'],[6,6,4,3,'2026-09-02','Completed'],[7,7,5,3,'2026-09-06','Completed'],[8,8,2,1,'2026-09-15','Cancelled'],[9,3,1,1,'2026-09-20','Completed'],[10,1,2,1,'2026-10-14','Scheduled']]),
 item:T(['pickup_id','category_id','quantity','weight_kg'],[[1,1,3,.9],[1,3,4,1.2],[2,2,1,2.5],[2,6,10,2],[3,2,20,60],[3,5,5,40],[3,3,30,25],[4,4,2,30],[4,1,5,1.5],[5,2,15,45],[5,4,6,90],[5,5,3,24],[6,1,4,1.2],[6,6,8,1.6],[7,2,25,75],[7,3,50,40],[9,2,10,30],[9,1,12,3.6],[10,1,2,.6]]),
 recycler:T(['recycler_id','recycler_name','license_no','city'],[[1,'Eco Recyclers India','MPCB-ER-1001','Mumbai'],[2,'GreenTech Metals','MPCB-GT-2002','Navi Mumbai'],[3,'Re-Sustainability Ltd','MPCB-RS-3003','Pune']]),
 batch:T(['batch_id','center_id','recycler_id','category_id','weight_kg','recovered_kg','dispatch_date','status'],[[1,1,1,2,92.5,78.6,'2026-09-01','Processed'],[2,1,2,3,26.2,21,'2026-09-05','Processed'],[3,2,1,4,120,84,'2026-09-10','Processed'],[4,3,3,2,75,63.75,'2026-09-25','Processed'],[5,1,1,5,40,0,'2026-10-01','Dispatched']])
};

/* ---------- Helpers ---------- */
const $=s=>document.querySelector(s);
const nm=(t,id,f)=>(db[t].find(r=>r[t+'_id']==id)||{})[f];
const sum=a=>a.reduce((x,y)=>x+y,0);
const f2=n=>Number(n).toFixed(2);
const nextId=t=>Math.max(0,...db[t].map(r=>r[t+'_id']))+1;
const opts=(t,f)=>db[t].map(r=>`<option value="${r[t+'_id']}">${r[f]}</option>`).join('');
const tag=s=>`<span class="tag ${s}">${s}</span>`;
const tbl=(h,rows)=>`<div class="card" style="overflow-x:auto"><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
function toast(msg,ok){const t=$('#toast');t.textContent=msg;t.style.background=ok?'#16a34a':'#dc2626';t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',3500)}

/* Equivalents of the SQL views */
const completedItems=c=>db.pickup.filter(p=>p.status==='Completed'&&(c==null||p.center_id==c)).flatMap(p=>db.item.filter(i=>i.pickup_id==p.pickup_id));
const stock=c=>{const inn=sum(completedItems(c).map(i=>i.weight_kg)),out=sum(db.batch.filter(b=>b.center_id==c).map(b=>b.weight_kg));return{inn,out,bal:inn-out}};
const pickupKg=id=>sum(db.item.filter(i=>i.pickup_id==id).map(i=>i.weight_kg));
const pickupVal=id=>sum(db.item.filter(i=>i.pickup_id==id).map(i=>i.weight_kg*nm('category',i.category_id,'rate_per_kg')));

/* ---------- Views ---------- */
const views={
 dash(){
  const all=db.item,rec=sum(db.batch.map(b=>b.recovered_kg));
  const per=db.category.map(c=>({n:c.category_name,kg:sum(all.filter(i=>i.category_id==c.category_id).map(i=>i.weight_kg))})).sort((a,b)=>b.kg-a.kg);
  const mx=per[0].kg||1;
  return `<h2>Dashboard</h2>
  <div class="kpis">
   <div class="card kpi"><span>Registered donors</span><b>${db.donor.length}</b></div>
   <div class="card kpi"><span>Completed pickups</span><b>${db.pickup.filter(p=>p.status==='Completed').length}</b></div>
   <div class="card kpi"><span>Total e-waste (kg)</span><b>${f2(sum(all.map(i=>i.weight_kg)))}</b></div>
   <div class="card kpi"><span>Material recovered (kg)</span><b>${f2(rec)}</b></div>
  </div>
  <div class="grid2">
   <div class="card"><h3>Weight by category</h3>${per.map(p=>`<div class="bar"><span>${p.n}</span><i style="width:${p.kg/mx*180}px"></i><span>${f2(p.kg)} kg</span></div>`).join('')}</div>
   <div class="card"><h3>Recovery % by batch</h3>${db.batch.filter(b=>b.status==='Processed').map(b=>{const p=(b.recovered_kg/b.weight_kg*100).toFixed(1);return `<div class="bar"><span>${nm('recycler',b.recycler_id,'recycler_name')}</span><i style="width:${p*1.6}px"></i><span>${p}%</span></div>`}).join('')}</div>
  </div>`;
 },
 donors(){
  return `<h2>Donors</h2>
  <form onsubmit="addDonor(event)">
   <input name="donor_name" placeholder="Donor name">
   <select name="donor_type"><option>Individual</option><option>Organization</option></select>
   <input name="phone" placeholder="Phone">
   <input name="city" placeholder="City">
   <button class="btn">Add donor</button>
  </form>
  ${tbl(['ID','Name','Type','Phone','City','Completed pickups',''],db.donor.map(d=>[d.donor_id,d.donor_name,d.donor_type,d.phone,d.city,db.pickup.filter(p=>p.donor_id==d.donor_id&&p.status==='Completed').length,`<button class="btn s r" onclick="delDonor(${d.donor_id})">Delete</button>`]))}`;
 },
 pickups(){
  return `<h2>Pickups</h2>
  <form onsubmit="addPickup(event)">
   <select name="donor_id">${opts('donor','donor_name')}</select>
   <select name="collector_id">${db.collector.map(c=>`<option value="${c.collector_id}">${c.collector_name} (${nm('center',c.center_id,'center_name')})</option>`).join('')}</select>
   <input type="date" name="pickup_date" value="2026-10-30">
   <select name="category_id">${opts('category','category_name')}</select>
   <input type="number" name="quantity" placeholder="Quantity">
   <input type="number" step="0.01" name="weight_kg" placeholder="Weight (kg)">
   <button class="btn">Schedule pickup</button>
  </form>
  ${tbl(['ID','Donor','Collector','Center','Date','Status','kg','Est. value (₹)','Actions'],db.pickup.map(p=>[p.pickup_id,nm('donor',p.donor_id,'donor_name'),nm('collector',p.collector_id,'collector_name'),nm('center',p.center_id,'center_name'),p.pickup_date,tag(p.status),f2(pickupKg(p.pickup_id)),f2(pickupVal(p.pickup_id)),(p.status==='Scheduled'?`<button class="btn s" onclick="setStatus(${p.pickup_id},'Completed')">Complete</button><button class="btn s a" onclick="setStatus(${p.pickup_id},'Cancelled')">Cancel</button>`:'')+`<button class="btn s r" onclick="delPickup(${p.pickup_id})">Delete</button>`]))}`;
 },
 batches(){
  return `<h2>Recycling Batches</h2>
  <form onsubmit="addBatch(event)">
   <select name="center_id">${opts('center','center_name')}</select>
   <select name="recycler_id">${opts('recycler','recycler_name')}</select>
   <select name="category_id">${opts('category','category_name')}</select>
   <input type="number" step="0.01" name="weight_kg" placeholder="Weight (kg)">
   <input type="number" step="0.01" name="recovered_kg" placeholder="Recovered (kg)" value="0">
   <input type="date" name="dispatch_date" value="2026-10-30">
   <select name="status"><option>Dispatched</option><option>Processed</option></select>
   <button class="btn">Dispatch batch</button>
  </form>
  ${tbl(['ID','Center','Recycler','Category','Weight (kg)','Recovered (kg)','Recovery %','Date','Status'],db.batch.map(b=>[b.batch_id,nm('center',b.center_id,'center_name'),nm('recycler',b.recycler_id,'recycler_name'),nm('category',b.category_id,'category_name'),f2(b.weight_kg),f2(b.recovered_kg),b.status==='Processed'?(b.recovered_kg/b.weight_kg*100).toFixed(1)+'%':'-',b.dispatch_date,tag(b.status)]))}`;
 },
 stock(){
  return `<h2>Center Stock</h2>
  <div class="kpis">${db.center.map(c=>{const s=stock(c.center_id),pct=Math.min(100,s.bal/c.capacity_kg*100*20);return `<div class="card"><b>${c.center_name}</b><div style="color:var(--m);font-size:13px">${c.city}, capacity ${c.capacity_kg} kg</div><div class="bar"><i style="width:${pct}%"></i></div><div style="font-size:13px">In: ${f2(s.inn)} kg | Out: ${f2(s.out)} kg</div><b style="color:var(--g);font-size:24px">${f2(s.bal)} kg</b></div>`}).join('')}</div>
  ${tbl(['Center','Collected (kg)','Dispatched (kg)','Balance (kg)'],db.center.map(c=>{const s=stock(c.center_id);return [c.center_name,f2(s.inn),f2(s.out),f2(s.bal)]}))}`;
 }
};

/* ---------- Actions (checks mirror the SQL constraints) ---------- */
function addDonor(e){e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 if(!f.donor_name.trim())return toast("Column 'donor_name' cannot be null");
 if(!f.phone.trim())return toast("Column 'phone' cannot be null");
 if(!f.city.trim())return toast("Column 'city' cannot be null");
 if(db.donor.some(d=>d.phone===f.phone.trim()))return toast(`Duplicate entry '${f.phone}' for key 'phone'`);
 db.donor.push({donor_id:nextId('donor'),donor_name:f.donor_name.trim(),donor_type:f.donor_type,phone:f.phone.trim(),city:f.city.trim()});
 toast('Donor added',1);show('donors')}
function delDonor(id){
 if(db.pickup.some(p=>p.donor_id==id))return toast('Cannot delete a parent row: a foreign key constraint fails (fk_pickup_donor)');
 db.donor=db.donor.filter(d=>d.donor_id!=id);toast('Donor deleted',1);show('donors')}
function addPickup(e){e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 const q=+f.quantity,w=+f.weight_kg;
 if(!(q>0))return toast('CONSTRAINT chk_qty failed: quantity must be greater than 0');
 if(!(w>0))return toast('CONSTRAINT chk_weight failed: weight_kg must be greater than 0');
 const id=nextId('pickup');
 db.pickup.push({pickup_id:id,donor_id:+f.donor_id,collector_id:+f.collector_id,center_id:nm('collector',f.collector_id,'center_id'),pickup_date:f.pickup_date,status:'Scheduled'});
 db.item.push({pickup_id:id,category_id:+f.category_id,quantity:q,weight_kg:w});
 toast('Pickup scheduled (status DEFAULT = Scheduled)',1);show('pickups')}
function setStatus(id,s){db.pickup.find(p=>p.pickup_id==id).status=s;show('pickups')}
function delPickup(id){db.pickup=db.pickup.filter(p=>p.pickup_id!=id);db.item=db.item.filter(i=>i.pickup_id!=id);toast('Pickup and its items deleted (ON DELETE CASCADE)',1);show('pickups')}
function addBatch(e){e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 const w=+f.weight_kg,r=+f.recovered_kg;
 if(!(w>0))return toast('CONSTRAINT chk_batch_weight failed: weight_kg must be greater than 0');
 if(r<0||r>w)return toast('CONSTRAINT chk_recovered failed: recovered_kg must be between 0 and weight_kg');
 db.batch.push({batch_id:nextId('batch'),center_id:+f.center_id,recycler_id:+f.recycler_id,category_id:+f.category_id,weight_kg:w,recovered_kg:r,dispatch_date:f.dispatch_date,status:f.status});
 toast('Batch recorded',1);show('batches')}

/* ---------- Router ---------- */
function show(v){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));$('#app').innerHTML=views[v]()}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>show(b.dataset.v));
show('dash');
async function testBackend() {
    try {
        const response = await fetch("/api/health");
        const data = await response.json();

        console.log(data.message);
    } catch (error) {
        console.error("Backend connection failed:", error);
    }
}

testBackend();