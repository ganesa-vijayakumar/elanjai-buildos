# Project Creation from Signed Quotation - Feature Documentation

## Overview
This feature enables seamless conversion of signed quotations into active construction projects with comprehensive configuration options for different building types.

## How to Use

### 1. Accessing the Feature
1. Navigate to the **Quotations** tab (visible to Admin and Owner roles)
2. Locate a quotation with **"Signed"** status (example: Q-2025-002 or Q-2025-008)
3. Click the three-dot menu (⋮) in the Actions column
4. Select **"Create Project"** from the dropdown menu

### 2. Project Creation Form

#### Basic Information
- **Project Name**: Auto-suggested as "[Client Name] - [Location]", but fully editable
- **Project Type**: Inherited from the quotation (Individual Home, Duplex, Villa, Apartment, Commercial)
- **Planned Start Date**: Date picker to set project start
- **Expected Completion**: Auto-calculated based on stage durations (~180 days)

#### For Individual Home Projects
- System automatically configures:
  - 1 Block (named "Main")
  - 1 Unit (named "Unit 1")
- This is handled behind the scenes for data consistency
- No additional configuration needed

#### For Apartment Projects
1. **Number of Blocks**: Choose 1-8 blocks
2. **Block Configuration**: For each block:
   - Block name is auto-assigned (Block A, Block B, etc.)
   - Specify number of units per block
   - Unit IDs are auto-generated (A101, A102, B101, etc.)
3. **Stage Configuration**: Toggle stages between:
   - **Shared**: Tracked once for all units (e.g., Foundation, Structure)
   - **Per Unit**: Tracked individually for each unit (e.g., Flooring, Painting)

#### Initial Status
- All new projects start with **"Pre-Construction"** status
- Status will update as the project progresses through stages

### 3. What Happens When You Create a Project

1. **New Project Created**:
   - Generates unique Project ID (e.g., P-2025-001)
   - Copies quotation details (client name, location, square footage)
   - Creates 13 construction stages with budget allocation
   - Sets initial status to "Pre-Construction"

2. **Quotation Updated**:
   - Status changes from "Signed" to **"Converted"**
   - Links to the created project
   - Cannot be converted again (prevents duplicates)

3. **Budget Allocation**:
   - Total contract value split across 13 stages
   - Each stage gets percentage-based budget
   - Stages: Foundation (10%), Plinth Beam (5%), Column (8%), Brickwork (15%), etc.

## Data Structure

### Project with Blocks and Units
```json
{
  "project": {
    "id": "P-2025-001",
    "name": "Kumar Villa - Old Pallavaram",
    "quotationId": "Q-2025-001",
    "type": "individual_home",
    "status": "pre_construction",
    "startDate": "2025-05-01",
    "expectedCompletion": "2025-10-28",
    "contractValue": 3600000,
    "stages": [
      {
        "id": "stage-1",
        "name": "Foundation",
        "percentage": 10,
        "budgetAmount": 360000,
        "actualSpent": 0,
        "status": "pending"
      }
    ]
  }
}
```

### For Apartment Projects
```json
{
  "blocks": [
    {
      "blockId": "block_a",
      "name": "Block A",
      "units": [
        { "unitId": "block_a_unit_1", "name": "A101", "ownerName": "", "status": "active" },
        { "unitId": "block_a_unit_2", "name": "A102", "ownerName": "", "status": "active" }
      ]
    },
    {
      "blockId": "block_b",
      "name": "Block B",
      "units": [
        { "unitId": "block_b_unit_1", "name": "B101", "ownerName": "", "status": "active" }
      ]
    }
  ]
}
```

## Testing the Feature

### Mock Data Available
Two signed quotations are available for testing:

1. **Q-2025-002** - Mrs. Priya
   - Type: Duplex
   - Location: Tambaram
   - Value: ₹61,60,000
   - Perfect for testing duplex/villa project creation

2. **Q-2025-008** - Mr. Rajesh
   - Type: Apartment
   - Location: OMR, Chennai
   - Value: ₹1,40,00,000
   - Perfect for testing apartment block/unit configuration

### Test Scenarios

1. **Individual Home**: Convert a quotation and verify single block/unit is hidden
2. **Apartment Complex**: 
   - Set 3 blocks
   - Configure 4, 6, and 8 units respectively
   - Verify unit preview shows correct unit IDs
   - Toggle stage shared/individual settings
3. **Validation**: Try creating project without configuring units for apartments
4. **Date Calculation**: Change start date and see completion date update

## Key Features

✅ **Automatic Data Mapping**: Quotation details flow seamlessly into project  
✅ **Smart Defaults**: Individual homes auto-configure with minimal input  
✅ **Flexible Configuration**: Apartments support complex block/unit structures  
✅ **Budget Allocation**: Contract value automatically distributed across stages  
✅ **Status Tracking**: Quotation and project statuses stay synchronized  
✅ **Validation**: Prevents duplicate conversions and validates required fields  

## Future Enhancements

- Material customization transfer from quotation to project
- Electrical provisions configuration
- Payment milestone setup during project creation
- Auto-assignment of unit owners for sold apartments
- Stage timeline Gantt chart visualization
