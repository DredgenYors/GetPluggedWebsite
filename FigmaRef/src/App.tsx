import { useState, useEffect } from 'react';
import { ArrowUpRight, X, ChevronRight } from 'lucide-react';
import logoUrl from '@/imports/GPBLANK.png';
import flyerUrl from '@/imports/IMG_8699-1.jpeg';

// Collaboration / creative imagery
const HERO_IMG = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=900&fit=crop&auto=format';
const COLLAB_IMG = 'https://images.unsplash.com/photo-1614244124566-c2f32f7023d2?w=900&h=700&fit=crop&auto=format';
const STUDIO_IMG = 'https://images.unsplash.com/photo-1763336332431-f9c526f6052c?w=900&h=900&fit=crop&auto=format';
const CAMERA_IMG = 'https://images.unsplash.com/photo-1587050265310-1a2d98ccce5f?w=700&h=900&fit=crop&auto=format';
const NETWORK_IMG = 'https://images.unsplash.com/photo-1550177977-ad69e8f3cae0?w=900&h=900&fit=crop&auto=format';
const MEETING_IMG = 'https://images.unsplash.com/photo-1563461661026-49631dd5d68e?w=900&h=700&fit=crop&auto=format';
const LAPTOP_IMG = 'https://images.unsplash.com/photo-1651889523218-ee0aadc12003?w=800&h=800&fit=crop&auto=format';
const PRODUCER_IMG = 'https://images.unsplash.com/photo-1787195926307-f37831ddabff?w=800&h=800&fit=crop&auto=format';
// Gallery event images
const OUTLET_IMG = flyerUrl;
const STAGE_IMG = 'https://images.unsplash.com/photo-1556340346-5e30da977c4d?w=900&h=1200&fit=crop&auto=format';
const DJ_IMG = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&h=1200&fit=crop&auto=format';
const CONCERT_IMG = 'https://images.unsplash.com/photo-1688412062361-583408dc928c?w=900&h=1200&fit=crop&auto=format';

interface GalleryItem {
  id: number;
  title: string;
  date: string;
  type: string;
  venue: string;
  description: string;
  coverImg: string;
  gallery: string[];
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: 'THE OUTLET',
    date: 'JUN 20, 2025',
    type: 'EVENT · VENDORS · LIVE MUSIC',
    venue: 'Best Kept Secret — Hillside, NJ',
    description: '10 local artists, live painting, photobooth, airbrush apparel, desserts, creative networking, and sounds by DJ REYY. The experience that started it all.',
    coverImg: OUTLET_IMG,
    gallery: [COLLAB_IMG, STUDIO_IMG, NETWORK_IMG, LAPTOP_IMG],
  },
  {
    id: 2,
    title: 'SUMMER PLUGGED',
    date: 'AUG 12, 2024',
    type: 'ARTIST SHOWCASE',
    venue: 'The Atrium — Newark, NJ',
    description: 'A summer showcase spotlighting emerging NJ creatives. Curated performances, brand activations, and a room full of people who believe in the work.',
    coverImg: STAGE_IMG,
    gallery: [MEETING_IMG, COLLAB_IMG, NETWORK_IMG, CAMERA_IMG],
  },
  {
    id: 3,
    title: 'THE LINK UP',
    date: 'OCT 28, 2024',
    type: 'NETWORKING · PANELS',
    venue: 'Element — Montclair, NJ',
    description: 'Connecting artists, creators, and industry professionals. Panel discussions, live sets, and open-format conversations about what it actually takes.',
    coverImg: DJ_IMG,
    gallery: [STUDIO_IMG, LAPTOP_IMG, PRODUCER_IMG, CAMERA_IMG],
  },
  {
    id: 4,
    title: 'WINTER RHYTHMS',
    date: 'DEC 15, 2024',
    type: 'CONCERT SERIES',
    venue: 'Studio 17 — Jersey City, NJ',
    description: 'An intimate end-of-year celebration of culture, music, and the people building something real in NJ.',
    coverImg: CONCERT_IMG,
    gallery: [COLLAB_IMG, MEETING_IMG, NETWORK_IMG, STAGE_IMG],
  },
];

