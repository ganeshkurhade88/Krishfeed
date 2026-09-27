// seed_marketplace.js — run once: node src/db/seed_marketplace.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...');

    // 1. Create a demo farmer to own the batches/listings
    let farmerRes = await client.query(`SELECT id FROM users WHERE phone = $1`, ['9876540001']);
    let farmerId;
    if (farmerRes.rows.length === 0) {
      const hash = await bcrypt.hash('password123', 10);
      const ins = await client.query(`
        INSERT INTO users (name, phone, password_hash, role, district, state, consent_given, consent_date)
        VALUES ('Ramesh Patil Demo', '9876540001', $1, 'farmer', 'Akola', 'Maharashtra', true, NOW())
        RETURNING id
      `, [hash]);
      farmerId = ins.rows[0].id;
      await client.query(`INSERT INTO consent_log (user_id, consent_type, consent_given) VALUES ($1, 'registration', true)`, [farmerId]);
      console.log('Created demo farmer:', farmerId);
    } else {
      farmerId = farmerRes.rows[0].id;
      console.log('Using existing demo farmer:', farmerId);
    }

    // 2. Realistic Maharashtra feed market listings
    const listings = [
      { feed_type: 'maize_silage', qty: 2400, storage: 'pit',    district: 'Akola',      price: 4.20, quality: 82, avail: 2400, min_qty: 500, colour: 'olive_green',    smell: 'normal_slightly_acidic', moisture: 'moist' },
      { feed_type: 'sorghum_silage',qty: 1800, storage: 'bag',   district: 'Kolhapur',   price: 3.80, quality: 78, avail: 1400, min_qty: 300, colour: 'yellowish_green', smell: 'normal_slightly_acidic', moisture: 'moist' },
      { feed_type: 'hay',           qty: 900,  storage: 'shed',  district: 'Pune',       price: 6.50, quality: 88, avail: 900,  min_qty: 200, colour: 'olive_green',    smell: 'normal_slightly_acidic', moisture: 'dry'   },
      { feed_type: 'concentrate_mix',qty:500,  storage: 'bag',   district: 'Ahmednagar', price: 22.0, quality: 91, avail: 500,  min_qty: 100, colour: 'olive_green',    smell: 'normal_slightly_acidic', moisture: 'dry'   },
      { feed_type: 'tmr',           qty: 1200, storage: 'bunker',district: 'Nashik',     price: 8.00, quality: 75, avail: 1200, min_qty: 400, colour: 'yellowish_green', smell: 'strongly_acidic',        moisture: 'moist' },
      { feed_type: 'maize_silage',  qty: 3000, storage: 'pit',   district: 'Amravati',   price: 3.90, quality: 80, avail: 2800, min_qty: 500, colour: 'olive_green',    smell: 'normal_slightly_acidic', moisture: 'moist' },
      { feed_type: 'hay',           qty: 600,  storage: 'open',  district: 'Solapur',    price: 5.20, quality: 70, avail: 600,  min_qty: 200, colour: 'yellowish_green', smell: 'normal_slightly_acidic', moisture: 'dry'   },
      { feed_type: 'sorghum_silage',qty: 2000, storage: 'pit',   district: 'Latur',      price: 4.00, quality: 83, avail: 2000, min_qty: 300, colour: 'olive_green',    smell: 'normal_slightly_acidic', moisture: 'moist' },
    ];

    for (const item of listings) {
      const exists = await client.query(`
        SELECT ml.id FROM marketplace_listings ml
        JOIN batches b ON ml.batch_id = b.id
        WHERE b.farmer_id = $1 AND b.feed_type = $2 AND b.district = $3
      `, [farmerId, item.feed_type, item.district]);
      if (exists.rows.length > 0) {
        console.log(`Skipping existing: ${item.feed_type} in ${item.district}`);
        continue;
      }

      const batchCode = `BATCH-${item.district.toUpperCase().slice(0,3)}-${Date.now()}`;
      const batchRes = await client.query(`
        INSERT INTO batches (farmer_id, batch_code, feed_type, quantity_kg, district, state, storage_type,
          date_stored, opening_freq, moisture_feel, colour, smell, temperature_c, status)
        VALUES ($1,$2,$3,$4,$5,'Maharashtra',$6, NOW()-INTERVAL '15 days','every_2_3_days',$7,$8,$9,27,'active')
        RETURNING id
      `, [farmerId, batchCode, item.feed_type, item.qty, item.district, item.storage, item.moisture, item.colour, item.smell]);
      const batchId = batchRes.rows[0].id;

      await client.query(`
        INSERT INTO test_results (batch_id, visual_score, crude_protein_min, crude_protein_max,
          moisture_min, moisture_max, fiber_ndf_min, fiber_ndf_max, energy_me_min, energy_me_max,
          aflatoxin_risk, urea_risk, sand_risk, ph_estimate_min, ph_estimate_max, overall_risk_level)
        VALUES ($1,$2,8.5,11.2,62,68,45,55,2.1,2.4,'low','low','low',4.0,4.5,'low')
      `, [batchId, item.quality]);

      await client.query(`
        INSERT INTO marketplace_listings (batch_id, farmer_id, price_per_kg, min_quantity_kg, available_kg, listing_status)
        VALUES ($1,$2,$3,$4,$5,'active')
      `, [batchId, farmerId, item.price, item.min_qty, item.avail]);


      console.log(`✅  ${item.feed_type} | ${item.district} | Rs${item.price}/kg | Score:${item.quality}`);
    }

    console.log('\nMarketplace seeding complete!');
  } catch (err) {
    console.error('Seed error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
