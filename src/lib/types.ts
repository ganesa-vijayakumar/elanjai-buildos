export type UserRole = 'owner' | 'admin' | 'site-manager' | 'client'
export type PackageType = 'basic' | 'standard' | 'premium' | 'custom'
export type ProjectType = 'villa' | 'apartment' | 'duplex' | 'commercial'
export type ProjectStatus = 'pre-construction' | 'foundation' | 'structure' | 'finishing' | 'handover' | 'completed' | 'on-hold' | 'on-track' | 'delayed'



// Expense approval status
export type ExpenseApprovalStatus = 'pending' | 'approved' | 'rejected'

export type TaskType =
  | 'brickwork-9'
  | 'brickwork-4.5'
  | 'plastering-internal'
  | 'plastering-external'
  | 'flooring-tiles'
  | 'flooring-marble'
  | 'concrete-foundation'
  | 'concrete-slab';

export interface BudgetAlert {
  id: string
  stageId: string
  stageName: string
  type: 'warning' | 'critical'
  threshold: number
  currentSpend: number
  budgetAmount: number
  message: string
  createdAt: string
  acknowledged: boolean
}

export interface ExpenseEntry {
  id: string
  stageId: string
  stageName: string
  category: 'labor' | 'material' | 'equipment' | 'transport' | 'other'
  description: string
  amount: number
  date: string
  recordedBy: string
  recordedAt: string
  notes?: string
  approvalStatus?: ExpenseApprovalStatus
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
}

export interface MaterialCalculation {
  id: string
  projectId?: string
  taskType: TaskType
  dimensions: Dimensions
  results: CalculationResults
  calculatedBy: string
  calculatedAt: string
}

export interface Dimensions {
  length?: number
  width?: number
  height?: number
  thickness?: number
  area?: number
  volume?: number
  depth?: number
}

export interface CalculationResults {
  bricks?: number
  cement: number
  sand: number
  aggregate?: number
  tiles?: number
  area?: number
  volume?: number
  wastage?: number
}

export type StageStatus = 'not-started' | 'pending' | 'in-progress' | 'completed' | 'delayed'

export interface StageCompletion {
  actualStartDate?: string
  actualEndDate?: string
  actualCost?: number
  notes?: string
  photos?: string[]
  completedBy?: string
  completedAt?: string
}

export interface ConstructionStage {
  id: string
  name: string
  percentage: number
  budgetAmount: number
  actualSpent: number
  actualCost?: number
  status: StageStatus
  plannedStartDate?: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  estimatedDays?: number
  progress?: number
  completion?: StageCompletion
  expenses?: ExpenseEntry[]
  budgetAlerts?: BudgetAlert[]
}

export interface ActivityLog {
  id: string
  projectId: string
  type: 'stage-start' | 'stage-complete' | 'status-change' | 'payment' | 'note' | 'photo-upload'
  title: string
  description: string
  timestamp: string
  user: string
  metadata?: Record<string, any>
}

export interface SitePhoto {
  id: string
  url: string
  caption: string
  stage: string
  uploadedAt: string
  uploadedBy: string
}

export interface CollectionEntry {
  id: string
  amount: number
  stage: string
  date: string
  notes: string
  recordedBy: string
  recordedAt: string
}

export interface Project {
  id: string
  name: string
  clientName: string
  location: string
  type: ProjectType
  squareFootage: number
  packageType: PackageType
  totalCost: number
  status: ProjectStatus
  currentStage: string
  currentStageIndex: number
  completionPercentage: number
  stages: ConstructionStage[]
  totalExpenses: number
  totalCollected: number
  createdAt: string
  sitePhotos?: SitePhoto[]
  materialUsage?: Record<string, number>
  collections?: CollectionEntry[]
  materials?: ProjectMaterial[]
  changeRequests?: ChangeRequest[]
}

export interface DailyEntry {
  id: string
  projectId: string
  date: string
  laborEntries: LaborEntry[]
  materialEntries: MaterialEntry[]
  pettyCash: PettyCashEntry[]
  totalAmount: number
  submittedBy: string
}

export interface LaborEntry {
  workerType: string
  count: number
  dailyWage: number
  totalWage: number
}

export interface MaterialEntry {
  materialType: string
  quantity: number
  unit: string
  vendor: string
  estimatedCost: number
}

export interface PettyCashEntry {
  description: string
  amount: number
}

export interface Notification {
  id: string
  projectId: string
  projectName: string
  type: 'success' | 'warning' | 'critical'
  message: string
  timestamp: string
  read: boolean
}

