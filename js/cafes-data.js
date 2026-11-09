/* =========================================================
   Meridian Coffee Atlas: sample dataset
   ---------------------------------------------------------
   IMPORTANT: every record below is SAMPLE / DEMONSTRATION DATA.
   - The cafe names are fictional and are not real businesses.
   - Phone numbers use the invalid prefix "+91 00000" so they can never reach a real person.
   - Addresses are illustrative. Latitude/longitude point to the real locality
     (neighbourhood centre), not to a real shop.
   - Opening hours are invented sample schedules.
   Replace this file (or load a JSON feed with the same shape) with verified data
   before launching. See README notes at the bottom of this file.
   ========================================================= */
(function () {
  'use strict';
  const Atlas = (window.Atlas = window.Atlas || {});

  Atlas.DATA_NOTICE = 'Sample demonstration data: fictional cafés, placeholder phone numbers and invented opening hours.';

  /* ---------- Cities (photos from Wikimedia Commons, credited in the footer) ---------- */
  const city = (slug, name, state, credit) => ({
    slug, name, state, image: `assets/images/cities/${slug}.jpg`, credit
  });
  Atlas.cities = [
    city('delhi', 'Delhi', 'Delhi', { title: 'Evening, India Gate, Delhi', author: 'Rajaraman Sundaram', licence: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Evening,india_gate,delhi_-_panoramio.jpg' }),
    city('noida', 'Noida', 'Uttar Pradesh', { title: 'View of Noida city from the Hilton Noida', author: 'Edmund Gall', licence: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:View_of_Noida_city_from_the_Hilton_Noida.jpg' }),
    city('gurugram', 'Gurugram', 'Haryana', { title: 'Gurgaon night skyline', author: 'Unknown23322', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Gurgaon-night-skyline.jpg' }),
    city('mumbai', 'Mumbai', 'Maharashtra', { title: 'Gateway of India in the evening', author: 'SriSriChinmaya', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Gateway_of_India_in_the_evening,_Mumbai,_India.jpg' }),
    city('bengaluru', 'Bengaluru', 'Karnataka', { title: 'Cubbon Park, Bangalore', author: 'Yercaud-elango', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Stage-3-cubbon_park-bangalore-India.jpg' }),
    city('hyderabad', 'Hyderabad', 'Telangana', { title: 'Charminar, Hyderabad', author: 'TheAafi', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Charminar,_Hyderabad,_11-12-2022.jpg' }),
    city('pune', 'Pune', 'Maharashtra', { title: 'Shivshrushti, Pune', author: 'DesiBoy101', licence: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Shivshrushti,_Pune_(38798).jpg' }),
    city('chandigarh', 'Chandigarh', 'Chandigarh', { title: 'Palace of Assembly, Chandigarh', author: 'duncid', licence: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Palace_of_Assembly_Chandigarh_2006.jpg' }),
    city('lucknow', 'Lucknow', 'Uttar Pradesh', { title: 'Bara Imambara, Lucknow', author: 'Slyronit', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Bara_Imambara,_Lucknow_2.jpg' }),
    city('jaipur', 'Jaipur', 'Rajasthan', { title: 'East facade, Hawa Mahal, Jaipur', author: 'Chainwit.', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:East_facade_Hawa_Mahal_Jaipur_from_ground_level_(July_2022)_-_img_01.jpg' })
  ];
  const cityBySlug = Object.fromEntries(Atlas.cities.map(c => [c.slug, c]));

  /* ---------- Photo pool (Unsplash, stored locally) ---------- */
  const DIR = 'assets/images/cafes/';
  const INTERIORS = ['c01-seating', 'c02-street', 'c03-interior', 'c04-bar', 'c05-industrial', 'c06-busy', 'c07-neon', 'c08-counter', 'c09-window', 'c10-bikes', 'c11-pourover'];
  const DRINKS = ['d01-lattes', 'd02-cheers', 'd03-pour', 'd04-twolattes', 'd05-glass', 'd06-iced', 'd07-portafilter'];
  Atlas.FALLBACK_IMAGE = DIR + 'c03-interior.jpg';
  Atlas.HERO_IMAGE = DIR + 'hero-counter.jpg';

  /* ---------- Opening-hour templates (sample schedules) ---------- */
  const span = (open, close) => ({ open, close });
  const week = (mon, tue, wed, thu, fri, sat, sun) => ({ mon, tue, wed, thu, fri, sat, sun });
  const SCHEDULES = [
    // A: every day 8:00 am – 10:00 pm
    () => { const d = span('08:00', '22:00'); return week(d, d, d, d, d, d, d); },
    // B: earlier weekdays, later weekends
    () => { const w = span('07:30', '22:30'), e = span('08:30', '23:30'); return week(w, w, w, w, w, e, e); },
    // C: late opener, closed on Mondays
    () => { const d = span('10:00', '23:00'); return week(null, d, d, d, d, d, d); },
    // D: early riser, short Sundays
    () => { const w = span('07:00', '21:00'); return week(w, w, w, w, w, w, span('09:00', '21:00')); },
    // E: relaxed hours, closed on Tuesdays
    () => { const d = span('09:00', '23:00'); return week(d, null, d, d, d, d, d); }
  ];

  const HIGHLIGHTS = [
    'Single-origin pour-overs', 'Slow bar with filter coffee', 'Work-friendly seating', 'House-baked pastries',
    'Cold brew on tap', 'Small-batch roasts to take home', 'Quiet corner seating', 'Courtyard seating',
    'Espresso flights', 'Plant-based milk options', 'Weekend brunch menu', 'Reading shelf'
  ];

  /* ---------- Compact source rows -> full records ----------
     [name, citySlug, area, unit/street line, latitude, longitude] */
  const ROWS = [
    ['Fernhill Roasters', 'delhi', 'Khan Market', 'Unit 14, Middle Lane', 28.6006, 77.2270],
    ['The Copper Kettle', 'delhi', 'Connaught Place', 'Block F, Inner Circle', 28.6315, 77.2167],
    ['Sundial Coffee Lab', 'delhi', 'Hauz Khas Village', 'First floor, Main Lane', 28.5535, 77.1949],
    ['Marlow & Mist', 'delhi', 'Saket', 'Ground floor, Press Enclave Road', 28.5244, 77.2066],
    ['Ember & Oat', 'delhi', 'Lajpat Nagar', 'Shop 7, Central Market', 28.5677, 77.2433],
    ['Ivory Tower Café', 'delhi', 'Defence Colony', 'Market Road', 28.5730, 77.2290],

    ['Bluebird Brew House', 'noida', 'Sector 18', 'Second floor, Atrium Road', 28.5700, 77.3260],
    ['Orchard Row Coffee', 'noida', 'Sector 62', 'Ground floor, Tech Park Road', 28.6270, 77.3649],
    ['Saltwind Café', 'noida', 'Sector 104', 'Fourth floor, Hazipur Road', 28.5445, 77.3810],
    ['Quill & Crema', 'noida', 'Sector 137', 'Shop 3, Expressway Plaza', 28.5086, 77.4090],

    ['Lantern Lane Coffee', 'gurugram', 'Cyber Hub', 'Food court level, DLF Cyber City', 28.4950, 77.0890],
    ['Terrace & Tamp', 'gurugram', 'DLF Phase 3', 'Rooftop, Sector 24 Market', 28.4930, 77.0950],
    ['Alder Street Roasters', 'gurugram', 'Golf Course Road', 'Ground floor, Sector 54', 28.4500, 77.1000],
    ['Pinecone Café', 'gurugram', 'Sohna Road', 'Shop 12, Sector 49 Market', 28.4100, 77.0560],

    ['Harbour & Bean', 'mumbai', 'Colaba', 'Causeway side lane', 18.9067, 72.8147],
    ['Velvet Crema', 'mumbai', 'Bandra West', 'Linking Road side street', 19.0596, 72.8295],
    ['Monsoon Pour', 'mumbai', 'Lower Parel', 'Mill compound, Senapati Bapat Marg', 18.9930, 72.8300],
    ['Lakeview Coffee Co.', 'mumbai', 'Powai', 'Hiranandani Gardens', 19.1176, 72.9060],
    ['Tideline Café', 'mumbai', 'Andheri West', 'Lokhandwala Back Road', 19.1363, 72.8277],

    ['Gardenia Coffee House', 'bengaluru', 'Indiranagar', '100 Feet Road side lane', 12.9784, 77.6408],
    ['Brickhouse Brew', 'bengaluru', 'Koramangala', '5th Block', 12.9352, 77.6245],
    ['Mulberry & Mocha', 'bengaluru', 'HSR Layout', 'Sector 2', 12.9116, 77.6389],
    ['Canopy Coffee Works', 'bengaluru', 'Whitefield', 'ITPL Main Road', 12.9698, 77.7500],
    ['Banyan Roast', 'bengaluru', 'Jayanagar', '4th Block', 12.9250, 77.5938],

    ['Pearl & Pour', 'hyderabad', 'Jubilee Hills', 'Road No. 36', 17.4326, 78.4071],
    ['Saffron Steam Café', 'hyderabad', 'Banjara Hills', 'Road No. 12', 17.4156, 78.4347],
    ['Cobalt Coffee Co.', 'hyderabad', 'Gachibowli', 'Financial District', 17.4401, 78.3489],
    ['Nimbus Roasters', 'hyderabad', 'Madhapur', 'Ayyappa Society Road', 17.4486, 78.3908],

    ['Lantern & Leaf', 'pune', 'Koregaon Park', 'Lane 5', 18.5362, 73.8940],
    ['Ridgeline Coffee', 'pune', 'Aundh', 'ITI Road', 18.5590, 73.8075],
    ['Almond Grove Café', 'pune', 'Baner', 'Pashan Link Road', 18.5590, 73.7868],
    ['Parlour Nine Coffee', 'pune', 'Viman Nagar', 'Samrat Chowk side lane', 18.5679, 73.9143],
    ['Kiln & Kettle', 'pune', 'Kothrud', 'Karve Road', 18.5074, 73.8077],

    ['Linden Court Coffee', 'chandigarh', 'Sector 17', 'Plaza side arcade', 30.7410, 76.7840],
    ['Rosewater Roasters', 'chandigarh', 'Sector 35', 'Market lane', 30.7270, 76.7600],
    ['Marigold Brew Bar', 'chandigarh', 'Sector 8', 'Garden side road', 30.7430, 76.7900],
    ['Cedar & Cup', 'chandigarh', 'Sector 22', 'Shop-cum-office row', 30.7310, 76.7750],

    ['Awadh Bean Society', 'lucknow', 'Hazratganj', 'Mahatma Gandhi Marg', 26.8500, 80.9400],
    ['Gomti Garden Café', 'lucknow', 'Gomti Nagar', 'Vibhuti Khand', 26.8560, 81.0070],
    ['Zinnia Coffee Studio', 'lucknow', 'Aliganj', 'Sector H', 26.8870, 80.9390],
    ['Brass & Bean', 'lucknow', 'Indira Nagar', 'Sector 14', 26.8750, 81.0200],

    ['Pink Pavilion Café', 'jaipur', 'C-Scheme', 'Ashok Marg side lane', 26.9100, 75.8000],
    ['Haveli Hour Coffee', 'jaipur', 'Malviya Nagar', 'Gaurav Tower road', 26.8500, 75.8100],
    ['Terracotta Roasters', 'jaipur', 'Vaishali Nagar', 'Amrapali Circle', 26.9120, 75.7270],
    ['Sandstone Sips', 'jaipur', 'Bani Park', 'Kanti Chandra Road', 26.9350, 75.7900]
  ];

  const slugify = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  Atlas.cafes = ROWS.map((r, i) => {
    const [name, citySlug, area, line, lat, lon] = r;
    const c = cityBySlug[citySlug];
    const hours = SCHEDULES[i % SCHEDULES.length]();
    const firstOpen = hours.mon || hours.tue;                       // typical day
    const main = INTERIORS[i % INTERIORS.length];
    const gallery = [INTERIORS[(i + 3) % INTERIORS.length], DRINKS[i % DRINKS.length], INTERIORS[(i + 7) % INTERIORS.length]];
    const pick = n => HIGHLIGHTS[(i * 5 + n * 3) % HIGHLIGHTS.length];
    return {
      id: slugify(name + ' ' + area),
      name,
      city: c.name,
      state: c.state,
      area,
      address: `${line}, ${area}, ${c.name}${c.state !== c.name ? ', ' + c.state : ''}`,   // avoid "Delhi, Delhi"
      latitude: lat,
      longitude: lon,
      phone: `+91 00000 ${String(10001 + i)}`,                       // intentionally invalid sample number
      openingTime: firstOpen.open,
      closingTime: firstOpen.close,
      weeklyOpeningHours: hours,                                      // null = closed that day
      image: `${DIR}${main}.jpg`,
      galleryImages: gallery.map(g => `${DIR}${g}.jpg`),
      highlights: [pick(0), pick(1), pick(2)].filter((v, k, a) => a.indexOf(v) === k),
      description: `${name} is a fictional café used to demonstrate the Meridian Coffee Atlas. It sits in ${area}, ${c.name}, and stands in for the kind of independent roaster or neighbourhood coffee bar you would find listed here once real, verified data is connected.`,
      isSample: true
    };
  });

  /* ---------- Replacing the sample data ----------
     Each record needs: id, name, city, state, area, address, latitude, longitude, phone,
     openingTime, closingTime, weeklyOpeningHours { mon..sun: {open:'HH:MM', close:'HH:MM'} | null },
     image, galleryImages[]. To load real data, fetch a JSON file with this shape and assign it to
     Atlas.cafes before main.js runs. Opening status is computed in the browser from these hours (India time),
     so it is only as accurate as the schedule you provide. */
})();
