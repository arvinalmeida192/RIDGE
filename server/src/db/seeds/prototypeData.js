/**
 * Prototype seed data — mirrors src/data/mockData.ts and mockNews.ts
 */

export const zones = [
  { id: 'z01', name: 'Sohra', state: 'Meghalaya', lat: 25.3007, lng: 91.6968, riskLevel: 'Critical', riskScore: 4.8, rainfall24h: 142, cumulativeRainfall: 380, soilSaturation: 92, slopeAngle: 38, seismicIndex: 0.42, groundMovement: 4.2, mlConfidence: 91, sensorStatus: 'Online' },
  { id: 'z02', name: 'Mawsynram', state: 'Meghalaya', lat: 25.2983, lng: 91.5827, riskLevel: 'Very High', riskScore: 4.2, rainfall24h: 128, cumulativeRainfall: 340, soilSaturation: 88, slopeAngle: 35, seismicIndex: 0.38, groundMovement: 3.1, mlConfidence: 87, sensorStatus: 'Online' },
  { id: 'z03', name: 'Guwahati Hills', state: 'Assam', lat: 26.1445, lng: 91.7362, riskLevel: 'High', riskScore: 3.4, rainfall24h: 86, cumulativeRainfall: 210, soilSaturation: 74, slopeAngle: 28, seismicIndex: 0.31, groundMovement: 1.8, mlConfidence: 84, sensorStatus: 'Online' },
  { id: 'z04', name: 'Aizawl Ridge', state: 'Mizoram', lat: 23.7271, lng: 92.7176, riskLevel: 'High', riskScore: 3.2, rainfall24h: 72, cumulativeRainfall: 195, soilSaturation: 71, slopeAngle: 32, seismicIndex: 0.45, groundMovement: 2.4, mlConfidence: 82, sensorStatus: 'Degraded' },
  { id: 'z05', name: 'Imphal Valley Fringe', state: 'Manipur', lat: 24.8170, lng: 93.9368, riskLevel: 'Moderate', riskScore: 2.3, rainfall24h: 45, cumulativeRainfall: 120, soilSaturation: 58, slopeAngle: 22, seismicIndex: 0.52, groundMovement: 1.1, mlConfidence: 79, sensorStatus: 'Online' },
  { id: 'z06', name: 'Kohima Slopes', state: 'Nagaland', lat: 25.6751, lng: 94.1086, riskLevel: 'Moderate', riskScore: 2.1, rainfall24h: 38, cumulativeRainfall: 98, soilSaturation: 52, slopeAngle: 26, seismicIndex: 0.28, groundMovement: 0.8, mlConfidence: 76, sensorStatus: 'Online' },
  { id: 'z07', name: 'Agartala Uplands', state: 'Tripura', lat: 23.8315, lng: 91.2868, riskLevel: 'Low', riskScore: 1.2, rainfall24h: 22, cumulativeRainfall: 65, soilSaturation: 41, slopeAngle: 18, seismicIndex: 0.22, groundMovement: 0.3, mlConfidence: 88, sensorStatus: 'Online' },
  { id: 'z08', name: 'Tawang Pass', state: 'Arunachal Pradesh', lat: 27.5860, lng: 91.8660, riskLevel: 'Very High', riskScore: 4.0, rainfall24h: 95, cumulativeRainfall: 260, soilSaturation: 82, slopeAngle: 42, seismicIndex: 0.55, groundMovement: 3.6, mlConfidence: 85, sensorStatus: 'Online' },
  { id: 'z09', name: 'Gangtok Ridge', state: 'Sikkim', lat: 27.3389, lng: 88.6065, riskLevel: 'High', riskScore: 3.6, rainfall24h: 78, cumulativeRainfall: 225, soilSaturation: 76, slopeAngle: 36, seismicIndex: 0.48, groundMovement: 2.1, mlConfidence: 83, sensorStatus: 'Online' },
  { id: 'z10', name: 'Dibrugarh Foothills', state: 'Assam', lat: 27.4728, lng: 94.9120, riskLevel: 'Moderate', riskScore: 2.0, rainfall24h: 52, cumulativeRainfall: 140, soilSaturation: 55, slopeAngle: 20, seismicIndex: 0.25, groundMovement: 0.6, mlConfidence: 81, sensorStatus: 'Online' },
  { id: 'z11', name: 'Cherrapunji East', state: 'Meghalaya', lat: 25.2781, lng: 91.7302, riskLevel: 'Critical', riskScore: 4.9, rainfall24h: 156, cumulativeRainfall: 410, soilSaturation: 94, slopeAngle: 40, seismicIndex: 0.40, groundMovement: 4.8, mlConfidence: 93, sensorStatus: 'Online' },
  { id: 'z12', name: 'Lunglei Sector', state: 'Mizoram', lat: 22.8887, lng: 92.7366, riskLevel: 'Low', riskScore: 1.0, rainfall24h: 18, cumulativeRainfall: 48, soilSaturation: 38, slopeAngle: 15, seismicIndex: 0.18, groundMovement: 0.2, mlConfidence: 90, sensorStatus: 'Online' },
  { id: 'z13', name: 'Itanagar Foothills', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, riskLevel: 'High', riskScore: 3.1, rainfall24h: 68, cumulativeRainfall: 180, soilSaturation: 69, slopeAngle: 30, seismicIndex: 0.50, groundMovement: 1.9, mlConfidence: 80, sensorStatus: 'Degraded' },
  { id: 'z14', name: 'Namchi Hills', state: 'Sikkim', lat: 27.1667, lng: 88.3500, riskLevel: 'Moderate', riskScore: 2.4, rainfall24h: 42, cumulativeRainfall: 110, soilSaturation: 56, slopeAngle: 24, seismicIndex: 0.35, groundMovement: 0.9, mlConfidence: 77, sensorStatus: 'Online' },
  { id: 'z15', name: 'Silchar Corridor', state: 'Assam', lat: 24.8333, lng: 92.7789, riskLevel: 'Low', riskScore: 1.3, rainfall24h: 28, cumulativeRainfall: 72, soilSaturation: 44, slopeAngle: 16, seismicIndex: 0.20, groundMovement: 0.4, mlConfidence: 86, sensorStatus: 'Online' },
]