export const WORKER_ROLES_LIST = [
  { label: 'Helper', wage: 600 },
  { label: 'Mason', wage: 1200 },
  { label: 'Carpenter', wage: 1000 },
  { label: 'Electrician', wage: 1200 },
  { label: 'Plumber', wage: 1100 },
]

export const MATERIAL_TYPES = [
  { label: 'Cement - Ultratech', unit: 'bags' },
  { label: 'Sand', unit: 'tons' },
  { label: 'Bricks', unit: 'pieces' },
  { label: 'Steel - Tata', unit: 'kg' },
  { label: 'Aggregate', unit: 'tons' },
]

// Material spent tracking types
export type MaterialSpentType = 'cement' | 'steel' | 'brigs' | 'mchant' | 'pchant' | 'aggregate'

export interface MaterialSpent {
  id: string
  siteId: string
  materialType: MaterialSpentType
  quantity: number
  unit: string
  updatedBy?: string
  updatedAt?: string
}

export const MATERIAL_SPENT_TYPES: Array<{ type: MaterialSpentType; label: string; unit: string }> = [
  { type: 'cement', label: 'Cement', unit: 'Bags' },
  { type: 'steel', label: 'Steel', unit: 'Count' },
  { type: 'brigs', label: 'Brigs', unit: 'Count' },
  { type: 'mchant', label: 'MChant', unit: 'Unit' },
  { type: 'pchant', label: 'PChant', unit: 'Unit' },
  { type: 'aggregate', label: 'Aggregate', unit: 'Unit' },
]



// Expense approval status labels
export const EXPENSE_APPROVAL_STATUS_LABELS: Record<ExpenseApprovalStatus, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const CONSTRUCTION_STAGES = [
  { name: 'Foundation', percentage: 10 },
  { name: 'Plinth Beam', percentage: 5 },
  { name: 'Column', percentage: 8 },
  { name: 'Brickwork', percentage: 15 },
  { name: 'Lintel', percentage: 4 },
  { name: 'Slab', percentage: 12 },
  { name: 'Plastering', percentage: 10 },
  { name: 'Flooring', percentage: 8 },
  { name: 'Electrical', percentage: 8 },
  { name: 'Plumbing', percentage: 6 },
  { name: 'Doors & Windows', percentage: 6 },
  { name: 'Painting', percentage: 4 },
  { name: 'Finishing', percentage: 4 },
]

export interface MaterialNorm {
  id: string
  materialType: string
  quantityPer1000SqFt: number
  unit: string
  description: string
}

export const MATERIAL_NORMS: MaterialNorm[] = [
  {
    id: 'norm-1',
    materialType: 'Cement - Ultratech',
    quantityPer1000SqFt: 400,
    unit: 'bags',
    description: 'Standard cement requirement for 1000 sq ft construction',
  },
  {
    id: 'norm-2',
    materialType: 'Steel - Tata',
    quantityPer1000SqFt: 4000,
    unit: 'kg',
    description: 'Standard steel requirement for 1000 sq ft construction',
  },
  {
    id: 'norm-3',
    materialType: 'Sand',
    quantityPer1000SqFt: 18,
    unit: 'tons',
    description: 'Standard sand requirement for 1000 sq ft construction',
  },
  {
    id: 'norm-4',
    materialType: 'Aggregate',
    quantityPer1000SqFt: 20,
    unit: 'tons',
    description: 'Standard aggregate requirement for 1000 sq ft construction',
  },
  {
    id: 'norm-5',
    materialType: 'Bricks',
    quantityPer1000SqFt: 8000,
    unit: 'pieces',
    description: 'Standard brick requirement for 1000 sq ft construction',
  },
]

export const DEFAULT_MATERIAL_NORMS = MATERIAL_NORMS

export interface TaskOption {
  value: TaskType
  label: string
  category: string
}

export const PACKAGE_RATES: Record<PackageType, number> = {
  basic: 2200,
  standard: 2400,
  premium: 2600,
  custom: 2400,
}

export type WorkerType = 'mason' | 'helper' | 'barbender' | 'carpenter' | 'electrician' | 'plumber' | 'painter' | 'supervisor'
export type AttendanceStatus = 'present' | 'half-day' | 'absent' | 'leave'
export type PaymentStatus = 'pending-approval' | 'approved' | 'paid'
export type AdvanceStatus = 'pending-recovery' | 'recovered' | 'waived'

export interface Worker {
  id: string
  name: string
  phone: string
  type: WorkerType
  dailyWage: number
  photoUrl?: string
  projectId: string
  status: 'active' | 'inactive'
  advanceBalance: number
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  workerId: string
  status: AttendanceStatus
  wageEarned: number
  overtimeHours?: number
  overtimePay?: number
}

