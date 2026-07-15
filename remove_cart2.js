const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps/mobile/src/screens/shop');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Screen.js') && f !== 'CartScreen.js' && f !== 'CheckoutScreen.js' && f !== 'ProductDetailsScreen.js');

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove the remaining TouchableOpacity block for cartIconBtn
  content = content.replace(/<TouchableOpacity[^>]*styles\.cartIconBtn[\s\S]*?<\/TouchableOpacity>/g, '');
  
  // Remove unused lucide-react-native icons
  content = content.replace(/,\s*ShoppingCart\b/, '');

  fs.writeFileSync(filePath, content);
  console.log(`Cleaned ${file} again`);
});
