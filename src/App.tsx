import { useState, useEffect } from "react";
import { 
  Workflow, Play, Slack, Database, Mail, Cpu, RefreshCw, CheckCircle2, AlertOctagon, HelpCircle 
} from "lucide-react";
import MetricCard from "./components/MetricCard";
import N8nCanvas from "./components/N8nCanvas";
import SimulatorInbox from "./components/SimulatorInbox";
import SlackApprover from "./components/SlackApprover";
import NotionHub from "./components/NotionHub";
import { Email, NotionTicket, NotionLead, SlackMessage, AuditLog } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<'workflow' | 'simulator' | 'slack' | 'notion'>('simulator');
  const [emails, setEmails] = useState<Email[]>([]);
  const [notionTickets, setNotionTickets] = useState<NotionTicket[]>([]);
  const [notionLeads, setNotionLeads] = useState<NotionLead[]>([]);
  const [slackMessages, setSlackMessages] = useState<SlackMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isLoadingSimulate, setIsLoadingSimulate] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Automation configurations synced across n8n fields and state generators
  const [testConfigs, setTestConfigs] = useState({
    confidenceThreshold: 70,
    supportFaq: "Password recovery link: portal.acmetech.io/recover. Support document base: help.widgets.com. Volume discounting is triggered on packages above 25 team members under custom commercial pricing SLAs.",
    slackChannel: "#email-review",
    escalationHours: 2
  });

  // Pull latest simulation variables
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/emails");
      const data = await res.json();
      setEmails(data.emails);
      setNotionTickets(data.notionTickets);
      setNotionLeads(data.notionLeads);
      setSlackMessages(data.slackMessages);
      setAuditLogs(data.auditLogs);
      
      if (data.emails.length > 0 && !selectedEmailId) {
        setSelectedEmailId(data.emails[0].id);
      }
    } catch (e) {
      console.error("Failure pulling simulated databases:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSettingsChange = (key: string, val: any) => {
    setTestConfigs(prev => ({ ...prev, [key]: val }));
  };

  // Simulate parsing pipelines
  const triggerEmailSimulation = async (payload: {
    senderName: string;
    senderEmail: string;
    subject: string;
    body: string;
    hasAttachments: boolean;
  }) => {
    setIsLoadingSimulate(true);
    setNotificationBanner("Ingesting unread thread... Running custom stripper and Gemini classifier pipelines.");
    try {
      const res = await fetch("/api/emails/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
        setSelectedEmailId(data.newEmail.id);
        setNotificationBanner(`Pipeline executed successfully! Senders email categorized as '${data.newEmail.category}' (Conf ${(data.newEmail.confidenceScore * 100).toFixed(0)}%).`);
        // Force focus simulator so they see the execution logs live
        setActiveTab('simulator');
      }
    } catch (e) {
      console.error("Simulation trigger crashed:", e);
      setNotificationBanner("Triage error: AI pipeline failed.");
    } finally {
      setIsLoadingSimulate(false);
      setTimeout(() => setNotificationBanner(null), 5000);
    }
  };

  // Human approval inputs
  const submitHumanAction = async (emailId: string, action: 'approve' | 'edit' | 'reject', modifiedDraft?: string) => {
    try {
      const res = await fetch("/api/emails/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId, action, modifiedDraft })
      });
      const data = await res.json();
      if (data.success) {
        setNotificationBanner(`Response feedback action '${action}' completed successfully.`);
        await fetchStatus();
      }
    } catch (e) {
      console.error("Action handler crashed:", e);
    } finally {
      setTimeout(() => setNotificationBanner(null), 3000);
    }
  };

  // Notion resolve status toggles (which acts as a mock webhook back to n8n to send email thread and close row)
  const resolveNotionTicket = async (emailId: string) => {
    setNotificationBanner("Notion Status Resolving: Triggering webhook back to n8n framework to reply and close thread.");
    await submitHumanAction(emailId, 'approve');
  };

  // Reset metrics
  const resetDatabase = async () => {
    setIsLoadingSimulate(true);
    try {
      await fetch("/api/emails/reset", { method: "POST" });
      setSelectedEmailId(null);
      await fetchStatus();
      setNotificationBanner("Simulated databases successfully reset.");
    } catch (e) {
      console.error("Reset failed:", e);
    } finally {
      setIsLoadingSimulate(false);
      setTimeout(() => setNotificationBanner(null), 3000);
    }
  };

  // Computed counters
  const supportTicketsOpen = notionTickets.filter(t => t.status !== 'Resolved').length;
  const pendingSlackReviews = slackMessages.filter(s => s.status === 'pending').length;
  const processedCountLastTurn = emails.length;
  const urgentCountLastTurn = emails.filter(e => e.category === 'urgent').length;

  return (
    <div className="min-h-screen bg-[#DCDAD7] flex flex-col font-sans selection:bg-[#141414] selection:text-[#E4E3E0] text-[#141414]">
      
      {/* Top Professional Header */}
      <header className="border-b-4 border-[#141414] bg-[#E4E3E0] sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-black rounded-none border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414]">
              <Cpu size={16} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black tracking-widest text-[#141414] uppercase font-mono">
                AI_EMAIL_TRIAGE_&_RESPONSE_ASSISTANT
              </h1>
              <p className="text-[9px] text-[#141414]/75 font-mono font-bold tracking-widest uppercase">
                INTEGRATED_AUTOMATION_REFRESH_SYSTEM
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-[10px] bg-white border-2 border-[#141414] px-3 py-1.5 rounded-none text-[#141414] font-mono font-extrabold uppercase">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse border border-[#141414]" />
              <span>DAEMON: ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Status/Notification Banner Pop */}
      {notificationBanner && (
        <div className="bg-[#141414] text-[#E4E3E0] border-b-2 border-[#141414] text-[10px] py-3 px-6 font-mono text-center flex items-center justify-center space-x-2 animate-slideDown">
          <span className="text-[9px] bg-white text-[#141414] font-black px-2 py-0.5 uppercase">
            SYSTEM_EVENT
          </span>
          <span className="font-extrabold tracking-wider">{notificationBanner}</span>
        </div>
      )}

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Core Deck Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            id="metric-ingested"
            title="Total Messages"
            value={processedCountLastTurn}
            subtitle="Polled unread inbox queues"
            trend="+100%"
            trendType="positive"
            icon={Mail}
          />
          <MetricCard
            id="notion-tickets-met"
            title="Support Tickets DB"
            value={supportTicketsOpen}
            subtitle="Notion task backlog items"
            trend={supportTicketsOpen > 0 ? "Awaiting Action" : "Pristine"}
            trendType={supportTicketsOpen > 0 ? "negative" : "positive"}
            icon={Database}
          />
          <MetricCard
            id="notion-leads-met"
            title="CRM Lead Matrix"
            value={notionLeads.length}
            subtitle="Piped sales inquiries"
            trend="Active sales flow"
            trendType="neutral"
            icon={CheckCircle2}
          />
          <MetricCard
            id="slack-approvals-met"
            title="Slack Approvals"
            value={pendingSlackReviews}
            subtitle="Block Kit suggestions review"
            trend={`${pendingSlackReviews} urgent queue`}
            trendType={pendingSlackReviews > 0 ? "negative" : "positive"}
            icon={Slack}
          />
        </section>

        {/* Navigation Tabs bar */}
        <div className="flex flex-wrap gap-2 border-b-2 border-[#141414]/20 pb-2">
          <button
            id="tab-btn-workflow"
            onClick={() => setActiveTab('workflow')}
            className={`px-4 py-2.5 text-[10px] font-bold font-mono uppercase flex items-center space-x-2 border-2 transition-all rounded-none ${
              activeTab === 'workflow'
                ? 'border-[#141414] bg-[#141414] text-[#E4E3E0] shadow-[2px_2px_0px_0px_#141414]'
                : 'border-[#141414]/30 bg-white text-[#141414]/75 hover:border-[#141414] hover:text-[#141414]'
            }`}
          >
            <Workflow size={12} />
            <span>Interactive n8n Architect</span>
          </button>
          
          <button
            id="tab-btn-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 text-[10px] font-bold font-mono uppercase flex items-center space-x-2 border-2 transition-all rounded-none ${
              activeTab === 'simulator'
                ? 'border-[#141414] bg-[#141414] text-[#E4E3E0] shadow-[2px_2px_0px_0px_#141414]'
                : 'border-[#141414]/30 bg-white text-[#141414]/75 hover:border-[#141414] hover:text-[#141414]'
            }`}
          >
            <Play size={12} />
            <span>Ingestion Pipeline Simulator</span>
          </button>

          <button
            id="tab-btn-slack"
            onClick={() => setActiveTab('slack')}
            className={`px-4 py-2.5 text-[10px] font-bold font-mono uppercase flex items-center space-x-2 border-2 transition-all rounded-none ${
              activeTab === 'slack'
                ? 'border-[#141414] bg-[#141414] text-[#E4E3E0] shadow-[2px_2px_0px_0px_#141414]'
                : 'border-[#141414]/30 bg-white text-[#141414]/75 hover:border-[#141414] hover:text-[#141414]'
            }`}
          >
            <Slack size={12} />
            <span>Slack Block Kit Reviews</span>
          </button>

          <button
            id="tab-btn-notion"
            onClick={() => setActiveTab('notion')}
            className={`px-4 py-2.5 text-[10px] font-bold font-mono uppercase flex items-center space-x-2 border-2 transition-all rounded-none ${
              activeTab === 'notion'
                ? 'border-[#141414] bg-[#141414] text-[#E4E3E0] shadow-[2px_2px_0px_0px_#141414]'
                : 'border-[#141414]/30 bg-white text-[#141414]/75 hover:border-[#141414] hover:text-[#141414]'
            }`}
          >
            <Database size={12} />
            <span>Notion Database Hub</span>
          </button>
        </div>

        {/* Tab Modules Rendering */}
        <section id="dashboard-active-module" className="min-h-[500px]">
          {activeTab === 'workflow' && (
            <div className="animate-fadeIn">
              <N8nCanvas 
                onSettingsChange={handleSettingsChange}
                testConfigs={testConfigs}
              />
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="animate-fadeIn">
              <SimulatorInbox
                emails={emails}
                selectedEmailId={selectedEmailId}
                onSelectEmail={setSelectedEmailId}
                onTriggerSimulation={triggerEmailSimulation}
                isLoadingSimulate={isLoadingSimulate}
                onResetDatabase={resetDatabase}
              />
            </div>
          )}

          {activeTab === 'slack' && (
            <div className="animate-fadeIn">
              <SlackApprover
                notifications={slackMessages}
                onActionSubmit={submitHumanAction}
              />
            </div>
          )}

          {activeTab === 'notion' && (
            <div className="animate-fadeIn">
              <NotionHub
                tickets={notionTickets}
                leads={notionLeads}
                logs={auditLogs}
                onResolveTicket={resolveNotionTicket}
              />
            </div>
          )}
        </section>
      </main>

      {/* Global Design aesthetic Footer */}
      <footer className="border-t-4 border-[#141414] bg-[#E4E3E0] py-6 select-none mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-[#141414]/65 font-mono space-y-2.5 sm:space-y-0 uppercase tracking-wider font-extrabold">
          <span>Acme Pipeline Automation Systems Inc. • All simulation indices sandbox validated</span>
          <span className="flex items-center space-x-1">
            <span>Powered by Google Gemini & n8n templates</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
