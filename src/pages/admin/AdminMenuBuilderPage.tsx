import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';

export const AdminMenuBuilderPage: React.FC = () => {
  const { adminToken } = useAuth();
  const { refreshSettings } = useStoreSettings();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menus, setMenus] = useState<any[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menus', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setMenus(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenuDetails = async (handle: string) => {
    try {
      const res = await fetch(`/api/menus/${handle}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setSelectedMenu(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchMenus();
    }
  }, [adminToken]);

  const handleCreateMenu = async () => {
    const title = prompt('Enter menu title (e.g. Footer Menu):');
    if (!title || !adminToken) return;
    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ handle, title })
      });
      if (res.ok) {
        await fetchMenus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async () => {
    if (!selectedMenu || !adminToken) return;
    const title = prompt('Link Title (e.g. About Us):');
    const url = prompt('URL (e.g. /about):');
    if (!title || !url) return;

    const newItem = {
      menu_id: selectedMenu.id,
      title,
      url,
      parent_id: null,
      sort_order: selectedMenu.items ? selectedMenu.items.length : 0
    };

    try {
      const res = await fetch('/api/menus/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        await fetchMenuDetails(selectedMenu.handle);
        refreshSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!adminToken || !confirm('Remove this link?')) return;
    try {
      const res = await fetch(`/api/menus/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        await fetchMenuDetails(selectedMenu.handle);
        refreshSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLocation = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedMenu || !adminToken) return;
    const newLocation = e.target.value;
    try {
      const res = await fetch(`/api/menus/${selectedMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: selectedMenu.name, handle: selectedMenu.handle, location: newLocation || null })
      });
      if (res.ok) {
        await fetchMenuDetails(selectedMenu.handle);
        await fetchMenus(); // Update list
        refreshSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleItemVisibility = async (item: any, field: string, value: boolean) => {
    if (!adminToken) return;
    try {
      const payload = {
        ...item,
        [field]: value ? 1 : 0
      };
      const res = await fetch(`/api/menus/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchMenuDetails(selectedMenu.handle);
        refreshSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : ''}`}>
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6 pt-24 max-w-[1440px] mx-auto flex flex-col md:flex-row gap-6">
          
          <div className="w-full md:w-1/3 bg-surface-container-lowest p-6 rounded border border-surface-container">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-serif text-primary">Menus</h2>
              <button onClick={handleCreateMenu} className="text-sm bg-primary text-white px-3 py-1 rounded">Add Menu</button>
            </div>
            <ul>
              {menus.map(m => (
                <li key={m.id} className="mb-2">
                  <button 
                    onClick={() => fetchMenuDetails(m.handle)}
                    className={`w-full text-left p-3 rounded border transition ${selectedMenu?.id === m.id ? 'bg-primary text-secondary-gold border-secondary-gold font-bold' : 'hover:bg-surface-container-low text-on-surface border-transparent'}`}
                  >
                    {m.name || m.title} <span className="text-xs opacity-70 block font-normal">{m.handle} {m.location ? `(${m.location})` : ''}</span>
                  </button>
                </li>
              ))}
              {menus.length === 0 && (
                <div className="text-center py-4 text-sm text-on-surface-variant">No menus found.</div>
              )}
            </ul>
          </div>

          <div className="w-full md:w-2/3 bg-surface-container-lowest p-6 rounded border border-surface-container">
            {selectedMenu ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-serif text-primary">{selectedMenu.name || selectedMenu.title} Items</h2>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-on-surface-variant font-medium">Assigned Location:</label>
                      <select 
                        value={selectedMenu.location || ''} 
                        onChange={handleUpdateLocation}
                        className="text-xs bg-surface-container border border-surface-container-high rounded px-2 py-1 outline-none text-primary"
                      >
                        <option value="">None</option>
                        <option value="header">Primary Header</option>
                        <option value="footer">Footer Menu</option>
                        <option value="mobile_drawer">Mobile Drawer</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleAddItem} className="text-sm bg-primary text-white px-4 py-2 rounded">Add Link</button>
                </div>
                <div className="space-y-3">
                  {selectedMenu.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-surface-container-low p-4 rounded border border-surface-container">
                      <div className="flex-1">
                        <div className="font-medium text-primary">{item.label || item.title}</div>
                        <div className="text-sm text-on-surface-variant">{item.url}</div>
                      </div>
                      
                      <div className="flex items-center gap-4 mr-6">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={item.show_desktop !== 0} onChange={(e) => handleToggleItemVisibility(item, 'show_desktop', e.target.checked)} className="rounded text-primary" />
                          <span className="text-[11px] text-on-surface font-medium uppercase tracking-wider">Desktop</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={item.show_tablet !== 0} onChange={(e) => handleToggleItemVisibility(item, 'show_tablet', e.target.checked)} className="rounded text-primary" />
                          <span className="text-[11px] text-on-surface font-medium uppercase tracking-wider">Tablet</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={item.show_mobile !== 0} onChange={(e) => handleToggleItemVisibility(item, 'show_mobile', e.target.checked)} className="rounded text-primary" />
                          <span className="text-[11px] text-on-surface font-medium uppercase tracking-wider">Mobile</span>
                        </label>
                      </div>

                      <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 p-2">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                  {(!selectedMenu.items || selectedMenu.items.length === 0) && (
                    <div className="text-center py-12 text-on-surface-variant border border-dashed border-surface-container rounded">No links in this menu. Add one above.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant">
                Select a menu to edit its links
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};
