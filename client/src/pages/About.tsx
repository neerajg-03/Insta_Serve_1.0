import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ───────────────── ICONS ───────────────── */

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3l5.8 1.9-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>
  </svg>
);

const UserGroupIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
  </svg>
);

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const BoltIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const StarFill = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F59E0B">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

/* ───────────────── TYPES ───────────────── */

interface Testimonial {
  id: number;
  name: string;
  service: string;
  comment: string;
  avatar: string;
  location: string;
  date: string;
}

/* ───────────────── COMPONENT ───────────────── */

const About: React.FC = () => {
  const navigate = useNavigate();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Sonali Jhankar',
      service: 'Home Cleaning',
      comment:
        'Amazing service! The provider was professional and did an excellent job.',
      avatar: 'SJ',
      location: 'Delhi',
      date: '2 days ago'
    },
    {
      id: 2,
      name: 'Mahesh Gupta',
      service: 'AC Repair',
      comment:
        'Quick response time and expert service. My AC was fixed within hours.',
      avatar: 'MG',
      location: 'Mumbai',
      date: '1 week ago'
    },
    {
      id: 3,
      name: 'Rakesh Singh',
      service: 'Plumbing',
      comment:
        'Reliable and affordable. The plumber arrived on time and solved the issue efficiently.',
      avatar: 'RS',
      location: 'Bangalore',
      date: '2 weeks ago'
    },
    {
      id: 4,
      name: 'Simran Ahuja',
      service: 'Electrical Work',
      comment:
        'Professional electrician with great knowledge. Safety was prioritized.',
      avatar: 'SA',
      location: 'Pune',
      date: '3 weeks ago'
    }
  ];

  const milestones = [
    {
      year: '2024',
      title: 'Platform Launched'
    },
    {
      year: '2025',
      title: '10K+ Providers Joined'
    },
    {
      year: '2025',
      title: 'Expanded Across India'
    },
    {
      year: '2026',
      title: '50K+ Happy Customers'
    }
  ];

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', move);

    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Sora','DM Sans',sans-serif",
        background: '#060609',
        color: '#fff',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      {/* Mouse Glow */}
      <div
        style={{
          position: 'fixed',
          top: mousePosition.y - 200,
          left: mousePosition.x - 200,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle,rgba(124,58,237,.15),transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&display=swap');

        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }

        :root{
          --accent:#7C3AED;
          --c2:#06B6D4;
          --gold:#F59E0B;
          --surf:#0D0D14;
          --muted:rgba(255,255,255,.55);
          --border:rgba(255,255,255,.08);
        }

        body{
          background:#060609;
        }

        html{
          scroll-behavior:smooth;
        }

        ::selection{
          background:#7C3AED;
          color:white;
        }

        @keyframes shimmer{
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }

        @keyframes float{
          0%,100%{transform:translateY(0px)}
          50%{transform:translateY(-8px)}
        }

        .shimmer{
          background:linear-gradient(
            90deg,
            #fff 20%,
            #a78bfa 40%,
            #22d3ee 60%,
            #fff 80%
          );
          background-size:200% auto;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimmer 5s linear infinite;
        }

        .card{
          position:relative;
          overflow:hidden;
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.05),
              rgba(255,255,255,.02)
            );
          border:1px solid rgba(255,255,255,.08);
          backdrop-filter:blur(18px);
          border-radius:28px;
          padding:32px;
          transition:all .35s ease;
          box-shadow:0 10px 40px rgba(0,0,0,.25);
        }

        .card::before{
          content:'';
          position:absolute;
          inset:0;
          background:
            linear-gradient(
              135deg,
              rgba(124,58,237,.1),
              transparent 40%,
              rgba(6,182,212,.06)
            );
          pointer-events:none;
        }

        .card:hover{
          transform:translateY(-8px);
          border-color:rgba(255,255,255,.18);
          box-shadow:
            0 20px 70px rgba(124,58,237,.18);
        }

        .btn-primary{
          display:inline-flex;
          align-items:center;
          gap:10px;
          background:white;
          color:#060609;
          border:none;
          border-radius:100px;
          padding:16px 34px;
          font-weight:700;
          cursor:pointer;
          transition:.3s ease;
        }

        .btn-primary:hover{
          transform:translateY(-3px) scale(1.02);
        }

        .btn-secondary{
          display:inline-flex;
          align-items:center;
          gap:10px;
          background:transparent;
          color:white;
          border:1px solid rgba(255,255,255,.14);
          border-radius:100px;
          padding:16px 34px;
          cursor:pointer;
          transition:.3s ease;
        }

        .btn-secondary:hover{
          background:rgba(255,255,255,.05);
        }

        @media(max-width:768px){
          .hero-title{
            font-size:52px !important;
          }

          .section-title{
            font-size:34px !important;
          }

          .card{
            padding:24px;
          }
        }
      `}</style>

      {/* HERO */}

      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '80px 24px',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            width: '100%',
            textAlign: 'center'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                borderRadius: 100,
                background: 'rgba(124,58,237,.14)',
                border: '1px solid rgba(124,58,237,.35)',
                marginBottom: 28
              }}
            >
              <SparklesIcon />
              Trusted by 50,000+ customers
            </div>

            <h1
              className="hero-title"
              style={{
                fontSize: 'clamp(60px,8vw,110px)',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-4px',
                marginBottom: 24,
                textShadow: '0 0 40px rgba(124,58,237,.15)'
              }}
            >
              About <span className="shimmer">InstaServe</span>
            </h1>

            <p
              style={{
                maxWidth: 540,
                margin: '0 auto',
                color: 'rgba(255,255,255,.55)',
                lineHeight: 1.8,
                fontSize: 17
              }}
            >
              Your trusted platform for connecting with verified local service
              professionals across India.
            </p>

            {/* Stats */}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(180px,1fr))',
                gap: 18,
                marginTop: 56,
                maxWidth: 950,
                marginInline: 'auto'
              }}
            >
              {[
                ['50K+', 'Happy Customers'],
                ['10K+', 'Verified Providers'],
                ['25+', 'Service Categories'],
                ['4.9★', 'Average Rating']
              ].map(([num, label]) => (
                <div
                  key={label}
                  className="card"
                  style={{
                    padding: '28px 18px',
                    animation: 'float 5s ease-in-out infinite'
                  }}
                >
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 900,
                      marginBottom: 8,
                      background:
                        'linear-gradient(135deg,#fff,#a78bfa,#22d3ee)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {num}
                  </div>

                  <div
                    style={{
                      color: 'rgba(255,255,255,.5)',
                      fontSize: 13
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* STORY + MISSION */}

      <section style={{ padding: '20px 24px 80px' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
            gap: 24
          }}
        >
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 24
              }}
            >
              <div
                style={{
                  background: 'var(--accent)',
                  padding: 14,
                  borderRadius: 16
                }}
              >
                <RocketIcon />
              </div>

              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800
                }}
              >
                Our Story
              </h2>
            </div>

            <p
              style={{
                color: 'var(--muted)',
                lineHeight: 1.8
              }}
            >
              Founded in 2024, InstaServe was created to simplify how people
              discover trusted local professionals. We wanted booking quality
              services to feel seamless, fast, and secure.
            </p>
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 24
              }}
            >
              <div
                style={{
                  background:
                    'linear-gradient(135deg,#06B6D4,#4ADE80)',
                  padding: 14,
                  borderRadius: 16
                }}
              >
                <HeartIcon />
              </div>

              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800
                }}
              >
                Our Mission
              </h2>
            </div>

            <p
              style={{
                color: 'var(--muted)',
                lineHeight: 1.8
              }}
            >
              We are building India’s most trusted local services ecosystem —
              empowering providers while helping customers discover reliable,
              verified professionals instantly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* VALUES */}

      <section style={{ padding: '40px 24px 90px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2
              className="section-title"
              style={{
                fontSize: 'clamp(40px,5vw,62px)',
                fontWeight: 900,
                marginBottom: 14,
                letterSpacing: '-2px'
              }}
            >
              Our Core Values
            </h2>

            <p
              style={{
                color: 'rgba(255,255,255,.5)'
              }}
            >
              Principles that guide everything we build.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(240px,1fr))',
              gap: 22
            }}
          >
            {[
              {
                icon: <ShieldCheckIcon />,
                title: 'Trust',
                desc: 'Verified professionals and secure bookings.'
              },
              {
                icon: <StarIcon />,
                title: 'Quality',
                desc: 'Exceptional customer experiences every time.'
              },
              {
                icon: <BoltIcon />,
                title: 'Speed',
                desc: 'Instant discovery and fast booking flow.'
              },
              {
                icon: <HeartIcon />,
                title: 'Community',
                desc: 'Empowering local businesses and customers.'
              }
            ].map((item) => (
              <motion.div
                key={item.title}
                className="card"
                whileHover={{ y: -8 }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background:
                      'linear-gradient(135deg,#7C3AED,#06B6D4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 22
                  }}
                >
                  {item.icon}
                </div>

                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 10
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    color: 'var(--muted)',
                    lineHeight: 1.7
                  }}
                >
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}

      <section style={{ padding: '20px 24px 90px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2
              style={{
                fontSize: 'clamp(40px,5vw,60px)',
                fontWeight: 900,
                letterSpacing: '-2px'
              }}
            >
              Our Journey
            </h2>
          </div>

          <div
            style={{
              position: 'relative',
              paddingLeft: 24,
              borderLeft: '1px solid rgba(255,255,255,.12)'
            }}
          >
            {milestones.map((m) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                style={{
                  marginBottom: 42,
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: -33,
                    top: 6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#7C3AED',
                    boxShadow: '0 0 20px #7C3AED'
                  }}
                />

                <div
                  style={{
                    color: '#A78BFA',
                    fontWeight: 800,
                    marginBottom: 6
                  }}
                >
                  {m.year}
                </div>

                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700
                  }}
                >
                  {m.title}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}

      <section style={{ padding: '20px 24px 90px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="card">
            <div
              style={{
                textAlign: 'center',
                marginBottom: 42
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(36px,5vw,58px)',
                  fontWeight: 900,
                  letterSpacing: '-2px',
                  marginBottom: 12
                }}
              >
                Why People Trust Us
              </h2>

              <p style={{ color: 'var(--muted)' }}>
                Built for safety, speed, and reliability.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(240px,1fr))',
                gap: 24
              }}
            >
              {[
                'Background Verified Providers',
                'Secure Payments',
                '24/7 Customer Support',
                'Fast Response Time'
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 20,
                    borderRadius: 18,
                    background: 'rgba(255,255,255,.03)',
                    border: '1px solid rgba(255,255,255,.06)'
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background:
                        'linear-gradient(135deg,#7C3AED,#06B6D4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckIcon />
                  </div>

                  <span
                    style={{
                      fontWeight: 600
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}

      <section style={{ padding: '20px 24px 100px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2
              style={{
                fontSize: 'clamp(40px,5vw,60px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                marginBottom: 14
              }}
            >
              Customer Experiences
            </h2>

            <p style={{ color: 'var(--muted)' }}>
              Real feedback from real users.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(280px,1fr))',
              gap: 24
            }}
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.id}
                className="card"
                whileHover={{ y: -8 }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 18,
                    fontSize: 80,
                    opacity: 0.05,
                    fontWeight: 900
                  }}
                >
                  "
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 18
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg,#7C3AED,#06B6D4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}
                  >
                    {t.avatar}
                  </div>

                  <div>
                    <h4>{t.name}</h4>
                    <span
                      style={{
                        color: 'var(--muted)',
                        fontSize: 13
                      }}
                    >
                      {t.location}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    marginBottom: 16
                  }}
                >
                  {[...Array(5)].map((_, i) => (
                    <StarFill key={i} />
                  ))}
                </div>

                <p
                  style={{
                    color: 'var(--muted)',
                    lineHeight: 1.8,
                    marginBottom: 20
                  }}
                >
                  "{t.comment}"
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 16,
                    borderTop: '1px solid rgba(255,255,255,.08)'
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: '#A78BFA',
                      fontWeight: 700
                    }}
                  >
                    {t.service}
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)'
                    }}
                  >
                    {t.date}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}

      <section style={{ padding: '0 24px 120px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 34,
              border: '1px solid rgba(255,255,255,.08)'
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80"
              alt="community"
              style={{
                width: '100%',
                height: 520,
                objectFit: 'cover'
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `
                  linear-gradient(
                    135deg,
                    rgba(6,6,9,.96) 15%,
                    rgba(6,6,9,.82) 45%,
                    rgba(6,6,9,.35) 100%
                  )
                `
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
                textAlign: 'center'
              }}
            >
              <div style={{ maxWidth: 760 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    padding: 18,
                    borderRadius: 22,
                    background: 'rgba(255,255,255,.08)',
                    backdropFilter: 'blur(10px)',
                    marginBottom: 26
                  }}
                >
                  <RocketIcon />
                </div>

                <h2
                  style={{
                    fontSize: 'clamp(42px,6vw,76px)',
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: '-3px',
                    marginBottom: 22
                  }}
                >
                  Join Our Growing{' '}
                  <span className="shimmer">Community</span>
                </h2>

                <p
                  style={{
                    color: 'rgba(255,255,255,.6)',
                    lineHeight: 1.8,
                    maxWidth: 580,
                    margin: '0 auto 40px'
                  }}
                >
                  Whether you're looking for trusted services or want to grow
                  your local business, InstaServe is built for you.
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 14,
                    flexWrap: 'wrap'
                  }}
                >
                  <button
                    className="btn-primary"
                    onClick={() => navigate('/register')}
                  >
                    Join as Provider
                    <ArrowRightIcon />
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={() => navigate('/services')}
                  >
                    Browse Services
                    <SparklesIcon />
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