export interface DailyAttendance {
  date: string
  projectId: string
  records: AttendanceRecord[]
  totalPresent: number
  totalHalfDay: number
  totalAbsent: number
  totalWages: number
  notes?: string
  markedBy: string
  markedAt: string
}

export interface Advance {
  id: string
  workerId: string
  workerName: string
  amount: number
  date: string
  reason?: string
  recordedBy: string
  status: AdvanceStatus
  recoveredAmount?: number
  recoveredAt?: string
}

export interface WorkerPayment {
  workerId: string
  name: string
  daysWorked: number
  grossWage: number
  advanceDeduction: number
  netPayable: number
}

export interface PaymentSummary {
  id: string
  projectId: string
  weekStart: string
  weekEnd: string
  workers: WorkerPayment[]
  totalGross: number
  totalAdvances: number
  totalNetPayable: number
  status: PaymentStatus
  approvedBy?: string
  approvedAt?: string
  paidAt?: string
  createdBy: string
  createdAt: string
}

export const WORKER_TYPE_WAGES: Record<WorkerType, number> = {
  mason: 800,
  helper: 500,
  barbender: 750,
  carpenter: 850,
  electrician: 900,
  plumber: 850,
  painter: 700,
  supervisor: 1200,
}

export const WORKER_TYPE_LABELS: Record<WorkerType, string> = {
  mason: 'Mason',
  helper: 'Helper',
  barbender: 'Barbender',
  carpenter: 'Carpenter',
  electrician: 'Electrician',
  plumber: 'Plumber',
  painter: 'Painter',
  supervisor: 'Supervisor',
}

export type SwitchesBrand = 'orbit_gm' | 'anchor_roma' | 'legrand'
export type WiresBrand = 'orbit' | 'finolex'

export interface ElectricalRoom {
  roomId: string
  name: string
  lights: number
  fans: number
  socket5A: number
  socket15A: number
  acProvision: boolean
  tvPoint: boolean
  other?: string
}

export interface ElectricalProvisions {
  rooms: ElectricalRoom[]
  inverterWiring: boolean
  switchesBrand: SwitchesBrand
  wiresBrand: WiresBrand
}

export const SWITCHES_BRANDS = [
  { value: 'orbit_gm' as const, label: 'Orbit/GM (Basic)', costPerSqFt: 0 },
  { value: 'anchor_roma' as const, label: 'Anchor Roma (Standard)', costPerSqFt: 10 },
  { value: 'legrand' as const, label: 'Legrand (Premium)', costPerSqFt: 20 },
]

export const WIRES_BRANDS = [
  { value: 'orbit' as const, label: 'Orbit (Basic)', costPerSqFt: 0 },
  { value: 'finolex' as const, label: 'Finolex (Standard/Premium)', costPerSqFt: 5 },
]

export const DEFAULT_ROOMS: ElectricalRoom[] = [
  { roomId: 'hall', name: 'Hall', lights: 4, fans: 2, socket5A: 5, socket15A: 0, acProvision: true, tvPoint: false, other: 'Ceiling Spotlights: 4' },
  { roomId: 'kitchen', name: 'Kitchen', lights: 2, fans: 1, socket5A: 1, socket15A: 3, acProvision: false, tvPoint: false, other: 'Exhaust Provision' },
  { roomId: 'bedroom_master', name: 'Bedroom (Master)', lights: 2, fans: 1, socket5A: 2, socket15A: 0, acProvision: true, tvPoint: true, other: 'Foot Lamp: 1, Two-way switch' },
  { roomId: 'bedroom_2', name: 'Bedroom 2', lights: 2, fans: 1, socket5A: 2, socket15A: 0, acProvision: true, tvPoint: false, other: 'Two-way switch' },
  { roomId: 'bedroom_3', name: 'Bedroom 3', lights: 2, fans: 1, socket5A: 2, socket15A: 0, acProvision: true, tvPoint: false, other: 'Two-way switch' },
  { roomId: 'wardrobe', name: 'Wardrobe', lights: 1, fans: 1, socket5A: 0, socket15A: 0, acProvision: false, tvPoint: false },
  { roomId: 'toilet_1', name: 'Toilet 1', lights: 1, fans: 0, socket5A: 1, socket15A: 0, acProvision: false, tvPoint: false, other: 'Exhaust, Geyser provision' },
  { roomId: 'toilet_2', name: 'Toilet 2', lights: 1, fans: 0, socket5A: 1, socket15A: 0, acProvision: false, tvPoint: false, other: 'Exhaust, Geyser provision' },
  { roomId: 'parking', name: 'Parking', lights: 2, fans: 0, socket5A: 0, socket15A: 1, acProvision: false, tvPoint: false, other: 'Compound light provision, EV charger socket' },
]

