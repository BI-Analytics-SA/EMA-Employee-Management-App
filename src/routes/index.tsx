import { createBrowserRouter } from "react-router-dom";

// Layout
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RequireProfile } from "@/components/auth/RequireProfile";
import { OrganizationProvider } from "@/contexts/OrganizationContext";

// Auth Pages
import { SignInPage } from "@/features/auth/SignInPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";

// Settings Pages
import { TeamPage } from "@/features/settings/TeamPage";
import { ProfilePage } from "@/features/settings/ProfilePage";

// Home Page
import { HomePage } from "@/features/home/HomePage";

// Employee Pages
import { EmployeeListPage } from "@/features/employees/pages/EmployeeListPage";
import { EmployeeDetailPage } from "@/features/employees/pages/EmployeeDetailPage";
import { AddEmployeePage } from "@/features/employees/pages/AddEmployeePage";
import { ImportEmployeesPage } from "@/features/employees/pages/ImportEmployeesPage";
import { EditEmployeePage } from "@/features/employees/pages/EditEmployeePage";
import { CaptureImagePage } from "@/features/employees/pages/CaptureImagePage";
import { EmployeeDocumentsPage } from "@/features/employees/pages/EmployeeDocumentsPage";
import { DocumentUploadPage } from "@/features/employees/pages/DocumentUploadPage";
import { ExpiringDocumentsPage } from "@/features/documents/pages/ExpiringDocumentsPage";
import { DocumentTypesPage } from "@/features/settings/DocumentTypesPage";
import { ModulesPage } from "@/features/settings/ModulesPage";
import { ContractListPage } from "@/features/employees/pages/ContractListPage";
import { NewContractPage } from "@/features/employees/pages/NewContractPage";
import { ContractDetailPage } from "@/features/employees/pages/ContractDetailPage";
import { ContractTemplatePage } from "@/features/settings/ContractTemplatePage";
import { ExportConfigPage } from "@/features/settings/ExportConfigPage";
import { DataManagementPage } from "@/features/settings/DataManagementPage";
import { EmployeeReportPage } from "@/features/reports/pages/EmployeeReportPage";
import { AddOrganizationPage } from "@/features/organizations/AddOrganizationPage";
import { JobListPage } from "@/features/jobs/pages/JobListPage";
import { NewJobPage } from "@/features/jobs/pages/NewJobPage";
import { JobDetailPage } from "@/features/jobs/pages/JobDetailPage";
import { EditJobPage } from "@/features/jobs/pages/EditJobPage";
import { JobDocumentsPage } from "@/features/jobs/pages/JobDocumentsPage";
import { JobDocumentUploadPage } from "@/features/jobs/pages/JobDocumentUploadPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <SignInPage />,
  },
  {
    // Onboarding - requires auth but not profile
    path: "/onboarding",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <OnboardingPage />,
      },
    ],
  },
  {
    // Main app - requires auth AND profile
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <RequireProfile />,
        children: [
          {
            element: (
              <OrganizationProvider>
                <AppShell />
              </OrganizationProvider>
            ),
            children: [
              {
                index: true,
                element: <HomePage />,
              },
              {
                path: "settings/team",
                element: <TeamPage />,
              },
              {
                path: "settings/profile",
                element: <ProfilePage />,
              },
              {
                path: "settings/document-types",
                element: <DocumentTypesPage />,
              },
              {
                path: "settings/modules",
                element: <ModulesPage />,
              },
              {
                path: "settings/data-management",
                element: <DataManagementPage />,
              },
              {
                path: "settings/contract-template",
                element: <ContractTemplatePage />,
              },
              {
                path: "settings/export-config",
                element: <ExportConfigPage />,
              },
              {
                path: "documents/expiring",
                element: <ExpiringDocumentsPage />,
              },
              {
                path: "reports/employees",
                element: <EmployeeReportPage />,
              },
              {
                path: "organizations/new",
                element: <AddOrganizationPage />,
              },
              {
                path: "jobs",
                children: [
                  {
                    index: true,
                    element: <JobListPage />,
                  },
                  {
                    path: "new",
                    element: <NewJobPage />,
                  },
                  {
                    path: ":id",
                    element: <JobDetailPage />,
                  },
                  {
                    path: ":id/edit",
                    element: <EditJobPage />,
                  },
                  {
                    path: ":id/documents",
                    children: [
                      {
                        index: true,
                        element: <JobDocumentsPage />,
                      },
                      {
                        path: "upload",
                        element: <JobDocumentUploadPage />,
                      },
                    ],
                  },
                ],
              },
              {
                path: "employees",
                children: [
                  {
                    index: true,
                    element: <EmployeeListPage />,
                  },
                  {
                    path: "new",
                    element: <AddEmployeePage />,
                  },
                  {
                    path: "import",
                    element: <ImportEmployeesPage />,
                  },
                  {
                    path: ":id",
                    element: <EmployeeDetailPage />,
                  },
                  {
                    path: ":id/edit",
                    element: <EditEmployeePage />,
                  },
                  {
                    path: ":id/capture",
                    element: <CaptureImagePage />,
                  },
                  {
                    path: ":id/documents",
                    children: [
                      {
                        index: true,
                        element: <EmployeeDocumentsPage />,
                      },
                      {
                        path: "upload",
                        element: <DocumentUploadPage />,
                      },
                    ],
                  },
                  {
                    path: ":id/contracts",
                    children: [
                      {
                        index: true,
                        element: <ContractListPage />,
                      },
                      {
                        path: "new",
                        element: <NewContractPage />,
                      },
                      {
                        path: ":contractId",
                        element: <ContractDetailPage />,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
