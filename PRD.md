# Planning Guide

A comprehensive construction management system for ElanjaiBuildos that streamlines project tracking, expense monitoring, client communication, material estimation, and labor attendance & wage management across multiple roles (Owner, Admin, Site Manager, Client).

**Experience Qualities**: 
1. **Comprehensive** - Full-featured construction management with role-based dashboards, project tracking, material estimator, labor tracking, and real-time updates
2. **Professional** - Business-grade interface designed for construction professionals with precise data handling and financial tracking
3. **Accessible** - Role-specific views ensure each user sees exactly what they need - from high-level owner analytics to on-site material calculations and daily labor attendance

**Complexity Level**: Complex Application (advanced functionality with multiple views)
This is a complete construction ERP system with multiple user roles, financial tracking, material management, quotation generation, expense tracking, photo documentation, material quantity estimator, and comprehensive labor attendance & wage tracking. The app manages complete project lifecycles with budget alerts, stage-wise tracking, client portals, and payment processing.

## Essential Features

**Role-Based Access Control**
- Functionality: Four distinct user roles (Owner, Admin, Site Manager, Client) with tailored dashboards and permissions
- Purpose: Ensures users see relevant information and can perform actions appropriate to their role
- Trigger: User selects role from navbar dropdown
- Progression: Select role → View switches to role-specific dashboard → Access role-appropriate features
- Success criteria: Each role displays correct dashboard, hides/shows appropriate navigation items, and maintains separation of concerns

**Material Quantity Estimator (New Integration)**
- Functionality: On-demand calculator accessible to Admin, Owner, and Site Manager for calculating construction material requirements
- Purpose: Empowers on-site decision making with accurate material estimates to prevent shortages and over-ordering
- Trigger: Click "Material Estimator" tab in navigation (visible to Admin, Owner, Site Manager roles only)
- Progression: Navigate to estimator → Select task type → Enter dimensions → View calculated materials → Save to history
- Success criteria: Calculator appears as dedicated tab, calculations save to persistent history, results show industry-standard formulas for 8 construction tasks (brickwork, plastering, flooring, concrete)

**Labor Attendance & Wage Tracker (New Integration)**
- Functionality: Mobile-first tool for tracking daily labor attendance, calculating wages automatically, and managing payment approvals
- Purpose: Streamlines workforce management from daily attendance marking to weekly payment processing with advance tracking
- Trigger: Click "Labor & Attendance" tab in navigation (visible to Admin, Owner, Site Manager roles only)
- Progression: Today tab: Mark attendance with quick toggles → Weekly tab: Review attendance grid and wage summary → Workers tab: Manage worker profiles and record advances → Payments tab: Generate payment summaries and process approvals
- Success criteria: 4-tab interface (Today, Weekly, Workers, Payments), persistent worker database, automatic wage calculations, advance balance tracking, payment approval workflow, mobile-optimized attendance marking

**Project Creation from Signed Quotation (New Integration)**
- Functionality: Convert signed quotations into active construction projects with block/unit configuration for apartments, stage-wise budget allocation, and automatic quotation status updates
- Purpose: Seamless transition from sales to project execution, establishing project structure, timelines, and financial tracking from signed agreements
- Trigger: Click "Create Project" action from quotation dropdown menu (only visible for quotations with "Signed" status)
- Progression: Select signed quotation → Auto-fill project details (name, type, location) → Configure blocks/units (for apartments) → Review stage configuration → Set start date → Create project → Quotation marked as "Converted"
- Success criteria: Project creation form with editable project name (auto-suggested as "[Client] - [Location]"), project type inherited from quotation, date picker for start date, auto-calculated completion date from stage durations, apartment projects show block/unit configuration with unit preview, individual homes default to 1 block/1 unit (hidden from UI), stage shared/individual toggle for apartments, created project appears in project list with "Pre-Construction" status, quotation status updates to "Converted" with linked project ID

