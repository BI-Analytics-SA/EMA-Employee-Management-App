# Retool to React Conversion Project

## Project Overview

This document serves as a starting point for converting a Retool application into a standalone React web application. The goal is to recreate the functionality, UI, and data integrations of the original Retool app as a production-ready React application.

---

## Prerequisites

Before beginning the conversion, please provide the following:

### Required
- [ ] **Toolscript ZIP Export** - Export your Retool app using: App actions menu → Export to Toolscript ZIP

### Recommended Context
- [ ] **Screenshots** of the Retool app (each page/view)
- [ ] **API Documentation** for any backend services the app connects to
- [ ] **Database Schema** if the app connects to databases
- [ ] **Authentication Details** - How users currently log in (SSO, email/password, etc.)
- [ ] **User Roles/Permissions** - Any RBAC requirements

### Questions to Answer

1. **What does this app do?** (Brief description of purpose and main workflows)
2. **Who uses it?** (Internal team, customers, partners?)
3. **What data sources does it connect to?** (REST APIs, PostgreSQL, MongoDB, etc.)
4. **Are there any external integrations?** (Stripe, Slack, email services, etc.)
5. **What's the expected deployment target?** (Vercel, Netlify, AWS, Azure, self-hosted?)
6. **Any specific design requirements?** (Brand colours, existing design system?)
7. **Do you need mobile responsiveness?**
8. **What's the authentication requirement?** (Public, internal SSO, custom auth?)

---

## Conversion Methodology

### Phase 1: Analysis & Planning
1. Extract and analyse the Toolscript ZIP structure
2. Inventory all components, queries, and transformers
3. Map data flows and state management patterns
4. Identify external dependencies and integrations
5. Create a component hierarchy diagram

### Phase 2: Project Setup
1. Initialise React project with chosen tech stack
2. Configure routing structure
3. Set up authentication scaffolding
4. Configure API client/data fetching layer
5. Establish component library and theming

### Phase 3: Component Development
1. Convert layout containers and navigation
2. Build reusable UI components
3. Implement forms and inputs
4. Create data display components (tables, charts, lists)
5. Add modals, drawers, and overlays

### Phase 4: Data Layer
1. Convert Retool queries to API calls
2. Implement React Query/data fetching hooks
3. Recreate JavaScript transformers as utility functions
4. Set up state management for complex flows
5. Handle caching and optimistic updates

### Phase 5: Integration & Polish
1. Wire up all data connections
2. Implement error handling and loading states
3. Add form validation
4. Implement user feedback (toasts, notifications)
5. Responsive design adjustments
6. Performance optimisation

### Phase 6: Testing & Deployment
1. Component testing
2. Integration testing
3. Build configuration
4. Deployment setup

---

## Toolscript File Structure Reference

When you extract the Toolscript ZIP, expect this structure:

```
/apps/
  /[app-name]/
    ├── main.rsx              # Primary component layout and hierarchy
    ├── functions.rsx         # Reusable functions (if defined)
    ├── .retool/              # Auto-generated positioning and metadata
    │   ├── .main.rsx.json    # Position/size data for main.rsx
    │   └── ...
    ├── /lib/                 # Extracted query and script files
    │   ├── query1.sql        # SQL queries
    │   ├── transformer1.js   # JavaScript transformers
    │   └── ...
    └── /src/                 # Extracted component definitions
        ├── container1.rsx    # Large component groups
        └── ...
```

