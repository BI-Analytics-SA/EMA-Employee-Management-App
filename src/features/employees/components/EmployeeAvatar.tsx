import { useState } from "react";
import { User } from "lucide-react";

type Props = {
  employee: {
    imageUrl?: string;
    initials?: string;
    firstName?: string;
    lastName?: string;
  };
};

export function EmployeeAvatar({ employee }: Props) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const initials = (employee.initials?.trim() ||
    `${employee.firstName?.trim()[0] ?? ""}${employee.lastName?.trim()[0] ?? ""}`).toUpperCase();

  if (employee.imageUrl && employee.imageUrl !== failedUrl) {
    return (
      <img
        src={employee.imageUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-cover"
        onError={() => setFailedUrl(employee.imageUrl)}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold" aria-hidden="true">
      {initials || <User className="h-5 w-5" />}
    </div>
  );
}
