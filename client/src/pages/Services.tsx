import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import api from '../services/api';
import { servicesAPI, bookingsAPI, walletAPI } from '../services/api';
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="7" y1="14" x2="17" y2="14"/></svg>
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
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Service[]>([]);

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
    fetchServices();
  }, []);

  useEffect(() => {
    if (searchTerm && searchTerm.length > 0) {
      const filtered = services.filter(service => 
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [searchTerm, services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/services/public');
      
      // Remove duplicates based on title + category combination
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
    
    fetchFilteredServices(filters);
  };

  const fetchFilteredServices = async (filters: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await servicesAPI.getServices(filters);
      
      // Remove duplicates based on title + category combination
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

    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (bookingData: any) => {
    if (!selectedService) return;

    try {
      setBookingLoading(true);
      
      let voiceNotePath = null;
      
      // Upload voice note if available
      if (bookingData.voiceNote) {
        const formData = new FormData();
        formData.append('voiceNote', bookingData.voiceNote, 'voice-note.webm');
        
        try {
          const uploadResponse = await fetch('/api/bookings/upload-voice', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            voiceNotePath = uploadResult.voiceNotePath;
          } else {
            console.error('Failed to upload voice note');
            toast.error('Failed to upload voice note. Please try again.');
            return;
          }
        } catch (uploadError) {
          console.error('Voice note upload error:', uploadError);
          toast.error('Failed to upload voice note. Please try again.');
          return;
        }
      }
      
      // Use current date/time for instant booking
      const currentDateTime = new Date().toISOString();
      
      const bookingPayload = {
        service: selectedService._id,
        scheduledDate: currentDateTime, // Current date for instant booking
        duration: selectedService.duration,
        price: {
          basePrice: selectedService.price,
          additionalCharges: 0,
          discount: 0,
          totalPrice: selectedService.price
        },
        serviceArea: selectedService.serviceArea,
        address: {
          ...bookingData.address,
          coordinates: bookingData.address.coordinates
        },
        notes: bookingData.notes || '',
        voiceNote: voiceNotePath, // Send file path instead of blob
        // Add location type for backend processing
        locationType: bookingData.useCurrentLocation ? 'current' : 'manual'
      };

      const response = await bookingsAPI.createBooking(bookingPayload);
      
      toast.success('Instant booking request sent! Providers within 7km will be notified immediately.');
      setShowBookingModal(false);
      setSelectedService(null);
      
      // Navigate to bookings page to see status
      navigate('/dashboard', { state: { newBooking: response.booking } });
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
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

        @keyframes orb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-25px) scale(1.04)}66%{transform:translate(-20px,35px) scale(.96)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}

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
            <div style={{position:'relative'}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:12,letterSpacing:'.8px',textTransform:'uppercase'}}>
                <SearchIcon style={{width:14,height:14,marginRight:6,verticalAlign:'middle'}}/>
                Search
              </label>
              <input
                type="text"
                placeholder="What service do you need?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(124,58,237,.1)'; if (searchTerm) setShowSuggestions(true);}}
                onBlur={(e) => {e.target.style.borderColor = 'var(--bord)'; e.target.style.background = 'var(--surf2)'; setTimeout(() => setShowSuggestions(false), 200);}}
                style={{width:'100%',padding:'14px 18px',background:'var(--surf2)',border:'1px solid var(--bord)',borderRadius:12,color:'#fff',fontSize:15,transition:'border-color .3s,background .3s'}}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div style={{
                  position:'absolute',
                  top:'100%',
                  left:0,
                  right:0,
                  background:'var(--surf)',
                  border:'1px solid var(--bord)',
                  borderTop:'none',
                  borderRadius:'0 0 12px 12px',
                  maxHeight:'200px',
                  overflowY:'auto',
                  zIndex:10,
                  marginTop:'-1px'
                }}>
                  {filteredSuggestions.map((service, index) => (
                    <div
                      key={service._id}
                      onClick={() => {
                        setSearchTerm(service.title);
                        setShowSuggestions(false);
                        handleSearch();
                      }}
                      style={{
                        padding:'12px 18px',
                        cursor:'pointer',
                        borderBottom:index < filteredSuggestions.length - 1 ? '1px solid var(--bord)' : 'none',
                        transition:'background .2s',
                        fontSize:14
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{fontWeight:600,color:'#fff',marginBottom:2}}>{service.title}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>{getCategoryLabel(service.category)}</div>
                    </div>
                  ))}
                </div>
              )}
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
                          <p style={{fontSize:28,fontWeight:900,color:'#fff',lineHeight:1}}>₹{service.price}</p>
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

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <BookingModal
          service={selectedService}
          onClose={() => setShowBookingModal(false)}
          onConfirm={handleConfirmBooking}
          loading={bookingLoading}
        />
      )}
    </div>
  );
};

