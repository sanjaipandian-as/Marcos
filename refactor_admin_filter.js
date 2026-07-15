const fs = require('fs');

const filePath = 'apps/admin-panel/src/components/ProductManager.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const filterSelectStr = `
            {/* Cascading Filter Dropdowns */}
            {(() => {
              const currentPath = selectedCategory !== 'ALL' ? (findCategoryPath(selectedCategory) || []) : [];
              const rootCat = currentPath[0] || null;
              const subCat = currentPath[1] || null;
              const subSubCat = currentPath[2] || null;

              const subCategoriesList = rootCat ? (rootCat.subCategories || []) : [];
              const subSubCategoriesList = subCat ? (subCat.subCategories || []) : [];

              return (
                <div className="flex gap-2 w-full md:w-auto">
                  <select
                    value={rootCat?.id || 'ALL'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCategory(val);
                      setCurrentPage(1);
                    }}
                    className="flex-1 md:w-40 text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white text-slate-650 focus:outline-none focus:border-brand-500 transition-colors font-bold"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  {(rootCat && subCategoriesList.length > 0) && (
                    <select
                      value={subCat?.id || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCategory(val ? val : rootCat.id);
                        setCurrentPage(1);
                      }}
                      className="flex-1 md:w-40 text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white text-slate-650 focus:outline-none focus:border-brand-500 transition-colors font-bold"
                    >
                      <option value="">-- All Sub --</option>
                      {subCategoriesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}

                  {(subCat && subSubCategoriesList.length > 0) && (
                    <select
                      value={subSubCat?.id || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCategory(val ? val : subCat.id);
                        setCurrentPage(1);
                      }}
                      className="flex-1 md:w-40 text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white text-slate-650 focus:outline-none focus:border-brand-500 transition-colors font-bold"
                    >
                      <option value="">-- All Sub-Sub --</option>
                      {subSubCategoriesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })()}
`;

content = content.replace(
  /<select\s*value=\{selectedCategory\}\s*onChange=\{handleCategoryChange\}\s*className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white text-slate-650 focus:outline-none focus:border-brand-500 transition-colors font-bold"\s*>\s*<option value="ALL">All Categories<\/option>\s*\{flatCategories\.map\(cat => \(\s*<option key=\{cat\.id\} value=\{cat\.id\}>\s*\{'\\u00A0\\u00A0'\.repeat\(cat\.depth\)\}\{cat\.depth > 0 \? '↳ ' : ''\}\{cat\.name\}\s*<\/option>\s*\)\)\}\s*<\/select>/,
  filterSelectStr
);

fs.writeFileSync(filePath, content);
console.log("Refactored ProductManager.jsx Filter Dropdown");