export const alerts = [
  { id: 'a01', zoneId: 'z01', zoneName: 'Sohra', state: 'Meghalaya', tier: 'Warning', riskLevel: 'Critical', issuedAt: '2026-08-31T14:32:00', affectedRadius: 12, guidance: 'Evacuate low-lying settlements immediately. Avoid all travel on NH-206.' },
  { id: 'a02', zoneId: 'z11', zoneName: 'Cherrapunji East', state: 'Meghalaya', tier: 'Warning', riskLevel: 'Critical', issuedAt: '2026-08-31T14:15:00', affectedRadius: 10, guidance: 'Critical landslide risk. Shelter in place on stable ground above flood line.' },
  { id: 'a03', zoneId: 'z02', zoneName: 'Mawsynram', state: 'Meghalaya', tier: 'Watch', riskLevel: 'Very High', issuedAt: '2026-08-31T13:48:00', affectedRadius: 8, guidance: 'Prepare evacuation kits. Monitor local radio for updates.' },
  { id: 'a04', zoneId: 'z08', zoneName: 'Tawang Pass', state: 'Arunachal Pradesh', tier: 'Watch', riskLevel: 'Very High', issuedAt: '2026-08-31T13:20:00', affectedRadius: 15, guidance: 'Road closures likely. Restrict heavy vehicle movement.' },
  { id: 'a05', zoneId: 'z09', zoneName: 'Gangtok Ridge', state: 'Sikkim', tier: 'Watch', riskLevel: 'High', issuedAt: '2026-08-31T12:55:00', affectedRadius: 6, guidance: 'Increased monitoring active. Avoid steep slopes and construction zones.' },
  { id: 'a06', zoneId: 'z03', zoneName: 'Guwahati Hills', state: 'Assam', tier: 'Advisory', riskLevel: 'High', issuedAt: '2026-08-31T12:30:00', affectedRadius: 5, guidance: 'Exercise caution on hillside roads during heavy rainfall periods.' },
  { id: 'a07', zoneId: 'z04', zoneName: 'Aizawl Ridge', state: 'Mizoram', tier: 'Advisory', riskLevel: 'High', issuedAt: '2026-08-31T11:45:00', affectedRadius: 4, guidance: 'Soil saturation elevated. Report any ground cracks to authorities.' },
  { id: 'a08', zoneId: 'z13', zoneName: 'Itanagar Foothills', state: 'Arunachal Pradesh', tier: 'Advisory', riskLevel: 'High', issuedAt: '2026-08-31T11:10:00', affectedRadius: 7, guidance: 'Sensor network degraded. Rely on community spotters for ground reports.' },
  { id: 'a09', zoneId: 'z05', zoneName: 'Imphal Valley Fringe', state: 'Manipur', tier: 'Advisory', riskLevel: 'Moderate', issuedAt: '2026-08-31T10:30:00', affectedRadius: 3, guidance: 'Moderate risk conditions. Stay informed via RIDGE citizen alerts.' },
  { id: 'a10', zoneId: 'z06', zoneName: 'Kohima Slopes', state: 'Nagaland', tier: 'Advisory', riskLevel: 'Moderate', issuedAt: '2026-08-31T09:50:00', affectedRadius: 3, guidance: 'Rainfall accumulation increasing. Avoid camping on slopes.' },
  { id: 'a11', zoneId: 'z10', zoneName: 'Dibrugarh Foothills', state: 'Assam', tier: 'Advisory', riskLevel: 'Moderate', issuedAt: '2026-08-31T09:15:00', affectedRadius: 4, guidance: 'Standard monsoon precautions advised for hillside communities.' },
  { id: 'a12', zoneId: 'z14', zoneName: 'Namchi Hills', state: 'Sikkim', tier: 'Advisory', riskLevel: 'Moderate', issuedAt: '2026-08-31T08:40:00', affectedRadius: 3, guidance: 'Routine monitoring. No immediate action required.' },
]

