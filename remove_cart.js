const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps/mobile/src/screens/shop');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Screen.js') && f !== 'CartScreen.js' && f !== 'CheckoutScreen.js' && f !== 'ProductDetailsScreen.js');

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove CustomCartAddIcon imports
  content = content.replace(/import\s*\{\s*CustomCartAddIcon,\s*CustomCartAddedIcon\s*\}\s*from\s*'\.\.\/\.\.\/components\/CartIcons';?\n?/, '');

  // Remove cartItems state
  content = content.replace(/const\s+\[cartItems,\s*setCartItems\]\s*=\s*useState\(new\s*Set\(\)\);\n?/, '');
  content = content.replace(/const\s+\[cartItems,\s*setCartItems\]\s*=\s*useState\(\[\]\);\n?/, '');

  // Remove Promise.all cart fetch
  content = content.replace(/,\s*api\.get\('\/products\/cart'\)\.catch\(\(\)\s*=>\s*\(\{\s*success:\s*false,\s*data:\s*\[\]\s*\}\)\)/g, '');
  content = content.replace(/const\s+\[prodRes,\s*favRes,\s*cartRes\]/g, 'const [prodRes, favRes]');
  content = content.replace(/const\s+\[prodRes,\s*favRes,\s*cartRes,\s*catRes\]/g, 'const [prodRes, favRes, catRes]');
  content = content.replace(/const\s+\[favRes,\s*cartRes\]/g, 'const [favRes]');
  
  // Remove setCartItems logic block
  content = content.replace(/if\s*\(cartRes\.success\s*&&\s*cartRes\.data\)\s*\{\s*setCartItems\(new\s*Set\(cartRes\.data\.map\(item\s*=>\s*item\.productId\)\)\);\s*\}/g, '');
  content = content.replace(/if\s*\(cartRes\.success\s*&&\s*cartRes\.data\)\s*\{\s*setCartItems\(cartRes\.data\);\s*\}/g, '');

  // Remove handleAddToCart function block (basic regex matching the block)
  content = content.replace(/const\s+handleAddToCart\s*=\s*async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?(?=const\s+(?:handle|render|load|on|toggle))/g, '');

  // Remove inCart logic in render
  content = content.replace(/const\s+inCart\s*=\s*cartItems\.has\([^)]+\);\n?/g, '');
  content = content.replace(/const\s+inCart\s*=\s*cartItems\.some\([^)]+\);\n?/g, '');

  // Remove TouchableOpacity for cart action btn
  content = content.replace(/<TouchableOpacity\s+style=\{styles\.cartIconBtn\}[\s\S]*?<\/TouchableOpacity>/g, '');
  // For other variants like `[styles.cartIconBtn, inCart && styles.cartIconBtnAdded]`
  content = content.replace(/<TouchableOpacity\s+style=\{\[styles\.cartIconBtn[^>]*>[\s\S]*?<\/TouchableOpacity>/g, '');

  // Remove styles for cartIconBtn
  content = content.replace(/cartIconBtn:\s*\{[\s\S]*?\},/g, '');
  content = content.replace(/cartIconBtnAdded:\s*\{[\s\S]*?\},/g, '');

  fs.writeFileSync(filePath, content);
  console.log(`Cleaned ${file}`);
});