### Key Files to Analyse
- **main.rsx** - Contains the component tree and layout structure
- **/lib/*.sql** - All SQL queries (need backend API endpoints)
- **/lib/*.js** - JavaScript logic (convert to React utilities/hooks)
- **functions.rsx** - Reusable app-level functions

---

## Component Mapping Reference

### Layout Components
| Retool | React Equivalent | Notes |
|--------|------------------|-------|
| Container | `<div>` + Flexbox/Grid | Use CSS modules or Tailwind |
| Tabs Container | MUI Tabs / Headless UI Tabs | |
| Modal | MUI Dialog / Headless UI Dialog | |
| Drawer | MUI Drawer | |
| Sidebar Frame | Fixed sidebar layout | |
| Header Frame | Fixed header component | |

### Input Components
| Retool | React Equivalent | Notes |
|--------|------------------|-------|
| Text Input | `<input>` / MUI TextField | |
| Number Input | `<input type="number">` | Add formatting as needed |
| Text Area | `<textarea>` / MUI TextField multiline | |
| Select | React Select / MUI Select | |
| Multiselect | React Select isMulti | |
| Checkbox | `<input type="checkbox">` / MUI Checkbox | |
| Switch | MUI Switch | |
| Date Picker | MUI DatePicker / react-datepicker | |
| Date Range | MUI DateRangePicker | |
| File Upload | react-dropzone / native input | |
| Rich Text Editor | TipTap / Slate / React Quill | |

### Display Components
| Retool | React Equivalent | Notes |
|--------|------------------|-------|
| Table | TanStack Table / AG Grid / MUI DataGrid | Most complex conversion |
| Text | `<p>`, `<span>`, `<h1>`-`<h6>` | |
| Statistic | Custom component | |
| Image | `<img>` / Next Image | |
| Avatar | MUI Avatar | |
| Icon | Lucide React / MUI Icons | |
| Progress | MUI Progress | |
| Badge | MUI Badge / Chip | |
| Alert | MUI Alert | |
| Timeline | MUI Timeline | |

### Action Components
| Retool | React Equivalent | Notes |
|--------|------------------|-------|
| Button | `<button>` / MUI Button | |
| Button Group | MUI ButtonGroup | |
| Link | React Router Link / `<a>` | |
| Menu | MUI Menu / Headless UI Menu | |

### Data Visualisation
| Retool | React Equivalent | Notes |
|--------|------------------|-------|
| Chart | Recharts / Chart.js / Nivo | |
| Map | React Leaflet / Google Maps React | |
| JSON Explorer | react-json-view | |

### Form Handling
| Retool | React Equivalent | Notes |
|--------|------------------|-------|
| Form | React Hook Form + Zod | |
| Form validation | Zod / Yup schemas | |
| Form state | React Hook Form state | |

---

## Data Layer Mapping

### Query Types
| Retool Query Type | React Implementation |
|-------------------|---------------------|
| REST API | Axios/Fetch + React Query |
| SQL Query | Backend API endpoint + React Query |
| GraphQL | Apollo Client / urql |
| JavaScript Query | Custom hook / utility function |
| Transformer | Utility function / computed value |

### State Types
| Retool State | React Implementation |
|--------------|---------------------|
| Temporary State | `useState` / `useReducer` |
| URL Parameters | React Router `useSearchParams` |
| Local Storage | `useLocalStorage` hook |
| App State | Zustand / Jotai / Context |

### Event Handlers
| Retool Event | React Implementation |
|--------------|---------------------|
| onClick | `onClick` prop |
| onChange | `onChange` prop + controlled component |
| onSubmit | Form `onSubmit` + React Hook Form |
| onRowClick (Table) | Table row click handler |
| onSuccess (Query) | React Query `onSuccess` callback |
| onFailure (Query) | React Query `onError` callback |

---

## Recommended Tech Stack

### Option A: Modern Lightweight (Recommended for most cases)
```
Framework:      Vite + React 18 + TypeScript
Routing:        React Router v6
UI Library:     Shadcn/ui (Radix + Tailwind)
Styling:        Tailwind CSS
Data Fetching:  TanStack Query (React Query)
Forms:          React Hook Form + Zod
Tables:         TanStack Table
State:          Zustand (if needed)
Icons:          Lucide React
```

### Option B: Enterprise/Feature-Rich
```
Framework:      Next.js 14+ (App Router)
Routing:        Next.js built-in
UI Library:     MUI (Material UI) v5
Styling:        MUI + Emotion
Data Fetching:  TanStack Query
Forms:          React Hook Form + Yup
Tables:         MUI DataGrid Pro (or AG Grid)
State:          Zustand / Redux Toolkit
Icons:          MUI Icons
```

### Option C: Admin Dashboard Focused
```
Framework:      Refine.dev (built on React)
UI Library:     Ant Design or MUI
Data Fetching:  Built-in data providers
Tables:         Built-in with filtering/sorting
Auth:           Built-in auth providers
```

---

## Project Structure Template

```
/src
├── /components          # Reusable UI components
│   ├── /ui              # Base UI components (buttons, inputs, etc.)
│   ├── /forms           # Form components
│   ├── /tables          # Table components
│   └── /layout          # Layout components (header, sidebar, etc.)
├── /features            # Feature-based modules
│   ├── /dashboard
│   ├── /users
│   └── /[feature-name]
├── /hooks               # Custom React hooks
│   ├── useAuth.ts
│   └── useApi.ts
├── /lib                 # Utilities and helpers
│   ├── api.ts           # API client configuration
│   ├── utils.ts         # Utility functions
│   └── validators.ts    # Zod/Yup schemas
├── /services            # API service functions
│   └── userService.ts
├── /stores              # State management (if using Zustand)
├── /types               # TypeScript type definitions
├── /styles              # Global styles
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── routes.tsx           # Route definitions
```

---

## Conversion Checklist

### Initial Setup
- [ ] Create React project with chosen stack
- [ ] Configure TypeScript
- [ ] Set up linting (ESLint) and formatting (Prettier)
- [ ] Install UI component library
- [ ] Configure Tailwind CSS (if using)
- [ ] Set up React Router
- [ ] Configure React Query

### Authentication
- [ ] Implement auth provider/context
- [ ] Create login page
- [ ] Add protected route wrapper
- [ ] Handle token storage and refresh
- [ ] Implement logout functionality

### Layout
- [ ] Create main layout component
- [ ] Build header/navigation
- [ ] Build sidebar (if applicable)
- [ ] Implement responsive breakpoints

### Core Features
- [ ] Convert each Retool page to React route
- [ ] Implement all data fetching hooks
- [ ] Build form components with validation
- [ ] Create table components with sorting/filtering
- [ ] Add loading and error states

### Polish
- [ ] Add toast notifications
- [ ] Implement confirmation dialogs
- [ ] Add keyboard shortcuts (if applicable)
- [ ] Optimise bundle size
- [ ] Add error boundaries

### Deployment
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline
- [ ] Configure production build
- [ ] Deploy to hosting platform

---

## Getting Started

When you're ready to begin the conversion:

1. **Upload the Toolscript ZIP file** to the conversation
2. **Provide answers** to the questions in the Prerequisites section
3. **Share any screenshots** of the current Retool app
4. **Specify your preferred tech stack** from the options above (or describe your requirements)

I will then:
1. Analyse the Toolscript structure
2. Create a detailed component and query inventory
3. Propose a specific implementation plan
4. Begin generating React code iteratively

---

## Notes

- The conversion is not a 1:1 automated process; it requires understanding the app's purpose and adapting patterns to React best practices
- Some Retool-specific features may need alternative implementations
- Backend API endpoints may need to be created for SQL queries that Retool handled directly
- Authentication flows often need the most customisation

---

*Document created: February 2025*
*For use with Claude AI for Retool → React conversion assistance*