export const mockRoads = [
  { id: 'r1', name: 'NH-206 (Sohra–Cherrapunji)', points: [{ lat: 25.298, lng: 91.583 }, { lat: 25.295, lng: 91.640 }, { lat: 25.301, lng: 91.697 }, { lat: 25.278, lng: 91.730 }], zoneId: 'z01' },
  { id: 'r2', name: 'Shillong–Guwahati Hwy', points: [{ lat: 25.579, lng: 91.893 }, { lat: 25.700, lng: 91.820 }, { lat: 25.900, lng: 91.780 }, { lat: 26.144, lng: 91.736 }], zoneId: 'z03' },
  { id: 'r3', name: 'Shillong–Sohra Rd', points: [{ lat: 25.579, lng: 91.893 }, { lat: 25.480, lng: 91.820 }, { lat: 25.380, lng: 91.750 }, { lat: 25.301, lng: 91.697 }], zoneId: 'z01' },
  { id: 'r4', name: 'Mawsynram access', points: [{ lat: 25.350, lng: 91.550 }, { lat: 25.320, lng: 91.565 }, { lat: 25.298, lng: 91.583 }], zoneId: 'z02' },
]

export const mapSettlements = [
  { id: 's1', name: 'Sohra village', lat: 25.295, lng: 91.695, population: 1200, zoneId: 'z01' },
  { id: 's2', name: 'Mawsynram town', lat: 25.298, lng: 91.583, population: 890, zoneId: 'z02' },
  { id: 's3', name: 'Kamakhya foothills', lat: 26.140, lng: 91.736, population: 2400, zoneId: 'z03' },
  { id: 's4', name: 'Durtlang', lat: 23.750, lng: 92.710, population: 680, zoneId: 'z04' },
  { id: 's5', name: 'Jang', lat: 27.570, lng: 91.870, population: 380, zoneId: 'z08' },
  { id: 's6', name: 'Tadong', lat: 27.330, lng: 88.610, population: 1500, zoneId: 'z09' },
  { id: 's7', name: 'Cherrapunji East', lat: 25.278, lng: 91.730, population: 980, zoneId: 'z11' },
  { id: 's8', name: 'Namchi town', lat: 27.167, lng: 88.350, population: 560, zoneId: 'z14' },
]

