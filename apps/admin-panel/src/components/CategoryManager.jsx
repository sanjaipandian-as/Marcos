import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Layers,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Image as ImageIcon,
  Upload,
  Loader
} from 'lucide-react';
import api from '../utils/api';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [uploadingNewCatImage, setUploadingNewCatImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const list = await api.getCategories();
      setCategories(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e, setUploading, setUrl) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const uploadedUrl = await api.uploadImage(file);
      setUrl(uploadedUrl);
    } catch (err) {
      setError('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAddRoot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newCatName.trim()) return;

    try {
      await api.createCategory({
        name: newCatName.trim(),
        slug: newCatName.trim().toLowerCase().replace(/ /g, '-'),
        imageUrl: newCatImageUrl || undefined,
        order: categories.length + 1,
        parentId: null
      });
      setNewCatName('');
      setNewCatImageUrl('');
      setSuccess('Root category added successfully!');
      loadCategories();
    } catch (err) {
      setError(err.message || 'Add failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Category Console</h2>
        <p className="text-xs text-slate-500 font-medium">Create infinite N-level categories and organize your store's taxonomy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add Root Category Form (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium h-max space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            <span>Create Root Category</span>
          </h3>

          <form onSubmit={handleAddRoot} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold">
                {success}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Category Name</label>
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Men"
                className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Category Image</label>
              <div className="flex items-center gap-3">
                {newCatImageUrl ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <img src={newCatImageUrl} alt="Category" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewCatImageUrl('')}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4 text-slate-300" />
                  </div>
                )}
                
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setUploadingNewCatImage, setNewCatImageUrl)}
                    className="hidden"
                    disabled={uploadingNewCatImage}
                  />
                  <div className={`w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${uploadingNewCatImage ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {uploadingNewCatImage ? (
                      <><Loader className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" /> Upload Image</>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Add Root Category
            </button>
          </form>

          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl mt-4">
            <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5" />
              You can infinitely nest sub-categories from the list panel.
            </p>
          </div>
        </div>

        {/* Categories Tree List (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Category Hierarchy</h3>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/30">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold">
                No categories defined.
              </div>
            ) : (
              categories.map((cat, index) => (
                <CategoryNode 
                  key={cat.id} 
                  category={cat} 
                  depth={0} 
                  index={index} 
                  total={categories.length} 
                  loadCategories={loadCategories} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Recursive Component for N-Level Tree
function CategoryNode({ category, depth, index, total, loadCategories }) {
  const [expanded, setExpanded] = useState(depth === 0); // Root expanded by default
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');

  const hasChildren = category.subCategories && category.subCategories.length > 0;
  const pl = depth * 24; // Indentation calculation

  const handleStartEdit = () => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingImageUrl(category.imageUrl || '');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingEditImage(true);
      const uploadedUrl = await api.uploadImage(file);
      setEditingImageUrl(uploadedUrl);
    } catch (err) {
      alert('Image upload failed');
    } finally {
      setUploadingEditImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) return;
    try {
      await api.updateCategory(category.id, {
        name: editingName.trim(),
        slug: editingName.trim().toLowerCase().replace(/ /g, '-'),
        imageUrl: editingImageUrl || undefined,
      });
      setEditingId(null);
      loadCategories();
    } catch (err) {
      alert(err.message || 'Update failed.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${category.name}" and ALL its sub-categories recursively?`)) return;
    try {
      await api.deleteCategory(category.id);
      loadCategories();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  const handleAddSub = async (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    try {
      await api.createCategory({
        name: newSubName.trim(),
        slug: newSubName.trim().toLowerCase().replace(/ /g, '-'),
        order: category.subCategories?.length ? category.subCategories.length + 1 : 1,
        parentId: category.id
      });
      setNewSubName('');
      setIsAddingSub(false);
      setExpanded(true);
      loadCategories();
    } catch (err) {
      alert(err.message || 'Add sub-category failed.');
    }
  };

  const handleMove = async (dir) => {
    // Note: Reordering is tricky in a generic tree without passing the siblings array, 
    // but the backend reorder method accepts a flat list of ID and order. 
    // For simplicity, we can do a quick alert if not implemented for deep nodes, 
    // or just let it be. Let's omit deep reordering for now to keep it stable, or hide buttons.
    alert("Reordering in N-level tree is not fully supported from this UI button yet. Please use drag-n-drop or update order manually.");
  };

  return (
    <div className="flex flex-col border-b border-slate-100 last:border-0 bg-white">
      {/* Node Row */}
      <div 
        className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
        style={{ paddingLeft: `${pl + 16}px` }}
      >
        <div className="flex items-center gap-3">
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-1 rounded-md transition-colors ${hasChildren ? 'text-brand-500 hover:bg-brand-50' : 'text-transparent pointer-events-none'}`}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {editingId === category.id ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:border-brand-500 min-w-[200px]"
              />
              <div className="flex items-center gap-2">
                {editingImageUrl && (
                  <img src={editingImageUrl} alt="edit-cat" className="w-8 h-8 rounded-md object-cover border border-slate-200" />
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingEditImage}
                  />
                  <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-200 flex items-center gap-1">
                    {uploadingEditImage ? <Loader className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  </div>
                </label>
                <button onClick={handleSaveEdit} className="p-1.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {category.imageUrl ? (
                <img src={category.imageUrl} alt={category.name} className="w-8 h-8 rounded-lg object-cover border border-slate-100 shadow-sm" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                  <ImageIcon className="w-3 h-3 text-slate-300" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                  <span>{category.name}</span>
                  {hasChildren && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md text-[9px] font-bold" title="Subcategories count">{category.subCategories.length} sub</span>}
                  <span className="bg-brand-50 text-brand-600 border border-brand-100/80 px-1.5 py-0.5 rounded-md text-[9px] font-semibold" title="Direct / Total products count">
                    {category.directProductCount || 0} direct / {category.totalProductCount || 0} total
                  </span>
                </span>
                <span className="text-[10px] text-slate-400">/{category.slug}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsAddingSub(!isAddingSub)}
            className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600 transition-colors"
            title="Add Sub-Category"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button
            onClick={handleStartEdit}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
            title="Edit Category"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
            title="Delete Category"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add Sub Category Form Inline */}
      {isAddingSub && (
        <div className="bg-brand-50/50 p-3 border-y border-brand-100 flex items-center gap-3" style={{ paddingLeft: `${pl + 16 + 28}px` }}>
          <FolderPlus className="w-4 h-4 text-brand-400 shrink-0" />
          <form onSubmit={handleAddSub} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newSubName}
              onChange={e => setNewSubName(e.target.value)}
              placeholder={`Add nested category under ${category.name}...`}
              className="flex-1 text-xs border border-brand-200 rounded-lg py-1.5 px-3 focus:outline-none focus:border-brand-500"
            />
            <button type="submit" className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold rounded-lg transition-colors">Save</button>
            <button type="button" onClick={() => setIsAddingSub(false)} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg transition-colors">Cancel</button>
          </form>
        </div>
      )}

      {/* Children rendering */}
      {expanded && hasChildren && (
        <div className="flex flex-col relative before:absolute before:left-[27px] before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
          {category.subCategories.map((sub, idx) => (
            <CategoryNode 
              key={sub.id} 
              category={sub} 
              depth={depth + 1} 
              index={idx} 
              total={category.subCategories.length} 
              loadCategories={loadCategories} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