**Construction Stages & Payment Schedule (New Integration)**
- Functionality: Configure the 15 standard construction stages with custom cost percentages, timelines, and payment milestones
- Purpose: Establishes detailed payment schedule aligned with construction phases, enabling milestone-based billing and timeline planning
- Trigger: Click "Construction Stages" tab in navigation (visible to Admin and Owner roles only)
- Progression: View default 15 stages → Customize stage names, percentages, and durations → Set advance and retention terms → Review Gantt timeline → Validate 100% total → Proceed to agreement generation
- Success criteria: Editable table with inline validation, real-time percentage calculation, visual Gantt chart showing sequential timeline, payment terms configuration (advance/retention), reset to defaults functionality, proceed only when total = 100%

**Document Generation - Construction Agreement (New Feature)**
- Functionality: Generate formal, printable Construction Agreement in A4 paper format matching the real quotation template with company letterhead, detailed specifications, brand names, electrical provisions, payment schedule, and signature blocks
- Purpose: Creates legally-formatted construction agreements from finalized quotations for client signatures and project initiation
- Trigger: Complete material customization flow → System automatically generates agreement preview
- Progression: View agreement preview with all sections → Download as PDF or Print → Edit quotation if changes needed → Mark as signed & create project to transition to active project management
- Success criteria: A4-formatted document with professional styling, company header (ELANJAI BUILDOS contact details), project details section, package-specific specifications across 7 work categories, brand names table, payment schedule matching construction stages, terms & conditions, dual signature blocks, clean print/PDF output, proper page breaks for multi-page documents

**Settings & Master Data Configuration (New Feature)**
- Functionality: Comprehensive configuration interface for managing company profile, construction packages, materials, brands, stage templates, and extra work items - all master data used throughout the application
- Purpose: Centralized control panel for admins to customize business rules, maintain accurate material/brand databases, configure pricing structures, and ensure all quotations and agreements use current company information
- Trigger: Click "Settings" tab in navigation (visible to Admin and Owner roles only)
- Progression: Select settings category (Company/Packages/Materials/Brands/Stages/Extra Works) → View current configuration → Add/Edit/Delete entries → Save changes → Configuration applied across all new quotations and projects
- Success criteria: 6-tab interface (Company Profile, Package Configuration, Material Master, Brand Master, Stage Template, Extra Works Master), company profile with logo upload used in agreements, editable package rates and highlights, CRUD operations for materials with tier-based pricing, CRUD operations for brands with category/tier associations and usage tracking, editable 15-stage template with percentage validation (must total 100%), CRUD operations for extra work items with default enable/disable, all changes persist via useKV and reflect in quotation generation, material estimator, and agreement documents

**Owner Dashboard**
- Functionality: High-level portfolio view showing active sites, financial KPIs, project statuses, and quotation generation
- Purpose: Strategic oversight of all projects with ability to create new quotations and dive into project details
- Trigger: Owner role selected
- Progression: View KPIs → Review project table → Click "View Details" or "Create Quotation"
- Success criteria: Displays active sites count, collections, expenses, net margin, project table with progress bars

**Admin Dashboard**
- Functionality: System-wide analytics, material inventory tracking, collection management, and project metrics
- Purpose: Operational control with financial tracking and material stock monitoring
- Trigger: Admin role selected
- Progression: View overview metrics → Switch to inventory tab → Add payments to projects
- Success criteria: Shows total projects, revenue, collection rate, profit, material norms, project breakdown

**Site Manager Daily Entry**
- Functionality: Mobile-optimized form for entering daily labor, materials, petty cash, and uploading site photos
- Purpose: Captures on-site data daily to track actual expenses against budgets
- Trigger: Site Manager role selected
- Progression: Select project → Add labor entries → Add material entries → Add petty cash → Upload photos → Submit report
- Success criteria: All entries update project expenses, photos save to gallery, form resets after submission

**Client Portal**
- Functionality: Read-only view showing project progress, payment milestones, construction stages, and site photo gallery
- Purpose: Transparency and trust-building by keeping clients informed of progress
- Trigger: Client role selected
- Progression: View project overview → Review stage timeline → Browse photo gallery → Check payment schedule
- Success criteria: Shows completion percentage, current stage, recent activity, payment milestones, photo gallery

**Project Detail View**
- Functionality: Deep-dive into single project with stage breakdown, expense tracking, budget alerts, and financial summary
- Purpose: Detailed analysis and management of individual projects
- Trigger: Click "View Details" from Owner Dashboard
- Progression: Select project → View stages → Review expenses per stage → Check budget alerts → Return to dashboard
- Success criteria: Displays all 15 construction stages, actual vs budget spend, expense breakdowns, alert badges

