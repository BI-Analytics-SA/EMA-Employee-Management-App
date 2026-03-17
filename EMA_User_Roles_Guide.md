# EMA – Employee Management App
## User Roles & Permissions Guide

---

## Introduction

The EMA platform uses a **three-tier role system** to control what each user can see and do within the application. This ensures that staff have access to the features they need, while sensitive administrative functions remain restricted to authorised personnel.

Every user is assigned one of three roles when they are invited to the platform:

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | Full access including user management and all settings | Highest |
| **Manager** | Employee management plus full contract management | Middle |
| **User** | Core employee and document management (read-only contracts) | Standard |

Roles can be changed at any time by an Admin from the Settings area of the platform.

---

## Permissions Overview

| Feature / Action | User | Manager | Admin |
|---|:---:|:---:|:---:|
| View Employees | ✓ | ✓ | ✓ |
| Add / Edit / Delete Employees | ✓ | ✓ | ✓ |
| Add / Edit / Delete Employee Documents | ✓ | ✓ | ✓ |
| View Contracts | ✓ *(read-only)* | ✓ | ✓ |
| Create / Edit / Delete Contracts | ✗ | ✓ | ✓ |
| Manage Contract Signatures & PDFs | ✗ | ✓ | ✓ |
| View Reports | ✓ | ✓ | ✓ |
| Invite New Users | ✗ | ✗ | ✓ |
| Change User Roles | ✗ | ✗ | ✓ |
| Deactivate / Reactivate Users | ✗ | ✗ | ✓ |
| Delete Users | ✗ | ✗ | ✓ |
| Access Settings | ✗ | ✗ | ✓ |
| Configure Modules (Contracts, Documents, Exporting) | ✗ | ✗ | ✓ |
| Manage Contract Templates | ✗ | ✗ | ✓ |
| Manage Document Types | ✗ | ✗ | ✓ |
| Configure Export Settings | ✗ | ✗ | ✓ |
| Bulk Clear Employee Columns | ✗ | ✗ | ✓ |

---

## User – Standard Access

The **User** role is the baseline access level. Users can perform the core day-to-day tasks of managing employee records and documents. They do not have access to contract management (beyond read-only viewing), settings, or user administration.

> **Best suited for:** General HR staff, data entry operators, or anyone whose primary responsibility is maintaining employee records.

### ✅ What a User CAN do

- View the full list of employees in the organisation
- Add new employee records
- Edit existing employee details
- Delete employee records
- Upload, view, and delete employee documents
- View contracts assigned to employees *(read-only — cannot create or edit)*
- Access and view reports

### ❌ What a User CANNOT do

- Create, edit, or delete contracts
- Manage contract signatures or generate contract PDFs
- Invite new users to the platform
- Change any user's role
- Deactivate or delete other users
- Access the Settings section
- Configure modules, templates, or export settings
- Perform bulk data operations (e.g., clearing employee columns)

---

## Manager – Extended Access

The **Manager** role includes everything a User can do, plus the ability to fully manage contracts. This role is suited to team leads, HR managers, or any staff member who needs to create and oversee employment contracts in addition to managing employee records.

> **Best suited for:** HR managers, team leads, or anyone responsible for issuing and managing employment contracts.

### ✅ What a Manager CAN do

In addition to everything a User can do:

- Create new contracts for employees
- Edit existing contracts
- Delete contracts
- Manage contract signature workflows
- Generate and manage contract PDFs
- View full contract details and history

### ❌ What a Manager CANNOT do

- Invite new users to the platform
- Change any user's role
- Deactivate or delete other users
- Access the Settings section
- Configure modules, templates, document types, or export settings
- Perform bulk data operations (e.g., clearing employee columns)

---

## Admin – Full Access

The **Admin** role has unrestricted access to the entire platform, including all settings and user management. Admins are typically IT administrators, HR leads, or business owners responsible for overseeing the platform.

> **Important:** There must always be at least one Admin in the organisation — the system will automatically prevent the last Admin from being removed or demoted.

> **Best suited for:** IT administrators, HR leads, business owners, or any senior person responsible for platform configuration and user oversight.

### ✅ What an Admin CAN do

In addition to everything a Manager can do:

- Invite new users to the platform and assign their role during invitation
- Change the role of any existing user
- Deactivate users *(removes their access without deleting their data)*
- Reactivate previously deactivated users
- Permanently delete users from the platform
- Access all Settings pages
- Enable or disable modules (Contracts, Documents, Exporting) for the organisation
- Manage contract templates
- Configure document types
- Configure export settings
- Perform bulk data operations such as clearing employee columns

### ❌ What an Admin CANNOT do

- Demote themselves if they are the last remaining Admin *(system protection)*
- Deactivate their own account
- Delete their own account

---

## How Roles Are Assigned

Roles are assigned when a user is invited to the platform. The process works as follows:

1. An Admin generates an invite link or email invite from the **Settings** area.
2. During invite creation, the Admin selects the role the new user will receive (User, Manager, or Admin).
3. The new user receives the invite and registers on the platform using the provided link.
4. Once the invite is accepted, the user is automatically assigned the pre-selected role.
5. An Admin can change a user's role at any time from the Settings area.
6. A user **cannot** change their own role.

---

## Important Platform Protections

The EMA platform includes several built-in safeguards to protect your organisation's data and ensure access controls remain intact.

### 🔒 Last Admin Protection
The system will not allow the last Admin to be demoted, deactivated, or deleted. There must always be at least one active Admin in the organisation.

### 🔒 Self-Modification Protection
Admins cannot deactivate or delete their own account. Role and access changes must be performed by another Admin to prevent accidental lockouts.

### 🔒 Organisation Isolation
All data (employees, contracts, documents) is completely isolated per organisation. Users can only see and interact with data belonging to their own organisation.

### 🔒 Deactivated Users
When a user is deactivated, they immediately lose all access to the platform. Their data remains intact and they can be reactivated at any time by an Admin.

---

*EMA – Confidential | User Roles & Permissions Guide*
