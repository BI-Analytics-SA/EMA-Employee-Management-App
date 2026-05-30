import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";

// Layout
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RequireProfile } from "@/components/auth/RequireProfile";
import { OrganizationProvider } from "@/contexts/OrganizationContext";

// Auth Pages
import { SignInPage } from "@/features/auth/SignInPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";

// Landing Page
import { LandingPage } from "@/features/landing/LandingPage";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

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
import { JobDocumentUploadPage } from "@/features/jobs/pages/JobDocumentUploadPage";
import { JobDocumentsPage } from "@/features/jobs/pages/JobDocumentsPage";
import { JobDocumentTypesPage } from "@/features/settings/JobDocumentTypesPage";

/**
 * Smart root wrapper: unauthenticated users on "/" see the landing page,
 * all other cases fall through to the normal ProtectedRoute behaviour.
 */
function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (location.pathname === "/") {
      return <LandingPage />;
    }
    const redirectTo = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <Outlet />;
}

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
    // Main app - requires auth AND profile; unauthenticated "/" shows landing page
    path: "/",
    element: <RootRoute />,
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
                path: "settings/job-document-types",
                element: <JobDocumentTypesPage />,
              },
              {
                path: "expiring-items",
                element: <ExpiringDocumentsPage />,
              },
              {
                path: "documents/expiring",
                element: <Navigate to="/expiring-items" replace />,
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
