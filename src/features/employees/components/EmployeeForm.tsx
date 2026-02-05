import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  employeeFormSchema,
  type EmployeeFormValues,
  type EmployeeFormInput,
  timestampToDateString,
} from "@/lib/validations/employee";
import { Id } from "../../../../convex/_generated/dataModel";
import { Doc } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

const TITLES = [
  { value: "MR", label: "Mr" },
  { value: "MISS", label: "Miss" },
  { value: "MRS", label: "Mrs" },
  { value: "MS", label: "Ms" },
] as const;

const GENDERS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
] as const;

const ETHNIC_GROUPS = [
  { value: "A", label: "African" },
  { value: "C", label: "Coloured" },
  { value: "W", label: "White" },
  { value: "I", label: "Indian" },
  { value: "B", label: "Black" },
] as const;

type Props = {
  organizationId: Id<"organizations">;
  defaultValues?: Partial<EmployeeFormInput> | null;
  employee?: Doc<"employees"> | null;
  onSubmit: (values: EmployeeFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
};

function employeeToFormValues(emp: Doc<"employees">): Partial<EmployeeFormInput> {
  return {
    idNumber: emp.idNumber,
    employeeNo: emp.employeeNo ?? "",
    title: emp.title,
    initials: emp.initials,
    firstName: emp.firstName,
    secondName: emp.secondName ?? "",
    lastName: emp.lastName,
    knownAs: emp.knownAs,
    dateOfBirth: timestampToDateString(emp.dateOfBirth),
    gender: emp.gender,
    ethnicGroup: emp.ethnicGroup,
    cellNumber: emp.cellNumber,
    resStreetNo: emp.resStreetNo,
    resStreetName: emp.resStreetName,
    resSuburb: emp.resSuburb,
    resCity: emp.resCity,
    resPostCode: emp.resPostCode,
    dateRegistered: timestampToDateString(emp.dateRegistered),
    dateEngaged: timestampToDateString(emp.dateEngaged),
    taxNumber: emp.taxNumber ?? "",
    certificate: emp.certificate ?? "",
  };
}

export function EmployeeForm({
  organizationId: _organizationId,
  defaultValues,
  employee,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Save",
}: Props) {
  const initial = employee
    ? employeeToFormValues(employee)
    : {
        title: "MR" as const,
        gender: "M" as const,
        ethnicGroup: "A" as const,
      };

  const form = useForm<EmployeeFormInput, unknown, EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: { ...initial, ...defaultValues },
  });

  const selectClass = cn(
    "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );

  const inputClass = "h-8";

  // Section card styling - prominent header with background
  const sectionClass = "rounded-lg border bg-card overflow-hidden";
  const sectionHeaderClass = "bg-muted/70 px-3 py-2 border-b";
  const sectionTitleClass = "text-sm font-semibold text-foreground";
  const sectionContentClass = "p-3";

  // Field wrapper classes - use flex with min-widths so fields wrap properly
  const fieldClass = "space-y-1 min-w-[100px] flex-1";
  const dateFieldClass = "space-y-1 min-w-[160px] flex-1"; // Wider for date picker icon
  const wideFieldClass = "space-y-1 min-w-[140px] flex-1";
  const narrowFieldClass = "space-y-1 min-w-[70px] flex-1 max-w-[100px]"; // For small fields like Title, Initials

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Fluid flex container - sections wrap naturally */}
      <div className="flex flex-wrap gap-3">
        {/* Identification - small section */}
        <section className={cn(sectionClass, "w-full sm:w-auto sm:min-w-[340px] sm:flex-1")}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Identification</h3>
          </div>
          <div className={sectionContentClass}>
            <div className="flex flex-wrap gap-2">
              <div className={wideFieldClass}>
                <Label htmlFor="idNumber" className="text-xs">ID Number (13 digits)</Label>
                <Input
                  id="idNumber"
                  {...form.register("idNumber")}
                  placeholder="9001015001087"
                  maxLength={13}
                  className={inputClass}
                />
                {form.formState.errors.idNumber && (
                  <p className="text-xs text-destructive">{form.formState.errors.idNumber.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="employeeNo" className="text-xs">Employee No</Label>
                <Input id="employeeNo" {...form.register("employeeNo")} className={inputClass} />
              </div>
            </div>
          </div>
        </section>

        {/* Address - medium section */}
        <section className={cn(sectionClass, "w-full sm:w-auto sm:min-w-[400px] sm:flex-1")}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Address</h3>
          </div>
          <div className={sectionContentClass}>
            <div className="flex flex-wrap gap-2">
              <div className={narrowFieldClass}>
                <Label htmlFor="resStreetNo" className="text-xs">Street No</Label>
                <Input id="resStreetNo" {...form.register("resStreetNo")} className={inputClass} />
                {form.formState.errors.resStreetNo && (
                  <p className="text-xs text-destructive">{form.formState.errors.resStreetNo.message}</p>
                )}
              </div>
              <div className="space-y-1 min-w-[180px] flex-[2]">
                <Label htmlFor="resStreetName" className="text-xs">Street Name</Label>
                <Input id="resStreetName" {...form.register("resStreetName")} className={inputClass} />
                {form.formState.errors.resStreetName && (
                  <p className="text-xs text-destructive">{form.formState.errors.resStreetName.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="resSuburb" className="text-xs">Suburb</Label>
                <Input id="resSuburb" {...form.register("resSuburb")} className={inputClass} />
                {form.formState.errors.resSuburb && (
                  <p className="text-xs text-destructive">{form.formState.errors.resSuburb.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="resCity" className="text-xs">City</Label>
                <Input id="resCity" {...form.register("resCity")} className={inputClass} />
                {form.formState.errors.resCity && (
                  <p className="text-xs text-destructive">{form.formState.errors.resCity.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="resPostCode" className="text-xs">Postal Code</Label>
                <Input id="resPostCode" {...form.register("resPostCode")} className={inputClass} />
                {form.formState.errors.resPostCode && (
                  <p className="text-xs text-destructive">{form.formState.errors.resPostCode.message}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Contact - small section */}
        <section className={cn(sectionClass, "w-full sm:w-auto sm:min-w-[300px] sm:flex-1")}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Contact</h3>
          </div>
          <div className={sectionContentClass}>
            <div className="flex flex-wrap gap-2">
              <div className={wideFieldClass}>
                <Label htmlFor="cellNumber" className="text-xs">Cell Number</Label>
                <Input id="cellNumber" {...form.register("cellNumber")} className={inputClass} />
                {form.formState.errors.cellNumber && (
                  <p className="text-xs text-destructive">{form.formState.errors.cellNumber.message}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Personal - larger section */}
        <section className={cn(sectionClass, "w-full sm:w-auto sm:min-w-[520px] sm:flex-[2]")}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Personal</h3>
          </div>
          <div className={sectionContentClass}>
            <div className="flex flex-wrap gap-2">
              <div className={narrowFieldClass}>
                <Label htmlFor="title" className="text-xs">Title</Label>
                <select id="title" className={selectClass} {...form.register("title")}>
                  {TITLES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className={narrowFieldClass}>
                <Label htmlFor="initials" className="text-xs">Initials</Label>
                <Input id="initials" {...form.register("initials")} className={inputClass} />
                {form.formState.errors.initials && (
                  <p className="text-xs text-destructive">{form.formState.errors.initials.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                <Input id="firstName" {...form.register("firstName")} className={inputClass} />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="secondName" className="text-xs">Second Name</Label>
                <Input id="secondName" {...form.register("secondName")} className={inputClass} />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                <Input id="lastName" {...form.register("lastName")} className={inputClass} />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="knownAs" className="text-xs">Known As</Label>
                <Input id="knownAs" {...form.register("knownAs")} className={inputClass} />
                {form.formState.errors.knownAs && (
                  <p className="text-xs text-destructive">{form.formState.errors.knownAs.message}</p>
                )}
              </div>
              <div className={dateFieldClass}>
                <Label htmlFor="dateOfBirth" className="text-xs">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} className={inputClass} />
                {form.formState.errors.dateOfBirth && (
                  <p className="text-xs text-destructive">{form.formState.errors.dateOfBirth.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="gender" className="text-xs">Gender</Label>
                <select id="gender" className={selectClass} {...form.register("gender")}>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div className={wideFieldClass}>
                <Label htmlFor="ethnicGroup" className="text-xs">Ethnic Group</Label>
                <select id="ethnicGroup" className={selectClass} {...form.register("ethnicGroup")}>
                  {ETHNIC_GROUPS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Dates */}
        <section className={cn(sectionClass, "w-full sm:w-auto sm:min-w-[520px] sm:flex-[2]")}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Dates</h3>
          </div>
          <div className={sectionContentClass}>
            <div className="flex flex-wrap gap-2">
              <div className={fieldClass}>
                <Label htmlFor="taxNumber" className="text-xs">Tax Number</Label>
                <Input id="taxNumber" {...form.register("taxNumber")} className={inputClass} />
              </div>
              <div className={dateFieldClass}>
                <Label htmlFor="dateRegistered" className="text-xs">Date Registered</Label>
                <Input id="dateRegistered" type="date" {...form.register("dateRegistered")} className={inputClass} />
              </div>
              <div className={dateFieldClass}>
                <Label htmlFor="dateEngaged" className="text-xs">Date Engaged</Label>
                <Input id="dateEngaged" type="date" {...form.register("dateEngaged")} className={inputClass} />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="certificate" className="text-xs">Certificate</Label>
                <Input id="certificate" {...form.register("certificate")} className={inputClass} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} size="sm">
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
