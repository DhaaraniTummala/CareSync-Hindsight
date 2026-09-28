import React,{useState,useEffect,useRef} from "react";
import htm from "htm";
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from "firebase/auth";
import {auth,firebaseConfigured} from "./firebase.js";
import {api,uploadToCloudinary,FALLBACK_CREDENTIALS,enableMockAuth,disableMockAuth} from "./api.js";

const html=htm.bind(React.createElement);
const IC={home:["M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"],users:["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8","M23 21v-2a4 4 0 0 0-3-3.9","M16 3.1a4 4 0 0 1 0 7.8"],upload:["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],file:["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M8 13h8","M8 17h8"],set:["M4 21v-7","M4 10V3","M12 21v-9","M12 8V3","M20 21v-5","M20 12V3","M1 14h6","M9 8h6","M17 16h6"],search:["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16","M21 21l-4.3-4.3"],bell:["M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9","M13.7 21a2 2 0 0 1-3.4 0"],out:["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"],build:["M4 21V3h11v18","M15 9h5v12","M8 7h3","M8 11h3","M8 15h3","M2 21h20"],clock:["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20","M12 6v6l4 2"],phone:["M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"],mail:["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z","M22 6l-10 7L2 6"],pin:["M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z","M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6"],spark:["M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"],chev:["M9 18l6-6-6-6"],heart:["M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z","M12 9v5","M9.5 11.5h5"],cal:["M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z","M16 2v4","M8 2v4","M3 10h18"],arrow:["M5 12h14","M12 5l7 7-7 7"],chat:["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],send:["M22 2L11 13","M22 2l-7 20-4-9-9-4z"],plus:["M12 5v14","M5 12h14"],x:["M18 6 6 18","M6 6l12 12"],trend:["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"],trash:["M3 6h18","M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M10 11v6","M14 11v6"],refresh:["M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8","M3 3v5h5","M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16","M16 16h5v5"]};
const Ic=({n,s=20})=>html`<svg className="ic" viewBox="0 0 24 24" width=${s} height=${s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">${IC[n].map((d,i)=>html`<path key=${i} d=${d}/>`)}</svg>`;

