import * as analyticsService from '../services/analyticsService.js'

export async function dashboardStats(req, res, next) {
  try {
    const stats = await analyticsService.getDashboardStats()
    res.json(stats)
  } catch (err) {
    next(err)
  }
}

export async function riskDistribution(req, res, next) {
  try {
    const data = await analyticsService.getRiskDistribution()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function rainfallCorrelation(req, res, next) {
  try {
    const data = await analyticsService.getRainfallCorrelation()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function seasonalHeatmap(req, res, next) {
  try {
    const data = await analyticsService.getSeasonalHeatmap()
    res.json(data)
  } catch (err) {
    next(err)
  }
}
