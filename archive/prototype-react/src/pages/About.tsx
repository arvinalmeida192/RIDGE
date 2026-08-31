import { motion } from 'framer-motion'
import {
  Mountain, CloudRain, Droplets, Activity, AlertTriangle,
  Shield, Eye, MapPin, Waves, Layers, BookOpen, Leaf,
} from 'lucide-react'

const landslideTypes = [
  {
    title: 'Rockfall',
    desc: 'Free-falling rocks from steep cliffs or cut slopes. Common along highway corridors and escarpments like the Shillong Plateau.',
    icon: Mountain,
  },
  {
    title: 'Debris Flow',
    desc: 'Fast-moving mixture of soil, rock, and water rushing down channels. Triggered by intense rainfall on saturated slopes.',
    icon: Waves,
  },
  {
    title: 'Mudslide',
    desc: 'Slow to moderate movement of water-saturated earth. Often follows prolonged monsoon rainfall when soil loses cohesion.',
    icon: Layers,
  },
  {
    title: 'Slump / Rotational Slide',
    desc: 'Curved failure along a slip surface, common on hillsides with clay-rich soils. Can move entire sections of terrain.',
    icon: Activity,
  },
]

const triggers = [
  {
    icon: CloudRain,
    label: 'Heavy Rainfall',
    detail: 'Prolonged or intense rain saturates soil, increases pore-water pressure, and reduces slope stability. The NER receives 2,000–12,000 mm annually in some areas.',
    color: 'text-blue-400',
  },
  {
    icon: Droplets,
    label: 'Soil Saturation',
    detail: 'When soil moisture exceeds 80–90%, the effective stress holding slopes together drops sharply, making failure imminent.',
    color: 'text-cyan-400',
  },
  {
    icon: Mountain,
    label: 'Steep Terrain',
    detail: 'Slopes above 25–30° are inherently unstable. The Eastern Himalayas and Meghalaya plateau escarpment have slopes exceeding 40°.',
    color: 'text-risk-moderate',
  },
  {
    icon: Activity,
    label: 'Seismic Activity',
    detail: 'Earthquakes shake loose material and create new tension cracks. The NER sits in Seismic Zone V — the highest hazard category in India.',
    color: 'text-risk-high',
  },
  {
    icon: Leaf,
    label: 'Deforestation & Land Use',
    detail: 'Removal of vegetation, road cutting, and construction on slopes remove root reinforcement and alter natural drainage patterns.',
    color: 'text-risk-low',
  },
]

const warningSigns = [
  'New or widening cracks in the ground, walls, or pavement',
  'Doors or windows that suddenly stick or jam',
  'Bulging ground at the base of slopes',
  'Fences, trees, or utility poles tilting downhill',
  'Unusual sounds — rumbling, cracking, or boulders knocking together',
  'Springs or seeps appearing in new locations',
  'Muddy or debris-laden water in streams',
]

const beforeDuringAfter = [
  {
    phase: 'Before',
    icon: Shield,
    color: 'border-risk-low/40 bg-risk-low/5 text-risk-low',
    tips: [
      'Know your local risk zone and evacuation routes',
      'Prepare an emergency kit with documents, medicines, and supplies',
      'Monitor RIDGE alerts and IMD weather bulletins during monsoon',
      'Avoid building or camping on steep slopes, near cliff edges, or at the base of hills',
      'Report ground cracks or unusual slope movement to local authorities',
    ],
  },
  {
    phase: 'During',
    icon: AlertTriangle,
    color: 'border-risk-high/40 bg-risk-high/5 text-risk-high',
    tips: [
      'Move to higher ground immediately if you hear rumbling or see debris flow',
      'Stay away from steep slopes, riverbanks, and embankments',
      'Do not cross flooded streams or landslide debris fields',
      'If indoors, take shelter on the highest floor away from downhill walls',
      'Follow evacuation orders from SDMA and local disaster management',
    ],
  },
  {
    phase: 'After',
    icon: Eye,
    color: 'border-blue-500/40 bg-blue-500/5 text-blue-400',
    tips: [
      'Stay away from the slide area — secondary slides are common',
      'Watch for flooding as debris dams can break suddenly',
      'Report missing persons and blocked roads to emergency services',
      'Do not return home until authorities declare the area safe',
      'Document damage for insurance and relief claims',
    ],
  },
]

const nerFacts = [
  { stat: '8', label: 'States in the NER', sub: 'Assam, Meghalaya, Mizoram, Manipur, Nagaland, Tripura, Arunachal Pradesh, Sikkim' },
  { stat: '45%', label: 'Area classified as landslide-prone', sub: 'Among the highest concentrations in India' },
  { stat: 'Zone V', label: 'Seismic hazard', sub: 'Highest earthquake risk category' },
  { stat: '12,000 mm', label: 'Peak annual rainfall', sub: 'Mawsynram & Cherrapunji — wettest places on Earth' },
]

