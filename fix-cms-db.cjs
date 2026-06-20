const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'packkart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'packkart123',
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Fixing CMS tables...');

    // Add hint column if missing
    await client.query(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hint TEXT;`);
    await client.query(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS label VARCHAR(300);`);
    await client.query(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'text';`);
    await client.query(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS group_name VARCHAR(100) DEFAULT 'general';`);
    await client.query(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;`);
    console.log('✅ Columns added');

    // Create admin_otps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_otps (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20),
        otp VARCHAR(10),
        expires_at TIMESTAMP,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ admin_otps table created');

    // Insert all settings
    const settings = [
      ['business_name','PackKart','Business Name','text','business',1,'Shown in header and title'],
      ['business_tagline','PACKAGING DELIVERED','Header Tagline','text','business',2,'Small text under logo'],
      ['business_phone','7052710786','Business Phone','text','business',3,'For calls'],
      ['business_whatsapp','917052710786','WhatsApp Number','text','business',4,'With country code, no +'],
      ['business_email','hello@packkart.in','Email Address','text','business',5,''],
      ['business_address','Kanpur, Uttar Pradesh, India','Business Address','textarea','business',6,''],
      ['business_gst','','GST Number','text','business',7,'Optional'],
      ['primary_color','#D32F2F','Primary Brand Color','color','business',8,'Main red color used everywhere'],
      ['primary_color_dark','#B71C1C','Primary Color Dark','color','business',9,'Hover/darker shade'],
      ['primary_color_light','#FFEBEE','Primary Color Light','color','business',10,'Light background tint'],
      ['header_logo_text','PackKart','Logo Text','text','header',1,''],
      ['header_search_placeholder','Search "LD film", "bubble wrap"…','Search Placeholder','text','header',2,''],
      ['header_app_btn_text','APP','App Button Text','text','header',3,''],
      ['header_app_btn_subtext','GET THE','App Button Subtext','text','header',4,'Small text above APP'],
      ['header_app_btn_show','true','Show App Button','toggle','header',5,''],
      ['header_location_default_text','Set location','Location Default Text','text','header',6,'When no pincode set'],
      ['header_kanpur_delivery_text','Same-day','Kanpur Delivery Label','text','header',7,'Shows under pincode for Kanpur'],
      ['header_outside_delivery_text','3-7 days','Outside Kanpur Label','text','header',8,''],
      ['hero_title','Plastic Packaging\nat Wholesale Rates','Hero Title','textarea','homepage',1,'Use \\n for line break'],
      ['hero_subtitle','LD Film, PP Bags, BOPP Tape, Bubble Wrap, Stretch Film - tiered pricing from 1 kg to 100 kg+.','Hero Subtitle','textarea','homepage',2,''],
      ['hero_btn1_text','Shop Now','Hero Button 1 Text','text','homepage',3,''],
      ['hero_btn1_link','/#categories','Hero Button 1 Link','text','homepage',4,''],
      ['hero_btn2_text','WhatsApp','Hero Button 2 Text','text','homepage',5,''],
      ['hero_badge_text','Same-day in Kanpur · Pan-India','Hero Badge Text','text','homepage',7,'Top strip text in hero'],
      ['hero_bg_color','linear-gradient(135deg, #D32F2F 0%, #880E0E 100%)','Hero Background','text','homepage',8,'CSS gradient or color'],
      ['tile1_icon','🛵','Tile 1 Icon','text','tiles',1,''],
      ['tile1_title','Kanpur','Tile 1 Title','text','tiles',2,''],
      ['tile1_sub','Same day · 3 slots','Tile 1 Subtitle','text','tiles',3,''],
      ['tile1_color','#FFEBEE','Tile 1 Color','color','tiles',4,''],
      ['tile2_icon','🚚','Tile 2 Icon','text','tiles',5,''],
      ['tile2_title','UP & North India','Tile 2 Title','text','tiles',6,''],
      ['tile2_sub','2-4 working days','Tile 2 Subtitle','text','tiles',7,''],
      ['tile2_color','#E3F2FD','Tile 2 Color','color','tiles',8,''],
      ['tile3_icon','📦','Tile 3 Icon','text','tiles',9,''],
      ['tile3_title','Pan-India','Tile 3 Title','text','tiles',10,''],
      ['tile3_sub','4-7 working days','Tile 3 Subtitle','text','tiles',11,''],
      ['tile3_color','#E8F5E9','Tile 3 Color','color','tiles',12,''],
      ['tile4_icon','💰','Tile 4 Icon','text','tiles',13,''],
      ['tile4_title','Bulk orders','Tile 4 Title','text','tiles',14,''],
      ['tile4_sub','Best rate above 100kg','Tile 4 Subtitle','text','tiles',15,''],
      ['tile4_color','#FFF8E1','Tile 4 Color','color','tiles',16,''],
      ['feature1_icon','⚡','Feature 1 Icon','text','features',1,''],
      ['feature1_text','Same-day Kanpur slots','Feature 1 Text','text','features',2,''],
      ['feature2_icon','🏷️','Feature 2 Icon','text','features',3,''],
      ['feature2_text','Tiered bulk pricing','Feature 2 Text','text','features',4,''],
      ['feature3_icon','🚚','Feature 3 Icon','text','features',5,''],
      ['feature3_text','Delhivery pan-India','Feature 3 Text','text','features',6,''],
      ['feature4_icon','📸','Feature 4 Icon','text','features',7,''],
      ['feature4_text','Photo order support','Feature 4 Text','text','features',8,''],
      ['sidebar_show','true','Show Category Sidebar','toggle','layout',1,'Left sidebar on homepage'],
      ['pill_bar_show','true','Show Category Pill Bar','toggle','layout',2,'Horizontal scrolling bar'],
      ['sidebar_all_text','All Products','Sidebar All Label','text','layout',3,''],
      ['products_per_row','5','Products Per Row','number','layout',4,'On desktop homepage grid'],
      ['show_bulk_save_badge','true','Show BULK SAVE Badge','toggle','layout',5,'On product cards'],
      ['add_to_cart_text','+ Add to Cart','Add to Cart Text','text','layout',6,''],
      ['out_of_stock_text','Out of Stock','Out of Stock Text','text','layout',7,''],
      ['whatsapp_cta_show','true','Show WhatsApp CTA Section','toggle','whatsapp',1,'Bottom of homepage'],
      ['whatsapp_cta_title',"Can't find what you need?",'CTA Title','text','whatsapp',2,''],
      ['whatsapp_cta_subtitle','Send us a photo or description on WhatsApp - our team will source it and give you a quote within minutes.','CTA Subtitle','textarea','whatsapp',3,''],
      ['whatsapp_cta_btn_text','Chat Now','CTA Button Text','text','whatsapp',4,''],
      ['whatsapp_cta_message','Hi, I need help with packaging materials','WhatsApp Pre-filled Message','text','whatsapp',5,''],
      ['kanpur_pincode_prefix','208','Kanpur Pincode Prefix','text','delivery',1,'Pincodes starting with this = Kanpur same-day'],
      ['delivery_slots','9:00 AM - 12:00 PM,12:00 PM - 3:00 PM,3:00 PM - 6:00 PM','Delivery Time Slots','textarea','delivery',2,'Comma separated'],
      ['same_day_label','Same-day delivery available','Same-day Label','text','delivery',3,''],
      ['standard_label','Standard delivery (3-7 days)','Standard Label','text','delivery',4,''],
      ['outside_kanpur_msg','Ships via courier after confirmation. Estimated: 3-7 working days.','Outside Kanpur Message','textarea','delivery',5,''],
      ['cod_text','Cash on Delivery','COD Label','text','delivery',6,''],
      ['cod_subtext','Pay in cash when order arrives','COD Sublabel','text','delivery',7,''],
      ['online_pay_text','Pay Online','Online Pay Label','text','delivery',8,''],
      ['online_pay_subtext','UPI, cards, net banking via Razorpay','Online Pay Sublabel','text','delivery',9,''],
      ['min_order_value','0','Minimum Order Value','number','delivery',10,'0 = no minimum'],
      ['app_page_title','PackKart App','App Page Title','text','app',1,''],
      ['app_page_subtitle','Order plastic packaging materials on the go.','App Page Subtitle','textarea','app',2,''],
      ['app_apk_url','https://expo.dev/accounts/nikhil9005/projects/PackKart2/builds','APK Download URL','text','app',3,''],
      ['app_android_show','true','Show Android Section','toggle','app',4,''],
      ['app_ios_show','true','Show iOS Section','toggle','app',5,''],
      ['app_ios_coming_soon','true','iOS Coming Soon','toggle','app',6,'Shows coming soon badge'],
      ['app_install_steps','1. Tap Download APK above\n2. Open the downloaded file\n3. Tap Install\n4. Done! Open PackKart','Install Instructions','textarea','app',7,''],
      ['login_title','PackKart','Login Page Title','text','login',1,''],
      ['login_subtitle','Sign in or create your account','Login Subtitle','text','login',2,''],
      ['login_btn_text','Send OTP','Send OTP Button','text','login',3,''],
      ['login_terms_text','By continuing you agree to our Terms of Service.','Terms Text','text','login',4,''],
      ['seo_site_title','PackKart - Plastic Packaging, Delivered','Site Title','text','seo',1,'Browser tab title'],
      ['seo_description','Order LD Film, PP Bags, BOPP Tape, Bubble Wrap, Stretch Film and more - same-day delivery in Kanpur.','Meta Description','textarea','seo',2,''],
      ['seo_keywords','plastic packaging, LD film, bubble wrap, BOPP tape, Kanpur packaging','Keywords','text','seo',3,''],
      ['footer_text','2026 PackKart. All rights reserved.','Footer Text','text','footer',1,''],
      ['footer_show','true','Show Footer','toggle','footer',2,''],
    ];

    for (const [key, value, label, type, group_name, sort_order, hint] of settings) {
      await client.query(`
        INSERT INTO site_settings (key, value, label, type, group_name, sort_order, hint)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (key) DO UPDATE SET label=$3, type=$4, group_name=$5, sort_order=$6, hint=$7
      `, [key, value, label, type, group_name, sort_order, hint]);
    }
    console.log('✅ All settings inserted!');

    // Update super admin
    const bcrypt = require('bcryptjs');
    const hashedPin = await bcrypt.hash('0786', 10);
    const result = await client.query(
      'UPDATE staff SET phone=$1, pin=$2, name=$3 WHERE role=$4 RETURNING id',
      ['7052710786', hashedPin, 'Nikhil', 'super_admin']
    );
    if (result.rowCount === 0) {
      await client.query(
        'INSERT INTO staff (name, phone, pin, role) VALUES ($1,$2,$3,$4)',
        ['Nikhil', '7052710786', hashedPin, 'super_admin']
      );
      console.log('✅ Super admin created: 7052710786');
    } else {
      console.log('✅ Super admin updated: 7052710786 / PIN 0786');
    }

    console.log('\n✅ Database ready! Now restart backend: npm run dev');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
