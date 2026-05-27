import React, { useState } from 'react';
import { 
  Plus, Play, Mail, FileText, CheckCircle, Flame, Send, Trash, RefreshCw, Layers, FileCode2, Terminal
} from 'lucide-react';
import { Email } from '../types';

interface SimulatorInboxProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  onTriggerSimulation: (emailPayload: {
    senderName: string;
    senderEmail: string;
    subject: string;
    body: string;
    hasAttachments: boolean;
  }) => Promise<void>;
  isLoadingSimulate: boolean;
  onResetDatabase: () => void;
}

const templates = [
  {
    name: "🚨 Server Outage Urgent",
    senderName: "Marcus Vance",
    senderEmail: "marcus@vancecloud.com",
    subject: "Uptimes down: API server giving connection timeouts immediately",
    body: "<h1>CRITICAL SERVICE FAILURE</h1><p>Our staging and production clusters are completely disconnected from our Acme Automation webhook node.</p><p>Check if the regional routers are active. We need immediate mitigation. Call me at +1 310-201-9481.</p>",
    hasAttachments: false
  },
  {
    name: "💼 enterprise License Sales Inquiry",
    senderName: "Clarissa Finch",
    senderEmail: "c.finch@globalcorp.org",
    subject: "Acme Enterprise licencing structure: team onboarding request (80 accounts)",
    body: "Dear Acme Support, we are scoping solutions for automated triage automation. We would like a price proposal to license 80 developers for your SaaS sandbox. Does your company support SSO sync, SOC2 compliance frameworks, and isolated endpoints? Let's connect next Tuesday.",
    hasAttachments: false
  },
  {
    name: "🎰 Spam Slot Machine Bonus",
    senderName: "Captain Riches",
    senderEmail: "jackpot@slotsgold.ru",
    subject: "Claim $5,000 USD Free Chip & Double your deposits starting today only!!",
    body: "<p>EXCLUSIVE: Win massive real world cash with no investments. We gift anonymous high stakes gameplay on slots, progressive blackjack, roulette rooms.</p><strong>CLAIM NOW</strong>",
    hasAttachments: true
  },
  {
    name: "📰 Weekly Engineering News",
    senderName: "DevOps Weekly Digest",
    senderEmail: "digest@devopsuniverse.online",
    subject: "Modern virtualization stacks, micro services routing strategies & n8n hooks",
    body: "Here is your weekly summary. We inspect virtual container layers, modern node types, API key secrets configurations, and customized proxy variables inside Docker networks.",
    hasAttachments: false
  }
];

