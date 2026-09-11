import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';

export const AdminMediaLibraryPage: React.FC = () => {
  const { adminToken } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [media, setMedia] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/upload/media', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      }
    } catch (err) {
      console.error('Failed to fetch media', err);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchMedia();
    }
  }, [adminToken]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !adminToken) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('alt_text', file.name); // Default alt text

    setIsUploading(true);
    try {
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData
      });
      if (res.ok) {
        await fetchMedia();
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      alert('Network error during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!adminToken || !confirm('Delete this image?')) return;
    try {
      const res = await fetch(`/api/upload/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        await fetchMedia();
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
        <main className="p-6 pt-24 max-w-[1440px] mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-serif text-primary">Media Library</h1>
            <label className="bg-primary text-white px-4 py-2 rounded cursor-pointer hover:bg-neutral-800 transition">
              {isUploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <div key={item.id} className="relative group rounded border bg-surface-container-low overflow-hidden">
                <img src={item.file_path} alt={item.alt_text} className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                   <button 
                     onClick={() => {
                       navigator.clipboard.writeText(item.file_path);
                       alert('URL Copied to clipboard!');
                     }} 
                     className="bg-secondary text-primary p-2 rounded-full hover:bg-secondary-gold"
                     title="Copy URL"
                   >
                     <span className="material-symbols-outlined text-[18px]">content_copy</span>
                   </button>
                   <button onClick={() => handleDelete(item.id)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700" title="Delete">
                     <span className="material-symbols-outlined text-[18px]">delete</span>
                   </button>
                </div>
                <div className="p-2 text-xs text-on-surface truncate" title={item.file_name}>
                  {item.file_name}
                </div>
              </div>
            ))}
            {media.length === 0 && (
              <div className="col-span-full py-10 text-center text-on-surface-variant">
                No media uploaded yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
