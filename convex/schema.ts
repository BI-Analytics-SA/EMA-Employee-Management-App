import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // Organizations (Multi-tenant Root)
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    settings: v.optional(
      v.object({
        departments: v.array(v.string()),
        deptGroups: v.array(v.string()),
        shifts: v.array(v.string()),
        shiftAllocations: v.array(v.string()),
        suburbs: v.array(v.string()),
        cities: v.array(v.string()),
        postCodes: v.array(v.string()),
        documentTypes: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              requiresExpiry: v.boolean(),
              color: v.optional(v.string()),
            })
          )
        ),
        enabledModules: v.optional(
          v.object({
            contracts: v.optional(v.boolean()),
            documents: v.optional(v.boolean()),
            exporting: v.optional(v.boolean()),
          })
        ),
        contractTemplate: v.optional(
          v.object({
            companyName: v.optional(v.string()),
            contractHeading: v.optional(v.string()),
            contractCategory: v.optional(v.string()),
            defaultTermsAndConditions: v.optional(v.string()),
            employerSignatureStorageId: v.optional(v.id("_storage")),
            employerSignatureUrl: v.optional(v.string()),
          })
        ),
        contractTemplates: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              isDefault: v.boolean(),
              companyName: v.optional(v.string()),
              contractHeading: v.optional(v.string()),
              contractCategory: v.optional(v.string()),
              defaultTermsAndConditions: v.optional(v.string()),
              employerSignatureStorageId: v.optional(v.id("_storage")),
              employerSignatureUrl: v.optional(v.string()),
            })
          )
        ),
        exportConfig: v.optional(
          v.object({
            columns: v.array(
              v.object({
                id: v.string(),
                source: v.union(v.literal("database"), v.literal("custom")),
                dbField: v.optional(v.string()),
                label: v.string(),
                dataType: v.union(v.literal("text"), v.literal("number"), v.literal("date")),
                defaultValue: v.optional(v.string()),
                enabled: v.boolean(),
              })
            ),
          })
        ),
      })
    ),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Invites (for inviting users to organizations)
  invites: defineTable({
    organizationId: v.id("organizations"),
    // Unique invite code (URL-safe string)
    code: v.string(),
    // Email of the invited user (optional - can be open invite)
    email: v.optional(v.string()),
    // Role to assign when invite is used
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("user")
    ),
    // Invite status
    status: v.union(
      v.literal("pending"),
      v.literal("used"),
      v.literal("revoked"),
      v.literal("expired")
    ),
    // Expiry timestamp (optional - null means no expiry)
    expiresAt: v.optional(v.number()),
    // Who used this invite
    usedBy: v.optional(v.id("userProfiles")),
    usedAt: v.optional(v.number()),
    // Email tracking
    emailSentAt: v.optional(v.number()),
    // Metadata
    createdAt: v.number(),
    createdBy: v.id("userProfiles"),
  })
    .index("by_code", ["code"])
    .index("by_organization", ["organizationId"])
    .index("by_organization_status", ["organizationId", "status"]),

  // User Profiles (App-specific user data, links to auth users table)
  userProfiles: defineTable({
    // Link to the auth-managed users table
    userId: v.id("users"),
    // Organization membership
    organizationId: v.id("organizations"),
    // App-specific fields
    name: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("user")
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_user_organization", ["userId", "organizationId"]),

  // Employees (Primary Entity)
  employees: defineTable({
    organizationId: v.id("organizations"),

    // Identification
    idNumber: v.string(), // SA ID (13 digits)
    employeeNo: v.optional(v.string()),

    // Personal Info
    title: v.union(
      v.literal("MR"),
      v.literal("MISS"),
      v.literal("MRS"),
      v.literal("MS"),
      v.literal("DR"),
      v.literal("PROF"),
      v.literal("REV")
    ),
    initials: v.string(),
    firstName: v.string(),
    secondName: v.optional(v.string()),
    lastName: v.string(),
    knownAs: v.string(),
    dateOfBirth: v.number(),
    gender: v.union(v.literal("M"), v.literal("F")),
    ethnicGroup: v.union(
      v.literal("A"), // African
      v.literal("C"), // Coloured
      v.literal("W"), // White
      v.literal("I"), // Indian
      v.literal("B")  // Black
    ),
    language: v.optional(v.string()),

    // Contact
    cellNumber: v.string(),
    alternativeNumber: v.optional(v.string()),

    // Address
    resUnit: v.optional(v.string()),
    resComplex: v.optional(v.string()),
    resStreetNo: v.string(),
    resStreetName: v.string(),
    resSuburb: v.string(),
    resCity: v.string(),
    resPostCode: v.string(),
    residentialCountry: v.optional(v.string()),

    // Status & Dates
    dateRegistered: v.optional(v.number()),
    dateEngaged: v.optional(v.number()),
    lastDateWorked: v.optional(v.number()),
    uifEndDate: v.optional(v.number()),
    taxNumber: v.optional(v.string()),
    certificate: v.optional(v.string()),

    // Work
    hrsPerPeriod: v.optional(v.number()),
    hoursPerDay: v.optional(v.number()),
    workAddressCode: v.optional(v.number()),
    training: v.optional(v.boolean()),
    shift: v.optional(v.string()),
    shiftAllocation: v.optional(v.string()),
    deptGroup: v.optional(v.string()),
    departmentWorked: v.optional(v.string()),
    department: v.optional(v.string()),
    maritalStatus: v.optional(
      v.union(
        v.literal("SINGLE"),
        v.literal("MARRIED"),
        v.literal("DIVORCED"),
        v.literal("WIDOWED"),
        v.literal("SEPARATED")
      )
    ),

    // Health
    illnessCondition: v.optional(v.string()),

    // Banking Details
    payMethod: v.optional(v.union(v.literal("02"), v.literal("03"))),
    bankAccType: v.optional(v.union(v.literal("S"), v.literal("C"))),
    bankAccNo: v.optional(v.string()),
    bankName: v.optional(v.string()),
    branchCode: v.optional(v.string()),
    accHolder: v.optional(v.string()),
    accRelationship: v.optional(v.union(v.literal("O"), v.literal("T"))),

    // Image (Convex file storage)
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),

    // Auto-computed fields
    taxYearStart: v.optional(v.number()),
    newUifStartDate: v.optional(v.number()),
    repAddr1: v.optional(v.string()),
    repAddr2: v.optional(v.string()),
    repAddr3: v.optional(v.string()),
    repPostCode: v.optional(v.string()),
    fullNames: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("userProfiles")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_organization_createdAt", ["organizationId", "createdAt"])
    .index("by_organization_idNumber", ["organizationId", "idNumber"])
    .index("by_organization_registered", ["organizationId", "dateRegistered"])
    .searchIndex("search_employee", {
      searchField: "idNumber",
      filterFields: ["organizationId"],
    }),

  // Contracts
  contracts: defineTable({
    organizationId: v.id("organizations"),
    employeeId: v.id("employees"),

    nameSurname: v.string(),
    idNumber: v.string(),
    signedDate: v.number(),
    startDate: v.number(),
    employeeNo: v.string(),
    dateEngaged: v.optional(v.number()),
    contractHeading: v.optional(v.string()),
    contractCategory: v.optional(v.string()),
    placeOfSignature: v.optional(v.string()),

    // Signature (Convex file storage)
    signatureStorageId: v.optional(v.id("_storage")),
    signatureUrl: v.optional(v.string()),

    // Template reference and snapshot (Option B: document uses snapshot at view/PDF)
    templateId: v.optional(v.string()),
    companyName: v.optional(v.string()),
    employerSignatureStorageId: v.optional(v.id("_storage")),
    employerSignatureUrl: v.optional(v.string()),

    // Rich text content (HTML from TipTap)
    termsAndConditionsHtml: v.optional(v.string()),

    // Generated PDF (Convex file storage)
    pdfStorageId: v.optional(v.id("_storage")),
    pdfUrl: v.optional(v.string()),

    createdAt: v.number(),
    createdBy: v.optional(v.id("userProfiles")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_employee", ["employeeId"])
    .index("by_organization_employee", ["organizationId", "employeeId"]),

  // Employee Documents
  employeeDocuments: defineTable({
    organizationId: v.id("organizations"),
    employeeId: v.id("employees"),

    documentType: v.string(),

    storageId: v.id("_storage"),
    fileUrl: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSizeBytes: v.number(),

    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    issuedBy: v.optional(v.string()),
    issuedDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),

    createdAt: v.number(),
    createdBy: v.id("userProfiles"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_employee", ["employeeId"])
    .index("by_organization_employee", ["organizationId", "employeeId"])
    .index("by_organization_expiry", ["organizationId", "expiryDate"]),

  // Report column preferences (per user, per report type)
  reportColumnPreferences: defineTable({
    userId: v.id("users"),
    reportId: v.string(),
    columnIds: v.array(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user_report", ["userId", "reportId"]),

});