## Edge Case Handling

- **Empty Projects State**: When no projects exist, dashboards show helpful empty states with call-to-action to create first quotation
- **Material Estimator History Empty**: Shows centered "No calculations yet" message with icon when history is empty
- **Labor Tracker Empty States**: Shows guidance messages when no workers exist, prompting to add first worker
- **Project Creation from Converted Quotations**: "Create Project" action only appears for quotations with "Signed" status; already converted quotations show "Converted to Project" badge and cannot be converted again
- **Individual Home Configuration**: For individual home projects, system defaults to 1 Block ("Main") and 1 Unit ("Unit 1") without showing configuration UI, maintaining data consistency
- **Apartment Unit Configuration**: Validates that all blocks have at least 1 unit before allowing project creation; shows helpful unit preview with proper unit naming (A101, A102, B101, etc.)
- **Role-Specific Navigation**: Material Estimator and Labor & Attendance tabs only appear for Admin, Owner, Site Manager; Construction Stages and Settings only for Admin and Owner (hidden for Client role)
- **Settings Validation**: Stage template percentage total must equal exactly 100% before saving; material rates must be non-negative; brand categories must match existing material categories
- **Logo Upload**: Supports common image formats (JPG, PNG, GIF); stores as base64 for easy embedding in generated agreements; displays preview after upload
- **Master Data Dependencies**: Deleting a brand shows warning if it's referenced in active projects; deleting materials requires confirmation; default packages cannot be fully removed (can only be edited)
- **Missing Project Data**: Handles optional fields (createdAt, sitePhotos, collections) gracefully with fallback UI
- **Invalid Stage Percentages**: Shows critical badge and blocks proceed button when total percentage ≠ 100%, with clear validation message
- **Budget Overruns**: Critical and warning alerts displayed prominently when stage expenses exceed thresholds (85%, 100%)
- **Future Date Restrictions**: Labor attendance cannot be marked for future dates with clear validation messages
- **Advance Balance Management**: Automatically deducts advances from weekly payments and tracks running balances
- **Large Numbers**: Financial figures formatted appropriately (₹2.5L, ₹1.2Cr) with proper Indian currency notation

## Design Direction

The design should evoke **professionalism, trust, and industrial strength** - think corporate construction software meets modern SaaS. The red accent color (borrowed from construction safety aesthetics) commands attention for primary actions while neutral grays create a calm, data-focused environment. The interface should feel authoritative and business-grade with clear hierarchy and generous spacing.

## Color Selection

A professional palette anchored by construction-industry red accents against clean whites and cool grays, inspired by corporate construction branding and safety signage.

- **Primary Color**: `oklch(0.577 0.245 27.325)` - Construction Red for primary actions, buttons, and brand elements (conveys urgency and importance)
- **Secondary Colors**: 
  - Background: `oklch(0.97 0.005 264)` - Cool light gray for page backgrounds
  - Card: `oklch(1 0 0)` - Pure white for elevated card surfaces
  - Muted: `oklch(0.95 0.005 264)` - Subtle gray for secondary backgrounds
