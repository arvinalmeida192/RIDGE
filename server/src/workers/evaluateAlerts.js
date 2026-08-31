import { runJob } from '../services/ingestionTracker.js'
import { evaluateAlerts } from '../services/alertEngine.js'

export async function evaluateAlertsJob() {
  return runJob('alerts', async () => evaluateAlerts())
}

export default evaluateAlertsJob