export const zoneExposure = {
  z01: { roads: [{ name: 'NH-206', lengthKm: 2.3 }, { name: 'Sohra–Cherrapunji Rd', lengthKm: 1.1 }], settlements: [{ name: 'Sohra village', population: 1200 }, { name: 'Mawmluh', population: 340 }], infrastructure: ['110kV transmission line', 'footbridge', 'primary health centre'], agriculturalLandHectares: 45, estimatedPopulationInRadius: 1850, estimatedStructuresAtRisk: 280, roadNetworkLengthAtRiskKm: 4.8 },
  z02: { roads: [{ name: 'Mawsynram–Shillong Rd', lengthKm: 3.1 }], settlements: [{ name: 'Mawsynram town', population: 890 }], infrastructure: ['water treatment plant', 'school complex'], agriculturalLandHectares: 62, estimatedPopulationInRadius: 1100, estimatedStructuresAtRisk: 145, roadNetworkLengthAtRiskKm: 3.5 },
  z03: { roads: [{ name: 'NH-27 hillside stretch', lengthKm: 1.8 }], settlements: [{ name: 'Kamakhya foothills', population: 2400 }], infrastructure: ['railway overpass', 'fuel depot'], agriculturalLandHectares: 28, estimatedPopulationInRadius: 3200, estimatedStructuresAtRisk: 520, roadNetworkLengthAtRiskKm: 2.9 },
  z04: { roads: [{ name: 'Aizawl–Lunglei Hwy', lengthKm: 2.0 }], settlements: [{ name: 'Durtlang', population: 680 }], infrastructure: ['mobile tower', 'community hall'], agriculturalLandHectares: 18, estimatedPopulationInRadius: 920, estimatedStructuresAtRisk: 110, roadNetworkLengthAtRiskKm: 2.4 },
  z05: { roads: [{ name: 'Imphal–Ukhrul Rd', lengthKm: 0.9 }], settlements: [{ name: 'Lamphelpat fringe', population: 450 }], infrastructure: ['irrigation canal'], agriculturalLandHectares: 35, estimatedPopulationInRadius: 580, estimatedStructuresAtRisk: 72, roadNetworkLengthAtRiskKm: 1.2 },
  z06: { roads: [{ name: 'Kohima–Dimapur Rd', lengthKm: 1.2 }], settlements: [{ name: 'Jotsoma', population: 520 }], infrastructure: ['footbridge'], agriculturalLandHectares: 22, estimatedPopulationInRadius: 640, estimatedStructuresAtRisk: 85, roadNetworkLengthAtRiskKm: 1.5 },
  z07: { roads: [{ name: 'Agartala–Udaipur Rd', lengthKm: 0.4 }], settlements: [{ name: 'Abhoynagar', population: 180 }], infrastructure: [], agriculturalLandHectares: 12, estimatedPopulationInRadius: 220, estimatedStructuresAtRisk: 28, roadNetworkLengthAtRiskKm: 0.6 },
  z08: { roads: [{ name: 'Tawang–Bomdila Hwy', lengthKm: 4.5 }, { name: 'Sela Pass approach', lengthKm: 2.1 }], settlements: [{ name: 'Jang', population: 380 }], infrastructure: ['army supply depot', '110kV line', 'monastery access road'], agriculturalLandHectares: 8, estimatedPopulationInRadius: 520, estimatedStructuresAtRisk: 95, roadNetworkLengthAtRiskKm: 8.2 },
  z09: { roads: [{ name: 'NH-10 Gangtok stretch', lengthKm: 2.7 }], settlements: [{ name: 'Tadong', population: 1500 }, { name: 'Ranipool', population: 620 }], infrastructure: ['hydro substation', 'hospital annex'], agriculturalLandHectares: 15, estimatedPopulationInRadius: 2400, estimatedStructuresAtRisk: 310, roadNetworkLengthAtRiskKm: 3.8 },
  z10: { roads: [{ name: 'Dibrugarh–Tinsukia Rd', lengthKm: 0.7 }], settlements: [{ name: 'Chabua fringe', population: 310 }], infrastructure: ['tea estate access road'], agriculturalLandHectares: 55, estimatedPopulationInRadius: 420, estimatedStructuresAtRisk: 48, roadNetworkLengthAtRiskKm: 1.0 },
  z11: { roads: [{ name: 'NH-206', lengthKm: 3.8 }, { name: 'Cherrapunji tourist loop', lengthKm: 1.6 }], settlements: [{ name: 'Cherrapunji East', population: 980 }, { name: 'Nongsawlia', population: 410 }], infrastructure: ['110kV transmission line', 'tourist viewpoint', 'footbridge', 'water supply tank'], agriculturalLandHectares: 38, estimatedPopulationInRadius: 1650, estimatedStructuresAtRisk: 245, roadNetworkLengthAtRiskKm: 6.1 },
  z12: { roads: [{ name: 'Lunglei–Lawngtlai Rd', lengthKm: 0.3 }], settlements: [{ name: 'Bazar Veng', population: 95 }], infrastructure: [], agriculturalLandHectares: 8, estimatedPopulationInRadius: 140, estimatedStructuresAtRisk: 18, roadNetworkLengthAtRiskKm: 0.4 },
  z13: { roads: [{ name: 'Itanagar–Ziro Rd', lengthKm: 1.5 }], settlements: [{ name: 'Naharlagun fringe', population: 780 }], infrastructure: ['state secretariat access', 'mobile tower'], agriculturalLandHectares: 20, estimatedPopulationInRadius: 1050, estimatedStructuresAtRisk: 130, roadNetworkLengthAtRiskKm: 2.0 },
  z14: { roads: [{ name: 'Namchi–Ravangla Rd', lengthKm: 0.8 }], settlements: [{ name: 'Namchi town', population: 560 }], infrastructure: ['Buddha Park access'], agriculturalLandHectares: 14, estimatedPopulationInRadius: 680, estimatedStructuresAtRisk: 78, roadNetworkLengthAtRiskKm: 1.1 },
  z15: { roads: [{ name: 'Silchar–Aizawl corridor', lengthKm: 0.5 }], settlements: [{ name: 'Tarapur', population: 210 }], infrastructure: ['railway siding'], agriculturalLandHectares: 30, estimatedPopulationInRadius: 290, estimatedStructuresAtRisk: 35, roadNetworkLengthAtRiskKm: 0.8 },
}