const whatsNext = [
  {
    id: 1,
    label: 'UPCOMING EVENT',
    title: 'THE OUTLET VOL. 2',
    date: 'OCT 18, 2025',
    detail: 'Kulture Gallery - Bloomfield, NJ',
    status: 'TICKETS HERE!',
  },
  {
    id: 2,
    label: 'COLLABORATION',
    title: 'GET PLUGGED X 20 TITANZ : FEAR FUNCTION',
    date: 'OCT 20, 2026',
    detail: 'Kulture Gallery - Bloomfield, NJ',
    status: 'TICKETS COMING SOON',
  },
  {
    id: 3,
    label: 'ANNOUNCEMENT',
    title: 'NEW PARTNERSHIPS',
    date: 'COMING SOON',
    detail: 'New resources for NJ creatives',
    status: 'Follow for updates',
  },
];

const services = [
  {
    num: '01',
    title: 'EVENTS & EXPERIENCES',
    desc: 'Curated events and activations that create space for connection, visibility, and opportunity.',
  },
  {
    num: '02',
    title: 'CREATIVE CONNECTIONS',
    desc: 'Connecting artists, creators, and brands with trusted people and resources across our network.',
  },
  {
    num: '03',
    title: 'ARTIST & CREATIVE SUPPORT',
    desc: 'Helping creatives identify what they need next and connect with the right resources and opportunities.',
  },
  {
    num: '04',
    title: 'PARTNERSHIPS & COLLABORATIONS',
    desc: 'Creating thoughtful connections between creatives, brands, businesses, venues, and organizations.',
  },
];

const partners = [
  'Best Kept Secret', 'DJ Reyy', 'Airbrush Culture', 'The Atrium NJ',
  'Studio 17', 'Element Montclair', 'Plug Records', 'Culture Coast',
];

