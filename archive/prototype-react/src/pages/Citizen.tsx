import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Phone, Tent, Globe, ArrowLeft, Shield, LogOut,
  AlertTriangle, Droplets, Activity, Users, CloudRain, Newspaper,
} from 'lucide-react'
import {
  citizenEvacuation, emergencyContacts, alerts, getZoneById,
  getZoneExposure, getSeverityTier, getExposureSummary,
} from '../data/mockData'
import { newsItems } from '../data/mockNews'
import { useAuth } from '../context/AuthContext'
import RiskBadge from '../components/RiskBadge'
import NewsCard from '../components/NewsCard'
import EarthGlobeMap from '../components/globe/EarthGlobeMap'
import { RISK_COLORS } from '../utils/riskColors'

const CITIZEN_ZONE_ID = 'z01'

const guidanceEn = [
  'Stay away from steep slopes and riverbanks.',
  'Do not travel on NH-206 until further notice.',
  'Move to higher ground if you hear unusual rumbling sounds.',
  'Keep emergency supplies and documents ready.',
  'Follow instructions from local authorities and RIDGE alerts.',
]

const guidanceAs = [
  'খাৰ পাহাৰ আৰু নদীৰ তীৰৰ পৰা দূৰত থাকক।',
  'অধিক জাননী নোহোৱালৈকে NH-206 ত যাত্ৰা নকৰিব।',
  'অস্বাভাৱিক গুৰুত্বৰ শব্দ শুনিলে ওখ ঠাইলৈ যাওক।',
  'জৰুৰীকালীন সামগ্ৰী আৰু নথি-পত্ৰ সাজু ৰাখক।',
  'স্থানীয় কৰ্তৃপক্ষ আৰু RIDGE সতৰ্কবাণী মানি চলক।',
]

