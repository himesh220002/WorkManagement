import mongoose from "mongoose";
import dotenv from "dotenv";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

dotenv.config();

const baseUri = process.env.MONGODB_URI || "mongodb://localhost:27017/projectManageDB";

async function generateSamplePdf(title: string, organizer: string, transcript: string, takeaways: string[], actionItems: any[]) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([600, 800]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: 730,
    width: 600,
    height: 70,
    color: rgb(0, 0.47, 0.83),
  });

  page.drawText("TASKFLOW ENTERPRISE - OFFICIAL MEETING MINUTES", {
    x: 50,
    y: 765,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`TITLE: ${title.toUpperCase()}`, {
    x: 50,
    y: 742,
    size: 10,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  let y = 700;
  page.drawText(`Organizer: ${organizer} | Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 25;

  page.drawText("KEY TAKEAWAYS & EXECUTIVE SUMMARY", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0.47, 0.83),
  });
  y -= 16;

  for (const t of takeaways) {
    page.drawText(`- ${t}`, {
      x: 60,
      y,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
  }
  y -= 15;

  page.drawText("ACTION ITEMS & ACCOUNTABILITY ROSTER", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.8, 0.3, 0.1),
  });
  y -= 16;

  for (const act of actionItems) {
    page.drawText(`[${act.completed ? "DONE" : "PENDING"}] ${act.text} (@${act.assigneeName || "Team"})`, {
      x: 60,
      y,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
  }
  y -= 15;

  page.drawText("VERBATIM RECORDED DISCUSSION TRANSCRIPT", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 16;

  const words = transcript.split(/\s+/);
  let line = "";
  for (const w of words) {
    if ((line + " " + w).length > 85) {
      page.drawText(line, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
      y -= 13;
      line = w;
      if (y < 60) {
        page = pdfDoc.addPage([600, 800]);
        y = 750;
      }
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) {
    page.drawText(line, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
  }

  const bytes = await pdfDoc.save();
  return `data:application/pdf;base64,${Buffer.from(bytes).toString("base64")}`;
}

async function seedMeetingsForConnection(conn: mongoose.Connection, label: string) {
  console.log(`[Seed] Processing meetings for ${label}...`);
  const Company = conn.collection("companies");
  const Project = conn.collection("projects");
  const ClientAccount = conn.collection("clientaccounts");
  const Meeting = conn.collection("meetings");

  let company =
    (await Company.findOne({ companyCode: "ORGTTV" })) ||
    (await Company.findOne({ name: "TaskFlow Organization" })) ||
    (await Company.findOne({}));

  const companyId = company ? company._id : new mongoose.Types.ObjectId("6ac628dc809cdf949afd0347");

  const hbsProject = await Project.findOne({ companyId, name: /Hotel Booking/i });
  const apexProject = await Project.findOne({ companyId, name: /ApexVision/i });

  const marriottClient = await ClientAccount.findOne({ companyId, accountName: /Marriott/i });
  const cloud9Client = await ClientAccount.findOne({ companyId, accountName: /Cloud9/i });
  const eslClient = await ClientAccount.findOne({ companyId, accountName: /ESL FaceIt/i });

  // Clear existing meetings for this company
  await Meeting.deleteMany({ companyId });

  // 1. Google Meet: HBS Microservices Architecture Council
  const m1Takeaways = [
    "Redis caching layer reduces booking lookups from 180ms to 24ms.",
    "Decouple Stripe payment webhooks into an idempotent Kafka/SQS consumer.",
    "Target zero-downtime Blue/Green Kubernetes rollout scheduled for November 1.",
  ];
  const m1Actions = [
    { text: "Implement distributed lock on hotel room inventory", assigneeName: "Alice Chen", completed: true },
    { text: "Benchmark p99 latency during 15k concurrent booking simulation", assigneeName: "Bob Smith", completed: false },
    { text: "Prepare Prometheus alert rules for booking failure rate > 0.1%", assigneeName: "DevOps", completed: false },
  ];
  const m1Transcript = `David Kim: Welcome everyone to the HBS Architecture Council. Today we need to lock in the microservices decoupling strategy for our booking engine before peak seasonal traffic.
Alice Chen: Looking at our Redis benchmark, caching room availability per property sliced the p95 latency from 180ms down to 24ms. The primary bottleneck now is database locks during simultaneous checkout.
David Kim: What happens when two users attempt booking the presidential suite at the same millisecond?
Alice Chen: We have added distributed Redis locks with a 15-second TTL. If the lock cannot be acquired, the second request safely queues with an exponential backoff.
Bob Smith: What about payment webhooks? Stripe sometimes retries 3 times if our endpoint is slow.
Alice Chen: All webhook consumers now write directly to an idempotent event store. Duplicate events are silently acknowledged with HTTP 200 without double-charging.
David Kim: Excellent. Let us ensure the Blue/Green deployment pipeline passes all smoke tests before November 1.`;

  const m1Pdf = await generateSamplePdf(
    "HBS Microservices Architecture Council",
    "David Kim",
    m1Transcript,
    m1Takeaways,
    m1Actions
  );

  // 2. Discord Voice: Cloud9 Esports 300Hz Testing & Scrims Debrief
  const m2Takeaways = [
    "Fast-IPS panel achieved 0.5ms GTG response with zero motion ghosting in Valorant scrims.",
    "Cloud9 pro athletes requested customized OSD crosshair reticles and black equalizer presets.",
    "Hardware mass production ramp validated for 1,200 tournament units by Q1.",
  ];
  const m2Actions = [
    { text: "Flash v2.4 firmware update with Cloud9 preset color profile", assigneeName: "Firmware Lead", completed: true },
    { text: "Ship 25 validation monitors to Cloud9 Santa Monica Training Facility", assigneeName: "Logistics", completed: true },
    { text: "Finalize co-branded packaging with Cloud9 esports logo", assigneeName: "Product Marketing", completed: false },
  ];
  const m2Transcript = `Jack Etienne: Hey team, we're in the Discord voice lab after running 40 hours of scrim tests with the ApexVision 300Hz monitor.
Lead Engineer: Fantastic Jack! How was the frame pacing and backlight strobe response?
Jack Etienne: The players noticed zero motion blur even during quick flicks in Valorant and CS2. The 300Hz refresh rate combined with 0.5ms GTG is a genuine competitive advantage.
Lead Engineer: Did anyone experience eye strain during long competitive sessions?
Jack Etienne: The flicker-free DC dimming worked wonders. However, the sniper players wanted a dedicated black equalizer preset so enemies in dark corners pop out more clearly.
Lead Engineer: We can bake that into firmware version 2.4 and push it to all testing units next Tuesday.
Jack Etienne: Perfect. Once that is validated, Cloud9 will officially sign off on the 1,200-unit facility equipment deployment!`;

  const m2Pdf = await generateSamplePdf(
    "Cloud9 Esports 300Hz Testing & Scrims Debrief",
    "ApexVision Product Lead",
    m2Transcript,
    m2Takeaways,
    m2Actions
  );

  // 3. Zoom Video: Marriott International Q4 Channel Distribution Expansion
  const m3Takeaways = [
    "Marriott approved expansion of direct booking API integration to 4,200 franchised properties.",
    "Annual Contract Value (ARR) increased by $350,000 for enterprise API tier.",
    "Quarterly security compliance audit passed with zero high-severity findings.",
  ];
  const m3Actions = [
    { text: "Sign amended enterprise master services agreement (MSA)", assigneeName: "Sarah Connor", completed: true },
    { text: "Provision dedicated enterprise VPC connection for Marriott PMS", assigneeName: "Cloud Ops", completed: true },
    { text: "Schedule technical onboarding workshop for EMEA franchise managers", assigneeName: "Customer Success", completed: false },
  ];
  const m3Transcript = `David Sterling: Good morning Sarah. We've reviewed the SLA performance over the past 90 days and the Marriott leadership team is extremely satisfied.
Sarah Connor: That is wonderful to hear, David! We achieved 99.98% uptime across all property reservation syncs.
David Sterling: Our primary objective today is approving the expansion to include an additional 4,200 EMEA properties under the new enterprise pricing framework.
Sarah Connor: That expansion brings our contracted ARR to $680,000 annually, with dedicated 24/7 Tier-1 engineering support and custom SSO authentication.
David Sterling: We are ready to sign the amendment. Legal has already stamped the compliance appendices.
Sarah Connor: Thank you David. We will initiate VPC provisioning immediately and coordinate the onboarding workshop for your technical teams.`;

  const m3Pdf = await generateSamplePdf(
    "Marriott International Q4 Enterprise Channel Expansion",
    "Sarah Connor",
    m3Transcript,
    m3Takeaways,
    m3Actions
  );

  const sampleMeetings = [
    {
      companyId,
      title: "HBS Microservices Architecture Council",
      description: "Weekly engineering architecture alignment, database concurrency, and Kubernetes migration.",
      projectId: hbsProject ? hbsProject._id : undefined,
      organizerName: "David Kim",
      organizerEmail: "david.kim@taskflow.internal",
      scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      durationMinutes: 45,
      platform: "google_meet",
      meetingLink: "https://meet.google.com/hbs-arch-sync",
      attendees: [
        { name: "David Kim", email: "david.kim@taskflow.internal", role: "Host", attendanceStatus: "attended" },
        { name: "Alice Chen", email: "alice.chen@taskflow.internal", role: "Lead Engineer", attendanceStatus: "attended" },
        { name: "Bob Smith", email: "bob.smith@taskflow.internal", role: "Member", attendanceStatus: "attended" },
      ],
      isRecurring: true,
      recurrenceCadence: "weekly",
      recurrenceDayOfWeek: "Monday",
      status: "Completed",
      transcript: m1Transcript,
      transcriptPdfDataUrl: m1Pdf,
      keyTakeaways: m1Takeaways,
      actionItems: m1Actions,
      createdAt: new Date(),
    },
    {
      companyId,
      title: "Cloud9 Esports 300Hz Testing & Scrims Debrief",
      description: "Direct Discord voice lab session reviewing 300Hz GTG panel latency benchmarks and custom athlete profiles.",
      projectId: apexProject ? apexProject._id : undefined,
      clientAccountId: cloud9Client ? cloud9Client._id : undefined,
      clientAccountName: cloud9Client ? cloud9Client.accountName : "Cloud9 Esports Operations",
      organizerName: "Sarah Connor",
      organizerEmail: "sarah.connor@taskflow.local",
      scheduledAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      durationMinutes: 60,
      platform: "discord",
      meetingLink: "https://discord.gg/apexvision-c9",
      discordChannelName: "voice-scrim-lab",
      discordChannelUrl: "https://discord.com/channels/982371928371/voice-scrim-lab",
      attendees: [
        { name: "Jack Etienne", email: "training@cloud9.gg", role: "Client VIP", attendanceStatus: "attended" },
        { name: "Sarah Connor", email: "sarah.connor@taskflow.local", role: "Host", attendanceStatus: "attended" },
        { name: "Display Engineer", email: "firmware@apexvision.internal", role: "Tech Lead", attendanceStatus: "attended" },
      ],
      isRecurring: false,
      recurrenceCadence: "none",
      status: "Completed",
      transcript: m2Transcript,
      transcriptPdfDataUrl: m2Pdf,
      keyTakeaways: m2Takeaways,
      actionItems: m2Actions,
      createdAt: new Date(),
    },
    {
      companyId,
      title: "Marriott International Q4 Enterprise Channel Expansion",
      description: "Executive Zoom review on expanding API channel distribution to 4,200 EMEA properties.",
      clientAccountId: marriottClient ? marriottClient._id : undefined,
      clientAccountName: marriottClient ? marriottClient.accountName : "Marriott International Hotels",
      organizerName: "Sarah Connor",
      organizerEmail: "sarah.connor@taskflow.local",
      scheduledAt: new Date(Date.now() + 26 * 60 * 60 * 1000), // tomorrow
      durationMinutes: 45,
      platform: "zoom",
      meetingLink: "https://zoom.us/j/94827103819",
      attendees: [
        { name: "David Sterling", email: "d.sterling@marriott.global", role: "VP Distribution", attendanceStatus: "confirmed" },
        { name: "Sarah Connor", email: "sarah.connor@taskflow.local", role: "Account Lead", attendanceStatus: "confirmed" },
      ],
      isRecurring: false,
      recurrenceCadence: "none",
      status: "Scheduled",
      transcript: m3Transcript,
      transcriptPdfDataUrl: m3Pdf,
      keyTakeaways: m3Takeaways,
      actionItems: m3Actions,
      createdAt: new Date(),
    },
    {
      companyId,
      title: "Daily Product Growth & Pipeline Sync",
      description: "Recurring daily standup on enterprise lead qualification, pilot telemetry, and MRR forecasts.",
      organizerName: "Sarah Connor",
      organizerEmail: "sarah.connor@taskflow.local",
      scheduledAt: new Date(Date.now() + 14 * 60 * 60 * 1000), // next morning
      durationMinutes: 15,
      platform: "slack",
      meetingLink: "https://slack.com/app_redirect?channel=growth-daily",
      slackChannelName: "growth-daily",
      slackWebhookUrl: "https://hooks.slack.com/services/T000/B000/growth-daily",
      attendees: [
        { name: "Sarah Connor", email: "sarah.connor@taskflow.local", role: "Host", attendanceStatus: "confirmed" },
        { name: "Sales Executive", email: "sales@taskflow.internal", role: "Member", attendanceStatus: "invited" },
        { name: "Growth Lead", email: "growth@taskflow.internal", role: "Member", attendanceStatus: "confirmed" },
      ],
      isRecurring: true,
      recurrenceCadence: "daily",
      recurrenceDayOfWeek: "Weekdays",
      status: "Scheduled",
      transcript: "",
      keyTakeaways: [],
      actionItems: [],
      createdAt: new Date(),
    },
    {
      companyId,
      title: "ESL FaceIt Tournament Display Firmware Calibration",
      description: "Discord technical alignment for tournament main-stage display latency and broadcast sync.",
      projectId: apexProject ? apexProject._id : undefined,
      clientAccountId: eslClient ? eslClient._id : undefined,
      clientAccountName: eslClient ? eslClient.accountName : "ESL FaceIt Tournament Arenas",
      organizerName: "Sarah Connor",
      organizerEmail: "sarah.connor@taskflow.local",
      scheduledAt: new Date(Date.now() + 50 * 60 * 60 * 1000), // in 2 days
      durationMinutes: 45,
      platform: "discord",
      meetingLink: "https://discord.gg/esl-hardware-bridge",
      discordChannelName: "tournament-firmware",
      discordChannelUrl: "https://discord.com/channels/847291029182/tournament-firmware",
      attendees: [
        { name: "Tobias Mueller", email: "t.mueller@eslgaming.com", role: "VP Tech", attendanceStatus: "invited" },
        { name: "Sarah Connor", email: "sarah.connor@taskflow.local", role: "Host", attendanceStatus: "confirmed" },
      ],
      isRecurring: false,
      recurrenceCadence: "none",
      status: "Scheduled",
      transcript: "",
      keyTakeaways: [],
      actionItems: [],
      createdAt: new Date(),
    },
  ];

  await Meeting.insertMany(sampleMeetings);
  console.log(`[Seed] Successfully inserted ${sampleMeetings.length} meetings into ${label}.`);
}

async function run() {
  // Connect to default DB
  console.log("Connecting to default MongoDB...");
  const mainConn = await mongoose.createConnection(baseUri).asPromise();
  await seedMeetingsForConnection(mainConn, "projectManageDB");
  await mainConn.close();

  // Connect to tenant DB if applicable
  const tenantUri = baseUri.replace(/\/projectManageDB(\?|$)/, "/projectManageDB_ORGTTV$1");
  if (tenantUri !== baseUri) {
    console.log("Connecting to tenant database (projectManageDB_ORGTTV)...");
    try {
      const tenantConn = await mongoose.createConnection(tenantUri).asPromise();
      await seedMeetingsForConnection(tenantConn, "projectManageDB_ORGTTV");
      await tenantConn.close();
    } catch (err) {
      console.error("Failed to seed tenant DB:", err);
    }
  }

  console.log("All meeting seeds completed successfully!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
