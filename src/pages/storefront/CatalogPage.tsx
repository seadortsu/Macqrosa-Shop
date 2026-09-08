import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { ProductImage } from '../../components/common/ProductImage';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridColumns, setGridColumns] = useState<3 | 4>(4);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ label: string, value: string, count?: number }[]>([
    { label: 'All Formulations', value: 'all' }
  ]);

  // Filter & Search states
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(currentCategory);
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [maxPrice, setMaxPrice] = useState<number>(600);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [certifiedPureOnly, setCertifiedPureOnly] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<string>('all');
  const [sortBy, setSortBy] = useState('curated');

  // Accordion open/close state
  const [categoryAccordion, setCategoryAccordion] = useState(true);
  const [concernAccordion, setConcernAccordion] = useState(true);
  const [priceAccordion, setPriceAccordion] = useState(true);

  useEffect(() => {
    setSelectedDiscipline(searchParams.get('category') || 'all');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedDiscipline && selectedDiscipline !== 'all') {
      params.set('discipline', selectedDiscipline);
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (maxPrice < 600) {
      params.set('maxPrice', maxPrice.toString());
    }
    if (inStockOnly) {
      params.set('inStock', 'true');
    }
    if (sortBy === 'price_asc') {
      params.set('sort', 'price_asc');
    } else if (sortBy === 'price_desc') {
      params.set('sort', 'price_desc');
    } else if (sortBy === 'rating') {
      params.set('sort', 'rating');
    } else {
      params.set('sort', 'bestseller');
    }

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then((data: Product[]) => {
        let filtered = data;
        if (certifiedPureOnly) {
          filtered = filtered.filter(p => p.price >= 100);
        }
        if (selectedConcern !== 'all') {
          filtered = filtered.filter(p =>
            p.description.toLowerCase().includes(selectedConcern.toLowerCase()) ||
            p.title.toLowerCase().includes(selectedConcern.toLowerCase())
          );
        }
        setProducts(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setLoading(false);
      });

      fetch('/api/categories/summary')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const dynamicList = [
              { label: 'All Formulations', value: 'all', count: data.reduce((acc, cat) => acc + (cat.product_count || 0), 0) },
              ...data.map(c => ({ label: c.name, value: c.name, count: c.product_count }))
            ];
            setCategoriesList(dynamicList);
          }
        })
        .catch(err => console.error('Failed to load categories summary:', err));
    }, [searchParams, selectedDiscipline, searchQuery, maxPrice, inStockOnly, certifiedPureOnly, selectedConcern, sortBy]);

  const handleCategorySelect = (category: string) => {
    setSelectedDiscipline(category);
    if (category === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const handleResetFilters = () => {
    setSelectedDiscipline('all');
    setSearchQuery('');
    setMaxPrice(600);
    setInStockOnly(false);
    setCertifiedPureOnly(false);
    setSelectedConcern('all');
    setSortBy('curated');
    searchParams.delete('category');
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  const toggleWishlist = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };



  const concernsList = [
    { label: 'All Benefits', value: 'all' },
    { label: 'Luminous Radiance', value: 'radiance' },
    { label: 'Cellular Renewal', value: 'cellular' },
    { label: 'Micro-Peptide Lift', value: 'peptide' },
    { label: 'Barrier Fortification', value: 'gold' },
  ];

  return (
    <div className="w-full">
      {/* Editorial Sub-Header Banner */}
      <section className="w-full bg-surface-container-lowest border-b border-secondary/15 py-12 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-[1.5px] bg-secondary" />
            <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">
              The Catalog • Haute Parfumerie &amp; Cosmétiques
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-primary font-normal tracking-tight">
            {selectedDiscipline === 'all' ? 'The Complete Atelier Masterpieces' : selectedDiscipline}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-light mt-2 max-w-2xl leading-relaxed">
            Purity-certified French phyto-chemical formulations harmonized with bio-active 24-karat colloidal gold, botanical extracts of Grasse, and alpine polyphenols.
          </p>
        </div>
      </section>

      {/* Refine Criteria & Sort Toolbar */}
      <div className="bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-container sticky top-28 z-30 py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Active Counters */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
              Displaying <strong className="text-primary font-semibold">{products.length}</strong> Masterpieces
            </span>
            {(selectedDiscipline !== 'all' || searchQuery || maxPrice < 600 || inStockOnly || certifiedPureOnly || selectedConcern !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] uppercase tracking-wider text-secondary font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Reset Refinements
              </button>
            )}
          </div>

          {/* Right: Sort & Layout Density */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Sort Selector */}
            <div className="relative flex items-center gap-2">
              <label htmlFor="catalogSort" className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium hidden sm:inline">
                Arrange By:
              </label>
              <div className="relative">
                <select
                  id="catalogSort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-surface-container-low text-primary text-[11px] uppercase tracking-wider pl-3 pr-8 py-1.5 rounded outline-none cursor-pointer border border-secondary/15 hover:border-secondary/30 transition-colors font-medium"
                >
                  <option value="curated">Curated by Maison</option>
                  <option value="bestseller">Bestsellers First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Patron Rating</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </div>

            {/* View Density Switcher (3 cols vs 4 cols) */}
            <div className="hidden md:flex items-center bg-surface-container-low p-0.5 rounded border border-secondary/10">
              <button
                type="button"
                onClick={() => setGridColumns(3)}
                className={`p-1 rounded transition-colors ${
                  gridColumns === 3 ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
                }`}
                title="Editorial 3-Column Grid"
              >
                <span className="material-symbols-outlined text-[18px] block">view_column</span>
              </button>
              <button
                type="button"
                onClick={() => setGridColumns(4)}
                className={`p-1 rounded transition-colors ${
                  gridColumns === 4 ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
                }`}
                title="Detail 4-Column Grid"
              >
                <span className="material-symbols-outlined text-[18px] block">grid_view</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace: Haute Accordion Sidebar + Product Grid */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 flex flex-col lg:flex-row gap-8 items-start">
        {/* Filter Sidebar (Haute Accordion) */}
        <aside className="w-full lg:w-72 shrink-0 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-secondary/15 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">filter_vintage</span>
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Filter Formulations
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] uppercase tracking-wider text-secondary hover:underline font-medium"
            >
              Reset
            </button>
          </div>

          {/* Search within catalog */}
          <div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[17px]">
                search
              </span>
              <input
                type="text"
                placeholder="Filter keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded text-xs text-on-surface outline-none border border-secondary/15 focus:border-secondary transition-colors"
              />
            </div>
          </div>

          {/* Group 1: Disciplines / Category Accordion */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setCategoryAccordion(!categoryAccordion)}
              className="w-full flex items-center justify-between py-1 text-left"
            >
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Discipline
              </span>
              <span
                className={`material-symbols-outlined text-[18px] text-on-surface-variant transform transition-transform ${
                  categoryAccordion ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {categoryAccordion && (
              <div className="space-y-2 pt-1">
                {categoriesList.map(cat => {
                  const isChecked = selectedDiscipline === cat.value;
                  return (
                    <label
                      key={cat.value}
                      onClick={() => handleCategorySelect(cat.value)}
                      className="flex items-center justify-between cursor-pointer group py-1"
                    >
                      <span className={`flex items-center gap-2 text-xs transition-colors ${isChecked ? 'text-primary font-semibold' : 'text-on-surface-variant group-hover:text-primary'}`}>
                        <input
                          type="radio"
                          name="discipline"
                          checked={isChecked}
                          onChange={() => handleCategorySelect(cat.value)}
                          className="w-3.5 h-3.5 accent-primary cursor-pointer"
                        />
                        {cat.label}
                      </span>
                      <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded-full font-medium transition-colors ${
                        isChecked
                          ? 'bg-secondary text-white font-semibold'
                          : 'bg-surface-container text-on-surface-variant group-hover:bg-secondary-fixed/40 group-hover:text-primary'
                      }`}>
                        {cat.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-px bg-surface-container w-full" />

          {/* Group 2: Skin Concern Accordion */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setConcernAccordion(!concernAccordion)}
              className="w-full flex items-center justify-between py-1 text-left"
            >
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Skin Concern &amp; Virtues
              </span>
              <span
                className={`material-symbols-outlined text-[18px] text-on-surface-variant transform transition-transform ${
                  concernAccordion ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {concernAccordion && (
              <div className="space-y-2 pt-1">
                {concernsList.map(concern => {
                  const isSelected = selectedConcern === concern.value;
                  return (
                    <label
                      key={concern.value}
                      onClick={() => setSelectedConcern(concern.value)}
                      className="flex items-center justify-between cursor-pointer group py-1"
                    >
                      <span className={`flex items-center gap-2 text-xs transition-colors ${isSelected ? 'text-primary font-semibold' : 'text-on-surface-variant group-hover:text-primary'}`}>
                        <input
                          type="radio"
                          name="concern"
                          checked={isSelected}
                          onChange={() => setSelectedConcern(concern.value)}
                          className="w-3.5 h-3.5 accent-primary cursor-pointer"
                        />
                        {concern.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-px bg-surface-container w-full" />

          {/* Group 3: Price Range Accordion */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setPriceAccordion(!priceAccordion)}
              className="w-full flex items-center justify-between py-1 text-left"
            >
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Investment (Max: ${maxPrice})
              </span>
              <span
                className={`material-symbols-outlined text-[18px] text-on-surface-variant transform transition-transform ${
                  priceAccordion ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {priceAccordion && (
              <div className="pt-2">
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="25"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] uppercase font-mono text-outline mt-1.5">
                  <span>$50</span>
                  <span>$300</span>
                  <span>$600+</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-surface-container w-full" />

          {/* Toggles */}
          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-on-surface font-medium">In-Stock Only</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-on-surface font-medium">24K Gold Suspensions</span>
              <input
                type="checkbox"
                checked={certifiedPureOnly}
                onChange={(e) => setCertifiedPureOnly(e.target.checked)}
                className="w-4 h-4 accent-secondary-gold cursor-pointer"
              />
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-1 w-full">
          {loading ? (
            <div className="py-32 text-center text-on-surface-variant font-serif text-xl">
              Curating catalog formulation gallery...
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center bg-surface-container-lowest rounded-xl p-8 border border-secondary/15">
              <span className="material-symbols-outlined text-secondary text-[48px] mb-3">spa</span>
              <h3 className="font-serif text-2xl text-primary mb-2">No Matching Formulations Found</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-6">
                We could not locate any formulations matching your active criteria. Try broadening your price range or clearing keyword refinements.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-primary text-on-primary px-6 py-2.5 rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Reset All Criteria
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                gridColumns === 3
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {products.map((product, idx) => {
                const isWishlisted = wishlist.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="group bg-surface-container-lowest rounded-lg p-3.5 shadow-sm hover:shadow-gold-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-secondary/10"
                  >
                    {/* Image Viewport */}
                    <div
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="relative w-full aspect-[4/5] bg-surface-container-low rounded overflow-hidden mb-3.5 cursor-pointer"
                    >
                      <ProductImage
                        src={product.image_url}
                        alt={product.title}
                        fallbackTitle={product.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                      />

                      {/* Floating Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
                        {product.is_bestseller === 1 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-sans text-[9.5px] uppercase tracking-wider font-semibold shadow-xs border border-secondary/20">
                            Icon
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-primary font-sans text-[9.5px] uppercase tracking-wider font-medium border border-secondary/15">
                          Atelier Formula
                        </span>
                      </div>

                      {/* Wishlist Heart */}
                      <button
                        onClick={(e) => toggleWishlist(product.id, e)}
                        aria-label="Add to wishlist"
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/85 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:text-red-500 transition-colors shadow-sm z-10"
                      >
                        <span
                          className={`material-symbols-outlined text-[17px] ${
                            isWishlisted ? 'text-red-500 material-symbols-filled' : ''
                          }`}
                        >
                          favorite
                        </span>
                      </button>

                      {/* Slide-Up "Acquire" Button */}
                      <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(product, 1);
                          }}
                          className="w-full bg-primary/95 hover:bg-secondary text-white py-2.5 rounded-full font-sans text-[11px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg border border-secondary/30 hover:shadow-gold-md"
                        >
                          <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                          <span>Acquire • ${product.price.toFixed(0)}</span>
                        </button>
                      </div>
                    </div>

                    {/* Information */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-1.5 text-secondary">
                          <span
                            className="material-symbols-outlined text-[14px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span
                            className="material-symbols-outlined text-[14px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span
                            className="material-symbols-outlined text-[14px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span
                            className="material-symbols-outlined text-[14px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span
                            className="material-symbols-outlined text-[14px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span className="text-[11px] text-on-surface-variant ml-1 font-medium">
                            {product.rating} ({product.reviews_count})
                          </span>
                        </div>

                        <h3
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="font-serif text-base font-medium text-primary hover:text-secondary transition-colors cursor-pointer mb-1 leading-snug"
                        >
                          {product.title}
                        </h3>

                        <p className="text-xs text-on-surface-variant font-light line-clamp-2 mb-3 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      {/* Price & Finish Swatches */}
                      <div className="pt-2.5 border-t border-surface-container flex items-center justify-between">
                        <span className="font-serif text-lg font-medium text-primary">
                          ${product.price.toFixed(2)}
                        </span>

                        <div className="flex items-center gap-1.5" title="Available Finishes">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#E5C158] ring-1 ring-offset-1 ring-primary" />
                          <span className="w-3.5 h-3.5 rounded-full bg-[#D49E74]" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
