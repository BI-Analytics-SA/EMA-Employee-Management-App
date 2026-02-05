import { createBrowserRouter } from "react-router-dom";

// Layout
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RequireProfile } from "@/components/auth/RequireProfile";

// Auth Pages
import { SignInPage } from "@/features/auth/SignInPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";

// Settings Pages
import { TeamPage } from "@/features/settings/TeamPage";

// Employee Pages
import { EmployeeListPage } from "@/features/employees/pages/EmployeeListPage";
import { EmployeeDetailPage } from "@/features/employees/pages/EmployeeDetailPage";
import { AddEmployeePage } from "@/features/employees/pages/AddEmployeePage";
import { EditEmployeePage } from "@/features/employees/pages/EditEmployeePage";
import { CaptureImagePage } from "@/features/employees/pages/CaptureImagePage";
import { EmployeeDocumentsPage } from "@/features/employees/pages/EmployeeDocumentsPage";
import { DocumentUploadPage } from "@/features/employees/pages/DocumentUploadPage";
import { ExpiringDocumentsPage } from "@/features/documents/pages/ExpiringDocumentsPage";
import { DocumentTypesPage } from "@/features/settings/DocumentTypesPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">Coming soon...</p>
    </div>
  );
}

// Contract Pages
const ContractListPage = () => <PlaceholderPage title="Contracts" />;
const NewContractPage = () => <PlaceholderPage title="New Contract" />;

// Medical Pages
const MedicalStatusPage = () => <PlaceholderPage title="Medical Questionnaire" />;
const NewMedicalPage = () => <PlaceholderPage title="New Medical Questionnaire" />;
const EditMedicalPage = () => <PlaceholderPage title="Edit Medical Questionnaire" />;

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
            element: <AppShell />,
            children: [
          {
            index: true,
            element: <EmployeeListPage />,
          },
          {
            path: "settings/team",
            element: <TeamPage />,
          },
          {
            path: "settings/document-types",
            element: <DocumentTypesPage />,
          },
          {
            path: "documents/expiring",
            element: <ExpiringDocumentsPage />,
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
                ],
              },
              {
                path: ":id/medical",
                children: [
                  {
                    index: true,
                    element: <MedicalStatusPage />,
                  },
                  {
                    path: "new",
                    element: <NewMedicalPage />,
                  },
                  {
                    path: "edit",
                    element: <EditMedicalPage />,
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
