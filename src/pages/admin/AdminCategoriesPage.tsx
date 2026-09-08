import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  product_count?: number;
}

export const AdminCategoriesPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('mq_admin_token');
      const res = await fetch('/api/categories/admin/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat: Category | null = null) => {
    setEditingCategory(cat ? { ...cat } : { name: '', description: '', image_url: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    const token = localStorage.getItem('mq_admin_token');
    const isNew = !editingCategory.id;
    const url = isNew ? '/api/categories/admin' : `/api/categories/admin/${editingCategory.id}`;
    
    try {
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingCategory)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.product_count && cat.product_count > 0) {
      alert(`Cannot delete ${cat.name} as it has ${cat.product_count} products.`);
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${cat.name}?`)) return;
    
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch(`/api/categories/admin/${cat.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-72 transition-all duration-300">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} searchValue="" onSearch={() => {}} />

        <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">Catalog</span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-gold" />
                <span className="text-[10px] uppercase tracking-wider text-outline">Organization</span>
              </div>
              <h1 className="font-serif text-3xl text-primary font-normal">Categories</h1>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-primary text-secondary-gold text-[11px] uppercase tracking-wider font-semibold rounded hover:bg-black transition-all shadow-sm"
            >
              + New Category
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-container text-[10px] uppercase tracking-wider text-outline">
                  <th className="px-6 py-4 font-semibold w-16">Image</th>
                  <th className="px-6 py-4 font-semibold">Name & Slug</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Description</th>
                  <th className="px-6 py-4 font-semibold">Products</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant font-serif">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded bg-surface-container-low overflow-hidden">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center material-symbols-outlined text-outline">image</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-primary text-sm">{cat.name}</div>
                      <div className="text-[10px] text-outline font-mono mt-1">{cat.slug}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-xs text-on-surface-variant">
                      {cat.description || <span className="text-outline italic">No description</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-surface-container-low text-xs font-mono text-primary font-bold">
                        {cat.product_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => handleOpenModal(cat)} className="text-[10px] uppercase font-bold text-primary hover:text-secondary-gold">Edit</button>
                      <button onClick={() => handleDelete(cat)} className="text-[10px] uppercase font-bold text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-xl w-full max-w-lg shadow-2xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-outline hover:text-primary">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <h2 className="font-serif text-2xl text-primary font-medium mb-6">
              {editingCategory.id ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingCategory.description || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingCategory.image_url || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary font-mono text-xs"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-surface-container text-primary text-[11px] uppercase tracking-wider font-semibold rounded hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-secondary-gold text-[11px] uppercase tracking-wider font-semibold rounded hover:bg-black transition-all"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