export const zoneCausativeFactors = {
  z01: [{ factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 38 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 24 }, { factor: 'Soil saturation trend rising', contributionPercent: 18 }, { factor: 'Recent deforestation/land-use change nearby', contributionPercent: 12 }, { factor: 'Proximity to seismic fault line', contributionPercent: 8 }],
  z02: [{ factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 35 }, { factor: 'Soil saturation trend rising', contributionPercent: 22 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 20 }, { factor: 'Ground movement acceleration', contributionPercent: 15 }, { factor: 'Proximity to seismic fault line', contributionPercent: 8 }],
  z03: [{ factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 30 }, { factor: 'Urban encroachment on hillside', contributionPercent: 22 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 20 }, { factor: 'Soil saturation trend rising', contributionPercent: 18 }, { factor: 'Proximity to seismic fault line', contributionPercent: 10 }],
  z04: [{ factor: 'Slope angle exceeds stability threshold', contributionPercent: 28 }, { factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 26 }, { factor: 'Proximity to seismic fault line', contributionPercent: 20 }, { factor: 'Soil saturation trend rising', contributionPercent: 16 }, { factor: 'Sensor network degradation', contributionPercent: 10 }],
  z05: [{ factor: 'Proximity to seismic fault line', contributionPercent: 30 }, { factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 25 }, { factor: 'Soil saturation trend rising', contributionPercent: 20 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 15 }, { factor: 'Ground movement acceleration', contributionPercent: 10 }],
  z06: [{ factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 28 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 24 }, { factor: 'Soil saturation trend rising', contributionPercent: 22 }, { factor: 'Recent deforestation/land-use change nearby', contributionPercent: 14 }, { factor: 'Proximity to seismic fault line', contributionPercent: 12 }],
  z07: [{ factor: 'Soil saturation trend rising', contributionPercent: 25 }, { factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 22 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 20 }, { factor: 'Proximity to seismic fault line', contributionPercent: 18 }, { factor: 'Ground movement acceleration', contributionPercent: 15 }],
  z08: [{ factor: 'Slope angle exceeds stability threshold', contributionPercent: 32 }, { factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 28 }, { factor: 'Proximity to seismic fault line', contributionPercent: 18 }, { factor: 'Soil saturation trend rising', contributionPercent: 14 }, { factor: 'Ground movement acceleration', contributionPercent: 8 }],
  z09: [{ factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 32 }, { factor: 'Proximity to seismic fault line', contributionPercent: 24 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 20 }, { factor: 'Soil saturation trend rising', contributionPercent: 16 }, { factor: 'Ground movement acceleration', contributionPercent: 8 }],
  z10: [{ factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 30 }, { factor: 'Soil saturation trend rising', contributionPercent: 25 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 20 }, { factor: 'Recent deforestation/land-use change nearby', contributionPercent: 15 }, { factor: 'Proximity to seismic fault line', contributionPercent: 10 }],
  z11: [{ factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 40 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 26 }, { factor: 'Soil saturation trend rising', contributionPercent: 16 }, { factor: 'Recent deforestation/land-use change nearby', contributionPercent: 10 }, { factor: 'Proximity to seismic fault line', contributionPercent: 8 }],
  z12: [{ factor: 'Soil saturation trend rising', contributionPercent: 28 }, { factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 24 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 22 }, { factor: 'Proximity to seismic fault line', contributionPercent: 16 }, { factor: 'Ground movement acceleration', contributionPercent: 10 }],
  z13: [{ factor: 'Proximity to seismic fault line', contributionPercent: 28 }, { factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 26 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 22 }, { factor: 'Sensor network degradation', contributionPercent: 14 }, { factor: 'Soil saturation trend rising', contributionPercent: 10 }],
  z14: [{ factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 30 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 24 }, { factor: 'Soil saturation trend rising', contributionPercent: 22 }, { factor: 'Proximity to seismic fault line', contributionPercent: 14 }, { factor: 'Ground movement acceleration', contributionPercent: 10 }],
  z15: [{ factor: 'Cumulative antecedent rainfall (72h)', contributionPercent: 26 }, { factor: 'Soil saturation trend rising', contributionPercent: 24 }, { factor: 'Slope angle exceeds stability threshold', contributionPercent: 22 }, { factor: 'Proximity to seismic fault line', contributionPercent: 16 }, { factor: 'Ground movement acceleration', contributionPercent: 12 }],
}

