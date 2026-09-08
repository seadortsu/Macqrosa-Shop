import React, { useEffect, useState } from 'react';
import { Product } from '../../types';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'Skincare',
    discipline: 'Skincare',
    price: 195,
    compareAtPrice: '',
    stock: 25,
    volume: '50 ml / 1.7 fl. oz.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtWSnePUN2J9jOyuNAbWYmze1a_u1s1Ho1ZjaCa71ZxzDk3d4LZfuPXyZZgHQGkJDreFrYo2y1YHE1aXJRep4rEILl7aQA-Cqu803quIb75M0akh9qkuzYb6f5T9zJwIRFS1JJ8l-1rYa_I1OhHNgxkyqslwY3R1fob_bG408pPy19UF3r6wTwxzwzCAINbgK8iaER0NqxhGyMb8eMyNBjk4kT8_qbpy4EFIlb57ojKK84cZkjJTd7cw',
    description: '',
    benefits: '',
    ingredients: '',
    isFeatured: true,
    isBestseller: false
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        if (data.length > 0 && !selectedProduct) {
          setSelectedProduct(data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDynamicCategories(data.map((c: any) => c.name));
        }
      })
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      subtitle: '',
      category: 'Skincare',
      discipline: 'Skincare',
      price: 195,
      compareAtPrice: '',
      stock: 25,
      volume: '50 ml / 1.7 fl. oz.',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtWSnePUN2J9jOyuNAbWYmze1a_u1s1Ho1ZjaCa71ZxzDk3d4LZfuPXyZZgHQGkJDreFrYo2y1YHE1aXJRep4rEILl7aQA-Cqu803quIb75M0akh9qkuzYb6f5T9zJwIRFS1JJ8l-1rYa_I1OhHNgxkyqslwY3R1fob_bG408pPy19UF3r6wTwxzwzCAINbgK8iaER0NqxhGyMb8eMyNBjk4kT8_qbpy4EFIlb57ojKK84cZkjJTd7cw',
      description: '',
      benefits: '',
      ingredients: '',
      isFeatured: true,
      isBestseller: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      title: p.title,
      subtitle: p.subtitle || '',
      category: p.category,
      discipline: p.discipline || p.category,
      price: p.price,
      compareAtPrice: p.compare_at_price ? p.compare_at_price.toString() : '',
      stock: p.stock,
      volume: p.volume || '50 ml / 1.7 fl. oz.',
      image_url: p.image_url,
      description: p.description,
      benefits: p.benefits || '',
      ingredients: p.ingredients || '',
      isFeatured: p.is_featured === 1,
      isBestseller: p.is_bestseller === 1
    });
    setIsModalOpen(true);
  };

  const handleQuickStockAdjust = async (productId: number, adjustment: number) => {
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          adjustment,
          reason: 'Salon Drawer Adjustment'
        })
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + adjustment) } : p))
        );
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(prev =>
            prev ? { ...prev, stock: Math.max(0, prev.stock + adjustment) } : null
          );
        }
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('mq_admin_token');

    const url = editingProduct
      ? `/api/products/admin/${editingProduct.id}`
      : '/api/products/admin/create';

    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price.toString()),
          stock: parseInt(formData.stock.toString()),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
          isFeatured: formData.isFeatured ? 1 : 0,
          isBestseller: formData.isBestseller ? 1 : 0
        })
      });

      if (res.ok) {
        setActionMessage(editingProduct ? 'Formulation updated.' : 'Formulation created.');
        setTimeout(() => setActionMessage(''), 3000);
        setIsModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      console.error('Product save error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch(`/api/products/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setDeleteConfirmId(null);
        setActionMessage('Formulation removed from catalog.');
        setTimeout(() => setActionMessage(''), 3000);
        if (selectedProduct?.id === id) {
          setSelectedProduct(null);
        }
        fetchProducts();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Filtered by Category
  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'All') return true;
    return p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-72 transition-all duration-300">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onSearch={setSearch} searchValue={search} searchPlaceholder="Search products by title or SKU..." />

        <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-16">
          {/* Header Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between py-6 gap-4 border-b border-surface-container/80 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-secondary">
                <span className="text-[10px] uppercase tracking-[0.24em] font-bold">Catalog Operations</span>
              </div>
              <h1 className="font-serif text-3xl font-normal text-primary tracking-tight">
                Product &amp; Formulation Management
              </h1>
              <p className="text-xs text-on-surface-variant font-light mt-1">
                Curate prices, volume measures, stock quantities, and sensory formulations. Real-time sync with storefront.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-all shadow-sm shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create Formulation</span>
            </button>
          </div>

          {actionMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Metric Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-secondary/15 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold block">
                  Active Formulations
                </span>
                <span className="font-serif text-3xl font-medium text-primary mt-1 block">
                  {products.length}
                </span>
                <span className="text-xs text-outline font-light">Across 5 Atelier disciplines</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">category</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-secondary/15 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold block">
                  Avg. Gross Margin
                </span>
                <span className="font-serif text-3xl font-medium text-primary mt-1 block">
                  87.5%
                </span>
                <span className="text-xs text-secondary font-medium">+1.2% this quarter</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">trending_up</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-secondary/15 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold block">
                  Total Units On-Hand
                </span>
                <span className="font-serif text-3xl font-medium text-primary mt-1 block">
                  {totalUnits.toLocaleString()}
                </span>
                <span className="text-xs text-outline font-light">All vault reserves</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">warehouse</span>
              </div>
            </div>
          </div>

          {/* Primary Work Area: Split Table + Right Inspection Drawer */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Left 8-Column Table Panel */}
            <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-secondary/15 overflow-hidden">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-2 px-6 pt-5 overflow-x-auto border-b border-surface-container/60 pb-3">
                {['All', ...dynamicCategories].map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all shrink-0 ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-container-low/70 text-on-surface-variant text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">Artwork</th>
                      <th className="py-3 px-3">Title &amp; SKU</th>
                      <th className="py-3 px-3">Discipline</th>
                      <th className="py-3 px-3 text-right">Retail</th>
                      <th className="py-3 px-3 text-right">Stock</th>
                      <th className="py-3 px-3">Health</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-on-surface-variant font-serif">
                          Loading formulation catalog...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-on-surface-variant font-serif">
                          No matching formulations located.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => {
                        const isSelected = selectedProduct?.id === p.id;
                        const isLowStock = p.stock <= 10;
                        const isOutStock = p.stock === 0;

                        return (
                          <tr
                            key={p.id}
                            onClick={() => setSelectedProduct(p)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-secondary-fixed/15 border-l-2 border-secondary'
                                : 'hover:bg-surface-container-low/50'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <img
                                src={p.image_url}
                                alt={p.title}
                                className="w-10 h-10 rounded-md object-cover border border-secondary/15 shrink-0"
                              />
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-primary">{p.title}</span>
                                <span className="text-[10px] uppercase font-mono text-outline">
                                  MQ-SKN-0{p.id}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] uppercase font-medium text-on-surface">
                                {p.category}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-serif font-bold text-primary">
                              ${p.price.toFixed(2)}
                            </td>

                            <td className="py-3 px-3 text-right font-medium text-on-surface">
                              {p.stock}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold ${
                                  isOutStock
                                    ? 'bg-red-100 text-red-800'
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOutStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                />
                                {isOutStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Healthy'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditModal(p)}
                                  className="p-1 rounded text-outline hover:text-primary transition-colors"
                                  title="Edit Formulation"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(p.id)}
                                  className="p-1 rounded text-outline hover:text-red-600 transition-colors"
                                  title="Delete Formulation"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 4-Column Live Inspection Drawer */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              {selectedProduct ? (
                <div className="bg-surface-container-lowest rounded-xl shadow-md border border-secondary/15 p-6 flex flex-col gap-5 sticky top-28">
                  {/* Artwork & Title */}
                  <div className="flex items-start gap-4">
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.title}
                      className="w-20 h-20 rounded-lg object-cover border border-secondary/20 shadow-sm shrink-0"
                    />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block">
                        MQ-SKN-0{selectedProduct.id} • {selectedProduct.category}
                      </span>
                      <h3 className="font-serif text-lg font-medium text-primary leading-tight mt-0.5">
                        {selectedProduct.title}
                      </h3>
                      <span className="font-serif text-xl font-bold text-primary block mt-1">
                        ${selectedProduct.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Stock Quick Adjustment */}
                  <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between border border-secondary/10">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-outline block">
                        On-Hand Inventory
                      </span>
                      <span className="font-serif text-2xl font-bold text-primary">
                        {selectedProduct.stock} units
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-secondary/20">
                      <button
                        type="button"
                        onClick={() => handleQuickStockAdjust(selectedProduct.id, -5)}
                        className="w-8 h-8 rounded flex items-center justify-center font-bold text-primary hover:bg-surface-container text-sm"
                        title="Deduct 5 units"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStockAdjust(selectedProduct.id, 5)}
                        className="w-8 h-8 rounded flex items-center justify-center font-bold text-primary hover:bg-surface-container text-sm"
                        title="Replenish 5 units"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Financial Margins */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="text-[10px] uppercase text-outline block">Estimated Cost</span>
                      <span className="font-medium text-primary text-sm">$28.00</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="text-[10px] uppercase text-outline block">Gross Margin</span>
                      <span className="font-medium text-secondary text-sm font-semibold">87.5%</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-outline block mb-1">
                      Sensory Dossier
                    </span>
                    <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>

                  {/* Edit action */}
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedProduct)}
                    className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Edit Formulation Dossier</span>
                  </button>
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-outline border border-secondary/15 font-serif text-sm">
                  Select a formulation to inspect inventory metrics and dossiers.
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest rounded-xl p-6 max-w-sm w-full border border-secondary/20 shadow-gold-lg">
                <h3 className="font-serif text-lg text-primary mb-2">Delete Formulation?</h3>
                <p className="text-xs text-on-surface-variant mb-6 font-light leading-relaxed">
                  This action will permanently erase the product from both the storefront and admin catalog.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 rounded text-xs uppercase tracking-wider text-outline hover:text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmId)}
                    className="bg-red-600 text-white px-5 py-2 rounded text-xs uppercase tracking-widest font-semibold hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add / Edit Drawer Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest border border-secondary/30 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-gold-lg animate-in fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container mb-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                      FORMULATION EDITOR
                    </span>
                    <h3 className="font-serif text-2xl text-primary font-normal">
                      {editingProduct ? 'Edit Formulation' : 'Create Masterwork Formulation'}
                    </h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-1 text-outline hover:text-primary">
                    <span className="material-symbols-outlined text-[22px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                        Formulation Title
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3.5 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                        Discipline / Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={e =>
                          setFormData({ ...formData, category: e.target.value, discipline: e.target.value })
                        }
                        className="w-full px-3.5 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary cursor-pointer"
                      >
                        {dynamicCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                        Price (USD $)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                        Stock Units
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                        Volume
                      </label>
                      <input
                        type="text"
                        value={formData.volume}
                        onChange={e => setFormData({ ...formData, volume: e.target.value })}
                        className="w-full px-3.5 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                      Artwork Imagery URL
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                      Sensory Description
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-4 h-4 accent-primary"
                      />
                      <span>Feature on Flagship Homepage</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formData.isBestseller}
                        onChange={e => setFormData({ ...formData, isBestseller: e.target.checked })}
                        className="w-4 h-4 accent-secondary-gold"
                      />
                      <span>Mark as Maison Icon / Bestseller</span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-surface-container">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded text-xs uppercase tracking-wider text-outline hover:text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary text-on-primary px-6 py-2.5 rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      {editingProduct ? 'Save Changes' : 'Publish Formulation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
