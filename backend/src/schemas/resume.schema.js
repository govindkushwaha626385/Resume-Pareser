import { z } from "zod";

export const ResumeSchema = z.object({
  name: z.string().describe("Full name of the candidate"),
  
  email: z.string().email().describe("Email address"),
  
  phone: z.string().nullable().optional().describe("Phone number"),
  
  location: z.string().nullable().optional().describe("City or Country"),

  skills: z.array(z.string()).describe("List of technical and soft skills"),

  experience: z.array(
    z.object({
      company: z.string().nullable(),
      title: z.string().nullable(),
      startDate: z.string().nullable().describe("Format: YYYY-MM"),
      endDate: z.string().nullable().describe("Format: YYYY-MM or 'Present'"),
      highlights: z.array(z.string()).optional()
    })
  ).describe("Work experience history"),

  education: z.array(
    z.object({
      degree: z.string().nullable(),
      institution: z.string().nullable(),
      year: z.string().nullable().describe("Graduation year")
    })
  ).describe("Educational background"),

  certifications: z.array(z.string()).optional(),

  links: z.object({
    linkedin: z.string().nullable().optional(),
    github: z.string().nullable().optional(),
    portfolio: z.string().nullable().optional()
  }).nullable().optional()
});