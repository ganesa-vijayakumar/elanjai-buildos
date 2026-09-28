# ElanjaiBuildos - Construction Management System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC.svg)

**A comprehensive construction project management platform for residential construction companies**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Module Documentation](#module-documentation)

---

## Overview

ElanjaiBuildos is a full-featured construction management system designed for residential construction companies. It provides end-to-end project management capabilities including quotation generation, project tracking, labor management, material tracking, expense monitoring, and comprehensive reporting.

The application supports multiple user roles with role-based access control, ensuring each stakeholder sees only the relevant information and features.

---

## Features

### 🏠 Project Management
- Create and manage construction projects (Villa, Apartment, Duplex, Commercial)
- Track project status (Pre-construction, Foundation, Structure, Finishing, Handover, Completed)
- Monitor project progress with visual indicators
- Photo gallery for site documentation
- Budget vs actual expense tracking

### 📝 Smart Quotation Engine
- Package-based quotation system (Basic, Standard, Premium, Custom)
- Material customization per floor
- Electrical provisions configuration
- Extra works additions
- PDF/Print export for quotations
- Construction agreement document generation

### 👷 Labor & Attendance
- Worker registration and management
- Daily attendance tracking
- Worker type categorization (Mason, Helper, Electrician, Plumber, Carpenter, Painter, Bar Bender)
- Daily wage calculations
- Advance payment tracking

### 📦 Material Management
- Material estimation calculator
- Material inventory tracking
- Status tracking (Pending, Ordered, Delivered, Installed)
- Category-wise material organization
- Estimated vs actual usage comparison

### 💰 Expense Tracking
- Stage-wise expense recording
- Category classification (Labor, Material, Equipment, Transport, Other)
- Budget alerts and notifications
- Expense reports and summaries

### 📊 Reports & Analytics
- **Financial Overview**: Revenue vs expenses, profit margins, collections vs pending
- **Project Analytics**: Status distribution, progress comparison, package distribution
- **Quotation Insights**: Conversion funnel, monthly trends, value by package
- **Labor Analytics**: Worker distribution, wage trends, attendance patterns
- **Material Usage**: Category-wise usage, status breakdown, top materials
- Advanced search filters with custom date range
- CSV export functionality

### ⚙️ Configuration
- Construction stages configuration
- Electrical provisions setup
- Extra works management
- Company settings

---

## User Roles

| Role | Access Level | Features |
|------|-------------|----------|
| **Owner** | Full Access | All features including reports, settings, quotations, projects |
| **Admin** | Administrative | Project management, reports, quotations, labor, materials |
| **Site Manager** | Operational | Site-level project tracking, labor attendance, expense entry |
| **Client** | Limited | View own project progress, photos, payment status, change requests |

---

## Tech Stack

### Frontend Framework
- **React 19** - UI library with hooks
- **TypeScript 5.7** - Type-safe development
- **Vite 7** - Build tool and dev server

### UI Components
- **Radix UI** - Accessible component primitives (Dialog, Select, Tabs, Accordion, etc.)
- **Tailwind CSS 4** - Utility-first styling
- **Phosphor Icons** - Icon library
- **Framer Motion** - Animations

### Data Visualization
- **Recharts** - Charts library (Line, Bar, Pie, Area charts)
- **D3.js** - Data-driven documents

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation

### State Management
- **@github/spark** - KV storage hooks
- **TanStack React Query** - Server state management

### Utilities
- **date-fns** - Date manipulation
- **uuid** - Unique ID generation
- **clsx + tailwind-merge** - Class name utilities

---

## Project Structure

```
elanjaibuildos-con/
├── src/
│   ├── components/
│   │   ├── ui/                    # Reusable UI components (55 components)
│   │   ├── labor/                 # Labor management components
│   │   ├── project-dashboard/     # Project dashboard widgets
│   │   ├── settings/              # Settings modules
│   │   ├── AdminDashboard.tsx     # Admin dashboard view
│   │   ├── OwnerDashboard.tsx     # Owner dashboard view
│   │   ├── SiteManagerView.tsx    # Site manager view
│   │   ├── ClientPortal.tsx       # Client portal
│   │   ├── ReportsPage.tsx        # Reports & analytics
│   │   ├── SmartQuotationEngine.tsx # Quotation builder
│   │   ├── QuotationListView.tsx  # Quotation management
│   │   ├── MaterialTracking.tsx   # Material management
│   │   ├── MaterialEstimator.tsx  # Material calculator
│   │   ├── LaborAttendanceTracker.tsx # Attendance tracking
│   │   └── ... (36 component files)
│   ├── lib/
│   │   ├── types.ts               # TypeScript type definitions
│   │   ├── mockData.ts            # Mock data generators
│   │   └── utils.ts               # Utility functions
│   ├── hooks/
│   │   └── use-mobile.ts          # Mobile detection hook
│   ├── styles/
│   │   └── theme.css              # Theme variables
│   ├── App.tsx                    # Main application component
│   └── main.tsx                   # Entry point
├── public/                        # Static assets
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.js             # Tailwind configuration
└── vite.config.ts                 # Vite configuration
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd elanjaibuildos-con

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Module Documentation

### Quotation Management

The Smart Quotation Engine allows creating detailed construction quotations with:
- Land and building area specifications
- Floor-wise material selections
- Package-based pricing (Basic/Standard/Premium)
- Electrical provisions configuration
- Extra works additions
- Automatic cost calculations

**Quotation Status Flow:**
`Draft` → `Finalized` → `Sent` → `Signed` → `Converted` (to Project)

### Construction Stages

Default stages configured:
1. Excavation & Foundation
2. Plinth & PCC
3. Superstructure (Ground Floor)
4. Superstructure (First Floor)
5. Roofing & Terrace
6. Electrical & Plumbing
7. Plastering
8. Flooring & Tiling
9. Painting
10. Finishing & Handover

### Material Categories

- Cement, Steel, Sand, Bricks
- Electrical, Plumbing
- Tiles, Flooring
- Paint, Finishing materials

### Reports & Analytics

The Reports module provides comprehensive business intelligence with:
- **5 Report Categories**: Financial, Projects, Quotations, Labor, Materials
- **KPI Cards**: Key metrics with trend indicators
- **Interactive Charts**: Pie, Line, Bar, Area charts
- **Advanced Filters**: Tab-specific filtering with custom date ranges
- **Data Export**: CSV export for all report types

---

## License

This project is proprietary software for ElanjaiBuildos Construction.

---

<div align="center">

**Built with ❤️ for the Construction Industry**

</div>
