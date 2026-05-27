import { useState } from 'react';
import { 
  Slack, Hash, MessageSquare, Check, X, Edit3, Send, ShieldAlert, Clock, UserCheck
} from 'lucide-react';
import { SlackMessage } from '../types';

interface SlackApproverProps {
  notifications: SlackMessage[];
  onActionSubmit: (emailId: string, action: 'approve' | 'edit' | 'reject', modifiedDraft?: string) => void;
}

export default function SlackApprover({
  notifications,
  onActionSubmit
}: SlackApproverProps) {
  const [activeChannel, setActiveChannel] = useState<'#email-review' | 'Direct Message'>('#email-review');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedDraftValue, setEditedDraftValue] = useState<string>('');

  const filteredNotifications = notifications.filter(n => n.channel === activeChannel);

  const handleStartEdit = (msg: SlackMessage) => {
    setEditingId(msg.id);
    setEditedDraftValue(msg.draftReply || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveAndSend = (emailId: string) => {
    onActionSubmit(emailId, 'edit', editedDraftValue);
    setEditingId(null);
  };

  return (
    <div id="slack-workspace-mock" className="bg-[#DCDAD7] text-[#141414] border-2 border-[#141414] grid grid-cols-1 md:grid-cols-12 min-h-[500px] shadow-[4px_4px_0px_0px_#141414] rounded-none">
      
      {/* Sidebar Channels List */}
      <div className="md:col-span-3 bg-[#E4E3E0] p-4 border-r-2 border-[#141414] w-full space-y-5">
        <div className="flex items-center space-x-2 border-b-2 border-[#141414]/15 pb-3">
          <div className="p-1.5 bg-[#141414] text-[#E4E3E0] border border-[#141414] rounded-none">
            <Slack size={15} />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-[#141414]">ACME_SLACK_WS</h4>
            <span className="text-[9px] text-[#141414]/75 font-mono uppercase font-bold">STATUS: OK</span>
          </div>
        </div>

        <div className="space-y-4 select-none">
          {/* Channels Section */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-[#141414]/60 font-mono tracking-widest px-2 block">
              CHANNELS_LIST
            </span>
            <button
              id="slack-chan-email-review"
              onClick={() => setActiveChannel('#email-review')}
              className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-none text-xs font-bold font-mono uppercase ${
                activeChannel === '#email-review'
                  ? 'bg-[#141414] text-[#E4E3E0] border border-[#141414]'
                  : 'text-[#141414]/75 hover:bg-[#DCDAD7] border border-transparent'
              }`}
            >
              <Hash size={13} className="opacity-70" />
              <span>email-review</span>
              {notifications.filter(n => n.channel === '#email-review' && n.status === 'pending').length > 0 && (
                <span className="ml-auto bg-red-600 text-white text-[9px] px-1.5 py-0.2 font-mono font-bold animate-pulse border border-[#141414]">
                  {notifications.filter(n => n.channel === '#email-review' && n.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {/* Direct Messages Section */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-[#141414]/60 font-mono tracking-widest px-2 block">
              DIRECT_INTEGRATIONS
            </span>
            <button
              id="slack-chan-direct-message"
              onClick={() => setActiveChannel('Direct Message')}
              className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-none text-xs font-bold font-mono uppercase ${
                activeChannel === 'Direct Message'
                  ? 'bg-[#141414] text-[#E4E3E0] border border-[#141414]'
                  : 'text-[#141414]/75 hover:bg-[#DCDAD7] border border-transparent'
              }`}
            >
              <MessageSquare size={13} className="opacity-70" />
              <span>Inbox Owner</span>
              {notifications.filter(n => n.channel === 'Direct Message' && n.status === 'pending').length > 0 && (
                <span className="ml-auto bg-red-600 text-white text-[9px] px-1.5 py-0.2 font-mono font-bold animate-pulse border border-[#141414]">
                  {notifications.filter(n => n.channel === 'Direct Message' && n.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Workspace list */}
      <div className="md:col-span-9 bg-white flex flex-col justify-between h-full min-h-[440px]">
        <div className="p-4 border-b-2 border-[#141414] bg-[#E4E3E0]/40 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-extrabold text-[#141414] flex items-center space-x-1.5 uppercase font-mono tracking-wider">
              <span>{activeChannel}</span>
            </span>
            <p className="text-[10px] text-[#141414]/70 font-mono font-bold uppercase">
              DECENTRALIZED_SLACK_BLOCKKIT_INTERACTIVE_API
            </p>
          </div>
          <div className="text-[9px] text-[#141414] font-mono bg-[#E4E3E0] border border-[#141414] px-2 py-0.5 uppercase font-bold">
            DAEMON: ACTIVE
          </div>
        </div>

        {/* Message Feeds Stack */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[380px] bg-[#E4E3E0]/15">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-20 text-[#141414]/50 text-xs flex flex-col items-center justify-center space-y-2 font-serif italic">
              <Slack size={20} className="opacity-40" />
              <span>No notifications in this channel. Inject email to simulate.</span>
            </div>
          ) : (
            filteredNotifications.map((msg) => (
              <div
                id={`slack-card-${msg.id}`}
                key={msg.id}
                className={`bg-white border-2 border-[#141414] p-4.5 space-y-3.5 shadow-[2px_2px_0px_0px_#141414] rounded-none transition-all ${
                  msg.status !== 'pending' ? 'opacity-[0.55]' : ''
                }`}
              >
                <div className="flex items-start justify-between border-b border-[#141414]/10 pb-2">
                  <div className="flex space-x-2.5">
                    <div className="p-2 bg-[#141414] text-[#E4E3E0] border border-[#141414] rounded-none">
                      <Slack size={12} />
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-bold text-[#141414] uppercase tracking-tight">{msg.title}</h5>
                      <p className="text-[9px] text-[#141414]/60 font-mono">TIMESTAMP: {msg.timestamp || '11:13'}</p>
                    </div>
                  </div>
                  {msg.status !== 'pending' && (
                    <span className={`text-[8px] uppercase tracking-wider font-extrabold font-mono px-2 py-0.2 border border-[#141414] ${
                      msg.status === 'approved' 
                        ? 'bg-green-500 text-white'
                        : msg.status === 'edited'
                        ? 'bg-[#141414] text-[#E4E3E0]'
                        : 'bg-rose-500 text-white'
                    }`}>
                      {msg.status}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-[#E4E3E0]/30 border border-[#141414]/15 rounded-none text-xs leading-relaxed text-[#141414] font-mono">
                  <pre className="font-sans whitespace-pre-wrap">{msg.body}</pre>
                </div>

                {/* Simulated Block Kit Draft Area */}
                {msg.draftReply && (
                  <div className="p-4 bg-[#E4E3E0] border-2 border-[#141414] space-y-3 rounded-none shadow-[2px_2px_0px_0px_#141414]">
                    <span className="text-[9px] font-extrabold font-mono uppercase text-[#141414] tracking-widest block border-b border-[#141414]/10 pb-1">
                      🤖 PROPOSED_RESPONSE_MATRIX
                    </span>
                    {editingId === msg.id ? (
                      <div className="space-y-3">
                        <textarea
                          id={`slack-edit-textarea-${msg.id}`}
                          rows={6}
                          className="w-full text-xs bg-white border-2 border-[#141414] text-[#141414] rounded-none p-3 focus:outline-none font-mono"
                          value={editedDraftValue}
                          onChange={(e) => setEditedDraftValue(e.target.value)}
                        />
                        <div className="flex space-x-2 justify-end text-xs font-mono">
                          <button
                            id="slack-edit-cancel"
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 border border-[#141414] hover:bg-white text-[#141414] font-bold transition rounded-none text-[10px] uppercase"
                          >
                            Cancel
                          </button>
                          <button
                            id="slack-edit-submit"
                            onClick={() => handleSaveAndSend(msg.emailId)}
                            className="px-4 py-1.5 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 font-bold transition flex items-center space-x-1.5 rounded-none text-[10px] uppercase"
                          >
                            <Send size={11} />
                            <span>Save & Approved Dispatch</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-[#141414] bg-white border border-[#141414]/10 p-3 rounded-none font-medium leading-relaxed max-h-[160px] overflow-y-auto">
                          {msg.draftReply}
                        </p>
                        {msg.status === 'pending' && (
                          <div className="flex flex-wrap gap-2 pt-2 text-xs font-mono">
                            <button
                              id={`slack-approve-btn-${msg.id}`}
                              onClick={() => onActionSubmit(msg.emailId, 'approve')}
                              className="px-3.5 py-1.5 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 font-bold flex items-center space-x-1.5 rounded-none text-[10px] uppercase shadow-[1px_1px_0px_0px_#141414]"
                            >
                              <Check size={12} />
                              <span>Approve Run</span>
                            </button>
                            <button
                              id={`slack-edit-btn-${msg.id}`}
                              onClick={() => handleStartEdit(msg)}
                              className="px-3.5 py-1.5 bg-white border-2 border-[#141414] hover:bg-[#DCDAD7] text-[#141414] font-bold flex items-center space-x-1.5 rounded-none text-[10px] uppercase shadow-[1px_1px_0px_0px_#141414]"
                            >
                              <Edit3 size={11} />
                              <span>Edit response template</span>
                            </button>
                            <button
                              id={`slack-reject-btn-${msg.id}`}
                              onClick={() => onActionSubmit(msg.emailId, 'reject')}
                              className="px-3 py-1.5 bg-white border border-[#141414] hover:border-red-600 hover:text-red-600 text-[#141414]/80 font-bold transition flex items-center space-x-1 text-[10px] uppercase rounded-none"
                            >
                              <X size={11} />
                              <span>Discard Draft</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input box border decorator */}
        <div className="p-4 border-t-2 border-[#141414] bg-[#E4E3E0]/40 text-center text-[10px] text-[#141414]/65 font-mono uppercase font-bold">
          Interactive Webhook approval feedback loops live-sync to Notion systems instantly.
        </div>
      </div>
    </div>
  );
}
