import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';

export const AdminPagesBuilderPage: React.FC = () => {
  const { adminToken } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pages, setPages] = useState<any[]>([]);
  const [editingPage, setEditingPage] = useState<any>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setPages(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchPages();
    }
  }, [adminToken]);

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !editingPage) return;

    try {
      // Ensure blocks is a JSON string before sending
      const payload = {
        ...editingPage,
        blocks: typeof editingPage.blocks === 'string' ? editingPage.blocks : JSON.stringify(editingPage.blocks)
      };

      const url = editingPage.id ? `/api/pages/${editingPage.id}` : '/api/pages';
      const method = editingPage.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setEditingPage(null);
        await fetchPages();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save page');
      }
    } catch (err) {
      alert('Error saving page');
    }
  };

  const handleDeletePage = async (id: number) => {
    if (!adminToken || !confirm('Delete this page forever?')) return;
    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        await fetchPages();
        if (editingPage?.id === id) setEditingPage(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createNewPage = () => {
    setEditingPage({
      title: '',
      slug: '',
      meta_title: '',
      meta_description: '',
      blocks: [],
      is_published: true
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : ''}`}>
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6 pt-24 max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-6">
          
          {/* Pages List */}
          <div className="w-full lg:w-1/3 bg-surface-container-lowest p-6 rounded border border-surface-container h-[calc(100vh-140px)] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif text-primary">Pages</h2>
              <button onClick={createNewPage} className="text-sm bg-primary text-white px-3 py-1.5 rounded hover:bg-neutral-800 transition">New Page</button>
            </div>
            <ul className="space-y-2">
              {pages.map(p => (
                <li key={p.id} className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingPage({ ...p, blocks: typeof p.blocks === 'string' ? JSON.parse(p.blocks) : p.blocks || [] })}
                    className={`flex-1 text-left p-3 rounded border transition ${editingPage?.id === p.id ? 'bg-primary text-secondary-gold border-secondary-gold font-bold' : 'hover:bg-surface-container-low text-on-surface border-transparent'}`}
                  >
                    {p.title}
                    <span className="block text-xs font-normal opacity-70">/{p.slug}</span>
                  </button>
                  <button onClick={() => handleDeletePage(p.id)} className="text-red-500 p-2 hover:bg-red-50 rounded">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </li>
              ))}
              {pages.length === 0 && (
                <div className="text-center py-8 text-sm text-on-surface-variant">No custom pages created yet.</div>
              )}
            </ul>
          </div>

          {/* Page Editor */}
          <div className="w-full lg:w-2/3 bg-surface-container-lowest p-6 rounded border border-surface-container h-[calc(100vh-140px)] overflow-y-auto">
            {editingPage ? (
              <form onSubmit={handleSavePage} className="space-y-5">
                <div className="flex justify-between items-center mb-2 pb-4 border-b border-surface-container">
                  <h2 className="text-xl font-serif text-primary">{editingPage.id ? 'Edit Page' : 'Create New Page'}</h2>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditingPage(null)} className="px-4 py-2 text-sm text-on-surface hover:bg-surface-container rounded">Cancel</button>
                    <button type="submit" className="px-5 py-2 text-sm bg-primary text-secondary-gold font-semibold rounded hover:bg-neutral-900 transition">Save Page</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1">Page Title</label>
                    <input 
                      type="text" required
                      value={editingPage.title}
                      onChange={e => setEditingPage({...editingPage, title: e.target.value})}
                      className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm outline-none focus:border-secondary" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1">URL Slug</label>
                    <input 
                      type="text" required
                      value={editingPage.slug}
                      onChange={e => setEditingPage({...editingPage, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})}
                      placeholder="e.g. about-us"
                      className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm outline-none focus:border-secondary" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1">SEO Meta Title</label>
                    <input 
                      type="text"
                      value={editingPage.meta_title || ''}
                      onChange={e => setEditingPage({...editingPage, meta_title: e.target.value})}
                      className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm outline-none focus:border-secondary" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1">Published Status</label>
                    <select 
                      value={editingPage.is_published ? '1' : '0'}
                      onChange={e => setEditingPage({...editingPage, is_published: e.target.value === '1'})}
                      className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm outline-none focus:border-secondary"
                    >
                      <option value="1">Published (Visible)</option>
                      <option value="0">Draft (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1">SEO Meta Description</label>
                  <textarea 
                    rows={2}
                    value={editingPage.meta_description || ''}
                    onChange={e => setEditingPage({...editingPage, meta_description: e.target.value})}
                    className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm outline-none focus:border-secondary" 
                  />
                </div>
                
                {/* Simplified Blocks editor just using a big JSON textarea for now for brevity, 
                    since a full drag-and-drop Gutenberg clone is beyond a single component's scope */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1 mt-4">Page Content (Blocks JSON)</label>
                  <p className="text-xs text-on-surface-variant mb-2">For v1, enter block data in JSON array format.</p>
                  <textarea 
                    rows={12}
                    value={typeof editingPage.blocks === 'string' ? editingPage.blocks : JSON.stringify(editingPage.blocks, null, 2)}
                    onChange={e => {
                       try {
                         const parsed = JSON.parse(e.target.value);
                         setEditingPage({...editingPage, blocks: parsed});
                       } catch {
                         setEditingPage({...editingPage, blocks: e.target.value});
                       }
                    }}
                    className="w-full px-4 py-3 bg-neutral-900 text-emerald-400 font-mono text-sm border border-neutral-700 rounded outline-none" 
                  />
                </div>

              </form>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant">
                Select a page to edit or create a new one.
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};