export default function SimulatorInbox({
  emails,
  selectedEmailId,
  onSelectEmail,
  onTriggerSimulation,
  isLoadingSimulate,
  onResetDatabase
}: SimulatorInboxProps) {
  const [customComposer, setCustomComposer] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [hasAttachments, setHasAttachments] = useState(false);

  const [activeStepTab, setActiveStepTab] = useState<'details' | 'logs'>('details');

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || emails[0];

  const handleTriggerTemplate = async (tpl: typeof templates[0]) => {
    await onTriggerSimulation({
      senderName: tpl.senderName,
      senderEmail: tpl.senderEmail,
      subject: tpl.subject,
      body: tpl.body,
      hasAttachments: tpl.hasAttachments
    });
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderEmail || !subject || !body) return;
    await onTriggerSimulation({
      senderName,
      senderEmail,
      subject,
      body,
      hasAttachments
    });
    // Clear composer
    setSenderName('');
    setSenderEmail('');
    setSubject('');
    setBody('');
    setHasAttachments(false);
    setCustomComposer(false);
  };

  const getStatusBadge = (status: Email['status']) => {
    switch (status) {
      case 'pending':
        return <span className="bg-[#DCDAD7] text-[#141414] border border-[#141414] text-[9px] px-2 py-0.5 font-extrabold uppercase font-mono">Triage</span>;
      case 'processing':
        return <span className="bg-blue-400 text-[#141414] border border-[#141414] text-[9px] px-2 py-0.5 font-extrabold uppercase font-mono animate-pulse">Running</span>;
      case 'awaiting_approval':
        return <span className="bg-amber-450 text-[#141414] border border-[#141414] text-[9px] px-2 py-0.5 font-extrabold uppercase font-mono">Holding review</span>;
      case 'sent':
        return <span className="bg-green-500 text-white border border-[#141414] text-[9px] px-2 py-0.5 font-extrabold uppercase font-mono">Reply Dispatched</span>;
      case 'archived':
        return <span className="bg-[#DCDAD7] text-[#141414]/60 border border-[#141414]/25 text-[9px] px-2 py-0.5 font-extrabold uppercase font-mono">Archived</span>;
      case 'rejected':
        return <span className="bg-rose-500 text-white border border-[#141414] text-[9px] px-2 py-0.5 font-extrabold uppercase font-mono">Rejected</span>;
      default:
        return null;
    }
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'urgent': return 'bg-red-600 text-white font-mono font-bold border border-[#141414]';
      case 'support': return 'bg-[#141414] text-[#E4E3E0] font-mono font-bold border border-[#141414]';
      case 'sales': return 'bg-emerald-500 text-[#141414] font-mono font-bold border border-[#141414]';
      case 'spam': return 'bg-gray-400 text-[#141414] font-mono font-bold border border-[#141414]';
      case 'newsletter': return 'bg-[#DCDAD7] text-[#141414] font-mono font-bold border border-[#141414]';
      default: return 'bg-gray-300 text-[#141414] font-mono font-bold border border-[#141414]';
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* Selector and composer area */}
      <div className="xl:col-span-5 space-y-5">
        
        {/* Templates deck */}
        <div className="bg-white border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4 rounded-none">
          <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2">
            <h4 className="text-[10px] font-bold font-mono tracking-widest uppercase text-[#141414]">
              TRIGGER_INTEGRATION_PIPELINES
            </h4>
            <button
              id="reset-simulation-db-btn"
              onClick={onResetDatabase}
              className="text-[9px] text-[#141414]/60 hover:text-red-600 font-extrabold font-mono flex items-center space-x-1 uppercase"
            >
              <RefreshCw size={10} />
              <span>Reset State</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {templates.map((tpl) => (
              <button
                id={`template-${tpl.name.replace(/\s+/g, '-').toLowerCase()}`}
                key={tpl.name}
                onClick={() => handleTriggerTemplate(tpl)}
                disabled={isLoadingSimulate}
                className="p-3 text-left border-2 border-[#141414] bg-[#E4E3E0] hover:bg-[#DCDAD7]/80 text-[#141414] transition-all duration-150 text-xs font-bold flex flex-col justify-between group disabled:opacity-50 min-h-[95px] rounded-none shadow-[2px_2px_0px_0px_#141414]"
              >
                <span className="line-clamp-2 leading-tight font-bold">{tpl.name}</span>
                <div className="flex items-center justify-between w-full mt-2 text-[10px] text-[#141414]/65 font-mono">
                  <span>{tpl.senderName.split(' ')[0]}</span>
                  <Play size={9} className="text-[#141414] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          <button
            id="toggle-custom-composer-btn"
            onClick={() => setCustomComposer(!customComposer)}
            className="w-full py-2.5 border-2 border-dashed border-[#141414]/60 hover:border-[#141414] hover:bg-[#DCDAD7]/30 text-xs font-bold text-[#141414] flex items-center justify-center space-x-2 transition-all rounded-none"
          >
            <Plus size={14} />
            <span>COMPOSE_CUSTOM_RAW_INGESTION</span>
          </button>
        </div>

        {/* Custom email composer format in-app */}
        {customComposer && (
          <form
            id="custom-composer-form"
            onSubmit={handleCustomSubmit}
            className="bg-white border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4 animate-fadeIn rounded-none"
          >
            <h4 className="text-[10px] font-bold font-mono tracking-wider uppercase text-[#141414] border-b border-[#141414]/15 pb-2">
              NEW_CUSTOM_EMAIL_TRIGGER
            </h4>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase font-mono text-[#141414]/85">Sender Name</label>
                <input
                  id="composer-sender-name"
                  type="text"
                  required
                  className="w-full text-xs px-3 py-2 border-2 border-[#141414] bg-white text-[#141414] focus:outline-none rounded-none font-medium"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Jenna Cole"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase font-mono text-[#141414]/85">Sender Email</label>
                <input
                  id="composer-sender-email"
                  type="email"
                  required
                  className="w-full text-xs px-3 py-2 border-2 border-[#141414] bg-white text-[#141414] focus:outline-none rounded-none font-mono"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. jenna@acompany.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase font-mono text-[#141414]/85">Subject Line</label>
              <input
                id="composer-subject"
                type="text"
                required
                className="w-full text-xs px-3 py-2 border-2 border-[#141414] bg-white text-[#141414] focus:outline-none rounded-none font-semibold"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Product custom branding request"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase font-mono text-[#141414]/85">HTML or Text Body Content</label>
              <textarea
                id="composer-body"
                required
                rows={4}
                className="w-full text-xs px-3 py-2 border-2 border-[#141414] bg-white text-[#141414] focus:outline-none rounded-none font-mono"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<p>Hey there,</p> We would like to configure..."
              />
            </div>

            <div className="flex items-center space-x-3 text-xs font-bold text-[#141414]">
              <input
                id="composer-attachments"
                type="checkbox"
                checked={hasAttachments}
                onChange={(e) => setHasAttachments(e.target.checked)}
                className="h-4 w-4 border-2 border-[#141414] text-[#141414] focus:ring-0 accent-[#141414]"
              />
              <label htmlFor="composer-attachments" className="font-mono text-[10px] uppercase">Simulate attached documents payload</label>
            </div>

            <div className="flex items-center space-x-2 pt-2 justify-end text-xs font-mono">
              <button
                id="composer-cancel-btn"
                type="button"
                onClick={() => setCustomComposer(false)}
                className="px-3 py-1.5 border border-[#141414] text-[#141414] font-bold uppercase hover:bg-[#DCDAD7] text-[10px]"
              >
                Cancel
              </button>
              <button
                id="composer-submit-btn"
                type="submit"
                disabled={isLoadingSimulate}
                className="px-4 py-1.5 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 font-bold uppercase flex items-center space-x-1.5 text-[10px]"
              >
                <Plus size={11} />
                <span>Inject Thread</span>
              </button>
            </div>
          </form>
        )}

        {/* Poller records List */}
        <div id="polled-emails-list" className="bg-white border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] space-y-4 rounded-none">
          <h4 className="text-[10px] font-bold font-mono tracking-widest uppercase text-[#141414] border-b border-[#141414]/15 pb-2">
            SIMULATED_INBOX_QUEUE
          </h4>

          {emails.length === 0 ? (
            <div className="text-center py-6 text-[#141414]/40 text-xs font-serif italic">
              Simulator sandbox is empty. Trigger a template above!
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {emails.map((m) => {
                const isSelected = selectedEmailId === m.id;
                return (
                  <button
                    id={`inbox-email-${m.id}`}
                    key={m.id}
                    onClick={() => onSelectEmail(m.id)}
                    className={`w-full text-left p-3.5 border-2 transition-all duration-150 rounded-none ${
                      isSelected
                        ? 'border-[#141414] bg-[#DCDAD7]'
                        : 'border-[#141414]/25 bg-white hover:bg-[#E4E3E0]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-extrabold text-[#141414] truncate max-w-[125px]">
                          {m.senderName}
                        </span>
                        <span className="text-[9px] text-[#141414]/60 truncate max-w-[120px] font-mono">
                          &lt;{m.senderEmail}&gt;
                        </span>
                      </div>
                      <span className="text-[9px] text-[#141414]/60 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs text-[#141414] font-bold truncate mb-2.5 font-sans">
                      {m.subject}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {m.category && (
                          <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 ${getCategoryColor(m.category)}`}>
                            {m.category}
                          </span>
                        )}
                        {m.confidenceScore && (
                          <span className="text-[9px] text-[#141414]/60 font-mono font-bold">
                            CONF: {(m.confidenceScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {getStatusBadge(m.status)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Execution logs & structural inspector drawer */}
      <div id="inbox-details-sidepane" className="xl:col-span-7 bg-[#E4E3E0] text-[#141414] border-2 border-[#141414] p-6 flex flex-col justify-between h-full shadow-[4px_4px_0px_0px_#141414] rounded-none">
        {selectedEmail ? (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between border-b border-[#141414]/25 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#141414]/65 font-mono">
                    RUNTIME_INSPECTOR_CORE
                  </span>
                  <h3 className="text-xs font-extrabold text-[#141414] line-clamp-2 max-w-[420px] uppercase tracking-tight">
                    {selectedEmail.subject}
                  </h3>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#141414] text-[#E4E3E0] px-2.5 py-0.8 text-[10px] font-mono uppercase shrink-0 border border-[#141414]">
                  <Terminal size={10} className="text-green-400" />
                  <span>ID: {selectedEmail.id}</span>
                </div>
              </div>

              {/* Toggle tabs for checking details vs actual terminal timelines */}
              <div className="flex border-b border-[#141414]/15 mt-3 select-none">
                <button
                  id="tab-btn-details"
                  onClick={() => setActiveStepTab('details')}
                  className={`px-4 py-2 text-[10px] font-mono font-extrabold uppercase border-b-2 -mb-px transition-all tracking-wider ${
                    activeStepTab === 'details'
                      ? 'border-[#141414] text-[#141414] bg-white/20'
                      : 'border-transparent text-[#141414]/50 hover:text-[#141414]'
                  }`}
                >
                  Processed Context
                </button>
                <button
                  id="tab-btn-logs"
                  onClick={() => setActiveStepTab('logs')}
                  className={`px-4 py-2 text-[10px] font-mono font-extrabold uppercase border-b-2 -mb-px transition-all tracking-wider ${
                    activeStepTab === 'logs'
                      ? 'border-[#141414] text-[#141414] bg-white/20'
                      : 'border-transparent text-[#141414]/50 hover:text-[#141414]'
                  }`}
                >
                  Automation Log ({selectedEmail.logs?.length || 0})
                </button>
              </div>

              <div className="mt-4">
                {activeStepTab === 'details' ? (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Visual Email Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white border border-[#141414]/15 space-y-1 rounded-none">
                        <span className="text-[8px] font-bold font-mono text-[#141414]/60 uppercase tracking-widest block">Analysis Summary</span>
                        <p className="text-xs text-[#141414] leading-relaxed font-sans font-medium">
                          {selectedEmail.summary || 'Summary drafting pending AI analysis completion.'}
                        </p>
                      </div>
                      <div className="p-4 bg-white border border-[#141414]/15 flex flex-col justify-between rounded-none">
                        <div>
                          <span className="text-[8px] font-bold font-mono text-[#141414]/60 uppercase tracking-widest block mb-1.5">Extracted Entities</span>
                          <div className="space-y-1 text-xs text-[#141414]">
                            {selectedEmail.extractedEntities?.company && (
                              <div className="flex justify-between font-mono text-[11px] border-b border-[#141414]/5 pb-1">
                                <span className="text-[#141414]/60">Company:</span>
                                <span className="font-extrabold">{selectedEmail.extractedEntities.company}</span>
                              </div>
                            )}
                            {selectedEmail.extractedEntities?.product && (
                              <div className="flex justify-between font-mono text-[11px] border-b border-[#141414]/5 pb-1">
                                <span className="text-[#141414]/60">Product Target:</span>
                                <span className="font-extrabold">{selectedEmail.extractedEntities.product}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-mono text-[11px]">
                              <span className="text-[#141414]/60">Sentiment Status:</span>
                              <span className="capitalize font-mono font-bold text-red-600">
                                {selectedEmail.sentiment || 'neutral'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email content layout snippet */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold tracking-widest text-[#141414]/60 font-mono uppercase block">Original Payload Content</span>
                      <div className="p-4 border-2 border-[#141414] bg-white rounded-none max-h-[170px] overflow-y-auto text-xs text-[#141414]/85 leading-relaxed font-mono">
                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                      </div>
                    </div>

                    {/* Current action taken tracker */}
                    {selectedEmail.actionTaken && (
                      <div className="p-3 bg-white border border-[#141414] rounded-none flex items-start space-x-3">
                        <CheckCircle size={15} className="text-green-600 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#141414]/65 font-mono">Action Routed</span>
                          <p className="text-xs text-[#141414] leading-relaxed font-bold font-mono">
                            {selectedEmail.actionTaken}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Core shell terminal simulator */
                  <div className="bg-[#141414] text-[#E4E3E0] p-4 font-mono text-[11px] space-y-2 border-2 border-[#141414] animate-fadeIn flex flex-col justify-between min-h-[290px]">
                    <div>
                      <div className="flex items-center space-x-2 text-[10px] text-[#E4E3E0]/50 border-b border-[#E4E3E0]/15 pb-2 mb-2">
                        <span>PIPELINE_FLOW_TASKS: threadId={selectedEmail.threadId}</span>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {selectedEmail.logs?.map((lg, idx) => (
                          <div key={idx} className="flex items-start space-x-2 leading-tight">
                            <span className="text-green-400 font-bold">▶</span>
                            <span>{lg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-green-400 font-bold pt-2 flex items-center space-x-1.5 border-t border-[#E4E3E0]/15 mt-4">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span>DAEMON_COMPLETE: Awaiting webhook response interactions...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-[#141414]/50 text-xs flex-1 flex flex-col items-center justify-center space-y-2">
            <Layers size={22} className="opacity-60" />
            <span className="font-serif italic text-sm">Select an active email thread item on the left panel to inspect automation runs.</span>
          </div>
        )}
      </div>
    </div>
  );
}