const NAV_LINKS = [
  { href: '#mission', label: 'Mission' },
  { href: '#services', label: 'Services' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#pluggedin', label: 'Stay Plugged In' },
  { href: '#story', label: 'Our Story' },
  { href: '#contact', label: 'Contact' },
];

export default function App() {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = activeItem ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeItem]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* ── NAV ── */}
      <nav
        className="fixed top-0 w-full z-50 transition-all duration-300"
        style={{
          borderBottom: '1px solid #D0C9BF',
          background: 'rgba(241,236,227,0.97)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#" className="flex-shrink-0">
            <img src={logoUrl} alt="Get Plugged NJ" style={{ width: 100, height: 100, objectFit: 'contain' }} />
          </a>

          <div className="hidden md:flex items-center gap-8 font-mono text-xs tracking-[0.12em] uppercase text-muted-foreground">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="hover:text-foreground transition-colors">{label}</a>
            ))}
          </div>

          <a
            href="#contact"
            className="hidden md:inline-flex items-center gap-2 font-mono text-xs font-bold tracking-[0.12em] uppercase px-5 py-3 transition-colors"
            style={{ background: '#40B648', color: '#fff' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#262321'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#40B648'; }}
          >
            Get Plugged <ArrowUpRight className="size-3" />
          </a>

          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span className={`block h-px bg-foreground transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-px bg-foreground transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px bg-foreground transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border px-6 py-8 flex flex-col gap-6 font-mono text-sm tracking-widest uppercase">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                {label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col justify-end overflow-hidden" style={{ background: '#F1ECE3' }}>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24 md:pb-36 pt-40 w-full">
          {/* eyebrow */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-px" style={{ background: '#40B648' }} />
            <span className="font-mono text-xs tracking-[0.22em] uppercase" style={{ color: '#40B648' }}>
              CREATIVITY • CONNECTION • ACCESS
            </span>
          </div>

          {/* main headline */}
          <h1
            className="font-display font-black uppercase leading-[0.88] tracking-tight text-foreground"
            style={{ fontSize: 'clamp(5rem, 16vw, 13rem)' }}
          >
            GET<br />PLUGGED
          </h1>

          <p
            className="mt-6 font-editorial font-bold leading-snug"
            style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', color: 'rgb(64, 182, 72)', maxWidth: '28ch' }}
          >
            Where momentum meets opportunity.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <a
              href="#contact"
              className="group inline-flex items-center gap-3 font-mono font-bold text-xs tracking-[0.15em] uppercase px-8 py-4 transition-colors"
              style={{ background: '#40B648', color: '#fff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#262321'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#40B648'; }}
            >
              GET PLUGGED
              <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a
              href="#pluggedin"
              className="group inline-flex items-center gap-3 font-mono font-bold text-xs tracking-[0.15em] uppercase px-8 py-4 border transition-colors"
              style={{ borderColor: '#262321', color: '#262321' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#262321';
                (e.currentTarget as HTMLElement).style.color = '#F1ECE3';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#262321';
              }}
            >
              STAY PLUGGED IN <ChevronRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section id="mission" className="py-28 md:py-40 px-6 border-b" style={{ background: '#F1ECE3', borderColor: '#D0C9BF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-[200px_1fr] gap-16 md:gap-24 items-start">
            <div className="md:pt-2">
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Our Mission</span>
              <div className="mt-5 w-10 h-px" style={{ background: '#40B648' }} />
            </div>
            <div>
              <p
                className="font-editorial font-bold leading-tight text-foreground"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
              >
                Get Plugged exists to bridge the gap between potential and access. We connect emerging artists,
                creators, and local brands with the people, resources, and opportunities they need to reach
                their next level.
              </p>
              <a
                href="#story"
                className="mt-10 inline-flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors"
                style={{ color: '#40B648' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#262321'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#40B648'; }}
              >
                Our Story <ArrowUpRight className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-28 md:py-40 px-6 border-b" style={{ background: '#F1ECE3', borderColor: '#D0C9BF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div>
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">What We Do</span>
              <h2
                className="font-display font-black uppercase leading-[0.9] tracking-tight mt-4 text-foreground"
                style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}
              >
                SERVICES &amp; EXPERIENCES
              </h2>
            </div>
            <img
              src={COLLAB_IMG}
              alt="Creative collaboration"
              className="hidden md:block w-48 h-32 object-cover"
              style={{ filter: 'saturate(0.8) contrast(1.05)' }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-0">
            {services.map((s, i) => (
              <div
                key={s.num}
                className="group flex gap-8 py-10 border-t transition-all cursor-default"
                style={{
                  borderColor: '#D0C9BF',
                  borderRight: i % 2 === 0 ? '1px solid #D0C9BF' : 'none',
                  paddingLeft: i % 2 === 1 ? '2.5rem' : '0',
                  paddingRight: i % 2 === 0 ? '2.5rem' : '0',
                }}
              >
                <span
                  className="font-mono text-xs font-bold tracking-widest flex-shrink-0 pt-1"
                  style={{ color: '#40B648' }}
                >
                  {s.num}
                </span>
                <div>
                  <h3
                    className="font-display font-black uppercase tracking-tight leading-none mb-3 text-foreground group-hover:text-primary transition-colors"
                    style={{ fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)' }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B6560', maxWidth: '40ch' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section id="gallery" className="py-28 md:py-40 px-6 border-b" style={{ borderColor: '#D0C9BF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Our Work</span>
              <h2
                className="font-display font-black uppercase leading-[0.9] tracking-tight mt-4 text-foreground"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
              >
                GALLERY
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Hover to preview. Click any experience to explore the full recap.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="group relative cursor-pointer overflow-hidden"
                style={{ aspectRatio: '3/4', background: '#DDD8CE' }}
                onClick={() => setActiveItem(item)}
              >
                <img
                  src={item.coverImg}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                {/* base dark gradient */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(38,35,33,0.95) 0%, rgba(38,35,33,0.15) 55%, transparent 100%)' }}
                />
                {/* hover tint */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'rgba(38,35,33,0.35)' }}
                />

                {/* date badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className="font-mono text-[10px] font-bold tracking-widest uppercase px-2 py-1"
                    style={{ background: '#40B648', color: '#fff' }}
                  >
                    {item.date}
                  </span>
                </div>

                {/* bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p
                    className="font-mono text-[10px] font-bold tracking-widest uppercase mb-1.5"
                    style={{ color: '#40B648' }}
                  >
                    {item.type.split(' · ')[0]}
                  </p>
                  <h3
                    className="font-display font-black uppercase leading-none tracking-tight text-white"
                    style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)' }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed mt-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75"
                    style={{ color: 'rgba(241,236,227,0.8)', maxWidth: '28ch' }}
                  >
                    {item.description}
                  </p>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-100">
                    <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#40B648' }}>
                      View recap →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STAY PLUGGED IN ── */}
      <section id="pluggedin" className="py-28 md:py-40 px-6 border-b" style={{ background: '#F1ECE3', borderColor: '#D0C9BF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">What's Next</span>
              <h2
                className="font-display font-black uppercase leading-[0.9] tracking-tight mt-4 text-foreground"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
              >
                STAY<br />PLUGGED IN
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Events, collaborations, content drops, community opportunities — follow along.
            </p>
          </div>

          <div className="flex flex-col">
            {whatsNext.map((item, i) => (
              <div
                key={item.id}
                className="group flex flex-col md:flex-row md:items-center gap-6 md:gap-12 py-10 border-t"
                style={{ borderColor: '#D0C9BF' }}
              >
                <div className="flex-shrink-0 w-10">
                  <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className="font-mono text-[10px] font-bold tracking-widest uppercase mb-2 inline-block"
                    style={{ color: '#40B648' }}
                  >
                    {item.label}
                  </span>
                  <h3
                    className="font-display font-black uppercase leading-none tracking-tight text-foreground group-hover:text-primary transition-colors"
                    style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-muted-foreground tracking-wide">{item.detail}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-display font-black text-xl tracking-tight text-foreground">{item.date}</div>
                  <div
                    className="mt-2 inline-block font-mono text-xs tracking-wider uppercase border px-4 py-2"
                    style={{ borderColor: '#D0C9BF', color: '#6B6560' }}
                  >
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t pt-10" style={{ borderColor: '#D0C9BF' }}>
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors"
                style={{ color: '#40B648' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#262321'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#40B648'; }}
              >
                Get notified about future drops
                <ArrowUpRight className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section id="story" className="py-28 md:py-40 px-6 border-b overflow-hidden" style={{ background: '#F1ECE3', borderColor: '#D0C9BF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl" style={{ padding: 0 }}>
            <span className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: '#40B648' }}>Our Story</span>
            <h2
              className="font-display font-black uppercase leading-[0.88] tracking-tight mt-6 text-foreground"
              style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
            >
              BORN IN<br />
              <span style={{ color: '#40B648', fontStyle: 'italic' }}>NJ,</span><br />
              MADE TO CONNECT.
            </h2>
            <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground" style={{ maxWidth: '52ch' }}>
              <p>
                Get Plugged was founded by Jordan Scott-Young and MCP, two lifelong music lovers whose connection to the industry started before they ever met.
              </p>
              <p>
                Jordan and MCP both developed a connection to music from an early age, with Jordan immersed in singing and performance and MCP in production and engineering.
              </p>
              <p>
                Together, they discovered a shared love for marketing, bringing ideas to life and creating the kinds of spaces and opportunities that can give emerging talent an early point of access into creative and professional spaces. By combining their different skills and perspectives, they began producing events from the ground up and creating opportunities for artists, creators and local brands to connect in ways that felt genuine.
              </p>
              <p>
                What started with live music events has grown into a larger vision for Get Plugged. Today we create access, experiences and connections that help emerging talent and brands build momentum, expand their network and move toward what comes next.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-8 pt-10 border-t" style={{ borderColor: '#D0C9BF' }}>
              {[['2024', 'Founded'], ['NJ', 'Based'], ['Independent', 'Built']].map(([val, label]) => (
                <div key={val}>
                  <div className="font-display font-black text-3xl leading-none" style={{ color: '#40B648' }}>{val}</div>
                  <div className="font-mono text-xs tracking-wider mt-2 uppercase text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT / CTA ── */}
      <section id="contact" className="py-40 px-6 bg-grid border-b" style={{ borderColor: '#D0C9BF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <span className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: '#40B648' }}>Connect</span>
            <h2
              className="font-display font-black uppercase leading-[0.88] tracking-tight mt-6 text-foreground"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}
            >
              READY TO GET<br />
              <span style={{ color: '#40B648' }}>PLUGGED IN?</span>
            </h2>
            <p className="mt-8 text-lg leading-relaxed" style={{ color: '#6B6560', maxWidth: '46ch' }}>
              Whether you're an artist looking for access, a brand seeking authentic reach, or a venue wanting to
              be part of the ecosystem — we want to hear from you.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:info@getpluggednj.com"
                className="group inline-flex items-center gap-3 font-mono font-bold text-xs tracking-[0.15em] uppercase px-8 py-4 transition-colors"
                style={{ background: '#40B648', color: '#fff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#262321'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#40B648'; }}
              >
                Email Us <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-3 font-mono font-bold text-xs tracking-[0.15em] uppercase px-8 py-4 border transition-colors"
                style={{ borderColor: '#D0C9BF', color: '#6B6560' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#262321';
                  (e.currentTarget as HTMLElement).style.color = '#262321';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#D0C9BF';
                  (e.currentTarget as HTMLElement).style.color = '#6B6560';
                }}
              >
                Follow @GetPluggedNJ
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-10 border-t" style={{ background: '#262321', borderColor: 'rgba(241,236,227,0.08)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-5">
            <img src={logoUrl} alt="Get Plugged NJ" style={{ width: 40, height: 40, objectFit: 'contain', opacity: 0.5, filter: 'grayscale(1) brightness(2)' }} />
            <span className="font-mono text-xs tracking-wider" style={{ color: 'rgba(241,236,227,0.35)' }}>
              © {new Date().getFullYear()} Get Plugged NJ. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            {['INSTAGRAM', 'TWITTER', 'TIKTOK'].map(label => (
              <a
                key={label}
                href="#"
                className="font-mono text-xs tracking-wider transition-colors"
                style={{ color: 'rgba(241,236,227,0.35)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#40B648'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(241,236,227,0.35)'; }}
              >
                {label}
              </a>
            ))}
            <span style={{ color: 'rgba(241,236,227,0.15)' }}>|</span>
            <a
              href="mailto:info@getpluggednj.com"
              className="font-mono text-xs tracking-wider transition-colors"
              style={{ color: 'rgba(241,236,227,0.35)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#40B648'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(241,236,227,0.35)'; }}
            >
              info@getpluggednj.com
            </a>
          </div>
        </div>
      </footer>

      {/* ── GALLERY MODAL ── */}
      {activeItem && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
          style={{ background: 'rgba(38,35,33,0.92)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setActiveItem(null); }}
        >
          <div
            className="relative w-full max-w-5xl mx-auto my-8 animate-fadeUp"
            style={{ background: '#F1ECE3', border: '1px solid #D0C9BF' }}
          >
            {/* modal hero */}
            <div className="relative h-72 md:h-96 overflow-hidden" style={{ background: '#DDD8CE' }}>
              <img
                src={activeItem.coverImg}
                alt={activeItem.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(38,35,33,0.95) 0%, rgba(38,35,33,0.3) 60%, transparent 100%)' }}
              />
              <div className="absolute bottom-8 left-8 right-8">
                <span
                  className="font-mono text-xs font-bold tracking-widest uppercase px-2 py-1 mb-4 inline-block"
                  style={{ background: '#40B648', color: '#fff' }}
                >
                  {activeItem.date}
                </span>
                <h2
                  className="font-display font-black uppercase leading-none tracking-tight text-white"
                  style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}
                >
                  {activeItem.title}
                </h2>
                <p className="font-mono text-xs mt-2 tracking-wider" style={{ color: 'rgba(241,236,227,0.6)' }}>{activeItem.venue}</p>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-6 right-6 p-2 transition-colors text-white hover:text-primary"
                aria-label="Close"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* modal body */}
            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-[2fr_1fr] gap-12 mb-12">
                <div>
                  <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#40B648' }}>
                    {activeItem.type}
                  </p>
                  <p className="text-base leading-relaxed text-muted-foreground">{activeItem.description}</p>
                </div>
                <div className="flex flex-col gap-4 font-mono text-xs text-muted-foreground tracking-wider">
                  {[['Date', activeItem.date], ['Venue', activeItem.venue], ['Type', activeItem.type.split(' · ')[0]]].map(([k, v]) => (
                    <div key={k}>
                      <div className="uppercase mb-1" style={{ color: '#40B648' }}>{k}</div>
                      <div className="text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-6">Recap — Photos</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {activeItem.gallery.map((img, i) => (
                    <div key={i} className="aspect-square overflow-hidden group cursor-pointer" style={{ background: '#DDD8CE' }}>
                      <img
                        src={img}
                        alt={`${activeItem.title} photo ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t flex justify-between items-center" style={{ borderColor: '#D0C9BF' }}>
                <button
                  onClick={() => setActiveItem(null)}
                  className="font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to Gallery
                </button>
                <a
                  href="#contact"
                  onClick={() => setActiveItem(null)}
                  className="font-mono text-xs tracking-widest uppercase transition-colors"
                  style={{ color: '#40B648' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#262321'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#40B648'; }}
                >
                  Connect with us →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
