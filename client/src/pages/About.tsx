import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ───────────────── ICONS ───────────────── */

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3l5.8 1.9-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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

const RocketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
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

  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });

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

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Sonali Jhankar',
      service: 'Home Cleaning',
      comment:
        'Amazing experience. The service was professional, quick, and reliable.',
      avatar: 'SJ',
      location: 'Delhi',
      date: 'Recently'
    },
    {
      id: 2,
      name: 'Mahesh Gupta',
      service: 'AC Repair',
      comment:
        'Very smooth booking process and the provider solved the issue efficiently.',
      avatar: 'MG',
      location: 'Mumbai',
      date: 'Recently'
    },
    {
      id: 3,
      name: 'Rakesh Singh',
      service: 'Plumbing',
      comment:
        'Reliable professionals and great support throughout the booking process.',
      avatar: 'RS',
      location: 'Bangalore',
      date: 'Recently'
    },
    {
      id: 4,
      name: 'Simran Ahuja',
      service: 'Electrical Work',
      comment:
        'Clean interface, trusted providers, and a genuinely premium experience.',
      avatar: 'SA',
      location: 'Pune',
      date: 'Recently'
    }
  ];

  const milestones = [
    {
      year: '2026',
      title: 'InstaServe Founded',
      description:
        'Started with a vision to simplify local services using trust and technology.'
    },
    {
      year: '2026',
      title: 'Platform Development',
      description:
        'Designed and developed a modern experience focused on speed and reliability.'
    },
    {
      year: '2026',
      title: 'Launching Initial Services',
      description:
        'Beginning with carefully selected service categories and verified providers.'
    },
    {
      year: 'Future',
      title: 'Growing Across Communities',
      description:
        'Expanding thoughtfully while keeping quality and trust at the center.'
    }
  ];

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
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');

        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }

        :root{
          --accent:#7C3AED;
          --c2:#06B6D4;
          --muted:rgba(255,255,255,.55);
          --border:rgba(255,255,255,.08);
        }

        html{
          scroll-behavior:smooth;
        }

        body{
          background:#060609;
        }

        ::selection{
          background:#7C3AED;
          color:#fff;
        }

        .section{
          padding:100px 24px;
          position:relative;
          z-index:2;
        }

        .container{
          max-width:1280px;
          margin:0 auto;
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
          border-radius:30px;
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
              rgba(124,58,237,.08),
              transparent 40%,
              rgba(6,182,212,.06)
            );
          pointer-events:none;
        }

        .card:hover{
          transform:translateY(-8px);
          border-color:rgba(255,255,255,.18);
          box-shadow:
            0 25px 60px rgba(124,58,237,.18);
        }

        .shimmer{
          background:linear-gradient(
            90deg,
            #fff 20%,
            #a78bfa 45%,
            #22d3ee 62%,
            #fff 80%
          );
          background-size:200% auto;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimmer 5s linear infinite;
        }

        @keyframes shimmer{
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }

        .btn-primary{
          display:inline-flex;
          align-items:center;
          gap:10px;
          background:#fff;
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
          color:#fff;
          border:1px solid rgba(255,255,255,.14);
          border-radius:100px;
          padding:16px 34px;
          cursor:pointer;
          transition:.3s ease;
        }

        .btn-secondary:hover{
          background:rgba(255,255,255,.05);
        }

        @media(max-width:900px){

          .journey-line{
            left:20px !important;
          }

          .journey-item{
            justify-content:flex-start !important;
            padding-left:60px;
          }

          .journey-card{
            width:100% !important;
          }

          .journey-dot{
            left:20px !important;
          }

          .journey-connector{
            display:none;
          }

        }

        @media(max-width:768px){

          .hero-title{
            font-size:54px !important;
          }

          .section-title{
            font-size:38px !important;
          }

          .card{
            padding:24px;
          }

          .section{
            padding:70px 20px;
          }

        }
      `}</style>

      {/* HERO */}

      <section
        className="section"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 100,
              background: 'rgba(124,58,237,.14)',
              border: '1px solid rgba(124,58,237,.3)',
              marginBottom: 28
            }}
          >
            <SparklesIcon />
            Built for fast, reliable local services
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
              maxWidth: 600,
              margin: '0 auto',
              color: 'rgba(255,255,255,.55)',
              lineHeight: 1.9,
              fontSize: 17
            }}
          >
            InstaServe connects customers with trusted local professionals
            through a modern platform focused on simplicity, reliability,
            and seamless experiences.
          </p>

          {/* Vision Cards */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(220px,1fr))',
              gap: 20,
              marginTop: 60
            }}
          >
            {[
              ['Verified', 'Trusted service professionals'],
              ['Fast Booking', 'Quick & seamless experience'],
              ['Secure', 'Safe payments & verified providers'],
              ['Community First', 'Built for local connections']
            ].map(([title, desc]) => (
              <div key={title} className="card">
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    marginBottom: 10,
                    background:
                      'linear-gradient(135deg,#fff,#a78bfa,#22d3ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {title}
                </div>

                <div
                  style={{
                    color: 'rgba(255,255,255,.5)',
                    lineHeight: 1.7,
                    fontSize: 14
                  }}
                >
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY + MISSION */}

      <section className="section">
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(320px,1fr))',
            gap: 24
          }}
        >
          <div className="card">
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
                  fontSize: 30,
                  fontWeight: 800
                }}
              >
                Our Story
              </h2>
            </div>

            <p
              style={{
                color: 'var(--muted)',
                lineHeight: 1.9
              }}
            >
              InstaServe was created with a simple vision — making local
              services more accessible, reliable, and transparent for
              everyone. We believe discovering trusted professionals
              should feel effortless.
            </p>
          </div>

          <div className="card">
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
                  fontSize: 30,
                  fontWeight: 800
                }}
              >
                Our Mission
              </h2>
            </div>

            <p
              style={{
                color: 'var(--muted)',
                lineHeight: 1.9
              }}
            >
              We are focused on building a trusted ecosystem where
              customers can confidently connect with skilled local
              professionals while empowering providers with better
              opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}

      <section className="section">
        <div className="container">
          <div
            style={{
              textAlign: 'center',
              marginBottom: 60
            }}
          >
            <h2
              className="section-title"
              style={{
                fontSize: 'clamp(40px,5vw,64px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                marginBottom: 14
              }}
            >
              Our Core Values
            </h2>

            <p
              style={{
                color: 'rgba(255,255,255,.5)'
              }}
            >
              Principles that guide every experience we create.
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
              {
                icon: <ShieldCheckIcon />,
                title: 'Trust',
                desc: 'Verified professionals and secure experiences.'
              },
              {
                icon: <StarIcon />,
                title: 'Quality',
                desc: 'Focused on delivering premium experiences.'
              },
              {
                icon: <BoltIcon />,
                title: 'Speed',
                desc: 'Quick discovery and seamless bookings.'
              },
              {
                icon: <HeartIcon />,
                title: 'Community',
                desc: 'Supporting local businesses and customers.'
              }
            ].map((item) => (
              <div key={item.title} className="card">
                <div
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: 20,
                    background:
                      'linear-gradient(135deg,#7C3AED,#06B6D4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24
                  }}
                >
                  {item.icon}
                </div>

                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    marginBottom: 12
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    color: 'var(--muted)',
                    lineHeight: 1.8
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNEY */}

      <section className="section">
        <div className="container">
          <div
            style={{
              textAlign: 'center',
              marginBottom: 80
            }}
          >
            <h2
              className="section-title"
              style={{
                fontSize: 'clamp(40px,5vw,64px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                marginBottom: 14
              }}
            >
              Our Journey
            </h2>

            <p
              style={{
                color: 'rgba(255,255,255,.5)',
                maxWidth: 600,
                margin: '0 auto',
                lineHeight: 1.8
              }}
            >
              Every platform starts with a vision and grows through
              meaningful progress.
            </p>
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 70
            }}
          >
            {/* Path Line */}

            <div
              className="journey-line"
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: 'translateX(-50%)',
                width: 4,
                height: '100%',
                background:
                  'linear-gradient(to bottom,#7C3AED,#06B6D4,#A855F7)',
                borderRadius: 100,
                boxShadow: '0 0 30px rgba(124,58,237,.4)'
              }}
            />

            {milestones.map((item, index) => {
              const isLeft = index % 2 === 0;

              return (
                <div
                  key={item.title}
                  className="journey-item"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: isLeft
                      ? 'flex-start'
                      : 'flex-end'
                  }}
                >
                  {/* Dot */}

                  <div
                    className="journey-dot"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%,-50%)',
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg,#7C3AED,#06B6D4)',
                      border: '4px solid #060609',
                      boxShadow:
                        '0 0 30px rgba(124,58,237,.7)'
                    }}
                  />

                  {/* Card */}

                  <div
                    className="card journey-card"
                    style={{
                      width: 'calc(50% - 50px)',
                      position: 'relative'
                    }}
                  >
                    {/* Connector */}

                    <div
                      className="journey-connector"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        [isLeft ? 'right' : 'left']: -50,
                        width: 50,
                        height: 2,
                        background:
                          'linear-gradient(to right,#7C3AED,#06B6D4)'
                      }}
                    />

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 100,
                        background: 'rgba(124,58,237,.12)',
                        border:
                          '1px solid rgba(124,58,237,.25)',
                        marginBottom: 18,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#C4B5FD'
                      }}
                    >
                      {item.year}
                    </div>

                    <h3
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        marginBottom: 14
                      }}
                    >
                      {item.title}
                    </h3>

                    <p
                      style={{
                        color: 'rgba(255,255,255,.55)',
                        lineHeight: 1.8
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST */}

      <section className="section">
        <div className="container">
          <div className="card">
            <div
              style={{
                textAlign: 'center',
                marginBottom: 50
              }}
            >
              <h2
                className="section-title"
                style={{
                  fontSize: 'clamp(38px,5vw,60px)',
                  fontWeight: 900,
                  letterSpacing: '-2px',
                  marginBottom: 14
                }}
              >
                Why Choose InstaServe
              </h2>

              <p
                style={{
                  color: 'rgba(255,255,255,.5)'
                }}
              >
                Built with reliability, safety, and simplicity in mind.
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
                'Verified Service Providers',
                'Secure Booking Experience',
                'Modern & Easy-to-Use Platform',
                'Focused on Quality & Trust'
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 22,
                    borderRadius: 18,
                    background: 'rgba(255,255,255,.03)',
                    border: '1px solid rgba(255,255,255,.06)'
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
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

      <section className="section">
        <div className="container">
          <div
            style={{
              textAlign: 'center',
              marginBottom: 60
            }}
          >
            <h2
              className="section-title"
              style={{
                fontSize: 'clamp(40px,5vw,64px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                marginBottom: 14
              }}
            >
              Customer Experiences
            </h2>

            <p
              style={{
                color: 'rgba(255,255,255,.5)'
              }}
            >
              Real feedback from users discovering local services.
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
              <div key={t.id} className="card">
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 20,
                    fontSize: 70,
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
                    borderTop:
                      '1px solid rgba(255,255,255,.08)'
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}

      <section
        className="section"
        style={{
          paddingTop: 0
        }}
      >
        <div className="container">
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
                  Join The{' '}
                  <span className="shimmer">InstaServe Journey</span>
                </h2>

                <p
                  style={{
                    color: 'rgba(255,255,255,.6)',
                    lineHeight: 1.8,
                    maxWidth: 580,
                    margin: '0 auto 40px'
                  }}
                >
                  Whether you're looking for trusted local services or
                  want to offer your skills, InstaServe is designed to
                  make the experience simple and reliable.
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
