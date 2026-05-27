import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Email, NotionTicket, NotionLead, SlackMessage, AuditLog, EmailCategory } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialize Gemini AI client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    try {
      aiInstance = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Successfully initialized Gemini GenAI Client");
    } catch (e) {
      console.error("Failed to initialize Gemini AI Client with provided API Key", e);
    }
  }
  return aiInstance;
}

// Memory database with seeded examples
let emailsDB: Email[] = [
  {
    id: "mail-100",
    senderName: "Sarah Jenkins",
    senderEmail: "sjenkins@apextech.com",
    subject: "Urgent: API Integration is throwing 500 errors on production",
    body: "Hi Team, We started getting continuous HTTP 500 Internal Server errors from your API endpoint /v1/triage/ingest about 10 minutes ago. This is blocking our core production pipeline! Can you please check immediately? Contact me at 555-0199.",
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    threadId: "thread-sarah-100",
    hasAttachments: false,
    status: "awaiting_approval",
    category: "urgent",
    confidenceScore: 0.98,
    summary: "API integration endpoint is responding with 500 Internal Server Errors since 10 minutes ago, blocking production.",
    sentiment: "negative",
    extractedEntities: {
      company: "Apex Tech",
      product: "Ingest API",
      name: "Sarah Jenkins"
    },
    draftReply: `Hi Sarah,

This is urgency support from Acme Automation. We have flagged this ticket as Urgent and alerted our core operations team. 

We are actively investigating the HTTP 500 errors on our /v1/triage/ingest endpoint. Initial diagnostics suggest a regional database sync latency, which our infrastructure engineers are deploying a remedy for as we speak. We will provide updates every 15 minutes.

If you have additional logs, please reply directly to this thread (Thread: thread-sarah-100).

Best regards,
Acme Escalations Team`,
    logs: [
      "05:13:08 - Ingestion of Sarah Jenkins completed successfully.",
      "05:13:09 - Strip HTML tags: Clean plain text body.",
      "05:13:10 - Querying Gemini API for email classification.",
      "05:13:11 - Classified: category='urgent', confidence=0.98, sentiment='negative'.",
      "05:13:11 - Category Router: Branch triggered -> immediate Slack DM & high-priority Notion logged.",
      "05:13:12 - Creating high priority draft via Gemini with template contexts."
    ]
  },
  {
    id: "mail-101",
    senderName: "Robert Vance",
    senderEmail: "robert@vanceconsulting.com",
    subject: "Enterprise volume licensing inquiry for Q3 rollout",
    body: "Hello, our firm is looking to transition 150 team members to your inbox automation platform starting July. Do you support volume tier discounting? We also require custom SLAs and dedicated customer success managers. Let us know when we can hop on a demo call next week.",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    threadId: "thread-robert-101",
    hasAttachments: true,
    status: "approved",
    category: "sales",
    confidenceScore: 0.95,
    summary: "Firm seeks to buy team licensing for 150 users with bulk discount and custom service level agreements.",
    sentiment: "positive",
    extractedEntities: {
      company: "Vance Consulting",
      product: "Inbox Automation platform",
      name: "Robert Vance"
    },
    draftReply: `Hi Robert,

Thank you for reaching out to Acme Consulting! We are excited to assist Vance Consulting with your upcoming Q3 rollout for 150 team members.

We definitely provide high-volume enterprise discounting, dedicated customer success support, and customized SLAs. We'd love to organize a tailored demo session and discuss pricing models.

Please select a convenient timing through our sales calendar: https://calendly.com/team-sales

We look forward to collaborating!

Acme Sales Team`,
    logs: [
      "03:13:12 - Input received via polling loop.",
      "03:13:12 - Content parsed: Has attachment: TRUE.",
      "03:13:13 - Requesting category: Classified = 'sales', confidence=0.95.",
      "03:13:13 - Routing: Branch sales -> lead logging database.",
      "03:13:14 - Drafting client proposal with custom parameters."
    ]
  },
  {
    id: "mail-102",
    senderName: "Spam Bot",
    senderEmail: "win-now@casinoriches.net",
    subject: "Exclusive offer!! Get 1,000 Free Credits to play online slots today",
    body: "HUGE OPPORTUNITY. Sign up today and claim $500 free casino play on our state-of-the-art visual slot machine website. Fast payouts, guaranteed return, 100% anonymous playing. Click here to double your wealth immediately!!!",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    threadId: "thread-spam-102",
    hasAttachments: false,
    status: "archived",
    category: "spam",
    confidenceScore: 0.99,
    summary: "Unsolicited visual slot machine casino welcome promotion spam offering free credits.",
    sentiment: "neutral",
    extractedEntities: {
      company: "Casino Riches",
      name: "Spam Bot"
    },
    logs: [
      "01:03:00 - Poller read incoming message from win-now@casinoriches.net.",
      "01:03:00 - Detected casino credit triggers.",
      "01:03:01 - Classification complete with 99% confidence: 'spam'.",
      "01:03:01 - Router: spam -> Silent archive, skip Slack, log metadata to system audit only."
    ]
  }
];

