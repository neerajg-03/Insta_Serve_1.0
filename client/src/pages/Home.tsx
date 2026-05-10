import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

/* ── Hero Carousel Component ── */
const HERO_IMAGES = [
  '/images/hero1.jpg',
  '/images/hero2.jpg',
  '/images/hero3.jpg',
  '/images/hero4.jpg',
];

const HeroCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{position:'relative',width:'100%',height:'100vh',overflow:'hidden'}}>
      {HERO_IMAGES.map((img, idx) => (
        <div
          key={idx}
          style={{
            position:'absolute',
            inset:0,
            opacity: idx === current ? 1 : 0,
            transition:'opacity 1.2s ease-in-out',
          }}
        >
          <img 
            src={img} 
            alt={`Home service ${idx + 1}`} 
            style={{width:'100%',height:'100%',objectFit:'cover'}}
          />
        </div>
      ))}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(6,6,9,1) 100%)',zIndex:1}}/>
      
      {/* Dots indicator */}
      <div style={{position:'absolute',bottom:'10%',left:'50%',transform:'translateX(-50%)',display:'flex',gap:10,zIndex:2}}>
        {HERO_IMAGES.map((_, idx) => (
          <div
            key={idx}
            style={{
              width:5,
              height:5,
              borderRadius:'50%',
              background: idx === current ? '#fff' : 'rgba(255,255,255,0.4)',
              transition:'background 0.3s',
              cursor:'pointer',
            }}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
};

/* ── Inline SVG Icons ── */
const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);
const ArrowUpRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
);
const StarFill = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
);

/* ── Categories with Unsplash images ── */
const CATEGORIES = [
  {
    id: 'cleaning', label: 'Home Cleaning', tag: 'Most Booked',
    accent: '#22D3EE',
    img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
    desc: 'Deep clean, bathroom, kitchen & more',
  },
  {
    id: 'beauty', label: 'Beauty & Spa', tag: 'Trending',
    accent: '#F472B6',
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
    desc: 'Facial, waxing, manicure, hair spa',
  },
  {
    id: 'repair', label: 'Appliance Repair', tag: null,
    accent: '#34D399',
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
    desc: 'AC, fridge, washing machine, TV',
  },
  {
    id: 'plumbing', label: 'Plumbing', tag: null,
    accent: '#FBBF24',
    img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80',
    desc: 'Leaks, taps, pipe fitting, tanks',
  },
  {
    id: 'electrical', label: 'Electrical', tag: null,
    accent: '#A78BFA',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    desc: 'Wiring, fans, switchboard, inverter',
  },
  {
    id: 'painting', label: 'Painting', tag: null,
    accent: '#FB923C',
    img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80',
    desc: 'Interior, exterior, texture walls',
  },
];

const TRUST = [
  'Background verified',
  'No hidden charges',
  'Money-back guarantee',
  'On-time or free',
];


const FALLBACK_REVIEWS = [
  { _id: '1', name: 'Priya Sharma', service: 'Home Cleaning', city: 'Mumbai', rating: 5, content: 'Absolutely spotless. Arrived 5 minutes early and left the house better than I imagined. Booking again this weekend.' },
  { _id: '2', name: 'Arjun Mehta', service: 'AC Repair', city: 'Delhi', rating: 5, content: 'Fixed my AC in under an hour. Transparent pricing, no surprise charges. The app makes everything effortless.' },
  { _id: '3', name: 'Kavya Reddy', service: 'Beauty & Spa', city: 'Bangalore', rating: 5, content: "Salon-quality facial at home. I'll never go out for beauty again. So convenient, so worth every rupee." },
];

