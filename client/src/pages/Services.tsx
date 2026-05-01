import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
const ArrowUpRight = ({ style, className }: IconProps = {}) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M7 17L17 7M7 7h10v10"/></svg>
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
const UsersIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
);
const TagIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
);
const XIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M18 6L6 18M6 6l12 12"/></svg>
);
const CalendarIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const SparklesIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);
const XMarkIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M18 6L6 18M6 6l12 12"/></svg>
);
const CurrencyRupeeIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M12 2v20M8 7h8a3 3 0 010 6h-4M8 17h8"/></svg>
);
const HomeIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const MicrophoneIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
);
const StopIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><rect x="3" y="3" width="18" height="18"/></svg>
);
const TrashIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
);
const UserIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const ArrowRightIcon = ({ style, className }: IconProps = {}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
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
  provider: null; // Service types have no provider
  createdBy: 'admin';
  providerCount?: number; // Number of providers offering this service
}

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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const heroSec = useInView(0.05);
  const filterSec = useInView(0.08);
  const servicesSec = useInView(0.08);

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
    // Check if category is passed in URL params
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      // Find the category value that matches the label
      const matchedCategory = categories.find(cat => 
        cat.label.toLowerCase() === categoryParam.toLowerCase()
      );
      if (matchedCategory) {
        setSelectedCategory(matchedCategory.value);
        // Fetch filtered services for this category
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
    if (priceRange.min) filters.minPrice = priceRange.min;
    if (priceRange.max) filters.maxPrice = priceRange.max;
    
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
        <div className="grain" />
        <div style={{textAlign: 'center'}}>
          <div style={{position: 'relative', display: 'inline-block'}}>
            <div style={{width: 80, height: 80, border: '4px solid #7C3AED', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'}}></div>
            <SparklesIcon style={{position: 'absolute', top: 0, left: 0, width: 80, height: 80, color: '#7C3AED', animation: 'pulse 2s ease-in-out infinite'}} />
          </div>
          <p style={{marginTop: 24, color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 500}}>Loading amazing services...</p>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
          .grain{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.03;
            background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
            background-size:160px 160px;animation:grain 8s steps(10) infinite}
          @keyframes grain{0%,100%{transform:translate(0,0)}20%{transform:translate(-1%,2%)}40%{transform:translate(2%,-1%)}60%{transform:translate(-2%,2%)}80%{transform:translate(1%,-2%)}
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

        .fu{opacity:0;transform:translateY(28px);transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1)}
        .fu.in{opacity:1;transform:none}
        .fu.d1{transition-delay:.12s}.fu.d2{transition-delay:.24s}.fu.d3{transition-delay:.38s}.fu.d4{transition-delay:.52s}

        .grain{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.03;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3Cfilter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:160px 160px;animation:grain 8s steps(10) infinite}
        @keyframes grain{0%,100%{transform:translate(0,0)}20%{transform:translate(-1%,2%)}40%{transform:translate(2%,-1%)}60%{transform:translate(-2%,2%)}80%{transform:translate(1%,-2%)}

        @keyframes orb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-25px) scale(1.04)}66%{transform:translate(-20px,35px) scale(.96)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}

        .shimmer{background:linear-gradient(90deg,#fff 20%,#a78bfa 45%,#22d3ee 62%,#fff 80%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}

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

      <div className="grain" />

      {/* ══════════════ HERO ══════════════ */}
      <section ref={heroSec.ref as any} style={{ position:'relative', minHeight:'60vh', display:'flex', alignItems:'center', padding:'120px 24px 80px', overflow:'hidden' }}>

        {/* Orbs */}
        <div style={{position:'absolute',top:'10%',left:'5%',width:560,height:560,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.3) 0%,transparent 70%)',animation:'orb 20s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'45%',right:'3%',width:420,height:420,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,.2) 0%,transparent 70%)',animation:'orb 26s ease-in-out infinite reverse',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'5%',left:'35%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(244,114,182,.16) 0%,transparent 70%)',animation:'orb 18s ease-in-out infinite 4s',pointerEvents:'none'}}/>

        {/* Grid pattern */}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)',backgroundSize:'72px 72px',pointerEvents:'none'}}/>

        <div style={{maxWidth:1260,margin:'0 auto',width:'100%',position:'relative',zIndex:2}}>
          <div style={{textAlign: 'center'}}>

            <div className={`fu ${heroSec.vis?'in':''}`} style={{marginBottom:28}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',background:'rgba(124,58,237,.13)',border:'1px solid rgba(124,58,237,.35)',borderRadius:100,fontSize:12,color:'rgba(255,255,255,.85)',letterSpacing:'.6px',fontWeight:600}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'#4ADE80',display:'inline-block',boxShadow:'0 0 10px #4ADE80'}}/>
                {services.length} services available
              </span>
            </div>

            <h1 className={`hero-h fu d1 ${heroSec.vis?'in':''}`} style={{fontSize:'clamp(50px,6.5vw,92px)',fontWeight:900,lineHeight:1.02,letterSpacing:'-2.5px',marginBottom:24}}>
              Find your perfect{' '}
              <span className="shimmer">service</span>
            </h1>

            <p className={`fu d2 ${heroSec.vis?'in':''}`} style={{fontSize:17,color:'rgba(255,255,255,.48)',maxWidth:600,lineHeight:1.78,marginBottom:44,fontWeight:300,margin:'0 auto 44px'}}>
              Professional services at your fingertips. Book instantly, get matched with verified providers in your area.
            </p>

            <div className={`fu d3 ${heroSec.vis?'in':''}`} style={{display:'flex',justifyContent:'center',gap:14,marginBottom:44}}>
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
      <section ref={filterSec.ref as any} style={{padding:'60px 24px', background:'var(--surf)', borderTop:'1px solid var(--bord)', borderBottom:'1px solid var(--bord)'}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div className={`fu ${filterSec.vis?'in':''}`} style={{marginBottom:40}}>
            <span style={{fontSize:11,color:'var(--c2)',letterSpacing:'2.5px',textTransform:'uppercase',fontWeight:700}}>Filters</span>
            <h2 style={{fontSize:'clamp(24px,3vw,36px)',fontWeight:900,letterSpacing:'-1.2px',marginTop:8,lineHeight:1.1}}>
              Find exactly what you need
            </h2>
          </div>
          
          <div className={`filter-grid fu d1 ${filterSec.vis?'in':''}`} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:20}}>
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
          
          <div className={`fu d2 ${filterSec.vis?'in':''}`} style={{marginTop:32,textAlign:'center'}}>
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
      <section ref={servicesSec.ref as any} style={{padding:'100px 24px'}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          {error && (
            <div className={`fu ${servicesSec.vis?'in':''}`} style={{marginBottom:40,padding:'20px 24px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:16,display:'flex',alignItems:'center',color:'#f87171'}}>
              <XIcon style={{width:20,height:20,marginRight:12,flexShrink:0}}/>
              <span style={{fontSize:15,fontWeight:500}}>{error}</span>
            </div>
          )}

          {services.length === 0 ? (
            <div className={`fu ${servicesSec.vis?'in':''}`} style={{textAlign:'center',padding:'80px 24px'}}>
              <div style={{width:120,height:120,margin:'0 auto 32px',background:'var(--surf2)',border:'1px solid var(--bord)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <SearchIcon style={{width:48,height:48,color:'var(--muted)'}}/>
              </div>
              <h3 style={{fontSize:32,fontWeight:900,marginBottom:16,letterSpacing:'-1px'}}>No services found</h3>
              <p style={{fontSize:16,color:'var(--muted)',lineHeight:1.6}}>Try adjusting your search criteria or browse all categories</p>
            </div>
          ) : (
            <div className={`services-grid fu d1 ${servicesSec.vis?'in':''}`} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:24}}>
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
                        <UsersIcon style={{width:16,height:16,marginRight:8,color:'var(--accent)',flexShrink:0}}/>
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
                        Book Now <ArrowUpRight/>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Book Service</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <h3 className="font-bold text-xl text-gray-900 mb-3">{service.title}</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CurrencyRupeeIcon className="h-8 w-8 text-green-600 mr-2" />
                <p className="text-3xl font-bold text-gray-900">{service.price}</p>
                <span className="text-gray-500 ml-3">{service.priceType}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-blue-500" />
                  {service.duration.value} {service.duration.unit}
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 text-blue-500" />
                  {service.serviceArea}
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2 text-blue-600" />
                Service Location *
              </label>
              
              {/* Location Selection */}
              <div className="space-y-4">
                {/* Location Options */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={locationLoading}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium flex items-center justify-center ${
                      bookingData.useCurrentLocation
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    } ${locationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {locationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Detecting Location...
                      </>
                    ) : (
                      <>
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        Use Current Location
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleManualAddress}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium flex items-center justify-center ${
                      !bookingData.useCurrentLocation
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <HomeIcon className="h-4 w-4 mr-2" />
                    Enter Address Manually
                  </button>
                </div>
                
                {locationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{locationError}</p>
                  </div>
                )}
                
                {/* Address Search Bar */}
                {!bookingData.useCurrentLocation && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for your address..."
                          value={addressSearch}
                          onChange={handleAddressSearch}
                          onBlur={handleAddressBlur}
                          onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                          className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                        {searchLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Address Suggestions Dropdown */}
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {addressSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectAddress(suggestion)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150 flex items-start space-x-3"
                            >
                              <MapPinIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{suggestion.display_name}</p>
                                <p className="text-xs text-gray-500 mt-1">
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
                    
                    {/* Selected Address Display */}
                    {bookingData.address.street && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center mb-2">
                          <MapPinIcon className="h-4 w-4 text-green-600 mr-2" />
                          <p className="text-sm font-semibold text-green-800">Selected Address</p>
                        </div>
                        <p className="text-sm text-green-700">
                          {bookingData.address.street && `${bookingData.address.street}, `}
                          {bookingData.address.city && `${bookingData.address.city}, `}
                          {bookingData.address.state && `${bookingData.address.state} `}
                          {bookingData.address.pincode && `- ${bookingData.address.pincode}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Current Location Display */}
                {bookingData.useCurrentLocation && bookingData.address.coordinates.lat && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center mb-2">
                      <MapPinIcon className="h-4 w-4 text-green-600 mr-2" />
                      <p className="text-sm font-semibold text-green-800">Location Detected</p>
                    </div>
                    <p className="text-sm text-green-700">
                      {bookingData.address.street && `${bookingData.address.street}, `}
                      {bookingData.address.city && `${bookingData.address.city}, `}
                      {bookingData.address.state && `${bookingData.address.state} `}
                      {bookingData.address.pincode && `- ${bookingData.address.pincode}`}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Coordinates: {bookingData.address.coordinates.lat?.toFixed(6)}, {bookingData.address.coordinates.lng?.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <MicrophoneIcon className="h-4 w-4 mr-2 text-blue-600" />
                Voice Note (Optional)
              </label>
              <p className="text-sm text-gray-600 mb-4">Record a voice message explaining what you need help with</p>
              
              <div className="space-y-4">
                {/* Recording Controls */}
                {!audioURL && !isRecording && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors duration-200 font-medium"
                    >
                      <MicrophoneIcon className="h-5 w-5" />
                      <span>Start Recording</span>
                    </button>
                  </div>
                )}

                {/* Recording in Progress */}
                {isRecording && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="animate-pulse">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                        <span className="text-red-700 font-medium">Recording...</span>
                        <span className="text-red-600 font-mono">{formatTime(recordingTime)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                      >
                        <StopIcon className="h-4 w-4" />
                        <span>Stop</span>
                      </button>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((recordingTime / 60) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Recorded Audio Preview */}
                {audioURL && !isRecording && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 font-medium">Voice Note Recorded</span>
                        <span className="text-green-600 font-mono">{formatTime(recordingTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <audio controls className="h-8">
                          <source src={audioURL} type="audio/webm" />
                          Your browser does not support the audio element.
                        </audio>
                        <button
                          type="button"
                          onClick={deleteVoiceNote}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors duration-200"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-blue-600" />
                Additional Notes (Optional)
              </label>
              <textarea
                placeholder="Any specific requirements or details about the service..."
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-2">📢 Instant Booking (7km Range)</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Your request will be sent immediately to verified providers within 7km of your location. The first provider to accept will be assigned to your booking.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Booking</span>
                    <ArrowRightIcon className="h-4 w-4" />
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
