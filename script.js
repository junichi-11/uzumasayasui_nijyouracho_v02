const $$=(s)=>Array.from(document.querySelectorAll(s));
const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -30px 0px'});$$('.reveal').forEach(el=>obs.observe(el));
const threadObs=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('active');threadObs.unobserve(e.target)}}),{threshold:.22});$$('.thread-stage,.closing-thread').forEach(el=>threadObs.observe(el));
const p=document.getElementById('progress');let raf=false;function progress(){if(raf)return;raf=true;requestAnimationFrame(()=>{const h=document.documentElement;const max=h.scrollHeight-innerHeight;p.style.width=(max>0?(scrollY/max)*100:0)+'%';raf=false})}addEventListener('scroll',progress,{passive:true});progress();
const mb=document.getElementById('menuButton'),mn=document.getElementById('mobileNav');mb.addEventListener('click',()=>{const open=mn.classList.toggle('open');mb.setAttribute('aria-expanded',open?'true':'false')});$$('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>{mn.classList.remove('open');mb.setAttribute('aria-expanded','false')}));
const plans={'1':'assets/plan1.webp','2':'assets/plan2.webp','3':'assets/plan3.webp'};let current='1';$$('.plan-tab').forEach(b=>b.addEventListener('click',()=>{current=b.dataset.plan;document.getElementById('planImage').src=plans[current];document.getElementById('planImage').alt=current+'階平面図';$$('.plan-tab').forEach(t=>{const act=t===b;t.classList.toggle('active',act);t.setAttribute('aria-selected',String(act))})}));
const lightbox=document.getElementById('lightbox'),lbImg=document.getElementById('lightboxImage');function openLb(src,alt){lbImg.src=src;lbImg.alt=alt||'拡大表示';lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}function closeLb(){lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');document.body.style.overflow='';lbImg.removeAttribute('src')};document.getElementById('planZoom').addEventListener('click',()=>openLb(plans[current],current+'階平面図'));$$('.image-lightbox').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openLb(a.getAttribute('href'),a.querySelector('img').alt)}));document.getElementById('lightboxClose').addEventListener('click',closeLb);lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLb()});addEventListener('keydown',e=>{if(e.key==='Escape')closeLb()});

// Remove opening after the CSS transition, while preserving scroll/navigation.
const openingVeil=document.getElementById('openingVeil');
if(openingVeil){const finishOpening=()=>{openingVeil.remove();document.body.classList.remove('opening-playing')};openingVeil.addEventListener('animationend',event=>{if(event.target===openingVeil && (event.animationName==='openingCrossfade'||event.animationName==='veilLeave'))finishOpening()});if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)finishOpening();}






// Luminous-but-restrained loom: a moving drawing front travels DOWN the silky cubic path.
// Unlike geometric wobble, the travelling stroke is the animation; no opacity pulsing.
(function(){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const NS='http://www.w3.org/2000/svg';
 const svgEl=(tag,props={})=>{const el=document.createElementNS(NS,tag);Object.entries(props).forEach(([k,v])=>el.setAttribute(k,v));return el;};
 function makeLoom(type){
  const svg=svgEl('svg',{class:'loom-svg loom-'+type,viewBox:'0 0 1100 1600',preserveAspectRatio:'xMidYMid slice','aria-hidden':'true'});
  const grp=svgEl('g',{class:'loom-bundle'});svg.appendChild(grp);
  const count=type==='stage'?43:36;
  for(let i=0;i<count;i++){
    const u=i/(count-1),x0=185+i*(730/(count-1));
    const phase=(i%9)*.4;
    // All paths are cubic; they cross in the middle, open again, and gently taper.
    const start=x0+(u-.5)*40;
    const midway=550+(u-.5)*155+Math.sin(i*.67)*28;
    const lower=550-(u-.5)*515+Math.sin(i*.41)*23;
    const end=x0+Math.sin(i*.31)*26;
    const d=`M ${start.toFixed(2)} -220 C ${(start+Math.sin(phase)*38).toFixed(2)} 160, ${(midway-75).toFixed(2)} 350, ${midway.toFixed(2)} 710 S ${lower.toFixed(2)} 1110, ${lower.toFixed(2)} 1270 S ${end.toFixed(2)} 1510, ${end.toFixed(2)} 1840`;
    const tone=i%8===0?'#ac9679':i%4===0?'#718879':'#9caa9d';
    const strand=svgEl('path',{d,stroke:tone,class:'loom-under',style:`--thread:${i};--base:${(0.13+(i%6)*.015).toFixed(2)}`});
    const traveling=svgEl('path',{d,stroke:tone,class:'loom-travel',style:`--thread:${i};--travel-delay:${(-i*.29).toFixed(2)}s;--speed:${(18+(i%7)*1.4).toFixed(2)}s`});
    grp.appendChild(strand);grp.appendChild(traveling);
    // One-time drawing grows from top to bottom, retaining the finished line afterwards.
    if(!reduced){
      const length=traveling.getTotalLength();
      traveling.style.strokeDasharray=`${(length*.24).toFixed(1)} ${length.toFixed(1)}`;
      traveling.style.setProperty('--length',length.toFixed(1));
      traveling.style.setProperty('--offset',(length*.24).toFixed(1));
    }
  }
  return svg;
 }
 const areas=[['.opening-ambient','opening'],['.intro-ambient','intro'],['#threadStage','stage'],['.owner-ambient','owner']];
 for(const [selector,type] of areas){
  const target=document.querySelector(selector);if(!target)continue;
  target.querySelectorAll('svg').forEach(n=>n.remove());
  target.appendChild(makeLoom(type));
  target.classList.add('loom-host');
 }
 // Observe the main weaving scene; only animate when it enters view.
 const stage=document.getElementById('threadStage');
 if(stage){const io=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){stage.classList.add('loom-running');io.unobserve(stage)}
 }),{threshold:.08});io.observe(stage)}
})();
