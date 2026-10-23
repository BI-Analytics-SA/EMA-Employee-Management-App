import { useState } from "react";
import { User } from "lucide-react";

type Props = {
  employee: {
    imageUrl?: string | null;
    initials?: string;
    firstName?: string;
    lastName?: string;
  };
  size?: "default" | "lg";
  alt?: string;
};

export function EmployeeAvatar({ employee, size = "default", alt = "" }: Props) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const { imageUrl } = employee;
  const sizeClass = size === "lg" ? "h-20 w-20 ring-2 ring-border" : "h-10 w-10";
  const initials = (employee.initials?.trim() ||
    `${employee.firstName?.trim()[0] ?? ""}${employee.lastName?.trim()[0] ?? ""}`).toUpperCase();

  if (imageUrl && imageUrl !== failedUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
        onError={() => setFailedUrl(imageUrl)}
      />
    );
  }

  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ${size === "lg" ? "text-xl font-bold" : "text-sm font-semibold"}`} aria-hidden="true">
      {initials || <User className={size === "lg" ? "h-8 w-8" : "h-5 w-5"} />}
    </div>
  );
}
