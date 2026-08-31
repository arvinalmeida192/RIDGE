import { runJob } from '../services/ingestionTracker.js'
import { scoreAllZones } from '../services/scoringService.js'

export async function scoreRisk() {
  return runJob('scoring', async () => scoreAllZones())
}

export default scoreRisk