- **Accent Color**: `oklch(0.646 0.16 165)` - Emerald green for success states, positive metrics, and completed stages
- **Foreground/Background Pairings**:
  - Primary Red: White text (#FFFFFF) - Ratio 5.2:1 ✓
  - Background: Slate text `oklch(0.556 0.015 264)` - Ratio 6.8:1 ✓
  - Accent Green: White text (#FFFFFF) - Ratio 4.9:1 ✓
  - Cards: Slate text on white - Ratio 7.2:1 ✓

## Font Selection

Typography should be **modern, professional, and highly legible** appropriate for business software handling financial data and construction specifications.

- **Typographic Hierarchy**:
  - H1 (Page Headers): Space Grotesk Bold / 32px / -0.02em tight tracking
  - H2 (Section Titles): Space Grotesk Bold / 24px / -0.01em
  - H3 (Card Titles): Space Grotesk SemiBold / 20px / normal
  - Body Text: Inter Medium / 16px / normal (labels, content)
  - Small Text: Inter Regular / 14px / normal (metadata, captions)
  - Numbers/Data: JetBrains Mono Bold / 18-24px / tabular-nums for financial figures

## Animations

Animations should **provide clear feedback without impeding workflow** - focus on subtle state transitions and micro-interactions rather than decorative flourishes.

Key animations: Tab switching with smooth content fade (200ms), button press feedback (100ms scale), progress bar fills when data loads (400ms ease-out), success toast notifications sliding in (300ms), budget alert badges pulsing when critical (gentle 2s loop)

## Component Selection

- **Components**:
  - `Card`: Primary content containers throughout all views (with subtle shadows)
  - `Tabs`: Navigation within Admin Dashboard (Overview/Inventory), Material Estimator (Calculator/History), Labor Tracker (Today/Weekly/Workers/Payments)
  - `Table`: Project lists, calculation history, expense tracking, weekly attendance grids, payment summaries (responsive with mobile card fallback)
  - `Select`: Role switcher in navbar, project selection, task type in estimator, worker type selection
  - `Button`: Primary red for main actions, outline/ghost for secondary, icon-only for utilities
  - `Badge`: Status indicators (on-track/delayed/completed), budget alerts, material scale levels, attendance status (P/H/A/L), worker types, payment status
  - `Popover`: Notifications dropdown in navbar, calendar date picker
  - `Dialog`: Quotation creation, collection entry, expense entry, worker management, advance payment recording
  - `Progress`: Linear bars for project completion, stage budgets
  - `Input`: Form fields throughout (labor entry, material entry, dimension inputs, wage amounts)
  - `Switch`: Quick attendance toggle for workers
  - `Avatar`: Worker profile display with initials
  - `Calendar`: Date selection for attendance marking and week navigation
  - Stages table: Inline editable inputs for stage name, percentage, and days with real-time amount calculation

- **Customizations**:
  - Navigation tabs: Horizontal tabs with red underline indicator for active state, hidden on mobile
  - Material estimator results: Custom card layout with material name left, quantity right, progress bar beneath
  - Project table: Custom progress bars inline with percentage display
  - Site photos: Custom gallery grid with overlay captions and delete functionality

- **States**:
  - Buttons: Default red, hover darker red, active scale(0.98), disabled gray 50% opacity
  - Tab navigation: Default gray text/transparent border, active red text/red border-bottom
  - Inputs: Default gray border, focus red ring, error state red border + message
  - Cards: Default white, hover subtle shadow increase on interactive cards

- **Icon Selection** (Phosphor Icons):
  - Navigation: `HardHat` (logo), `Bell` (notifications), `User` (role selector)
  - Dashboards: `ChartLineUp`, `Money`, `TrendUp`, `Package`
  - Actions: `Plus` (add/create), `Trash` (delete), `Camera` (photos), `PencilSimple` (edit)
  - Estimator: `Calculator`, `ClockCounterClockwise` (history)
  - Labor: `CheckCircle` (present), `MinusCircle` (half-day), `XCircle` (absent), `AirplaneTakeoff` (leave), `CalendarBlank` (date picker), `CaretLeft`/`CaretRight` (navigation), `CheckSquare` (mark all), `CopySimple` (copy)
  - Stages: `ArrowLeft` (back navigation), `WarningCircle` (invalid percentage), `CheckCircle` (valid configuration)
  - Status: `CheckCircle` (complete), `Clock` (in-progress), `Warning` (alerts)

- **Spacing**:
  - Container padding: `px-4 py-8` for main content areas
  - Card internal: `p-6` standard, `p-8` for hero cards
  - Grid gaps: `gap-4` for tight grids, `gap-6` for section spacing
  - Stack spacing: `space-y-6` between major sections

- **Mobile**:
  - Navigation tabs: Horizontal scroll with overflow on small screens
  - Tables: Transform to stacked card layout <768px
  - Estimator: Full-width single column, large touch targets (44px minimum)
  - Labor Attendance: Large touch targets for status buttons, stacked worker cards, sticky date header
  - Navbar: Condensed text, icon-only buttons, role select narrower
  - Grids: Single column stack on mobile for all dashboard KPI cards
  - Tabs: Full-width grid layout on mobile (4-column for labor tabs)