let notionTickets: NotionTicket[] = [
  {
    id: "notion-t-1",
    emailId: "mail-100",
    title: "API Integration is throwing 500 errors on production",
    sender: "sjenkins@apextech.com",
    priority: "High",
    status: "In Progress",
    summary: "API integration is throwing 500 error outputs on apextech endpoint v1/triage/ingest.",
    draftReply: "Hi Sarah, In urgent support regarding apextech... investigating latency.",
    dateReceived: new Date(Date.now() - 3600000 * 2.5).toLocaleDateString()
  }
];

let notionLeads: NotionLead[] = [
  {
    id: "notion-l-1",
    emailId: "mail-101",
    company: "Vance Consulting",
    contact: "Robert Vance",
    email: "robert@vanceconsulting.com",
    category: "Sales Inquiry",
    summary: "Seeks tier bulk discounts and tailored customer success alignment for 150 members.",
    followUpDate: new Date(Date.now() + 3600000 * 48).toLocaleDateString()
  }
];

let slackMessages: SlackMessage[] = [
  {
    id: "slack-m-12",
    emailId: "mail-100",
    channel: "Direct Message",
    title: "🚨 URGENT EMAIL: sjenkins@apextech.com",
    body: "Subject: Urgent: API Integration is throwing 500 errors on production\nSummary: Sarah Jenkins notices production API failure. Contact: 555-0199.",
    draftReply: `Hi Sarah,\n\nThis is urgency support from Acme Automation...`,
    status: "pending",
    timestamp: new Date(Date.now() - 3600000 * 2.5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    interactiveButtons: true
  }
];

let auditLogs: AuditLog[] = [
  {
    id: "audit-1",
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    emailSubject: "Urgent: API Integration is throwing 500 errors on production",
    category: "urgent",
    confidenceScore: 0.98,
    actionTaken: "Dispatched Slack alert and opened high priority Notion task.",
    status: "Success"
  },
  {
    id: "audit-2",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    emailSubject: "Enterprise volume licensing inquiry for Q3 rollout",
    category: "sales",
    confidenceScore: 0.95,
    actionTaken: "Inserted leads record in CRM Notion and generated draft reply suggestion.",
    status: "Success"
  },
  {
    id: "audit-3",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    emailSubject: "Exclusive offer!! Get 1,000 Free Credits to play online slots today",
    category: "spam",
    confidenceScore: 0.99,
    actionTaken: "Silently archived and recorded spam index metric.",
    status: "Success"
  }
];

// Fallback high-fidelity classification engine
function mockTriageWithRuleBased(subject: string, body: string) {
  const content = (subject + " " + body).toLowerCase();
  let category: EmailCategory = "support";
  let confidenceScore = 0.85;
  let summary = "The sender is requesting assistance with system configurations.";
  let sentiment: 'positive' | 'negative' | 'neutral' = "neutral";
  let entities = { company: "Self Employed", product: "Standard Plan", name: "Valued User" };

  if (content.includes("price") || content.includes("quote") || content.includes("buy") || content.includes("discount") || content.includes("license") || content.includes("demo")) {
    category = "sales";
    confidenceScore = 0.94;
    summary = "The client requests business pricing models, commercial demo options, or license discounts.";
    sentiment = "positive";
  } else if (content.includes("urgent") || content.includes("emergency") || content.includes("broken") || content.includes("down") || content.includes("crash") || content.includes("500") || content.includes("critical")) {
    category = "urgent";
    confidenceScore = 0.98;
    summary = "Urgent service incident report where critical operational pathways appear blocked.";
    sentiment = "negative";
  } else if (content.includes("slots") || content.includes("winner") || content.includes("free credit") || content.includes("rolex") || content.includes("casino") || content.includes("viagra")) {
    category = "spam";
    confidenceScore = 0.99;
    summary = "Unsolicited financial lottery, pharmaceutical promotion, or digital betting advertisement.";
    sentiment = "neutral";
  } else if (content.includes("newsletter") || content.includes("digest") || content.includes("weekly") || content.includes("marketing") || content.includes("blog")) {
    category = "newsletter";
    confidenceScore = 0.89;
    summary = "A recurring visual marketing update or informative subscription newsletter.";
    sentiment = "positive";
  }

  // Extract name/company patterns
  const nameMatch = body.match(/thanks,\s*([A-Z][a-z]+\s*[A-Z]?[a-z]*)/i) || body.match(/regards,\s*([A-Z][a-z]+\s*[A-Z]?[a-z]*)/i);
  if (nameMatch) {
    entities.name = nameMatch[1];
  }
  const companyMatch = body.match(/at\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
  if (companyMatch) {
    entities.company = companyMatch[1];
  }

  return { category, confidenceScore, summary, sentiment, entities };
}

// Fallback auto-drafting
function mockDraftWithRuleBased(category: string, subject: string, body: string, senderName: string) {
  const cleanName = senderName || "there";
  if (category === "support") {
    return `Hi ${cleanName},

Thank you for your inquiry regarding: "${subject}".

To solve this issue quickly, we suggest the following standard fixes:
1. Hard-refresh the portal tab in your browser.
2. Visit our centralized help platform at https://help.widgets.com to review documentation.
3. Verify your configuration variables are safely synced.

If your problem persists, please reply in this thread!

Warm regards,
Acme Support Team`;
  } else if (category === "sales") {
    return `Hi ${cleanName},

Thanks for expressing business interest in our product catalog!

We offer comprehensive volume options, custom consulting integrations, and tailored discount levels for scaling operations.

To explore options and lock down customized setup tiers, please coordinate a demo call with our engineering staff:
Select scheduling at: https://calendly.com/team-sales

Respectfully,
Acme Growth Team`;
  } else if (category === "urgent") {
    return `Hi ${cleanName},

This is an automated priority dispatch from our Incident Operations team. We have registered your issue as CRITICAL.

Subject referenced: "${subject}".

A senior infrastructure systems team member has been paged immediately via Slack and is looking over server-side log updates. We prioritize uptime integrity and will follow-up on this thread with manual findings within 15 minutes.

Sincerely,
Acme Critical Response Team`;
  } else if (category === "newsletter" || category === "internal") {
    return `Hi Admin,

We've recorded your reference content. Since it is a low-touch newsletter update or internal digest, it has been aggregated into your end-of-day digest system. No immediate action is required.

Best,
Acme Automation Broker`;
  } else {
    return `Draft reply declined: Category '${category}' does not receive reply templates.`;
  }
}

// API: Get Emails
app.get("/api/emails", (req, res) => {
  res.json({
    emails: emailsDB,
    notionTickets,
    notionLeads,
    slackMessages,
    auditLogs
  });
});

// API: Reset DB to default seeds
app.post("/api/emails/reset", (req, res) => {
  emailsDB = [
    {
      id: "mail-100",
      senderName: "Sarah Jenkins",
      senderEmail: "sjenkins@apextech.com",
      subject: "Urgent: API Integration is throwing 500 errors on production",
      body: "Hi Team, We started getting continuous HTTP 500 Internal Server errors from your API endpoint /v1/triage/ingest about 10 minutes ago. This is blocking our core production pipeline! Can you please check immediately? Contact me at 555-0199.",
      timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      threadId: "thread-sarah-100",
      hasAttachments: false,
      status: "awaiting_approval",
      category: "urgent",
      confidenceScore: 0.98,
      summary: "API integration endpoint is responding with 500 Internal Server Errors since 10 minutes ago, blocking production.",
      sentiment: "negative",
      extractedEntities: {
        company: "Apex Tech",
        product: "Ingest API",
        name: "Sarah Jenkins"
      },
      draftReply: `Hi Sarah,

This is urgency support from Acme Automation. We have flagged this ticket as Urgent and alerted our core operations team. 

We are actively investigating the HTTP 500 errors on our /v1/triage/ingest endpoint. Initial diagnostics suggest a regional database sync latency, which our infrastructure engineers are deploying a remedy for as we speak. We will provide updates every 15 minutes.

If you have additional logs, please reply directly to this thread (Thread: thread-sarah-100).

Best regards,
Acme Escalations Team`,
      logs: [
        "05:13:08 - Ingestion of Sarah Jenkins completed successfully.",
        "05:13:09 - Strip HTML tags: Clean plain text body.",
        "05:13:10 - Querying Gemini API for email classification.",
        "05:13:11 - Classified: category='urgent', confidence=0.98, sentiment='negative'.",
        "05:13:11 - Category Router: Branch triggered -> immediate Slack DM & high-priority Notion logged.",
        "05:13:12 - Creating high priority draft via Gemini with template contexts."
      ]
    },
    {
      id: "mail-101",
      senderName: "Robert Vance",
      senderEmail: "robert@vanceconsulting.com",
      subject: "Enterprise volume licensing inquiry for Q3 rollout",
      body: "Hello, our firm is looking to transition 150 team members to your inbox automation platform starting July. Do you support volume tier discounting? We also require custom SLAs and dedicated customer success managers. Let us know when we can hop on a demo call next week.",
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      threadId: "thread-robert-101",
      hasAttachments: true,
      status: "approved",
      category: "sales",
      confidenceScore: 0.95,
      summary: "Firm seeks to buy team licensing for 150 users with bulk discount and custom service level agreements.",
      sentiment: "positive",
      extractedEntities: {
        company: "Vance Consulting",
        product: "Inbox Automation platform",
        name: "Robert Vance"
      },
      draftReply: `Hi Robert,

Thank you for reaching out to Acme Consulting! We are excited to assist Vance Consulting with your upcoming Q3 rollout for 150 team members.

We definitely provide high-volume enterprise discounting, dedicated customer success support, and customized SLAs. We'd love to organize a tailored demo session and discuss pricing models.

Please select a convenient timing through our sales calendar: https://calendly.com/team-sales

We look forward to collaborating!

Acme Sales Team`,
      logs: [
        "03:13:12 - Input received via polling loop.",
        "03:13:12 - Content parsed: Has attachment: TRUE.",
        "03:13:13 - Requesting category: Classified = 'sales', confidence=0.95.",
        "03:13:13 - Routing: Branch sales -> lead logging database.",
        "03:13:14 - Drafting client proposal with custom parameters."
      ]
    },
    {
      id: "mail-102",
      senderName: "Spam Bot",
      senderEmail: "win-now@casinoriches.net",
      subject: "Exclusive offer!! Get 1,000 Free Credits to play online slots today",
      body: "HUGE OPPORTUNITY. Sign up today and claim $500 free casino play on our state-of-the-art visual slot machine website. Fast payouts, guaranteed return, 100% anonymous playing. Click here to double your wealth immediately!!!",
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      threadId: "thread-spam-102",
      hasAttachments: false,
      status: "archived",
      category: "spam",
      confidenceScore: 0.99,
      summary: "Unsolicited visual slot machine casino welcome promotion spam offering free credits.",
      sentiment: "neutral",
      extractedEntities: {
        company: "Casino Riches",
        name: "Spam Bot"
      },
      logs: [
        "01:03:00 - Poller read incoming message from win-now@casinoriches.net.",
        "01:03:00 - Detected casino credit triggers.",
        "01:03:01 - Classification complete with 99% confidence: 'spam'.",
        "01:03:01 - Router: spam -> Silent archive, skip Slack, log metadata to system audit only."
      ]
    }
  ];

  notionTickets = [
    {
      id: "notion-t-1",
      emailId: "mail-100",
      title: "API Integration is throwing 500 errors on production",
      sender: "sjenkins@apextech.com",
      priority: "High",
      status: "In Progress",
      summary: "API integration is throwing 500 error outputs on apextech endpoint v1/triage/ingest.",
      draftReply: "Hi Sarah, In urgent support regarding apextech... investigating latency.",
      dateReceived: new Date(Date.now() - 3600000 * 2.5).toLocaleDateString()
    }
  ];

  notionLeads = [
    {
      id: "notion-l-1",
      emailId: "mail-101",
      company: "Vance Consulting",
      contact: "Robert Vance",
      email: "robert@vanceconsulting.com",
      category: "Sales Inquiry",
      summary: "Seeks tier bulk discounts and tailored customer success alignment for 150 members.",
      followUpDate: new Date(Date.now() + 3600000 * 48).toLocaleDateString()
    }
  ];

  slackMessages = [
    {
      id: "slack-m-12",
      emailId: "mail-100",
      channel: "Direct Message",
      title: "🚨 URGENT EMAIL: sjenkins@apextech.com",
      body: "Subject: Urgent: API Integration is throwing 500 errors on production\nSummary: Sarah Jenkins notices production API failure. Contact: 555-0199.",
      draftReply: `Hi Sarah,\n\nThis is urgency support from Acme Automation...`,
      status: "pending",
      timestamp: new Date(Date.now() - 3600000 * 2.5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      interactiveButtons: true
    }
  ];

  auditLogs = [
    {
      id: "audit-1",
      timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      emailSubject: "Urgent: API Integration is throwing 500 errors on production",
      category: "urgent",
      confidenceScore: 0.98,
      actionTaken: "Dispatched Slack alert and opened high priority Notion task.",
      status: "Success"
    },
    {
      id: "audit-2",
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      emailSubject: "Enterprise volume licensing inquiry for Q3 rollout",
      category: "sales",
      confidenceScore: 0.95,
      actionTaken: "Inserted leads record in CRM Notion and generated draft reply suggestion.",
      status: "Success"
    },
    {
      id: "audit-3",
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      emailSubject: "Exclusive offer!! Get 1,000 Free Credits to play online slots today",
      category: "spam",
      confidenceScore: 0.99,
      actionTaken: "Silently archived and recorded spam index metric.",
      status: "Success"
    }
  ];

  res.json({ success: true });
});

// API: Process incoming email simulation with real Gemini triage
app.post("/api/emails/create", async (req, res) => {
  const { senderName, senderEmail, subject, body, hasAttachments } = req.body;
  
  if (!senderName || !senderEmail || !subject || !body) {
    return res.status(400).json({ error: "Missing required properties" });
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logs.push(`${time} - ${msg}`);
  };

  log(`Polling Gmail ingest detected unread thread from: ${senderEmail}`);
  log(`HTML tags stripped successfully. Cleaned content payload bytes: ${Buffer.byteLength(body, 'utf-8')}`);

  const emailId = "mail-" + Math.floor(Math.random() * 90000 + 10000);
  const threadId = "thread-" + Math.floor(Math.random() * 900000 + 100000);

  let category: EmailCategory = "support";
  let confidenceScore = 0.85;
  let summary = "";
  let sentiment: 'positive' | 'negative' | 'neutral' = "neutral";
  let extractedEntities = { company: "", product: "", name: senderName };

  const gemini = getGeminiClient();
  let usedGemini = false;

  if (gemini) {
    try {
      log("Invoking server-side Gemini 3.5-flash with structured system instructions (classification)...");
      const modelPrompt = `You are a professional Email Classification Agent. Inspect the incoming email:
SUBJECT: "${subject}"
BODY: "${body}"

Classify it into one of these strict categories: support, sales, urgent, spam, newsletter, internal.
Provide an appropriate confidence score strictly between 0.0 and 1.0 (e.g. 0.92).
Create a highly concise, elegant 1-to-2 sentence summary.
Evaluate the sentiment strictly as one of: positive, negative, neutral.
Extract key entities where possible (such as "company", "product", "name").

Response strictly in JSON format matching this schema:
{
  "category": "support" | "sales" | "urgent" | "spam" | "newsletter" | "internal",
  "confidenceScore": number,
  "summary": "string",
  "sentiment": "positive" | "negative" | "neutral",
  "entities": {
    "company": "string (optional)",
    "product": "string (optional)",
    "name": "string (optional)"
  }
}`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: modelPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      const parsedResult = JSON.parse(response.text || "{}");
      category = (parsedResult.category || "support") as EmailCategory;
      confidenceScore = parsedResult.confidenceScore ?? 0.85;
      summary = parsedResult.summary || `${subject.substring(0, 50)}...`;
      sentiment = parsedResult.sentiment || "neutral";
      extractedEntities = {
        company: parsedResult.entities?.company || "",
        product: parsedResult.entities?.product || "",
        name: parsedResult.entities?.name || senderName
      };

      usedGemini = true;
      log(`Gemini classification succeeded. Assigned category: '${category}' (confidence=${confidenceScore.toFixed(2)})`);
    } catch (apiError) {
      console.error("Gemini Classification failed, falling back to rule-based parser:", apiError);
      log(`Warning: Gemini classifier hit API limits or key error. Invoking resilient sandbox heuristics...`);
    }
  } else {
    log(`Sandbox pipeline active. API keys not provided -> loaded responsive fallback heuristics...`);
  }

  // Fallback to rule-based if gemini was not configured or tripped
  if (!usedGemini) {
    const rulesResult = mockTriageWithRuleBased(subject, body);
    category = rulesResult.category;
    confidenceScore = rulesResult.confidenceScore;
    summary = rulesResult.summary;
    sentiment = rulesResult.sentiment;
    extractedEntities = rulesResult.entities;
    log(`Heuristic parser categorized: '${category}' (confidence: ${confidenceScore})`);
  }

  // Dynamic Routing Switch Logic
  let draftReply = "";
  let actionTaken = "";
  let status: Email['status'] = "pending";

  log(`Routing engine checking constraints on: [Target: ${category}]`);

  // Call Gemini for the Draft Generation
  let draftedWithGemini = false;
  if (gemini && category !== "spam") {
    try {
      log(`Querying server-side Gemini 3.5-flash for contextual draft generation...`);
      const draftInstructions = `You are a high-fidelity Customer Relations Automated Responder for an IT organization.
Create a personalized, helpful reply draft to the user.

ORIGINAL SENDER: "${senderName}" (${senderEmail})
SUBJECT: "${subject}"
BODY: "${body}"
CLASSIFIED CATEGORY: "${category}"
SUMMARY DETECTED: "${summary}"
EXTRACTED COMPANY: "${extractedEntities.company || 'unspecified company'}"
EXTRACTED PRODUCT: "${extractedEntities.product || 'unspecified product'}"

FAQ DIRECTIVES:
- support: We recommend exploring the self-test manuals at help.widgets.com. For setup failures, confirm workspace variables.
- sales: Volume tier discounting triggers on teams with >25 seats. Dedicated success coordinators are provided on plans exceeding 100 seats. Encourage a chat with our consulting group at: https://calendly.com/team-sales
- urgent: Flagged to emergency technical personnel. Assure the recipient our engineering division is checking runtime service pools immediately.

Write a friendly, paragraph-separated response. Start with professional greeting. Avoid any mock placeholders like '[My Name]'. Sign off as 'Acme Systems Service Automation'.`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: draftInstructions,
        config: {
          temperature: 0.6
        }
      });

      draftReply = response.text || "";
      draftedWithGemini = true;
      log(`Gemini response drafting returned high-quality draft reply.`);
    } catch (draftError) {
      console.error("Gemini drafting failed, using rule-based fallback:", draftError);
    }
  }

  if (!draftedWithGemini) {
    draftReply = mockDraftWithRuleBased(category, subject, body, extractedEntities.name || senderName);
    log(`Compiled rule-based template response for category: '${category}'.`);
  }

  const timestampStr = new Date().toISOString();

  // Route to structural sinks
  if (category === "urgent") {
    status = "awaiting_approval";
    actionTaken = "Dispatched emergency notifications to Slack DM & raised priority in Notion tickets DB.";
    
    // Auto add to Notion support tickets
    notionTickets.push({
      id: "notion-t-" + Math.floor(Math.random()*1000 + 100),
      emailId,
      title: subject,
      sender: senderEmail,
      priority: "High",
      status: "Open",
      summary,
      draftReply,
      dateReceived: new Date().toLocaleDateString()
    });
    log("Created task Row inside Notion tickets DB with status 'Open' and priority 'High'");

    // Add immediate slack direct message alert
    slackMessages.push({
      id: "slack-m-" + Math.floor(Math.random()*1000 + 100),
      emailId,
      channel: "Direct Message",
      title: `🚨 CRITICAL ESCALATION: urgent triage matching ${extractedEntities.company || 'Enterprise Partner'}`,
      body: `Subject: ${subject}\nSentiment: ${sentiment}\nSummary: ${summary}`,
      draftReply,
      status: "pending",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      interactiveButtons: true
    });
    log("Dispatched direct alarm text message to Inbox Admin with interactive review buttons");

  } else if (category === "support") {
    status = "awaiting_approval";
    actionTaken = "Logged ticket row in Notion system; queued draft response for reviewer review in Slack.";

    notionTickets.push({
      id: "notion-t-" + Math.floor(Math.random()*1000 + 100),
      emailId,
      title: subject,
      sender: senderEmail,
      priority: confidenceScore < 0.85 ? "Medium" : "Low",
      status: "Open",
      summary,
      draftReply,
      dateReceived: new Date().toLocaleDateString()
    });
    log("Created help-desk query Row in Notion support table.");

    slackMessages.push({
      id: "slack-m-" + Math.floor(Math.random()*1000 + 100),
      emailId,
      channel: "#email-review",
      title: `📬 Support Review Request: from ${senderName}`,
      body: `Subject: ${subject}\nSender: ${senderEmail}\nConfidence Level: ${(confidenceScore * 100).toFixed(0)}%`,
      draftReply,
      status: "pending",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      interactiveButtons: true
    });
    log("Slack Block Kit card dispatched to #email-review channel for verification.");

  } else if (category === "sales") {
    status = "awaiting_approval";
    actionTaken = "Registered sales deal in CRM Notion index; sent reply approval card to Slack.";

    notionLeads.push({
      id: "notion-l-" + Math.floor(Math.random()*1000 + 100),
      emailId,
      company: extractedEntities.company || "Company Undef",
      contact: extractedEntities.name || senderName,
      email: senderEmail,
      category: "Sales Lead Inquiry",
      summary,
      followUpDate: new Date(Date.now() + 3600000 * 24).toLocaleDateString()
    });
    log("Constructed contact item lead in Notion Sales lead database.");

    slackMessages.push({
      id: "slack-m-" + Math.floor(Math.random()*1000 + 100),
      emailId,
      channel: "#email-review",
      title: `💼 Sales Opportunity: ${extractedEntities.company || 'Incoming Lead'}`,
      body: `Subject: ${subject}\nSummary: ${summary}\nSender: ${senderEmail}`,
      draftReply,
      status: "pending",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      interactiveButtons: true
    });
    log("Lead approval message triggered in Slack inbox approvals hub.");

  } else if (category === "spam" || category === "newsletter" || category === "internal") {
    status = "archived";
    actionTaken = `Silently archived incoming ${category}. Suppressed Slack alerts. Recorded metadata metric.`;
    log(`Suppressing interactive drafts. Archiving ${category} email state directly.`);
  }

  // If confidence rating is less than 70%, route it to needs manual review anyway
  if (confidenceScore < 0.70 && category !== "spam") {
    log(`Low Confidence Event! Score (${(confidenceScore * 100).toFixed(0)}%) falls under threshold (70%). Rerouting pipeline to review queue.`);
    slackMessages.push({
      id: "slack-m-" + Math.floor(Math.random()*1000 + 100),
      emailId,
      channel: "#email-review",
      title: `⚠️ Alert: Low-Confidence Category Prediction (${(confidenceScore * 100).toFixed(1)}%)`,
      body: `Review needed. Email from ${senderName} was tagged as ${category}.\nSubject: "${subject}"`,
      draftReply,
      status: "pending",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      interactiveButtons: true
    });
  }

  // Create final processed email log
  const newEmail: Email = {
    id: emailId,
    senderName,
    senderEmail,
    subject,
    body,
    timestamp: timestampStr,
    threadId,
    hasAttachments: !!hasAttachments,
    status,
    category,
    confidenceScore,
    summary,
    sentiment,
    extractedEntities,
    draftReply,
    actionTaken,
    logs
  };

  emailsDB.unshift(newEmail);

  // Add audit log DB record
  auditLogs.unshift({
    id: "audit-" + Math.floor(Math.random()*10000 + 100),
    timestamp: timestampStr,
    emailSubject: subject,
    category,
    confidenceScore,
    actionTaken,
    status: confidenceScore < 0.70 ? "Warning" : "Success"
  });

  res.json({ success: true, newEmail });
});

// API: Handle Human-in-the-loop action
app.post("/api/emails/action", (req, res) => {
  const { emailId, action, modifiedDraft } = req.body;

  if (!emailId || !action) {
    return res.status(400).json({ error: "Missing emailId or action parameter" });
  }

  const email = emailsDB.find(m => m.id === emailId);
  if (!email) {
    return res.status(404).json({ error: "Email not resolved" });
  }

  const logTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (action === "approve") {
    email.status = "sent";
    if (modifiedDraft) {
      email.draftReply = modifiedDraft;
    }
    email.actionTaken = "Manual workflow approved: reply sent back to sender email via Node Gmail API.";
    email.logs.push(`${logTime()} - Human Review Approved! Outgoing Gmail dispatch triggered.`);
    email.logs.push(`${logTime()} - Threading validated. Embedded threadId = ${email.threadId}`);
    email.logs.push(`${logTime()} - Closed and flagged thread context as 'Replied'.`);

    // Update Notion items
    const ticket = notionTickets.find(t => t.emailId === emailId);
    if (ticket) {
      ticket.status = "Resolved";
      ticket.draftReply = email.draftReply || "";
    }
    // Update matching slack notification status
    const notify = slackMessages.find(s => s.emailId === emailId);
    if (notify) {
      notify.status = "approved";
    }

  } else if (action === "edit") {
    email.status = "sent";
    if (modifiedDraft) {
       email.draftReply = modifiedDraft;
    }
    email.actionTaken = "Reviewer modified reply content and clicked approved.";
    email.logs.push(`${logTime()} - Reply updated manually via Block Kit integration. Outgoing email dispatched.`);

    const ticket = notionTickets.find(t => t.emailId === emailId);
    if (ticket) {
      ticket.status = "Resolved";
      ticket.draftReply = email.draftReply || "";
    }
    const notify = slackMessages.find(s => s.emailId === emailId);
    if (notify) {
      notify.status = "edited";
      notify.draftReply = email.draftReply;
    }

  } else if (action === "reject") {
    email.status = "rejected";
    email.actionTaken = "Escalated to reject. Draft discarded. Reason logged into compliance log.";
    email.logs.push(`${logTime()} - Reviewer selected Reject. Outgoing automated draft response deleted. State set to archived.`);

    const ticket = notionTickets.find(t => t.emailId === emailId);
    if (ticket) {
      ticket.status = "Resolved";
    }
    const notify = slackMessages.find(s => s.emailId === emailId);
    if (notify) {
      notify.status = "rejected";
    }
  }

  res.json({ success: true, email });
});

// Endpoint: Generate exportable, actual real-world n8n JSON representation
app.get("/api/workflows/n8n-json", (req, res) => {
  const n8nBlueprint = {
    "nodes": [
      {
        "parameters": {
          "pollTimes": {
            "item": [
              {
                "mode": "everyMinute",
                "value": 5
              }
            ]
          },
          "simple": true,
          "filters": {
            "readStatus": "unread"
          },
          "options": {
            "dataProperty": "bodyHtml"
          }
        },
        "id": "e2f733f3-0785-45cd-acae-cf77cb70560a",
        "name": "Gmail Ingest Poller",
        "type": "n8n-nodes-base.gmailTrigger",
        "typeVersion": 1,
        "position": [100, 300]
      },
      {
        "parameters": {
          "jsCode": "for (const item of $input.all()) {\n  item.json.bodyText = item.json.bodyHtml.replace(/<[^>]*>/g, '');\n}\nreturn $input.all();"
        },
        "id": "c8aa9f7f-dd40-42de-8df8-7a565ba18104",
        "name": "HTML Stripper Node",
        "type": "n8n-nodes-base.code",
        "typeVersion": 1,
        "position": [300, 300]
      },
      {
        "parameters": {
          "model": "gpt-4o",
          "options": {
            "responseFormat": "json"
          },
          "messages": {
            "messageValues": [
              {
                "role": "system",
                "message": "Classify the incoming help-desk text body into support, sales, urgent, spam, newsletter, internal. Output logical category, confidence ratings, and summarized values in neat JSON formatting structures."
              },
              {
                "role": "user",
                "message": "Subject: ={{$json.subject}}\nBody: ={{$json.bodyText}}"
              }
            ]
          }
        },
        "id": "b1b74a3c-b2e1-4c12-8e7c-ec29fe7cca26",
        "name": "Gemini/GPT Classifier",
        "type": "n8n-nodes-base.openAi",
        "typeVersion": 1,
        "position": [500, 300]
      },
      {
        "parameters": {
          "rules": {
            "values": [
              {
                "value1": "={{$json.category}}",
                "value2": "urgent",
                "operation": "equal"
              },
              {
                "value1": "={{$json.category}}",
                "value2": "support",
                "operation": "equal"
              },
              {
                "value1": "={{$json.category}}",
                "value2": "sales",
                "operation": "equal"
              }
            ]
          }
        },
        "id": "a90ee928-87da-4e78-9993-4fc26eeaeae9",
        "name": "Category Routing Switch",
        "type": "n8n-nodes-base.switch",
        "typeVersion": 1,
        "position": [700, 300]
      },
      {
        "parameters": {
          "resource": "database",
          "operation": "create",
          "databaseId": "notion-notion-notion-notion",
          "properties": {
            "Title": "={{$json.subject}}",
            "Sender": "={{$json.sender}}",
            "Priority": "High",
            "Status": "Open"
          }
        },
        "id": "787263b6-1212-4cf3-a178-eead982187cc",
        "name": "Notion Database Router",
        "type": "n8n-nodes-base.notion",
        "typeVersion": 2,
        "position": [950, 200]
      },
      {
        "parameters": {
          "channel": "=#email-approvals",
          "text": "📬 *Incoming Email Approval Needed!*\n\n*Subject:* ={{$json.subject}}\n*Suggested Draft:* ={{$json.draft_reply}}\n\nPlease execute actions below.",
          "attachments": [
            {
              "actions": [
                {
                  "name": "approve",
                  "text": "Approve Reply",
                  "type": "button",
                  "value": "approve"
                },
                {
                  "name": "reject",
                  "text": "Reject",
                  "type": "button",
                  "value": "reject"
                }
              ]
            }
          ]
        },
        "id": "bfa8edee-8c22-498c-84fc-902347c61066",
        "name": "Slack Approvals (Block Kit)",
        "type": "n8n-nodes-base.slack",
        "typeVersion": 1,
        "position": [1150, 300]
      }
    ],
    "connections": {
      "Gmail Ingest Poller": {
        "main": [
          [
            {
              "node": "HTML Stripper Node",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "HTML Stripper Node": {
        "main": [
          [
            {
              "node": "Gemini/GPT Classifier",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Gemini/GPT Classifier": {
        "main": [
          [
            {
              "node": "Category Router Switch",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  };
  
  res.json(n8nBlueprint);
});

async function startServer() {
  // Vite integration middleware for local previewing runtime
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server executing safely on port http://0.0.0.0:${PORT}`);
  });
}

startServer();
