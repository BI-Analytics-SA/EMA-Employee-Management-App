# Roles & Permissions

This document defines the roles available in the Employee Management App and exactly what each role can do. All role checks are enforced on both the backend (Convex mutations/queries) and the frontend (UI visibility).

---

## Role Hierarchy

Roles follow a hierarchy — higher roles inherit all permissions of lower roles.

| Level | Role      | Description                          |
|-------|-----------|--------------------------------------|
| 3     | **Admin** | Full access, organization management |
| 2     | **Manager** | Contract management + everything below |
| 1     | **User**  | Employee and document management     |

---

## Permission Matrix

| Feature                        | User | Manager | Admin |
|--------------------------------|:----:|:-------:|:-----:|
| **Employees**                  |      |         |       |
| View employee list             | Yes  | Yes     | Yes   |
| View employee details          | Yes  | Yes     | Yes   |
| Add new employee               | Yes  | Yes     | Yes   |
| Edit employee                  | Yes  | Yes     | Yes   |
| Delete employee                | Yes  | Yes     | Yes   |
| Capture employee photo         | Yes  | Yes     | Yes   |
| **Documents** *(module)*       |      |         |       |
| View employee documents        | Yes  | Yes     | Yes   |
| Upload documents               | Yes  | Yes     | Yes   |
| Delete documents               | Yes  | Yes     | Yes   |
| View expiring documents        | Yes  | Yes     | Yes   |
| **Contracts** *(module)*       |      |         |       |
| View contract list             | No   | Yes     | Yes   |
| View contract details          | No   | Yes     | Yes   |
| Create new contract            | No   | Yes     | Yes   |
| Edit contract                  | No   | Yes     | Yes   |
| Delete contract                | No   | Yes     | Yes   |
| **Settings**                   |      |         |       |
| View settings sidebar          | No   | No      | Yes   |
| Manage team members            | No   | No      | Yes   |
| Create/revoke invite codes     | No   | No      | Yes   |
| Manage document types          | No   | No      | Yes   |
| Toggle modules on/off          | No   | No      | Yes   |
| Configure contract template    | No   | No      | Yes   |
| Configure export columns       | No   | No      | Yes   |
| **Exporting** *(module)*       |      |         |       |
| Export employees to Excel      | Yes  | Yes     | Yes   |

---

## Role Details

### Admin

Full control over the organization. This is the role assigned to the user who creates the organization.

**Unique capabilities:**
- Access the Settings section in the sidebar
- Manage team members (change roles, deactivate, delete users)
- Create and revoke invite codes (assign any role to new invitees)
- Toggle add-on modules (Contracts, Documents, Export to Excel)
- Configure document types
- Configure the contract template (company name, heading, terms, employer signature)
- Configure export columns for Excel export

**Inherited capabilities:**
- Everything a Manager can do
- Everything a User can do

### Manager

Designed for team leads or supervisors who need to manage employee contracts.

**Unique capabilities:**
- Full access to the Contracts module (create, edit, delete contracts)

**Inherited capabilities:**
- Everything a User can do

### User

The base role for standard team members who manage employee records.

**Capabilities:**
- View and manage employees (add, edit, delete, capture photos)
- View and manage employee documents (upload, delete)
- View expiring documents dashboard
- Export employees to Excel (when exporting module is enabled)

---

## Module Interaction

Modules can be toggled on/off by Admins. When a module is disabled:
- Related navigation items are hidden from the sidebar for **all** roles
- Related buttons and UI elements are hidden throughout the app
- Related pages show a "module not enabled" message if accessed directly
- Backend queries for disabled modules are skipped

| Module         | What it controls                                                   |
|----------------|--------------------------------------------------------------------|
| **Contracts**  | Contract list, contract detail, new contract, contract template    |
| **Documents**  | Document uploads, expiry tracking, document types, expiry bell     |
| **Export to Excel** | Export button on employee list, export column configuration   |

---

## Invite System

Only Admins can create invite codes. When creating an invite, the Admin selects which role the new user will receive. The available roles for invitation are:

- **User** — Can manage employees
- **Manager** — Can manage contracts
- **Admin** — Full access

---

## Technical Implementation

- **Backend enforcement:** All mutations use `requireRole()` or `requireRoleInOrganization()` to verify the user has sufficient permissions before executing
- **Frontend visibility:** UI components check `isAdmin` and `isManager` from the `useCurrentUser()` hook to show/hide features
- **Module checks:** The `useModuleEnabled()` hook reads from `organization.settings.enabledModules` which is shared across all users in the organization
- **Default state:** New organizations start with all modules **off**
