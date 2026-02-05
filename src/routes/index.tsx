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

// Pages (will be created later)
// For now, we'll use placeholder components

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">Coming soon...</p>
    </div>
  );
}

// Employee Pages
const EmployeeListPage = () => <PlaceholderPage title="Employees" />;
const EmployeeDetailPage = () => <PlaceholderPage title="Employee Details" />;
const AddEmployeePage = () => <PlaceholderPage title="Add Employee" />;
const EditEmployeePage = () => <PlaceholderPage title="Edit Employee" />;
const CaptureImagePage = () => <PlaceholderPage title="Capture Image" />;

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
