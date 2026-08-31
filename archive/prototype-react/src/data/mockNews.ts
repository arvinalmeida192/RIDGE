export type NewsTag = 'News' | 'Government Advisory' | 'Weather Bulletin'

export interface NewsItem {
  id: string
  headline: string
  summary: string
  source: string
  timestamp: string
  state?: string
  zone?: string
  tag: NewsTag
}

const rawNews: NewsItem[] = [
  {
    id: 'n01',
    headline: 'Heavy Rain Triggers Landslide Fears in East Khasi Hills',
    summary: 'Local authorities report road blockages near Sohra as continuous rainfall exceeds 140mm in 24 hours. NH-206 remains partially closed pending GSI assessment.',
    source: 'NE Herald',
    timestamp: '2026-08-31T15:10:00',
    state: 'Meghalaya',
    zone: 'Sohra',
    tag: 'News',
  },
  {
    id: 'n02',
    headline: 'MDoNER Issues Monsoon Preparedness Advisory for NER States',
    summary: 'The Ministry urges district administrations across all eight NER states to activate disaster response protocols and coordinate with RIDGE monitoring centres.',
    source: 'MDoNER Press Release',
    timestamp: '2026-08-31T14:45:00',
    tag: 'Government Advisory',
  },
  {
    id: 'n03',
    headline: 'IMD Forecasts Intense Rainfall Band Over Meghalaya–Assam Corridor',
    summary: 'A well-marked low-pressure system is expected to bring 100–180mm rainfall over the next 48 hours, significantly elevating landslide susceptibility in hilly terrain.',
    source: 'Weather Bulletin',
    timestamp: '2026-08-31T14:20:00',
    state: 'Meghalaya',
    tag: 'Weather Bulletin',
  },
  {
    id: 'n04',
    headline: 'Shillong Times: Villages on High Alert After Soil Saturation Warning',
    summary: 'Residents in Cherrapunji and surrounding areas have been advised to avoid steep slopes. Community shelters are being prepared as a precautionary measure.',
    source: 'Shillong Times Desk',
    timestamp: '2026-08-31T13:55:00',
    state: 'Meghalaya',
    zone: 'Cherrapunji East',
    tag: 'News',
  },
  {
    id: 'n05',
    headline: 'GSI Bulletin: Elevated Landslide Risk in Tawang–Bomdila Sector',
    summary: 'Geological Survey of India identifies active slope instability along NH-13 due to combined seismic activity and antecedent rainfall exceeding 250mm over five days.',
    source: 'GSI Bulletin',
    timestamp: '2026-08-31T13:30:00',
    state: 'Arunachal Pradesh',
    zone: 'Tawang Pass',
    tag: 'Government Advisory',
  },
  {
    id: 'n06',
    headline: 'Sikkim SDMA Coordinates Pre-Monsoon Evacuation Drill in Gangtok',
    summary: 'State disaster management conducted a full-scale evacuation exercise involving 1,200 residents, testing multi-channel alert dissemination via RIDGE integration.',
    source: 'NE Herald',
    timestamp: '2026-08-31T12:40:00',
    state: 'Sikkim',
    zone: 'Gangtok Ridge',
    tag: 'News',
  },
  {
    id: 'n07',
    headline: 'Red Warning: Flash Flood and Landslide Risk for Mizoram Hill Districts',
    summary: 'IMD issues red-category warning for Aizawl and Lunglei districts. Landslide probability index expected to peak between 18:00–06:00 IST.',
    source: 'Weather Bulletin',
    timestamp: '2026-08-31T12:15:00',
    state: 'Mizoram',
    tag: 'Weather Bulletin',
  },
  {
    id: 'n08',
    headline: 'Railway Board Suspends Night Services on Lumding–Badarpur Section',
    summary: 'Northeast Frontier Railway halts overnight operations citing RIDGE high-risk alerts for multiple slope sections along the Lumding–Silchar corridor.',
    source: 'NE Herald',
    timestamp: '2026-08-31T11:50:00',
    state: 'Assam',
    tag: 'News',
  },
  {
    id: 'n09',
    headline: 'Nagaland Government Deploys Rapid Response Teams to Kohima Slopes',
    summary: 'State emergency operations centre activates Level-2 response after ground movement sensors report accelerated displacement rates in three monitored zones.',
    source: 'MDoNER Press Release',
    timestamp: '2026-08-31T11:20:00',
    state: 'Nagaland',
    zone: 'Kohima Slopes',
    tag: 'Government Advisory',
  },
  {
    id: 'n10',
    headline: 'Tripura Records Below-Average Landslide Activity This Season',
    summary: 'Agartala meteorological station reports moderate rainfall patterns, with RIDGE risk scores remaining in the low-to-moderate range across monitored upland zones.',
    source: 'Shillong Times Desk',
    timestamp: '2026-08-31T10:45:00',
    state: 'Tripura',
    tag: 'News',
  },
  {
    id: 'n11',
    headline: 'Manipur SDMA Issues Community Safety Guidelines for Hill Settlements',
    summary: 'Official bulletin outlines early warning signs, evacuation routes, and emergency contact numbers for residents in Imphal Valley fringe communities.',
    source: 'MDoNER Press Release',
    timestamp: '2026-08-31T10:10:00',
    state: 'Manipur',
    tag: 'Government Advisory',
  },
  {
    id: 'n12',
    headline: 'Extended Monsoon Outlook: Above-Normal Rainfall Expected Through September',
    summary: 'IMD seasonal forecast indicates continued elevated landslide risk across NER through September, with peak activity anticipated in the third week.',
    source: 'Weather Bulletin',
    timestamp: '2026-08-31T09:30:00',
    tag: 'Weather Bulletin',
  },
]

export const newsItems = [...rawNews].sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
)

export const newsTags: NewsTag[] = ['News', 'Government Advisory', 'Weather Bulletin']

export const tagStyles: Record<NewsTag, { badge: string; border: string }> = {
  News: {
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    border: 'border-l-blue-500',
  },
  'Government Advisory': {
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    border: 'border-l-purple-500',
  },
  'Weather Bulletin': {
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    border: 'border-l-cyan-500',
  },
}
