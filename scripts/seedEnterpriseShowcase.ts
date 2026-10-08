import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import connectToDatabase from "../src/lib/mongodb";
import {
  Company,
  Project,
  Team,
  User,
  Pipeline,
  TaskNode,
  Cycle,
  Deal,
  Lead,
  Campaign,
  ResourceAllocation,
  Goal,
  Target,
  CustomerFeedback,
  Document,
  ActivityLog,
} from "../src/models";
import { migrateCompanyToDedicatedDb } from "../src/lib/tenantDb";

async function seedEnterpriseShowcase() {
  await connectToDatabase();
  console.log("Connected to MongoDB database.");

  // 1. Locate Target Company (Prefer ORGTTV)
  let company = await Company.findOne({ companyCode: "ORGTTV" });
  if (!company) {
    company = await Company.findOne({});
  }
  if (!company) {
    throw new Error("No company found to seed. Please register an organization first.");
  }

  const companyId = company._id;
  const companyCode = company.companyCode || "ORGTTV";
  console.log(`Seeding showcase projects for Organization: ${company.name} [Code: ${companyCode}, ID: ${companyId}]`);

  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Locate or Upsert Organization Owner
  let owner = await User.findOne({ companyId, role: "owner" });
  if (!owner) {
    owner = await User.create({
      companyId,
      name: "Himesh Satyam",
      email: "owner@cyphertech.com",
      passwordHash,
      role: "owner",
      position: "Chief Executive Officer & Founder",
      rank: "5",
      status: "Working",
      capacityHoursPerWeek: 45,
      skills: ["Strategic Leadership", "Product Architecture", "Executive Operations"],
      performanceScore: 98,
      relevancyScore: 100,
      supervisorRating: 5.0,
      teamLeadRating: 5.0,
      details: "Organization founder and executive sponsor.",
    });
  }

  // 3. Create / Upsert 8 Specialist Team Members
  const newMembersData = [
    // --- Hotel Booking Service (HBS) Specialists ---
    {
      name: "Elena Vance",
      email: "elena.vance@cyphertech.com",
      role: "manager",
      position: "VP Hotel Partnerships & Commercialization",
      rank: "4",
      skills: ["Hospitality Operations", "Hotel PMS Systems", "B2B Negotiations", "Channel Management"],
      performanceScore: 94,
      relevancyScore: 96,
      supervisorRating: 4.8,
      teamLeadRating: 4.9,
      details: "Former Director of Business Development at Luxury Hotel Alliance.",
    },
    {
      name: "Dev Patel",
      email: "dev.patel@cyphertech.com",
      role: "teamlead",
      position: "Lead Full-Stack & PMS Booking Architect",
      rank: "4",
      skills: ["Next.js", "PMS Sync Webhooks", "Stripe Multi-Currency", "Microservices", "PostgreSQL"],
      performanceScore: 96,
      relevancyScore: 98,
      supervisorRating: 4.9,
      teamLeadRating: 4.8,
      details: "Staff software engineer leading direct booking engine and payment systems.",
    },
    {
      name: "Chloe Zhao",
      email: "chloe.zhao@cyphertech.com",
      role: "employee",
      position: "Senior Travel Operations & Guest Concierge Lead",
      rank: "3",
      skills: ["Guest Experience", "Dispute Resolution", "OTA Booking Workflows", "VIP Concierge"],
      performanceScore: 91,
      relevancyScore: 92,
      supervisorRating: 4.7,
      teamLeadRating: 4.7,
      details: "Manages 24/7 guest helpline SOPs, refunds, and property relationship management.",
    },
    {
      name: "Sarah Jenkins",
      email: "sarah.jenkins@cyphertech.com",
      role: "teamlead",
      position: "Head of Performance Marketing & Growth",
      rank: "4",
      skills: ["Google Hotel Ads", "Meta-Search Bidding", "Instagram Ad Blitz", "CAC/LTV Analytics"],
      performanceScore: 93,
      relevancyScore: 95,
      supervisorRating: 4.8,
      teamLeadRating: 4.8,
      details: "Oversees global digital acquisition campaigns across travel meta-search engines.",
    },

    // --- ApexVision Esports Monitor Hardware Specialists ---
    {
      name: "Dr. Liam Chen",
      email: "liam.chen@cyphertech.com",
      role: "manager",
      position: "Staff Optical & Hardware Systems Architect",
      rank: "5",
      skills: ["Fast-IPS Panel Physics", "Liquid Crystal Overdrive", "DisplayPort 2.1 DSC", "Thermal Modeling"],
      performanceScore: 98,
      relevancyScore: 99,
      supervisorRating: 5.0,
      teamLeadRating: 4.9,
      details: "Ph.D. in Applied Optics; pioneer in sub-1ms liquid crystal backlight strobing.",
    },
    {
      name: "Marcus Brody",
      email: "marcus.brody@cyphertech.com",
      role: "teamlead",
      position: "Senior Supply Chain & Tooling Lead",
      rank: "4",
      skills: ["CNC Aluminum Tooling", "Injection Molding", "BOM Cost Engineering", "Supplier Logistics"],
      performanceScore: 92,
      relevancyScore: 94,
      supervisorRating: 4.7,
      teamLeadRating: 4.8,
      details: "Manages contract manufacturer tooling lines, mold tolerances, and panel vendor contracts.",
    },
    {
      name: "Kenji Takahashi",
      email: "kenji.takahashi@cyphertech.com",
      role: "employee",
      position: "Senior Display Calibration & QA Engineer",
      rank: "3",
      skills: ["Colorimeter Calibration", "sRGB/DCI-P3 Accuracy", "CE/FCC Compliance", "Drop & Burn-in Stress"],
      performanceScore: 90,
      relevancyScore: 93,
      supervisorRating: 4.6,
      teamLeadRating: 4.7,
      details: "Leads display testing lab, delta-E color grading, and international safety certifications.",
    },
    {
      name: "Alex Rivera",
      email: "alex.rivera@cyphertech.com",
      role: "teamlead",
      position: "Global Esports Sponsorship & Retail Director",
      rank: "4",
      skills: ["Retail Merchandising", "BestBuy/MicroCenter POs", "Esports Team Sponsorships", "Channel Sales"],
      performanceScore: 95,
      relevancyScore: 97,
      supervisorRating: 4.9,
      teamLeadRating: 4.9,
      details: "Drives Tier-1 distributor distribution deals and competitive esports tournament contracts.",
    },
  ];

  const memberMap: Record<string, any> = { owner };
  for (const m of newMembersData) {
    let userDoc = await User.findOne({ companyId, email: m.email });
    if (!userDoc) {
      userDoc = await User.create({
        companyId,
        ...m,
        passwordHash,
        status: "Working",
        capacityHoursPerWeek: 40,
        completedProjectsCount: 3,
        currentProjectsCount: 2,
        remarks: "Active core division staff member.",
      });
    }
    memberMap[m.name] = userDoc;
  }
  console.log("Team members ready.");

  // 4. Create Specialized Teams
  // HBS Teams
  let teamHbsDev = await Team.findOne({ companyId, name: "dev_fullstack_HBS_Core" });
  if (!teamHbsDev) {
    teamHbsDev = await Team.create({
      companyId,
      name: "dev_fullstack_HBS_Core",
      members: [memberMap["Dev Patel"]._id, owner._id],
    });
  }

  let teamHbsOps = await Team.findOne({ companyId, name: "ops_field_Hotel_Onboarding" });
  if (!teamHbsOps) {
    teamHbsOps = await Team.create({
      companyId,
      name: "ops_field_Hotel_Onboarding",
      members: [memberMap["Elena Vance"]._id, memberMap["Chloe Zhao"]._id],
    });
  }

  let teamHbsGrowth = await Team.findOne({ companyId, name: "growth_digital_HBS_Marketing" });
  if (!teamHbsGrowth) {
    teamHbsGrowth = await Team.create({
      companyId,
      name: "growth_digital_HBS_Marketing",
      members: [memberMap["Sarah Jenkins"]._id],
    });
  }

  // Esports Monitor Teams
  let teamEsportsRnd = await Team.findOne({ companyId, name: "dev_embedded_Hardware_Optical_R&D" });
  if (!teamEsportsRnd) {
    teamEsportsRnd = await Team.create({
      companyId,
      name: "dev_embedded_Hardware_Optical_R&D",
      members: [memberMap["Dr. Liam Chen"]._id, owner._id],
    });
  }

  let teamEsportsTooling = await Team.findOne({ companyId, name: "ops_vendor_Industrial_Tooling_Assembly" });
  if (!teamEsportsTooling) {
    teamEsportsTooling = await Team.create({
      companyId,
      name: "ops_vendor_Industrial_Tooling_Assembly",
      members: [memberMap["Marcus Brody"]._id],
    });
  }

  let teamEsportsQa = await Team.findOne({ companyId, name: "qa_performance_Display_Certification" });
  if (!teamEsportsQa) {
    teamEsportsQa = await Team.create({
      companyId,
      name: "qa_performance_Display_Certification",
      members: [memberMap["Kenji Takahashi"]._id],
    });
  }

  let teamEsportsSales = await Team.findOne({ companyId, name: "sales_direct_Global_Esports_Retail" });
  if (!teamEsportsSales) {
    teamEsportsSales = await Team.create({
      companyId,
      name: "sales_direct_Global_Esports_Retail",
      members: [memberMap["Alex Rivera"]._id],
    });
  }
  console.log("Teams established.");

  // =========================================================================
  // 5. PROJECT 1: Hotel Booking Service (HBS) [Service & Platform Marketplace]
  // =========================================================================
  let hbsProject = await Project.findOne({ companyId, name: "Hotel Booking Service (HBS)" });
  if (!hbsProject) {
    hbsProject = await Project.create({
      companyId,
      name: "Hotel Booking Service (HBS)",
      description: "Direct-to-consumer travel booking platform connecting independent boutique hotels with global guests via real-time PMS inventory synchronization, automated 12% commission escrow, and high-conversion meta-search campaigns.",
      category: "Client",
      status: "Active",
      health: "On Track",
      budgetUSD: 650000,
      scaling: 1.25,
      ownerId: owner._id,
      leadId: memberMap["Elena Vance"]._id,
      memberIds: [
        memberMap["Elena Vance"]._id,
        memberMap["Dev Patel"]._id,
        memberMap["Chloe Zhao"]._id,
        memberMap["Sarah Jenkins"]._id,
        owner._id,
      ],
      teams: [teamHbsDev._id, teamHbsOps._id, teamHbsGrowth._id],
      agendas: [
        "Phase 1: Hotel PMS API integration architecture & commission framework",
        "Phase 2: Multi-currency booking engine with instant payment checkout",
        "Phase 3: 50-property boutique hotel channel pilot in metropolitan hubs",
        "Phase 4: Global ad blitz across Google Travel & Instagram with automated concierge dispatch",
      ],
      tags: ["hospitality", "marketplace", "travel-tech", "booking-engine", "stripe-connect"],
    });
  }
  console.log(`Project 1 created: ${hbsProject.name}`);

  // HBS Cycles (Sprints & Batches)
  const hbsCycle1 = await Cycle.findOneAndUpdate(
    { companyId, project: hbsProject._id, name: "Sprint 01 - Discovery, Market Blueprint & Legal PMS SOPs" },
    {
      companyId,
      project: hbsProject._id,
      name: "Sprint 01 - Discovery, Market Blueprint & Legal PMS SOPs",
      startDate: new Date(Date.now() - 90 * 86400000),
      endDate: new Date(Date.now() - 60 * 86400000),
    },
    { upsert: true, new: true }
  );

  const hbsCycle2 = await Cycle.findOneAndUpdate(
    { companyId, project: hbsProject._id, name: "Sprint 02 - Direct Booking Engine & Stripe Checkout Flow" },
    {
      companyId,
      project: hbsProject._id,
      name: "Sprint 02 - Direct Booking Engine & Stripe Checkout Flow",
      startDate: new Date(Date.now() - 60 * 86400000),
      endDate: new Date(Date.now() - 30 * 86400000),
    },
    { upsert: true, new: true }
  );

  const hbsCycle3 = await Cycle.findOneAndUpdate(
    { companyId, project: hbsProject._id, name: "Batch 03 - 50 Hotel Pilot Onboarding & Room Inventory Sync" },
    {
      companyId,
      project: hbsProject._id,
      name: "Batch 03 - 50 Hotel Pilot Onboarding & Room Inventory Sync",
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() + 15 * 86400000),
    },
    { upsert: true, new: true }
  );

  const hbsCycle4 = await Cycle.findOneAndUpdate(
    { companyId, project: hbsProject._id, name: "Sprint 04 - Meta-Search Ad Scaling & Concierge Loyalty Rollout" },
    {
      companyId,
      project: hbsProject._id,
      name: "Sprint 04 - Meta-Search Ad Scaling & Concierge Loyalty Rollout",
      startDate: new Date(Date.now() + 15 * 86400000),
      endDate: new Date(Date.now() + 60 * 86400000),
    },
    { upsert: true, new: true }
  );

  // HBS Pipelines
  const hbsPipeDiscovery = await Pipeline.findOneAndUpdate(
    { companyId, projectId: hbsProject._id, name: "HBS Plan Discovery & Market Commission Architecture" },
    {
      companyId,
      projectId: hbsProject._id,
      teamId: teamHbsOps._id,
      name: "HBS Plan Discovery & Market Commission Architecture",
      category: "Operations",
      owner: "Elena Vance",
      ownerId: memberMap["Elena Vance"]._id,
      status: "Active",
      startDate: new Date("2026-08-15T00:00:00.000Z"),
      endDate: new Date("2026-09-18T00:00:00.000Z"),
      progress: 100,
      priority: "High",
      riskLevel: "Low",
      budget: "$45,000",
      cashFlowProjectionUSD: 0,
      expensesUSD: 38000,
      roiPercent: 180,
      objectives: "Survey 120 boutique hotels, establish legal partnership master contract, and benchmark 12% commission viability.",
      dependencies: "None (Groundwork Discovery)",
      outcome: "Validated contract templates, partner SLA standards, and commission unit economics.",
      todos: [
        { text: "Analyze competitor OTA fee structures (Booking.com, Expedia)", completed: true, assigneeName: "Elena Vance" },
        { text: "Define 12% standard hotel commission + 3% credit processing model", completed: true, assigneeName: "Elena Vance" },
        { text: "Draft Legal Hotel Master Service Agreement (MSA) template", completed: true, assigneeName: "Chloe Zhao" },
        { text: "Survey 120 boutique hotel operators across top 5 metropolitan markets", completed: true, assigneeName: "Elena Vance" },
      ],
    },
    { upsert: true, new: true }
  );

  const hbsPipeDev = await Pipeline.findOneAndUpdate(
    { companyId, projectId: hbsProject._id, name: "Web & Mobile Guest Booking Platform" },
    {
      companyId,
      projectId: hbsProject._id,
      teamId: teamHbsDev._id,
      name: "Web & Mobile Guest Booking Platform",
      category: "Development",
      owner: "Dev Patel",
      ownerId: memberMap["Dev Patel"]._id,
      status: "Active",
      startDate: new Date("2026-09-10T00:00:00.000Z"),
      endDate: new Date("2026-10-28T00:00:00.000Z"),
      progress: 85,
      priority: "High",
      riskLevel: "Low",
      budget: "$180,000",
      cashFlowProjectionUSD: 450000,
      expensesUSD: 145000,
      roiPercent: 310,
      objectives: "Develop resilient Next.js direct booking engine with two-way PMS webhooks and Stripe Connect split billing.",
      dependencies: "HBS Plan Discovery & Market Commission Architecture",
      outcome: "High-performance booking webapp handling sub-second room availability search and instant mobile checkout.",
      todos: [
        { text: "Search indexing with date-range & room capacity filters", completed: true, assigneeName: "Dev Patel" },
        { text: "Direct PMS bidirectional availability webhooks (Opera & Cloudbeds)", completed: true, assigneeName: "Dev Patel" },
        { text: "Stripe 3D-Secure multi-currency payment checkout", completed: true, assigneeName: "Dev Patel" },
        { text: "Automated guest confirmation email & SMS dispatch", completed: true, assigneeName: "Dev Patel" },
        { text: "Booking cancellation & instant refund escrow logic", completed: false, assigneeName: "Dev Patel" },
      ],
    },
    { upsert: true, new: true }
  );

  const hbsPipeOnboarding = await Pipeline.findOneAndUpdate(
    { companyId, projectId: hbsProject._id, name: "Hotel Partner Channel Integration & Property Onboarding" },
    {
      companyId,
      projectId: hbsProject._id,
      teamId: teamHbsOps._id,
      name: "Hotel Partner Channel Integration & Property Onboarding",
      category: "Service Operations & Channels",
      owner: "Elena Vance",
      ownerId: memberMap["Elena Vance"]._id,
      status: "Active",
      startDate: new Date("2026-09-25T00:00:00.000Z"),
      endDate: new Date("2026-11-12T00:00:00.000Z"),
      progress: 70,
      priority: "High",
      riskLevel: "Medium",
      budget: "$120,000",
      cashFlowProjectionUSD: 680000,
      expensesUSD: 95000,
      roiPercent: 420,
      objectives: "Contract and onboard initial 50 luxury and boutique hotels, upload room assets, and calibrate front-desk booking intake.",
      dependencies: "Web & Mobile Guest Booking Platform",
      outcome: "Live inventory of 50 flagship properties with 1,200 rentable room nights per month.",
      todos: [
        { text: "Sign initial 50 boutique hotels across NY, SF, London, Tokyo, Paris", completed: true, assigneeName: "Elena Vance" },
        { text: "Perform high-resolution photography & 360 virtual room scans", completed: true, assigneeName: "Chloe Zhao" },
        { text: "Verify PMS inventory mapping and rate parity compliance", completed: true, assigneeName: "Elena Vance" },
        { text: "Hotel staff front-desk portal training & emergency escalation hotline", completed: false, assigneeName: "Chloe Zhao" },
        { text: "Publish pilot properties live on guest-facing booking channel", completed: false, assigneeName: "Elena Vance" },
      ],
    },
    { upsert: true, new: true }
  );

  const hbsPipeMarketing = await Pipeline.findOneAndUpdate(
    { companyId, projectId: hbsProject._id, name: "Direct Channel & Meta-Search Performance Ad Campaigns" },
    {
      companyId,
      projectId: hbsProject._id,
      teamId: teamHbsGrowth._id,
      name: "Direct Channel & Meta-Search Performance Ad Campaigns",
      category: "Marketing",
      owner: "Sarah Jenkins",
      ownerId: memberMap["Sarah Jenkins"]._id,
      status: "Active",
      startDate: new Date("2026-10-12T00:00:00.000Z"),
      endDate: new Date("2026-12-05T00:00:00.000Z"),
      progress: 60,
      priority: "High",
      riskLevel: "Low",
      budget: "$200,000",
      cashFlowProjectionUSD: 850000,
      expensesUSD: 160000,
      roiPercent: 530,
      objectives: "Scale Google Travel & Meta-Search Ads to achieve sub-$35 Guest Acquisition Cost with 4.5x ROAS.",
      dependencies: "Hotel Partner Channel Integration & Property Onboarding",
      outcome: "Continuous stream of organic and paid bookings driving regular commission inflows.",
      todos: [
        { text: "Google Hotel Ads & Meta-Search Bid Optimization integration", completed: true, assigneeName: "Sarah Jenkins" },
        { text: "Instagram & TikTok travel influencer partnership campaign", completed: true, assigneeName: "Sarah Jenkins" },
        { text: "Retargeting funnel for uncompleted cart bookings", completed: true, assigneeName: "Sarah Jenkins" },
        { text: "Summer 2026 early-bird promotion ad blitz", completed: false, assigneeName: "Sarah Jenkins" },
        { text: "Affiliate travel blogger commission dashboard", completed: false, assigneeName: "Sarah Jenkins" },
      ],
    },
    { upsert: true, new: true }
  );

  const hbsPipeConcierge = await Pipeline.findOneAndUpdate(
    { companyId, projectId: hbsProject._id, name: "Guest Concierge & Continuous Revenue Circulation" },
    {
      companyId,
      projectId: hbsProject._id,
      teamId: teamHbsOps._id,
      name: "Guest Concierge & Continuous Revenue Circulation",
      category: "Finance",
      owner: "Chloe Zhao",
      ownerId: memberMap["Chloe Zhao"]._id,
      status: "Active",
      startDate: new Date("2026-11-01T00:00:00.000Z"),
      endDate: new Date("2026-12-30T00:00:00.000Z"),
      progress: 50,
      priority: "Medium",
      riskLevel: "Low",
      budget: "$105,000",
      cashFlowProjectionUSD: 1200000,
      expensesUSD: 82000,
      roiPercent: 880,
      objectives: "Deliver VIP guest support, handle automated weekly hotel payout disbursements, and capture recurring corporate travel accounts.",
      dependencies: "Direct Channel & Meta-Search Performance Ad Campaigns",
      outcome: "Self-sustaining revenue cycle with 38% repeat traveler re-booking rate.",
      todos: [
        { text: "Automate weekly hotel commission reconciliation & Stripe payouts", completed: true, assigneeName: "Chloe Zhao" },
        { text: "Launch VIP guest loyalty repeat booking perks", completed: true, assigneeName: "Chloe Zhao" },
        { text: "24/7 AI-assisted WhatsApp concierge chat support", completed: false, assigneeName: "Dev Patel" },
        { text: "Upsell room upgrades, spa sessions, and late checkouts", completed: false, assigneeName: "Chloe Zhao" },
      ],
    },
    { upsert: true, new: true }
  );

  const hbsPipeSales = await Pipeline.findOneAndUpdate(
    { companyId, projectId: hbsProject._id, name: "Hospitality Partner Acquisition & B2B Corporate Sales" },
    {
      companyId,
      projectId: hbsProject._id,
      teamId: teamHbsOps._id,
      name: "Hospitality Partner Acquisition & B2B Corporate Sales",
      category: "Sales",
      owner: "Elena Vance",
      ownerId: memberMap["Elena Vance"]._id,
      status: "Active",
      startDate: new Date("2026-10-01T00:00:00.000Z"),
      endDate: new Date("2026-12-15T00:00:00.000Z"),
      progress: 75,
      priority: "High",
      riskLevel: "Low",
      budget: "$150,000",
      cashFlowProjectionUSD: 1450000,
      expensesUSD: 110000,
      roiPercent: 720,
      objectives: "Contract 50 boutique properties, establish enterprise corporate travel rates, and maintain 12% commission booking schedule.",
      dependencies: "Hotel Partner Channel Integration & Property Onboarding",
      outcome: "High-volume recurring hotel booking transaction flow and corporate accounts.",
      todos: [
        { text: "Sign Master Service Agreements with 50 flagship boutique hotels", completed: true, assigneeName: "Elena Vance" },
        { text: "Establish corporate employee travel discounts with enterprise partners", completed: true, assigneeName: "Elena Vance" },
        { text: "Negotiate 12% tiered booking commission schedule", completed: true, assigneeName: "Elena Vance" },
        { text: "Structure group tour operator wholesale volume allocation", completed: false, assigneeName: "Chloe Zhao" },
        { text: "Deploy self-service hotel vendor onboarding portal", completed: false, assigneeName: "Elena Vance" },
      ],
    },
    { upsert: true, new: true }
  );

  // HBS Tasks
  const hbsTasks = [
    {
      name: "Market Demand & Commission Viability Study",
      description: "Survey 120 boutique hotels across top tourist hubs; model 12% booking commission vs 18-25% legacy OTA fees.",
      pipelineId: hbsPipeDiscovery._id,
      cycleId: hbsCycle1._id,
      status: "Done",
      severity: "high",
      estimatedHours: 45,
      actualHours: 42,
      module: "Strategy",
      assignee: "Elena Vance",
      assignees: [memberMap["Elena Vance"]._id],
    },
    {
      name: "Hotel Partner Legal & Payout Terms Standardization",
      description: "Draft Master Service Agreement including 48hr cancellation terms, dispute escrow, and Stripe payout timelines.",
      pipelineId: hbsPipeDiscovery._id,
      cycleId: hbsCycle1._id,
      status: "Done",
      severity: "medium",
      estimatedHours: 30,
      actualHours: 32,
      module: "Legal",
      assignee: "Chloe Zhao",
      assignees: [memberMap["Chloe Zhao"]._id],
    },
    {
      name: "PMS Bidirectional Two-Way Webhook Synchronization Engine",
      description: "Construct scalable microservice connecting Cloudbeds and Oracle Opera PMS APIs to sync real-time room availability.",
      pipelineId: hbsPipeDev._id,
      cycleId: hbsCycle2._id,
      status: "Done",
      severity: "critical",
      estimatedHours: 80,
      actualHours: 85,
      module: "Backend",
      assignee: "Dev Patel",
      assignees: [memberMap["Dev Patel"]._id],
    },
    {
      name: "Elasticsearch Room Availability & Dynamic Price Calculator",
      description: "Implement high-throughput search filtering by city, amenities, guest count, and dynamic surge pricing models.",
      pipelineId: hbsPipeDev._id,
      cycleId: hbsCycle2._id,
      status: "Done",
      severity: "high",
      estimatedHours: 60,
      actualHours: 58,
      module: "Search",
      assignee: "Dev Patel",
      assignees: [memberMap["Dev Patel"]._id],
    },
    {
      name: "Stripe Connect Multi-Vendor Split Payouts",
      description: "Configure instant traveler card processing with automated 88% net hotel transfer and 12% platform revenue withholding.",
      pipelineId: hbsPipeDev._id,
      cycleId: hbsCycle2._id,
      status: "Done",
      severity: "critical",
      estimatedHours: 50,
      actualHours: 48,
      module: "Fintech",
      assignee: "Dev Patel",
      assignees: [memberMap["Dev Patel"]._id],
    },
    {
      name: "Mobile Responsive Guest Booking Flow & Checkout UX",
      description: "Design clean 3-step guest checkout with Apple Pay, Google Pay, and instant digital reservation pass issuance.",
      pipelineId: hbsPipeDev._id,
      cycleId: hbsCycle2._id,
      status: "Code Review",
      severity: "high",
      estimatedHours: 45,
      actualHours: 40,
      module: "Frontend",
      assignee: "Dev Patel",
      assignees: [memberMap["Dev Patel"]._id],
    },
    {
      name: "Guest Reservation Modification & Self-Serve Cancellation Portal",
      description: "Allow guests to modify dates or cancel within refundable window with automatic room relisting in PMS.",
      pipelineId: hbsPipeDev._id,
      cycleId: hbsCycle3._id,
      status: "In Progress",
      severity: "medium",
      estimatedHours: 35,
      actualHours: 18,
      module: "Frontend",
      assignee: "Dev Patel",
      assignees: [memberMap["Dev Patel"]._id],
    },
    {
      name: "Top-50 Boutique Hotels Commercial Contracts Signing",
      description: "Negotiate and execute signed partnership agreements across flagship independent hotels in Manhattan, Tokyo, and London.",
      pipelineId: hbsPipeOnboarding._id,
      cycleId: hbsCycle3._id,
      status: "Done",
      severity: "high",
      estimatedHours: 120,
      actualHours: 110,
      module: "Partnerships",
      assignee: "Elena Vance",
      assignees: [memberMap["Elena Vance"]._id],
    },
    {
      name: "Property Asset Curation & Room Inventory Digital Cataloging",
      description: "Ingest high-res photos, 360-degree virtual room previews, amenity badges, and localized neighborhood guidebooks.",
      pipelineId: hbsPipeOnboarding._id,
      cycleId: hbsCycle3._id,
      status: "Done",
      severity: "medium",
      estimatedHours: 90,
      actualHours: 80,
      module: "Content",
      assignee: "Chloe Zhao",
      assignees: [memberMap["Chloe Zhao"]._id],
    },
    {
      name: "Hotel Front-Desk Staff Operations Training & SOP Handover",
      description: "Conduct webinar sessions and supply printed laminated SOP guides for front desk check-in verification.",
      pipelineId: hbsPipeOnboarding._id,
      cycleId: hbsCycle3._id,
      status: "In Progress",
      severity: "medium",
      estimatedHours: 40,
      actualHours: 26,
      module: "Operations",
      assignee: "Chloe Zhao",
      assignees: [memberMap["Chloe Zhao"]._id],
    },
    {
      name: "Channel Manager Rate Parity Live Verification",
      description: "Audit automated pricing to guarantee rates shown match or beat Booking.com and Expedia direct rates.",
      pipelineId: hbsPipeOnboarding._id,
      cycleId: hbsCycle3._id,
      status: "In Progress",
      severity: "high",
      estimatedHours: 30,
      actualHours: 12,
      module: "QA",
      assignee: "Elena Vance",
      assignees: [memberMap["Elena Vance"]._id],
    },
    {
      name: "Google Travel Ads Integration & Feed API Sync",
      description: "Connect real-time pricing feeds to Google Hotel Center for featured placement in Google Search and Google Maps.",
      pipelineId: hbsPipeMarketing._id,
      cycleId: hbsCycle4._id,
      status: "Done",
      severity: "high",
      estimatedHours: 50,
      actualHours: 46,
      module: "Marketing",
      assignee: "Sarah Jenkins",
      assignees: [memberMap["Sarah Jenkins"]._id],
    },
    {
      name: "High-Conversion Staycation Ad Creative Production",
      description: "Produce video ad creative showcasing weekend urban luxury getaways with exclusive 15% booking perks.",
      pipelineId: hbsPipeMarketing._id,
      cycleId: hbsCycle4._id,
      status: "Done",
      severity: "medium",
      estimatedHours: 40,
      actualHours: 38,
      module: "Creative",
      assignee: "Sarah Jenkins",
      assignees: [memberMap["Sarah Jenkins"]._id],
    },
    {
      name: "Influencer Sponsored Stays & Content Amplification Blitz",
      description: "Partner with 15 verified travel creators to publish reels showcasing partner boutique suites.",
      pipelineId: hbsPipeMarketing._id,
      cycleId: hbsCycle4._id,
      status: "In Progress",
      severity: "medium",
      estimatedHours: 60,
      actualHours: 45,
      module: "Social",
      assignee: "Sarah Jenkins",
      assignees: [memberMap["Sarah Jenkins"]._id],
    },
    {
      name: "Automated Weekly Hotel Payout Settlement & Invoicing",
      description: "Generate compliant tax invoices and dispatch scheduled ACH/SEPA wire transfers to partner hotel accounts.",
      pipelineId: hbsPipeConcierge._id,
      cycleId: hbsCycle4._id,
      status: "Done",
      severity: "high",
      estimatedHours: 35,
      actualHours: 32,
      module: "Finance",
      assignee: "Chloe Zhao",
      assignees: [memberMap["Chloe Zhao"]._id],
    },
    {
      name: "Repeat Booking Loyalty Reward Engine & Guest Credits",
      description: "Credit 5% booking value to traveler digital wallet for subsequent stays to increase platform stickiness.",
      pipelineId: hbsPipeConcierge._id,
      cycleId: hbsCycle4._id,
      status: "In Progress",
      severity: "medium",
      estimatedHours: 45,
      actualHours: 30,
      module: "Growth",
      assignee: "Chloe Zhao",
      assignees: [memberMap["Chloe Zhao"]._id],
    },
  ];

  for (const t of hbsTasks) {
    await TaskNode.findOneAndUpdate(
      { companyId, projectId: hbsProject._id, name: t.name },
      { companyId, projectId: hbsProject._id, ...t },
      { upsert: true }
    );
  }

  // HBS Campaigns & Deals
  const hbsCamp1 = await Campaign.findOneAndUpdate(
    { companyId, projectId: hbsProject._id, name: "Summer Vacation 2026 Google Ads Blitz" },
    {
      companyId,
      projectId: hbsProject._id,
      pipelineId: hbsPipeMarketing._id,
      name: "Summer Vacation 2026 Google Ads Blitz",
      type: "Search Ads",
      leadsGenerated: 420,
      expectedRevenue: 650000,
    },
    { upsert: true, new: true }
  );

  const hbsCamp2 = await Campaign.findOneAndUpdate(
    { companyId, projectId: hbsProject._id, name: "Instagram Boutique Staycation Campaign" },
    {
      companyId,
      projectId: hbsProject._id,
      pipelineId: hbsPipeMarketing._id,
      name: "Instagram Boutique Staycation Campaign",
      type: "Social Ads",
      leadsGenerated: 280,
      expectedRevenue: 380000,
    },
    { upsert: true, new: true }
  );

  const hbsDeals = [
    {
      name: "Marriott Autograph Boutique Group - Pilot Chain Agreement",
      amount: 320000,
      revenue: 320000,
      stage: "Integration",
      status: "Won",
      client: { name: "Autograph Boutique Collection", industry: "Hospitality", region: "North America" },
      expectedCloseDate: new Date(Date.now() - 15 * 86400000),
      isRecurring: true,
      owner: "Elena Vance",
      ownerId: memberMap["Elena Vance"]._id,
      pipelineId: hbsPipeOnboarding._id,
      campaignId: hbsCamp1._id,
      metadata: { priority: "High", riskLevel: "Low", notes: "12 properties live; weekly payouts settled smoothly." },
    },
    {
      name: "Independent Hotel Union (50 Properties) Channel Contract",
      amount: 480000,
      revenue: 480000,
      stage: "Closed",
      status: "Won",
      client: { name: "Independent Hotelier Alliance", industry: "Travel & Lodging", region: "Europe & UK" },
      expectedCloseDate: new Date(Date.now() - 5 * 86400000),
      isRecurring: true,
      owner: "Elena Vance",
      ownerId: memberMap["Elena Vance"]._id,
      pipelineId: hbsPipeOnboarding._id,
      campaignId: hbsCamp2._id,
      metadata: { priority: "Critical", riskLevel: "Low", notes: "Flagship master agreement covering 50 properties." },
    },
    {
      name: "Deloitte Global Corporate Travel Channel Partnership",
      amount: 250000,
      revenue: 250000,
      stage: "Due Diligence",
      status: "Active",
      client: { name: "Deloitte Corporate Services", industry: "Consulting & Enterprise", region: "Global" },
      expectedCloseDate: new Date(Date.now() + 25 * 86400000),
      isRecurring: true,
      owner: "Elena Vance",
      ownerId: memberMap["Elena Vance"]._id,
      pipelineId: hbsPipeConcierge._id,
      metadata: { priority: "High", riskLevel: "Medium", notes: "Negotiating direct employee business travel rates." },
    },
    {
      name: "Kyoto Heritage Ryokan Association Master Booking Contract",
      amount: 180000,
      revenue: 180000,
      stage: "Initial Analysis",
      status: "Active",
      client: { name: "Kyoto Traditional Inns Union", industry: "Cultural Tourism", region: "Asia Pacific" },
      expectedCloseDate: new Date(Date.now() + 45 * 86400000),
      isRecurring: true,
      owner: "Chloe Zhao",
      ownerId: memberMap["Chloe Zhao"]._id,
      pipelineId: hbsPipeOnboarding._id,
      metadata: { priority: "Medium", riskLevel: "Low", notes: "Multilingual concierge integration requirement." },
    },
  ];

  const createdHbsDeals: any[] = [];
  for (const d of hbsDeals) {
    const doc = await Deal.findOneAndUpdate(
      { companyId, projectId: hbsProject._id, name: d.name },
      { companyId, projectId: hbsProject._id, ...d },
      { upsert: true, new: true }
    );
    createdHbsDeals.push(doc);
  }

  // HBS Leads
  const hbsLeads = [
    { name: "The Nomad Hotel Group", status: "Qualified", source: "Direct Outreach", owner: "Elena Vance", ownerId: memberMap["Elena Vance"]._id, campaignId: hbsCamp1._id },
    { name: "CitizenM Urban Hotels", status: "Qualified", source: "Partner Referral", owner: "Elena Vance", ownerId: memberMap["Elena Vance"]._id, campaignId: hbsCamp1._id },
    { name: "Ace Hotel Management", status: "Working", source: "Web Inbound", owner: "Chloe Zhao", ownerId: memberMap["Chloe Zhao"]._id, campaignId: hbsCamp2._id },
    { name: "Aman Luxury Resorts APAC", status: "New", source: "Industry Conference", owner: "Elena Vance", ownerId: memberMap["Elena Vance"]._id },
    { name: "Backpacker Budget Hostels Network", status: "Unqualified", source: "Cold Inbound", owner: "Chloe Zhao", ownerId: memberMap["Chloe Zhao"]._id },
  ];
  for (const l of hbsLeads) {
    await Lead.findOneAndUpdate(
      { companyId, name: l.name },
      { companyId, ...l },
      { upsert: true }
    );
  }

  // HBS Resource Allocations
  const hbsResources = [
    { name: "AWS & Google Cloud PMS Webhook Infrastructure", type: "Budget", totalAllocated: 60000, totalUsed: 42000, riskLevel: "Low", assignedToProjectId: hbsProject._id },
    { name: "Hotel Property Onboarding Field Specialists", type: "Headcount", totalAllocated: 140000, totalUsed: 115000, riskLevel: "Medium", assignedToProjectId: hbsProject._id },
    { name: "Meta-Search Bidding & Influencer Marketing Budget", type: "Budget", totalAllocated: 220000, totalUsed: 165000, riskLevel: "Low", assignedToProjectId: hbsProject._id },
    { name: "24/7 Guest Concierge Operations & Multilingual Desk", type: "Headcount", totalAllocated: 90000, totalUsed: 58000, riskLevel: "Low", assignedToProjectId: hbsProject._id, linkedDealId: createdHbsDeals[0]?._id },
  ];
  for (const r of hbsResources) {
    await ResourceAllocation.findOneAndUpdate(
      { companyId, assignedToProjectId: hbsProject._id, name: r.name },
      { companyId, ...r },
      { upsert: true }
    );
  }

  // HBS Goal & Targets
  const hbsGoal = await Goal.findOneAndUpdate(
    { companyId, title: "Global Hotel Marketplace Expansion & Liquid Booking Circulation" },
    {
      companyId,
      title: "Global Hotel Marketplace Expansion & Liquid Booking Circulation",
      description: "Scale HBS to $2.5M in monthly gross booking value while retaining a verified network of 200 high-rating boutique hotels.",
      category: "Company",
      status: "On Track",
    },
    { upsert: true, new: true }
  );

  await Target.findOneAndUpdate(
    { companyId, goalId: hbsGoal._id, name: "Achieve $2.5M Monthly Gross Booking Volume" },
    {
      companyId,
      goalId: hbsGoal._id,
      name: "Achieve $2.5M Monthly Gross Booking Volume",
      expectedValue: 2500000,
      actualValue: 1680000,
      achievedRevenueUSD: 1680000,
      conversionRate: "67.2%",
      targetByRegion: { "North America": 950000, "Europe": 520000, "Asia Pacific": 210000 },
      industry: "Hospitality & Travel",
      region: "Global",
      status: "Active",
      checklist: [
        { name: "Finalize Stripe Connect instant split payouts", isCompleted: true },
        { name: "Launch 50 flagship boutique properties in pilot cities", isCompleted: true },
        { name: "Scale Google Hotel Ads campaign to 4.5x ROAS", isCompleted: false },
      ],
    },
    { upsert: true }
  );

  await Target.findOneAndUpdate(
    { companyId, goalId: hbsGoal._id, name: "Onboard 200 Certified Boutique Hotel Properties" },
    {
      companyId,
      goalId: hbsGoal._id,
      name: "Onboard 200 Certified Boutique Hotel Properties",
      expectedValue: 1200000,
      actualValue: 860000,
      achievedRevenueUSD: 860000,
      conversionRate: "36.0%",
      targetByRegion: { "North America": 520000, "Europe": 340000 },
      industry: "Hospitality",
      region: "North America & Europe",
      status: "Active",
      checklist: [
        { name: "Sign Master Service Agreements for 50 properties", isCompleted: true },
        { name: "Complete room photo and rate parity digital audit", isCompleted: true },
        { name: "Train front-desk staff on instant booking verification SOP", isCompleted: false },
      ],
    },
    { upsert: true }
  );

  // HBS Feedback & Documents
  await CustomerFeedback.findOneAndUpdate(
    { projectId: hbsProject._id, title: "Effortless Check-in via HBS Digital Reservation Pass" },
    {
      projectId: hbsProject._id,
      title: "Effortless Check-in via HBS Digital Reservation Pass",
      type: "Customer Praise",
      priority: "Low",
      status: "Resolved",
      description: "Guest reported seamless arrival at The Greenwich Hotel NYC with instant room key issuance without front-desk wait.",
    },
    { upsert: true }
  );

  await Document.findOneAndUpdate(
    { companyId, title: "HBS_PMS_Two_Way_Integration_Specification.pdf" },
    {
      companyId,
      category: "PROJECT",
      subType: "Technical Architecture",
      entityId: hbsProject._id,
      title: "HBS_PMS_Two_Way_Integration_Specification.pdf",
      originalName: "HBS_PMS_Integration_Spec_v2.pdf",
      mimeType: "application/pdf",
      fileSize: 2450000,
      s3Key: `companies/${companyId}/projects/${hbsProject._id}/hbs_pms_spec.pdf`,
      uploadedBy: memberMap["Dev Patel"]._id,
    },
    { upsert: true }
  );

  // =========================================================================
  // 6. PROJECT 2: ApexVision Esports Monitor (Hardware Manufacturing)
  // =========================================================================
  let monitorProject = await Project.findOne({ companyId, name: "ApexVision Esports Monitor 2K" });
  if (!monitorProject) {
    monitorProject = await Project.create({
      companyId,
      name: "ApexVision Esports Monitor 2K",
      description: "Hardware engineering and physical manufacturing program developing the flagship 300Hz 0.5ms 27-inch 2K Fast-IPS competitive gaming monitor alongside the mid-cycle 240Hz 0.5ms 27-inch budget model spin-off for mass esports arenas and global retail distribution.",
      category: "Product",
      status: "Active",
      health: "On Track",
      budgetUSD: 1850000,
      scaling: 1.5,
      ownerId: owner._id,
      leadId: memberMap["Dr. Liam Chen"]._id,
      memberIds: [
        memberMap["Dr. Liam Chen"]._id,
        memberMap["Marcus Brody"]._id,
        memberMap["Kenji Takahashi"]._id,
        memberMap["Alex Rivera"]._id,
        owner._id,
      ],
      teams: [teamEsportsRnd._id, teamEsportsTooling._id, teamEsportsQa._id, teamEsportsSales._id],
      agendas: [
        "Phase 1: Fast-IPS panel liquid crystal overdrive tuning for authentic 0.5ms MPRT & 300Hz refresh rate",
        "Phase 2: CNC aluminum stand tooling, chassis thermal mold fabrication, and DP 2.1 mainboard PCB",
        "Phase 3: Mid-lifecycle value-engineering spin-off: 240Hz 0.5ms budget edition with identical response latency",
        "Phase 4: 1,000-unit pilot manufacturing run, global ocean freight staging, and retail purchase order deliveries",
      ],
      tags: ["hardware", "manufacturing", "display-optics", "esports", "300hz", "240hz-budget", "fast-ips"],
    });
  }
  console.log(`Project 2 created: ${monitorProject.name}`);

  // Monitor Cycles (Batches & Sprints)
  const monCycle1 = await Cycle.findOneAndUpdate(
    { companyId, project: monitorProject._id, name: "Batch 01 - 300Hz 2K Optical R&D & CAD Chassis Blueprint" },
    {
      companyId,
      project: monitorProject._id,
      name: "Batch 01 - 300Hz 2K Optical R&D & CAD Chassis Blueprint",
      startDate: new Date(Date.now() - 120 * 86400000),
      endDate: new Date(Date.now() - 75 * 86400000),
    },
    { upsert: true, new: true }
  );

  const monCycle2 = await Cycle.findOneAndUpdate(
    { companyId, project: monitorProject._id, name: "Batch 02 - Stand Tooling, Panel Calibration & Golden Samples" },
    {
      companyId,
      project: monitorProject._id,
      name: "Batch 02 - Stand Tooling, Panel Calibration & Golden Samples",
      startDate: new Date(Date.now() - 75 * 86400000),
      endDate: new Date(Date.now() - 20 * 86400000),
    },
    { upsert: true, new: true }
  );

  const monCycle3 = await Cycle.findOneAndUpdate(
    { companyId, project: monitorProject._id, name: "Batch 03 - 240Hz Budget Model Spin-off & Cost Optimization" },
    {
      companyId,
      project: monitorProject._id,
      name: "Batch 03 - 240Hz Budget Model Spin-off & Cost Optimization",
      startDate: new Date(Date.now() - 20 * 86400000),
      endDate: new Date(Date.now() + 25 * 86400000),
    },
    { upsert: true, new: true }
  );

  const monCycle4 = await Cycle.findOneAndUpdate(
    { companyId, project: monitorProject._id, name: "Batch 04 - Global Ocean Freight & Tier-1 Retail Staging" },
    {
      companyId,
      project: monitorProject._id,
      name: "Batch 04 - Global Ocean Freight & Tier-1 Retail Staging",
      startDate: new Date(Date.now() + 25 * 86400000),
      endDate: new Date(Date.now() + 90 * 86400000),
    },
    { upsert: true, new: true }
  );

  // Monitor Pipelines
  const monPipeRnd = await Pipeline.findOneAndUpdate(
    { companyId, projectId: monitorProject._id, name: "Flagship 300Hz 0.5ms 2K Fast-IPS Architecture & CAD" },
    {
      companyId,
      projectId: monitorProject._id,
      teamId: teamEsportsRnd._id,
      name: "Flagship 300Hz 0.5ms 2K Fast-IPS Architecture & CAD",
      category: "Development",
      owner: "Dr. Liam Chen",
      ownerId: memberMap["Dr. Liam Chen"]._id,
      status: "Active",
      startDate: new Date("2026-07-20T00:00:00.000Z"),
      endDate: new Date("2026-09-08T00:00:00.000Z"),
      progress: 100,
      priority: "Critical",
      riskLevel: "Low",
      budget: "$320,000",
      cashFlowProjectionUSD: 0,
      expensesUSD: 295000,
      roiPercent: 240,
      objectives: "Develop proprietary voltage overdrive algorithm reaching true 0.5ms MPRT at 300Hz without reverse-ghosting artifacts.",
      dependencies: "None (Core R&D)",
      outcome: "Validated panel schematics, DP 2.1 PCB layout, and 3-side borderless CAD chassis.",
      todos: [
        { text: "Simulate Fast-IPS liquid crystal response time at 300Hz refresh rate", completed: true, assigneeName: "Dr. Liam Chen" },
        { text: "Engineer custom backlight strobing matrix to eliminate motion blur (0.5ms MPRT)", completed: true, assigneeName: "Dr. Liam Chen" },
        { text: "Design 3-side borderless chassis CAD with active air cooling channels", completed: true, assigneeName: "Dr. Liam Chen" },
        { text: "Layout DisplayPort 2.1 UHBR10 and Dual HDMI 2.1 mainboard PCB", completed: true, assigneeName: "Dr. Liam Chen" },
      ],
    },
    { upsert: true, new: true }
  );

  const monPipeTooling = await Pipeline.findOneAndUpdate(
    { companyId, projectId: monitorProject._id, name: "Display Tooling, BOM Sourcing & Panel Calibration" },
    {
      companyId,
      projectId: monitorProject._id,
      teamId: teamEsportsTooling._id,
      name: "Display Tooling, BOM Sourcing & Panel Calibration",
      category: "Physical Goods & Hardware",
      owner: "Marcus Brody",
      ownerId: memberMap["Marcus Brody"]._id,
      status: "Active",
      startDate: new Date("2026-08-25T00:00:00.000Z"),
      endDate: new Date("2026-10-18T00:00:00.000Z"),
      progress: 75,
      priority: "High",
      riskLevel: "Medium",
      budget: "$550,000",
      cashFlowProjectionUSD: 750000,
      expensesUSD: 480000,
      roiPercent: 340,
      objectives: "Fabricate CNC injection molds for monitor chassis, source Grade-A 2K Fast-IPS panels, and calibrate colorimeter profiles.",
      dependencies: "Flagship 300Hz 0.5ms 2K Fast-IPS Architecture & CAD",
      outcome: "50 golden engineering sample monitors passing color delta-E < 1.0 inspection.",
      todos: [
        { text: "Source Grade-A Fast-IPS 27-inch 2560x1440 panels (AUO / LG Display)", completed: true, assigneeName: "Marcus Brody" },
        { text: "Fabricate aluminum CNC injection molds for monitor stand & pivot hinge", completed: true, assigneeName: "Marcus Brody" },
        { text: "Factory colorimeter calibration profile (98% DCI-P3, Delta E < 1.0)", completed: true, assigneeName: "Kenji Takahashi" },
        { text: "Conduct 1,000-hour continuous stress thermal chamber burn-in", completed: false, assigneeName: "Kenji Takahashi" },
        { text: "Assemble 50 golden sample engineering prototypes", completed: true, assigneeName: "Marcus Brody" },
      ],
    },
    { upsert: true, new: true }
  );

  const monPipeBudget = await Pipeline.findOneAndUpdate(
    { companyId, projectId: monitorProject._id, name: "Budget 240Hz 0.5ms 27-inch Model Spin-off & Cost Engineering" },
    {
      companyId,
      projectId: monitorProject._id,
      teamId: teamEsportsRnd._id,
      name: "Budget 240Hz 0.5ms 27-inch Model Spin-off & Cost Engineering",
      category: "Physical Goods & Hardware",
      owner: "Dr. Liam Chen",
      ownerId: memberMap["Dr. Liam Chen"]._id,
      status: "Active",
      startDate: new Date("2026-09-15T00:00:00.000Z"),
      endDate: new Date("2026-11-15T00:00:00.000Z"),
      progress: 60,
      priority: "High",
      riskLevel: "Low",
      budget: "$180,000",
      cashFlowProjectionUSD: 920000,
      expensesUSD: 140000,
      roiPercent: 550,
      objectives: "Engineer sub-$279 budget variant running at 240Hz 0.5ms using standardized VESA stand and high-yield controller to capture mass market.",
      dependencies: "Display Tooling, BOM Sourcing & Panel Calibration",
      outcome: "Cost-engineered 240Hz gaming display maintaining competitive esports responsiveness at 35% lower BOM cost.",
      todos: [
        { text: "Value-engineer 240Hz 0.5ms panel controller retaining ultra-low input lag", completed: true, assigneeName: "Dr. Liam Chen" },
        { text: "Standardize VESA-compatible budget stand to reduce BOM cost by $45/unit", completed: true, assigneeName: "Marcus Brody" },
        { text: "Optimize power delivery for external compact 65W GaN adapter", completed: true, assigneeName: "Dr. Liam Chen" },
        { text: "Benchmark 240Hz budget prototype vs 300Hz flagship in CS2/Valorant", completed: false, assigneeName: "Kenji Takahashi" },
        { text: "Finalize $279 retail MSRP target price structure", completed: true, assigneeName: "Alex Rivera" },
      ],
    },
    { upsert: true, new: true }
  );

  const monPipeManufacturing = await Pipeline.findOneAndUpdate(
    { companyId, projectId: monitorProject._id, name: "Mass Pilot Manufacturing & Global Ocean Freight" },
    {
      companyId,
      projectId: monitorProject._id,
      teamId: teamEsportsTooling._id,
      name: "Mass Pilot Manufacturing & Global Ocean Freight",
      category: "Operations",
      owner: "Marcus Brody",
      ownerId: memberMap["Marcus Brody"]._id,
      status: "Active",
      startDate: new Date("2026-10-15T00:00:00.000Z"),
      endDate: new Date("2026-12-10T00:00:00.000Z"),
      progress: 40,
      priority: "Critical",
      riskLevel: "High",
      budget: "$420,000",
      cashFlowProjectionUSD: 1850000,
      expensesUSD: 360000,
      roiPercent: 410,
      objectives: "Run 1,000-unit pilot manufacturing run (700x 300Hz flagship, 300x 240Hz budget), pass CE/FCC, and stage 40ft containers.",
      dependencies: "Budget 240Hz 0.5ms 27-inch Model Spin-off & Cost Engineering",
      outcome: "Fully certified, palletized monitor inventory staged in North American & European 3PL distribution hubs.",
      todos: [
        { text: "Manufacture 1,000-unit pilot production run (700 units 300Hz, 300 units 240Hz)", completed: true, assigneeName: "Marcus Brody" },
        { text: "Secure CE, FCC, RoHS, and UL safety certifications", completed: true, assigneeName: "Kenji Takahashi" },
        { text: "Book 40-foot high-cube shipping containers to Long Beach & Rotterdam", completed: false, assigneeName: "Marcus Brody" },
        { text: "Stage inventory in Los Angeles 3PL fulfillment distribution hub", completed: false, assigneeName: "Marcus Brody" },
      ],
    },
    { upsert: true, new: true }
  );

  const monPipeSales = await Pipeline.findOneAndUpdate(
    { companyId, projectId: monitorProject._id, name: "Global Esports Sponsorship & Retail Distribution" },
    {
      companyId,
      projectId: monitorProject._id,
      teamId: teamEsportsSales._id,
      name: "Global Esports Sponsorship & Retail Distribution",
      category: "Finance",
      owner: "Alex Rivera",
      ownerId: memberMap["Alex Rivera"]._id,
      status: "Active",
      startDate: new Date("2026-11-01T00:00:00.000Z"),
      endDate: new Date("2027-01-10T00:00:00.000Z"),
      progress: 45,
      priority: "High",
      riskLevel: "Medium",
      budget: "$380,000",
      cashFlowProjectionUSD: 3200000,
      expensesUSD: 290000,
      roiPercent: 780,
      objectives: "Secure MicroCenter and Best Buy nationwide shelf placement, sponsor NA CS2 Pro League, and manage Amazon launch day sales.",
      dependencies: "Mass Pilot Manufacturing & Global Ocean Freight",
      outcome: "Direct retail presence across 200+ physical stores with 5,000 pre-ordered units.",
      todos: [
        { text: "Sign exclusive monitor supplier agreement with North American CS2 Pro League", completed: true, assigneeName: "Alex Rivera" },
        { text: "Distributor purchase orders with MicroCenter and Best Buy", completed: true, assigneeName: "Alex Rivera" },
        { text: "Send 25 review units to top tech creators (Monitors Unboxed, Linus Tech)", completed: true, assigneeName: "Alex Rivera" },
        { text: "Launch Amazon Prime launch day pre-orders", completed: false, assigneeName: "Alex Rivera" },
        { text: "Establish 3-year zero bright dot warranty return depot", completed: false, assigneeName: "Marcus Brody" },
      ],
    },
    { upsert: true, new: true }
  );

  const monPipeCommercial = await Pipeline.findOneAndUpdate(
    { companyId, projectId: monitorProject._id, name: "Wholesale Distribution & Retail Channel Commercial Pipeline" },
    {
      companyId,
      projectId: monitorProject._id,
      teamId: teamEsportsSales._id,
      name: "Wholesale Distribution & Retail Channel Commercial Pipeline",
      category: "Sales",
      owner: "Alex Rivera",
      ownerId: memberMap["Alex Rivera"]._id,
      status: "Active",
      startDate: new Date("2026-10-01T00:00:00.000Z"),
      endDate: new Date("2026-12-20T00:00:00.000Z"),
      progress: 65,
      priority: "Critical",
      riskLevel: "Medium",
      budget: "$250,000",
      cashFlowProjectionUSD: 2400000,
      expensesUSD: 180000,
      roiPercent: 680,
      objectives: "Secure MicroCenter and Best Buy wholesale purchase orders and establish esports arena hardware supply contracts.",
      dependencies: "Mass Pilot Manufacturing & Global Ocean Freight",
      outcome: "Direct wholesale and retail pipeline fulfilling initial 10,000 units.",
      todos: [
        { text: "Finalize MicroCenter 5,000 unit opening wholesale purchase order", completed: true, assigneeName: "Alex Rivera" },
        { text: "Secure Best Buy nationwide shelf placement in top 400 gaming departments", completed: true, assigneeName: "Alex Rivera" },
        { text: "Contract 2,500 budget units for CyberArena esports cafe franchise", completed: true, assigneeName: "Alex Rivera" },
        { text: "Sign exclusive monitor fleet supplier deal for ESL Pro League", completed: false, assigneeName: "Alex Rivera" },
        { text: "Launch Amazon B2B Commercial Prime storefront", completed: false, assigneeName: "Alex Rivera" },
      ],
    },
    { upsert: true, new: true }
  );

  // Monitor Tasks
  const monTasks = [
    {
      name: "CAD Modeling & Ergonomics Blueprint",
      description: "Produce full 3D CAD parametric assemblies for 27-inch 3-side borderless bezel, aluminum pivot base, and concealed cable channel.",
      pipelineId: monPipeRnd._id,
      cycleId: monCycle1._id,
      status: "Done",
      severity: "high",
      estimatedHours: 90,
      actualHours: 88,
      module: "Hardware CAD",
      assignee: "Dr. Liam Chen",
      assignees: [memberMap["Dr. Liam Chen"]._id],
    },
    {
      name: "Fast-IPS 300Hz Overdrive Algorithm Calibration",
      description: "Fine-tune 64-step LUT voltage drive matrix to push liquid crystals to 0.5ms MPRT without coronas or color overshoot.",
      pipelineId: monPipeRnd._id,
      cycleId: monCycle1._id,
      status: "Done",
      severity: "critical",
      estimatedHours: 110,
      actualHours: 115,
      module: "Optics & Firmware",
      assignee: "Dr. Liam Chen",
      assignees: [memberMap["Dr. Liam Chen"]._id],
    },
    {
      name: "High-Bandwidth DP 2.1 Mainboard Schematic & PCB Layout",
      description: "Layout 8-layer impedance-matched PCB supporting 80Gbps UHBR20 DisplayPort 2.1 and dual HDMI 2.1 FRL connections.",
      pipelineId: monPipeRnd._id,
      cycleId: monCycle1._id,
      status: "Done",
      severity: "high",
      estimatedHours: 75,
      actualHours: 72,
      module: "PCB Engineering",
      assignee: "Dr. Liam Chen",
      assignees: [memberMap["Dr. Liam Chen"]._id],
    },
    {
      name: "BOM (Bill of Materials) & Parts Sourcing",
      description: "Secure panel contracts for 10,000 Fast-IPS modules, Texas Instruments power ICs, and aluminum stand extrusions.",
      pipelineId: monPipeTooling._id,
      cycleId: monCycle2._id,
      status: "Done",
      severity: "critical",
      estimatedHours: 80,
      actualHours: 78,
      module: "Supply Chain",
      assignee: "Marcus Brody",
      assignees: [memberMap["Marcus Brody"]._id],
    },
    {
      name: "Prototype Tooling & Machine Assembly",
      description: "Machine CNC steel injection dies for front bezel, rear housing, and dual-axis friction tilt hinge.",
      pipelineId: monPipeTooling._id,
      cycleId: monCycle2._id,
      status: "Done",
      severity: "high",
      estimatedHours: 120,
      actualHours: 125,
      module: "Tooling",
      assignee: "Marcus Brody",
      assignees: [memberMap["Marcus Brody"]._id],
    },
    {
      name: "Stress, Durability & Load Testing",
      description: "Perform 10,000-cycle stand pivot hinge wear test, 1.2m drop test on packaged box, and thermal dissipation chamber burn-in.",
      pipelineId: monPipeTooling._id,
      cycleId: monCycle2._id,
      status: "In Progress",
      severity: "high",
      estimatedHours: 95,
      actualHours: 70,
      module: "QA Stress Lab",
      assignee: "Kenji Takahashi",
      assignees: [memberMap["Kenji Takahashi"]._id],
    },
    {
      name: "Packaging Design & Quality Inspection",
      description: "Engineer high-density recyclable molded pulp cushion packaging passing ISTA 3A transit simulation.",
      pipelineId: monPipeTooling._id,
      cycleId: monCycle2._id,
      status: "Code Review",
      severity: "medium",
      estimatedHours: 40,
      actualHours: 35,
      module: "Packaging",
      assignee: "Marcus Brody",
      assignees: [memberMap["Marcus Brody"]._id],
    },
    {
      name: "240Hz 0.5ms Controller Board Cost-Reduction Engineering",
      description: "Re-architect display controller for 240Hz budget spin-off to eliminate expensive FPGA while maintaining 0.5ms response speed.",
      pipelineId: monPipeBudget._id,
      cycleId: monCycle3._id,
      status: "Done",
      severity: "critical",
      estimatedHours: 65,
      actualHours: 60,
      module: "Cost Engineering",
      assignee: "Dr. Liam Chen",
      assignees: [memberMap["Dr. Liam Chen"]._id],
    },
    {
      name: "Budget Chassis Material Optimization & Simplified Stand BOM",
      description: "Replace dual-axis CNC stand with fixed tilt VESA stand, saving $45 per unit in Bill of Materials cost.",
      pipelineId: monPipeBudget._id,
      cycleId: monCycle3._id,
      status: "Done",
      severity: "high",
      estimatedHours: 50,
      actualHours: 48,
      module: "Hardware Tooling",
      assignee: "Marcus Brody",
      assignees: [memberMap["Marcus Brody"]._id],
    },
    {
      name: "Esports Latency Benchmark Verification (300Hz Flagship vs 240Hz Budget)",
      description: "Measure end-to-end click-to-photon latency on NVIDIA LDAT system; confirm 240Hz model stays within 2.8ms input lag threshold.",
      pipelineId: monPipeBudget._id,
      cycleId: monCycle3._id,
      status: "In Progress",
      severity: "high",
      estimatedHours: 45,
      actualHours: 30,
      module: "Testing & Validation",
      assignee: "Kenji Takahashi",
      assignees: [memberMap["Kenji Takahashi"]._id],
    },
    {
      name: "Batch Pilot Manufacturing Run (1,000 Units)",
      description: "Supervise SMT line assembly and panel integration for 700x 300Hz Flagships and 300x 240Hz Budget models in Shenzhen plant.",
      pipelineId: monPipeManufacturing._id,
      cycleId: monCycle3._id,
      status: "Done",
      severity: "critical",
      estimatedHours: 140,
      actualHours: 135,
      module: "Factory Assembly",
      assignee: "Marcus Brody",
      assignees: [memberMap["Marcus Brody"]._id],
    },
    {
      name: "Regulatory Safety Certification & Compliance Filing (FCC/CE/RoHS)",
      description: "Achieve Class B EMC electromagnetic radiation compliance, CE safety seal, and EnergyStar certification.",
      pipelineId: monPipeManufacturing._id,
      cycleId: monCycle3._id,
      status: "Done",
      severity: "high",
      estimatedHours: 50,
      actualHours: 48,
      module: "Compliance",
      assignee: "Kenji Takahashi",
      assignees: [memberMap["Kenji Takahashi"]._id],
    },
    {
      name: "Warehouse Logistics & Freight Staging",
      description: "Coordinate maritime container transit from Yantian to Long Beach Port; manage customs clearance and 3PL pallet staging.",
      pipelineId: monPipeManufacturing._id,
      cycleId: monCycle4._id,
      status: "In Progress",
      severity: "high",
      estimatedHours: 60,
      actualHours: 25,
      module: "Logistics",
      assignee: "Marcus Brody",
      assignees: [memberMap["Marcus Brody"]._id],
    },
    {
      name: "Major Retail Distribution Purchase Order Negotiation",
      description: "Finalize wholesale agreements with MicroCenter (25 stores) and Best Buy (North America online and flagship gaming stores).",
      pipelineId: monPipeSales._id,
      cycleId: monCycle4._id,
      status: "Done",
      severity: "critical",
      estimatedHours: 100,
      actualHours: 95,
      module: "Commercial Deals",
      assignee: "Alex Rivera",
      assignees: [memberMap["Alex Rivera"]._id],
    },
    {
      name: "Esports Tournament League Official Hardware Sponsorship",
      description: "Contract with ESL Pro League to place 300Hz monitors on main championship stage during live broadcast tournaments.",
      pipelineId: monPipeSales._id,
      cycleId: monCycle4._id,
      status: "Done",
      severity: "high",
      estimatedHours: 80,
      actualHours: 75,
      module: "Sponsorships",
      assignee: "Alex Rivera",
      assignees: [memberMap["Alex Rivera"]._id],
    },
    {
      name: "YouTube Hardware Reviewers Seeding & Embargo Coordination",
      description: "Ship pre-calibrated golden samples to Monitors Unboxed, Optimum Tech, and Hardware Unboxed with synchronized launch review embargo.",
      pipelineId: monPipeSales._id,
      cycleId: monCycle4._id,
      status: "Done",
      severity: "medium",
      estimatedHours: 45,
      actualHours: 40,
      module: "Media PR",
      assignee: "Alex Rivera",
      assignees: [memberMap["Alex Rivera"]._id],
    },
  ];

  for (const t of monTasks) {
    await TaskNode.findOneAndUpdate(
      { companyId, projectId: monitorProject._id, name: t.name },
      { companyId, projectId: monitorProject._id, ...t },
      { upsert: true }
    );
  }

  // Monitor Campaigns & Deals
  const monCamp1 = await Campaign.findOneAndUpdate(
    { companyId, projectId: monitorProject._id, name: "Valorant & CS2 Pro League Sponsorship" },
    {
      companyId,
      projectId: monitorProject._id,
      pipelineId: monPipeSales._id,
      name: "Valorant & CS2 Pro League Sponsorship",
      type: "Esports League Sponsorship",
      leadsGenerated: 120,
      expectedRevenue: 1200000,
    },
    { upsert: true, new: true }
  );

  const monCamp2 = await Campaign.findOneAndUpdate(
    { companyId, projectId: monitorProject._id, name: "YouTube Tech Reviewers Embargo Launch" },
    {
      companyId,
      projectId: monitorProject._id,
      pipelineId: monPipeSales._id,
      name: "YouTube Tech Reviewers Embargo Launch",
      type: "Influencer Hardware Seeding",
      leadsGenerated: 310,
      expectedRevenue: 850000,
    },
    { upsert: true, new: true }
  );

  const monDeals = [
    {
      name: "MicroCenter North America - 5,000 Unit Initial Purchase Order",
      amount: 1850000,
      revenue: 1850000,
      stage: "Integration",
      status: "Won",
      client: { name: "Micro Electronics Inc (MicroCenter)", industry: "Consumer Electronics Retail", region: "North America" },
      expectedCloseDate: new Date(Date.now() - 10 * 86400000),
      isRecurring: true,
      owner: "Alex Rivera",
      ownerId: memberMap["Alex Rivera"]._id,
      pipelineId: monPipeSales._id,
      campaignId: monCamp1._id,
      metadata: { priority: "Critical", riskLevel: "Low", notes: "Wholesale PO for 3,500 flagship 300Hz and 1,500 budget 240Hz units." },
    },
    {
      name: "Best Buy Gaming Category Nationwide Distribution PO",
      amount: 1420000,
      revenue: 1420000,
      stage: "Signing & Closing",
      status: "Active",
      client: { name: "Best Buy Co., Inc.", industry: "Retail Electronics", region: "United States & Canada" },
      expectedCloseDate: new Date(Date.now() + 20 * 86400000),
      isRecurring: true,
      owner: "Alex Rivera",
      ownerId: memberMap["Alex Rivera"]._id,
      pipelineId: monPipeSales._id,
      campaignId: monCamp2._id,
      metadata: { priority: "High", riskLevel: "Medium", notes: "Negotiating shelf placement in top 400 gaming departments." },
    },
    {
      name: "CyberArena Korea & China - 2,500 Unit Esports Net Cafe PO",
      amount: 680000,
      revenue: 680000,
      stage: "Closed",
      status: "Won",
      client: { name: "CyberArena Franchise Group", industry: "Esports Venues", region: "East Asia" },
      expectedCloseDate: new Date(Date.now() - 25 * 86400000),
      isRecurring: true,
      owner: "Alex Rivera",
      ownerId: memberMap["Alex Rivera"]._id,
      pipelineId: monPipeBudget._id,
      metadata: { priority: "High", riskLevel: "Low", notes: "Bulk order specifically for the 240Hz 0.5ms budget edition model." },
    },
    {
      name: "ESL Gaming Championship Official Tournament Fleet Contract",
      amount: 290000,
      revenue: 290000,
      stage: "Closing",
      status: "Active",
      client: { name: "ESL Gaming Network", industry: "Esports Broadcast", region: "Europe" },
      expectedCloseDate: new Date(Date.now() - 40 * 86400000),
      isRecurring: false,
      owner: "Alex Rivera",
      ownerId: memberMap["Alex Rivera"]._id,
      pipelineId: monPipeSales._id,
      campaignId: monCamp1._id,
      metadata: { priority: "Medium", riskLevel: "Low", notes: "Supplies 350 monitors for the live stage in Cologne, Germany." },
    },
  ];

  const createdMonDeals: any[] = [];
  for (const d of monDeals) {
    const doc = await Deal.findOneAndUpdate(
      { companyId, projectId: monitorProject._id, name: d.name },
      { companyId, projectId: monitorProject._id, ...d },
      { upsert: true, new: true }
    );
    createdMonDeals.push(doc);
  }

  // Monitor Leads
  const monLeads = [
    { name: "Fnatic Esports Organization", status: "Qualified", source: "Sponsorship Outreach", owner: "Alex Rivera", ownerId: memberMap["Alex Rivera"]._id, campaignId: monCamp1._id },
    { name: "Target Electronics Merchandising", status: "Qualified", source: "CES Las Vegas", owner: "Alex Rivera", ownerId: memberMap["Alex Rivera"]._id },
    { name: "Newegg Hardware Procurement", status: "Working", source: "B2B Portal", owner: "Alex Rivera", ownerId: memberMap["Alex Rivera"]._id },
    { name: "Scan Computers UK Distro", status: "Working", source: "Distributor Inbound", owner: "Alex Rivera", ownerId: memberMap["Alex Rivera"]._id },
    { name: "Team Liquid Gaming Club", status: "New", source: "Tournament Expo", owner: "Alex Rivera", ownerId: memberMap["Alex Rivera"]._id },
    { name: "Global Surplus LCD Resellers", status: "Unqualified", source: "Inbound Broker", owner: "Alex Rivera", ownerId: memberMap["Alex Rivera"]._id },
  ];
  for (const l of monLeads) {
    await Lead.findOneAndUpdate(
      { companyId, name: l.name },
      { companyId, ...l },
      { upsert: true }
    );
  }

  // Monitor Resource Allocations
  const monResources = [
    { name: "Aluminum Stand Injection Tooling & Precision CNC Molds", type: "Budget", totalAllocated: 280000, totalUsed: 265000, riskLevel: "Medium", assignedToProjectId: monitorProject._id },
    { name: "Fast-IPS Grade-A Panel Production Procurement Envelope", type: "Budget", totalAllocated: 850000, totalUsed: 710000, riskLevel: "Low", assignedToProjectId: monitorProject._id },
    { name: "Display Overdrive & Optical Calibration Laboratory", type: "Equipment", totalAllocated: 120000, totalUsed: 110000, riskLevel: "Low", assignedToProjectId: monitorProject._id },
    { name: "Ocean Freight 40ft Containers & Port Logistics Staging", type: "Budget", totalAllocated: 175000, totalUsed: 95000, riskLevel: "High", assignedToProjectId: monitorProject._id, linkedDealId: createdMonDeals[0]?._id },
    { name: "240Hz Budget Spin-off Value-Engineering R&D Envelope", type: "Budget", totalAllocated: 95000, totalUsed: 62000, riskLevel: "Low", assignedToProjectId: monitorProject._id },
  ];
  for (const r of monResources) {
    await ResourceAllocation.findOneAndUpdate(
      { companyId, assignedToProjectId: monitorProject._id, name: r.name },
      { companyId, ...r },
      { upsert: true }
    );
  }

  // Monitor Goal & Targets
  const monGoal = await Goal.findOneAndUpdate(
    { companyId, title: "Establish ApexVision as Top-3 Global Esports Display Brand" },
    {
      companyId,
      title: "Establish ApexVision as Top-3 Global Esports Display Brand",
      description: "Ship 50,000 units across flagship 300Hz and budget 240Hz models while maintaining verified sub-1ms response speed and zero bright-dot warranty.",
      category: "Company",
      status: "On Track",
    },
    { upsert: true, new: true }
  );

  await Target.findOneAndUpdate(
    { companyId, goalId: monGoal._id, name: "Deliver World-First 300Hz 0.5ms 2K Fast-IPS under $450" },
    {
      companyId,
      goalId: monGoal._id,
      name: "Deliver World-First 300Hz 0.5ms 2K Fast-IPS under $450",
      expectedValue: 3500000,
      actualValue: 2450000,
      achievedRevenueUSD: 2450000,
      conversionRate: "70.0%",
      targetByRegion: { "North America": 1500000, "East Asia": 750000, "Europe": 200000 },
      industry: "Gaming Hardware",
      region: "Global",
      status: "Active",
      checklist: [
        { name: "Fast-IPS 300Hz liquid crystal overdrive validation", isCompleted: true },
        { name: "DisplayPort 2.1 mainboard compliance certification", isCompleted: true },
        { name: "Finalize injection tooling steel molds", isCompleted: true },
      ],
    },
    { upsert: true }
  );

  await Target.findOneAndUpdate(
    { companyId, goalId: monGoal._id, name: "Ship 50,000 Cumulative Monitors (Flagship + Budget Model)" },
    {
      companyId,
      goalId: monGoal._id,
      name: "Ship 50,000 Cumulative Monitors (Flagship + Budget Model)",
      expectedValue: 2500000,
      actualValue: 1850000,
      achievedRevenueUSD: 1850000,
      conversionRate: "74.0%",
      targetByRegion: { "North America": 1100000, "East Asia": 550000, "Europe": 200000 },
      industry: "Consumer Electronics",
      region: "Global",
      status: "Active",
      checklist: [
        { name: "1,000-unit pilot production run in Shenzhen plant", isCompleted: true },
        { name: "240Hz budget edition spin-off validation and drop testing", isCompleted: true },
        { name: "MicroCenter nationwide shelf distribution rollout", isCompleted: false },
      ],
    },
    { upsert: true }
  );

  // Monitor Feedback & Documents
  await CustomerFeedback.findOneAndUpdate(
    { projectId: monitorProject._id, title: "Zero Motion Blur in CS2 Major Tournament Play" },
    {
      projectId: monitorProject._id,
      title: "Zero Motion Blur in CS2 Major Tournament Play",
      type: "Product Review",
      priority: "Low",
      status: "Resolved",
      description: "Pro player review praising the 300Hz 0.5ms MPRT backlight strobing clarity during fast flick shots.",
    },
    { upsert: true }
  );

  await Document.findOneAndUpdate(
    { companyId, title: "ApexVision_300Hz_0.5ms_Optical_Overdrive_Whitepaper.pdf" },
    {
      companyId,
      category: "PROJECT",
      subType: "Technical Specification",
      entityId: monitorProject._id,
      title: "ApexVision_300Hz_0.5ms_Optical_Overdrive_Whitepaper.pdf",
      originalName: "ApexVision_300Hz_Overdrive_v1.pdf",
      mimeType: "application/pdf",
      fileSize: 3850000,
      s3Key: `companies/${companyId}/projects/${monitorProject._id}/apexvision_whitepaper.pdf`,
      uploadedBy: memberMap["Dr. Liam Chen"]._id,
    },
    { upsert: true }
  );

  // 7. Activity Logs
  await ActivityLog.create({
    companyId,
    projectId: hbsProject._id,
    entityType: "Project",
    entityId: hbsProject._id,
    action: "Project Commercialization Milestone Achieved",
    actorId: memberMap["Elena Vance"]._id,
    diff: { milestone: "50-Hotel Partner Pilot Live", grossBookingVolume: "$1,680,000" },
  });

  await ActivityLog.create({
    companyId,
    projectId: monitorProject._id,
    entityType: "Project",
    entityId: monitorProject._id,
    action: "Physical Tooling & 240Hz Budget Spin-off Approved",
    actorId: memberMap["Dr. Liam Chen"]._id,
    diff: { pilotUnits: 1000, targetMSRP: "$279", flagshipMSRP: "$449" },
  });

  // Seed baseline deal and sales pipeline for any existing pre-seed projects (e.g. testproject001)
  const otherProjects = await Project.find({ companyId, _id: { $nin: [hbsProject._id, monitorProject._id] } });
  for (const op of otherProjects) {
    await Deal.findOneAndUpdate(
      { companyId, projectId: op._id, name: `${op.name} - Enterprise Cloud Platform SLA Contract` },
      {
        companyId,
        projectId: op._id,
        name: `${op.name} - Enterprise Cloud Platform SLA Contract`,
        amount: 360000,
        revenue: 360000,
        stage: "Closed",
        status: "Won",
        client: { name: "Enterprise Systems Corp", industry: "Cloud Infrastructure", region: "Global" },
        expectedCloseDate: new Date(Date.now() - 30 * 86400000),
        isRecurring: true,
        metadata: { priority: "High", riskLevel: "Low", notes: "Multi-year annual enterprise licensing and SLA agreement." },
      },
      { upsert: true }
    );

    await Pipeline.findOneAndUpdate(
      { companyId, projectId: op._id, name: `${op.name} - Enterprise Software Licensing & Channel Sales` },
      {
        companyId,
        projectId: op._id,
        name: `${op.name} - Enterprise Software Licensing & Channel Sales`,
        category: "Sales",
        owner: "Himesh satyam",
        status: "Active",
        progress: 80,
        priority: "High",
        riskLevel: "Low",
        budget: "$80,000",
        cashFlowProjectionUSD: 650000,
        expensesUSD: 45000,
        roiPercent: 710,
        objectives: "Outbound enterprise SaaS licensing and SLA support contract pipeline.",
        todos: [
          { text: "Enterprise prospect discovery and security qualification", completed: true, assigneeName: "Himesh satyam" },
          { text: "Deliver enterprise pilot demonstration and SLA signoff", completed: true, assigneeName: "Himesh satyam" },
          { text: "Multi-year license contract execution and kickoff", completed: true, assigneeName: "Himesh satyam" },
          { text: "Annual renewal and capacity upsell reviews", completed: false, assigneeName: "Himesh satyam" },
        ],
      },
      { upsert: true }
    );
  }

  // 8. CRUCIAL: Synchronize Everything into the Isolated Dedicated Tenant Database
  console.log(`Synchronizing all records to dedicated tenant database: projectManageDB_${companyCode}...`);
  const migrationResult = await migrateCompanyToDedicatedDb(companyCode, companyId.toString());
  console.log("Dedicated Tenant DB synchronization complete:", migrationResult);

  console.log("=== SHOWCASE SEEDING COMPLETED SUCCESSFULLY ===");
  return {
    success: true,
    company: company.name,
    companyCode,
    projects: [hbsProject.name, monitorProject.name],
    membersAdded: newMembersData.length,
  };
}

// Allow CLI execution
if (require.main === module) {
  seedEnterpriseShowcase()
    .then((res) => {
      console.log("Seeding summary:", res);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}

export { seedEnterpriseShowcase };
