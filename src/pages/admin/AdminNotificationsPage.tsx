import React, { useState, useEffect, useRef } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

interface Template {
  id: number;
  name: string;
  channel: string;
  subject: string;
  body: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

const RichTextEditor: React.FC<{ value: string; onChange: (html: string) => void }> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && !htmlMode) {
      editorRef.current.innerHTML = value;
    }
    setHtmlContent(value);
  }, [value, htmlMode]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-surface-container rounded-lg overflow-hidden bg-surface-container-low flex flex-col">
      <div className="bg-surface-container border-b border-surface-container flex flex-wrap gap-1 p-2">
        <button type="button" onClick={() => exec('bold')} className="px-2 py-1 text-xs font-bold text-primary hover:bg-surface-container-low rounded">B</button>
        <button type="button" onClick={() => exec('italic')} className="px-2 py-1 text-xs italic text-primary hover:bg-surface-container-low rounded">I</button>
        <button type="button" onClick={() => exec('underline')} className="px-2 py-1 text-xs underline text-primary hover:bg-surface-container-low rounded">U</button>
        <div className="w-px bg-surface-container-high mx-1" />
        <button type="button" onClick={() => exec('formatBlock', 'H1')} className="px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-container-low rounded">H1</button>
        <button type="button" onClick={() => exec('formatBlock', 'H2')} className="px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-container-low rounded">H2</button>
        <button type="button" onClick={() => exec('formatBlock', 'P')} className="px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-container-low rounded">P</button>
        <div className="w-px bg-surface-container-high mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className="px-2 py-1 text-xs text-primary hover:bg-surface-container-low rounded">Bullet</button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="px-2 py-1 text-xs text-primary hover:bg-surface-container-low rounded">Number</button>
        <div className="flex-1" />
        <button type="button" onClick={() => setHtmlMode(!htmlMode)} className="px-2 py-1 text-[10px] uppercase font-bold text-secondary hover:bg-surface-container-low rounded">
          {htmlMode ? 'Visual Mode' : 'HTML Mode'}
        </button>
      </div>
      <div className="flex-1 relative min-h-[300px]">
        {htmlMode ? (
          <textarea
            value={htmlContent}
            onChange={(e) => { setHtmlContent(e.target.value); onChange(e.target.value); }}
            className="absolute inset-0 w-full h-full p-4 bg-black text-green-400 font-mono text-xs border-none outline-none resize-none"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            className="absolute inset-0 w-full h-full p-4 text-sm text-primary font-serif outline-none overflow-y-auto"
            style={{ minHeight: '300px' }}
          />
        )}
      </div>
    </div>
  );
};

