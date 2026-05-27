import { useState } from 'react';
import { 
  Mail, Cpu, Split, Database, AlertCircle, Send, Slack, CheckCircle, Save, Download, Copy, Play, Sliders
} from 'lucide-react';

interface N8nNode {
  id: string;
  name: string;
  icon: any;
  status: 'active' | 'warning' | 'idle';
  description: string;
  category: 'Trigger' | 'Intelligence' | 'Logic' | 'Storage' | 'Communication';
  config: {
    [key: string]: any;
  };
  jsonTemplate: string;
}

interface N8nPropertyField {
  label: string;
  key: string;
  type: 'text' | 'number' | 'textarea' | 'select';
  options?: string[];
}

export default function N8nCanvas({
  onSettingsChange,
  testConfigs,
}: {
  onSettingsChange: (key: string, value: any) => void;
  testConfigs: {
    confidenceThreshold: number;
    supportFaq: string;
    slackChannel: string;
    escalationHours: number;
  };
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-2');
  const [copiedIndex, setCopiedIndex] = useState<boolean>(false);

  // Nodes corresponding to the user specification
  const nodes: N8nNode[] = [
    {
      id: 'node-1',
      name: 'Gmail Inbox Trigger',
      icon: Mail,
      status: 'active',
      category: 'Trigger',
      description: 'Polls primary unread inbox every 5 minutes. Extracts sender, body text, and attachments flag. Strips HTML content.',
      config: {
        pollingIntervalMin: 5,
        targetLabel: 'INBOX',
        unreadOnly: true,
        stripHtml: true,
        deduplicateRedis: true
      },
      jsonTemplate: `{
  "parameters": {
    "pollTimes": {
      "item": [{ "mode": "everyXMinutes", "value": 5 }]
    },
    "simple": true,
    "filters": { "readStatus": "unread" },
    "options": { "dataProperty": "bodyText" }
  },
  "type": "n8n-nodes-base.gmailTrigger",
  "typeVersion": 1,
  "name": "Gmail Ingest Poller"
}`
    },
    {
      id: 'node-2',
      name: 'Gemini AI Triage',
      icon: Cpu,
      status: 'active',
      category: 'Intelligence',
      description: 'Sends email plain text to Gemini 3.5-flash with a structured system instruction. Returns classification, sentiment & entities.',
      config: {
        model: 'gemini-3.5-flash',
        confidenceThreshold: testConfigs.confidenceThreshold,
        systemInstruction: 'You are an AI Email Classifier. Classify into support, sales, urgent, spam, newsletter...'
      },
      jsonTemplate: `{
  "parameters": {
    "model": "gemini-3.5-flash",
    "options": { "responseMimeType": "application/json" },
    "messages": {
      "messageValues": [
        { "role": "system", "message": "Classify incoming emails into support, sales, urgent, spam, newsletter. Produce confidence ratios and sentiment." }
      ]
    }
  },
  "type": "n8n-nodes-base.openAi",
  "typeVersion": 1,
  "name": "Gemini Classifier"
}`
    },
    {
      id: 'node-3',
      name: 'Category Switch Router',
      icon: Split,
      status: 'active',
      category: 'Logic',
      description: 'Splits execution pathways dynamically using confidence scores and LLM output values.',
      config: {
        conditionField: 'category',
        routingRules: ['urgent -> Urgent Alert', 'support -> Notion Support', 'sales -> Notion Commercial Leads', 'spam -> Silent Archive']
      },
      jsonTemplate: `{
  "parameters": {
    "rules": {
      "values": [
        { "value1": "={{$json.category}}", "value2": "urgent", "operation": "equal" },
        { "value1": "={{$json.category}}", "value2": "support", "operation": "equal" },
        { "value1": "={{$json.category}}", "value2": "sales", "operation": "equal" }
      ]
    }
  },
  "type": "n8n-nodes-base.switch",
  "typeVersion": 1,
  "name": "Category Router Switch"
}`
    },
    {
      id: 'node-4',
      name: 'Notion Database Hub',
      icon: Database,
      status: 'active',
      category: 'Storage',
      description: 'Maps structured support queues and sales leads to centralized Notion tracker databases including metadata, summary details, and draft updates.',
      config: {
        supportDatabaseId: 'db_support_300223',
        salesDatabaseId: 'db_crm_948110',
        auditLoggingEnabled: true
      },
      jsonTemplate: `{
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
  "type": "n8n-nodes-base.notion",
  "typeVersion": 2,
  "name": "Notion Ticket Storage"
}`
    },
    {
      id: 'node-5',
      name: 'Slack Alerts Dispatcher',
      icon: Slack,
      status: 'active',
      category: 'Communication',
      description: 'Pipes urgent alerts straight to inbox owners and templates interactive draft reviews inside channels using Slack Block Kit.',
      config: {
        reviewChannel: testConfigs.slackChannel,
        interactiveSlackButtons: true,
        timeoutEscalationHours: testConfigs.escalationHours
      },
      jsonTemplate: `{
  "parameters": {
    "channel": "=${testConfigs.slackChannel}",
    "text": "📬 *Inbox Approval Request!*\\n\\n*Subject:* ={{$json.subject}}\\n*Suggested Reply:* ={{$json.draft_reply}}",
    "attachments": [
      {
        "actions": [
          { "name": "approve", "text": "Approve Response", "type": "button", "value": "approve" },
          { "name": "reject", "text": "Reject", "type": "button", "value": "reject" }
        ]
      }
    ]
  },
  "type": "n8n-nodes-base.slack",
  "typeVersion": 1,
  "name": "Slack Approvals (Block Kit)"
}`
    },
    {
      id: 'node-6',
      name: 'Gemini Reply Drafter',
      icon: Cpu,
      status: 'active',
      category: 'Intelligence',
      description: 'Invokes Gemini 3.5-flash with custom guideline rules to build contextually appropriate proposed answers matching company policies.',
      config: {
        model: 'gemini-3.5-flash',
        faqDatabaseSnippet: testConfigs.supportFaq,
        toneAndVibe: 'Friendly, helpful, authoritative IT coordinator'
      },
      jsonTemplate: `{
  "parameters": {
    "model": "gemini-3.5-flash",
    "messages": {
      "messageValues": [
        { "role": "system", "message": "Draft a personalized reply utilizing company contexts and standard FAQ lines: ${testConfigs.supportFaq}" }
      ]
    }
  },
  "type": "n8n-nodes-base.openAi",
  "typeVersion": 1,
  "name": "Gemini Proposed Drafter"
}`
    },
    {
      id: 'node-7',
      name: 'Gmail Thread replyer',
      icon: Send,
      status: 'active',
      category: 'Communication',
      description: 'Dispatches finalized, approved email messages back to the client using Thread ID parameters to preserve cohesive email threads.',
      config: {
        sendMethod: 'SMTP/Gmail API',
        threadReplying: true,
        bccLogAddress: 'audit-compliance@acmetech.io'
      },
      jsonTemplate: `{
  "parameters": {
    "resource": "message",
    "operation": "reply",
    "messageId": "={{$json.id}}",
    "threadId": "={{$json.threadId}}",
    "bodyHtml": "={{$json.approved_draft}}"
  },
  "type": "n8n-nodes-base.gmail",
  "typeVersion": 2,
  "name": "Gmail Thread Replier"
}`
    }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(selectedNode.jsonTemplate);
    setCopiedIndex(true);
    setTimeout(() => setCopiedIndex(false), 2000);
  };

  const handleFieldChange = (key: string, val: any) => {
    onSettingsChange(key, val);
  };

  // Node Fields definitions based on keys
  const getFieldConfigurations = (nodeId: string): { label: string; key: string; type: 'text' | 'number' | 'textarea' | 'select'; options?: string[] }[] => {
    switch (nodeId) {
      case 'node-2':
        return [
          { label: 'Classification Model', key: 'model', type: 'select', options: ['gemini-3.5-flash', 'gemini-3.1-pro-preview'] },
          { label: 'Confidence Score Threshold (%)', key: 'confidenceThreshold', type: 'number' },
        ];
      case 'node-5':
        return [
          { label: 'Slack Target Review Channel', key: 'slackChannel', type: 'text' },
          { label: 'Escalation Alert Timeout (Hrs)', key: 'escalationHours', type: 'number' }
        ];
      case 'node-6':
        return [
          { label: 'Knowledge FAQ Snippets Database', key: 'supportFaq', type: 'textarea' },
          { label: 'Persona Tone Vibe', key: 'toneAndVibe', type: 'text' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Workflow Canvas Schema Map */}
      <div className="lg:col-span-2 bg-[#E4E3E0] text-[#141414] border-2 border-[#141414] p-6 flex flex-col justify-between relative overflow-hidden min-h-[500px] shadow-[4px_4px_0px_0px_#141414]">
        {/* Ambient Grid styling */}
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#141414]/25">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                <h3 className="text-xs font-bold tracking-[0.15em] text-[#141414] uppercase font-mono">
                  n8n.blueprint.orchestrator
                </h3>
              </div>
              <p className="text-[11px] font-serif italic text-[#141414]/75">
                Click any pipeline node to inspect structured configurations & schemas.
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-[#141414] text-[#E4E3E0] border border-[#141414] px-3 py-1 text-[10px] uppercase font-mono tracking-wider">
              <Play size={10} className="text-green-400" />
              <span>LOGIC_ENGINE: 200 OK</span>
            </div>
          </div>

          {/* Graphical Node Pipeline diagram layout */}
          <div className="flex flex-col space-y-4 py-2 max-w-lg mx-auto relative">
            {nodes.map((node, index) => {
              const NodeIcon = node.icon;
              const isSelected = node.id === selectedNodeId;
              return (
                <div key={node.id} className="relative flex flex-col items-center">
                  {/* Connector line design */}
                  {index > 0 && (
                    <div className="absolute -top-4 w-0.5 h-4 bg-[#141414] relative-z-0" />
                  )}

                  <button
                    id={`workflow-node-${node.id}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full text-left p-3 border-2 border-[#141414] flex items-center justify-between transition-all duration-155 relative ${
                      isSelected
                        ? 'bg-[#141414] text-[#E4E3E0] shadow-[2px_2px_0px_0px_#141414]'
                        : 'bg-white hover:bg-[#DCDAD7]/60 text-[#141414]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 border border-[#141414] ${
                        isSelected 
                          ? 'bg-[#E4E3E0] text-[#141414]' 
                          : 'bg-[#DCDAD7] text-[#141414]'
                      }`}>
                        <NodeIcon size={14} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold uppercase tracking-wide font-mono">{node.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 border font-mono font-bold ${
                            isSelected 
                              ? 'bg-[#141414]/80 text-[#E4E3E0] border-[#E4E3E0]/20' 
                              : 'bg-white text-[#141414]/60 border-[#141414]/20'
                          }`}>
                            {node.category}
                          </span>
                        </div>
                        <p className={`text-[10px] line-clamp-1 max-w-[280px] font-mono opacity-80 ${
                          isSelected ? 'text-[#E4E3E0]' : 'text-[#141414]/80'
                        }`}>
                          {node.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pl-2">
                      <span className={`h-2 w-2 rounded-full border border-[#141414] ${
                        node.status === 'active' ? 'bg-green-600' : 'bg-amber-500'
                      }`} />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action triggers */}
        <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 text-xs justify-end relative z-10 pt-4 border-t border-[#141414]/25">
          <button
            id="download-n8n-schema-btn"
            onClick={async () => {
              const res = await fetch("/api/workflows/n8n-json");
              const data = await res.json();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "ai-email-triage-n8n-workflow.json";
              a.click();
            }}
            className="flex items-center justify-center space-x-2 bg-white border-2 border-[#141414] text-[#141414] hover:bg-[#DCDAD7] py-2 px-4 font-bold tracking-wider uppercase text-[10px] transition-all duration-150"
          >
            <Download size={12} />
            <span>EXPORT_N8N_WORKFLOW_SCHEMA</span>
          </button>
        </div>
      </div>

      {/* Editor & JSON view side pane */}
      <div id="n8n-editor-sidepane" className="bg-[#DCDAD7] text-[#141414] border-2 border-[#141414] p-6 flex flex-col justify-between h-full shadow-[4px_4px_0px_0px_#141414]">
        <div>
          <div className="flex items-center space-x-3 pb-4 border-b border-[#141414]/25 mb-5">
            <div className="p-2 bg-[#141414] text-[#E4E3E0] border border-[#141414]">
              <Sliders size={14} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold font-mono tracking-widest text-[#141414] uppercase">
                NODE_PARAMS_INSPECT
              </h4>
              <p className="font-serif italic text-[11px] text-[#141414]/70">
                {selectedNode.name}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#141414]/80 leading-relaxed mb-6 font-mono bg-[#E4E3E0] p-3 border border-[#111111]/15">
            {selectedNode.description}
          </p>

          {/* Form parameters */}
          {getFieldConfigurations(selectedNode.id).length > 0 ? (
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#141414]/70 font-mono block border-b border-[#141414]/10 pb-1">
                Node Configuration Variables
              </span>
              {getFieldConfigurations(selectedNode.id).map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#141414] font-mono block">{field.label}</label>
                  {field.type === 'text' && (
                    <input
                      id={`field-input-${field.key}`}
                      type="text"
                      className="w-full text-xs font-mono px-3 py-2 border-2 border-[#141414] bg-white text-[#141414] focus:outline-none"
                      value={testConfigs[field.key as keyof typeof testConfigs] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  )}
                  {field.type === 'number' && (
                    <input
                      id={`field-input-${field.key}`}
                      type="number"
                      className="w-full text-xs px-3 py-2 border-2 border-[#141414] bg-white text-[#141414] focus:outline-none font-mono"
                      value={testConfigs[field.key as keyof typeof testConfigs] || ''}
                      onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                    />
                  )}
                  {field.type === 'textarea' && (
                    <textarea
                      id={`field-input-${field.key}`}
                      rows={5}
                      className="w-full text-xs px-3 py-2 border-2 border-[#141414] bg-white text-[#141414] focus:outline-none font-sans leading-relaxed text-slate-800"
                      value={testConfigs[field.key as keyof typeof testConfigs] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      id={`field-select-${field.key}`}
                      className="w-full text-xs px-3 py-2 border-2 border-[#141414] bg-white text-[#141414] focus:outline-none font-mono"
                      value={testConfigs[field.key as keyof typeof testConfigs] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#E4E3E0] border border-[#141414]/15 p-4 text-center my-4 font-serif italic text-xs text-[#141414]/70">
              This node implements static sandbox actions & workflow variables.
            </div>
          )}

          {/* Copyable code block snippet */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#141414]/60 font-mono">
                n8n.node.template_preview
              </span>
              <button
                id="copy-blueprint-node-btn"
                onClick={copyToClipboard}
                className="text-[10px] uppercase tracking-wider text-[#141414] hover:underline font-bold font-mono flex items-center space-x-1"
              >
                {copiedIndex ? (
                  <>
                    <CheckCircle size={10} className="text-green-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={10} />
                    <span>COPY_NODE_JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-white text-[#141414] border-2 border-[#141414] text-[10px] overflow-x-auto font-mono max-h-[140px] leading-relaxed">
              {selectedNode.jsonTemplate}
            </pre>
          </div>
        </div>

        <div className="pt-4 border-t border-[#141414]/15 text-[9px] text-[#141414]/60 text-center font-mono mt-4">
          Node definition matching engine: JSON schema draft v4
        </div>
      </div>
    </div>
  );
}