export const historicalIncidents = {
  z01: [
    { date: '2024-06-15', event: 'Major landslide blocked NH-206', severity: 'Critical' },
    { date: '2023-08-22', event: 'Flash flood in Sohra market area', severity: 'Very High' },
    { date: '2022-07-10', event: 'Slope failure near tourist viewpoint', severity: 'High' },
  ],
  z11: [
    { date: '2024-07-03', event: 'Multi-point slope failure after 400mm rainfall', severity: 'Critical' },
    { date: '2023-09-14', event: 'Road washout on connecting highway', severity: 'High' },
  ],
}

export const newsItems = [
  { id: 'n01', headline: 'Heavy Rain Triggers Landslide Fears in East Khasi Hills', summary: 'Local authorities report road blockages near Sohra as continuous rainfall exceeds 140mm in 24 hours. NH-206 remains partially closed pending GSI assessment.', source: 'NE Herald', timestamp: '2026-08-31T15:10:00', state: 'Meghalaya', zone: 'Sohra', tag: 'News', url: 'https://neherald.com/' },
  { id: 'n02', headline: 'MDoNER Issues Monsoon Preparedness Advisory for NER States', summary: 'The Ministry urges district administrations across all eight NER states to activate disaster response protocols and coordinate with RIDGE monitoring centres.', source: 'MDoNER Press Release', timestamp: '2026-08-31T14:45:00', tag: 'Government Advisory', url: 'https://mdoner.gov.in/en/content/press-releases' },
  { id: 'n03', headline: 'IMD Forecasts Intense Rainfall Band Over Meghalaya–Assam Corridor', summary: 'A well-marked low-pressure system is expected to bring 100–180mm rainfall over the next 48 hours, significantly elevating landslide susceptibility in hilly terrain.', source: 'Weather Bulletin', timestamp: '2026-08-31T14:20:00', state: 'Meghalaya', tag: 'Weather Bulletin', url: 'https://mausam.imd.gov.in/' },
  { id: 'n04', headline: 'Shillong Times: Villages on High Alert After Soil Saturation Warning', summary: 'Residents in Cherrapunji and surrounding areas have been advised to avoid steep slopes. Community shelters are being prepared as a precautionary measure.', source: 'Shillong Times Desk', timestamp: '2026-08-31T13:55:00', state: 'Meghalaya', zone: 'Cherrapunji East', tag: 'News', url: 'https://theshillongtimes.com/' },
  { id: 'n05', headline: 'GSI Bulletin: Elevated Landslide Risk in Tawang–Bomdila Sector', summary: 'Geological Survey of India identifies active slope instability along NH-13 due to combined seismic activity and antecedent rainfall exceeding 250mm over five days.', source: 'GSI Bulletin', timestamp: '2026-08-31T13:30:00', state: 'Arunachal Pradesh', zone: 'Tawang Pass', tag: 'Government Advisory', url: 'https://www.gsi.gov.in/webcenter/portal/OCBIS/page?pageid=391&_afrLoop=421789750847000' },
  { id: 'n06', headline: 'Sikkim SDMA Coordinates Pre-Monsoon Evacuation Drill in Gangtok', summary: 'State disaster management conducted a full-scale evacuation exercise involving 1,200 residents, testing multi-channel alert dissemination via RIDGE integration.', source: 'NE Herald', timestamp: '2026-08-31T12:40:00', state: 'Sikkim', zone: 'Gangtok Ridge', tag: 'News', url: 'https://neherald.com/sikkim/' },
  { id: 'n07', headline: 'Red Warning: Flash Flood and Landslide Risk for Mizoram Hill Districts', summary: 'IMD issues red-category warning for Aizawl and Lunglei districts. Landslide probability index expected to peak between 18:00–06:00 IST.', source: 'Weather Bulletin', timestamp: '2026-08-31T12:15:00', state: 'Mizoram', tag: 'Weather Bulletin', url: 'https://mausam.imd.gov.in/imd_latest/contents/dist_nowcast_map.php' },
  { id: 'n08', headline: 'Railway Board Suspends Night Services on Lumding–Badarpur Section', summary: 'Northeast Frontier Railway halts overnight operations citing RIDGE high-risk alerts for multiple slope sections along the Lumding–Silchar corridor.', source: 'NE Herald', timestamp: '2026-08-31T11:50:00', state: 'Assam', tag: 'News', url: 'https://neherald.com/assam/' },
  { id: 'n09', headline: 'Nagaland Government Deploys Rapid Response Teams to Kohima Slopes', summary: 'State emergency operations centre activates Level-2 response after ground movement sensors report accelerated displacement rates in three monitored zones.', source: 'MDoNER Press Release', timestamp: '2026-08-31T11:20:00', state: 'Nagaland', zone: 'Kohima Slopes', tag: 'Government Advisory', url: 'https://mdoner.gov.in/en/content/press-releases' },
  { id: 'n10', headline: 'Tripura Records Below-Average Landslide Activity This Season', summary: 'Agartala meteorological station reports moderate rainfall patterns, with RIDGE risk scores remaining in the low-to-moderate range across monitored upland zones.', source: 'Shillong Times Desk', timestamp: '2026-08-31T10:45:00', state: 'Tripura', tag: 'News', url: 'https://theshillongtimes.com/' },
  { id: 'n11', headline: 'Manipur SDMA Issues Community Safety Guidelines for Hill Settlements', summary: 'Official bulletin outlines early warning signs, evacuation routes, and emergency contact numbers for residents in Imphal Valley fringe communities.', source: 'MDoNER Press Release', timestamp: '2026-08-31T10:10:00', state: 'Manipur', tag: 'Government Advisory', url: 'https://mdoner.gov.in/en/content/press-releases' },
  { id: 'n12', headline: 'Extended Monsoon Outlook: Above-Normal Rainfall Expected Through September', summary: 'IMD seasonal forecast indicates continued elevated landslide risk across NER through September, with peak activity anticipated in the third week.', source: 'Weather Bulletin', timestamp: '2026-08-31T09:30:00', tag: 'Weather Bulletin', url: 'https://mausam.imd.gov.in/' },
]