export const AdminNotificationsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  // Broadcast State
  const [audience, setAudience] = useState<string>('all');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [isSending, setIsSending] = useState(false);
  
  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateTab, setTemplateTab] = useState<'email' | 'sms'>('email');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({});

  const loadData = async () => {
    const token = localStorage.getItem('mq_admin_token');
    if (!token) return;
    try {
      const resTmpl = await fetch(`/api/admin/notifications/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resTmpl.ok) {
        const data = await resTmpl.json();
        setTemplates(data);
      }
      
      const resCust = await fetch('/api/auth/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resCust.ok) {
        const data = await resCust.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditTemplate = (tmpl: Template) => {
    setCurrentTemplate({ ...tmpl });
    setIsEditingTemplate(true);
  };

  const handleCreateNewTemplate = () => {
    setCurrentTemplate({
      channel: templateTab,
      name: '',
      subject: '',
      body: ''
    });
    setIsEditingTemplate(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('mq_admin_token');
    const isNew = !currentTemplate.id;
    const url = isNew 
      ? '/api/admin/notifications/templates' 
      : `/api/admin/notifications/templates/${currentTemplate.id}`;
    
    try {
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(currentTemplate)
      });
      if (res.ok) {
        setIsEditingTemplate(false);
        loadData();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save template');
      }
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch(`/api/admin/notifications/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const getRecipients = () => {
    let filtered = customers;
    if (audience !== 'all') {
      filtered = customers.filter(c => c.tier === audience);
    }
    
    return filtered.map(c => ({
      email: c.email,
      phone: c.phone || '',
      name: c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : 'Valued Patron'
    }));
  };

  const handleSendBroadcast = async () => {
    if (!selectedTemplateId) {
      alert('Please select a template');
      return;
    }
    const recipients = getRecipients();
    if (recipients.length === 0) {
      alert('No recipients match the selected audience criteria.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to broadcast to ${recipients.length} patron(s)?`)) return;

    setIsSending(true);
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          recipients,
          variables: {} // Additional global variables can be added here
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setSelectedTemplateId('');
      } else {
        alert(data.error || 'Failed to send broadcast');
      }
    } catch (err) {
      console.error('Broadcast error:', err);
      alert('Failed to send broadcast');
    }
    setIsSending(false);
  };

  const currentChannelTemplates = templates.filter(t => t.channel === channel);
  const selectedTemplate = templates.find(t => t.id === Number(selectedTemplateId));
  const estimatedRecipients = getRecipients().length;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-72 transition-all duration-300">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          searchValue=""
          onSearch={() => {}}
        />

        <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-6 border-b border-surface-container mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">COMMUNICATIONS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-gold" />
                <span className="text-[10px] uppercase tracking-wider text-outline">BROADCAST ENGINE</span>
              </div>
              <h1 className="font-serif text-3xl text-primary font-normal">Patron Broadcasts</h1>
            </div>
            
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-4 py-2 bg-surface-container-low border border-surface-container hover:border-secondary/30 text-primary text-xs font-semibold uppercase tracking-wider rounded transition-colors"
            >
              Manage Templates
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container shadow-sm">
                <h3 className="font-serif text-lg text-primary font-medium mb-4">Broadcast Configuration</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">Target Channel</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setChannel('email'); setSelectedTemplateId(''); }}
                        className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-colors border ${channel === 'email' ? 'bg-primary text-secondary-gold border-primary' : 'bg-surface-container-low text-on-surface-variant border-surface-container hover:border-secondary/30'}`}
                      >
                        Email
                      </button>
                      <button
                        onClick={() => { setChannel('sms'); setSelectedTemplateId(''); }}
                        className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-colors border ${channel === 'sms' ? 'bg-primary text-secondary-gold border-primary' : 'bg-surface-container-low text-on-surface-variant border-surface-container hover:border-secondary/30'}`}
                      >
                        SMS
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">Target Audience</label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-container rounded p-2 text-sm text-primary outline-none focus:border-secondary"
                    >
                      <option value="all">All Patrons</option>
                      <option value="Circle Privé">Circle Privé Members</option>
                      <option value="VIP Patron">VIP Patrons</option>
                      <option value="Gold Signature">Gold Signature</option>
                      <option value="Platinum Elite">Platinum Elite</option>
                    </select>
                    <p className="text-[10px] text-outline mt-1 text-right">
                      Estimated Recipients: <strong className="text-primary">{estimatedRecipients}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">Select Template</label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-surface-container-low border border-surface-container rounded p-2 text-sm text-primary outline-none focus:border-secondary"
                    >
                      <option value="">-- Choose a template --</option>
                      {currentChannelTemplates.map(tmpl => (
                        <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-surface-container">
                  <button
                    onClick={handleSendBroadcast}
                    disabled={isSending || !selectedTemplateId || estimatedRecipients === 0}
                    className="w-full py-3 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Send Broadcast
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container shadow-sm min-h-full">
                <h3 className="font-serif text-lg text-primary font-medium mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">visibility</span>
                  Preview
                </h3>
                
                {selectedTemplate ? (
                  <div className="space-y-4">
                    {channel === 'email' && (
                      <div className="bg-surface-container-low p-4 rounded border border-surface-container">
                        <span className="text-[10px] uppercase tracking-wider text-outline block mb-1">Subject</span>
                        <h4 className="text-primary font-serif font-medium">{selectedTemplate.subject}</h4>
                      </div>
                    )}
                    <div className="bg-surface-container-low p-6 rounded border border-surface-container min-h-[300px]">
                      <span className="text-[10px] uppercase tracking-wider text-outline block mb-4">Body</span>
                      {channel === 'email' ? (
                        <div 
                          className="prose prose-invert prose-sm max-w-none text-primary font-serif"
                          dangerouslySetInnerHTML={{ __html: selectedTemplate.body }}
                        />
                      ) : (
                        <p className="text-primary font-mono text-sm whitespace-pre-wrap">{selectedTemplate.body}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center border-2 border-dashed border-surface-container rounded-lg">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">preview</span>
                    <p className="text-outline text-sm">Select a template to preview the broadcast.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Templates Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-5xl max-h-[90vh] rounded-xl border border-surface-container shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-container">
              <div>
                <h2 className="font-serif text-2xl text-primary font-medium">Notification Templates</h2>
                <p className="text-xs text-on-surface-variant font-light mt-1">Manage reusable templates for Email and SMS.</p>
              </div>
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {!isEditingTemplate ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex bg-surface-container-low rounded-lg p-1 border border-surface-container">
                      <button
                        onClick={() => setTemplateTab('email')}
                        className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${templateTab === 'email' ? 'bg-primary text-secondary-gold shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
                      >
                        Email
                      </button>
                      <button
                        onClick={() => setTemplateTab('sms')}
                        className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${templateTab === 'sms' ? 'bg-primary text-secondary-gold shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
                      >
                        SMS
                      </button>
                    </div>
                    <button
                      onClick={handleCreateNewTemplate}
                      className="px-4 py-2 bg-primary text-secondary-gold text-[11px] uppercase tracking-wider font-semibold rounded hover:bg-black transition-all"
                    >
                      + New Template
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.filter(t => t.channel === templateTab).length === 0 ? (
                      <div className="col-span-full py-12 text-center text-outline font-serif border-2 border-dashed border-surface-container rounded-lg">
                        No templates found for this channel.
                      </div>
                    ) : (
                      templates.filter(t => t.channel === templateTab).map(tmpl => (
                        <div key={tmpl.id} className="p-4 border border-surface-container rounded-lg bg-surface-container-low flex flex-col justify-between hover:shadow-sm transition-shadow">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold font-mono text-primary bg-surface-container px-2 py-0.5 rounded">{tmpl.name}</span>
                              {tmpl.is_default === 1 && (
                                <span className="text-[9px] uppercase tracking-wider text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full font-bold">System Default</span>
                              )}
                            </div>
                            {templateTab === 'email' && <h3 className="font-serif text-sm font-semibold text-primary mb-2 line-clamp-1">{tmpl.subject}</h3>}
                          </div>
                          <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-surface-container">
                            <button onClick={() => handleEditTemplate(tmpl)} className="text-[10px] uppercase font-bold text-primary hover:text-secondary-gold">Edit</button>
                            {tmpl.is_default !== 1 && (
                              <button onClick={() => handleDeleteTemplate(tmpl.id)} className="text-[10px] uppercase font-bold text-red-600 hover:text-red-800">Delete</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="animate-fade-in max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-xl text-primary font-medium">
                      {currentTemplate.id ? 'Edit Template' : `New ${templateTab.toUpperCase()} Template`}
                    </h3>
                    <button onClick={() => setIsEditingTemplate(false)} className="text-xs font-semibold uppercase tracking-wider text-outline hover:text-primary">Cancel</button>
                  </div>
                  <form onSubmit={handleSaveTemplate} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Internal Name</label>
                        <input
                          type="text"
                          required
                          value={currentTemplate.name || ''}
                          onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                          placeholder="e.g. order_confirmation"
                          className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary outline-none focus:border-secondary"
                        />
                      </div>
                      {templateTab === 'email' && (
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Subject Line</label>
                          <input
                            type="text"
                            required
                            value={currentTemplate.subject || ''}
                            onChange={e => setCurrentTemplate({...currentTemplate, subject: e.target.value})}
                            placeholder="e.g. Your Order {{orderNumber}}"
                            className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary outline-none focus:border-secondary"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Message Body</label>
                      <p className="text-[10px] text-outline mb-2">Available Variables: {'{{customerName}}'}, {'{{orderNumber}}'}, {'{{totalAmount}}'}, etc.</p>
                      {templateTab === 'email' ? (
                        <RichTextEditor
                          value={currentTemplate.body || ''}
                          onChange={(html) => setCurrentTemplate({...currentTemplate, body: html})}
                        />
                      ) : (
                        <textarea
                          required
                          value={currentTemplate.body || ''}
                          onChange={e => setCurrentTemplate({...currentTemplate, body: e.target.value})}
                          rows={6}
                          className="w-full px-4 py-3 bg-surface-container-low border border-surface-container rounded text-sm text-primary font-mono resize-y outline-none focus:border-secondary"
                        />
                      )}
                    </div>
                    <div className="flex justify-end pt-4">
                      <button type="submit" className="px-6 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all">
                        Save Template
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