const tierColors = {
  Advisory: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  Watch: 'border-risk-moderate/40 bg-risk-moderate/10 text-risk-moderate',
  Warning: 'border-risk-critical/40 bg-risk-critical/10 text-risk-critical',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function Citizen() {
  const [lang, setLang] = useState<'en' | 'as'>('en')
  const guidance = lang === 'en' ? guidanceEn : guidanceAs
  const navigate = useNavigate()
  const { logout } = useAuth()

  const zone = getZoneById(CITIZEN_ZONE_ID)!
  const exposure = getZoneExposure(CITIZEN_ZONE_ID)
  const severityTier = exposure ? getSeverityTier(zone.riskLevel, exposure) : null

  const areaAlerts = alerts
    .filter((a) => a.state === zone.state || a.zoneId === CITIZEN_ZONE_ID)
    .slice(0, 4)

  const areaNews = newsItems
    .filter((n) => !n.state || n.state === zone.state || n.zone === zone.name)
    .slice(0, 3)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ridge-bg">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ridge-border px-3 py-1.5 text-sm text-slate-400 transition hover:border-risk-high/40 hover:text-risk-high"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Language toggle */}
          <div className="flex justify-end">
            <div className="flex overflow-hidden rounded-lg border border-ridge-border text-sm">
              <button
                onClick={() => setLang('en')}
                className={`flex items-center gap-1.5 px-4 py-2 ${lang === 'en' ? 'bg-risk-low/20 text-risk-low' : 'text-slate-400'}`}
              >
                <Globe className="h-4 w-4" /> English
              </button>
              <button
                onClick={() => setLang('as')}
                className={`flex items-center gap-1.5 px-4 py-2 ${lang === 'as' ? 'bg-risk-low/20 text-risk-low' : 'text-slate-400'}`}
              >
                <Globe className="h-4 w-4" /> অসমীয়া
              </button>
            </div>
          </div>

          {/* Risk status banner */}
          <div
            className="rounded-2xl border-2 p-6 text-center"
            style={{
              borderColor: `${RISK_COLORS[zone.riskLevel]}66`,
              backgroundColor: `${RISK_COLORS[zone.riskLevel]}12`,
            }}
          >
            <Shield className="mx-auto mb-3 h-10 w-10" style={{ color: RISK_COLORS[zone.riskLevel] }} />
            <p className="text-sm text-slate-400">
              {lang === 'en' ? 'Your area' : 'আপোনাৰ অঞ্চল'}
            </p>
            <h1 className="text-2xl font-bold text-white lg:text-3xl">
              {zone.name} — {zone.riskLevel} {lang === 'en' ? 'Risk' : 'বিপদাশংকা'}
            </h1>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <RiskBadge level={zone.riskLevel} size="lg" />
              {severityTier && (
                <span className="rounded-full border border-risk-high/40 bg-risk-high/10 px-3 py-1 text-xs font-medium text-risk-high">
                  {severityTier} impact tier
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {lang === 'en' ? 'Last updated' : 'শেষ আপডেট'}: {zone.lastUpdated}
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              {/* 3D Earth map */}
              <div className="rounded-2xl border border-ridge-border bg-slate-900/50 p-4">
                <h2 className="mb-1 flex items-center gap-2 font-semibold text-white">
                  <Globe className="h-5 w-5 text-risk-low" />
                  {lang === 'en' ? 'Regional Risk Map' : 'আঞ্চলিক বিপদাশংকা মানচিত্ৰ'}
                </h2>
                <p className="mb-3 text-xs text-slate-500">
                  {lang === 'en'
                    ? 'Rotate and zoom to explore risk zones across the NER'
                    : 'NER ত বিপদাশংকা অঞ্চল অন্বেষণ কৰিবলৈ ঘূৰাওক আৰু জুম কৰক'}
                </p>
                <EarthGlobeMap height="420px" showRegionLabel={false} />
              </div>

              {/* Area risk insights */}
              <div className="rounded-2xl border border-ridge-border bg-slate-900/50 p-5">
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
                  <Activity className="h-5 w-5 text-risk-low" />
                  {lang === 'en' ? 'Area Risk Insights' : 'অঞ্চলৰ বিপদাশংকা তথ্য'}
                </h2>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-3 text-center">
                    <Droplets className="mx-auto mb-1 h-4 w-4 text-blue-400" />
                    <div className="font-mono text-lg font-bold text-white">{zone.rainfall24h}</div>
                    <div className="text-[10px] text-slate-500">mm / 24h</div>
                  </div>
                  <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-3 text-center">
                    <CloudRain className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                    <div className="font-mono text-lg font-bold text-white">{zone.soilSaturation}%</div>
                    <div className="text-[10px] text-slate-500">{lang === 'en' ? 'Soil saturation' : 'মাটিৰ সম্পৃক্ততা'}</div>
                  </div>
                  <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-3 text-center">
                    <Activity className="mx-auto mb-1 h-4 w-4 text-risk-moderate" />
                    <div className="font-mono text-lg font-bold text-white">{zone.groundMovement}</div>
                    <div className="text-[10px] text-slate-500">mm movement</div>
                  </div>
                  <div className="rounded-lg border border-ridge-border bg-slate-900/40 p-3 text-center">
                    <Users className="mx-auto mb-1 h-4 w-4 text-risk-high" />
                    <div className="font-mono text-lg font-bold text-white">
                      {exposure?.estimatedPopulationInRadius.toLocaleString('en-IN') ?? '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">{lang === 'en' ? 'Pop. in radius' : 'জনসংখ্যা'}</div>
                  </div>
                </div>
                {exposure && (
                  <p className="mt-3 text-xs text-slate-400">
                    {getExposureSummary(CITIZEN_ZONE_ID)}
                  </p>
                )}
              </div>

              {/* News & advisories */}
              {areaNews.length > 0 && (
                <div className="rounded-2xl border border-ridge-border bg-slate-900/50 p-5">
                  <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <Newspaper className="h-5 w-5 text-risk-low" />
                    {lang === 'en' ? 'News & Advisories' : 'বাতৰি আৰু পৰামৰ্শ'}
                  </h2>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {areaNews.map((item) => (
                      <NewsCard key={item.id} item={item} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Active alerts */}
              {areaAlerts.length > 0 && (
                <div className="rounded-2xl border border-ridge-border bg-slate-900/50 p-5">
                  <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <AlertTriangle className="h-5 w-5 text-risk-high" />
                    {lang === 'en' ? 'Active Alerts for Your Area' : 'আপোনাৰ অঞ্চলৰ সক্ৰিয় সতৰ্কবাণী'}
                  </h2>
                  <div className="space-y-3">
                    {areaAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded-xl border border-ridge-border bg-slate-900/60 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${tierColors[alert.tier]}`}>
                              {alert.tier}
                            </span>
                            <h3 className="mt-1 font-medium text-white">{alert.zoneName}</h3>
                          </div>
                          <RiskBadge level={alert.riskLevel} size="sm" />
                        </div>
                        <p className="mt-2 text-sm text-slate-400">{alert.guidance}</p>
                        <p className="mt-2 text-[10px] text-slate-500">{formatTime(alert.issuedAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety guidance */}
              <div className="rounded-2xl border border-ridge-border bg-slate-900/50 p-5">
                <h2 className="mb-3 font-semibold text-white">
                  {lang === 'en' ? 'Safety Guidance' : 'সুৰক্ষা নিৰ্দেশনা'}
                </h2>
                <ul className="space-y-2">
                  {guidance.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-risk-low">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Evacuation centre */}
              <div className="rounded-2xl border border-ridge-border bg-slate-900/50 p-5">
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
                  <Tent className="h-5 w-5 text-risk-low" />
                  {lang === 'en' ? 'Nearest Evacuation Centre' : 'নিকটতম উচ্চীকৰণ কেন্দ্ৰ'}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-medium text-white">
                    <MapPin className="h-4 w-4 text-slate-400" /> {citizenEvacuation.name}
                  </div>
                  <p className="text-slate-400">
                    {citizenEvacuation.distance} away · Capacity: {citizenEvacuation.capacity} · Status:{' '}
                    <span className="text-risk-low">{citizenEvacuation.status}</span>
                  </p>
                </div>
              </div>

              {/* Emergency contacts */}
              <div className="rounded-2xl border border-ridge-border bg-slate-900/50 p-5">
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
                  <Phone className="h-5 w-5 text-risk-low" />
                  {lang === 'en' ? 'Emergency Contacts' : 'জৰুৰীকালীন যোগাযোগ'}
                </h2>
                <div className="space-y-3">
                  {emergencyContacts.map((c) => (
                    <div key={c.number} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{c.label}</span>
                      <a href={`tel:${c.number}`} className="text-sm font-medium tabular-nums text-risk-low">
                        {c.number}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