export default function About() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Understanding Landslides</h1>
        <p className="text-sm text-slate-400">
          Educational guide to landslide science, risk factors, and safety — focused on India's North Eastern Region
        </p>
      </div>

      {/* What is a landslide */}
      <div className="glass-panel rounded-xl p-8">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-risk-low" />
          <h2 className="text-xl font-semibold text-white">What Is a Landslide?</h2>
        </div>
        <p className="text-slate-300 leading-relaxed">
          A landslide is the downslope movement of rock, soil, and debris under the influence of gravity.
          Landslides range from slow soil creep (millimetres per year) to catastrophic debris flows
          travelling at over 100 km/h. They are among the most frequent and destructive natural hazards
          in mountainous terrain worldwide.
        </p>
        <p className="mt-4 text-slate-400 leading-relaxed">
          In India, landslides cause hundreds of deaths annually and disrupt transport, power, and
          communication networks across the Himalayas and the North Eastern Region. Most events occur
          during the monsoon (June–September) when intense rainfall combines with steep topography
          and fragile geology.
        </p>
      </div>

      {/* NER vulnerability */}
      <div className="glass-panel rounded-xl p-8">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-risk-high" />
          <h2 className="text-xl font-semibold text-white">Why the North Eastern Region Is Vulnerable</h2>
        </div>
        <p className="mb-6 text-slate-400 leading-relaxed">
          The NER sits at the collision zone of the Indian and Eurasian tectonic plates, creating
          young, fractured mountains with extreme relief. Combined with some of the highest rainfall
          on the planet, weak sedimentary rock layers, and increasing human activity on slopes,
          the region faces a uniquely severe landslide risk profile.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {nerFacts.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-ridge-border bg-slate-900/40 p-4 text-center">
              <div className="font-mono text-3xl font-black text-risk-low">{fact.stat}</div>
              <div className="mt-1 text-sm font-medium text-white">{fact.label}</div>
              <div className="mt-1 text-[11px] text-slate-500">{fact.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Types of landslides */}
      <div className="glass-panel rounded-xl p-8">
        <h2 className="mb-6 text-xl font-semibold text-white">Types of Landslides</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {landslideTypes.map((type) => (
            <div key={type.title} className="flex gap-4 rounded-xl border border-ridge-border bg-slate-900/40 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-risk-low/10">
                <type.icon className="h-5 w-5 text-risk-low" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{type.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{type.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Triggers */}
      <div className="glass-panel rounded-xl p-8">
        <h2 className="mb-6 text-xl font-semibold text-white">Key Triggering Factors</h2>
        <div className="space-y-4">
          {triggers.map((t) => (
            <div key={t.label} className="flex gap-4 rounded-xl border border-ridge-border bg-slate-900/40 p-5">
              <t.icon className={`h-6 w-6 shrink-0 ${t.color}`} />
              <div>
                <h3 className="font-semibold text-white">{t.label}</h3>
                <p className="mt-1 text-sm text-slate-400">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning signs */}
      <div className="glass-panel rounded-xl border-l-4 border-l-risk-moderate p-8">
        <div className="mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-risk-moderate" />
          <h2 className="text-xl font-semibold text-white">Warning Signs to Watch For</h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Recognising early indicators can provide critical minutes to evacuate before a slope fails.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {warningSigns.map((sign) => (
            <li key={sign} className="flex gap-2 text-sm text-slate-300">
              <span className="mt-0.5 text-risk-moderate">▸</span>
              {sign}
            </li>
          ))}
        </ul>
      </div>

      {/* Before / During / After */}
      <div className="glass-panel rounded-xl p-8">
        <h2 className="mb-6 text-xl font-semibold text-white">What To Do: Before, During & After</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {beforeDuringAfter.map((section) => (
            <div key={section.phase} className={`rounded-xl border p-5 ${section.color}`}>
              <div className="mb-3 flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                <h3 className="font-semibold">{section.phase}</h3>
              </div>
              <ul className="space-y-2">
                {section.tips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm text-slate-300">
                    <span className="shrink-0 opacity-60">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Risk classification */}
      <div className="glass-panel rounded-xl p-8">
        <h2 className="mb-4 text-xl font-semibold text-white">RIDGE 5-Tier Risk Classification</h2>
        <p className="mb-6 text-sm text-slate-400">
          RIDGE uses a five-level risk scale to communicate landslide hazard to authorities and citizens.
          Understanding these tiers helps you respond appropriately.
        </p>
        <div className="space-y-3">
          {[
            { level: 'Low', score: '1.0 – 1.9', action: 'Routine monitoring. No special precautions needed.', color: '#4ADE80' },
            { level: 'Moderate', score: '2.0 – 2.9', action: 'Increased awareness. Avoid unnecessary travel on hillside roads.', color: '#FDE047' },
            { level: 'High', score: '3.0 – 3.9', action: 'Prepare evacuation kit. Limit time on slopes. Follow local advisories.', color: '#FB923C' },
            { level: 'Very High', score: '4.0 – 4.4', action: 'Prepare to evacuate. Avoid all hillside travel. Monitor alerts continuously.', color: '#FF3B3B' },
            { level: 'Critical', score: '4.5 – 5.0', action: 'Evacuate immediately. Imminent failure likely. Follow emergency orders.', color: '#FF1155' },
          ].map((tier) => (
            <div
              key={tier.level}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-ridge-border bg-slate-900/40 px-5 py-3"
            >
              <span
                className="w-24 shrink-0 rounded-full border px-3 py-1 text-center text-xs font-bold"
                style={{ color: tier.color, borderColor: `${tier.color}66`, backgroundColor: `${tier.color}18` }}
              >
                {tier.level}
              </span>
              <span className="font-mono text-xs text-slate-500 w-20">{tier.score}</span>
              <span className="text-sm text-slate-300">{tier.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How RIDGE helps */}
      <div className="glass-panel rounded-xl border border-risk-low/20 bg-risk-low/5 p-8">
        <h2 className="mb-3 text-xl font-semibold text-white">How RIDGE Helps</h2>
        <p className="text-slate-400 leading-relaxed">
          RIDGE (Risk Intelligence for Dynamic Geohazard Evaluation) combines rainfall data, soil moisture
          sensors, terrain analysis, seismic monitoring, and machine learning to produce real-time landslide
          risk scores for 15+ zones across the NER. Citizens receive tiered alerts and safety guidance;
          authorities access dashboards, scenario simulation, and zone-level impact assessments to coordinate
          disaster response before slopes fail.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Smart India Hackathon 2026 · PS ID SIH26001 · Team Los Gatos
        </p>
      </div>
    </motion.div>
  )
}
