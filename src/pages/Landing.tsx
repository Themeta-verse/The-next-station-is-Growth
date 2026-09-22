import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, Landmark, BookOpen, Sparkles, Search, MapPin } from 'lucide-react';
import { useStationStore, type Domain } from '@/store/useStationStore';

const domainOptions: { id: Domain; icon: typeof Cpu; title: string; desc: string; stat: string; pkg: string; companies: string; image: string; accent: string; bg: string }[] = [
  {
    id: 'engineering',
    icon: Cpu,
    title: 'Engineering',
    desc: 'Tech placements, DSA, system design and full-stack prep',
    stat: '87% placement rate',
    pkg: 'Avg 8.2 LPA',
    companies: 'TCS, Infosys, Google',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    accent: 'from-blue-100 via-slate-50 to-white',
    bg: 'from-sky-100 via-slate-50 to-white',
  },
  {
    id: 'commerce',
    icon: Landmark,
    title: 'Commerce',
    desc: 'Banking, finance and competitive exam readiness',
    stat: '72% selection rate',
    pkg: 'Avg 6.5 LPA',
    companies: 'SBI, ICICI, RBI',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80',
    accent: 'from-amber-100 via-orange-50 to-white',
    bg: 'from-amber-100 via-orange-50 to-white',
  },
  {
    id: 'arts',
    icon: BookOpen,
    title: 'Arts',
    desc: 'UPSC, IAS, IPS and humanities career growth',
    stat: '94% prelims clear rate',
    pkg: 'Grade A postings',
    companies: 'IAS, IPS, IFS',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
    accent: 'from-violet-100 via-fuchsia-50 to-white',
    bg: 'from-violet-100 via-fuchsia-50 to-white',
  },
];

const heroImage = 'https://images.unsplash.com/photo-1498079022511-d15614cb1c02?auto=format&fit=crop&w=1000&q=80';

