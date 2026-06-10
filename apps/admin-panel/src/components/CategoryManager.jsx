import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Layers,
  Check,
  X
} from 'lucide-react';
import api from '../utils/api';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
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

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newCatName.trim()) return;

    try {
      await api.createCategory({
        name: newCatName.trim(),
        slug: newCatName.trim().toLowerCase().replace(/ /g, '-'),
        order: categories.length + 1
      });
      setNewCatName('');
      setSuccess('Category added successfully!');
      loadCategories();
    } catch (err) {
      setError(err.message || 'Add failed.');
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = async (id) => {
    setError('');
    setSuccess('');
    if (!editingName.trim()) return;

    try {
      await api.updateCategory(id, editingName.trim());
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

    // Call API reorder
    try {
      const orderedIds = reordered.map(c => c.id);
      await api.reorderCategories(orderedIds);
    } catch (err) {
      console.error('Failed to persist reorder', err);
      loadCategories();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Category Console</h2>
        <p className="text-xs text-slate-500 font-medium">Create product categories and organize layout ordering</p>
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

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Add Category
            </button>
          </form>
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
                <div 
                  key={cat.id} 
                  className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Index order number */}
                    <span className="text-xs font-extrabold text-slate-400 w-5">
                      {index + 1}
                    </span>
                    
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg py-1 px-2.5 focus:outline-none focus:border-brand-500"
                        />
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
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                        <span className="text-[9px] text-slate-400">/{cat.slug}</span>
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
