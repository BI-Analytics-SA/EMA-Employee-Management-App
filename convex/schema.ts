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
      })
    ),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

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
      v.literal("nurse"),
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
    title: v.union(v.literal("MR"), v.literal("MISS"), v.literal("MRS"), v.literal("MS")),
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

    // Contact
    cellNumber: v.string(),
    alternativeNumber: v.optional(v.string()),

    // Address
    resStreetNo: v.string(),
    resStreetName: v.string(),
    resSuburb: v.string(),
    resCity: v.string(),
    resPostCode: v.string(),

    // Work Info
    departmentWorked: v.optional(v.string()),
    deptGroup: v.optional(v.string()),
    shift: v.optional(v.string()),
    shiftAlloc: v.optional(v.string()),
    training: v.optional(v.boolean()),

    // Status & Dates
    dateRegistered: v.optional(v.number()),
    dateEngaged: v.optional(v.number()),
    lastDateWorked: v.optional(v.number()),
    taxNumber: v.optional(v.string()),
    certificate: v.optional(v.string()),

    // Image (Convex file storage)
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("userProfiles")),
  })
    .index("by_organization", ["organizationId"])
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
    season: v.string(),
    bootsAmount: v.string(),
    employeeNo: v.string(),

    training: v.boolean(),
    deptGroup: v.string(),
    shift: v.string(),
    shiftAlloc: v.string(),
    dateEngaged: v.optional(v.number()),

    // Signature (Convex file storage)
    signatureStorageId: v.optional(v.id("_storage")),
    signatureUrl: v.optional(v.string()),

    createdAt: v.number(),
    createdBy: v.optional(v.id("userProfiles")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_employee", ["employeeId"])
    .index("by_organization_employee", ["organizationId", "employeeId"]),

  // Medical Questionnaires
  medicalQuestionnaires: defineTable({
    organizationId: v.id("organizations"),
    employeeId: v.id("employees"),

    // Health Questions (Yes/No stored as boolean)
    illnessLastTwoYears: v.boolean(),
    illnessLastTwoYearsDetail: v.optional(v.string()),
    treatedTB: v.boolean(),
    treatedTBDetail: v.optional(v.string()),
    onTreatmentNow: v.boolean(),
    hepatitusA: v.boolean(),
    hepatitusB: v.boolean(),
    bloodPressure: v.boolean(),
    diabetes: v.boolean(),
    longTerm: v.boolean(),
    longTermDetail: v.optional(v.string()),
    reasonCantComplete: v.string(),
    notes: v.optional(v.string()),

    // Employee Signature
    emplSignatureStorageId: v.optional(v.id("_storage")),
    emplSignatureUrl: v.optional(v.string()),

    // Nurse Signature
    nurseSignatureStorageId: v.optional(v.id("_storage")),
    nurseSignatureUrl: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("userProfiles")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_employee", ["employeeId"])
    .index("by_organization_employee", ["organizationId", "employeeId"]),
});
