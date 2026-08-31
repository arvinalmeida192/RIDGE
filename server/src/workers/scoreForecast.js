import { runJob } from '../services/ingestionTracker.js'
import { forecastAllZones } from '../services/scoringService.js'

export async function scoreForecast() {
  return runJob('risk_forecast', async () => forecastAllZones())
}

export default scoreForecast
