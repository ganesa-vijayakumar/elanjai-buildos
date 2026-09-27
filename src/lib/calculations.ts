import { TaskType, Dimensions, CalculationResults, TaskOption } from './types'

export const TASK_OPTIONS: TaskOption[] = [
  { value: 'brickwork-9', label: '9-inch Wall', category: 'Brickwork' },
  { value: 'brickwork-4.5', label: '4.5-inch Wall', category: 'Brickwork' },
  { value: 'plastering-internal', label: 'Internal Plastering', category: 'Plastering' },
  { value: 'plastering-external', label: 'External Plastering', category: 'Plastering' },
  { value: 'flooring-tiles', label: 'Tiles', category: 'Flooring' },
  { value: 'flooring-marble', label: 'Marble/Granite', category: 'Flooring' },
  { value: 'concrete-foundation', label: 'Foundation', category: 'Concrete Work' },
  { value: 'concrete-slab', label: 'Slab/Beam/Column', category: 'Concrete Work' },
]

export function getRequiredFields(taskType: TaskType): string[] {
  switch (taskType) {
    case 'brickwork-9':
    case 'brickwork-4.5':
      return ['length', 'height']
    case 'plastering-internal':
    case 'plastering-external':
      return ['area', 'thickness']
    case 'flooring-tiles':
    case 'flooring-marble':
      return ['length', 'width']
    case 'concrete-foundation':
    case 'concrete-slab':
      return ['length', 'width', 'depth']
    default:
      return []
  }
}

export function calculateMaterials(
  taskType: TaskType,
  dimensions: Dimensions
): CalculationResults {
  switch (taskType) {
    case 'brickwork-9': {
      const area = (dimensions.length || 0) * (dimensions.height || 0)
      return {
        bricks: Math.ceil(area * 13.5),
        cement: Math.ceil(area * 0.5 * 10) / 10,
        sand: Math.ceil(area * 0.04 * 100) / 100,
      }
    }
    case 'brickwork-4.5': {
      const area = (dimensions.length || 0) * (dimensions.height || 0)
      return {
        bricks: Math.ceil(area * 7),
        cement: Math.ceil(area * 0.25 * 10) / 10,
        sand: Math.ceil(area * 0.02 * 100) / 100,
      }
    }
    case 'plastering-internal':
    case 'plastering-external': {
      const area = dimensions.area || 0
      return {
        cement: Math.ceil(area * 0.04 * 10) / 10,
        sand: Math.ceil(area * 0.005 * 1000) / 1000,
      }
    }
    case 'flooring-tiles':
    case 'flooring-marble': {
      const area = (dimensions.length || 0) * (dimensions.width || 0)
      const tilesWithWastage = Math.ceil(area * 1.1)
      return {
        tiles: tilesWithWastage,
        cement: Math.ceil(area * 0.03 * 10) / 10,
        sand: Math.ceil(area * 0.003 * 1000) / 1000,
      }
    }
    case 'concrete-foundation':
    case 'concrete-slab': {
      const volumeCubicFt =
        (dimensions.length || 0) * (dimensions.width || 0) * ((dimensions.depth || 0) / 12)
      const volumeM3 = volumeCubicFt * 0.0283168
      const dryVolumeM3 = volumeM3 * 1.54
      
      return {
        cement: Math.ceil(dryVolumeM3 * 6 * 10) / 10,
        sand: Math.ceil(dryVolumeM3 * 0.42 * 100) / 100,
        aggregate: Math.ceil(dryVolumeM3 * 0.84 * 100) / 100,
      }
    }
    default:
      return { cement: 0, sand: 0 }
  }
}

export function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    length: 'Length (ft)',
    width: 'Width (ft)',
    height: 'Height (ft)',
    area: 'Area (sq.ft)',
    thickness: 'Thickness (mm)',
    depth: 'Depth (inches)',
  }
  return labels[field] || field
}

export function getScaleLevel(materialType: string, quantity: number): 'small' | 'medium' | 'large' {
  const thresholds: Record<string, { medium: number; large: number }> = {
    bricks: { medium: 1000, large: 5000 },
    cement: { medium: 50, large: 200 },
    sand: { medium: 10, large: 50 },
    aggregate: { medium: 10, large: 50 },
    tiles: { medium: 100, large: 500 },
  }

  const threshold = thresholds[materialType] || { medium: 100, large: 500 }
  
  if (quantity >= threshold.large) return 'large'
  if (quantity >= threshold.medium) return 'medium'
  return 'small'
}

export function getProgressPercentage(materialType: string, quantity: number): number {
  const maxValues: Record<string, number> = {
    bricks: 10000,
    cement: 300,
    sand: 100,
    aggregate: 100,
    tiles: 1000,
  }

  const max = maxValues[materialType] || 1000
  return Math.min((quantity / max) * 100, 100)
}
