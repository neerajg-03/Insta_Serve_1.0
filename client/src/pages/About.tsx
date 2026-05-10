import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Inline SVG Icons ── */
const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3l5.8 1.9-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/><path d="M5 3l.7 2.1a1 1 0 0 0 .7.7L8.5 6.5 6.4 8.5a1 1 0 0 0-.7.7L5 11.5l-.7-2.1a1 1 0 0 0-.7-.7L1.5 6.5 3.6 4.4a1 1 0 0 0 .7-.7L5 1.5z"/></svg>
);
const UserGroupIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
const BoltIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);
const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
);
const RocketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);
const LightBulbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
);
const StarFill = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);

interface Testimonial {
  id: number;
  name: string;
  service: string;
  rating: number;
  comment: string;
  avatar: string;
  location: string;
  date: string;
}

const About: React.FC = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const mockTestimonials: Testimonial[] = [
      {
        id: 1,
        name: "Sarah Johnson",
        service: "Home Cleaning",
        rating: 5,
        comment: "Amazing service! The provider was professional and did an excellent job. Highly recommend InstaServe!",
        avatar: "SJ",
        location: "Delhi",
        date: "2 days ago"
      },
      {
        id: 2,
        name: "Michael Chen",
        service: "AC Repair",
        rating: 5,
        comment: "Quick response time and expert service. My AC was fixed within hours. Great platform!",
        avatar: "MC",
        location: "Mumbai",
        date: "1 week ago"
      },
      {
        id: 3,
        name: "Emily Rodriguez",
        service: "Plumbing",
        rating: 4,
        comment: "Reliable and affordable. The plumber arrived on time and solved the issue efficiently.",
        avatar: "ER",
        location: "Bangalore",
        date: "2 weeks ago"
      },
      {
        id: 4,
        name: "David Kim",
        service: "Electrical Work",
        rating: 5,
        comment: "Professional electrician with great knowledge. Safety was prioritized throughout the service.",
        avatar: "DK",
        location: "Pune",
        date: "3 weeks ago"
      }
    ];
    setTestimonials(mockTestimonials);
  }, []);



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

        @keyframes orb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-25px) scale(1.04)}66%{transform:translate(-20px,35px) scale(.96)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}

        .shimmer{background:linear-gradient(90deg,#fff 20%,#a78bfa 45%,#22d3ee 62%,#fff 80%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}

        .btn-primary{display:inline-flex;align-items:center;gap:10px;padding:14px 28px;min-height:44px;background:#fff;color:#060609;font-size:15px;font-weight:700;border-radius:100px;text-decoration:none;letter-spacing:.2px;transition:transform .22s,box-shadow .22s;box-shadow:0 0 40px rgba(255,255,255,.12);border:none;cursor:pointer}
        .btn-primary:hover{transform:scale(1.04);box-shadow:0 0 64px rgba(255,255,255,.24)}
        .btn-ghost{display:inline-flex;align-items:center;gap:10px;padding:14px 28px;min-height:44px;background:transparent;color:rgba(255,255,255,.75);font-size:15px;font-weight:600;border-radius:100px;border:1px solid rgba(255,255,255,.18);text-decoration:none;transition:background .22s,color .22s;cursor:pointer}
        .btn-ghost:hover{background:rgba(255,255,255,.08);color:#fff}

        .card{background:var(--surf);border:1px solid var(--bord);border-radius:22px;padding:32px 28px;transition:border-color .3s,transform .3s}
        .card:hover{border-color:rgba(255,255,255,.18);transform:translateY(-4px)}

        @media(max-width:900px){
          .grid-2{grid-template-columns:1fr !important}
          .grid-4{grid-template-columns:repeat(2,1fr) !important}
        }
        @media(max-width:640px){
          .grid-4{grid-template-columns:1fr !important}
          .hero-h{font-size:clamp(32px,10vw,48px) !important}
        }
      `}</style>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative min-h-[50vh] flex items-center px-6 py-16 md:py-20 lg:py-24 overflow-hidden">
        {/* Orbs */}
        <div style={{position:'absolute',top:'10%',left:'5%',width:560,height:560,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.3) 0%,transparent 70%)',animation:'orb 20s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'45%',right:'3%',width:420,height:420,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,.2) 0%,transparent 70%)',animation:'orb 26s ease-in-out infinite reverse',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'5%',left:'35%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(244,114,182,.16) 0%,transparent 70%)',animation:'orb 18s ease-in-out infinite 4s',pointerEvents:'none'}}/>

        {/* Grid pattern */}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)',backgroundSize:'72px 72px',pointerEvents:'none'}}/>

        <div style={{maxWidth:1260,margin:'0 auto',width:'100%',position:'relative',zIndex:2,textAlign:'center'}}>
          <div style={{marginBottom:28}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',background:'rgba(124,58,237,.13)',border:'1px solid rgba(124,58,237,.35)',borderRadius:100,fontSize:12,color:'rgba(255,255,255,.85)',letterSpacing:'.6px',fontWeight:600}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:'#4ADE80',display:'inline-block',boxShadow:'0 0 10px #4ADE80'}}/>
              Trusted by 50,000+ customers
            </span>
          </div>

          <h1 style={{fontSize:'clamp(50px,6.5vw,92px)',fontWeight:900,lineHeight:1.02,letterSpacing:'-2.5px',marginBottom:24}}>
            About{' '}
            <span className="shimmer">InstaServe</span>
          </h1>

          <p style={{fontSize:17,color:'rgba(255,255,255,.48)',maxWidth:600,lineHeight:1.78,marginBottom:44,fontWeight:300,margin:'0 auto 44px'}}>
            Your trusted platform for connecting with local service providers.
            <span style={{color:'#06B6D4',fontWeight:600}}> Live.</span>{' '}
            <span style={{color:'#7C3AED',fontWeight:600}}> Reliable.</span>{' '}
            <span style={{color:'#4ADE80',fontWeight:600}}> Professional.</span>
          </p>
        </div>
      </section>

      {/* ══════════════ STORY & MISSION ══════════════ */}
      <section className="px-6 py-12 md:py-16">
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div className="grid-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Our Story */}
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
                <div style={{background:'var(--accent)',padding:12,borderRadius:12}}>
                  <RocketIcon/>
                </div>
                <h2 style={{fontSize:24,fontWeight:800,letterSpacing:'-.5px'}}>Our Story</h2>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                <p style={{fontSize:15,color:'var(--muted)',lineHeight:1.7}}>
                  Founded in 2024, InstaServe was born from a simple idea: connecting people who need services with trusted local professionals. We noticed that finding reliable service providers in your area shouldn't be complicated.
                </p>
                <p style={{fontSize:15,color:'var(--muted)',lineHeight:1.7}}>
                  What started as a small platform has grown into a comprehensive marketplace serving thousands of customers across multiple service categories. Our mission remains the same: to make quality services accessible to everyone.
                </p>
                <p style={{fontSize:15,color:'var(--muted)',lineHeight:1.7}}>
                  Today, we're proud to be the fastest-growing service marketplace in India, with thousands of verified providers and millions of happy customers.
                </p>
              </div>
            </div>

            {/* Our Mission */}
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
                <div style={{background:'linear-gradient(135deg,#06B6D4,#4ADE80)',padding:12,borderRadius:12}}>
                  <LightBulbIcon/>
                </div>
                <h2 style={{fontSize:24,fontWeight:800,letterSpacing:'-.5px'}}>Our Mission</h2>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:24}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:16}}>
                  <div style={{background:'rgba(124,58,237,.15)',padding:12,borderRadius:12,flexShrink:0}}>
                    <UserGroupIcon/>
                  </div>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>Connect</h3>
                    <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.6}}>Bridge gap between customers and trusted service providers</p>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'flex-start',gap:16}}>
                  <div style={{background:'rgba(74,222,128,.15)',padding:12,borderRadius:12,flexShrink:0}}>
                    <ShieldCheckIcon/>
                  </div>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>Quality</h3>
                    <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.6}}>Ensure every provider is verified and delivers exceptional service</p>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'flex-start',gap:16}}>
                  <div style={{background:'rgba(244,114,182,.15)',padding:12,borderRadius:12,flexShrink:0}}>
                    <HeartIcon/>
                  </div>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>Trust</h3>
                    <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.6}}>Build a community where safety and reliability are paramount</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CORE VALUES ══════════════ */}
      <section className="px-6 py-12 md:py-16">
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div className="card">
            <div style={{textAlign:'center',marginBottom:40}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
                <div style={{background:'var(--accent)',padding:12,borderRadius:12}}>
                  <StarIcon/>
                </div>
              </div>
              <h2 style={{fontSize:36,fontWeight:900,letterSpacing:'-1.5px',marginBottom:12}}>Our Core Values</h2>
              <p style={{fontSize:16,color:'var(--muted)',maxWidth:500,margin:'0 auto'}}>The principles that guide everything we do</p>
            </div>

            <div className="grid-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div style={{textAlign:'center'}}>
                <div style={{background:'linear-gradient(135deg,#7C3AED,#6366F1)',width:80,height:80,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16',transition:'transform .3s'}}>
                  <ShieldCheckIcon/>
                </div>
                <h3 style={{fontSize:18,fontWeight:800,marginBottom:8}}>Trust</h3>
                <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.5}}>Verified providers and secure transactions</p>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{background:'linear-gradient(135deg,#4ADE80,#06B6D4)',width:80,height:80,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16',transition:'transform .3s'}}>
                  <StarIcon/>
                </div>
                <h3 style={{fontSize:18,fontWeight:800,marginBottom:8}}>Quality</h3>
                <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.5}}>Exceptional service delivery</p>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{background:'linear-gradient(135deg,#A78BFA,#F472B6)',width:80,height:80,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16',transition:'transform .3s'}}>
                  <BoltIcon/>
                </div>
                <h3 style={{fontSize:18,fontWeight:800,marginBottom:8}}>Speed</h3>
                <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.5}}>Quick and easy booking</p>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{background:'linear-gradient(135deg,#F59E0B,#EF4444)',width:80,height:80,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16',transition:'transform .3s'}}>
                  <HeartIcon/>
                </div>
                <h3 style={{fontSize:18,fontWeight:800,marginBottom:8}}>Community</h3>
                <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.5}}>Building local connections</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="px-6 py-12 md:py-16">
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div className="card">
            <div style={{textAlign:'center',marginBottom:40}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
                <div style={{background:'var(--accent)',padding:12,borderRadius:12}}>
                  <ChatIcon/>
                </div>
              </div>
              <h2 style={{fontSize:36,fontWeight:900,letterSpacing:'-1.5px',marginBottom:12}}>What Our Customers Say</h2>
              <p style={{fontSize:16,color:'var(--muted)',maxWidth:500,margin:'0 auto'}}>Real experiences from real customers</p>
            </div>

            <div className="grid-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} style={{background:'var(--surf2)',borderRadius:20,padding:24,border:'1px solid var(--bord)',transition:'border-color .3s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                    <div style={{width:48,height:48,background:'linear-gradient(135deg,var(--accent),var(--c2))',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:18}}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 style={{fontSize:15,fontWeight:700}}>{testimonial.name}</h4>
                      <p style={{fontSize:12,color:'var(--muted)'}}>{testimonial.location}</p>
                    </div>
                  </div>
                  
                  <div style={{display:'flex',gap:4,marginBottom:12}}>
                    {[...Array(5)].map((_, i) => (
                      <StarFill key={i}/>
                    ))}
                  </div>
                  
                  <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.6,marginBottom:16,fontStyle:'italic'}}>"{testimonial.comment}"</p>
                  
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11,color:'var(--muted)',paddingTop:12,borderTop:'1px solid var(--bord)'}}>
                    <span style={{fontWeight:600}}>{testimonial.service}</span>
                    <span>{testimonial.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="px-6 py-12 md:py-16 lg:py-24">
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div style={{position:'relative',borderRadius:28,overflow:'hidden',border:'1px solid var(--bord)'}}>
            <img
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80"
              alt="Happy customers"
              className="w-full h-80 md:h-96 lg:h-[480px] object-cover"
            />
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(6,6,9,.97) 38%,rgba(6,6,9,.4))'}}/>

            <div className="absolute inset-0 flex items-center px-6 md:px-12 lg:px-16">
              <div className="max-w-lg md:max-w-xl lg:max-w-2xl">
                <div style={{display:'flex',justifyContent:'center',marginBottom:28}}>
                  <div style={{background:'rgba(255,255,255,.2)',backdropFilter:'blur(12px)',padding:16,borderRadius:20}}>
                    <RocketIcon/>
                  </div>
                </div>
                <h2 style={{fontSize:'clamp(34px,4.5vw,64px)',fontWeight:900,letterSpacing:'-2px',lineHeight:1.05,marginBottom:20,textAlign:'center'}}>
                  Join Our Growing{' '}
                  <span className="shimmer">Community</span>
                </h2>
                <p style={{fontSize:16,color:'rgba(255,255,255,.46)',marginBottom:42,lineHeight:1.75,fontWeight:300,textAlign:'center',maxWidth:440,margin:'0 auto 42px'}}>
                  Whether you're looking for reliable services or want to offer your skills, InstaServe is the platform for you.
                </p>
                <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center'}}>
                  <button
                    onClick={() => navigate('/register')}
                    className="btn-primary"
                    style={{fontSize:15,padding:'17px 38px'}}
                  >
                    Join as Provider <ArrowRightIcon/>
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="btn-ghost"
                    style={{fontSize:15,padding:'17px 38px'}}
                  >
                    Browse Services <SparklesIcon/>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
