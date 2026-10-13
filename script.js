const $$=(s)=>Array.from(document.querySelectorAll(s));
const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -30px 0px'});$$('.reveal').forEach(el=>obs.observe(el));
const threadObs=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('active');threadObs.unobserve(e.target)}}),{threshold:.22});$$('.thread-stage,.closing-thread').forEach(el=>threadObs.observe(el));
const p=document.getElementById('progress');let raf=false;function progress(){if(raf)return;raf=true;requestAnimationFrame(()=>{const h=document.documentElement;const max=h.scrollHeight-innerHeight;p.style.width=(max>0?(scrollY/max)*100:0)+'%';raf=false})}addEventListener('scroll',progress,{passive:true});progress();
const mb=document.getElementById('menuButton'),mn=document.getElementById('mobileNav');mb.addEventListener('click',()=>{const open=mn.classList.toggle('open');mb.setAttribute('aria-expanded',open?'true':'false')});$$('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>{mn.classList.remove('open');mb.setAttribute('aria-expanded','false')}));
const plans={'1':'assets/plan1.webp','2':'assets/plan2.webp','3':'assets/plan3.webp'};let current='1';$$('.plan-tab').forEach(b=>b.addEventListener('click',()=>{current=b.dataset.plan;document.getElementById('planImage').src=plans[current];document.getElementById('planImage').alt=current+'階平面図';$$('.plan-tab').forEach(t=>{const act=t===b;t.classList.toggle('active',act);t.setAttribute('aria-selected',String(act))})}));
const lightbox=document.getElementById('lightbox'),lbImg=document.getElementById('lightboxImage');function openLb(src,alt){lbImg.src=src;lbImg.alt=alt||'拡大表示';lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}function closeLb(){lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');document.body.style.overflow='';lbImg.removeAttribute('src')};document.getElementById('planZoom').addEventListener('click',()=>openLb(plans[current],current+'階平面図'));$$('.image-lightbox').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openLb(a.getAttribute('href'),a.querySelector('img').alt)}));document.getElementById('lightboxClose').addEventListener('click',closeLb);lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLb()});addEventListener('keydown',e=>{if(e.key==='Escape')closeLb()});

// Remove opening after the CSS transition, while preserving scroll/navigation.
const openingVeil=document.getElementById('openingVeil');
if(openingVeil){openingVeil.addEventListener('animationend',event=>{if(event.animationName==='veilLeave'){openingVeil.remove();document.body.classList.remove('opening-playing')}});}




// Smooth the thread geometry so it reads as silk rather than connected straight segments.
(function(){
  function parsePoints(d){
    const nums=(d.match(/-?\d*\.?\d+/g)||[]).map(Number);
    const pts=[];
    for(let i=0;i<nums.length;i+=2){ pts.push({x:nums[i],y:nums[i+1]}); }
    return pts;
  }
  function catmullRom2bezier(points){
    if(!points || points.length<2) return '';
    let d=`M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for(let i=0;i<points.length-1;i++){
      const p0=points[i-1] || points[i];
      const p1=points[i];
      const p2=points[i+1];
      const p3=points[i+2] || p2;
      const cp1x=p1.x + (p2.x-p0.x)/6;
      const cp1y=p1.y + (p2.y-p0.y)/6;
      const cp2x=p2.x - (p3.x-p1.x)/6;
      const cp2y=p2.y - (p3.y-p1.y)/6;
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }
  function smoothAllThreads(root=document){
    root.querySelectorAll('.grand-thread').forEach(path=>{
      if(path.dataset.smoothed==='1') return;
      const pts=parsePoints(path.getAttribute('d')||'');
      if(pts.length>3){
        path.setAttribute('d',catmullRom2bezier(pts));
        path.dataset.smoothed='1';
      }
    });
  }
  smoothAllThreads(document);
  const original=document.querySelector('#threadStage svg.grand-weave');
  if(!original) return;
  [['.opening-ambient'],['.intro-ambient'],['.owner-ambient']].forEach(([sel])=>{
    const target=document.querySelector(sel);
    if(!target) return;
    const copy=original.cloneNode(true);
    copy.classList.add('ambient-weave');
    copy.removeAttribute('id');
    smoothAllThreads(copy);
    target.appendChild(copy);
  });
})();


// Living silk: continuously morph each strand's geometry without blinking or redrawing strokes.
(function(){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches)return;
  const instances=[...document.querySelectorAll('.opening-ambient .grand-thread,.intro-ambient .grand-thread,.owner-ambient .grand-thread,.grand-stage .grand-thread')].map((node,index)=>{
    const d=node.getAttribute('d')||'';
    const matches=[...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));
    // Paths are converted to cubic curves by the existing smoothing routine. Extract endpoints,
    // then remake fresh smooth curves every frame.
    let pts=[];
    if(d.includes(' C ')){
      if(matches.length>=2)pts.push([matches[0],matches[1]]);
      for(let i=2;i+5<matches.length;i+=6)pts.push([matches[i+4],matches[i+5]]);
    }
    if(pts.length<8)return null;
    const inStage=Boolean(node.closest('.grand-stage'));
    return {node,pts,index,amplitude:inStage?25:36,
      phase:index*.37,frequency:.0085+(index%7)*.00023,velocity:.00019+(index%5)*.000025};
  }).filter(Boolean);
  function renderPath(item,t){
    const arr=item.pts.map(([x,y],i)=>{
      const envelope=Math.sin(Math.PI*i/(item.pts.length-1))**.65;
      const displacement=(Math.sin(y*item.frequency-t*item.velocity+item.phase)*.7+
        Math.sin(y*.0042+t*.00013+item.phase*.6)*.3)*item.amplitude*envelope;
      return [x+displacement,y];
    });
    let d='M '+arr[0][0].toFixed(2)+' '+arr[0][1].toFixed(2);
    for(let i=0;i<arr.length-1;i++){
      const p0=arr[Math.max(0,i-1)],p1=arr[i],p2=arr[i+1],p3=arr[Math.min(arr.length-1,i+2)];
      const a=p1[0]+(p2[0]-p0[0])/6,b=p1[1]+(p2[1]-p0[1])/6;
      const c=p2[0]-(p3[0]-p1[0])/6,e=p2[1]-(p3[1]-p1[1])/6;
      d+=' C '+a.toFixed(2)+' '+b.toFixed(2)+' '+c.toFixed(2)+' '+e.toFixed(2)+' '+p2[0].toFixed(2)+' '+p2[1].toFixed(2);
    }
    item.node.setAttribute('d',d);
  }
  let last=0;
  function tick(now){
    if(now-last>33){
      last=now;
      for(const item of instances){
        const el=item.node.closest('.opening-ambient,.intro-ambient,.owner-ambient,.grand-stage');
        if(!el||!el.isConnected)continue;
        const r=el.getBoundingClientRect();
        if(r.bottom<0||r.top>innerHeight)continue;
        renderPath(item,now);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
