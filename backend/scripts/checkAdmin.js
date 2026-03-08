const path = require('path');
const fs = require('fs');
const loc = [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')];
require('dotenv').config({ path: loc.find(p => fs.existsSync(p)) });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected\n');
  const db = mongoose.connection.db;

  // 1. Admin accounts
  const admins = await db.collection('users').find({ role: 'admin' }).toArray();
  console.log(`=== ADMIN ACCOUNTS (${admins.length}) ===`);
  admins.forEach(a => console.log(`  ${a.name} | ${a.email} | suspended: ${a.suspended || false} | _id: ${a._id}`));

  // 2. Recent tickets
  const tickets = await db.collection('supporttickets').find({}).sort({ createdAt: -1 }).limit(5).toArray();
  console.log(`\n=== RECENT TICKETS (${tickets.length}) ===`);
  tickets.forEach(t => console.log(`  #${t.ticketNumber} | "${t.subject}" | userId: ${t.userId || 'GUEST'} | created: ${t.createdAt}`));

  // 3. Recent notifications for admins
  if (admins.length > 0) {
    const adminIds = admins.map(a => a._id);
    const notifs = await db.collection('notifications')
      .find({ userId: { $in: adminIds } }).sort({ createdAt: -1 }).limit(10).toArray();
    console.log(`\n=== ADMIN NOTIFICATIONS (${notifs.length}) ===`);
    notifs.forEach(n => console.log(`  [${n.type}] ${n.title} | read: ${n.read} | ${n.createdAt}`));
  }

  await mongoose.disconnect();
}
run().catch(e => { console.error(e.message); process.exit(1); });