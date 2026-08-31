import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Database,
  Brain,
  Bell,
  Radio,
  Heart,
  Building2,
  Home,
  Leaf,
  Mountain,
  Layers,
  CloudRain,
  MapPin,
  AlertTriangle,
  Users,
  BarChart3,
  Shield,
  Globe,
  TrendingUp,
  Newspaper,
  Settings,
  LogIn,
  Box,
  Activity,
} from 'lucide-react'
import { RISK_COLORS, HEAT_GRADIENT_STOPS } from '../utils/riskColors'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
}

const pipeline = [
  { icon: Database, title: 'Data Ingestion', desc: 'Rainfall, soil moisture, terrain, seismic & satellite feeds aggregated in real time' },
  { icon: Brain, title: 'ML Risk Classification', desc: 'Ensemble models score landslide probability per zone with confidence bands' },
  { icon: Bell, title: 'Alert Engine', desc: 'Threshold rules trigger tiered Advisory, Watch & Warning alerts automatically' },
  { icon: Radio, title: 'Multi-Channel Delivery', desc: 'SMS, app, radio & authority dashboards push alerts to the right people' },
]

const features = [
  {
    icon: Box,
    title: '3D Terrain Digital Twin',
    tag: 'Core',
    desc: 'Interactive mountainous NER landscape with orbit controls. Zone beacons glow by risk level and terrain surface tints blend across hotspots.',
    highlights: ['Procedural terrain mesh', 'Risk emissive glow', 'Click-through to zone detail'],
    accent: 'border-risk-low/30 bg-risk-low/5',
    iconColor: 'text-risk-low',
  },
  {
    icon: Layers,
    title: 'Multilayer Map Overlays',
    tag: 'Visualization',
    desc: 'Toggle independent data layers with per-layer opacity — combine risk, rainfall, roads, settlements, and historical landslide hotspots.',
    highlights: ['5 toggleable layers', 'Opacity sliders', 'Glass-panel controls'],
    accent: 'border-blue-500/30 bg-blue-500/5',
    iconColor: 'text-blue-400',
  },
  {
    icon: CloudRain,
    title: 'Rainfall Risk Simulator',
    tag: 'Interactive',
    desc: 'Drag a 50–300 mm rainfall slider and watch regional risk tier, affected zones, and population-at-risk update live on the 3D map.',
    highlights: ['Live 3D feedback', 'Count-up stats', 'Reset to baseline'],
    accent: 'border-cyan-500/30 bg-cyan-500/5',
    iconColor: 'text-cyan-400',
  },
  {
    icon: AlertTriangle,
    title: 'Predicted Impact & Exposure',
    tag: 'Assessment',
    desc: 'Per-zone severity tiers, roads and settlements in the path, infrastructure at risk, and causative factor breakdowns with contribution bars.',
    highlights: ['Severity tiers', 'Exposure numbers', 'Feature-importance chart'],
    accent: 'border-risk-high/30 bg-risk-high/5',
    iconColor: 'text-risk-high',
  },
  {
    icon: TrendingUp,
    title: '24h Risk Trajectory',
    tag: 'Forecast',
    desc: 'Hourly risk score forecasts with ML confidence bands and tier threshold reference lines for every monitored zone.',
    highlights: ['Confidence bands', 'Tier thresholds', 'ML confidence %'],
    accent: 'border-risk-moderate/30 bg-risk-moderate/5',
    iconColor: 'text-risk-moderate',
  },
  {
    icon: Bell,
    title: 'Tiered Alert System',
    tag: 'Response',
    desc: 'Advisory, Watch, and Warning alerts with affected radius, guidance text, and a live system feed on the operations dashboard.',
    highlights: ['3 alert tiers', 'Zone-linked guidance', 'Real-time feed'],
    accent: 'border-risk-very-high/30 bg-risk-very-high/5',
    iconColor: 'text-risk-very-high',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Trends',
    tag: 'Insights',
    desc: '30-day risk history, seasonal heatmaps, rainfall–risk correlation scatter plots, and multi-zone comparison charts.',
    highlights: ['Seasonal patterns', 'Zone comparison', 'Export-ready charts'],
    accent: 'border-purple-500/30 bg-purple-500/5',
    iconColor: 'text-purple-400',
  },
  {
    icon: Shield,
    title: 'Citizen Alert Portal',
    tag: 'Public',
    desc: 'Mobile-first citizen view with bilingual safety guidance (English & Assamese), evacuation centre info, and emergency contacts.',
    highlights: ['Bilingual UI', 'Evacuation centres', 'Emergency helplines'],
    accent: 'border-emerald-500/30 bg-emerald-500/5',
    iconColor: 'text-emerald-400',
  },
]

