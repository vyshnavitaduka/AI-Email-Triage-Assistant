import { useState } from 'react';
import { 
  Database, UserCheck, AlertOctagon, HelpCircle, ArrowUpRight, Check, Calendar, Activity, CheckCircle
} from 'lucide-react';
import { NotionTicket, NotionLead, AuditLog, Email } from '../types';

interface NotionHubProps {
  tickets: NotionTicket[];
  leads: NotionLead[];
  logs: AuditLog[];
  onResolveTicket: (emailId: string) => void;
}

export default function NotionHub({
  tickets,
  leads,
  logs,
  onResolveTicket
}: NotionHubProps) {
  const [activeTab, setActiveTab] = useState<'support' | 'sales' | 'audit'>('support');

  const getPriorityBadge = (prio: NotionTicket['priority']) => {
    switch (prio) {
      case 'High':
        return <span className="bg-red-600 text-white border border-[#141414] font-bold text-[9px] px-2 py-0.5 rounded-none font-mono tracking-wider">HIGH</span>;
      case 'Medium':
        return <span className="bg-amber-450 text-[#141414] border border-[#141414] font-bold text-[9px] px-2 py-0.5 rounded-none font-mono tracking-wider">MEDIUM</span>;
      default:
        return <span className="bg-[#DCDAD7] text-[#141414] border border-[#141414]/20 font-bold text-[9px] px-2 py-0.5 rounded-none font-mono tracking-wider">LOW</span>;
    }
  };

  const getStatusBadge = (status: NotionTicket['status']) => {
    switch (status) {
      case 'Open':
        return <span className="bg-[#DCDAD7] text-[#141414] border border-[#141414] text-[9px] px-2 py-0.5 font-bold font-mono uppercase rounded-none">Open</span>;
      case 'In Progress':
        return <span className="bg-blue-400 text-[#141414] border border-[#141414] text-[9px] px-2 py-0.5 font-bold font-mono uppercase rounded-none animate-pulse">In Progress</span>;
      case 'Resolved':
        return <span className="bg-green-500 text-white border border-[#141414] text-[9px] px-2 py-0.5 font-bold font-mono uppercase rounded-none">Resolved</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] overflow-hidden rounded-none">
      
      {/* Notion Workspace Header Layout */}
      <div className="px-6 py-5 border-b-2 border-[#141414] bg-[#E4E3E0] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#141414] text-[#E4E3E0] border border-[#141414] rounded-none">
            <Database size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-widest text-[#141414] uppercase font-mono">
              NOTION_WORKSPACE_INDEXES
            </h3>
            <p className="text-[9px] font-mono font-bold uppercase text-[#141414]/70 mt-0.5">
              Acme Production Database mirror syncs
            </p>
          </div>
        </div>

        {/* Database selector buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-transparent p-0 text-xs font-bold font-mono">
          <button
            id="notion-tab-support"
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 border-2 transition rounded-none text-[10px] uppercase font-mono font-bold ${
              activeTab === 'support'
                ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[1px_1px_0px_0px_#141414]'
                : 'bg-white text-[#141414] border-[#141414]/20 hover:border-[#141414]'
            }`}
          >
            Support Tickets ({tickets.length})
          </button>
          <button
            id="notion-tab-sales"
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 border-2 transition rounded-none text-[10px] uppercase font-mono font-bold ${
              activeTab === 'sales'
                ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[1px_1px_0px_0px_#141414]'
                : 'bg-white text-[#141414] border-[#141414]/20 hover:border-[#141414]'
            }`}
          >
            Sales CRM Leads ({leads.length})
          </button>
          <button
            id="notion-tab-audit"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 border-2 transition rounded-none text-[10px] uppercase font-mono font-bold ${
              activeTab === 'audit'
                ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[1px_1px_0px_0px_#141414]'
                : 'bg-white text-[#141414] border-[#141414]/20 hover:border-[#141414]'
            }`}
          >
            Audit History ({logs.length})
          </button>
        </div>
      </div>

      {/* Database Tables Content */}
      <div className="p-6 bg-white">
        
        {/* Support Tickets Database */}
        {activeTab === 'support' && (
          <div className="overflow-x-auto animate-fadeIn col-span-12">
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-[#141414]/40 text-xs font-mono font-serif italic">
                No tickets logged in help-desk catalog.
              </div>
            ) : (
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#141414] text-[10px] text-[#141414]/80 uppercase font-bold tracking-wider font-mono">
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Sender Email</th>
                    <th className="py-3 px-4">Date Recv</th>
                    <th className="py-3 px-4">Ticket Status</th>
                    <th className="py-3 px-2 text-right">Row actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/10 text-xs text-[#141414]/90 font-mono">
                  {tickets.map((t) => (
                    <tr id={`notion-support-row-${t.id}`} key={t.id} className="hover:bg-[#E4E3E0]/15">
                      <td className="py-3.5 px-4">{getPriorityBadge(t.priority)}</td>
                      <td className="py-3.5 px-4 font-bold text-[#141414] font-sans max-w-[210px] truncate">
                        {t.title}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#141414]/75 text-[11px]">{t.sender}</td>
                      <td className="py-3.5 px-4 font-mono text-[#141414]/40">{t.dateReceived}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>
                      <td className="py-3.5 px-2 text-right">
                        {t.status !== 'Resolved' ? (
                          <button
                            id={`resolve-t-btn-${t.id}`}
                            onClick={() => onResolveTicket(t.emailId)}
                            className="text-[9px] font-bold font-mono text-emerald-700 bg-white border border-[#141414] hover:bg-[#DCDAD7] rounded-none px-2 py-0.5 flex items-center mb-0 w-fit ml-auto space-x-1 uppercase"
                          >
                            <CheckCircle size={10} />
                            <span>Resolve Thread</span>
                          </button>
                        ) : (
                          <span className="text-[9px] text-[#141414]/50 font-mono uppercase font-bold">Dispatched</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Sales leads database */}
        {activeTab === 'sales' && (
          <div className="overflow-x-auto animate-fadeIn col-span-12">
            {leads.length === 0 ? (
              <div className="text-center py-12 text-[#141414]/40 text-xs font-mono font-serif italic">
                No active target commercial leads inside matching database schemas.
              </div>
            ) : (
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#141414] text-[10px] text-[#141414]/80 uppercase font-bold tracking-wider font-mono">
                    <th className="py-3 px-4">Company Target</th>
                    <th className="py-3 px-4">Acquisition Name</th>
                    <th className="py-3 px-4">Lead Email</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Follow-up Due</th>
                    <th className="py-3 px-4">CRM Scope Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/10 text-xs text-[#141414]/90 font-mono">
                  {leads.map((l) => (
                    <tr id={`notion-sales-row-${l.id}`} key={l.id} className="hover:bg-[#E4E3E0]/15">
                      <td className="py-3.5 px-4 font-bold text-[#141414] font-sans">{l.company}</td>
                      <td className="py-3.5 px-4 text-[#141414] font-semibold font-sans">{l.contact}</td>
                      <td className="py-3.5 px-4 text-[11px] font-mono text-[#141414]/75">{l.email}</td>
                      <td className="py-3.5 px-4 text-[#141414]/65 font-bold uppercase text-[10px]">{l.category}</td>
                      <td className="py-3.5 px-4 text-red-650 font-bold flex items-center space-x-1 py-4.5">
                        <Calendar size={11} />
                        <span>{l.followUpDate}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#141414]/60 max-w-[240px] truncate">{l.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Audit logs history */}
        {activeTab === 'audit' && (
          <div className="overflow-x-auto animate-fadeIn col-span-12">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-[#141414]/40 text-xs font-mono font-serif italic">
                Pipeline execution history logs are empty.
              </div>
            ) : (
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#141414] text-[10px] text-[#141414]/80 uppercase font-bold tracking-wider font-mono">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Email Subject Index</th>
                    <th className="py-3 px-4">Label</th>
                    <th className="py-3 px-4">LLM Conf</th>
                    <th className="py-3 px-4">Action Pipeline Execution Summary</th>
                    <th className="py-3 px-4 text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/10 text-xs font-mono text-[#141414]/90">
                  {logs.map((logItem) => (
                    <tr id={`audit-row-${logItem.id}`} key={logItem.id} className="hover:bg-[#E4E3E0]/15">
                      <td className="py-3.5 px-4 text-[10px] text-[#141414]/60">
                        {new Date(logItem.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#141414] font-sans max-w-[170px] truncate">
                        {logItem.emailSubject}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 border border-[#141414] bg-[#E4E3E0] text-[#141414]">
                          {logItem.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#141414]/75">{(logItem.confidenceScore * 100).toFixed(0)}%</td>
                      <td className="py-3.5 px-4 font-sans text-[#141414]/65 max-w-[280px] truncate">{logItem.actionTaken}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`text-[8px] tracking-wider uppercase font-extrabold px-2 py-0.5 border border-[#141414] ${
                          logItem.status === 'Success' 
                            ? 'bg-green-500 text-white'
                            : logItem.status === 'Warning'
                            ? 'bg-[#141414] text-[#E4E3E0]'
                            : 'bg-rose-500 text-white'
                        }`}>
                          {logItem.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