const TY={"Hospital Visit":["#FDE2E4","#B4233F","#E5484D"],"Lab Report":["#DCEBFD","#2A62C4","#3B82F6"],"Prescription":["#D8F3E8","#1B7F5C","#22A67B"],"Radiology":["#E6DEFB","#5B3FC4","#8B6CE8"],"Uploaded Document":["#FDEBD3","#A85F0E","#F2A23A"]};
const ty=t=>TY[t]||["#FDEBD3","#A85F0E","#F2A23A"];
const RECORD_TYPES=["Hospital Visit","Lab Report","Prescription","Radiology","Uploaded Document"];
const SPEC_TAGS=[["cardio","Cardiology"],["endo","Endocrinology"],["gen","General"]];
const SPECS={"Cardiology":"cardio","Endocrinology":"endo","General Medicine":null};
const fd=d=>{try{return new Date(d+"T00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}catch{return d}};
const today=()=>new Date().toISOString().slice(0,10);
const ini=n=>(n||"").split(" ").filter(w=>/^[A-Z]/.test(w)&&w!="Dr.").map(w=>w[0]).join("").slice(0,2)||"?";
// Backend record/appointment shape uses long field names; the UI (built before
// the backend existed) uses short ones. Map at the boundary rather than
// touching every component.
const toRecord=r=>({id:r.id,d:r.date,t:r.type,h:r.hospital,ti:r.title,x:r.text,g:r.specialty_tag,fileUrl:r.file_url,uploadedBy:r.uploaded_by});
const toAppt=a=>({id:a.id,d:a.date,t:a.title,h:a.hospital,doc:a.doctor_name});

function Logo(){return html`<div className="logo"><div className="mark"><${Ic} n="heart" s=${26}/></div><div><b>CareSync AI</b><span>Continuity of Care</span></div></div>`}

function ProfileForm({role,onSubmit,busy,err}){
 const [f,setF]=useState({name:"",age:"",sex:"Female",cond:"",phone:"",city:"",blood:"O+",specialty:"Cardiology"});
 const set=k=>e=>setF(v=>({...v,[k]:e.target.value}));
 const go=e=>{e.preventDefault();onSubmit(f)};
 return html`<form className="box" onSubmit=${go}><h2 style=${{fontSize:"1.5rem"}}>One more step</h2>
  <p className="mute" style=${{marginTop:6}}>Tell us a bit about ${role=="doctor"?"your practice":"yourself"} to finish setting up your CareSync account.</p>
  <label htmlFor="pf-name">Full name</label><input id="pf-name" value=${f.name} onChange=${set("name")} required/>
  ${role=="doctor"?html`<label htmlFor="pf-spec">Specialty</label><select id="pf-spec" value=${f.specialty} onChange=${set("specialty")}>${["Cardiology","Endocrinology","General Medicine"].map(s=>html`<option key=${s}>${s}</option>`)}</select>`
   :html`<div className="grid2" style=${{marginTop:18}}>
    <div><label htmlFor="pf-age" style=${{marginTop:0}}>Age</label><input id="pf-age" type="number" min="0" value=${f.age} onChange=${set("age")} required/></div>
    <div><label htmlFor="pf-sex" style=${{marginTop:0}}>Sex</label><select id="pf-sex" value=${f.sex} onChange=${set("sex")}>${["Female","Male","Other"].map(s=>html`<option key=${s}>${s}</option>`)}</select></div>
    <div><label htmlFor="pf-blood" style=${{marginTop:0}}>Blood group</label><select id="pf-blood" value=${f.blood} onChange=${set("blood")}>${["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(s=>html`<option key=${s}>${s}</option>`)}</select></div>
    <div><label htmlFor="pf-phone" style=${{marginTop:0}}>Phone</label><input id="pf-phone" value=${f.phone} onChange=${set("phone")}/></div>
    <div><label htmlFor="pf-cond" style=${{marginTop:0}}>Conditions</label><input id="pf-cond" placeholder="e.g. Hypertension" value=${f.cond} onChange=${set("cond")}/></div>
    <div><label htmlFor="pf-city" style=${{marginTop:0}}>City</label><input id="pf-city" value=${f.city} onChange=${set("city")}/></div>
   </div>`}
  <div className="err" role="alert">${err}</div>
  <button className="btn" style=${{width:"100%",marginTop:14}} type="submit" disabled=${busy}>${busy?html`<span className="spin"></span>Saving...`:"Finish setup"}</button>
 </form>`}

function Login({onAuthed,onMockAuth,forceProfile,firebaseOff}){
 const [role,setRole]=useState("doctor"),[mode,setMode]=useState("signin"),[u,setU]=useState(""),[p,setP]=useState(""),[err,setErr]=useState(""),[busy,setBusy]=useState(false),[step,setStep]=useState(forceProfile?"profile":"creds");
 const pick=r=>{setRole(r);setErr("")};
 const go=async e=>{
  e.preventDefault();setErr("");
  if(!u.trim()||!p){setErr("Enter your email and password to continue.");return}
  // Hardcoded demo fallback: same email works for either role (picked via
  // the toggle above), same password, and never touches Firebase/backend.
  if(u.trim().toLowerCase()==FALLBACK_CREDENTIALS.email&&p==FALLBACK_CREDENTIALS.password){
   setBusy(true);
   try{await onMockAuth(role)}
   catch(e){setErr(e.message||"Something went wrong signing you in.")}
   finally{setBusy(false)}
   return;
  }
  if(firebaseOff){setErr("Firebase isn't configured yet, so only the demo fallback login below works right now.");return}
  setBusy(true);
  try{
   if(mode=="signup")await createUserWithEmailAndPassword(auth,u.trim(),p);
   else await signInWithEmailAndPassword(auth,u.trim(),p);
   const res=await onAuthed();
   if(res=="needs-profile")setStep("profile");
  }catch(e){
   setErr(e.message?.replace(/^Firebase:\s*/,"")||"Something went wrong signing you in.");
  }finally{setBusy(false)}
 };
 const finishProfile=async f=>{
  setBusy(true);setErr("");
  try{
   await api.bootstrapProfile({role,name:f.name,age:f.age?Number(f.age):undefined,sex:f.sex,cond:f.cond,phone:f.phone,city:f.city,blood:f.blood,specialty:f.specialty});
   await onAuthed();
  }catch(e){setErr(e.message||"Couldn't save your profile.")}finally{setBusy(false)}
 };
 const F=[["users","var(--mint)","One timeline from every hospital"],["spark","var(--lav)","Source-cited AI clinical briefs"],["chat","var(--peach)","An AI assistant for your own health data"]];
 if(step=="profile")return html`<div className="login"><div className="lp"><${Logo}/><div><h1>Almost there.</h1></div><span className="sm" style=${{color:"#9FC4DC"}}>Your account is created — just need a few details.</span></div><div className="rp" style=${{display:"grid",gap:14,justifyItems:"center"}}>${forceProfile&&html`<div key="seg" className="seg" role="group" aria-label="Account type" style=${{width:"100%",maxWidth:440}}><button type="button" aria-pressed=${role=="patient"} onClick=${()=>pick("patient")}>Patient</button><button type="button" aria-pressed=${role=="doctor"} onClick=${()=>pick("doctor")}>Doctor</button></div>`}<${ProfileForm} key="form" role=${role} onSubmit=${finishProfile} busy=${busy} err=${err}/></div></div>`;
 return html`<div className="login"><div className="lp"><${Logo}/><div><h1>Every record, one clear brief.</h1>
  <ul>${F.map(([i,c,t])=>html`<li key=${t}><span className="tile" style=${{background:c}}><${Ic} n=${i}/></span>${t}</li>`)}</ul></div><span className="sm" style=${{color:"#9FC4DC"}}>Sign in, or create an account to get started.</span></div>
  <div className="rp"><form className="box" onSubmit=${go}><h2 style=${{fontSize:"1.7rem"}}>${mode=="signup"?"Create account":"Sign in"}</h2><p className="mute" style=${{marginTop:6}}>Choose your account type.</p>
   <div className="seg" role="group" aria-label="Account type"><button type="button" aria-pressed=${role=="patient"} onClick=${()=>pick("patient")}>Patient</button><button type="button" aria-pressed=${role=="doctor"} onClick=${()=>pick("doctor")}>Doctor</button></div>
   <label htmlFor="u">Email</label><input id="u" type="email" value=${u} onChange=${e=>setU(e.target.value)} autoComplete="username"/>
   <label htmlFor="pw">Password</label><input id="pw" type="password" value=${p} onChange=${e=>setP(e.target.value)} autoComplete=${mode=="signup"?"new-password":"current-password"}/>
   <div className="err" role="alert">${err}</div><button className="btn" style=${{width:"100%",marginTop:14}} type="submit" disabled=${busy}>${busy?html`<span className="spin"></span>${mode=="signup"?"Creating...":"Signing in..."}`:(mode=="signup"?"Create account":"Sign in")} as ${role}</button>
   <button type="button" className="link" style=${{marginTop:16}} onClick=${()=>{setMode(mode=="signup"?"signin":"signup");setErr("")}}>${mode=="signup"?"Already have an account? Sign in":"New here? Create an account"}</button>
   <p className="mute sm" style=${{marginTop:14}}>${firebaseOff?"Firebase isn't set up yet — use the demo fallback: ":"Demo fallback: "}${FALLBACK_CREDENTIALS.email} / ${FALLBACK_CREDENTIALS.password} (as either role, no setup required).</p>
   </form></div></div>`}

function Shell({user,sub,nav,page,setPage,onOut,q,setQ,children}){
 return html`<div className="app"><nav className="side" aria-label="Main"><${Logo}/>
  ${nav.map(([k,l,i])=>html`<button key=${k} className="nav" aria-current=${page==k?"page":undefined} onClick=${()=>setPage(k)}><${Ic} n=${i}/><span>${l}</span></button>`)}
  <div className="foot"><div className="row" style=${{marginBottom:10}}><div className="av">${ini(user)}</div><div><b style=${{color:"#fff"}}>${user}</b><div className="sm">${sub}</div></div></div>
  <button className="nav" style=${{width:"100%"}} onClick=${onOut}><${Ic} n="out"/><span>Logout</span></button></div></nav>
  <div style=${{minWidth:0}}><div className="top"><div className="srch"><${Ic} n="search" s=${18}/><input aria-label="Search" placeholder="Search patients, hospitals, or records..." value=${q} onChange=${e=>setQ(e.target.value)}/></div>
   <span className="grow"></span><span className="bell"><${Ic} n="bell"/><i></i></span><div className="row"><div className="av" style=${{width:38,height:38}}>${ini(user)}</div><div className="sm who"><b>${user}</b><div className="mute">${sub}</div></div></div></div>
  <main>${children}</main></div></div>`}

const Head=({t,s})=>html`<div className="row sp wrap"><div><h1 className="ph">${t}</h1><p className="mute" style=${{marginTop:4}}>${s}</p></div><div className="date row" style=${{gap:10,whiteSpace:"nowrap"}}><${Ic} n="cal" s=${18}/>${new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</div></div>`;
const Stat=({i,c,l,v,d,s})=>html`<div className="card stat"><span className="tile" style=${{background:c}}><${Ic} n=${i} s=${26}/></span><div className="sb"><div className="mute lbl">${l}</div><div className="val"><b>${v}</b>${d&&html`<span className="up">↗ ${d}</span>`}</div><div className="mute sm">${s}</div></div></div>`;

function Timeline({items,onView,title,onAll}){
 return html`<div className="card tlc"><div className="row sp wrap"><h3>${title}</h3>${onAll&&html`<button className="link" onClick=${onAll}>View All Records <${Ic} n="arrow" s=${14}/></button>`}</div>
  ${items.length?html`<ul className="tl">${[...items].sort((a,b)=>b.d.localeCompare(a.d)).map(r=>{const c=ty(r.t);return html`<li key=${r.id} style=${{"--dc":c[2],"--cb":c[0],"--ct":c[1]}}>
   <div className="mute sm">${fd(r.d)}</div><div><div className="row sp" style=${{gap:8,alignItems:"flex-start"}}><div className="row wrap" style=${{gap:"6px 10px",minWidth:0}}><span className="chip">${r.t}</span><span className="mute sm">${r.h}</span></div>
   <button className="btn o" onClick=${()=>onView(r)}><${Ic} n="file" s=${14}/>View Record</button></div><b style=${{display:"block",margin:"8px 0 2px",fontSize:"1.02rem"}}>${r.ti}</b><div className="mute">${r.x}</div></div></li>`})}</ul>`:html`<p className="mute" style=${{marginTop:14}}>No records yet.</p>`}</div>`}

function RecordForm({patientId,onAdded}){
 const blank={date:today(),type:"Hospital Visit",hospital:"",title:"",text:"",specialty_tag:"gen"};
 const [f,setF]=useState(blank),[file,setFile]=useState(null),[on,setOn]=useState(false),[busy,setBusy]=useState(false),[err,setErr]=useState(""),[msg,setMsg]=useState("");
 const ref=useRef();
 const set=k=>e=>setF(v=>({...v,[k]:e.target.value}));
 const take=fl=>{if(fl&&fl[0])setFile(fl[0])};
 const submit=async e=>{
  e.preventDefault();setErr("");
  if(!f.hospital.trim()||!f.title.trim()){setErr("Hospital and title are required.");return}
  setBusy(true);
  try{
   let file_url=null,file_name=null;
   if(file){
    const sig=await api.uploadSignature(patientId);
    const up=await uploadToCloudinary(file,sig);
    file_url=up.secure_url;file_name=file.name;
   }
   await api.addRecord(patientId,{...f,file_url,file_name});
   setF(blank);setFile(null);setMsg("Record added.");
   onAdded&&onAdded();
  }catch(e){setErr(e.message||"Couldn't add this record.")}finally{setBusy(false)}
 };
 return html`<form className="card" onSubmit=${submit}><div className="row" style=${{color:"var(--blue)"}}><${Ic} n="upload"/><h3 style=${{color:"var(--ink)"}}>Add a Record</h3></div>
  <div className="grid2" style=${{marginTop:14}}>
   <div><label style=${{marginTop:0}} htmlFor="rf-date">Date</label><input id="rf-date" type="date" value=${f.date} onChange=${set("date")} required/></div>
   <div><label style=${{marginTop:0}} htmlFor="rf-type">Type</label><select id="rf-type" value=${f.type} onChange=${set("type")}>${RECORD_TYPES.map(t=>html`<option key=${t}>${t}</option>`)}</select></div>
   <div><label style=${{marginTop:0}} htmlFor="rf-hosp">Hospital</label><input id="rf-hosp" value=${f.hospital} onChange=${set("hospital")} required/></div>
   <div><label style=${{marginTop:0}} htmlFor="rf-spec">Specialty tag</label><select id="rf-spec" value=${f.specialty_tag} onChange=${set("specialty_tag")}>${SPEC_TAGS.map(([v,l])=>html`<option key=${v} value=${v}>${l}</option>`)}</select></div>
   <div style=${{gridColumn:"1/-1"}}><label style=${{marginTop:0}} htmlFor="rf-title">Title</label><input id="rf-title" placeholder="e.g. Chest Pain Evaluation" value=${f.title} onChange=${set("title")} required/></div>
   <div style=${{gridColumn:"1/-1"}}><label style=${{marginTop:0}} htmlFor="rf-text">Notes</label><input id="rf-text" placeholder="Short clinical note" value=${f.text} onChange=${set("text")}/></div>
  </div>
  <div className=${"drop"+(on?" on":"")} role="button" tabIndex="0" aria-label="Attach a file" onClick=${()=>ref.current.click()} onKeyDown=${e=>{if(e.key=="Enter"||e.key==" "){e.preventDefault();ref.current.click()}}}
   onDragOver=${e=>{e.preventDefault();setOn(true)}} onDragLeave=${()=>setOn(false)} onDrop=${e=>{e.preventDefault();setOn(false);take(e.dataTransfer.files)}} style=${{marginTop:14}}>
   <span className="tile"><${Ic} n="upload"/></span><b>${file?file.name:"Drag & drop a file here"}</b><div className="sm">${file?"Click to replace":"or click to browse (optional)"}</div></div>
  <input ref=${ref} type="file" accept=".pdf,.dcm,image/*" hidden onChange=${e=>{take(e.target.files);e.target.value=""}}/>
  <div className="err" role="alert">${err}</div>
  <button className="btn" style=${{width:"100%",marginTop:14}} type="submit" disabled=${busy}>${busy?html`<span className="spin"></span>Saving...`:html`<${Ic} n="plus" s=${18}/>Add Record`}</button>
  <div className="sm" style=${{color:"#1B7F5C",marginTop:10,minHeight:"1.2em"}} role="status">${msg}</div></form>`}

function BriefPanel({onGen,busy}){
 const [sp,setSp]=useState("Cardiology");
 return html`<div className="card"><div className="row" style=${{color:"var(--blue)"}}><${Ic} n="spark"/><h3 style=${{color:"var(--ink)"}}>AI Clinical Brief</h3></div>
  <label htmlFor="sp" style=${{marginTop:16}}>Specialty</label><select id="sp" value=${sp} onChange=${e=>setSp(e.target.value)}>${Object.keys(SPECS).map(s=>html`<option key=${s}>${s}</option>`)}</select>
  <button className="btn" style=${{width:"100%",marginTop:14}} disabled=${busy} onClick=${()=>onGen(sp)}>${busy?html`<span className="spin"></span>Reading records...`:html`<${Ic} n="spark" s=${18}/>Generate Brief`}</button>
  <p className="mute sm" style=${{marginTop:12}}>Get a concise, source-cited summary tailored to your specialty.</p></div>`}

function BriefOut({out}){
 const [hl,setHl]=useState(null);
 useEffect(()=>{if(hl){const e=document.getElementById("s"+hl);e&&e.scrollIntoView({behavior:"smooth",block:"center"})}},[hl]);
 if(!out)return null;
 const {patient={},summary,sources=[]}=out;
 const parts=summary.split(/(\[\d+\])/g);
 return html`<div className="brief"><p className="mute" style=${{marginTop:2}}>${patient.age} yrs · ${patient.sex} · ${patient.cond||"no conditions on file"}</p>
  <p style=${{marginTop:12}}>${parts.map((seg,i)=>{const m=seg.match(/^\[(\d+)\]$/);return m?html`<button key=${i} className="cite" aria-label=${"Show source "+m[1]} onClick=${()=>setHl(m[1])}>${seg}</button>`:html`<span key=${i}>${seg}</span>`})}</p>
  ${sources.length?html`<h3 key="src-h" style=${{margin:"16px 0 4px"}}>Sources</h3>${sources.map(s=>html`<div key=${s.id} id=${"s"+s.id} className=${"src"+(hl==s.id?" hl":"")}><b>[${s.id}] ${s.title}</b><div className="mute sm">${s.hospital} · ${fd(s.date)}</div></div>`)}`:null}
 </div>`}

function BriefModal({state,onClose}){
 if(!state)return null;
 const {busy,err,out,specialty,patientName}=state;
 return html`<div className="modal" onClick=${onClose}><div className="card modalcard" role="dialog" aria-modal="true" onClick=${e=>e.stopPropagation()}>
  <div className="row sp wrap" style=${{marginBottom:4}}><span className="row" style=${{gap:10,color:"var(--blue)"}}><${Ic} n="spark"/><h2 style=${{fontSize:"1.2rem",color:"var(--ink)"}}>${specialty} brief · ${patientName}</h2></span>
   <button className="iconbtn" aria-label="Close brief" onClick=${onClose}><${Ic} n="x" s=${18}/></button></div>
  ${busy?html`<p className="mute row" style=${{gap:10,marginTop:16}}><span className="spin" style=${{borderTopColor:"var(--teal)",borderColor:"var(--line)"}}></span>Reading records and writing the brief...</p>`
   :err?html`<p className="err" role="alert" style=${{minHeight:"auto"}}>${err}</p>`
   :html`<${BriefOut} out=${out}/>`}
  <button className="btn o" style=${{marginTop:16}} onClick=${onClose}>Close</button>
 </div></div>`}

function Modal({r,onClose}){
 if(!r)return null;
 return html`<div className="modal" onClick=${onClose}><div className="card" role="dialog" aria-modal="true" onClick=${e=>e.stopPropagation()}><span className="mute sm">${r.t} · ${fd(r.d)}</span><h2 style=${{margin:"6px 0"}}>${r.ti}</h2><div className="mute">${r.h}</div><p style=${{margin:"14px 0"}}>${r.x}</p>${r.fileUrl&&html`<a className="link" href=${r.fileUrl} target="_blank" rel="noreferrer"><${Ic} n="file" s=${14}/>Open attached file</a>`}<button className="btn" style=${{marginTop:14}} onClick=${onClose}>Close</button></div></div>`}

function PatientPicker({patients,value,onChange}){
 const [open,setOpen]=useState(false),[q,setQ]=useState("");
 const ref=useRef();
 const sel=patients.find(x=>x.id==value);
 const list=patients.filter(x=>(x.name+x.id).toLowerCase().includes(q.toLowerCase()));
 useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);
 return html`<div className="combo" ref=${ref}>
  <button type="button" className="combobtn" onClick=${()=>{setOpen(o=>!o);setQ("")}} aria-haspopup="listbox" aria-expanded=${open}>
   <span>${sel?sel.name+" ("+sel.id+")":"Select patient"}</span><${Ic} n="chev" s=${16}/></button>
  ${open&&html`<div className="combopop">
   <div className="combosearch"><${Ic} n="search" s=${16}/><input autoFocus placeholder="Search patients..." value=${q} onChange=${e=>setQ(e.target.value)}/></div>
   <div className="combolist" role="listbox">${list.map(x=>html`<button key=${x.id} type="button" role="option" aria-selected=${x.id==value} className="comboitem" onClick=${()=>{onChange(x.id);setOpen(false)}}><div className="av" style=${{width:30,height:30,fontSize:".7rem"}}>${ini(x.name)}</div><div><b>${x.name}</b><div className="mute sm">${x.id}</div></div></button>`)}
    ${!list.length&&html`<p className="mute sm" style=${{padding:10}}>No matches.</p>`}</div></div>`}
 </div>`}

function AddPatientModal({open,onClose,onAdd}){
 const blank={name:"",age:"",sex:"Female",cond:"",phone:"",city:"",blood:"O+"};
 const [f,setF]=useState(blank),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{if(open){setF(blank);setErr("")}},[open]);
 if(!open)return null;
 const set=k=>e=>setF(v=>({...v,[k]:e.target.value}));
 const save=async e=>{
  e.preventDefault();
  if(!f.name.trim()||!f.age){setErr("Name and age are required.");return}
  setBusy(true);setErr("");
  try{await onAdd({...f,age:Number(f.age)});onClose()}
  catch(e){setErr(e.message||"Couldn't add this patient.")}finally{setBusy(false)}
 };
 return html`<div className="modal" onClick=${onClose}><form className="card modalcard" role="dialog" aria-modal="true" onClick=${e=>e.stopPropagation()} onSubmit=${save}>
  <div className="row sp" style=${{marginBottom:8}}><h3 style=${{margin:0}}>Add New Patient</h3><button type="button" className="iconbtn" aria-label="Close" onClick=${onClose}><${Ic} n="x" s=${18}/></button></div>
  <div className="grid2 form2">
   <div><label htmlFor="np-name">Full name</label><input id="np-name" value=${f.name} onChange=${set("name")} required/></div>
   <div><label htmlFor="np-age">Age</label><input id="np-age" type="number" min="0" value=${f.age} onChange=${set("age")} required/></div>
   <div><label htmlFor="np-sex">Sex</label><select id="np-sex" value=${f.sex} onChange=${set("sex")}>${["Female","Male","Other"].map(s=>html`<option key=${s}>${s}</option>`)}</select></div>
   <div><label htmlFor="np-blood">Blood group</label><select id="np-blood" value=${f.blood} onChange=${set("blood")}>${["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(s=>html`<option key=${s}>${s}</option>`)}</select></div>
   <div><label htmlFor="np-cond">Conditions</label><input id="np-cond" placeholder="e.g. Hypertension" value=${f.cond} onChange=${set("cond")}/></div>
   <div><label htmlFor="np-phone">Phone</label><input id="np-phone" value=${f.phone} onChange=${set("phone")}/></div>
   <div style=${{gridColumn:"1/-1"}}><label htmlFor="np-city">City</label><input id="np-city" value=${f.city} onChange=${set("city")}/></div>
  </div>
  <div className="err" role="alert">${err}</div>
  <div className="row" style=${{gap:10,marginTop:4}}><button type="button" className="btn o" style=${{flex:1}} onClick=${onClose}>Cancel</button><button className="btn" style=${{flex:1}} type="submit" disabled=${busy}><${Ic} n="plus" s=${16}/>${busy?"Adding...":"Add Patient"}</button></div>
 </form></div>`}

function AddDoctorModal({open,onClose,onAdd}){
 const blank={name:"",email:"",password:"",specialty:"Cardiology"};
 const [f,setF]=useState(blank),[err,setErr]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState("");
 useEffect(()=>{if(open){setF(blank);setErr("");setDone("")}},[open]);
 if(!open)return null;
 const set=k=>e=>setF(v=>({...v,[k]:e.target.value}));
 const save=async e=>{
  e.preventDefault();
  if(!f.name.trim()||!f.email.trim()||f.password.length<6){setErr("Name, email, and a password of at least 6 characters are required.");return}
  setBusy(true);setErr("");setDone("");
  try{await onAdd(f);setDone(f.name+" can now sign in as a doctor with that email and password.");setF({...blank,specialty:f.specialty})}
  catch(e){setErr(e.message||"Couldn't add this doctor.")}finally{setBusy(false)}
 };
 return html`<div className="modal" onClick=${onClose}><form className="card modalcard" role="dialog" aria-modal="true" onClick=${e=>e.stopPropagation()} onSubmit=${save}>
  <div className="row sp" style=${{marginBottom:8}}><h3 style=${{margin:0}}>Add New Doctor</h3><button type="button" className="iconbtn" aria-label="Close" onClick=${onClose}><${Ic} n="x" s=${18}/></button></div>
  <p className="mute sm">Creates a CareSync sign-in for another doctor right away — no separate signup step for them.</p>
  <div className="grid2 form2">
   <div><label htmlFor="nd-name">Full name</label><input id="nd-name" value=${f.name} onChange=${set("name")} required/></div>
   <div><label htmlFor="nd-spec">Specialty</label><select id="nd-spec" value=${f.specialty} onChange=${set("specialty")}>${["Cardiology","Endocrinology","General Medicine"].map(s=>html`<option key=${s}>${s}</option>`)}</select></div>
   <div style=${{gridColumn:"1/-1"}}><label htmlFor="nd-email">Email</label><input id="nd-email" type="email" value=${f.email} onChange=${set("email")} required/></div>
   <div style=${{gridColumn:"1/-1"}}><label htmlFor="nd-pass">Temporary password</label><input id="nd-pass" type="password" value=${f.password} onChange=${set("password")} required/></div>
  </div>
  <div className="err" role="alert">${err}</div>
  ${done&&html`<p className="sm" style=${{color:"#1B7F5C",marginTop:8}}>${done}</p>`}
  <div className="row" style=${{gap:10,marginTop:4}}><button type="button" className="btn o" style=${{flex:1}} onClick=${onClose}>Close</button><button className="btn" style=${{flex:1}} type="submit" disabled=${busy}><${Ic} n="plus" s=${16}/>${busy?"Adding...":"Add Doctor"}</button></div>
 </form></div>`}

function AppointmentsCard({patientId,appts,onAdded}){
 const [open,setOpen]=useState(false),[f,setF]=useState({date:today(),title:"",hospital:"",doctor_name:""}),[busy,setBusy]=useState(false),[err,setErr]=useState("");
 const set=k=>e=>setF(v=>({...v,[k]:e.target.value}));
 const save=async e=>{
  e.preventDefault();
  if(!f.title.trim()||!f.hospital.trim()){setErr("Title and hospital are required.");return}
  setBusy(true);setErr("");
  try{await api.addAppointment(patientId,f);setF({date:today(),title:"",hospital:"",doctor_name:""});setOpen(false);onAdded&&onAdded()}
  catch(e){setErr(e.message||"Couldn't add this appointment.")}finally{setBusy(false)}
 };
 return html`<div className="card"><div className="row sp"><span className="row" style=${{color:"var(--blue)"}}><${Ic} n="cal"/><h3 style=${{color:"var(--ink)"}}>Upcoming Appointments</h3></span><button type="button" className="iconbtn" aria-label="Add appointment" onClick=${()=>setOpen(o=>!o)}><${Ic} n=${open?"x":"plus"} s=${18}/></button></div>
  ${open&&html`<form onSubmit=${save} style=${{marginTop:10,display:"grid",gap:10}}>
   <input type="date" value=${f.date} onChange=${set("date")} required/>
   <input placeholder="Title, e.g. Cardiology Follow-up" value=${f.title} onChange=${set("title")} required/>
   <input placeholder="Hospital" value=${f.hospital} onChange=${set("hospital")} required/>
   <input placeholder="Doctor name" value=${f.doctor_name} onChange=${set("doctor_name")}/>
   <div className="err" role="alert">${err}</div>
   <button className="btn" type="submit" disabled=${busy}>${busy?"Saving...":"Save appointment"}</button>
  </form>`}
  ${appts.length?html`<ul className="apl" style=${{marginTop:open?16:12}}>${appts.map((a,i)=>html`<li key=${i}><div className="row sp"><b>${a.t}</b><span className="mute sm">${fd(a.d)}</span></div><div className="mute sm">${a.h}${a.doc?" · "+a.doc:""}</div></li>`)}</ul>`:!open&&html`<p className="mute sm" style=${{marginTop:10}}>No upcoming appointments.</p>`}</div>`}

function ChatPanel({open,onClose,me,records,appts}){
 const mk0=()=>[{role:"bot",text:"Hi "+(me.name||"there").split(" ")[0]+"! I'm your AI health assistant. Ask about your reports, medications or upcoming visits, or use a quick action below."}];
 const [msgs,setMsgs]=useState(mk0),[inp,setInp]=useState(""),[busy,setBusy]=useState(false);
 const bodyRef=useRef();
 useEffect(()=>{if(open)setMsgs(mk0())},[open]);
 useEffect(()=>{if(bodyRef.current)bodyRef.current.scrollTop=bodyRef.current.scrollHeight},[msgs,open,busy]);
 const ask=async text=>{
  setMsgs(m=>[...m,{role:"user",text}]);setBusy(true);
  try{
   const {reply}=await api.chat(me.id,text);
   setMsgs(m=>[...m,{role:"bot",text:reply}]);
  }catch(e){
   setMsgs(m=>[...m,{role:"bot",text:"Sorry, I couldn't reach the AI assistant just now ("+(e.message||"unknown error")+")."}]);
  }finally{setBusy(false)}
 };
 const send=e=>{e.preventDefault();const t=inp.trim();if(!t||busy)return;setInp("");ask(t)};
 return html`<div className="chatwrap">${open&&html`<div className="scrim" onClick=${onClose}></div>`}
 <aside className=${"chat"+(open?" open":"")} aria-hidden=${!open}>
  <div className="chathead"><span className="row" style=${{gap:10}}><${Ic} n="spark"/><div><b>AI Health Assistant</b><div className="sm" style=${{opacity:.85}}>Insights from your records</div></div></span><button className="iconbtn light" aria-label="Close assistant" onClick=${onClose}><${Ic} n="x" s=${18}/></button></div>
  <div className="chatbody" ref=${bodyRef}>${msgs.map((m,i)=>html`<div key=${i} className=${"bub "+m.role}>${m.text}</div>`)}${busy&&html`<div className="bub bot"><span className="spin" style=${{borderTopColor:"var(--teal)",borderColor:"var(--line)"}}></span></div>`}</div>
  <div className="chips"><button type="button" className="chip act" disabled=${busy} onClick=${()=>ask("Compare my lab reports over time.")}><${Ic} n="trend" s=${14}/>Compare reports</button><button type="button" className="chip act" disabled=${busy} onClick=${()=>ask("What are my upcoming appointments?")}><${Ic} n="cal" s=${14}/>Upcoming visits</button><button type="button" className="chip act" disabled=${busy} onClick=${()=>ask("Give me a short summary of my overall health record.")}><${Ic} n="spark" s=${14}/>Health summary</button></div>
  <form className="chatin" onSubmit=${send}><input aria-label="Ask the assistant" placeholder="Ask about your health records..." value=${inp} onChange=${e=>setInp(e.target.value)} disabled=${busy}/><button className="btn" type="submit" aria-label="Send" disabled=${busy}><${Ic} n="send" s=${18}/></button></form>
 </aside></div>`}

function Doctor({me,onOut}){
 const [patients,setPatients]=useState([]),[loading,setLoading]=useState(true),[loadErr,setLoadErr]=useState("");
 const [page,setPage]=useState("dashboard"),[sel,setSel]=useState(null),[tab,setTab]=useState("Medical History"),[q,setQ]=useState("");
 const [records,setRecords]=useState([]),[recLoading,setRecLoading]=useState(false);
 const [brief,setBrief]=useState(null),[view,setView]=useState(null),[showAdd,setShowAdd]=useState(false),[showAddDoc,setShowAddDoc]=useState(false);
 const [confirmDel,setConfirmDel]=useState(false),[delBusy,setDelBusy]=useState(false),[delErr,setDelErr]=useState("");

 const [refreshing,setRefreshing]=useState(false);
 const refreshPatients=()=>api.listPatients().then(ps=>{setPatients(ps);if(!sel&&ps.length)setSel(ps[0].id)});
 useEffect(()=>{setLoading(true);refreshPatients().catch(e=>setLoadErr(e.message)).finally(()=>setLoading(false))},[]);
 // A patient who signs themselves up elsewhere lands in the same Firestore
 // collection immediately, but this doctor's already-open app doesn't know
 // until it asks again — so re-check whenever they land on a patient list.
 useEffect(()=>{if(page=="dashboard"||page=="patients")refreshPatients().catch(()=>{})},[page]);
 useEffect(()=>{if(!sel)return;setRecLoading(true);api.listRecords(sel).then(rs=>setRecords(rs.map(toRecord))).catch(()=>setRecords([])).finally(()=>setRecLoading(false))},[sel]);
 useEffect(()=>{setConfirmDel(false);setDelErr("")},[sel]);
 const manualRefresh=async()=>{setRefreshing(true);try{await refreshPatients()}finally{setRefreshing(false)}};

 const list=patients.filter(p=>(p.name+p.id+(p.cond||"")).toLowerCase().includes(q.toLowerCase()));
 const p=patients.find(x=>x.id==sel);
 const addFiles=async()=>{if(sel){const rs=await api.listRecords(sel);setRecords(rs.map(toRecord))}};
 const addPatient=async f=>{const np=await api.createPatient(f);await refreshPatients();setSel(np.id)};
 const addDoctor=async f=>{await api.createDoctor(f)};
 const deletePatientNow=async()=>{
  setDelBusy(true);setDelErr("");
  try{
   await api.deletePatient(p.id);
   const ps=await api.listPatients();
   setPatients(ps);setSel(ps.length?ps[0].id:null);setConfirmDel(false);
  }catch(e){setDelErr(e.message||"Couldn't delete this patient.")}finally{setDelBusy(false)}
 };
 const gen=async sp=>{
  setBrief({busy:true,err:null,out:null,specialty:sp,patientName:p.name});
  try{
   const res=await api.generateBrief(p.id,sp);
   // The real backend's /ai/brief response doesn't include a full patient
   // object (only the demo mock does) — use the patient we already have
   // loaded here so BriefOut always gets patient.age/sex/cond to read.
   setBrief({busy:false,err:null,out:{...res,patient:res.patient||p},specialty:sp,patientName:p.name});
  }catch(e){setBrief({busy:false,err:e.message||"Couldn't generate the brief.",out:null,specialty:sp,patientName:p.name})}
 };
 const TABS=["Medical History","Profile","Lab Results","Medications","All Records"];
 if(loading)return html`<div className="rp" style=${{minHeight:"100vh"}}><p className="mute row"><span className="spin" style=${{borderTopColor:"var(--teal)",borderColor:"var(--line)"}}></span>Loading your patients...</p></div>`;
 if(loadErr)return html`<div className="rp" style=${{minHeight:"100vh"}}><div className="card" style=${{maxWidth:460}}><h3>Couldn't load patients</h3><p className="mute" style=${{marginTop:8}}>${loadErr}</p></div></div>`;
 if(!p)return html`<${Shell} user="Doctor" sub="" q="" setQ=${()=>{}} page="patients" setPage=${()=>{}} onOut=${onOut} nav=${[]}><${Head} t="No patients yet" s="Add your first patient to get started."/><button className="btn" style=${{marginTop:16}} onClick=${()=>setShowAdd(true)}><${Ic} n="plus" s=${18}/>Add Patient</button><${AddPatientModal} open=${showAdd} onClose=${()=>setShowAdd(false)} onAdd=${addPatient}/><//>`;

 const body=tab=="Profile"?html`<div className="card"><h3>Patient Profile</h3><div className="grid2">${[["Patient ID",p.id],["Age",p.age+" yrs"],["Sex",p.sex],["Blood group",p.blood],["Conditions",p.cond||"None on file"],["Phone",p.phone||"—"],["Email",p.email||"—"],["City",p.city||"—"]].map(([a,b])=>html`<div key=${a}><span>${a}</span><b>${b}</b></div>`)}</div></div>`
  :tab=="All Records"?html`<div className="card"><h3>All Records</h3><div style=${{overflowX:"auto"}}><table><thead><tr><th>Date</th><th>Type</th><th>Hospital</th><th>Title</th></tr></thead><tbody>${[...records].sort((a,b)=>b.d.localeCompare(a.d)).map(r=>html`<tr key=${r.id}><td>${fd(r.d)}</td><td>${r.t}</td><td>${r.h}</td><td>${r.ti}</td></tr>`)}</tbody></table></div></div>`
  :html`<${Timeline} title=${tab=="Lab Results"?"Lab Results":tab=="Medications"?"Medications":"Medical History Timeline"} items=${tab=="Lab Results"?records.filter(r=>r.t=="Lab Report"):tab=="Medications"?records.filter(r=>r.t=="Prescription"):records} onView=${setView} onAll=${tab=="Medical History"?()=>setTab("All Records"):null}/>`;
 const ws=html`<div className="ws"><div className="card dir"><div className="row"><h3>Patient Directory</h3><span className="chipc">${list.length} patients</span><button type="button" className="iconbtn" aria-label="Refresh patients" title="Refresh — picks up anyone who just signed up" onClick=${manualRefresh} style=${{marginLeft:8}}><${Ic} n="refresh" s=${16}/></button></div>
  <div className="pl">${list.map(x=>html`<button key=${x.id} className="pi" aria-current=${x.id==sel} onClick=${()=>{setSel(x.id);setTab("Medical History");setBrief(null)}}><div className="av">${ini(x.name)}</div><div><b>${x.name}</b><div className="mute sm">${x.id} · ${x.age} yrs · ${x.sex}<br/>${x.cond||"No conditions on file"}</div></div><${Ic} n="chev" s=${16}/></button>`)}${!list.length&&html`<p className="mute" style=${{padding:12}}>No patients match your search.</p>`}</div></div>
  <div className="det"><div className="card"><div className="row sp wrap"><div className="row" style=${{gap:18,minWidth:0}}><div className="av l">${ini(p.name)}</div><div style=${{minWidth:0}}><h2 style=${{fontSize:"1.4rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>${p.name}</h2><div className="mute">${p.id} · ${p.age} yrs · ${p.sex}</div></div></div>
    <div className="row" style=${{gap:10}}><span className="badge"><i></i>Active Patient</span><button type="button" className="iconbtn" aria-label="Delete patient" title="Delete patient" style=${{color:"#C0304F"}} onClick=${()=>setConfirmDel(v=>!v)}><${Ic} n="trash" s=${18}/></button></div></div>
   ${confirmDel&&html`<div className="card" style=${{marginTop:14,borderColor:"#F3C6D0"}}>
    <p style=${{margin:0}}><b>Delete ${p.name}?</b> This permanently removes their profile, all records, and appointments — it can't be undone.</p>
    <div className="err" role="alert">${delErr}</div>
    <div className="row" style=${{gap:10,marginTop:delErr?0:12}}><button type="button" className="btn o" onClick=${()=>setConfirmDel(false)}>Cancel</button><button type="button" className="btn" style=${{background:"#C0304F"}} disabled=${delBusy} onClick=${deletePatientNow}>${delBusy?"Deleting...":"Delete Patient"}</button></div>
   </div>`}
   <div className="row wrap mute" style=${{gap:28,marginTop:16}}>${p.phone&&html`<span className="row" style=${{gap:8}}><${Ic} n="phone" s=${18}/>${p.phone}</span>`}${p.email&&html`<span className="row" style=${{gap:8}}><${Ic} n="mail" s=${18}/>${p.email}</span>`}${p.city&&html`<span className="row" style=${{gap:8}}><${Ic} n="pin" s=${18}/>${p.city}</span>`}</div>
   <div className="tabs" role="tablist">${TABS.map(t=>html`<button key=${t} role="tab" aria-selected=${tab==t} onClick=${()=>setTab(t)}>${t}</button>`)}</div></div>
   <div className="two"><div style=${{display:"grid",gap:18,minWidth:0}}>${recLoading?html`<div className="card"><p className="mute row"><span className="spin" style=${{borderTopColor:"var(--teal)",borderColor:"var(--line)"}}></span>Loading records...</p></div>`:body}</div><div style=${{display:"grid",gap:18}}><${BriefPanel} onGen=${gen} busy=${brief?.busy}/></div></div></div></div>`;
 const pick=html`<div className="card" style=${{maxWidth:420,marginBottom:18}}><label style=${{marginTop:0}}>Patient</label><${PatientPicker} patients=${patients} value=${p.id} onChange=${x=>{setSel(x);setBrief(null)}}/></div>`;
 const main=page=="dashboard"?html`<${Head} t=${"Welcome back, "+(me.name?.split(" ")[0]||"Doctor")+"!"} s="Get a complete view of your patients with AI-powered clinical briefs."/>
   <div className="stats"><${Stat} i="users" c="var(--mint)" l="Total Patients" v=${patients.length} s="in CareSync"/><${Stat} i="file" c="var(--sky)" l="Records for this patient" v=${records.length} s="on file"/><${Stat} i="build" c="var(--lav)" l="Specialty" v=${me.profile?.specialty||"—"} s="your specialty"/><${Stat} i="clock" c="var(--peach)" l="Selected" v=${p.name} s="current patient"/></div>${ws}`
  :page=="patients"?html`<${Head} t="Patients" s="Every patient on file. Add a new one when they register."/>
   <div className="row sp" style=${{margin:"20px 0 4px"}}><span className="mute sm">${list.length} of ${patients.length} patients</span><button className="btn" onClick=${()=>setShowAdd(true)}><${Ic} n="plus" s=${18}/>Add Patient</button></div>
   <div className="card dir" style=${{marginTop:14}}><div className="pl">${list.map(x=>html`<button key=${x.id} className="pi" onClick=${()=>{setSel(x.id);setTab("Medical History");setBrief(null);setPage("dashboard");scrollTo(0,0)}}><div className="av">${ini(x.name)}</div><div><b>${x.name}</b><div className="mute sm">${x.id} · ${x.age} yrs · ${x.sex}<br/>${x.cond||"No conditions on file"}</div></div><${Ic} n="chev" s=${16}/></button>`)}${!list.length&&html`<p className="mute" style=${{padding:12}}>No patients match your search.</p>`}</div></div>`
  :page=="upload"?html`<${Head} t="Upload Records" s="Add new documents to a patient's history."/><div style=${{height:20}}></div>${pick}<div style=${{maxWidth:460}}><${RecordForm} patientId=${p.id} onAdded=${addFiles}/></div>`
  :page=="brief"?html`<${Head} t="Generate Brief" s="A short, source-cited summary for your specialty."/><div style=${{height:20}}></div>${pick}<div style=${{maxWidth:420,marginBottom:18}}><${BriefPanel} onGen=${gen} busy=${brief?.busy}/></div>`
  :html`<${Head} t="Settings" s="Your account details."/><div className="card" style=${{marginTop:20,maxWidth:520}}><div className="grid2" style=${{marginTop:0}}>${[["Name",me.name||"—"],["Specialty",me.profile?.specialty||"—"],["Email",me.email||"—"]].map(([a,b])=>html`<div key=${a}><span>${a}</span><b>${b}</b></div>`)}</div></div>
   <div className="card" style=${{marginTop:18,maxWidth:520}}><h3>Team</h3><p className="mute sm" style=${{marginTop:6}}>Give another doctor their own CareSync sign-in.</p><button className="btn" style=${{marginTop:14}} onClick=${()=>setShowAddDoc(true)}><${Ic} n="plus" s=${18}/>Add Doctor</button></div>`;
 return html`<${Shell} user=${me.name||"Doctor"} sub=${me.profile?.specialty||""} q=${q} setQ=${x=>{setQ(x);if(page=="dashboard"||page=="patients")return;setPage("patients")}} page=${page} setPage=${x=>{setPage(x);scrollTo(0,0)}} onOut=${onOut}
  nav=${[["dashboard","Dashboard","home"],["patients","Patients","users"],["upload","Upload Records","upload"],["brief","Generate Brief","file"],["settings","Settings","set"]]}>${main}
  <${Modal} r=${view} onClose=${()=>setView(null)}/>
  <${BriefModal} state=${brief} onClose=${()=>setBrief(null)}/>
  <${AddPatientModal} open=${showAdd} onClose=${()=>setShowAdd(false)} onAdd=${addPatient}/>
  <${AddDoctorModal} open=${showAddDoc} onClose=${()=>setShowAddDoc(false)} onAdd=${addDoctor}/><//>`}

function PatientApp({me,onOut}){
 const patientId=me.profile?.patient_id;
 const [page,setPage]=useState("dashboard"),[q,setQ]=useState(""),[view,setView]=useState(null),[chatOpen,setChatOpen]=useState(false);
 const [patient,setPatient]=useState(null),[records,setRecords]=useState([]),[appts,setAppts]=useState([]),[loading,setLoading]=useState(true),[loadErr,setLoadErr]=useState("");

 const refresh=()=>Promise.all([api.getPatient(patientId),api.listRecords(patientId),api.listAppointments(patientId)])
  .then(([pt,rs,ap])=>{setPatient(pt);setRecords(rs.map(toRecord));setAppts(ap.map(toAppt))});
 useEffect(()=>{if(!patientId)return;setLoading(true);refresh().catch(e=>setLoadErr(e.message)).finally(()=>setLoading(false))},[patientId]);

 if(loading)return html`<div className="rp" style=${{minHeight:"100vh"}}><p className="mute row"><span className="spin" style=${{borderTopColor:"var(--teal)",borderColor:"var(--line)"}}></span>Loading your records...</p></div>`;
 if(loadErr)return html`<div className="rp" style=${{minHeight:"100vh"}}><div className="card" style=${{maxWidth:460}}><h3>Couldn't load your records</h3><p className="mute" style=${{marginTop:8}}>${loadErr}</p></div></div>`;

 const hs=[...new Set(records.map(r=>r.h))];
 const items=records.filter(r=>(r.ti+r.h+r.x+r.t).toLowerCase().includes(q.toLowerCase()));
 const tl=html`<${Timeline} title="My Medical History" items=${items} onView=${setView}/>`;
 const main=page=="dashboard"?html`<${Head} t=${"Welcome back, "+(patient.name?.split(" ")[0]||"there")+"!"} s="All your health records from every hospital, in one place."/>
   <div className="stats"><${Stat} i="file" c="var(--sky)" l="My Records" v=${records.length} s="across hospitals"/><${Stat} i="build" c="var(--lav)" l="Hospitals" v=${hs.length} s="with your records"/><${Stat} i="cal" c="var(--mint)" l="Upcoming" v=${appts.length} s="appointments"/><${Stat} i="clock" c="var(--peach)" l="Last Visit" v=${records.length?fd([...records].sort((a,b)=>b.d.localeCompare(a.d))[0].d).slice(0,6):"—"} s="most recent record"/></div>
   <div className="two">${tl}<div style=${{display:"grid",gap:18}}><${AppointmentsCard} patientId=${patientId} appts=${appts} onAdded=${refresh}/></div></div>`
  :page=="records"?html`<${Head} t="My Records" s="Every record we have on file for you."/><div style=${{height:20}}></div>${tl}`
  :page=="appointments"?html`<${Head} t="Appointments" s="Everything you have scheduled, and a place to add more."/><div style=${{height:20}}></div><div style=${{maxWidth:460}}><${AppointmentsCard} patientId=${patientId} appts=${appts} onAdded=${refresh}/></div>`
  :html`<${Head} t="Upload Records" s="Add a document from a hospital or clinic."/><div style=${{height:20}}></div><div style=${{maxWidth:460}}><${RecordForm} patientId=${patientId} onAdded=${refresh}/></div>`;
 return html`<${Shell} user=${patient.name} sub=${"Patient · "+patient.id} q=${q} setQ=${x=>{setQ(x);if(page!="dashboard"&&page!="records")setPage("records")}} page=${page} setPage=${x=>{setPage(x);scrollTo(0,0)}} onOut=${onOut}
  nav=${[["dashboard","Dashboard","home"],["records","My Records","file"],["appointments","Appointments","cal"],["upload","Upload Records","upload"]]}>${main}
  <${Modal} r=${view} onClose=${()=>setView(null)}/>
  <button className="fab" aria-label="Open AI health assistant" onClick=${()=>setChatOpen(true)}><${Ic} n="spark" s=${22}/></button>
  <${ChatPanel} open=${chatOpen} onClose=${()=>setChatOpen(false)} me=${{...patient,id:patientId}} records=${records} appts=${appts}/><//>`}

function App(){
 const [authUser,setAuthUser]=useState(undefined); // undefined = still checking, null = signed out
 const [me,setMe]=useState(null),[meStatus,setMeStatus]=useState("idle"); // idle | ok | needs-profile | error
 const [meErr,setMeErr]=useState("");
 const [isMock,setIsMock]=useState(false); // signed in via the hardcoded demo fallback, no Firebase/backend involved

 const loadMe=async()=>{
  try{const profile=await api.me();setMe(profile);setMeStatus("ok");setMeErr("");return "ok"}
  catch(e){setMe(null);const status=e.status==403?"needs-profile":"error";setMeStatus(status);setMeErr(e.message||"Something went wrong.");return status}
 };

 const mockLogin=async role=>{
  enableMockAuth(role);
  setIsMock(true);
  setAuthUser({uid:"demo-fallback",email:FALLBACK_CREDENTIALS.email});
  await loadMe();
 };

 useEffect(()=>{
  if(!firebaseConfigured){setAuthUser(a=>a===undefined?null:a);return} // no real Firebase yet — skip straight to the login screen, where the hardcoded demo fallback still works
  return onAuthStateChanged(auth,async u=>{
   if(isMock)return; // a real auth-state change while in demo mode isn't expected; ignore rather than fight it
   setAuthUser(u);
   if(u)await loadMe();else{setMe(null);setMeStatus("idle")}
  });
 },[isMock]);

 if(authUser===undefined)return html`<div className="rp" style=${{minHeight:"100vh"}}><p className="mute row"><span className="spin" style=${{borderTopColor:"var(--teal)",borderColor:"var(--line)"}}></span>Loading CareSync...</p></div>`;
 if(!authUser)return html`<${Login} onAuthed=${loadMe} onMockAuth=${mockLogin} firebaseOff=${!firebaseConfigured}/>`;
 if(meStatus=="needs-profile")return html`<${Login} onAuthed=${loadMe} onMockAuth=${mockLogin} forceProfile=${true}/>`;

 const logout=()=>{
  if(isMock){disableMockAuth();setIsMock(false);setAuthUser(null);setMe(null);setMeStatus("idle");return}
  signOut(auth);
 };

 if(meStatus=="error")return html`<div className="rp" style=${{minHeight:"100vh"}}><div className="card" style=${{maxWidth:480}}><h3>Couldn't load your account</h3>
  <p className="mute" style=${{marginTop:8}}>${meErr||"Something went wrong talking to the CareSync API."}</p>
  <p className="mute sm" style=${{marginTop:8}}>If this says the API can't be reached, make sure the backend is running (<code>uvicorn app.main:app --reload --port 8000</code> in <code>backend/</code>).</p>
  <div className="row" style=${{gap:10,marginTop:16}}><button className="btn" onClick=${loadMe}>Retry</button><button className="btn o" onClick=${logout}>Logout</button></div>
  </div></div>`;
 if(!me)return html`<div className="rp" style=${{minHeight:"100vh"}}><p className="mute row"><span className="spin" style=${{borderTopColor:"var(--teal)",borderColor:"var(--line)"}}></span>Loading your account...</p></div>`;
 return me.role=="doctor"?html`<${Doctor} me=${me} onOut=${logout}/>`:html`<${PatientApp} me=${me} onOut=${logout}/>`}
export default App;