const portals = [
  {
    role: 'Admin Console',
    icon: Settings,
    desc: 'Full operations dashboard for disaster management authorities — monitor all zones, issue alerts, run simulations, and manage the sensor network.',
    features: ['3D terrain twin', 'Risk simulator', 'Zone analytics', 'Alert management', 'News feed'],
    cta: 'Admin Sign In',
    accent: 'from-risk-low/20 to-transparent',
    border: 'border-risk-low/30',
  },
  {
    role: 'Citizen Portal',
    icon: Users,
    desc: 'Public-facing alert view for residents — receive localized risk warnings, safety guidance, and evacuation information in their language.',
    features: ['Area risk banner', 'Safety checklist', 'Evacuation centres', 'Emergency contacts'],
    cta: 'Citizen Sign In',
    accent: 'from-blue-500/20 to-transparent',
    border: 'border-blue-500/30',
  },
]

const stats = [
  { value: '8', label: 'NER States', sub: 'Full regional coverage' },
  { value: '15', label: 'Active Zones', sub: 'Real-time ML scoring' },
  { value: '24h', label: 'Forecast Window', sub: 'Risk trajectory model' },
  { value: '5', label: 'Risk Tiers', sub: 'Low → Critical scale' },
]

const sdgs = [
  { num: 3, label: 'Good Health & Well-being', icon: Heart },
  { num: 9, label: 'Industry, Innovation & Infrastructure', icon: Building2 },
  { num: 11, label: 'Sustainable Cities & Communities', icon: Home },
  { num: 13, label: 'Climate Action', icon: Leaf },
]

function RainParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-5 w-px bg-gradient-to-b from-transparent via-blue-400/25 to-transparent"
          style={{ left: `${(i * 2) % 100}%`, top: -20 }}
          animate={{ y: ['0vh', '110vh'], opacity: [0, 0.5, 0] }}
          transition={{ duration: 2.5 + (i % 4), repeat: Infinity, delay: i * 0.08 }}
        />
      ))}
    </div>
  )
}

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-ridge-border/60 bg-ridge-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/home" className="flex items-center gap-2.5">
          <Mountain className="h-7 w-7 text-risk-low" />
          <div>
            <div className="text-lg font-bold tracking-tight text-white">RIDGE</div>
            <div className="text-[10px] text-slate-500">Geohazard Intelligence</div>
          </div>
        </Link>
        <div className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#platform" className="transition hover:text-white">Platform</a>
          <a href="#how-it-works" className="transition hover:text-white">How It Works</a>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-risk-low px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Link>
      </div>
    </nav>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen topo-bg text-slate-200">
      <NavBar />

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-16 text-center">
        <RainParticles />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-risk-low/5 via-transparent to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-5xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-risk-low/30 bg-risk-low/10 px-4 py-1.5 text-sm text-risk-low">
            Smart India Hackathon 2026 · PS SIH26001
          </div>

          <h1 className="mb-4 bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent md:text-8xl">
            RIDGE
          </h1>
          <p className="mb-2 text-xl font-medium text-slate-300 md:text-2xl">
            Risk Intelligence for Dynamic Geohazard Evaluation
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-400">
            AI-powered landslide early warning for India's North Eastern Region — 3D terrain monitoring,
            live risk simulation, and multi-channel alerts protecting communities before the ground moves.
          </p>

          <div className="mb-12 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-risk-low px-8 py-3.5 font-semibold text-black shadow-lg shadow-risk-low/20 transition hover:bg-green-400"
            >
              Launch Platform <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-8 py-3.5 font-semibold text-white transition hover:border-risk-low hover:text-risk-low"
            >
              Explore Features
            </a>
          </div>

          {/* Live stats strip */}
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="glass-panel rounded-xl px-4 py-3">
                <div className="text-2xl font-bold tabular-nums text-risk-low md:text-3xl">{s.value}</div>
                <div className="text-xs font-medium text-white">{s.label}</div>
                <div className="text-[10px] text-slate-500">{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Risk gradient bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 mt-16 w-full max-w-md px-6"
        >
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Risk Intensity Scale</div>
          <div
            className="mt-2 h-2 rounded-full"
            style={{ background: `linear-gradient(to right, ${HEAT_GRADIENT_STOPS.join(', ')})` }}
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
            <span>Very High</span>
            <span>Critical</span>
          </div>
        </motion.div>
      </section>

      {/* Challenge */}
      <section className="border-t border-ridge-border px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">The Challenge</h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400">
              India's North Eastern Region faces extreme landslide risk — steep Himalayan terrain, intense monsoon rainfall,
              and active seismic zones threaten roads, settlements, and critical infrastructure every monsoon season.
              RIDGE brings predictive intelligence to disaster management <em className="text-slate-300">before</em> events occur.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { icon: MapPin, title: 'Remote Terrain', desc: '8 states, thousands of km of hillside roads and scattered settlements' },
              { icon: CloudRain, title: 'Extreme Rainfall', desc: 'World-record precipitation zones like Sohra & Mawsynram drive saturation risk' },
              { icon: Activity, title: 'Seismic Activity', desc: 'Active fault lines compound slope instability across the Himalayan fringe' },
            ].map((item) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                className="glass-panel rounded-2xl p-6"
              >
                <item.icon className="mb-3 h-8 w-8 text-risk-low" />
                <h3 className="mb-1 font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-ridge-border px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-14 text-center">
            <div className="mb-2 text-sm font-medium uppercase tracking-widest text-risk-low">Platform Capabilities</div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Everything RIDGE Does</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-400">
              From 3D terrain visualization to citizen-facing alerts — a complete landslide early warning stack built for NER.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`glass-panel group rounded-2xl border p-5 transition hover:scale-[1.02] ${f.accent}`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <f.icon className={`h-7 w-7 ${f.iconColor}`} />
                  <span className="rounded-full border border-ridge-border bg-slate-900/60 px-2 py-0.5 text-[10px] text-slate-400">
                    {f.tag}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="mb-3 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                <ul className="space-y-1">
                  {f.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-1 w-1 rounded-full bg-risk-low" />
                      {h}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Additional modules row */}
          <motion.div
            {...fadeUp}
            className="mt-8 grid gap-4 sm:grid-cols-3"
          >
            {[
              { icon: Newspaper, title: 'News & Advisories', desc: 'Curated geohazard news feed with severity tags and source attribution' },
              { icon: Settings, title: 'Admin Console', desc: 'Sensor network status, zone management table, and system health monitoring' },
              { icon: Globe, title: 'Role-Based Access', desc: 'Separate admin and citizen portals with mock authentication for demo flows' },
            ].map((m) => (
              <div key={m.title} className="flex items-start gap-4 rounded-xl border border-ridge-border bg-slate-900/40 p-5">
                <m.icon className="mt-0.5 h-6 w-6 shrink-0 text-slate-400" />
                <div>
                  <h3 className="font-medium text-white">{m.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{m.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Platform portals */}
      <section id="platform" className="border-t border-ridge-border px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Two Portals, One Mission</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Authorities and citizens each get a tailored experience — connected by the same live risk intelligence.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {portals.map((p) => (
              <motion.div
                key={p.role}
                {...fadeUp}
                className={`glass-panel overflow-hidden rounded-2xl border ${p.border}`}
              >
                <div className={`bg-gradient-to-br ${p.accent} p-6`}>
                  <p.icon className="mb-3 h-8 w-8 text-white" />
                  <h3 className="text-xl font-bold text-white">{p.role}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{p.desc}</p>
                </div>
                <div className="p-6">
                  <ul className="mb-6 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="text-risk-low">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-risk-low hover:underline"
                  >
                    {p.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-ridge-border px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">How RIDGE Works</h2>
            <p className="mt-3 text-slate-400">From sensor data to life-saving alerts in four automated steps</p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-4">
            {pipeline.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel relative rounded-2xl p-6"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-risk-low/20 text-sm font-bold text-risk-low">
                  {i + 1}
                </div>
                <step.icon className="mb-3 h-8 w-8 text-risk-low" />
                <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{step.desc}</p>
                {i < pipeline.length - 1 && (
                  <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-risk-low/30 md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk scale visual */}
      <section className="border-t border-ridge-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp} className="glass-panel rounded-2xl p-8 text-center">
            <h2 className="mb-6 text-2xl font-bold text-white">5-Tier Risk Classification</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {(['Low', 'Moderate', 'High', 'Very High', 'Critical'] as const).map((level) => (
                <div
                  key={level}
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                  style={{
                    borderColor: `${RISK_COLORS[level]}66`,
                    backgroundColor: `${RISK_COLORS[level]}18`,
                    color: RISK_COLORS[level],
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: RISK_COLORS[level] }}
                  />
                  {level}
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-lg text-sm text-slate-400">
              Every zone is scored 1–5 by ML models and mapped to a color-coded tier — visible on the 3D terrain,
              in alerts, and across all analytics views.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SDGs */}
      <section className="border-t border-ridge-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Aligned with UN Sustainable Development Goals</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sdgs.map((sdg) => (
              <div
                key={sdg.num}
                className="flex items-center gap-4 rounded-xl border border-ridge-border bg-slate-900/50 px-5 py-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-risk-low/10">
                  <sdg.icon className="h-6 w-6 text-risk-low" />
                </div>
                <div>
                  <div className="text-xs font-medium text-risk-low">SDG {sdg.num}</div>
                  <div className="text-sm font-medium text-white">{sdg.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-ridge-border px-6 py-20">
        <motion.div
          {...fadeUp}
          className="mx-auto max-w-3xl rounded-2xl border border-risk-low/30 bg-gradient-to-br from-risk-low/10 via-slate-900/50 to-transparent p-10 text-center"
        >
          <Mountain className="mx-auto mb-4 h-12 w-12 text-risk-low" />
          <h2 className="mb-3 text-3xl font-bold text-white">Ready to explore RIDGE?</h2>
          <p className="mb-8 text-slate-400">
            Sign in to the admin console or citizen portal. Demo credentials are provided on the login page.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-risk-low px-8 py-3.5 font-semibold text-black transition hover:bg-green-400"
            >
              Sign In to Platform <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-6 font-mono text-xs text-slate-500">
            Demo — Admin: admin / admin · Citizen: user / user
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ridge-border px-6 py-12 text-center text-sm text-slate-500">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Mountain className="h-5 w-5 text-risk-low" />
          <span className="text-lg font-semibold text-white">Team Los Gatos</span>
        </div>
        <div>PS ID: SIH26001 · Smart India Hackathon 2026</div>
        <div className="mt-1">In partnership with Ministry of Development of North Eastern Region (MDoNER)</div>
      </footer>
    </div>
  )
}
