const path = require('path');
const fs = require('fs');
const locations = [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')];
require('dotenv').config({ path: locations.find(p => fs.existsSync(p)) });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const mongoose = require('mongoose');
const Tool = require('../models/Tool');

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected\n');
  const tools = await Tool.find({}).select('name images');
  tools.forEach(t => {
    console.log('Tool:', t.name);
    (t.images || []).forEach((img, i) => {
      const type = !img ? 'EMPTY'
        : img.includes('cloudinary') ? 'CLOUDINARY'
        : img.startsWith('http') ? 'OTHER_HTTP'
        : img.startsWith('/uploads') ? 'LOCAL_UPLOADS'
        : 'UNKNOWN';
      console.log(`  [${i}] ${type}: ${JSON.stringify(img)}`);
    });
  });
  await mongoose.disconnect();
}
run().catch(e => { console.error(e.message); process.exit(1); });