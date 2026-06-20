const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'packkart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'packkart123'
})

const PRODUCTS = [
  {
    id: 'ld-001', category_id: 'ld', name: 'LD Packaging Film',
    description: 'Premium low density polyethylene film for packaging',
    sizes: [
      { id: 'ld-001-s1', label: '8 inch / 200mm', moq: '1 kg', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 110 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 105 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 98 }] },
      { id: 'ld-001-s2', label: '10 inch / 250mm', moq: '1 kg', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 110 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 105 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 98 }] },
      { id: 'ld-001-s3', label: '12 inch / 300mm', moq: '1 kg', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 111 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 106 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 99 }] },
      { id: 'ld-001-s4', label: '14 inch / 350mm', moq: '1 kg', stock: true, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 111 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 106 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 99 }] },
      { id: 'ld-001-s5', label: '16 inch / 400mm', moq: '1 kg', stock: true, sort_order: 5, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 112 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 107 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 100 }] },
      { id: 'ld-001-s6', label: '18 inch / 450mm', moq: '1 kg', stock: false, sort_order: 6, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 112 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 107 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 100 }] },
      { id: 'ld-001-s7', label: '20 inch / 500mm', moq: '1 kg', stock: true, sort_order: 7, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 113 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 108 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 101 }] },
      { id: 'ld-001-s8', label: '24 inch / 600mm', moq: '1 kg', stock: true, sort_order: 8, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 113 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 108 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 101 }] },
      { id: 'ld-001-s9', label: '30 inch / 750mm', moq: '5 kg', stock: true, sort_order: 9, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 114 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 109 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 102 }] },
      { id: 'ld-001-s10', label: '36 inch / 900mm', moq: '5 kg', stock: true, sort_order: 10, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 115 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 110 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 103 }] },
      { id: 'ld-001-s11', label: '40 inch / 1000mm', moq: '5 kg', stock: false, sort_order: 11, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 116 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 111 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 104 }] },
      { id: 'ld-001-s12', label: '48 inch / 1200mm', moq: '5 kg', stock: true, sort_order: 12, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 117 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 112 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 105 }] }
    ]
  },
  {
    id: 'ld-002', category_id: 'ld', name: 'LD Garment Cover Film',
    description: 'Transparent film for garment and textile packaging',
    sizes: [
      { id: 'ld-002-s1', label: '12 inch / 300mm', moq: '5 kg', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 115 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 110 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 104 }] },
      { id: 'ld-002-s2', label: '16 inch / 400mm', moq: '5 kg', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 115 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 110 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 104 }] },
      { id: 'ld-002-s3', label: '20 inch / 500mm', moq: '5 kg', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 116 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 111 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 105 }] },
      { id: 'ld-002-s4', label: '24 inch / 600mm', moq: '10 kg', stock: true, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 116 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 111 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 105 }] }
    ]
  },
  {
    id: 'pp-001', category_id: 'pp', name: 'PP Woven Bags',
    description: 'Heavy duty polypropylene woven sacks',
    sizes: [
      { id: 'pp-001-s1', label: '12x18 inch - 25kg capacity', moq: '10 pcs', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 9, pricePerKg: 35 }, { label: 'Wholesale', minQty: 10, maxQty: 49, pricePerKg: 31 }, { label: 'Bulk', minQty: 50, maxQty: null, pricePerKg: 28 }] },
      { id: 'pp-001-s2', label: '14x22 inch - 40kg capacity', moq: '10 pcs', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 9, pricePerKg: 36 }, { label: 'Wholesale', minQty: 10, maxQty: 49, pricePerKg: 32 }, { label: 'Bulk', minQty: 50, maxQty: null, pricePerKg: 29 }] },
      { id: 'pp-001-s3', label: '16x26 inch - 50kg capacity', moq: '10 pcs', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 9, pricePerKg: 37 }, { label: 'Wholesale', minQty: 10, maxQty: 49, pricePerKg: 33 }, { label: 'Bulk', minQty: 50, maxQty: null, pricePerKg: 30 }] },
      { id: 'pp-001-s4', label: '18x28 inch - 60kg capacity', moq: '50 pcs', stock: true, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 9, pricePerKg: 38 }, { label: 'Wholesale', minQty: 10, maxQty: 49, pricePerKg: 34 }, { label: 'Bulk', minQty: 50, maxQty: null, pricePerKg: 31 }] }
    ]
  },
  {
    id: 'pp-002', category_id: 'pp', name: 'PP Non-woven Bags',
    description: 'Eco-friendly reusable shopping bags',
    sizes: [
      { id: 'pp-002-s1', label: 'Small - 10x12 inch', moq: '50 pcs', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 95 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 90 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 85 }] },
      { id: 'pp-002-s2', label: 'Medium - 12x15 inch', moq: '50 pcs', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 95 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 90 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 85 }] },
      { id: 'pp-002-s3', label: 'Large - 14x18 inch', moq: '50 pcs', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 96 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 91 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 86 }] },
      { id: 'pp-002-s4', label: 'XL - 16x20 inch', moq: '25 pcs', stock: true, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 97 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 92 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 87 }] }
    ]
  },
  {
    id: 'bopp-001', category_id: 'bopp', name: 'BOPP Transparent Tape',
    description: 'Clear biaxially oriented polypropylene packaging tape',
    sizes: [
      { id: 'bopp-001-s1', label: '1 inch / 24mm x 65m', moq: '1 roll', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 11, pricePerKg: 125 }, { label: 'Wholesale', minQty: 12, maxQty: 71, pricePerKg: 118 }, { label: 'Bulk', minQty: 72, maxQty: null, pricePerKg: 110 }] },
      { id: 'bopp-001-s2', label: '2 inch / 48mm x 65m', moq: '1 roll', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 11, pricePerKg: 122 }, { label: 'Wholesale', minQty: 12, maxQty: 35, pricePerKg: 115 }, { label: 'Bulk', minQty: 36, maxQty: null, pricePerKg: 108 }] },
      { id: 'bopp-001-s3', label: '3 inch / 72mm x 65m', moq: '1 roll', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 11, pricePerKg: 120 }, { label: 'Wholesale', minQty: 12, maxQty: 23, pricePerKg: 113 }, { label: 'Bulk', minQty: 24, maxQty: null, pricePerKg: 106 }] },
      { id: 'bopp-001-s4', label: '2 inch / 48mm x 100m', moq: '1 roll', stock: true, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 11, pricePerKg: 121 }, { label: 'Wholesale', minQty: 12, maxQty: 35, pricePerKg: 114 }, { label: 'Bulk', minQty: 36, maxQty: null, pricePerKg: 107 }] }
    ]
  },
  {
    id: 'bopp-002', category_id: 'bopp', name: 'BOPP Brown Tape',
    description: 'Brown opaque packaging tape for boxes',
    sizes: [
      { id: 'bopp-002-s1', label: '2 inch / 48mm x 65m', moq: '1 roll', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 11, pricePerKg: 118 }, { label: 'Wholesale', minQty: 12, maxQty: 35, pricePerKg: 112 }, { label: 'Bulk', minQty: 36, maxQty: null, pricePerKg: 105 }] },
      { id: 'bopp-002-s2', label: '3 inch / 72mm x 65m', moq: '1 roll', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 11, pricePerKg: 116 }, { label: 'Wholesale', minQty: 12, maxQty: 23, pricePerKg: 110 }, { label: 'Bulk', minQty: 24, maxQty: null, pricePerKg: 103 }] },
      { id: 'bopp-002-s3', label: '2 inch / 48mm x 100m', moq: '1 roll', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 11, pricePerKg: 117 }, { label: 'Wholesale', minQty: 12, maxQty: 35, pricePerKg: 111 }, { label: 'Bulk', minQty: 36, maxQty: null, pricePerKg: 104 }] }
    ]
  },
  {
    id: 'bubble-001', category_id: 'bubble', name: 'Bubble Wrap Roll',
    description: 'Standard air bubble film for fragile item protection',
    sizes: [
      { id: 'bubble-001-s1', label: '12 inch / 300mm width', moq: '1 kg', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 130 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 122 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 115 }] },
      { id: 'bubble-001-s2', label: '18 inch / 450mm width', moq: '1 kg', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 130 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 122 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 115 }] },
      { id: 'bubble-001-s3', label: '24 inch / 600mm width', moq: '1 kg', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 132 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 124 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 116 }] },
      { id: 'bubble-001-s4', label: '36 inch / 900mm width', moq: '5 kg', stock: true, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 133 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 125 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 117 }] },
      { id: 'bubble-001-s5', label: '48 inch / 1200mm width', moq: '10 kg', stock: false, sort_order: 5, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 135 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 127 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 118 }] }
    ]
  },
  {
    id: 'stretch-001', category_id: 'stretch', name: 'Hand Stretch Film',
    description: 'Machine or hand stretch wrap for pallet wrapping',
    sizes: [
      { id: 'stretch-001-s1', label: '12 inch / 300mm - 17 micron', moq: '1 kg', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 135 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 128 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 120 }] },
      { id: 'stretch-001-s2', label: '18 inch / 450mm - 17 micron', moq: '1 kg', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 135 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 128 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 120 }] },
      { id: 'stretch-001-s3', label: '18 inch / 450mm - 23 micron', moq: '1 kg', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 138 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 130 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 122 }] },
      { id: 'stretch-001-s4', label: '20 inch / 500mm - 23 micron', moq: '5 kg', stock: true, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 138 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 130 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 122 }] }
    ]
  },
  {
    id: 'shrink-001', category_id: 'shrink', name: 'POF Shrink Film',
    description: 'Polyolefin shrink film for product packaging',
    sizes: [
      { id: 'shrink-001-s1', label: '12 inch / 300mm - 15 micron', moq: '1 kg', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 160 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 152 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 145 }] },
      { id: 'shrink-001-s2', label: '16 inch / 400mm - 15 micron', moq: '1 kg', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 160 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 152 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 145 }] },
      { id: 'shrink-001-s3', label: '20 inch / 500mm - 19 micron', moq: '1 kg', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 163 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 155 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 148 }] },
      { id: 'shrink-001-s4', label: '24 inch / 600mm - 19 micron', moq: '5 kg', stock: false, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 163 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 155 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 148 }] }
    ]
  },
  {
    id: 'hm-001', category_id: 'hm', name: 'HM Carry Bags',
    description: 'High molecular weight polyethylene carry bags',
    sizes: [
      { id: 'hm-001-s1', label: '8x10 inch - Small', moq: '1 kg', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 100 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 94 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 88 }] },
      { id: 'hm-001-s2', label: '10x12 inch - Medium', moq: '1 kg', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 100 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 94 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 88 }] },
      { id: 'hm-001-s3', label: '12x15 inch - Large', moq: '1 kg', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 101 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 95 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 89 }] },
      { id: 'hm-001-s4', label: '14x18 inch - XL', moq: '1 kg', stock: true, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 101 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 95 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 89 }] },
      { id: 'hm-001-s5', label: '16x20 inch - XXL', moq: '1 kg', stock: true, sort_order: 5, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 4, pricePerKg: 102 }, { label: 'Wholesale', minQty: 5, maxQty: 24, pricePerKg: 96 }, { label: 'Bulk', minQty: 25, maxQty: null, pricePerKg: 90 }] }
    ]
  },
  {
    id: 'courier-001', category_id: 'courier', name: 'POD Courier Bags',
    description: 'Tamper-evident polybags for courier and e-commerce',
    sizes: [
      { id: 'courier-001-s1', label: 'A5 - 6x9 inch', moq: '10 pcs', stock: true, sort_order: 1, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 145 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 137 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 130 }] },
      { id: 'courier-001-s2', label: 'A4 - 10x14 inch', moq: '10 pcs', stock: true, sort_order: 2, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 143 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 135 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 128 }] },
      { id: 'courier-001-s3', label: 'A3 - 12x16 inch', moq: '10 pcs', stock: true, sort_order: 3, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 140 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 132 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 126 }] },
      { id: 'courier-001-s4', label: 'Large - 14x18 inch', moq: '10 pcs', stock: true, sort_order: 4, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 138 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 130 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 124 }] },
      { id: 'courier-001-s5', label: 'XL - 16x22 inch', moq: '25 pcs', stock: true, sort_order: 5, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 136 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 128 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 122 }] },
      { id: 'courier-001-s6', label: 'XXL - 18x24 inch', moq: '25 pcs', stock: false, sort_order: 6, pricing_tiers: [{ label: 'Retail', minQty: 1, maxQty: 49, pricePerKg: 136 }, { label: 'Wholesale', minQty: 50, maxQty: 199, pricePerKg: 128 }, { label: 'Bulk', minQty: 200, maxQty: null, pricePerKg: 122 }] }
    ]
  }
]

async function seed() {
  try {
    console.log('Seeding products...')
    let productCount = 0
    let sizeCount = 0

    for (const product of PRODUCTS) {
      await pool.query(
        'INSERT INTO products (id, category_id, name, description) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET name=$3, description=$4, updated_at=NOW()',
        [product.id, product.category_id, product.name, product.description]
      )
      productCount++

      for (const size of product.sizes) {
        await pool.query(
          'INSERT INTO product_sizes (id, product_id, label, moq, stock, pricing_tiers, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET label=$3, moq=$4, stock=$5, pricing_tiers=$6, sort_order=$7',
          [size.id, product.id, size.label, size.moq, size.stock, JSON.stringify(size.pricing_tiers), size.sort_order]
        )
        sizeCount++
      }
      console.log('  seeded: ' + product.name + ' (' + product.sizes.length + ' sizes)')
    }

    console.log('\nDone! ' + productCount + ' products, ' + sizeCount + ' sizes seeded.')
    process.exit(0)
  } catch (e) {
    console.error('Seed failed:', e.message)
    process.exit(1)
  }
}

seed()
