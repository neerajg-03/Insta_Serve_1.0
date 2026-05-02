import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RootState } from '../store';
import api from '../services/api';
import { servicesAPI } from '../services/api';
import toast from 'react-hot-toast';

/* ── Inline SVG Icons ── */
interface IconProps {
  style?: React.CSSProperties;
  className?: string;
}

const ArrowRight = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);
const SearchIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
);
const FilterIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
const MapPinIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const ClockIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const CurrencyIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);
const TagIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
);
const CalendarIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  priceType: string;
  duration: {
    value: number;
    unit: string;
  };
  serviceArea: string;
  isActive: boolean;
  isApproved: boolean;
  provider: null;
  createdBy: 'admin';
  providerCount?: number;
}

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const categories = [
    { value: 'home_cleaning', label: 'Home Cleaning' },
    { value: 'beauty_wellness', label: 'Beauty & Wellness' },
    { value: 'appliance_repair', label: 'Appliance Repair' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'painting', label: 'Painting' },
    { value: 'pest_control', label: 'Pest Control' },
    { value: 'packers_movers', label: 'Packers & Movers' },
    { value: 'home_tutoring', label: 'Home Tutoring' },
    { value: 'fitness_training', label: 'Fitness Training' },
    { value: 'event_management', label: 'Event Management' },
    { value: 'photography', label: 'Photography' },
    { value: 'web_development', label: 'Web Development' },
    { value: 'digital_marketing', label: 'Digital Marketing' }
  ];

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      const matchedCategory = categories.find(cat => 
        cat.label.toLowerCase() === categoryParam.toLowerCase()
      );
      if (matchedCategory) {
        setSelectedCategory(matchedCategory.value);
        fetchFilteredServices({ category: matchedCategory.value });
      } else {
        fetchServices();
      }
    } else {
      fetchServices();
    }
  }, [searchParams]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching services from:', '/services/public');
      const response = await api.get('/services/public');
      console.log('Services response:', response.data);
      
      const uniqueServices = response.data.services || [];
      const seen = new Set();
      const deduplicatedServices = uniqueServices.filter((service: Service) => {
        const key = `${service.title.toLowerCase()}-${service.category}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      
      setServices(deduplicatedServices);
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError(err.response?.data?.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;
    if (selectedCategory) filters.category = selectedCategory;
    if (priceRange.min) filters.minPrice = priceRange.min;
    if (priceRange.max) filters.maxPrice = priceRange.max;
    
    fetchFilteredServices(filters);
  };

  const fetchFilteredServices = async (filters: any) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching filtered services with filters:', filters);
      const response = await servicesAPI.getServices(filters);
      console.log('Filtered services response:', response);
      
      const uniqueServices = response.services || [];
      const seen = new Set();
      const deduplicatedServices = uniqueServices.filter((service: Service) => {
        const key = `${service.title.toLowerCase()}-${service.category}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      
      setServices(deduplicatedServices);
    } catch (err: any) {
      console.error('Error fetching filtered services:', err);
      setError(err.response?.data?.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (service: Service) => {
    if (!user) {
      toast.error('Please login to book a service');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'customer') {
      toast.error('Only customers can book services');
      return;
    }

    // Navigate to booking page or open modal
    navigate(`/book-service/${service._id}`);
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "'Sora','DM Sans',system-ui,sans-serif", background: '#060609', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{textAlign: 'center'}}>
          <div style={{width: 80, height: 80, border: '4px solid #7C3AED', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'}}></div>
          <p style={{marginTop: 24, color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 500}}>Loading amazing services...</p>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

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

        .btn-primary{display:inline-flex;align-items:center;gap:10px;padding:16px 34px;background:#fff;color:#060609;font-size:15px;font-weight:700;border-radius:100px;text-decoration:none;letter-spacing:.2px;transition:transform .22s,box-shadow .22s;box-shadow:0 0 40px rgba(255,255,255,.12)}
        .btn-primary:hover{transform:scale(1.04);box-shadow:0 0 64px rgba(255,255,255,.24)}
        .btn-ghost{display:inline-flex;align-items:center;gap:10px;padding:16px 34px;background:transparent;color:rgba(255,255,255,.75);font-size:15px;font-weight:600;border-radius:100px;border:1px solid rgba(255,255,255,.18);text-decoration:none;transition:background .22s,color .22s}
        .btn-ghost:hover{background:rgba(255,255,255,.08);color:#fff}

        .service-card{position:relative;overflow:hidden;background:var(--surf);border:1px solid var(--bord);border-radius:22px;cursor:pointer;text-decoration:none;color:#fff;display:block;transition:transform .35s cubic-bezier(.22,1,.36,1),border-color .3s,box-shadow .3s}
        .service-card:hover{transform:translateY(-8px);box-shadow:0 28px 70px rgba(0,0,0,.55);border-color:rgba(124,58,237,.3)}

        @media(max-width:900px){
          .hero-h{font-size:clamp(44px,11vw,72px) !important}
          .hero-split{flex-direction:column !important}
          .services-grid{grid-template-columns:repeat(2,1fr) !important}
          .filter-grid{grid-template-columns:1fr !important}
        }
      `}</style>

      {/* ══════════════ HERO ══════════════ */}
      <section style={{ position:'relative', minHeight:'60vh', display:'flex', alignItems:'center', padding:'120px 24px 80px', overflow:'hidden' }}>
        {/* Orbs */}
        <div style={{position:'absolute',top:'10%',left:'5%',width:560,height:560,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.3) 0%,transparent 70%)',animation:'orb 20s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'45%',right:'3%',width:420,height:420,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,.2) 0%,transparent 70%)',animation:'orb 26s ease-in-out infinite reverse',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'5%',left:'35%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(244,114,182,.16) 0%,transparent 70%)',animation:'orb 18s ease-in-out infinite 4s',pointerEvents:'none'}}/>

        {/* Grid pattern */}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)',backgroundSize:'72px 72px',pointerEvents:'none'}}/>

        <div style={{maxWidth:1260,margin:'0 auto',width:'100%',position:'relative',zIndex:2}}>
          <div style={{textAlign: 'center'}}>
            <div style={{marginBottom:28}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',background:'rgba(124,58,237,.13)',border:'1px solid rgba(124,58,237,.35)',borderRadius:100,fontSize:12,color:'rgba(255,255,255,.85)',letterSpacing:'.6px',fontWeight:600}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'#4ADE80',display:'inline-block',boxShadow:'0 0 10px #4ADE80'}}/>
                {services.length} services available
              </span>
            </div>

            <h1 style={{fontSize:'clamp(50px,6.5vw,92px)',fontWeight:900,lineHeight:1.02,letterSpacing:'-2.5px',marginBottom:24}}>
              Find your perfect{' '}
              <span style={{background:'linear-gradient(90deg,#fff 20%,#a78bfa 45%,#22d3ee 62%,#fff 80%)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent',animation:'shimmer 4s linear infinite'}}>service</span>
            </h1>

            <p style={{fontSize:17,color:'rgba(255,255,255,.48)',maxWidth:600,lineHeight:1.78,marginBottom:44,fontWeight:300,margin:'0 auto 44px'}}>
              Professional services at your fingertips. Book instantly, get matched with verified providers in your area.
            </p>

            <div style={{display:'flex',justifyContent:'center',gap:14,marginBottom:44}}>
              {user?.role === 'customer' && (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary"
                  style={{fontSize:14,padding:'14px 28px'}}
                >
                  <CalendarIcon/> My Bookings
                </button>
              )}
              {!user && (
                <button 
                  onClick={() => navigate('/register')}
                  className="btn-primary"
                  style={{fontSize:14,padding:'14px 28px'}}
                >
                  Sign Up to Book
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FILTERS ══════════════ */}
      <section style={{padding:'60px 24px', background:'var(--surf)', borderTop:'1px solid var(--bord)', borderBottom:'1px solid var(--bord)'}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div style={{marginBottom:40}}>
            <span style={{fontSize:11,color:'var(--c2)',letterSpacing:'2.5px',textTransform:'uppercase',fontWeight:700}}>Filters</span>
            <h2 style={{fontSize:'clamp(24px,3vw,36px)',fontWeight:900,letterSpacing:'-1.2px',marginTop:8,lineHeight:1.1}}>
              Find exactly what you need
            </h2>
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:20,marginBottom:32}}>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:12,letterSpacing:'.8px',textTransform:'uppercase'}}>
                <SearchIcon style={{width:14,height:14,marginRight:6,verticalAlign:'middle'}}/>
                Search
              </label>
              <input
                type="text"
                placeholder="What service do you need?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{width:'100%',padding:'14px 18px',background:'var(--surf2)',border:'1px solid var(--bord)',borderRadius:12,color:'#fff',fontSize:15,transition:'border-color .3s,background .3s'}}
                onFocus={(e) => {e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(124,58,237,.1)';}}
                onBlur={(e) => {e.target.style.borderColor = 'var(--bord)'; e.target.style.background = 'var(--surf2)';}}
              />
            </div>
            
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:12,letterSpacing:'.8px',textTransform:'uppercase'}}>
                <TagIcon style={{width:14,height:14,marginRight:6,verticalAlign:'middle'}}/>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{width:'100%',padding:'14px 18px',background:'var(--surf2)',border:'1px solid var(--bord)',borderRadius:12,color:'#fff',fontSize:15,transition:'border-color .3s,background .3s',cursor:'pointer'}}
                onFocus={(e) => {e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(124,58,237,.1)';}}
                onBlur={(e) => {e.target.style.borderColor = 'var(--bord)'; e.target.style.background = 'var(--surf2)';}}
              >
                <option value="" style={{background:'var(--surf2)',color:'#fff'}}>All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value} style={{background:'var(--surf2)',color:'#fff'}}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:12,letterSpacing:'.8px',textTransform:'uppercase'}}>
                <CurrencyIcon style={{width:14,height:14,marginRight:6,verticalAlign:'middle'}}/>
                Min Price
              </label>
              <input
                type="number"
                placeholder="Min amount"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                style={{width:'100%',padding:'14px 18px',background:'var(--surf2)',border:'1px solid var(--bord)',borderRadius:12,color:'#fff',fontSize:15,transition:'border-color .3s,background .3s'}}
                onFocus={(e) => {e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(124,58,237,.1)';}}
                onBlur={(e) => {e.target.style.borderColor = 'var(--bord)'; e.target.style.background = 'var(--surf2)';}}
              />
            </div>
            
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:12,letterSpacing:'.8px',textTransform:'uppercase'}}>
                <CurrencyIcon style={{width:14,height:14,marginRight:6,verticalAlign:'middle'}}/>
                Max Price
              </label>
              <input
                type="number"
                placeholder="Max amount"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                style={{width:'100%',padding:'14px 18px',background:'var(--surf2)',border:'1px solid var(--bord)',borderRadius:12,color:'#fff',fontSize:15,transition:'border-color .3s,background .3s'}}
                onFocus={(e) => {e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(124,58,237,.1)';}}
                onBlur={(e) => {e.target.style.borderColor = 'var(--bord)'; e.target.style.background = 'var(--surf2)';}}
              />
            </div>
          </div>
          
          <div style={{textAlign:'center'}}>
            <button
              onClick={handleSearch}
              className="btn-primary"
              style={{fontSize:15,padding:'16px 40px'}}
            >
              <SearchIcon/> Search Services
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════ SERVICES GRID ══════════════ */}
      <section style={{padding:'100px 24px'}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          {error && (
            <div style={{marginBottom:40,padding:'20px 24px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:16,display:'flex',alignItems:'center',color:'#f87171'}}>
              <span style={{fontSize:15,fontWeight:500}}>{error}</span>
            </div>
          )}

          {services.length === 0 ? (
            <div style={{textAlign:'center',padding:'80px 24px'}}>
              <div style={{width:120,height:120,margin:'0 auto 32px',background:'var(--surf2)',border:'1px solid var(--bord)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <SearchIcon style={{width:48,height:48,color:'var(--muted)'}}/>
              </div>
              <h3 style={{fontSize:32,fontWeight:900,marginBottom:16,letterSpacing:'-1px'}}>No services found</h3>
              <p style={{fontSize:16,color:'var(--muted)',lineHeight:1.6}}>Try adjusting your search criteria or browse all categories</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:24}}>
              {services.map((service, index) => (
                <div 
                  key={service._id} 
                  className="service-card"
                  style={{transitionDelay:`${index * 0.1}s`}}
                  onClick={() => handleBookService(service)}
                >
                  <div style={{padding:'32px 28px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
                      <h3 style={{fontSize:20,fontWeight:800,marginBottom:0,letterSpacing:'-.3px',lineHeight:1.2}}>
                        {service.title}
                      </h3>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:'#4ADE80',boxShadow:'0 0 12px #4ADE80'}}/>
                        <span style={{fontSize:11,fontWeight:700,letterSpacing:'.5px',textTransform:'uppercase',padding:'4px 10px',borderRadius:100,background:'rgba(74,222,128,.15)',color:'#4ADE80',border:'1px solid rgba(74,222,128,.3)'}}>
                          Available
                        </span>
                      </div>
                    </div>
                    
                    <p style={{fontSize:14,color:'var(--muted)',marginBottom:24,lineHeight:1.6,fontWeight:300}}>{service.description}</p>
                    
                    <div style={{marginBottom:24}}>
                      <div style={{display:'flex',alignItems:'center',fontSize:13,color:'var(--muted)',marginBottom:12}}>
                        <TagIcon style={{width:16,height:16,marginRight:8,color:'var(--accent)',flexShrink:0}}/>
                        <span style={{fontWeight:600}}>{getCategoryLabel(service.category)}</span>
                      </div>
                      
                      <div style={{display:'flex',alignItems:'center',fontSize:13,color:'var(--muted)',marginBottom:12}}>
                        <ClockIcon style={{width:16,height:16,marginRight:8,color:'var(--accent)',flexShrink:0}}/>
                        <span>{service.duration.value} {service.duration.unit}</span>
                      </div>
                      
                      <div style={{display:'flex',alignItems:'center',fontSize:13,color:'var(--muted)',marginBottom:12}}>
                        <MapPinIcon style={{width:16,height:16,marginRight:8,color:'var(--accent)',flexShrink:0}}/>
                        <span>{service.serviceArea}</span>
                      </div>
                      
                      <div style={{display:'flex',alignItems:'center',fontSize:13,color:'var(--muted)'}}>
                        <span style={{width:16,height:16,marginRight:8,color:'var(--accent)',flexShrink:0}}>👥</span>
                        <span>Multiple providers available</span>
                      </div>
                    </div>
                    
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:20,borderTop:'1px solid var(--bord)'}}>
                      <div>
                        <div style={{display:'flex',alignItems:'center'}}>
                          <CurrencyIcon style={{width:20,height:20,color:'#4ADE80',marginRight:6,flexShrink:0}}/>
                          <p style={{fontSize:28,fontWeight:900,color:'#fff',lineHeight:1}}>{service.price}</p>
                        </div>
                        <p style={{fontSize:12,color:'var(--muted)',marginTop:4}}>{service.priceType}</p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookService(service);
                        }}
                        className="btn-primary"
                        style={{fontSize:13,padding:'12px 20px',background:'var(--accent)',color:'#fff',border:'none',boxShadow:'0 0 30px rgba(124,58,237,.4)'}}
                      >
                        Book Now <ArrowRight/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Services;
