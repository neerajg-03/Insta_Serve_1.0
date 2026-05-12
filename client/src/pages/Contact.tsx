import React, { useState } from 'react';
import toast from 'react-hot-toast';

/* ── Inline SVG Icons ── */
const EnvelopeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
);
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const QuestionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const ChevronUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
);
const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3l5.8 1.9-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/><path d="M5 3l.7 2.1a1 1 0 0 0 .7.7L8.5 6.5 6.4 8.5a1 1 0 0 0-.7.7L5 11.5l-.7-2.1a1 1 0 0 0-.7-.7L1.5 6.5 3.6 4.4a1 1 0 0 0 .7-.7L5 1.5z"/></svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
);
const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [faqs] = useState<FAQ[]>([
    {
      id: 1,
      question: "How do I book a service on InstaServe?",
      answer: "Simply browse our services, select what you need, choose your preferred provider, and confirm your booking. You'll receive instant confirmation and real-time updates.",
      category: "Booking"
    },
    {
      id: 2,
      question: "Are the service providers verified?",
      answer: "Yes, all our service providers go through a thorough verification process including background checks, skill verification, and customer reviews to ensure quality and safety.",
      category: "Safety"
    },
    {
      id: 3,
      question: "What payment methods are accepted?",
      answer: "We accept all major credit/debit cards, UPI, net banking, and digital wallets. All payments are secure and processed through encrypted channels.",
      category: "Payment"
    },
    {
      id: 4,
      question: "Can I cancel or reschedule my booking?",
      answer: "Yes, you can cancel or reschedule your booking up to 2 hours before the service time without any charges. Refunds are processed within 24 hours.",
      category: "Booking"
    },
    {
      id: 5,
      question: "How are service providers selected?",
      answer: "Our algorithm considers proximity, availability, ratings, and expertise to match you with the best available provider in your area.",
      category: "Matching"
    },
    {
      id: 6,
      question: "What if I'm not satisfied with the service?",
      answer: "We offer a 100% satisfaction guarantee. If you're not happy with the service, we'll either arrange a re-service or provide a full refund.",
      category: "Support"
    },
    {
      id: 7,
      question: "How quickly can I get a service provider?",
      answer: "Most services are available within 30-60 minutes. Emergency services can be dispatched immediately based on provider availability in your area.",
      category: "Availability"
    },
    {
      id: 8,
      question: "Is my personal information secure?",
      answer: "Absolutely. We use industry-standard encryption and never share your personal information with third parties without your consent.",
      category: "Privacy"
    }
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/contact/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          type: 'user_concern'
        })
      });

      if (response.ok) {
        toast.success('Message sent to admin successfully! We\'ll get back to you within 24 hours.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Booking': return { bg: 'rgba(6,182,212,.15)', color: '#06B6D4', border: 'rgba(6,182,212,.3)' };
      case 'Safety': return { bg: 'rgba(74,222,128,.15)', color: '#4ADE80', border: 'rgba(74,222,128,.3)' };
      case 'Payment': return { bg: 'rgba(167,139,250,.15)', color: '#A78BFA', border: 'rgba(167,139,250,.3)' };
      case 'Matching': return { bg: 'rgba(251,191,36,.15)', color: '#FBBF24', border: 'rgba(251,191,36,.3)' };
      case 'Support': return { bg: 'rgba(248,113,113,.15)', color: '#F87171', border: 'rgba(248,113,113,.3)' };
      case 'Availability': return { bg: 'rgba(250,204,21,.15)', color: '#FACC15', border: 'rgba(250,204,21,.3)' };
      case 'Privacy': return { bg: 'rgba(99,102,241,.15)', color: '#6366F1', border: 'rgba(99,102,241,.3)' };
      default: return { bg: 'rgba(255,255,255,.1)', color: '#fff', border: 'rgba(255,255,255,.2)' };
    }
  };

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

        .btn-primary{display:inline-flex;align-items:center;gap:10px;padding:16px 34px;background:#fff;color:#060609;font-size:15px;font-weight:700;border-radius:100px;text-decoration:none;letter-spacing:.2px;transition:transform .22s,box-shadow .22s;box-shadow:0 0 40px rgba(255,255,255,.12);border:none;cursor:pointer}
        .btn-primary:hover{transform:scale(1.04);box-shadow:0 0 64px rgba(255,255,255,.24)}
        .btn-ghost{display:inline-flex;align-items:center;gap:10px;padding:16px 34px;background:transparent;color:rgba(255,255,255,.75);font-size:15px;font-weight:600;border-radius:100px;border:1px solid rgba(255,255,255,.18);text-decoration:none;transition:background .22s,color .22s;cursor:pointer}
        .btn-ghost:hover{background:rgba(255,255,255,.08);color:#fff}

        .card{background:var(--surf);border:1px solid var(--bord);border-radius:22px;padding:32px 28px;transition:border-color .3s,transform .3s}
        .card:hover{border-color:rgba(255,255,255,.18);transform:translateY(-4px)}

        .input-field{width:100%;padding:14px 18px;background:var(--surf2);border:1px solid var(--bord);border-radius:12;color:#fff;fontSize:15;transition:border-color .3s,background .3s}
        .input-field:focus{outline:none;border-color:var(--accent);background:rgba(124,58,237,.1)}
        .input-field::placeholder{color:var(--muted)}

        .faq-card{background:var(--surf);border:1px solid var(--bord);border-radius:22px;overflow:hidden;transition:border-color .3s}
        .faq-card:hover{border-color:rgba(255,255,255,.18)}

        @media(max-width:900px){
          .grid-2{grid-template-columns:1fr !important}
        }
      `}</style>

      {/* ══════════════ HERO ══════════════ */}
      <section style={{ position:'relative', minHeight:'50vh', display:'flex', alignItems:'center', padding:'120px 24px 80px', overflow:'hidden' }}>
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
              24/7 Support Available
            </span>
          </div>

          <h1 style={{fontSize:'clamp(50px,6.5vw,92px)',fontWeight:900,lineHeight:1.02,letterSpacing:'-2.5px',marginBottom:24}}>
            Get in{' '}
            <span className="shimmer">touch.</span>
          </h1>

          <p style={{fontSize:17,color:'rgba(255,255,255,.48)',maxWidth:600,lineHeight:1.78,marginBottom:44,fontWeight:300,margin:'0 auto 44px'}}>
            Have questions or concerns? We're here to help. Send us a message and our admin team will respond within 24 hours.
          </p>
        </div>
      </section>

      {/* ══════════════ CONTACT FORM & INFO ══════════════ */}
      <section style={{padding:'60px 24px'}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div className="grid-2" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:24}}>
            
            {/* Contact Form */}
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
                <div style={{background:'var(--accent)',padding:12,borderRadius:12}}>
                  <EnvelopeIcon/>
                </div>
                <div>
                  <h2 style={{fontSize:24,fontWeight:800,letterSpacing:'-.5px'}}>Send Message</h2>
                  <p style={{fontSize:14,color:'var(--muted)'}}>Your concerns will be reviewed by our admin team</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:20}}>
                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:8,letterSpacing:'.8px',textTransform:'uppercase'}}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:8,letterSpacing:'.8px',textTransform:'uppercase'}}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:8,letterSpacing:'.8px',textTransform:'uppercase'}}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="How can we help you?"
                    required
                  />
                </div>

                <div>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:8,letterSpacing:'.8px',textTransform:'uppercase'}}>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="input-field"
                    placeholder="Please describe your concern or question in detail..."
                    required
                    style={{resize:'none'}}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{width:'100%',justifyContent:'center',opacity:loading?.5:1,cursor:loading?'not-allowed':'pointer'}}
                >
                  {loading ? (
                    <>
                      <div style={{width:18,height:18,border:'2px solid #060609',borderTop:'2px solid transparent',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <EnvelopeIcon/>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div style={{display:'flex',flexDirection:'column',gap:24}}>
              
              {/* Quick Contact */}
              <div className="card">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
                  <div style={{background:'linear-gradient(135deg,#06B6D4,#4ADE80)',padding:12,borderRadius:12}}>
                    <PhoneIcon/>
                  </div>
                  <div>
                    <h2 style={{fontSize:24,fontWeight:800,letterSpacing:'-.5px'}}>Get in Touch</h2>
                    <p style={{fontSize:14,color:'var(--muted)'}}>Multiple ways to reach us</p>
                  </div>
                </div>
                
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:16,padding:16,background:'var(--surf2)',borderRadius:16,border:'1px solid var(--bord)'}}>
                    <div style={{background:'var(--accent)',width:48,height:48,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <EnvelopeIcon/>
                    </div>
                    <div>
                      <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Email Support</h3>
                      <p style={{fontSize:14,color:'var(--muted)',marginBottom:4}}>admin.instaserve@gmail.com</p>
                      <p style={{fontSize:12,color:'#06B6D4',fontWeight:600}}>Response within 24 hours</p>
                    </div>
                  </div>

                  <div style={{display:'flex',alignItems:'center',gap:16,padding:16,background:'var(--surf2)',borderRadius:16,border:'1px solid var(--bord)'}}>
                    <div style={{background:'linear-gradient(135deg,#06B6D4,#4ADE80)',width:48,height:48,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <PhoneIcon/>
                    </div>
                    <div>
                      <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Phone Support</h3>
                      <p style={{fontSize:14,color:'var(--muted)',marginBottom:4}}>+91 8368164831</p>
                      <p style={{fontSize:12,color:'#4ADE80',fontWeight:600}}>Available 10 AM - 8 PM</p>
                    </div>
                  </div>

                  <div style={{display:'flex',alignItems:'center',gap:16,padding:16,background:'var(--surf2)',borderRadius:16,border:'1px solid var(--bord)'}}>
                    <div style={{background:'linear-gradient(135deg,#A78BFA,#F472B6)',width:48,height:48,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <ChatIcon/>
                    </div>
                    <div>
                      <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Live Chat</h3>
                      <p style={{fontSize:14,color:'var(--muted)',marginBottom:8}}>Available 24/7</p>
                      <button 
                        onClick={() => toast('Feature coming soon!')}
                        className="btn-ghost"
                        style={{fontSize:12,padding:'10px 20px'}}
                      >
                        Start Chat
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="card">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
                  <div style={{background:'linear-gradient(135deg,#F59E0B,#EF4444)',padding:12,borderRadius:12}}>
                    <ClockIcon/>
                  </div>
                  <div>
                    <h2 style={{fontSize:24,fontWeight:800,letterSpacing:'-.5px'}}>Support Hours</h2>
                    <p style={{fontSize:14,color:'var(--muted)'}}>When we're available to help</p>
                  </div>
                </div>
                
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:12,background:'var(--surf2)',borderRadius:12}}>
                    <span style={{fontSize:14,fontWeight:700}}>Monday - Friday</span>
                    <span style={{fontSize:14,color:'var(--muted)'}}>9:00 AM - 8:00 PM</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:12,background:'var(--surf2)',borderRadius:12}}>
                    <span style={{fontSize:14,fontWeight:700}}>Saturday</span>
                    <span style={{fontSize:14,color:'var(--muted)'}}>10:00 AM - 6:00 PM</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:12,background:'var(--surf2)',borderRadius:12}}>
                    <span style={{fontSize:14,fontWeight:700}}>Sunday</span>
                    <span style={{fontSize:14,color:'var(--muted)'}}>11:00 AM - 4:00 PM</span>
                  </div>
                  <div style={{padding:12,background:'rgba(74,222,128,.1)',borderRadius:12,border:'1px solid rgba(74,222,128,.3)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:14,fontWeight:700,color:'#4ADE80'}}>Emergency Support</span>
                      <span style={{fontSize:14,color:'#4ADE80',fontWeight:600}}>24/7 Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FAQ SECTION ══════════════ */}
      <section style={{padding:'60px 24px 100px'}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div className="card">
            <div style={{textAlign:'center',marginBottom:40}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
                <div style={{background:'var(--accent)',padding:12,borderRadius:12}}>
                  <QuestionIcon/>
                </div>
              </div>
              <h2 style={{fontSize:36,fontWeight:900,letterSpacing:'-1.5px',marginBottom:12}}>Frequently Asked Questions</h2>
              <p style={{fontSize:16,color:'var(--muted)',maxWidth:500,margin:'0 auto'}}>Find quick answers to common questions about InstaServe</p>
            </div>

            <div className="grid-2" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
              {faqs.map((faq) => {
                const catColor = getCategoryColor(faq.category);
                return (
                  <div key={faq.id} className="faq-card">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      style={{width:'100%',padding:20,display:'flex',alignItems:'center',justifyContent:'space-between',background:'transparent',border:'none',cursor:'pointer',color:'#fff',textAlign:'left'}}
                    >
                      <div style={{display:'flex',alignItems:'center',gap:12,flex:1}}>
                        <span style={{display:'inline-flex',alignItems:'center',padding:'6px 12px',borderRadius:100,fontSize:11,fontWeight:700,letterSpacing:'.5px',textTransform:'uppercase',background:catColor.bg,color:catColor.color,border:`1px solid ${catColor.border}`}}>
                          {faq.category}
                        </span>
                        <h3 style={{fontSize:14,fontWeight:700,lineHeight:1.4}}>{faq.question}</h3>
                      </div>
                      <div style={{flexShrink:0}}>
                        {expandedFAQ === faq.id ? <ChevronUp/> : <ChevronDown/>}
                      </div>
                    </button>
                    
                    {expandedFAQ === faq.id && (
                      <div style={{padding:'0 20px 20px',borderTop:'1px solid var(--bord)',background:'var(--surf2)'}}>
                        <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.7,paddingTop:16}}>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{textAlign:'center',marginTop:40}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:16,padding:16,background:'var(--surf2)',borderRadius:16,border:'1px solid var(--bord)'}}>
                <CheckIcon/>
                <div style={{textAlign:'left'}}>
                  <p style={{fontSize:15,fontWeight:700}}>Still have questions?</p>
                  <p style={{fontSize:13,color:'var(--muted)'}}>Our admin team is here to help</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
