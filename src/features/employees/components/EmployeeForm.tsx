import { useForm } from "react-hook-form";
import { useEffect } from "react";
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
import {
  PAY_METHODS,
  BANK_ACC_TYPES,
  BANK_NAMES,
  BRANCH_CODES,
  ACC_RELATIONSHIPS,
} from "@/lib/constants/bankDetails";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const TITLES = [
  { value: "MR", label: "Mr" },
  { value: "MISS", label: "Miss" },
  { value: "MRS", label: "Mrs" },
  { value: "MS", label: "Ms" },
  { value: "DR", label: "Dr" },
  { value: "PROF", label: "Prof" },
  { value: "REV", label: "Rev" },
] as const;

const MARITAL_STATUSES = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "SEPARATED", label: "Separated" },
] as const;

const TRAINING_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
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
    title: emp.title ?? "",
    initials: emp.initials ?? "",
    firstName: emp.firstName ?? "",
    secondName: emp.secondName ?? "",
    lastName: emp.lastName ?? "",
    knownAs: emp.knownAs ?? "",
    dateOfBirth: timestampToDateString(emp.dateOfBirth),
    gender: emp.gender ?? "",
    ethnicGroup: emp.ethnicGroup ?? "",
    language: emp.language ?? "",
    cellNumber: emp.cellNumber ?? "",
    alternativeNumber: emp.alternativeNumber ?? "",
    resUnit: emp.resUnit ?? "",
    resComplex: emp.resComplex ?? "",
    resStreetNo: emp.resStreetNo ?? "",
    resStreetName: emp.resStreetName ?? "",
    resSuburb: emp.resSuburb ?? "",
    resCity: emp.resCity ?? "",
    resPostCode: emp.resPostCode ?? "",
    residentialCountry: emp.residentialCountry ?? "",
    dateRegistered: timestampToDateString(emp.dateRegistered),
    dateEngaged: timestampToDateString(emp.dateEngaged),
    lastDateWorked: timestampToDateString(emp.lastDateWorked),
    uifEndDate: timestampToDateString(emp.uifEndDate),
    taxNumber: emp.taxNumber ?? "",
    certificate: emp.certificate ?? "",
    hrsPerPeriod: emp.hrsPerPeriod ?? "",
    hoursPerDay: emp.hoursPerDay ?? "",
    workAddressCode: emp.workAddressCode ?? "",
    training: (emp.training != null ? String(emp.training) : "") as "" | "true" | "false",
    shift: emp.shift ?? "",
    shiftAllocation: emp.shiftAllocation ?? "",
    deptGroup: emp.deptGroup ?? "",
    departmentWorked: emp.departmentWorked ?? "",
    department: emp.department ?? "",
    maritalStatus: (emp.maritalStatus ?? "") as "" | "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | "SEPARATED",
    illnessCondition: emp.illnessCondition ?? "",
    payMethod: emp.payMethod ?? "03",
    bankAccType: emp.bankAccType ?? "S",
    bankAccNo: emp.bankAccNo ?? "",
    bankName: emp.bankName ?? "",
    branchCode: emp.branchCode ?? "",
    accHolder: emp.accHolder ?? "",
    accRelationship: emp.accRelationship ?? "O",
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
  const { organization } = useCurrentUser();
  const departments = organization?.settings?.departments ?? [];
  const deptGroups = organization?.settings?.deptGroups ?? [];
  const shifts = organization?.settings?.shifts ?? [];
  const shiftAllocations = organization?.settings?.shiftAllocations ?? [];

  const initial = employee
    ? employeeToFormValues(employee)
    : {
        payMethod: "03" as const,
        bankAccType: "S" as const,
        accRelationship: "O" as const,
      };

  const form = useForm<EmployeeFormInput, unknown, EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: { ...initial, ...defaultValues },
  });

  const bankName = form.watch("bankName");
  useEffect(() => {
    const code = bankName ? BRANCH_CODES[bankName] ?? "" : "";
    form.setValue("branchCode", code);
  }, [bankName, form]);

  const selectClass = cn(
    "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );

  // Section card styling - prominent header with background
  const sectionClass = "rounded-lg border bg-card overflow-hidden";
  const sectionHeaderClass = "bg-muted/70 px-3 py-2 border-b";
  const sectionTitleClass = "text-sm font-semibold text-foreground";
  const sectionContentClass = "p-4";

  // Field wrapper classes - full width on mobile, wrap with min-widths from sm up (see ui-layout-patterns.mdc)
  const fieldClass = "space-y-1 w-full min-w-0 sm:min-w-[100px] sm:flex-1";
  const dateFieldClass = "space-y-1 w-full min-w-0 sm:min-w-[160px] sm:flex-1"; // Wider for date picker icon
  const wideFieldClass = "space-y-1 w-full min-w-0 sm:min-w-[140px] sm:flex-1";
  const narrowFieldClass = "space-y-1 w-full min-w-0 sm:min-w-[70px] sm:flex-1 sm:max-w-[100px]"; // Title, Initials

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
                />
                {form.formState.errors.idNumber && (
                  <p className="text-xs text-destructive">{form.formState.errors.idNumber.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="employeeNo" className="text-xs">Employee No</Label>
                <Input id="employeeNo" {...form.register("employeeNo")} />
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
              <div className={fieldClass}>
                <Label htmlFor="resUnit" className="text-xs">Unit</Label>
                <Input id="resUnit" {...form.register("resUnit")} />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="resComplex" className="text-xs">Complex</Label>
                <Input id="resComplex" {...form.register("resComplex")} />
              </div>
              <div className={narrowFieldClass}>
                <Label htmlFor="resStreetNo" className="text-xs">Street No</Label>
                <Input id="resStreetNo" {...form.register("resStreetNo")} />
                {form.formState.errors.resStreetNo && (
                  <p className="text-xs text-destructive">{form.formState.errors.resStreetNo.message}</p>
                )}
              </div>
              <div className="space-y-1 w-full min-w-0 sm:min-w-[180px] sm:flex-[2]">
                <Label htmlFor="resStreetName" className="text-xs">Street Name</Label>
                <Input id="resStreetName" {...form.register("resStreetName")} />
                {form.formState.errors.resStreetName && (
                  <p className="text-xs text-destructive">{form.formState.errors.resStreetName.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="resSuburb" className="text-xs">Suburb</Label>
                <Input id="resSuburb" {...form.register("resSuburb")} />
                {form.formState.errors.resSuburb && (
                  <p className="text-xs text-destructive">{form.formState.errors.resSuburb.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="resCity" className="text-xs">City</Label>
                <Input id="resCity" {...form.register("resCity")} />
                {form.formState.errors.resCity && (
                  <p className="text-xs text-destructive">{form.formState.errors.resCity.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="resPostCode" className="text-xs">Postal Code</Label>
                <Input id="resPostCode" {...form.register("resPostCode")} />
                {form.formState.errors.resPostCode && (
                  <p className="text-xs text-destructive">{form.formState.errors.resPostCode.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="residentialCountry" className="text-xs">Country</Label>
                <Input id="residentialCountry" {...form.register("residentialCountry")} placeholder="e.g. ZA" />
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
                <Input id="cellNumber" {...form.register("cellNumber")} />
                {form.formState.errors.cellNumber && (
                  <p className="text-xs text-destructive">{form.formState.errors.cellNumber.message}</p>
                )}
              </div>
              <div className={wideFieldClass}>
                <Label htmlFor="alternativeNumber" className="text-xs">Alternative Number</Label>
                <Input id="alternativeNumber" {...form.register("alternativeNumber")} />
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
                  <option value="">— Select —</option>
                  {TITLES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className={narrowFieldClass}>
                <Label htmlFor="initials" className="text-xs">Initials</Label>
                <Input id="initials" {...form.register("initials")} />
                {form.formState.errors.initials && (
                  <p className="text-xs text-destructive">{form.formState.errors.initials.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                <Input id="firstName" {...form.register("firstName")} />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="secondName" className="text-xs">Second Name</Label>
                <Input id="secondName" {...form.register("secondName")} />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                <Input id="lastName" {...form.register("lastName")} />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="knownAs" className="text-xs">Known As</Label>
                <Input id="knownAs" {...form.register("knownAs")} />
                {form.formState.errors.knownAs && (
                  <p className="text-xs text-destructive">{form.formState.errors.knownAs.message}</p>
                )}
              </div>
              <div className={dateFieldClass}>
                <Label htmlFor="dateOfBirth" className="text-xs">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
                {form.formState.errors.dateOfBirth && (
                  <p className="text-xs text-destructive">{form.formState.errors.dateOfBirth.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="gender" className="text-xs">Gender</Label>
                <select id="gender" className={selectClass} {...form.register("gender")}>
                  <option value="">— Select —</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div className={wideFieldClass}>
                <Label htmlFor="ethnicGroup" className="text-xs">Ethnic Group</Label>
                <select id="ethnicGroup" className={selectClass} {...form.register("ethnicGroup")}>
                  <option value="">— Select —</option>
                  {ETHNIC_GROUPS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="language" className="text-xs">Language</Label>
                <Input id="language" {...form.register("language")} />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="illnessCondition" className="text-xs">Illness Condition</Label>
                <Input id="illnessCondition" {...form.register("illnessCondition")} placeholder="e.g. ASTHMA" />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="maritalStatus" className="text-xs">Marital Status</Label>
                <select id="maritalStatus" className={selectClass} {...form.register("maritalStatus")}>
                  <option value="">— Select —</option>
                  {MARITAL_STATUSES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
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
                <Input id="taxNumber" {...form.register("taxNumber")} />
              </div>
              <div className={dateFieldClass}>
                <Label htmlFor="dateRegistered" className="text-xs">Date Registered</Label>
                <Input id="dateRegistered" type="date" {...form.register("dateRegistered")} />
              </div>
              <div className={dateFieldClass}>
                <Label htmlFor="dateEngaged" className="text-xs">Date Engaged</Label>
                <Input id="dateEngaged" type="date" {...form.register("dateEngaged")} />
              </div>
              <div className={dateFieldClass}>
                <Label htmlFor="lastDateWorked" className="text-xs">Last Date Worked</Label>
                <Input id="lastDateWorked" type="date" {...form.register("lastDateWorked")} />
              </div>
              <div className={dateFieldClass}>
                <Label htmlFor="uifEndDate" className="text-xs">UIF End Date</Label>
                <Input id="uifEndDate" type="date" {...form.register("uifEndDate")} />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="certificate" className="text-xs">Certificate</Label>
                <Input id="certificate" {...form.register("certificate")} />
              </div>
            </div>
          </div>
        </section>

        {/* Work */}
        <section className={cn(sectionClass, "w-full sm:w-auto sm:min-w-[340px] sm:flex-1")}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Work</h3>
          </div>
          <div className={sectionContentClass}>
            <div className="flex flex-wrap gap-2">
              <div className={wideFieldClass}>
                <Label htmlFor="hrsPerPeriod" className="text-xs">Hours per Period</Label>
                <Input id="hrsPerPeriod" type="number" step="0.01" {...form.register("hrsPerPeriod")} />
                {form.formState.errors.hrsPerPeriod && (
                  <p className="text-xs text-destructive">{form.formState.errors.hrsPerPeriod.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="hoursPerDay" className="text-xs">Hours per Day</Label>
                <Input id="hoursPerDay" type="number" {...form.register("hoursPerDay")} />
                {form.formState.errors.hoursPerDay && (
                  <p className="text-xs text-destructive">{form.formState.errors.hoursPerDay.message}</p>
                )}
              </div>
              <div className={wideFieldClass}>
                <Label htmlFor="workAddressCode" className="text-xs">Work Address Code</Label>
                <Input id="workAddressCode" type="number" {...form.register("workAddressCode")} />
                {form.formState.errors.workAddressCode && (
                  <p className="text-xs text-destructive">{form.formState.errors.workAddressCode.message}</p>
                )}
              </div>
              <div className={fieldClass}>
                <Label htmlFor="training" className="text-xs">Training</Label>
                <select id="training" className={selectClass} {...form.register("training")}>
                  <option value="">— Select —</option>
                  {TRAINING_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="shift" className="text-xs">Shift</Label>
                <select id="shift" className={selectClass} {...form.register("shift")}>
                  <option value="">— Select —</option>
                  {shifts.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="shiftAllocation" className="text-xs">Shift Allocation</Label>
                <select id="shiftAllocation" className={selectClass} {...form.register("shiftAllocation")}>
                  <option value="">— Select —</option>
                  {shiftAllocations.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="deptGroup" className="text-xs">Department Group</Label>
                <select id="deptGroup" className={selectClass} {...form.register("deptGroup")}>
                  <option value="">— Select —</option>
                  {deptGroups.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="departmentWorked" className="text-xs">Department Worked</Label>
                <select id="departmentWorked" className={selectClass} {...form.register("departmentWorked")}>
                  <option value="">— Select —</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="department" className="text-xs">Department</Label>
                <select id="department" className={selectClass} {...form.register("department")}>
                  <option value="">— Select —</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Banking Details */}
        <section className={cn(sectionClass, "w-full sm:w-auto sm:min-w-[520px] sm:flex-[2]")}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Banking Details</h3>
          </div>
          <div className={sectionContentClass}>
            <div className="flex flex-wrap gap-2">
              <div className={fieldClass}>
                <Label htmlFor="payMethod" className="text-xs">Pay Method</Label>
                <select id="payMethod" className={selectClass} {...form.register("payMethod")}>
                  <option value="">— Select —</option>
                  {PAY_METHODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="bankName" className="text-xs">Bank Name</Label>
                <select id="bankName" className={selectClass} {...form.register("bankName")}>
                  <option value="">— Select —</option>
                  {BANK_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="bankAccType" className="text-xs">Account Type</Label>
                <select id="bankAccType" className={selectClass} {...form.register("bankAccType")}>
                  <option value="">— Select —</option>
                  {BANK_ACC_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="branchCode" className="text-xs">Branch Code</Label>
                <Input
                  id="branchCode"
                  readOnly
                  className="bg-muted"
                  {...form.register("branchCode")}
                />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="bankAccNo" className="text-xs">Account Number</Label>
                <Input id="bankAccNo" {...form.register("bankAccNo")} />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="accHolder" className="text-xs">Account Holder</Label>
                <Input id="accHolder" {...form.register("accHolder")} />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="accRelationship" className="text-xs">Relationship</Label>
                <select id="accRelationship" className={selectClass} {...form.register("accRelationship")}>
                  <option value="">— Select —</option>
                  {ACC_RELATIONSHIPS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-2 pt-4">
        <div className="w-full min-w-0 sm:w-auto">
          <Button type="submit" disabled={isSubmitting} size="sm" className="w-full">
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
        {onCancel && (
          <div className="w-full min-w-0 sm:w-auto">
            <Button type="button" variant="outline" size="sm" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
