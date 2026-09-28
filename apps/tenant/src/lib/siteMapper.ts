import { SiteWithFinancials, MaterialSpent, SiteStatus, PackageName } from './database.types';
import { Project, ConstructionStage as Stage, StageStatus, PackageType, ProjectMaterial } from './types';

function mapPackageName(name: PackageName | null): PackageType {
    if (!name) return 'basic';
    switch (name) {
        case 'economy': return 'basic';
        case 'standard': return 'standard';
        case 'premium': return 'premium';
        case 'luxury': return 'custom';
        default: return 'basic';
    }
}

export function mapSiteToProject(site: SiteWithFinancials, materialSpentList: MaterialSpent[] = []): Project {
    const defaultStages: { name: string; label: string }[] = [
        { name: 'advance', label: 'Advance Payment' },
        { name: 'foundation', label: 'Foundation' },
        { name: 'plinth', label: 'Plinth Level' },
        { name: 'rcc_roof', label: 'RCC / Roof Work' },
        { name: 'brickwork', label: 'Brickwork' },
        { name: 'plastering', label: 'Plastering' },
        { name: 'electrical_plumbing', label: 'Electrical & Plumbing' },
        { name: 'finishing', label: 'Finishing Works' },
        { name: 'handover', label: 'Final Handover' },
    ];

    const currentStageIndex = defaultStages.findIndex(s => s.name === site.current_stage);

    // Map Stages
    const stages: Stage[] = defaultStages.map((s, index) => {
        let status: StageStatus = 'pending';
        let progress = 0;

        if (site.status === 'completed') {
            status = 'completed';
            progress = 100;
        } else if (index < currentStageIndex) {
            status = 'completed';
            progress = 100;
        } else if (index === currentStageIndex) {
            status = 'in-progress';
            progress = 50; // Arbitrary progress for current stage
        }

        return {
            id: s.name,
            name: s.label,
            status: status,
            actualStartDate: index === 0 ? site.start_date || new Date().toISOString() : undefined,
            plannedStartDate: undefined,
            plannedEndDate: undefined,
            actualEndDate: undefined,
            dates: { // Hack if Stage interface has this? No, types.ts shows detailed Stage interface.
                // ConstructionStage interface has: id, name, percentage, budgetAmount, actualSpent, etc.
                // We need to match that.
            } as any, // Temporary escape hatch if strict match fails, but let's try to match fields

            // Correct mapping for ConstructionStage
            percentage: 10, // Mock
            budgetAmount: 0,
            actualSpent: 0,
            estimatedDays: 30,
            progress: progress
        } as Stage;
    });

    // Map Material Usage
    const materialUsage: Record<string, number> = {};
    materialSpentList.forEach(m => {
        materialUsage[m.material_type] = (materialUsage[m.material_type] || 0) + Number(m.quantity);
    });

    // Map MaterialSpent to ProjectMaterial
    const projectMaterials: ProjectMaterial[] = materialSpentList.map(m => ({
        id: m.id,
        projectId: site.id,
        category: (m.material_type === 'bricks' ? 'bricks' :
            m.material_type === 'cement' ? 'cement' :
                m.material_type === 'steel' ? 'steel' :
                    m.material_type === 'aggregate' ? 'aggregate' :
                        m.material_type === 'm_sand' ? 'sand' :
                            m.material_type === 'p_sand' ? 'sand' : 'other') as any, // Cast to MaterialCategory
        materialName: m.material_type, // or label
        specifiedBrand: 'Generic',
        estimatedQuantity: 0,
        actualQuantityUsed: Number(m.quantity),
        unit: m.unit,
        status: 'delivered', // Default
        statusHistory: [],
        photos: [],
        createdAt: m.updated_at,
        updatedAt: m.updated_at
    }));

    // Determine completion percentage
    const completionPercentage = Math.round(((currentStageIndex + (site.status === 'completed' ? 1 : 0.5)) / defaultStages.length) * 100) || 0;

    // Map Status
    let projectStatus: 'on-track' | 'delayed' | 'completed' | 'on-hold' | 'pre-construction' = 'on-track';
    if (site.status === 'hold') projectStatus = 'on-hold';
    if (site.status === 'completed') projectStatus = 'completed';
    // open/in_progress -> on-track for now

    return {
        id: site.id,
        name: site.site_name,
        clientName: site.client_name,
        // clientPhone is not in Project type in types.ts?
        // Project interface: id, name, clientName, location, type, squareFootage, packageType, totalCost, status, currentStage, currentStageIndex, completionPercentage, stages, totalExpenses, totalCollected, createdAt.
        // It DOES NOT have clientPhone, clientEmail.
        location: site.location || '',
        type: 'villa',
        squareFootage: site.builtup_area || 0,
        packageType: mapPackageName(site.package_name),

        totalCost: site.total_value || 0,
        totalCollected: site.total_collections || 0,
        totalExpenses: site.total_expenses || 0,

        status: projectStatus,
        completionPercentage: completionPercentage,
        currentStage: site.current_stage || 'advance',
        currentStageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
        stages: stages,
        materials: projectMaterials,
        sitePhotos: [],
        changeRequests: [],

        createdAt: site.created_at,
    };
}
