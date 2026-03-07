const path = require('path');
const fs   = require('fs');
const locations = [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')];
require('dotenv').config({ path: locations.find(p => fs.existsSync(p)) });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('MONGO_URI not found'); process.exit(1); }

const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const tools = await db.collection('tools').find({}).toArray();

  let fixed = 0;
  for (const tool of tools) {
    const images = tool.images || [];
    let changed = false;

    const newImages = images.map(img => {
      if (!img) return img;
      // Log raw char codes to see exactly what's in the string
      const hasBadChars = [...img].some(c => c.charCodeAt(0) <= 32);
      if (hasBadChars) {
        console.log(`\nTool: "${tool.name}"`);
        console.log(`  Raw bytes: ${[...img].map(c => c.charCodeAt(0)).join(',')}`);
        console.log(`  Before: ${img}`);
        changed = true;
        return [...img].filter(c => c.charCodeAt(0) > 32).join('');
      }
      return img;
    });

    if (changed) {
      console.log(`  After: ${newImages}`);
      await db.collection('tools').updateOne(
        { _id: tool._id },
        { $set: { images: newImages } }
      );
      fixed++;
    }
  }

  if (fixed === 0) {
    console.log('No newline issues found in images.\n');
    console.log('Printing all tool image URLs for manual inspection:');
    tools.forEach(t => {
      (t.images || []).forEach(img => {
        const bytes = [...(img||'')].map(c => c.charCodeAt(0));
        const hasBad = bytes.some(b => b <= 32);
        console.log(`  [${hasBad ? 'BAD' : 'OK '}] ${t.name}: charCodes=${bytes.slice(-10).join(',')}`);
      });
    });
  }

  console.log(`\nFixed ${fixed} tool(s).`);
  await mongoose.disconnect();
}
run().catch(e => { console.error('Failed:', e.message); process.exit(1); });