const riskWeight = { Low: 1, Moderate: 2, High: 3, 'Very High': 4, Critical: 5 }

export function getSeverityTier(riskLevel, exposure) {
  const exposureScore =
    exposure.estimatedPopulationInRadius / 400 +
    exposure.estimatedStructuresAtRisk / 60 +
    exposure.roadNetworkLengthAtRiskKm / 4
  const combined = riskWeight[riskLevel] * 0.55 + Math.min(5, exposureScore) * 0.45
  if (combined >= 4.2 || (riskLevel === 'Critical' && exposure.estimatedPopulationInRadius > 1000)) return 'Catastrophic'
  if (combined >= 3.2 || exposure.estimatedPopulationInRadius > 600) return 'Severe'
  if (combined >= 2.2 || exposure.estimatedPopulationInRadius > 250) return 'Moderate'
  return 'Localized'
}

export function getExposureSummary(zoneId) {
  const exposure = zoneExposure[zoneId]
  if (!exposure) return 'No exposure data'
  const topRoad = exposure.roads[0]?.name ?? 'local roads'
  const topSettlement = exposure.settlements[0]
  const pop = topSettlement
    ? `~${topSettlement.population.toLocaleString('en-IN')} residents`
    : `~${exposure.estimatedPopulationInRadius.toLocaleString('en-IN')} residents`
  const infraCount = exposure.infrastructure.length
  return `${topRoad}, ${pop}${infraCount > 0 ? `, ${infraCount} infrastructure site${infraCount > 1 ? 's' : ''}` : ''}`
}