export type QuotationStatus = 'draft' | 'finalized' | 'sent' | 'signed' | 'converted' | 'cancelled'
export type BuildingType = 'individual_home' | 'duplex' | 'villa' | 'apartment' | 'commercial'

export interface Quotation {
  id: string
  quotationNumber: string
  clientName: string
  mobileNumber?: string
  email?: string
  projectDescription: string
  location: string
  sqft: number
  buildingType: BuildingType
  floors: number
  selectedPackage: PackageType
  baseRatePerSqft: number
  estimatedTotal: number
  status: QuotationStatus
  createdAt: string
  updatedAt: string
  cancelledAt?: string
  cancellationReason?: string
  cancellationNotes?: string
  convertedToProjectId?: string
}

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  individual_home: 'Individual Home',
  duplex: 'Duplex',
  villa: 'Villa',
  apartment: 'Apartment',
  commercial: 'Commercial',
}

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Draft',
  finalized: 'Finalized',
  sent: 'Sent to Client',
  signed: 'Signed',
  converted: 'Converted to Project',
  cancelled: 'Cancelled',
}

export type MaterialStatus = 'pending' | 'ordered' | 'delivered' | 'installed'
export type MaterialCategory = 'cement' | 'steel' | 'tiles' | 'sand' | 'aggregate' | 'bricks' | 'paint' | 'electrical' | 'plumbing' | 'hardware' | 'other'

export interface MaterialBrand {
  id: string
  name: string
  category: MaterialCategory
  isActive: boolean
  createdAt: string
}

export interface MaterialPhoto {
  id: string
  url: string
  caption: string
  type: 'invoice' | 'site-photo' | 'delivery-note' | 'quality-check'
  uploadedAt: string
  uploadedBy: string
}

export interface ProjectMaterial {
  id: string
  projectId: string
  category: MaterialCategory
  materialName: string
  specifiedBrand: string
  actualBrand?: string
  actualBrandId?: string
  estimatedQuantity: number
  actualQuantityUsed: number
  unit: string
  status: MaterialStatus
  statusHistory: MaterialStatusChange[]
  photos: MaterialPhoto[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MaterialStatusChange {
  status: MaterialStatus
  date: string
  changedBy: string
  notes?: string
}

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  pending: 'Pending',
  ordered: 'Ordered',
  delivered: 'Delivered',
  installed: 'Installed',
}

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  cement: 'Cement',
  steel: 'Steel',
  tiles: 'Tiles',
  sand: 'Sand',
  aggregate: 'Aggregate',
  bricks: 'Bricks',
  paint: 'Paint',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hardware: 'Hardware',
  other: 'Other',
}

export const DEFAULT_MATERIAL_BRANDS: MaterialBrand[] = [
  { id: 'brand-2', name: 'Coromandel', category: 'cement', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-4', name: 'Dalmia', category: 'cement', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-6', name: 'ARS', category: 'steel', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-8', name: 'Kamachi', category: 'steel', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-10', name: 'Anuj', category: 'tiles', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-12', name: 'Berger', category: 'paint', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-14', name: 'Anchor Roma', category: 'electrical', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-16', name: 'Parryware', category: 'plumbing', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-18', name: 'Jaguar', category: 'plumbing', isActive: true, createdAt: new Date().toISOString() },
]

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed'
export type ChangeRequestType = 'addition' | 'modification' | 'removal'
export type ChangeRequestCategory = 'electrical' | 'plumbing' | 'carpentry' | 'painting' | 'flooring' | 'structural' | 'other'

export interface ChangeRequest {
  id: string
  crNumber: string
  projectId: string
  projectName: string
  description: string
  type: ChangeRequestType
  requestedBy: 'client' | 'builder'
  category: ChangeRequestCategory
  costImpact: number
  timelineImpact: number
  status: ChangeRequestStatus
  referenceImageUrl?: string
  approverNotes?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export const CHANGE_REQUEST_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

export const CHANGE_REQUEST_TYPE_LABELS: Record<ChangeRequestType, string> = {
  addition: 'Addition',
  modification: 'Modification',
  removal: 'Removal',
}

export const CHANGE_REQUEST_CATEGORY_LABELS: Record<ChangeRequestCategory, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  carpentry: 'Carpentry',
  painting: 'Painting',
  flooring: 'Flooring',
  structural: 'Structural',
  other: 'Other',
}
