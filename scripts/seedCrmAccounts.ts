import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import connectToDatabase from "../src/lib/mongodb";
import { Company, Project, ClientAccount } from "../src/models";
import { syncTenantWrite } from "../src/lib/tenantDb";

async function seedCrm() {
  await connectToDatabase();
  console.log("Connected to database for CRM seeding.");

  let company = await Company.findOne({ companyCode: "ORGTTV" });
  if (!company) {
    company = await Company.findOne({});
  }
  if (!company) {
    console.error("No company found.");
    process.exit(1);
  }

  const companyId = company._id;
  const companyCode = company.companyCode || "ORGTTV";

  // Find Projects
  const hbsProject = await Project.findOne({ companyId, name: /Hotel Booking/i });
  const esportsProject = await Project.findOne({ companyId, name: /Esports|Monitor/i });

  const accounts = [
    {
      companyId,
      projectId: hbsProject?._id,
      accountName: "Marriott International Hotels",
      tier: "Enterprise Key",
      lifecycleStage: "Active Enterprise",
      industry: "Hospitality & Travel",
      region: "North America",
      contractARR: 140000,
      healthScore: 96,
      primaryContact: {
        name: "David Sterling",
        title: "VP Global Channel Distribution",
        email: "d.sterling@marriott.global",
        phone: "+1 (301) 380-3000",
      },
      accountExecutive: "Himesh Satyam (CEO)",
      nextAction: {
        action: "Executive Q4 Distribution Review & API SLA Renewal",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      interactions: [
        {
          type: "Contract",
          summary: "Executed 2-year enterprise distribution contract with $140,000 ARR baseline.",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          recordedBy: "Himesh Satyam",
        },
        {
          type: "Meeting",
          summary: "Technical integration milestone completed: Booking webhook latency verified under 120ms.",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          recordedBy: "Marcus Vance",
        },
      ],
      notes: "Core enterprise client for HBS. High booking volume across APAC and EMEA properties.",
    },
    {
      companyId,
      projectId: hbsProject?._id,
      accountName: "Accor Hospitality Group",
      tier: "Tier 1 Strategic",
      lifecycleStage: "Contract Expansion",
      industry: "Hospitality & Travel",
      region: "Europe & Middle East",
      contractARR: 95000,
      healthScore: 92,
      primaryContact: {
        name: "Claire Fontaine",
        title: "Head of Digital Platforms EMEA",
        email: "claire.fontaine@accor.com",
        phone: "+33 1 45 38 86 00",
      },
      accountExecutive: "Sarah Connor (Owner)",
      nextAction: {
        action: "Luxury Brand Pilot Expansion (Fairmont & Raffles Integration)",
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
      interactions: [
        {
          type: "Meeting",
          summary: "Quarterly review of loyalty points real-time reconciliation engine.",
          date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          recordedBy: "Sarah Connor",
        },
      ],
      notes: "Expansion opportunity: Ingesting 450 additional boutique hotel properties across France and Germany.",
    },
    {
      companyId,
      projectId: hbsProject?._id,
      accountName: "Hyatt Hotels Corporation",
      tier: "Tier 2 Growth",
      lifecycleStage: "Active Pilot",
      industry: "Hospitality & Travel",
      region: "North America",
      contractARR: 52000,
      healthScore: 88,
      primaryContact: {
        name: "Jonathan Vance",
        title: "Director of Enterprise Systems",
        email: "j.vance@hyatt.com",
        phone: "+1 (312) 750-1234",
      },
      accountExecutive: "Marcus Vance (Manager)",
      nextAction: {
        action: "Pilot Go-Live Signoff for 80 Selected Resorst",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      interactions: [
        {
          type: "Call",
          summary: "Reviewed sandbox test payment settlement flow with finance team.",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          recordedBy: "Marcus Vance",
        },
      ],
      notes: "Onboarding pilot in final acceptance testing phase.",
    },
    {
      companyId,
      projectId: esportsProject?._id,
      accountName: "Cloud9 Esports Operations",
      tier: "Enterprise Key",
      lifecycleStage: "Active Enterprise",
      industry: "Esports & Pro Gaming Hardware",
      region: "North America",
      contractARR: 185000,
      healthScore: 98,
      primaryContact: {
        name: "Jack Etienne",
        title: "Director of Performance & Training Facilities",
        email: "training@cloud9.gg",
        phone: "+1 (310) 906-4550",
      },
      accountExecutive: "Himesh Satyam (CEO)",
      nextAction: {
        action: "Delivery of 120 units ApexVision 300Hz 0.5ms Monitors for Training Camp",
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      },
      interactions: [
        {
          type: "Meeting",
          summary: "Pro player blind latency test results verified: zero ghosting at 300Hz with customized overdrive profile.",
          date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          recordedBy: "Himesh Satyam",
        },
      ],
      notes: "Headline hardware endorsement partner. Featured in official team studio setups.",
    },
    {
      companyId,
      projectId: esportsProject?._id,
      accountName: "ESL FaceIt Tournament Arenas",
      tier: "Tier 1 Strategic",
      lifecycleStage: "Contract Expansion",
      industry: "Esports Tournament Production",
      region: "Global / EMEA",
      contractARR: 240000,
      healthScore: 95,
      primaryContact: {
        name: "Tobias Mueller",
        title: "VP Arena Technology & Broadcast Logistics",
        email: "t.mueller@eslgaming.com",
        phone: "+49 221 880440",
      },
      accountExecutive: "Marcus Vance (Manager)",
      nextAction: {
        action: "Signoff for Katowice & Cologne Stadium Stage Setup Deployments",
        dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      },
      interactions: [
        {
          type: "Call",
          summary: "Confirmed custom OSD tournament firmware profiles with anti-tamper locking.",
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          recordedBy: "Marcus Vance",
        },
      ],
      notes: "Major competitive stage partner. High hardware volume and global broadcast exposure.",
    },
    {
      companyId,
      projectId: esportsProject?._id,
      accountName: "CyberZone PC Cafe Franchise (APAC)",
      tier: "Tier 2 Growth",
      lifecycleStage: "Renewal Pending",
      industry: "Gaming Centers & Commercial Arenas",
      region: "Asia-Pacific",
      contractARR: 90000,
      healthScore: 84,
      primaryContact: {
        name: "Kenji Sato",
        title: "Head of Hardware Procurement",
        email: "sato.k@cyberzone.asia",
        phone: "+81 3 5555 0147",
      },
      accountExecutive: "Priya Sharma (Team Lead)",
      nextAction: {
        action: "Wholesale Rollout Proposal for 240Hz 27-inch Budget Model Spin-Off",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      interactions: [
        {
          type: "Email",
          summary: "Sent quotation and warranty terms for 500-unit bulk order of 240Hz budget spin-off monitors.",
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          recordedBy: "Priya Sharma",
        },
      ],
      notes: "High interest in the 240Hz 0.5ms model for budget-conscious cyber cafe retrofits.",
    },
  ];

  await ClientAccount.deleteMany({ companyId });
  console.log("Cleared old client accounts for company.");

  const createdAccounts = await ClientAccount.insertMany(accounts);
  console.log(`Successfully seeded ${createdAccounts.length} Enterprise Client Accounts.`);

  // Sync to tenant DB
  for (const acc of createdAccounts) {
    try {
      await syncTenantWrite("ClientAccount", "create", acc, undefined, companyCode);
    } catch (err) {
      // Ignored if tenant db write fails
    }
  }

  console.log("CRM accounts successfully synced to tenant database.");
  process.exit(0);
}

seedCrm().catch((err) => {
  console.error("CRM seed error:", err);
  process.exit(1);
});