/* ── useInView ── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLElement | null>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, vis };
}

/* ════════════ MAIN ════════════ */
const Home: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState(0);

  useEffect(() => {
    api.get('/bookings/reviews?limit=3')
      .then(r => { if (r.data.success && r.data.testimonials.length) setReviews(r.data.testimonials); })
      .catch(() => {});
  }, []);

  
  useEffect(() => {
    const t = setInterval(() => setActiveCat(p => (p + 1) % CATEGORIES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const displayReviews = reviews.length > 0 ? reviews : FALLBACK_REVIEWS;

  const heroSec = useInView(0.05);
  const catSec  = useInView(0.08);
  const revSec  = useInView(0.08);
  const ctaSec  = useInView(0.08);

  return (
    <div style={{ fontFamily: "'Sora','DM Sans',system-ui,sans-serif", background: '#060609', color: '#fff', overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:#7C3AED;color:#fff}
        :root{
          --accent:#7C3AED;--c2:#06B6D4;--gold:#F59E0B;
          --surf:#0D0D14;--surf2:#13131C;
          --bord:rgba(255,255,255,0.08);
          --muted:rgba(255,255,255,0.42);
        }
        html{scroll-behavior:smooth}

        .fu{opacity:0;transform:translateY(28px);transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1)}
        .fu.in{opacity:1;transform:none}
        .fu.d1{transition-delay:.12s}.fu.d2{transition-delay:.24s}.fu.d3{transition-delay:.38s}.fu.d4{transition-delay:.52s}

        .grain{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.03;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:160px 160px;animation:grain 8s steps(10) infinite}
        @keyframes grain{0%,100%{transform:translate(0,0)}20%{transform:translate(-1%,2%)}40%{transform:translate(2%,-1%)}60%{transform:translate(-2%,2%)}80%{transform:translate(1%,-2%)}}

        @keyframes orb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-25px) scale(1.04)}66%{transform:translate(-20px,35px) scale(.96)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes pulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}

        .shimmer{background:linear-gradient(90deg,#fff 20%,#a78bfa 45%,#22d3ee 62%,#fff 80%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}

        .btn-primary{display:inline-flex;align-items:center;gap:10px;padding:16px 34px;background:#fff;color:#060609;font-size:15px;font-weight:700;border-radius:100px;text-decoration:none;letter-spacing:.2px;transition:transform .22s,box-shadow .22s;box-shadow:0 0 40px rgba(255,255,255,.12)}
        .btn-primary:hover{transform:scale(1.04);box-shadow:0 0 64px rgba(255,255,255,.24)}
        .btn-ghost{display:inline-flex;align-items:center;gap:10px;padding:16px 34px;background:transparent;color:rgba(255,255,255,.75);font-size:15px;font-weight:600;border-radius:100px;border:1px solid rgba(255,255,255,.18);text-decoration:none;transition:background .22s,color .22s}
        .btn-ghost:hover{background:rgba(255,255,255,.08);color:#fff}

        .ccat{position:relative;overflow:hidden;background:var(--surf);border:1px solid var(--bord);border-radius:22px;cursor:pointer;text-decoration:none;color:#fff;display:block;transition:transform .35s cubic-bezier(.22,1,.36,1),border-color .3s,box-shadow .3s}
        .ccat:hover{transform:translateY(-8px);box-shadow:0 28px 70px rgba(0,0,0,.55)}
        .ccat img{transition:transform .5s cubic-bezier(.22,1,.36,1)}
        .ccat:hover img{transform:scale(1.07)}

        .rcard{background:var(--surf);border:1px solid var(--bord);border-radius:22px;padding:32px 28px;transition:border-color .3s,transform .3s}
        .rcard:hover{border-color:rgba(255,255,255,.18);transform:translateY(-4px)}

        
        @media(max-width:900px){
          .hero-h{font-size:clamp(44px,11vw,72px) !important}
          .hero-split{flex-direction:column !important}
          .cats-grid{grid-template-columns:repeat(2,1fr) !important}
          .rev-grid{grid-template-columns:1fr !important}
          .cta-btns{flex-direction:column !important;align-items:flex-start !important}
        }
      `}</style>

      <div className="grain" />

      {/* ══════════════ HERO ══════════════ */}
      <section ref={heroSec.ref as any} style={{ position:'relative', overflow:'hidden' }}>

        {/* Full Window Background Image Carousel */}
        <HeroCarousel />

        {/* Taglines below the image */}
        <div style={{position:'relative',zIndex:2,background:'#060609',padding:'60px 24px 80px',textAlign:'center'}}>
          <div style={{maxWidth:900,margin:'0 auto'}}>

            <h1 className={`hero-h fu d1 ${heroSec.vis?'in':''}`} style={{fontSize:'clamp(42px,6vw,72px)',fontWeight:900,lineHeight:1.05,letterSpacing:'-2px',marginBottom:20}}>
              Every home service,{' '}
              <span className="shimmer">at your door.</span>
            </h1>

           

            <p className={`fu d3 ${heroSec.vis?'in':''}`} style={{fontSize:20,color:'rgba(255,255,255,.48)',maxWidth:560,lineHeight:1.78,margin:'0 auto 40px',fontWeight:300}}>
              Cleaning, repairs, beauty, plumbing and more — booked in seconds, delivered by verified professionals.
            </p>

            <div className={`fu d4 ${heroSec.vis?'in':''}`} style={{display:'flex',flexWrap:'wrap',gap:14,marginBottom:40,justifyContent:'center'}}>
              <Link to="/services" className="btn-primary">Book a Service <ArrowRight/></Link>
              <Link to="/register?type=provider" className="btn-ghost">Become a Partner</Link>
            </div>

            <div className={`fu d4 ${heroSec.vis?'in':''}`} style={{display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center'}}>
              {TRUST.map((t,i)=>(
                <span key={i} style={{display:'inline-flex',alignItems:'center',gap:7,fontSize:12,color:'rgba(255,255,255,.56)',padding:'7px 14px',background:'rgba(255,255,255,.05)',borderRadius:100,border:'1px solid rgba(255,255,255,.08)'}}>
                  <Check/>{t}
                </span>
              ))}
            </div>
          </div>
        </div>

      </section>


      
      {/* ══════════════ CATEGORIES ══════════════ */}
      <section ref={catSec.ref as any} style={{padding:'100px 24px'}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>

          <div className={`fu ${catSec.vis?'in':''}`} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:20,marginBottom:52}}>
            <div>
              <span style={{fontSize:30,color:'var(--c2)',letterSpacing:'2.5px',textTransform:'uppercase',fontWeight:700}}>Services</span>
              <h2 style={{fontSize:'clamp(30px,4vw,52px)',fontWeight:900,letterSpacing:'-1.5px',marginTop:10,lineHeight:1.08}}>
                What do you need help with?
              </h2>
            </div>
            <Link to="/services" style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13,color:'rgba(255,255,255,.45)',textDecoration:'none',padding:'11px 22px',border:'1px solid var(--bord)',borderRadius:100,fontWeight:500,whiteSpace:'nowrap',transition:'color .2s,border-color .2s'}}
              onMouseEnter={e=>{const a=e.currentTarget as HTMLAnchorElement;a.style.color='#fff';a.style.borderColor='rgba(255,255,255,.28)'}}
              onMouseLeave={e=>{const a=e.currentTarget as HTMLAnchorElement;a.style.color='rgba(255,255,255,.45)';a.style.borderColor='var(--bord)'}}>
              View all 200+ <ArrowRight/>
            </Link>
          </div>

          <div className={`cats-grid fu d1 ${catSec.vis?'in':''}`} style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}>
            {CATEGORIES.map((cat,i)=>(
              <Link
                key={cat.id}
                to={`/services?category=${encodeURIComponent(cat.label)}`}
                className="ccat"
                onMouseEnter={()=>setActiveCat(i)}
                style={{borderColor:activeCat===i ? cat.accent+'44' : 'var(--bord)'}}
              >
                {/* Accent glow on hover */}
                <div style={{position:'absolute',top:-50,right:-50,width:160,height:160,borderRadius:'50%',background:`radial-gradient(circle,${cat.accent}20 0%,transparent 70%)`,transition:'opacity .3s',opacity:activeCat===i?1:0,pointerEvents:'none'}}/>

                {/* Photo */}
                <div style={{height:192,overflow:'hidden',position:'relative'}}>
                  <img src={cat.img} alt={cat.label} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  <div style={{position:'absolute',inset:0,background:`linear-gradient(to bottom, transparent 35%, rgba(13,13,20,.93))`}}/>
                  {cat.tag && (
                    <span style={{position:'absolute',top:14,right:14,fontSize:10,fontWeight:800,letterSpacing:'.7px',textTransform:'uppercase',padding:'5px 12px',borderRadius:100,background:cat.accent+'22',color:cat.accent,border:`1px solid ${cat.accent}44`,backdropFilter:'blur(8px)'}}>
                      {cat.tag}
                    </span>
                  )}
                </div>

                {/* Text */}
                <div style={{padding:'20px 22px 24px',position:'relative',zIndex:1}}>
                  <h3 style={{fontSize:16,fontWeight:800,marginBottom:5,letterSpacing:'-.2px'}}>{cat.label}</h3>
                  <p style={{fontSize:12.5,color:'var(--muted)',marginBottom:18,lineHeight:1.5}}>{cat.desc}</p>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:cat.accent,opacity:activeCat===i?1:.4,transition:'opacity .3s',fontWeight:700}}>
                      Book now <ArrowUpRight/>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      
      {/* ══════════════ REVIEWS ══════════════ */}
      <section ref={revSec.ref as any} style={{padding:'100px 24px'}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>

          <div className={`fu ${revSec.vis?'in':''}`} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:20,marginBottom:52}}>
            <div>
              <span style={{fontSize:30,color:'#F59E0B',letterSpacing:'2.5px',textTransform:'uppercase',fontWeight:700}}>Reviews</span>
              <h2 style={{fontSize:'clamp(30px,4vw,52px)',fontWeight:900,letterSpacing:'-1.5px',marginTop:10,lineHeight:1.08}}>
                Let's hear from our Customers
              </h2>
            </div>
          </div>

          <div className={`rev-grid fu d1 ${revSec.vis?'in':''}`} style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {displayReviews.map((r:any,i)=>(
              <div key={r._id} className="rcard" style={{transitionDelay:`${i*.14}s`}}>
                <div style={{display:'flex',gap:3,marginBottom:18}}>{[...Array(r.rating||5)].map((_,j)=><StarFill key={j}/>)}</div>
                <p style={{fontSize:15,color:'rgba(255,255,255,.68)',lineHeight:1.78,marginBottom:26,fontWeight:300,fontStyle:'italic'}}>
                  "{r.content}"
                </p>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--c2))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:17,flexShrink:0}}>
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700}}>{r.name}</div>
                    <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{r.service}{r.city?` · ${r.city}`:''}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section ref={ctaSec.ref as any} style={{padding:'0 24px 100px'}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div style={{position:'relative',borderRadius:28,overflow:'hidden',border:'1px solid var(--bord)'}}>
            <img
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80"
              alt="Happy family at home"
              style={{width:'100%',height:520,objectFit:'cover',display:'block'}}
            />
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(6,6,9,.97) 38%,rgba(6,6,9,.4))'}}/>

            <div className={`fu ${ctaSec.vis?'in':''}`} style={{position:'absolute',inset:0,display:'flex',alignItems:'center',padding:'64px'}}>
              <div style={{maxWidth:540}}>

                 

                <h2 style={{fontSize:'clamp(34px,4.5vw,64px)',fontWeight:900,letterSpacing:'-2px',lineHeight:1.05,marginBottom:20}}>
                  Your home deserves<br/>
                  <span className="shimmer">the best.</span>
                </h2>

               <p style={{fontSize:16,color:'rgba(255,255,255,.46)',marginBottom:42,lineHeight:1.75,fontWeight:300,maxWidth:440}}>
                 Join thousands of happy customers. Book today and experience the difference a professional makes.
               </p>

                <div className="cta-btns" style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                  <Link to="/services" className="btn-primary" style={{fontSize:18,padding:'17px 38px'}}>
                    Book Now<ArrowRight/>
                  </Link>
                  
                </div>


              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{borderTop:'1px solid var(--bord)',padding:'40px 24px',background:'var(--surf)'}}>
        <div style={{maxWidth:1260,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
          <div style={{fontSize:22,fontWeight:900,letterSpacing:'-1px'}}>
            Insta<span style={{color:'var(--accent)'}}>Serve</span>
          </div>
          <div style={{display:'flex',gap:28,flexWrap:'wrap'}}>
            {['Privacy','Terms','Support','Careers'].map(l=>(
              <a key={l} href="#" style={{fontSize:13,color:'var(--muted)',textDecoration:'none',transition:'color .2s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color='#fff'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color='rgba(255,255,255,.42)'}}>
                {l}
              </a>
            ))}
          </div>
          <p style={{fontSize:12,color:'var(--muted)'}}>© 2024 InstaServe · All rights reserved</p>
        </div>
      </footer>

    </div>
  );
};

export default Home;
