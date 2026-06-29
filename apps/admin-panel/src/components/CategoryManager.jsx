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
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const [uploadingEditCatImage, setUploadingEditCatImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sub-category state
  const [expandedCat, setExpandedCat] = useState(null);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [editingSubId, setEditingSubId] = useState(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [subError, setSubError] = useState('');
  const [subSuccess, setSubSuccess] = useState('');
  const [newSubCatImageUrl, setNewSubCatImageUrl] = useState('');
  const [uploadingNewSubCatImage, setUploadingNewSubCatImage] = useState(false);
  const [editingSubImageUrl, setEditingSubImageUrl] = useState('');
  const [uploadingEditSubImage, setUploadingEditSubImage] = useState(false);

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

  const handleImageUpload = async (e, type = 'new') => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (type === 'new') setUploadingNewCatImage(true);
      else if (type === 'edit') setUploadingEditCatImage(true);
      else if (type === 'newSub') setUploadingNewSubCatImage(true);
      else if (type === 'editSub') setUploadingEditSubImage(true);
      
      const uploadedUrl = await api.uploadImage(file);
      
      if (type === 'new') setNewCatImageUrl(uploadedUrl);
      else if (type === 'edit') setEditingImageUrl(uploadedUrl);
      else if (type === 'newSub') setNewSubCatImageUrl(uploadedUrl);
      else if (type === 'editSub') setEditingSubImageUrl(uploadedUrl);
    } catch (err) {
      if (type.includes('Sub')) setSubError('Image upload failed');
      else setError('Image upload failed');
    } finally {
      if (type === 'new') setUploadingNewCatImage(false);
      else if (type === 'edit') setUploadingEditCatImage(false);
      else if (type === 'newSub') setUploadingNewSubCatImage(false);
      else if (type === 'editSub') setUploadingEditSubImage(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newCatName.trim()) return;

    try {
      await api.createCategory({
        name: newCatName.trim(),
        slug: newCatName.trim().toLowerCase().replace(/ /g, '-'),
        imageUrl: newCatImageUrl || undefined,
        order: categories.length + 1
      });
      setNewCatName('');
      setNewCatImageUrl('');
      setSuccess('Category added successfully!');
      loadCategories();
    } catch (err) {
      setError(err.message || 'Add failed.');
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingImageUrl(cat.imageUrl || '');
  };

  const handleSaveEdit = async (id) => {
    setError('');
    setSuccess('');
    if (!editingName.trim()) return;

    try {
      await api.updateCategory(id, {
        name: editingName.trim(),
        slug: editingName.trim().toLowerCase().replace(/ /g, '-'),
        imageUrl: editingImageUrl || undefined,
      });
      setEditingId(null);
      setSuccess('Category updated!');
      loadCategories();
    } catch (err) {
      setError(err.message || 'Update failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Products linked to this category may need re-assignment.')) return;
    try {
      await api.deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  const handleMove = async (index, direction) => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= categories.length) return;

    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;

    setCategories(reordered);

    try {
      const orderedIds = reordered.map(c => c.id);
      await api.reorderCategories(orderedIds);
    } catch (err) {
      console.error('Failed to persist reorder', err);
      loadCategories();
    }
  };

  // Sub-category handlers
  const toggleExpand = (catId) => {
    setExpandedCat(expandedCat === catId ? null : catId);
    setNewSubCatName('');
    setNewSubCatImageUrl('');
    setSubError('');
    setSubSuccess('');
  };

  const handleAddSubCategory = async (e, categoryId) => {
    e.preventDefault();
    setSubError('');
    setSubSuccess('');
    if (!newSubCatName.trim()) return;

    try {
      await api.createSubCategory(categoryId, {
        name: newSubCatName.trim(),
        slug: newSubCatName.trim().toLowerCase().replace(/ /g, '-'),
        imageUrl: newSubCatImageUrl || undefined,
        order: 0
      });
      setNewSubCatName('');
      setNewSubCatImageUrl('');
      setSubSuccess('Sub-category added!');
      loadCategories();
    } catch (err) {
      setSubError(err.message || 'Add sub-category failed.');
    }
  };

  const handleStartEditSub = (sub) => {
    setEditingSubId(sub.id);
    setEditingSubName(sub.name);
    setEditingSubImageUrl(sub.imageUrl || '');
  };

  const handleSaveEditSub = async (id) => {
    setSubError('');
    if (!editingSubName.trim()) return;

    try {
      await api.updateSubCategory(id, {
        name: editingSubName.trim(),
        slug: editingSubName.trim().toLowerCase().replace(/ /g, '-'),
        imageUrl: editingSubImageUrl || undefined,
      });
      setEditingSubId(null);
      setSubSuccess('Sub-category updated!');
      loadCategories();
    } catch (err) {
      setSubError(err.message || 'Update failed.');
    }
  };

  const handleDeleteSub = async (id) => {
    if (!window.confirm('Delete this sub-category?')) return;
    try {
      await api.deleteSubCategory(id);
      loadCategories();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Category Console</h2>
        <p className="text-xs text-slate-500 font-medium">Create product categories, sub-categories, and organize layout ordering</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Add Category Form (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium h-max space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            <span>Create Category</span>
          </h3>

          <form onSubmit={handleAdd} className="space-y-4">
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
                placeholder="e.g. Designer Tuxedos"
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
                    onChange={(e) => handleImageUpload(e, 'new')}
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
              Add Category
            </button>
          </form>

          {/* Info about sub-categories */}
          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
            <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5" />
              Click the arrow next to any category to manage sub-categories
            </p>
          </div>
        </div>

        {/* Categories List & ordering (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Category Listing & Sorting</h3>
            <span className="text-[10px] text-slate-400 font-semibold">
              Total: {categories.length} Categories
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold">
                No categories defined.
              </div>
            ) : (
              categories.map((cat, index) => (
                <div key={cat.id}>
                  {/* Category Row */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Expand toggle */}
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {expandedCat === cat.id 
                          ? <ChevronDown className="w-4 h-4" /> 
                          : <ChevronRight className="w-4 h-4" />
                        }
                      </button>

                      {/* Index order number */}
                      <span className="text-xs font-extrabold text-slate-400 w-5">
                        {index + 1}
                      </span>
                      
                      {editingId === cat.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg py-1 px-2.5 focus:outline-none focus:border-brand-500"
                          />
                          <div className="flex items-center gap-2">
                            {editingImageUrl && (
                              <img src={editingImageUrl} alt="edit-cat" className="w-6 h-6 rounded-md object-cover border border-slate-200" />
                            )}
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'edit')}
                                className="hidden"
                                disabled={uploadingEditCatImage}
                              />
                              <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-200 flex items-center gap-1">
                                {uploadingEditCatImage ? <Loader className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                {uploadingEditCatImage ? '...' : 'Img'}
                              </div>
                            </label>
                            <button
                              onClick={() => handleSaveEdit(cat.id)}
                              className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                              <ImageIcon className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400">/{cat.slug}</span>
                              {cat.subCategories && cat.subCategories.length > 0 && (
                                <span className="text-[9px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full font-bold">
                                  {cat.subCategories.length} sub
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reordering & Edit actions */}
                    <div className="flex items-center gap-2">
                      {/* Reordering buttons */}
                      <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 bg-white text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 border-r border-slate-200"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === categories.length - 1}
                          className="p-1.5 bg-white text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                        title="Edit Category Name"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-100 text-slate-400 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-categories section (expandable) */}
                  {expandedCat === cat.id && (
                    <div className="bg-slate-50/70 border-t border-slate-100 px-6 py-4 space-y-3">
                      {subError && (
                        <div className="p-2 bg-red-50 border border-red-100 text-red-700 rounded-lg text-[10px] font-bold">{subError}</div>
                      )}
                      {subSuccess && (
                        <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold">{subSuccess}</div>
                      )}

                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase mb-2">
                        <FolderPlus className="w-3.5 h-3.5 text-brand-500" />
                        Sub-categories of "{cat.name}"
                      </div>

                      {/* Existing sub-categories */}
                      {cat.subCategories && cat.subCategories.length > 0 ? (
                        <div className="space-y-2">
                          {cat.subCategories.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl">
                              {editingSubId === sub.id ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <input
                                    type="text"
                                    value={editingSubName}
                                    onChange={e => setEditingSubName(e.target.value)}
                                    className="text-[11px] border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:border-brand-500"
                                  />
                                  <div className="flex items-center gap-2">
                                    {editingSubImageUrl && (
                                      <img src={editingSubImageUrl} alt="edit-sub" className="w-5 h-5 rounded object-cover border border-slate-200" />
                                    )}
                                    <label className="cursor-pointer">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'editSub')}
                                        className="hidden"
                                        disabled={uploadingEditSubImage}
                                      />
                                      <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-200 flex items-center gap-1">
                                        {uploadingEditSubImage ? <Loader className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                        {uploadingEditSubImage ? '...' : 'Img'}
                                      </div>
                                    </label>
                                  </div>
                                  <button onClick={() => handleSaveEditSub(sub.id)} className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setEditingSubId(null)} className="p-1 rounded bg-red-50 text-red-600 border border-red-100 hover:bg-red-100">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {sub.imageUrl ? (
                                    <img src={sub.imageUrl} alt={sub.name} className="w-6 h-6 rounded-md object-cover border border-slate-100 shrink-0" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0"></span>
                                  )}
                                  <span className="text-[11px] font-semibold text-slate-700">{sub.name}</span>
                                  <span className="text-[9px] text-slate-400">/{sub.slug}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleStartEditSub(sub)} className="p-1 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-400">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDeleteSub(sub.id)} className="p-1 border border-slate-200 rounded-md hover:bg-red-50 hover:text-red-500 text-slate-400">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No sub-categories yet.</p>
                      )}

                      {/* Add sub-category form */}
                      <form onSubmit={(e) => handleAddSubCategory(e, cat.id)} className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newSubCatName}
                            onChange={e => setNewSubCatName(e.target.value)}
                            placeholder="New sub-category name..."
                            className="flex-1 text-[11px] border border-slate-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-brand-500 bg-white"
                          />
                          <button
                            type="submit"
                            className="py-1.5 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold transition-colors flex items-center gap-1 shrink-0"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                        <div className="flex items-center gap-2 pl-1">
                          {newSubCatImageUrl && (
                            <div className="relative w-6 h-6 rounded overflow-hidden border border-slate-200 shrink-0">
                              <img src={newSubCatImageUrl} alt="New subcat" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setNewSubCatImageUrl('')}
                                className="absolute top-0 right-0 p-0.5 bg-black/50 text-white hover:bg-black/70"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'newSub')}
                              className="hidden"
                              disabled={uploadingNewSubCatImage}
                            />
                            <div className="text-[10px] bg-slate-100 px-2 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 flex items-center gap-1 transition-colors">
                              {uploadingNewSubCatImage ? <Loader className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                              {uploadingNewSubCatImage ? 'Uploading...' : 'Add Image (Optional)'}
                            </div>
                          </label>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