// Booking Modal Component
interface BookingModalProps {
  service: Service;
  onClose: () => void;
  onConfirm: (data: any) => void;
  loading: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ service, onClose, onConfirm, loading }) => {
  const [bookingData, setBookingData] = useState({
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: { lat: null as number | null, lng: null as number | null }
    },
    notes: '',
    useCurrentLocation: false,
    voiceNote: null as Blob | null
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder, recordingTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!bookingData.useCurrentLocation && !bookingData.address.street) {
      toast.error('Please select an address from the search suggestions or use current location');
      return;
    }
    
    if (bookingData.useCurrentLocation && !bookingData.address.coordinates.lat) {
      toast.error('Please enable location detection or enter address manually');
      return;
    }

    onConfirm(bookingData);
  };

  const handleGetCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get address from coordinates using reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data && data.address) {
            const address = data.address;
            setBookingData(prev => ({
              ...prev,
              address: {
                street: address.road || address.house_number || 'Current Location',
                city: address.city || address.town || address.village || 'Unknown City',
                state: address.state || address.state_district || 'Unknown State',
                pincode: address.postcode || '000000',
                coordinates: { lat: latitude, lng: longitude }
              },
              useCurrentLocation: true
            }));
          } else {
            // If reverse geocoding fails, at least save coordinates with default address
            setBookingData(prev => ({
              ...prev,
              address: {
                street: 'Current Location',
                city: 'Unknown City',
                state: 'Unknown State',
                pincode: '000000',
                coordinates: { lat: latitude, lng: longitude }
              },
              useCurrentLocation: true
            }));
          }
        } catch (error) {
          // If API fails, at least save coordinates with default address
          setBookingData(prev => ({
            ...prev,
            address: {
              street: 'Current Location',
              city: 'Unknown City',
              state: 'Unknown State',
              pincode: '000000',
              coordinates: { lat: latitude, lng: longitude }
            },
            useCurrentLocation: true
          }));
        }
        
        setLocationLoading(false);
        toast.success('Location detected successfully!');
      },
      (error) => {
        setLocationError('Unable to retrieve your location. Please enable location permissions or enter address manually.');
        setLocationLoading(false);
      }
    );
  };

  const handleManualAddress = () => {
    setBookingData(prev => ({
      ...prev,
      useCurrentLocation: false,
      address: {
        ...prev.address,
        coordinates: { lat: null, lng: null }
      }
    }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setBookingData(prev => ({ ...prev, voiceNote: blob }));
        setRecordingTime(0);
        if (recordingTimer) {
          clearInterval(recordingTimer);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const deleteVoiceNote = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setBookingData(prev => ({ ...prev, voiceNote: null }));
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const suggestions = data.map((item: any) => ({
          display_name: item.display_name,
          address: {
            street: item.address.road || item.address.house_number || '',
            city: item.address.city || item.address.town || item.address.village || '',
            state: item.address.state || '',
            pincode: item.address.postcode || ''
          },
          coordinates: {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }
        }));
        setAddressSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddressSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddressSearch(value);
    
    // Clear existing timeout
    if (addressSearchTimeout) {
      clearTimeout(addressSearchTimeout);
    }
    
    // Set new timeout for debouncing
    const timeout = setTimeout(() => {
      searchAddresses(value);
    }, 500);
    
    setAddressSearchTimeout(timeout);
  };

  const selectAddress = (suggestion: any) => {
    setBookingData(prev => ({
      ...prev,
      address: {
        ...suggestion.address,
        coordinates: suggestion.coordinates
      },
      useCurrentLocation: false
    }));
    setAddressSearch(suggestion.display_name);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleAddressBlur = () => {
    // Delay hiding suggestions to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div style={{position: 'fixed', inset: 0, background: 'rgba(6,6,9,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'}}>
      <div style={{background: 'var(--surf)', border: '1px solid var(--bord)', borderRadius: '22px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.6)'}}>
        <div style={{padding: '32px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{background: 'linear-gradient(135deg, var(--accent), var(--c2))', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(124,58,237,0.3)'}}>
                <span style={{fontSize: '24px'}}>✨</span>
              </div>
              <h2 style={{fontSize: '24px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px'}}>Book Service</h2>
            </div>
            <button
              onClick={onClose}
              style={{background: 'transparent', border: 'none', color: 'var(--muted)', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'}}
              onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff';}}
              onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)';}}
            >
              <span style={{fontSize: '20px', display: 'block'}}>×</span>
            </button>
          </div>
          
          <div style={{marginBottom: '32px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))', borderRadius: '16px', padding: '24px', border: '1px solid rgba(124,58,237,0.2)'}}>
            <h3 style={{fontWeight: '700', fontSize: '18px', color: '#fff', marginBottom: '12px'}}>{service.title}</h3>
            <p style={{color: 'var(--muted)', marginBottom: '20px', lineHeight: '1.6'}}>{service.description}</p>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={{fontSize: '24px', marginRight: '8px'}}>💰</span>
                <p style={{fontSize: '28px', fontWeight: '800', color: '#4ADE80'}}>₹{service.price}</p>
                <span style={{color: 'var(--muted)', marginLeft: '8px'}}>{service.priceType}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: 'var(--muted)'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{fontSize: '16px', marginRight: '6px'}}>⏱️</span>
                  {service.duration.value} {service.duration.unit}
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{fontSize: '16px', marginRight: '6px'}}>📍</span>
                  {service.serviceArea}
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
            <div>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '12px', letterSpacing: '0.5px'}}>
                📍 Service Location *
              </label>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div style={{display: 'flex', gap: '12px'}}>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={locationLoading}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      borderRadius: '12px',
                      border: bookingData.useCurrentLocation ? '2px solid var(--accent)' : '1px solid var(--bord)',
                      background: bookingData.useCurrentLocation ? 'rgba(124,58,237,0.1)' : 'var(--surf2)',
                      color: bookingData.useCurrentLocation ? 'var(--accent)' : '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: locationLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {locationLoading ? (
                      <>
                        <div style={{width: '16px', height: '16px', border: '2px solid var(--accent)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                        Detecting Location...
                      </>
                    ) : (
                      <>
                        📍 Use Current Location
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleManualAddress}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      borderRadius: '12px',
                      border: !bookingData.useCurrentLocation ? '2px solid var(--accent)' : '1px solid var(--bord)',
                      background: !bookingData.useCurrentLocation ? 'rgba(124,58,237,0.1)' : 'var(--surf2)',
                      color: !bookingData.useCurrentLocation ? 'var(--accent)' : '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    🏠 Enter Address Manually
                  </button>
                </div>
                
                {locationError && (
                  <div style={{padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#f87171'}}>
                    <p style={{fontSize: '14px', fontWeight: '500'}}>{locationError}</p>
                  </div>
                )}
                
                {!bookingData.useCurrentLocation && (
                  <div style={{padding: '20px', background: 'var(--surf2)', borderRadius: '16px', border: '1px solid var(--bord)'}}>
                    <div style={{position: 'relative', marginBottom: '16px'}}>
                      <input
                        type="text"
                        placeholder="Search for your address..."
                        value={addressSearch}
                        onChange={handleAddressSearch}
                        onBlur={handleAddressBlur}
                        onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          background: 'var(--surf)',
                          border: '1px solid var(--bord)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        required
                      />
                      {searchLoading && (
                        <div style={{position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)'}}>
                          <div style={{width: '16px', height: '16px', border: '2px solid var(--accent)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                        </div>
                      )}
                      
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '8px',
                          background: 'var(--surf)',
                          border: '1px solid var(--bord)',
                          borderRadius: '12px',
                          maxHeight: '240px',
                          overflowY: 'auto',
                          zIndex: 10
                        }}>
                          {addressSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectAddress(suggestion)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: index < addressSuggestions.length - 1 ? '1px solid var(--bord)' : 'none',
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px'
                              }}
                              onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(124,58,237,0.1)';}}
                              onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent';}}
                            >
                              <span style={{fontSize: '16px', marginTop: '2px', flexShrink: 0}}>📍</span>
                              <div style={{flex: 1, minWidth: 0}}>
                                <p style={{fontSize: '14px', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{suggestion.display_name}</p>
                                <p style={{fontSize: '12px', color: 'var(--muted)', marginTop: '4px'}}>
                                  {suggestion.address.city && `${suggestion.address.city}, `}
                                  {suggestion.address.state && `${suggestion.address.state} `}
                                  {suggestion.address.pincode && suggestion.address.pincode}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {bookingData.address.street && (
                      <div style={{padding: '12px 16px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '12px'}}>
                        <div style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                          <span style={{fontSize: '16px', marginRight: '8px'}}>📍</span>
                          <p style={{fontSize: '14px', fontWeight: '600', color: '#4ADE80'}}>Selected Address</p>
                        </div>
                        <p style={{fontSize: '14px', color: '#4ADE80'}}>
                          {bookingData.address.street && `${bookingData.address.street}, `}
                          {bookingData.address.city && `${bookingData.address.city}, `}
                          {bookingData.address.state && `${bookingData.address.state} `}
                          {bookingData.address.pincode && `- ${bookingData.address.pincode}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {bookingData.useCurrentLocation && bookingData.address.coordinates.lat && (
                  <div style={{padding: '16px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '12px'}}>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                      <span style={{fontSize: '16px', marginRight: '8px'}}>📍</span>
                      <p style={{fontSize: '14px', fontWeight: '600', color: '#4ADE80'}}>Location Detected</p>
                    </div>
                    <p style={{fontSize: '14px', color: '#4ADE80'}}>
                      {bookingData.address.street && `${bookingData.address.street}, `}
                      {bookingData.address.city && `${bookingData.address.city}, `}
                      {bookingData.address.state && `${bookingData.address.state} `}
                      {bookingData.address.pincode && `- ${bookingData.address.pincode}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '12px', letterSpacing: '0.5px'}}>
                🎙️ Voice Note (Optional)
              </label>
              <p style={{fontSize: '14px', color: 'var(--muted)', marginBottom: '16px'}}>Record a voice message explaining what you need help with</p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                {!audioURL && !isRecording && (
                  <div style={{display: 'flex', justifyContent: 'center'}}>
                    <button
                      type="button"
                      onClick={startRecording}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 24px',
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {e.currentTarget.style.background = '#dc2626';}}
                      onMouseLeave={(e) => {e.currentTarget.style.background = '#ef4444';}}
                    >
                      🎙️ Start Recording
                    </button>
                  </div>
                )}

                {isRecording && (
                  <div style={{padding: '24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px'}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={{width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s ease-out infinite'}}></div>
                        <span style={{color: '#ef4444', fontWeight: '600'}}>Recording...</span>
                        <span style={{color: '#ef4444', fontFamily: 'monospace'}}>{formatTime(recordingTime)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: '#ef4444',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        ⏹️ Stop
                      </button>
                    </div>
                    <div style={{width: '100%', height: '8px', background: 'rgba(239,68,68,0.2)', borderRadius: '4px'}}>
                      <div 
                        style={{
                          height: '8px',
                          background: '#ef4444',
                          borderRadius: '4px',
                          transition: 'width 1s linear',
                          width: `${Math.min((recordingTime / 60) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {audioURL && !isRecording && (
                  <div style={{padding: '24px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '16px'}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={{width: '12px', height: '12px', background: '#4ADE80', borderRadius: '50%'}}></div>
                        <span style={{color: '#4ADE80', fontWeight: '600'}}>Voice Note Recorded</span>
                        <span style={{color: '#4ADE80', fontFamily: 'monospace'}}>{formatTime(recordingTime)}</span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <audio controls style={{height: '32px'}}>
                          <source src={audioURL} type="audio/webm" />
                          Your browser does not support the audio element.
                        </audio>
                        <button
                          type="button"
                          onClick={deleteVoiceNote}
                          style={{
                            padding: '8px',
                            background: 'transparent',
                            color: '#ef4444',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: 'none',
                            fontSize: '16px'
                          }}
                          onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(239,68,68,0.1)';}}
                          onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent';}}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '12px', letterSpacing: '0.5px'}}>
                📝 Additional Notes (Optional)
              </label>
              <textarea
                placeholder="Any specific requirements or details about the service..."
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--surf2)',
                  border: '1px solid var(--bord)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            
            <div style={{padding: '20px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))', borderRadius: '16px', border: '1px solid rgba(124,58,237,0.2)'}}>
              <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                <div style={{background: 'var(--accent)', padding: '8px', borderRadius: '8px'}}>
                  <span style={{fontSize: '16px'}}>✨</span>
                </div>
                <div>
                  <p style={{fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px'}}>📢 Instant Booking (7km Range)</p>
                  <p style={{fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6'}}>
                    Your request will be sent immediately to verified providers within 7km of your location. The first provider to accept will be assigned to your booking.
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '16px'}}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: 'transparent',
                  color: 'var(--muted)',
                  border: '1px solid var(--bord)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff';}}
                onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)';}}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, var(--accent), var(--c2))',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {if (!loading) e.currentTarget.style.transform = 'scale(1.02)';}}
                onMouseLeave={(e) => {if (!loading) e.currentTarget.style.transform = 'scale(1)';}}
              >
                {loading ? (
                  <>
                    <div style={{width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <span style={{fontSize: '16px'}}>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Services;
