/*
  SKP DATA FILE - the one place to edit prices, grades, certificates, lots and ports.

  DEMO MODE
  While demo is true, every price, certificate, lot record, freight rate and order on the
  site is SIMULATED and is labelled as demo data on screen. Nothing here is a real SKP
  price, certificate or lot. Replace the values below with SKP's real data, then set
  demo to false.
*/
window.SKP = {
  demo: true,
  whatsapp: '919535676976',            // number that receives orders and quotes
  phones: ['+91 95356 76976', '+91 99726 19789'],
  email: '',                           // add SKP's sales email to enable email handoff
  loadingPort: 'New Mangalore (INNML)',
  cartonKg: 22.68,                     // 50 lb export carton
  cartonsPerFcl20: 700,
  retailShipping: { fee: 60, freeAbove: 999 },
  wholesaleMinCartons: 5,
  quoteSpread: 0.03,                   // indicative range is price +/- 3%
  cartonsPerFcl40: 1400,
  leadDays: 10,                        // days from order to loading at New Mangalore (simulated)
  fx: { USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67, INR: 84 },   // simulated exchange rates per 1 USD
  minExportCartons: 100,
  payment: 'Advance, LC at sight or CAD for export; UPI, card, net banking or bank transfer in India',

  packs: [                             // retail pouches
    { id: '250', label: '250 g', kg: 0.25, factor: 1.06 },
    { id: '500', label: '500 g', kg: 0.5, factor: 1.03 },
    { id: '1000', label: '1 kg', kg: 1, factor: 1 }
  ],

  packing: [                           // wholesale and export packing options
    { id: 'tin', label: 'Tins', detail: '2 x 11.34 kg tins per carton, nitrogen flushed' },
    { id: 'pouch', label: 'Vacuum pouch', detail: '1 x 22.68 kg flexi pouch per carton, vacuum packed' },
    { id: 'twin', label: 'Twin pouch', detail: '2 x 11.34 kg vacuum pouches per carton' }
  ],

  grades: [
    {
      id: 'w180', use: 'gifting and premium retail', bestFor: 'Gift boxes, premium retail, hotels', name: 'W180', title: 'White Wholes 180', kind: 'Whole', image: 'assets/kernel.webp',
      line: 'The largest whole kernels. For gifting and premium retail.',
      count: '170 to 180 kernels per lb (about 375 to 395 per kg)',
      retailPerKg: 1450, wholesalePerKg: 1210, fobUsdPerLb: 4.55,
      specs: { 'Kernel type': 'Whole, white', 'Count': '170 to 180 per lb', 'Moisture': '5% max', 'Broken kernels': '5% max', 'Next lower grade': '10% max', 'Colour': 'White to pale ivory', 'Shelf life': '12 months sealed, cool and dry' }
    },
    {
      id: 'w240', use: 'premium snacking and roasting', bestFor: 'Premium snacking, roasting, flavoured nuts', name: 'W240', title: 'White Wholes 240', kind: 'Whole', image: 'assets/cashews.webp',
      line: 'Large, even wholes. The premium all-rounder.',
      count: '220 to 240 kernels per lb (about 485 to 530 per kg)',
      retailPerKg: 1180, wholesalePerKg: 985, fobUsdPerLb: 3.85,
      specs: { 'Kernel type': 'Whole, white', 'Count': '220 to 240 per lb', 'Moisture': '5% max', 'Broken kernels': '5% max', 'Next lower grade': '10% max', 'Colour': 'White to pale ivory', 'Shelf life': '12 months sealed, cool and dry' }
    },
    {
      id: 'w320', use: 'everyday snacking and retail packs', bestFor: 'Retail packs, snacking, roasting', name: 'W320', title: 'White Wholes 320', kind: 'Whole', image: 'assets/hands.webp',
      line: 'The most traded grade worldwide. Everyday snacking and retail.',
      count: '300 to 320 kernels per lb (about 660 to 705 per kg)',
      retailPerKg: 980, wholesalePerKg: 820, fobUsdPerLb: 3.35,
      specs: { 'Kernel type': 'Whole, white', 'Count': '300 to 320 per lb', 'Moisture': '5% max', 'Broken kernels': '5% max', 'Next lower grade': '10% max', 'Colour': 'White to pale ivory', 'Shelf life': '12 months sealed, cool and dry' }
    },
    {
      id: 'splits', use: 'sweets, bakery and roasting', bestFor: 'Sweets, bakery, roasted splits', name: 'Splits', title: 'White Splits (S)', kind: 'Broken', image: 'assets/cashews.webp',
      line: 'Kernels split cleanly lengthwise. For sweets, roasting and bakery.',
      count: 'Halves split naturally along the kernel',
      retailPerKg: 860, wholesalePerKg: 715, fobUsdPerLb: 2.85,
      specs: { 'Kernel type': 'Splits, white', 'Count': 'Not counted', 'Moisture': '5% max', 'Pieces below grade': '5% max', 'Next lower grade': '10% max', 'Colour': 'White to pale ivory', 'Shelf life': '12 months sealed, cool and dry' }
    },
    {
      id: 'pieces', use: 'gravies, confectionery and food service', bestFor: 'Gravies, confectionery, food service', name: 'Pieces', title: 'Large White Pieces (LWP)', kind: 'Broken', image: 'assets/hands.webp',
      line: 'Large pieces for gravies, confectionery and food service.',
      count: 'Pieces that do not pass a 4.75 mm sieve',
      retailPerKg: 780, wholesalePerKg: 650, fobUsdPerLb: 2.55,
      specs: { 'Kernel type': 'Pieces, white', 'Count': 'Not counted', 'Moisture': '5% max', 'Pieces below grade': '5% max', 'Next lower grade': '10% max', 'Colour': 'White to pale ivory', 'Shelf life': '12 months sealed, cool and dry' }
    }
  ],

  ports: [                             // freight is per 20 ft container, simulated
    { id: 'AEJEA', name: 'Jebel Ali, UAE', freightUsd: 950, days: 6 },
    { id: 'SADMM', name: 'Dammam, Saudi Arabia', freightUsd: 1250, days: 10 },
    { id: 'NLRTM', name: 'Rotterdam, Netherlands', freightUsd: 2400, days: 24 },
    { id: 'DEHAM', name: 'Hamburg, Germany', freightUsd: 2550, days: 27 },
    { id: 'ESVLC', name: 'Valencia, Spain', freightUsd: 2300, days: 21 },
    { id: 'USNYC', name: 'New York, USA', freightUsd: 3900, days: 32 },
    { id: 'JPTYO', name: 'Tokyo, Japan', freightUsd: 2100, days: 20 },
    { id: 'SGSIN', name: 'Singapore', freightUsd: 1100, days: 9 }
  ],

  certificates: [                      // set file to a PDF path (for example docs/fssai.pdf) to offer the real document
    { id: 'fssai', name: 'FSSAI licence', issuer: 'Food Safety and Standards Authority of India', scope: 'Manufacture and export of cashew kernels', number: 'SAMPLE-FSSAI-0000', validTo: '2027-03-31', file: '' },
    { id: 'iso22000', name: 'ISO 22000', issuer: 'Accredited certification body', scope: 'Food safety management system', number: 'SAMPLE-ISO-0000', validTo: '2027-08-14', file: '' },
    { id: 'haccp', name: 'HACCP', issuer: 'Accredited certification body', scope: 'Hazard analysis and critical control points, cashew processing', number: 'SAMPLE-HACCP-0000', validTo: '2027-08-14', file: '' },
    { id: 'iec', name: 'Import Export Code', issuer: 'Directorate General of Foreign Trade', scope: 'Authorisation to export from India', number: 'SAMPLE-IEC-0000', validTo: '', file: '' },
    { id: 'rcmc', name: 'Export council membership', issuer: 'Cashew export promotion body', scope: 'Registered exporter of cashew kernels', number: 'SAMPLE-RCMC-0000', validTo: '2027-03-31', file: '' }
  ],

  lots: [
    {
      id: 'SKP-DEMO-0001', grade: 'w320', packing: 'tin', cartons: 700, status: 'Shipped',
      origin: 'Raw cashew nut, coastal Karnataka', processedAt: 'SKP processing unit, Udupi',
      steps: [
        { date: '2026-09-02', title: 'Raw nut received', note: 'Outturn and moisture checked at intake' },
        { date: '2026-09-05', title: 'Steamed and shelled', note: 'Steam conditioned, shelled and separated' },
        { date: '2026-09-07', title: 'Dried and peeled', note: 'Dried, humidified and peeled' },
        { date: '2026-09-09', title: 'Graded', note: 'Sorted by size and colour to W320' },
        { date: '2026-09-10', title: 'Quality checked', note: 'Lab checks recorded below' },
        { date: '2026-09-11', title: 'Packed', note: 'Nitrogen flushed tins, 700 cartons' },
        { date: '2026-09-14', title: 'Dispatched', note: 'Loaded at New Mangalore' }
      ],
      qc: { 'Moisture': '4.1%', 'Broken kernels': '3.2%', 'Next lower grade': '6.5%', 'Foreign matter': 'Nil', 'Infestation': 'Nil', 'Metal detection': 'Passed' },
      certificates: ['fssai', 'iso22000', 'haccp']
    },
    {
      id: 'SKP-DEMO-0002', grade: 'w240', packing: 'pouch', cartons: 350, status: 'Packed',
      origin: 'Raw cashew nut, coastal Karnataka', processedAt: 'SKP processing unit, Udupi',
      steps: [
        { date: '2026-10-18', title: 'Raw nut received', note: 'Outturn and moisture checked at intake' },
        { date: '2026-10-21', title: 'Steamed and shelled', note: 'Steam conditioned, shelled and separated' },
        { date: '2026-10-23', title: 'Dried and peeled', note: 'Dried, humidified and peeled' },
        { date: '2026-10-25', title: 'Graded', note: 'Sorted by size and colour to W240' },
        { date: '2026-10-26', title: 'Quality checked', note: 'Lab checks recorded below' },
        { date: '2026-10-27', title: 'Packed', note: 'Vacuum pouches, 350 cartons' }
      ],
      qc: { 'Moisture': '4.3%', 'Broken kernels': '2.8%', 'Next lower grade': '5.9%', 'Foreign matter': 'Nil', 'Infestation': 'Nil', 'Metal detection': 'Passed' },
      certificates: ['fssai', 'haccp']
    },
    {
      id: 'SKP-DEMO-0003', grade: 'splits', packing: 'twin', cartons: 200, status: 'Delivered',
      origin: 'Raw cashew nut, coastal Karnataka', processedAt: 'SKP processing unit, Udupi',
      steps: [
        { date: '2026-08-04', title: 'Raw nut received', note: 'Outturn and moisture checked at intake' },
        { date: '2026-08-07', title: 'Steamed and shelled', note: 'Steam conditioned, shelled and separated' },
        { date: '2026-08-09', title: 'Dried and peeled', note: 'Dried, humidified and peeled' },
        { date: '2026-08-11', title: 'Graded', note: 'Splits separated and sorted' },
        { date: '2026-08-12', title: 'Quality checked', note: 'Lab checks recorded below' },
        { date: '2026-08-13', title: 'Packed', note: 'Twin vacuum pouches, 200 cartons' },
        { date: '2026-08-16', title: 'Dispatched', note: 'Loaded at New Mangalore' },
        { date: '2026-08-26', title: 'Delivered', note: 'Received by buyer' }
      ],
      qc: { 'Moisture': '4.4%', 'Pieces below grade': '3.6%', 'Next lower grade': '7.1%', 'Foreign matter': 'Nil', 'Infestation': 'Nil', 'Metal detection': 'Passed' },
      certificates: ['fssai', 'iso22000']
    }
  ],

  careersEmail: '',                    // add SKP's HR email to also offer email applications
  jobs: [                              // simulated openings until SKP adds real ones
    { id: 'qc', title: 'Quality Control Executive', team: 'Quality', fit: 'quality', place: 'Vandaru, Udupi', type: 'Full time', exp: '1 to 3 years',
      about: 'Keep every lot to spec, from moisture to colour, before it leaves the unit.',
      do: ['Test samples for moisture, breakage and grade at each stage', 'Record results and release or hold lots', 'Prepare certificates of analysis for buyers'],
      bring: ['B.Sc in food science, microbiology or chemistry', 'A careful eye and clean record keeping', 'Kannada or Tulu, plus working English'] },
    { id: 'prod', title: 'Production Supervisor', team: 'Production', fit: 'floor', place: 'Vandaru, Udupi', type: 'Full time', exp: '3 to 6 years',
      about: 'Run a shift on the processing floor, from steaming to packing.',
      do: ['Plan the shift and lead the floor team', 'Keep output, yield and safety on track', 'Work with quality to fix issues on the spot'],
      bring: ['Experience in food or cashew processing', 'Calm, fair leadership of large teams', 'Comfort with simple production reports'] },
    { id: 'maint', title: 'Maintenance Technician', team: 'Engineering', fit: 'engineering', place: 'Vandaru, Udupi', type: 'Full time', exp: '2 to 5 years',
      about: 'Keep the shelling, drying and packing lines running.',
      do: ['Carry out planned maintenance on machines', 'Find and fix breakdowns fast', 'Keep spares and service logs up to date'],
      bring: ['ITI or diploma in mechanical or electrical', 'Hands-on experience with process machinery', 'Willingness to work in shifts'] },
    { id: 'exdoc', title: 'Export Documentation Executive', team: 'Export', fit: 'trade', place: 'Udupi', type: 'Full time', exp: '1 to 4 years',
      about: 'Make sure every container leaves with the right papers, on time.',
      do: ['Prepare invoices, packing lists and certificates', 'Coordinate with CHA, shipping lines and banks', 'Track shipments and keep buyers updated'],
      bring: ['Experience in export documentation', 'Knowledge of LC, FOB and CIF terms', 'Strong English and spreadsheet skills'] },
    { id: 'sales', title: 'Area Sales Executive', team: 'Sales', fit: 'trade', place: 'Bengaluru', type: 'Full time', exp: '2 to 5 years',
      about: 'Grow SKP with retailers, sweet shops and hotels across the city.',
      do: ['Build and serve a list of trade buyers', 'Take orders and plan deliveries', 'Share market feedback with the team in Udupi'],
      bring: ['Experience in FMCG or dry fruit sales', 'Two-wheeler and a valid licence', 'Kannada and English'] },
    { id: 'proc', title: 'Field Procurement Officer', team: 'Procurement', fit: 'outdoors', place: 'Coastal Karnataka', type: 'Full time', exp: '1 to 3 years',
      about: 'Buy raw cashew nut from growers and keep good relationships on the ground.',
      do: ['Visit growers and collection centres', 'Check raw nut quality and outturn', 'Arrange fair, timely payment and transport'],
      bring: ['Ties with farming communities', 'Basic understanding of raw nut quality', 'Readiness to travel through the season'] },
    { id: 'acct', title: 'Accounts Assistant', team: 'Finance', fit: 'office', place: 'Udupi', type: 'Full time', exp: '0 to 2 years',
      about: 'Keep the books clean across the SKP family of businesses.',
      do: ['Record purchases, sales and payments', 'Help with GST filings and reconciliations', 'Support month-end closing'],
      bring: ['B.Com or equivalent', 'Tally or a similar accounting tool', 'Accuracy and patience with numbers'] }
  ],

  sampleOrders: [                      // shown in the buyer portal while demo is true
    {
      id: 'SKP-EX-1042', sample: true, mode: 'export', date: '2026-09-12', currency: 'USD', total: 117250,
      lines: [{ g: 'w320', unit: 'carton', qty: 700, price: 167.5 }],
      customer: { name: 'Demo Buyer', company: 'Sample Trading LLC', city: 'Dubai', country: 'UAE' },
      lot: 'SKP-DEMO-0001', stage: 3, port: 'AEJEA',
      tracking: [
        { date: '2026-09-12', text: 'Order confirmed' },
        { date: '2026-09-14', text: 'Loaded at New Mangalore, container sealed' },
        { date: '2026-09-15', text: 'Vessel sailed' },
        { date: '2026-09-21', text: 'Arrived Jebel Ali, customs in progress' }
      ]
    },
    {
      id: 'SKP-IN-2210', sample: true, mode: 'wholesale', date: '2026-08-14', currency: 'INR', total: 3243240,
      lines: [{ g: 'splits', unit: 'carton', qty: 200, price: 16216.2 }],
      customer: { name: 'Demo Buyer', company: 'Sample Sweets Pvt Ltd', city: 'Bengaluru', country: 'India' },
      lot: 'SKP-DEMO-0003', stage: 4,
      tracking: [
        { date: '2026-08-14', text: 'Order confirmed' },
        { date: '2026-08-16', text: 'Dispatched from Udupi' },
        { date: '2026-08-26', text: 'Delivered and signed for' }
      ]
    }
  ]
};
