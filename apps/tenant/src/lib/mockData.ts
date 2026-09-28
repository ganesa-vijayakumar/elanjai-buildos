import { Project, Notification, CONSTRUCTION_STAGES, SitePhoto, ExpenseEntry, BudgetAlert, Worker, DailyAttendance, Advance, PaymentSummary, Quotation, QuotationStatus, BuildingType, PackageType, ProjectMaterial, MaterialCategory, MaterialStatus, ChangeRequest, ChangeRequestStatus, ChangeRequestType, ChangeRequestCategory } from './types';

function generateMockChangeRequests(projectId: string, projectName: string): ChangeRequest[] {
  const requests: ChangeRequest[] = []

  if (projectId === 'proj-001') {
    requests.push({
      id: `${projectId}-cr-001`,
      crNumber: `CR-001-001`,
      projectId,
      projectName,
      description: 'Add false ceiling in hall with LED cove lighting',
      type: 'addition',
      requestedBy: 'client',
      category: 'electrical',
      costImpact: 85000,
      timelineImpact: 5,
      status: 'approved',
      approverNotes: 'Approved as per client request. Additional cost will be added to final invoice.',
      approvedBy: 'Admin',
      approvedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    })

    requests.push({
      id: `${projectId}-cr-002`,
      crNumber: `CR-001-002`,
      projectId,
      projectName,
      description: 'Replace standard tiles with Italian marble in master bedroom',
      type: 'modification',
      requestedBy: 'client',
      category: 'flooring',
      costImpact: 125000,
      timelineImpact: 3,
      status: 'in-progress',
      approverNotes: 'Client willing to pay premium for better quality.',
      approvedBy: 'Owner',
      approvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    })

    requests.push({
      id: `${projectId}-cr-003`,
      crNumber: `CR-001-003`,
      projectId,
      projectName,
      description: 'Add additional bathroom in ground floor near guest room',
      type: 'addition',
      requestedBy: 'client',
      category: 'plumbing',
      costImpact: 180000,
      timelineImpact: 10,
      status: 'pending',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  if (projectId === 'proj-002') {
    requests.push({
      id: `${projectId}-cr-001`,
      crNumber: `CR-002-001`,
      projectId,
      projectName,
      description: 'Remove planned wooden partition wall in living area',
      type: 'removal',
      requestedBy: 'client',
      category: 'carpentry',
      costImpact: -45000,
      timelineImpact: -2,
      status: 'approved',
      approverNotes: 'Approved. Cost will be deducted from final bill.',
      approvedBy: 'Admin',
      approvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    })

    requests.push({
      id: `${projectId}-cr-002`,
      crNumber: `CR-002-002`,
      projectId,
      projectName,
      description: 'Upgrade to premium paint brand (Dulux) throughout the house',
      type: 'modification',
      requestedBy: 'client',
      category: 'painting',
      costImpact: 35000,
      timelineImpact: 0,
      status: 'rejected',
      approverNotes: 'Current paint quality is already premium. Client agreed to stick with original plan.',
      rejectedBy: 'Owner',
      rejectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return requests
}


function generateMockMaterials(projectId: string, packageType: PackageType): ProjectMaterial[] {
  const baseMaterials: Array<{
    category: MaterialCategory
    materialName: string
    specifiedBrand: string
    estimatedQuantity: number
    unit: string
  }> = [
      { category: 'cement', materialName: 'Portland Cement 53 Grade', specifiedBrand: 'Ultratech', estimatedQuantity: 400, unit: 'bags' },
      { category: 'steel', materialName: 'TMT Steel Bars Fe550D', specifiedBrand: 'I Steel', estimatedQuantity: 4000, unit: 'kg' },
      { category: 'sand', materialName: 'River Sand', specifiedBrand: 'Local Supplier', estimatedQuantity: 18, unit: 'tons' },
      { category: 'aggregate', materialName: '20mm Aggregate', specifiedBrand: 'Local Supplier', estimatedQuantity: 20, unit: 'tons' },
      { category: 'bricks', materialName: 'Red Clay Bricks', specifiedBrand: 'Standard', estimatedQuantity: 8000, unit: 'pieces' },
      { category: 'tiles', materialName: 'Vitrified Tiles 4x2', specifiedBrand: 'KAG', estimatedQuantity: 200, unit: 'sq.ft' },
      { category: 'paint', materialName: 'Exterior Emulsion', specifiedBrand: 'Asian Paints', estimatedQuantity: 40, unit: 'liters' },
      { category: 'electrical', materialName: 'Electrical Switches', specifiedBrand: 'Anchor Roma', estimatedQuantity: 50, unit: 'pieces' },
      { category: 'plumbing', materialName: 'Bathroom Fittings Set', specifiedBrand: 'Parryware', estimatedQuantity: 3, unit: 'sets' },
    ]

  const statusOptions: MaterialStatus[] = ['pending', 'ordered', 'delivered', 'installed']

  return baseMaterials.map((mat, index) => {
    const randomStatus = statusOptions[Math.min(index, statusOptions.length - 1)]
    const actualQtyVariance = 0.9 + Math.random() * 0.25
    const actualQty = randomStatus === 'installed' || randomStatus === 'delivered'
      ? Math.round(mat.estimatedQuantity * actualQtyVariance)
      : 0

    const statusHistory = [
      {
        status: 'pending' as MaterialStatus,
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        changedBy: 'System'
      }
    ]

    if (randomStatus !== 'pending') {
      statusHistory.push({
        status: 'ordered' as MaterialStatus,
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        changedBy: 'Site Manager'
      })
    }

    if (randomStatus === 'delivered' || randomStatus === 'installed') {
      statusHistory.push({
        status: 'delivered' as MaterialStatus,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        changedBy: 'Site Manager'
      })
    }

    if (randomStatus === 'installed') {
      statusHistory.push({
        status: 'installed' as MaterialStatus,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        changedBy: 'Site Manager'
      })
    }

    return {
      id: `${projectId}-mat-${index}`,
      projectId,
      category: mat.category,
      materialName: mat.materialName,
      specifiedBrand: mat.specifiedBrand,
      actualBrand: randomStatus !== 'pending' ? mat.specifiedBrand : undefined,
      estimatedQuantity: mat.estimatedQuantity,
      actualQuantityUsed: actualQty,
      unit: mat.unit,
      status: randomStatus,
      statusHistory,
      photos: [],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  })
}

function generateMockExpenses(stageId: string, stageName: string, actualSpent: number, budgetAmount: number): { expenses: ExpenseEntry[], alerts: BudgetAlert[] } {
  if (actualSpent === 0) {
    return { expenses: [], alerts: [] };
  }

  const categories: ExpenseEntry['category'][] = ['labor', 'material', 'equipment', 'transport', 'other'];
  const expenses: ExpenseEntry[] = [];
  const numExpenses = Math.floor(Math.random() * 5) + 3;
  let remaining = actualSpent;

  const descriptions: Record<ExpenseEntry['category'], string[]> = {
    labor: ['Mason wages', 'Helper wages', 'Carpenter wages', 'Electrician wages', 'Plumber wages'],
    material: ['Cement bags', 'Steel bars', 'Bricks', 'Sand', 'Aggregate', 'Tiles'],
    equipment: ['Concrete mixer rental', 'Scaffolding rental', 'Power tools'],
    transport: ['Material delivery', 'Equipment transport', 'Worker transport'],
    other: ['Site supervision', 'Safety equipment', 'Miscellaneous'],
  };

  for (let i = 0; i < numExpenses && remaining > 100; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = i === numExpenses - 1 ? remaining : Math.floor(remaining * (0.1 + Math.random() * 0.3));
    remaining -= amount;

    const descList = descriptions[category];
    const description = descList[Math.floor(Math.random() * descList.length)];

    expenses.push({
      id: `expense-${stageId}-${i}`,
      stageId,
      stageName,
      category,
      description,
      amount,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recordedBy: 'Owner',
      recordedAt: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  const alerts: BudgetAlert[] = [];
  const budgetUsagePercent = (actualSpent / budgetAmount) * 100;

  if (budgetUsagePercent >= 100) {
    alerts.push({
      id: `alert-${stageId}-critical`,
      stageId,
      stageName,
      type: 'critical',
      threshold: 100,
      currentSpend: actualSpent,
      budgetAmount,
      message: `Budget exceeded by ₹${(actualSpent - budgetAmount).toLocaleString()}`,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      acknowledged: false,
    });
  } else if (budgetUsagePercent >= 85) {
    alerts.push({
      id: `alert-${stageId}-warning`,
      stageId,
      stageName,
      type: 'warning',
      threshold: 85,
      currentSpend: actualSpent,
      budgetAmount,
      message: `Budget usage at ${budgetUsagePercent.toFixed(1)}% - approaching limit`,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      acknowledged: false,
    });
  }

  return { expenses, alerts };
}

function generateMockPhotos(projectId: string, stageNames: string[]): SitePhoto[] {
  const photoStages = stageNames.slice(0, Math.floor(stageNames.length * 0.6));
  const photos: SitePhoto[] = [];

  photoStages.forEach((stageName, index) => {
    if (Math.random() > 0.3) {
      photos.push({
        id: `${projectId}-photo-${index}`,
        url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23${['e3f2fd', 'f3e5f5', 'fff3e0', 'e8f5e9'][index % 4]}' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dy='.3em' fill='%23666'%3E${stageName}%3C/text%3E%3C/svg%3E`,
        caption: `${stageName} completed successfully - Quality work as per standards`,
        stage: stageName,
        uploadedAt: new Date(Date.now() - (photoStages.length - index) * 5 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'Site Manager',
      });
    }
  });

  return photos;
}

export function generateMockProjects(): Project[] {
  return [
    {
      id: 'proj-001',
      name: 'Lakeview Villa',
      clientName: 'Mr. Rajesh Sharma',
      location: 'Banjara Hills, Hyderabad',
      type: 'villa',
      squareFootage: 3200,
      packageType: 'premium',
      totalCost: 9170000,
      status: 'on-track',
      currentStage: 'Plastering',
      currentStageIndex: 6,
      completionPercentage: 72,
      totalCollected: 6500000,
      totalExpenses: 5800000,
      createdAt: '2024-08-15',
      materialUsage: {
        'Cement - Ultratech': 1200,
        'Steel - Tata': 12000,
        'Sand': 45,
        'Aggregate': 60,
        'Bricks': 24000,
      },
      materials: generateMockMaterials('proj-001', 'premium'),
      sitePhotos: generateMockPhotos('proj-001', CONSTRUCTION_STAGES.map(s => s.name).slice(0, 7)),
      changeRequests: generateMockChangeRequests('proj-001', 'Lakeview Villa'),
      stages: CONSTRUCTION_STAGES.map((stage, index) => {
        const budgetAmount = (8960000 * stage.percentage) / 100;
        const isCompleted = index < 6;
        const isCurrent = index === 6;
        const actualSpent = isCompleted
          ? budgetAmount * (0.9 + Math.random() * 0.15)
          : isCurrent
            ? budgetAmount * 0.45
            : 0;

        const { expenses, alerts } = generateMockExpenses(
          `proj-001-stage-${index}`,
          stage.name,
          actualSpent,
          budgetAmount
        );

        const baseDate = new Date('2024-08-15');
        const daysPerStage = 12;
        const plannedStartDate = new Date(baseDate.getTime() + index * daysPerStage * 24 * 60 * 60 * 1000);
        const plannedEndDate = new Date(plannedStartDate.getTime() + daysPerStage * 24 * 60 * 60 * 1000);

        return {
          id: `proj-001-stage-${index}`,
          name: stage.name,
          percentage: stage.percentage,
          budgetAmount,
          actualSpent,
          actualCost: isCompleted ? actualSpent : undefined,
          status: isCompleted ? 'completed' : isCurrent ? 'in-progress' : 'not-started',
          plannedStartDate: plannedStartDate.toISOString().split('T')[0],
          plannedEndDate: plannedEndDate.toISOString().split('T')[0],
          actualStartDate: isCompleted || isCurrent ? plannedStartDate.toISOString().split('T')[0] : undefined,
          actualEndDate: isCompleted ? plannedEndDate.toISOString().split('T')[0] : undefined,
          estimatedDays: daysPerStage,
          progress: isCurrent ? 45 : isCompleted ? 100 : 0,
          expenses,
          budgetAlerts: alerts,
        };
      }),
    },
    {
      id: 'proj-002',
      name: 'Greenwood Apartments',
      clientName: 'Mrs. Priya Reddy',
      location: 'Gachibowli, Hyderabad',
      type: 'apartment',
      squareFootage: 1800,
      packageType: 'standard',
      totalCost: 4095000,
      status: 'delayed',
      currentStage: 'Foundation',
      currentStageIndex: 1,
      completionPercentage: 10,
      totalCollected: 1200000,
      totalExpenses: 1450000,
      createdAt: '2024-10-20',
      materialUsage: {
        'Cement - Ultratech': 850,
        'Steel - Tata': 9500,
      },
      materials: generateMockMaterials('proj-002', 'standard'),
      sitePhotos: generateMockPhotos('proj-002', CONSTRUCTION_STAGES.map(s => s.name).slice(0, 2)),
      changeRequests: generateMockChangeRequests('proj-002', 'Greenwood Apartments'),
      stages: CONSTRUCTION_STAGES.map((stage, index) => {
        const budgetAmount = (4140000 * stage.percentage) / 100;
        const isCompleted = index < 1;
        const isCurrent = index === 1;
        const actualSpent = isCompleted
          ? budgetAmount * 1.1
          : isCurrent
            ? budgetAmount * 1.15
            : 0;

        const { expenses, alerts } = generateMockExpenses(
          `proj-002-stage-${index}`,
          stage.name,
          actualSpent,
          budgetAmount
        );

        const baseDate = new Date('2024-10-20');
        const daysPerStage = 12;
        const plannedStartDate = new Date(baseDate.getTime() + index * daysPerStage * 24 * 60 * 60 * 1000);
        const plannedEndDate = new Date(plannedStartDate.getTime() + daysPerStage * 24 * 60 * 60 * 1000);

        return {
          id: `proj-002-stage-${index}`,
          name: stage.name,
          percentage: stage.percentage,
          budgetAmount,
          actualSpent,
          actualCost: isCompleted ? actualSpent : undefined,
          status: isCompleted ? 'completed' : isCurrent ? 'in-progress' : 'not-started',
          plannedStartDate: plannedStartDate.toISOString().split('T')[0],
          plannedEndDate: plannedEndDate.toISOString().split('T')[0],
          actualStartDate: isCompleted || isCurrent ? plannedStartDate.toISOString().split('T')[0] : undefined,
          actualEndDate: isCompleted ? plannedEndDate.toISOString().split('T')[0] : undefined,
          estimatedDays: daysPerStage,
          progress: isCurrent ? 60 : isCompleted ? 100 : 0,
          expenses,
          budgetAlerts: alerts,
        };
      }),
    },
    {
      id: 'proj-003',
      name: 'Sunrise Duplex',
      clientName: 'Mr. Venkat Rao',
      location: 'Jubilee Hills, Hyderabad',
      type: 'duplex',
      squareFootage: 2500,
      packageType: 'basic',
      totalCost: 5000000,
      status: 'completed',
      currentStage: 'Handover',
      currentStageIndex: 14,
      completionPercentage: 100,
      totalCollected: 5000000,
      totalExpenses: 4850000,
      createdAt: '2024-03-10',
      materialUsage: {
        'Cement - Ultratech': 980,
        'Steel - Tata': 9800,
        'Sand': 36,
        'Aggregate': 48,
        'Bricks': 19500,
      },
      materials: generateMockMaterials('proj-003', 'basic'),
      sitePhotos: generateMockPhotos('proj-003', CONSTRUCTION_STAGES.map(s => s.name)),
      changeRequests: [],
      stages: CONSTRUCTION_STAGES.map((stage, index) => {
        const budgetAmount = (5000000 * stage.percentage) / 100;
        const actualSpent = budgetAmount * (0.92 + Math.random() * 0.1);

        const { expenses, alerts } = generateMockExpenses(
          `proj-003-stage-${index}`,
          stage.name,
          actualSpent,
          budgetAmount
        );

        const baseDate = new Date('2024-03-10');
        const daysPerStage = 12;
        const plannedStartDate = new Date(baseDate.getTime() + index * daysPerStage * 24 * 60 * 60 * 1000);
        const plannedEndDate = new Date(plannedStartDate.getTime() + daysPerStage * 24 * 60 * 60 * 1000);

        return {
          id: `proj-003-stage-${index}`,
          name: stage.name,
          percentage: stage.percentage,
          budgetAmount,
          actualSpent,
          actualCost: actualSpent,
          status: 'completed',
          plannedStartDate: plannedStartDate.toISOString().split('T')[0],
          plannedEndDate: plannedEndDate.toISOString().split('T')[0],
          actualStartDate: plannedStartDate.toISOString().split('T')[0],
          actualEndDate: plannedEndDate.toISOString().split('T')[0],
          estimatedDays: daysPerStage,
          progress: 100,
          expenses,
          budgetAlerts: alerts,
        };
      }),
    },
    {
      id: 'proj-004',
      name: 'Meadows Estate',
      clientName: 'Dr. Suresh Kumar',
      location: 'Kondapur, Hyderabad',
      type: 'villa',
      squareFootage: 4000,
      packageType: 'premium',
      totalCost: 11200000,
      status: 'on-track',
      currentStage: 'Brickwork',
      currentStageIndex: 3,
      completionPercentage: 23,
      totalCollected: 3400000,
      totalExpenses: 2450000,
      createdAt: '2024-11-05',
      materialUsage: {
        'Cement - Ultratech': 600,
        'Steel - Tata': 6000,
        'Bricks': 12000,
      },
      sitePhotos: generateMockPhotos('proj-004', CONSTRUCTION_STAGES.map(s => s.name).slice(0, 4)),
      materials: generateMockMaterials('proj-004', 'premium'),
      changeRequests: [],
      stages: CONSTRUCTION_STAGES.map((stage, index) => {
        const budgetAmount = (11200000 * stage.percentage) / 100;
        const isCompleted = index < 3;
        const isCurrent = index === 3;
        const actualSpent = isCompleted
          ? budgetAmount * 0.95
          : isCurrent
            ? budgetAmount * 0.35
            : 0;

        const { expenses, alerts } = generateMockExpenses(
          `proj-004-stage-${index}`,
          stage.name,
          actualSpent,
          budgetAmount
        );

        return {
          id: `proj-004-stage-${index}`,
          name: stage.name,
          percentage: stage.percentage,
          budgetAmount,
          actualSpent,
          status: isCompleted ? 'completed' : isCurrent ? 'in-progress' : 'pending',
          expenses,
          budgetAlerts: alerts,
        };
      }),
    },
  ];
}

export function generateMockNotifications(): Notification[] {
  return [
    {
      id: 'notif-001',
      projectId: 'proj-002',
      projectName: 'Greenwood Apartments',
      type: 'critical',
      message: 'Foundation stage: Budget exceeded by ₹61,850 (15%)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'notif-002',
      projectId: 'proj-001',
      projectName: 'Lakeview Villa',
      type: 'success',
      message: 'Flooring stage completed successfully',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'notif-003',
      projectId: 'proj-004',
      projectName: 'Meadows Estate',
      type: 'warning',
      message: 'Cement delivery delayed - expected tomorrow',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: 'notif-004',
      projectId: 'proj-003',
      projectName: 'Sunrise Duplex',
      type: 'success',
      message: 'Project completed and handed over to client',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];
}

export function generateMockWorkers(): Worker[] {
  const now = new Date()
  return [
    {
      id: 'worker-001',
      name: 'Ramesh Kumar',
      phone: '9876543210',
      type: 'mason',
      dailyWage: 800,
      photoUrl: undefined,
      projectId: 'proj-001',
      status: 'active',
      advanceBalance: 500,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'worker-002',
      name: 'Suresh',
      phone: '9876543211',
      type: 'helper',
      dailyWage: 500,
      photoUrl: undefined,
      projectId: 'proj-001',
      status: 'active',
      advanceBalance: 0,
      createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'worker-003',
      name: 'Venkat',
      phone: '9876543212',
      type: 'barbender',
      dailyWage: 750,
      photoUrl: undefined,
      projectId: 'proj-001',
      status: 'active',
      advanceBalance: 1000,
      createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'worker-004',
      name: 'Raju',
      phone: '9876543213',
      type: 'electrician',
      dailyWage: 900,
      photoUrl: undefined,
      projectId: 'proj-001',
      status: 'active',
      advanceBalance: 0,
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

export function generateMockAttendance(): DailyAttendance[] {
  const today = new Date()
  const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)

  return [
    {
      date: today.toISOString().split('T')[0],
      projectId: 'proj-001',
      records: [
        { workerId: 'worker-001', status: 'present', wageEarned: 800 },
        { workerId: 'worker-002', status: 'present', wageEarned: 500 },
        { workerId: 'worker-003', status: 'half-day', wageEarned: 375 },
        { workerId: 'worker-004', status: 'absent', wageEarned: 0 },
      ],
      totalPresent: 2,
      totalHalfDay: 1,
      totalAbsent: 1,
      totalWages: 1675,
      notes: 'Venkat left early for family emergency',
      markedBy: 'Rajesh Kumar',
      markedAt: new Date(today.setHours(18, 0, 0)).toISOString(),
    },
    {
      date: yesterday.toISOString().split('T')[0],
      projectId: 'proj-001',
      records: [
        { workerId: 'worker-001', status: 'present', wageEarned: 800 },
        { workerId: 'worker-002', status: 'present', wageEarned: 500 },
        { workerId: 'worker-003', status: 'present', wageEarned: 750 },
        { workerId: 'worker-004', status: 'present', wageEarned: 900 },
      ],
      totalPresent: 4,
      totalHalfDay: 0,
      totalAbsent: 0,
      totalWages: 2950,
      markedBy: 'Rajesh Kumar',
      markedAt: new Date(yesterday.setHours(18, 0, 0)).toISOString(),
    },
  ]
}

export function generateMockAdvances(): Advance[] {
  return [
    {
      id: 'adv-001',
      workerId: 'worker-001',
      workerName: 'Ramesh Kumar',
      amount: 500,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: 'Festival advance',
      recordedBy: 'Rajesh Kumar',
      status: 'pending-recovery',
    },
    {
      id: 'adv-002',
      workerId: 'worker-003',
      workerName: 'Venkat',
      amount: 1000,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: 'Medical emergency',
      recordedBy: 'Rajesh Kumar',
      status: 'pending-recovery',
    },
  ]
}

export function generateMockPaymentSummaries(): PaymentSummary[] {
  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekEnd = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)

  return [
    {
      id: 'pay-001',
      projectId: 'proj-001',
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      workers: [
        {
          workerId: 'worker-001',
          name: 'Ramesh Kumar',
          daysWorked: 5.5,
          grossWage: 4400,
          advanceDeduction: 500,
          netPayable: 3900,
        },
        {
          workerId: 'worker-002',
          name: 'Suresh',
          daysWorked: 6,
          grossWage: 3000,
          advanceDeduction: 0,
          netPayable: 3000,
        },
        {
          workerId: 'worker-003',
          name: 'Venkat',
          daysWorked: 5,
          grossWage: 3750,
          advanceDeduction: 1000,
          netPayable: 2750,
        },
        {
          workerId: 'worker-004',
          name: 'Raju',
          daysWorked: 6,
          grossWage: 5400,
          advanceDeduction: 0,
          netPayable: 5400,
        },
      ],
      totalGross: 16550,
      totalAdvances: 1500,
      totalNetPayable: 15050,
      status: 'pending-approval',
      createdBy: 'Rajesh Kumar',
      createdAt: weekEnd.toISOString(),
    },
  ]
}

export function generateMockQuotations(): Quotation[] {
  const now = new Date()

  const packageRates: Record<PackageType, number> = {
    basic: 2200,
    standard: 2400,
    premium: 2600,
    custom: 2400, // Default to standard rate for custom packages
  }

  return [
    {
      id: 'quot-001',
      quotationNumber: 'Q-2025-001',
      clientName: 'Mr. Kumar',
      mobileNumber: '9876543210',
      email: 'kumar@example.com',
      projectDescription: 'New Residential Building for Mr. Kumar',
      location: 'Old Pallavaram',
      sqft: 1500,
      buildingType: 'individual_home',
      floors: 2,
      selectedPackage: 'standard',
      baseRatePerSqft: packageRates.standard,
      estimatedTotal: 1500 * packageRates.standard,
      status: 'draft',
      createdAt: new Date(2025, 3, 21).toISOString(),
      updatedAt: new Date(2025, 3, 21).toISOString(),
    },
    {
      id: 'quot-002',
      quotationNumber: 'Q-2025-002',
      clientName: 'Mrs. Priya',
      mobileNumber: '9876543211',
      email: 'priya@example.com',
      projectDescription: 'New Residential Building for Mrs. Priya',
      location: 'Tambaram',
      sqft: 2200,
      buildingType: 'duplex',
      floors: 2,
      selectedPackage: 'premium',
      baseRatePerSqft: packageRates.premium,
      estimatedTotal: 2200 * packageRates.premium,
      status: 'signed',
      createdAt: new Date(2025, 3, 18).toISOString(),
      updatedAt: new Date(2025, 3, 20).toISOString(),
    },
    {
      id: 'quot-003',
      quotationNumber: 'Q-2025-003',
      clientName: 'Mr. Venkatesh',
      mobileNumber: '9876543212',
      email: 'venkatesh@example.com',
      projectDescription: 'Villa Construction',
      location: 'ECR Road',
      sqft: 3500,
      buildingType: 'villa',
      floors: 2,
      selectedPackage: 'premium',
      baseRatePerSqft: packageRates.premium,
      estimatedTotal: 3500 * packageRates.premium,
      status: 'finalized',
      createdAt: new Date(2025, 3, 15).toISOString(),
      updatedAt: new Date(2025, 3, 17).toISOString(),
    },
    {
      id: 'quot-004',
      quotationNumber: 'Q-2025-004',
      clientName: 'Dr. Ravi Kumar',
      mobileNumber: '9876543213',
      email: 'ravi.kumar@example.com',
      projectDescription: 'Individual Home Construction',
      location: 'Chromepet',
      sqft: 1800,
      buildingType: 'individual_home',
      floors: 1,
      selectedPackage: 'basic',
      baseRatePerSqft: packageRates.basic,
      estimatedTotal: 1800 * packageRates.basic,
      status: 'sent',
      createdAt: new Date(2025, 3, 19).toISOString(),
      updatedAt: new Date(2025, 3, 19).toISOString(),
    },
    {
      id: 'quot-005',
      quotationNumber: 'Q-2025-005',
      clientName: 'Mr. Suresh',
      mobileNumber: '9876543214',
      email: 'suresh@example.com',
      projectDescription: 'Apartment Construction',
      location: 'Velachery',
      sqft: 2800,
      buildingType: 'apartment',
      floors: 3,
      selectedPackage: 'standard',
      baseRatePerSqft: packageRates.standard,
      estimatedTotal: 2800 * packageRates.standard,
      status: 'converted',
      createdAt: new Date(2025, 3, 10).toISOString(),
      updatedAt: new Date(2025, 3, 14).toISOString(),
      convertedToProjectId: 'proj-001',
    },
    {
      id: 'quot-006',
      quotationNumber: 'Q-2025-006',
      clientName: 'Mrs. Lakshmi',
      mobileNumber: '9876543215',
      email: 'lakshmi@example.com',
      projectDescription: 'Commercial Building',
      location: 'Anna Nagar',
      sqft: 4200,
      buildingType: 'commercial',
      floors: 3,
      selectedPackage: 'premium',
      baseRatePerSqft: packageRates.premium,
      estimatedTotal: 4200 * packageRates.premium,
      status: 'cancelled',
      createdAt: new Date(2025, 3, 5).toISOString(),
      updatedAt: new Date(2025, 3, 8).toISOString(),
      cancelledAt: new Date(2025, 3, 8).toISOString(),
      cancellationReason: 'Client not interested',
      cancellationNotes: 'Client decided to go with another contractor',
    },
    {
      id: 'quot-007',
      quotationNumber: 'Q-2025-007',
      clientName: 'Mr. Arun',
      mobileNumber: '9876543216',
      email: 'arun@example.com',
      projectDescription: 'Duplex Home',
      location: 'Perungudi',
      sqft: 2000,
      buildingType: 'duplex',
      floors: 2,
      selectedPackage: 'standard',
      baseRatePerSqft: packageRates.standard,
      estimatedTotal: 2000 * packageRates.standard,
      status: 'draft',
      createdAt: new Date(2025, 3, 22).toISOString(),
      updatedAt: new Date(2025, 3, 22).toISOString(),
    },
    {
      id: 'quot-008',
      quotationNumber: 'Q-2025-008',
      clientName: 'Mr. Rajesh',
      mobileNumber: '9876543217',
      email: 'rajesh@example.com',
      projectDescription: 'Luxury Apartment Complex',
      location: 'OMR, Chennai',
      sqft: 5000,
      buildingType: 'apartment',
      floors: 4,
      selectedPackage: 'premium',
      baseRatePerSqft: packageRates.premium,
      estimatedTotal: 5000 * packageRates.premium,
      status: 'signed',
      createdAt: new Date(2025, 3, 16).toISOString(),
      updatedAt: new Date(2025, 3, 21).toISOString(),
    },
  ]
}

export function extractAllChangeRequests(projects: Project[]): ChangeRequest[] {
  const allChangeRequests: ChangeRequest[] = []

  projects.forEach(project => {
    if (project.changeRequests && project.changeRequests.length > 0) {
      allChangeRequests.push(...project.changeRequests)
    }
  })

  return allChangeRequests
}