function StreamButton({ id, title, selected, onSelect }: { id: Domain; title: string; selected: boolean; onSelect: (id: Domain) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${selected ? 'border-accent bg-accent/10 text-accent shadow-sm' : 'border-border bg-background text-foreground hover:border-accent/70 hover:bg-accent/5'}`}
    >
      {title}
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { setDomain } = useStationStore();
  const [selectedDomain, setSelectedDomain] = useState<Domain>('engineering');
  const [goal, setGoal] = useState('Get ready for placement');
  const [city, setCity] = useState('Mumbai');
  const [name, setName] = useState('');

  const handleFindStation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDomain(selectedDomain);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Station logo" className="h-11 w-11 rounded-2xl border border-border bg-card p-1" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Career Station</p>
              <h1 className="text-2xl font-bold">Station</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-fuchsia-500 px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition duration-200 hover:brightness-110"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center pb-16">
        <div className="space-y-8">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.35em] text-accent">AI Career Growth Platform</p>
            <h2 className="mt-4 text-5xl md:text-6xl font-bold leading-tight">AI Career Growth Platform</h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Unlock your dream job with personalized AI guidance, mock interviews, resume builder, quizzes, and more. Tailored for Engineering, Commerce, and Arts.
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="rounded-[1.75rem] border border-border bg-white/90 px-6 py-5 shadow-sm backdrop-blur-sm transition hover:shadow-xl">
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Fast prep</p>
              <h3 className="mt-3 text-lg font-semibold">Structured daily planner</h3>
            </div>
            <div className="rounded-[1.75rem] border border-border bg-white/90 px-6 py-5 shadow-sm backdrop-blur-sm transition hover:shadow-xl">
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Smart goals</p>
              <h3 className="mt-3 text-lg font-semibold">Focus on what matters</h3>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl md:h-[460px]">
          <img
            src={heroImage}
            alt="Students planning career goals"
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 rounded-[1.75rem] border border-white/50 bg-white/90 p-6 backdrop-blur-xl shadow-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Study insights</p>
            <h3 className="mt-3 text-2xl font-semibold">Balanced growth, calm confidence</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Soft visuals and clear learning steps help you focus on progress rather than noise.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {domainOptions.map((domain) => (
            <button
              key={domain.id}
              type="button"
              onClick={() => { setDomain(domain.id); navigate('/auth'); }}
              className={`group overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br ${domain.bg} px-6 py-8 text-left shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/90 text-foreground shadow-sm transition group-hover:bg-white">
                <domain.icon className="h-6 w-6" />
              </div>
              <p className="mt-6 text-lg font-semibold">{domain.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{domain.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20 grid gap-8 xl:grid-cols-[0.9fr_1.1fr] items-start">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-[0_22px_80px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-accent">Sign in / Sign up</p>
                <h3 className="mt-3 text-3xl font-semibold">Continue where you left off</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-110"
              >
                Continue now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="rounded-3xl border border-border bg-background px-6 py-5 text-left transition hover:border-accent hover:shadow-md"
              >
                <p className="text-sm font-semibold">Sign in</p>
                <p className="mt-2 text-sm text-muted-foreground">Access your plan, progress and mock interviews.</p>
              </button>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="rounded-3xl border border-border bg-gradient-to-br from-violet-100 to-white px-6 py-5 text-left transition hover:shadow-md"
              >
                <p className="text-sm font-semibold">Sign up</p>
                <p className="mt-2 text-sm text-muted-foreground">Set your stream, goals and start smart preparation.</p>
              </button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {domainOptions.map((domain) => (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`rounded-[1.75rem] border p-5 text-left shadow-sm transition duration-300 ${selectedDomain === domain.id ? 'border-accent bg-accent/15 text-accent shadow-md' : 'border-border bg-white/90 text-foreground hover:border-accent/70 hover:bg-accent/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-3xl bg-white text-accent shadow-sm">
                      <domain.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{domain.title}</p>
                      <p className="text-xs text-muted-foreground">{domain.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleFindStation} className="rounded-[2rem] border border-border bg-gradient-to-br from-slate-50 via-white to-white p-8 shadow-[0_22px_80px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-3xl bg-accent/10 text-accent">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Find your station</p>
                <h3 className="mt-2 text-2xl font-semibold">Start with your goal</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-foreground">Your Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter full name"
                  className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">City</span>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Mumbai, Delhi, Pune"
                  className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-foreground">Goal</span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Get ready for placement"
                className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Selected stream: <span className="font-semibold text-foreground">{selectedDomain}</span></p>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-110">
                Find Station <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-[2rem] border border-border bg-gradient-to-br from-white via-slate-50 to-white p-8 shadow-[0_22px_80px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Station cards</p>
              <h3 className="mt-3 text-3xl font-semibold">Choose your stream</h3>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-3xl bg-accent/10 text-accent">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
          <div className="grid gap-5">
            {domainOptions.map((domain) => (
              <div key={domain.id} className={`overflow-hidden rounded-[1.75rem] border border-border bg-gradient-to-br ${domain.accent} shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}>
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={domain.image}
                    alt={`${domain.title} illustration`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
                </div>
                <div className="space-y-3 p-5 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-accent shadow-sm">
                      <domain.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">{domain.title}</h4>
                      <p className="text-sm text-muted-foreground">{domain.desc}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p>{domain.stat}</p>
                    <p>{domain.pkg}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card border-t border-border py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">How Station Works</h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground mb-12">
            A calm, clear roadmap for students who want structured preparation, better confidence, and a real career outcome.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Choose your domain', desc: 'Engineering, Commerce, or Arts — every plan is designed for the path ahead.' },
              { step: '02', title: 'Answer quick questions', desc: 'Tell us your ambition, current level and city to personalize your plan.' },
              { step: '03', title: 'Start with focus', desc: 'Begin with mock tests, daily study goals, and interview practice tailored to you.' },
            ].map((item) => (
              <div key={item.step} className="rounded-[1.75rem] border border-border bg-white/80 p-8 text-left shadow-sm transition hover:shadow-xl">
                <span className="text-4xl font-bold text-accent/25">{item.step}</span>
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
