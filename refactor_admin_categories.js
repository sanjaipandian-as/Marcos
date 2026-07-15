const fs = require('fs');

const filePath = 'apps/admin-panel/src/components/ProductManager.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add findCategoryPath helper
const helperStr = `
  const findCategoryPath = (catId, cats = categories, currentPath = []) => {
    for (const cat of cats) {
      if (cat.id === catId) return [...currentPath, cat];
      if (cat.subCategories && cat.subCategories.length > 0) {
        const path = findCategoryPath(catId, cat.subCategories, [...currentPath, cat]);
        if (path) return path;
      }
    }
    return null;
  };
`;
content = content.replace(
  /const flattenCategories = \(cats, depth = 0, result = \[\]\) => \{/,
  helperStr + '\n  const flattenCategories = (cats, depth = 0, result = []) => {'
);

// 2. Replace the modal Category section
const modalCategorySelectStr = `
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Category Selection *</label>
                    {(() => {
                      const currentPath = findCategoryPath(formData.categoryId) || [];
                      const rootCat = currentPath[0] || null;
                      const subCat = currentPath[1] || null;
                      const subSubCat = currentPath[2] || null;

                      const subCategoriesList = rootCat ? (rootCat.subCategories || []) : [];
                      const subSubCategoriesList = subCat ? (subCat.subCategories || []) : [];

                      return (
                        <div className="flex flex-col gap-2">
                          <select
                            value={rootCat?.id || ''}
                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none focus:border-brand-500 font-semibold"
                          >
                            <option value="" disabled>Select Main Category</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>

                          {(rootCat && subCategoriesList.length > 0) && (
                            <select
                              value={subCat?.id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setFormData({ ...formData, categoryId: val ? val : rootCat.id });
                              }}
                              className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none focus:border-brand-500 font-semibold"
                            >
                              <option value="">-- Select Sub Category --</option>
                              {subCategoriesList.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          )}

                          {(subCat && subSubCategoriesList.length > 0) && (
                            <select
                              value={subSubCat?.id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setFormData({ ...formData, categoryId: val ? val : subCat.id });
                              }}
                              className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none focus:border-brand-500 font-semibold"
                            >
                              <option value="">-- Select Sub-Sub Category --</option>
                              {subSubCategoriesList.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })()}
                  </div>
`;

content = content.replace(
  /<label className="text-\[10px\] font-bold text-slate-400 uppercase block">Category \*\<\/label>\s*<select\s*value=\{formData\.categoryId\}\s*onChange=\{e => setFormData\(\{ \.\.\.formData, categoryId: e\.target\.value \}\)\}\s*className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none focus:border-brand-500 font-semibold"\s*>\s*\{flatCategories\.map\(c => \(\s*<option key=\{c\.id\} value=\{c\.id\}>\s*\{'\\u00A0\\u00A0'\.repeat\(c\.depth\)\}\{c\.depth > 0 \? '↳ ' : ''\}\{c\.name\}\s*<\/option>\s*\)\)\}\s*<\/select>/,
  modalCategorySelectStr
);

fs.writeFileSync(filePath, content);
console.log("Refactored ProductManager.jsx");
