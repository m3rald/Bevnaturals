import type { Product } from './types';

export const CATALOG: Product[] = [
  // =========================================================================
  // ADULT SESSION (14 products)
  // =========================================================================
  {
    id: 'bn-adult-clarifying-shampoo',
    slug: 'clarifying-shampoo-anti-dandruff',
    name: 'Clarifying Shampoo (Anti-Dandruff)',
    line: 'adult',
    category: 'Cleanse',
    shortNote: 'Targeted Ayurvedic scalp cleanser formulated to lift flakes and stubborn build-up.',
    description:
      'An invigorating Ayurvedic clarifying wash created to relieve flaky, congested scalps without stripping natural coils. Gently resets roots before deep conditioning.',
    botanicals: ['Tea Tree', 'Neem Leaf', 'Peppermint', 'Ayurvedic Herbs'],
    ritual:
      'Apply generously onto wet hair and massage gently into the scalp with fingertip pads. Leave for two minutes and rinse thoroughly.',
    imageSrc: '/src/assets/images/clarifying_shampoo_enhanced_1794760517281.jpg',
    featured: true,
    variants: [
      { id: 'adult-clarifying-250', sizeLabel: '250ml', priceNgn: 7000, inStock: true },
    ],
  },
  {
    id: 'bn-adult-black-shampoo',
    slug: 'moisturizing-black-shampoo',
    name: 'Moisturizing Black Shampoo',
    line: 'adult',
    category: 'Cleanse',
    shortNote: 'With aloe and honey for gentle, hydration-preserving wash days.',
    description:
      'Traditional African black soap enriched with fresh aloe vera juice and raw blossom honey. Cleanses curls softly while preserving natural slip and moisture.',
    botanicals: ['African Black Soap', 'Aloe Vera', 'Raw Honey', 'Ayurvedic Extracts'],
    ritual:
      'Saturate hair with warm water, work shampoo into a rich lather along scalp and strands, then rinse clean.',
    imageSrc: '/src/assets/images/black_shampoo_enhanced_1794760517287.jpg',
    featured: true,
    variants: [
      { id: 'adult-black-shampoo-250', sizeLabel: '250ml', priceNgn: 6500, inStock: true },
    ],
  },
  {
    id: 'bn-adult-keratin-repair',
    slug: 'keratin-repair-deep-conditioner',
    name: 'Keratin Repair Deep Conditioner',
    line: 'adult',
    category: 'Moisture & Masks',
    shortNote: 'Protein restore treatment to rebuild damaged, fragile hair shafts.',
    description:
      'Targeted protein-restore deep conditioner blending keratin, aloe vera, coconut oil, and vitamin E to strengthen heat-stressed or shedding strands.',
    botanicals: ['Hydrolyzed Keratin', 'Aloe Vera', 'Coconut Oil', 'Vitamin E'],
    ritual:
      'Apply evenly to freshly washed hair every 3 to 4 weeks. Rest for 15 to 20 minutes, rinse thoroughly, and follow with moisture.',
    imageSrc: '/src/assets/images/keratin_conditioner_enhanced_1794760518704.jpg',
    featured: false,
    variants: [
      { id: 'adult-keratin-250', sizeLabel: '250g', priceNgn: 7500, inStock: true },
    ],
  },
  {
    id: 'bn-adult-deep-conditioning',
    slug: 'moisturizing-deep-conditioning-treatment',
    name: 'Moisturizing Deep Conditioning Treatment',
    line: 'adult',
    category: 'Moisture & Masks',
    shortNote: 'Intense moisture masque that repairs dry strands and restores elasticity.',
    description:
      'Rich, concentrated deep conditioning treatment formulated with shea butter, coconut oil, aloe vera, and Ayurvedic herbs to restore softness and prevent breakage.',
    botanicals: ['Shea Butter', 'Coconut Oil', 'Aloe Vera', 'Ayurvedic Herbs'],
    ritual:
      'Smooth onto clean, damp hair in sections from mid-length to ends. Cover with a shower cap for 20 to 30 minutes before rinsing.',
    imageSrc: '/src/assets/images/deep_treatment_enhanced_1794760519999.jpg',
    featured: true,
    variants: [
      { id: 'adult-deep-cond-250', sizeLabel: '250g', priceNgn: 6500, inStock: true },
    ],
  },
  {
    id: 'bn-adult-hair-mist',
    slug: 'anti-itch-hydrating-hair-mist',
    name: 'Anti Itch Hydrating Hair Mist',
    line: 'adult',
    category: 'Daily Styling',
    shortNote: 'With tea tree extract to soothe dry, itchy scalps and refresh protective styles.',
    description:
      'Cooling herbal trigger mist infused with pure tea tree extract and aloe hydrosol to calm scalp irritation and hydrate braids, locs, and twists.',
    botanicals: ['Tea Tree Extract', 'Aloe Hydrosol', 'Ayurvedic Extracts'],
    ritual:
      'Spray directly onto scalp and hair length whenever dryness or itchiness occurs.',
    imageSrc: '/src/assets/images/anti_itch_mist_enhanced_1794760519617.jpg',
    featured: false,
    variants: [
      { id: 'adult-mist-250', sizeLabel: '250ml', priceNgn: 6500, inStock: true },
    ],
  },
  {
    id: 'bn-adult-leave-in',
    slug: 'ayurvedic-leave-in-conditioner',
    name: 'Ayurvedic Leave-In Conditioner',
    line: 'adult',
    category: 'Daily Styling',
    shortNote: 'Extra luster daily hydrating lotion for soft, tangle-free styling.',
    description:
      'Lightweight creamy leave-in conditioner designed to detangle knots effortlessly, impart extra luster, and prep hair for twists, braids, or wash-and-go styles.',
    botanicals: ['Aloe Vera', 'Ayurvedic Infusions', 'Botanical Humectants'],
    ritual:
      'Pump into palms and work evenly through damp or refreshed hair before sealing with Hair Butter or Hair Growth Oil.',
    imageSrc: '/src/assets/images/leave_in_enhanced_1794760519265.jpg',
    featured: true,
    variants: [
      { id: 'adult-leavein-250', sizeLabel: '250ml', priceNgn: 6000, inStock: true },
    ],
  },
  {
    id: 'bn-adult-hair-butter',
    slug: 'moisturizing-hair-butter',
    name: 'Moisturizing Hair Butter',
    line: 'adult',
    category: 'Moisture & Masks',
    shortNote: 'Moisture lock whipped butter for soft strands, natural shine, and edge care.',
    description:
      'Whipped sealing butter enriched with unrefined shea butter, coconut oil, olive oil, and Ayurvedic herbs to lock in hydration and reduce breakage.',
    botanicals: ['Shea Butter', 'Coconut Oil', 'Olive Oil', 'Ayurvedic Herbs'],
    ritual:
      'Warm a small scoop between your palms and smooth over damp, leave-in conditioned hair to seal in moisture.',
    imageSrc: '/src/assets/images/hair_butter_enhanced_1794760520413.jpg',
    featured: true,
    variants: [
      { id: 'adult-butter-250', sizeLabel: '250g', priceNgn: 6500, inStock: true },
    ],
  },
  {
    id: 'bn-adult-growth-oil',
    slug: 'ayurvedic-hair-growth-oil',
    name: 'Ayurvedic Hair Growth Oil',
    line: 'adult',
    category: 'Scalp & Roots',
    shortNote: 'Infused with fenugreek, moringa, and amla extracts for active root nourishment.',
    description:
      'Precision-nozzle botanical oil steeped with fenugreek seeds, moringa leaf, and amla extracts to stimulate scalp circulation and strengthen edges.',
    botanicals: ['Fenugreek', 'Moringa Extract', 'Amla Extract', 'Carrier Oils'],
    ritual:
      'Use the pointed applicator tip to apply directly along scalp parts three times weekly and massage gently for two minutes.',
    imageSrc: '/src/assets/images/growth_oil_enhanced_1794760521737.jpg',
    featured: true,
    variants: [
      { id: 'adult-oil-100', sizeLabel: '100ml', priceNgn: 7000, inStock: true },
    ],
  },
  {
    id: 'bn-adult-booster-cream',
    slug: 'ayurvedic-hair-booster-cream',
    name: 'Ayurvedic Hair Booster Cream',
    line: 'adult',
    category: 'Moisture & Masks',
    shortNote: 'For thicker, fuller hair; nourishes, strengthens, and reduces breakage.',
    description:
      'Dense botanical treatment cream formulated to fortify thinning areas, reduce mechanical breakage, and promote thicker, fuller-looking hair.',
    botanicals: ['Fenugreek', 'Amla', 'Shea Butter', 'Ayurvedic Extracts'],
    ritual:
      'Part hair cleanly and massage a modest amount into scalp and weak spots 3 to 4 times weekly.',
    imageSrc: '/src/assets/images/booster_cream_enhanced_1794760522201.jpg',
    featured: false,
    variants: [
      { id: 'adult-booster-300', sizeLabel: '300g', priceNgn: 8000, inStock: true },
    ],
  },
  {
    id: 'bn-adult-hair-balm',
    slug: 'anti-dandruff-scalp-care-balm',
    name: 'Anti-Dandruff Scalp Care Balm',
    line: 'adult',
    category: 'Scalp & Roots',
    shortNote: 'Targeted herbal scalp care balm to calm flaking and protect dry roots.',
    description:
      'Concentrated soothing scalp balm crafted with cooling botanicals to relieve stubborn dandruff, protect dry scalp patches, and support healthy hair growth.',
    botanicals: ['Neem', 'Tea Tree', 'Peppermint', 'Herbal Balm Base'],
    ritual:
      'Part clean hair and apply a thin layer directly to the scalp, focusing on dry or flaky zones.',
    imageSrc: '/src/assets/images/scalp_balm_enhanced_1794760522893.jpg',
    featured: false,
    variants: [
      { id: 'adult-balm-300', sizeLabel: '300g', priceNgn: 8000, inStock: true },
    ],
  },
  {
    id: 'bn-adult-bentonite-clay',
    slug: 'bentonite-clay-mask',
    name: 'Bentonite Clay Mask',
    line: 'adult',
    category: 'Cleanse',
    shortNote: '100% Pure Bentonite Clay for deep scalp, hair, and skin detox.',
    description:
      'Mineral-rich 100% pure bentonite clay with zero additives. Draws out toxins, excess sebum, and heavy product build-up while boosting curl definition and scalp clarity.',
    botanicals: ['100% Pure Bentonite Clay'],
    ritual:
      'Whisk 2 to 3 tablespoons with warm water or apple cider vinegar in a non-metal bowl until smooth. Apply to damp hair, rest for 15 minutes, and rinse.',
    imageSrc: '/src/assets/images/bentonite_clay_enhanced_1794760523082.jpg',
    featured: false,
    variants: [
      { id: 'adult-bentonite-100', sizeLabel: '100g', priceNgn: 2000, inStock: true },
    ],
  },
  {
    id: 'bn-adult-herbs-mix',
    slug: 'ayurvedic-herbs-mix',
    name: 'Ayurvedic Herbs Mix',
    line: 'adult',
    category: 'Scalp & Roots',
    shortNote: 'Finely milled Ayurvedic herbal blend for custom oil infusions, teas, and hair masks.',
    description:
      'Concentrated dry botanical blend of traditional Ayurvedic herbs ready to steep into warm carrier oils, herbal hair rinses, or deep conditioning pastes.',
    botanicals: ['Amla', 'Fenugreek', 'Hibiscus', 'Neem', 'Bhringraj'],
    ritual:
      'Steep 2 tablespoons in warm water as a strengthening hair rinse or blend into deep conditioner and carrier oils.',
    imageSrc: '/src/assets/images/ayurvedic_herbs_mix_mockup_1794759044131.jpg',
    featured: false,
    variants: [
      { id: 'adult-herbs-100', sizeLabel: '100g', priceNgn: 8000, inStock: true },
    ],
  },
  {
    id: 'bn-adult-temp-colors',
    slug: 'temporary-hair-colors',
    name: 'Temporary Hair Colors',
    line: 'adult',
    category: 'Daily Styling',
    shortNote: 'Wash-out botanical styling pigment wax for vibrant, damage-free curl color.',
    description:
      'Conditioning temporary hair color formulated to coat curls and twists with rich, vivid pigment that rinses out cleanly on your next wash day without bleach.',
    botanicals: ['Shea Butter', 'Botanical Wax', 'Cosmetic Mineral Pigments'],
    ritual:
      'Apply evenly onto damp, moisturized sections after Leave-In Conditioner and allow to dry before fluffing curls.',
    imageSrc: '/src/assets/images/temporary_hair_colors_mockup_1794759043962.jpg',
    featured: false,
    variants: [
      { id: 'adult-colors-100', sizeLabel: '100g', priceNgn: 5000, inStock: true },
    ],
  },
  {
    id: 'bn-adult-derma-roller',
    slug: 'derma-roller-system',
    name: 'Derma Roller System',
    line: 'adult',
    category: 'Scalp & Roots',
    shortNote: 'Precision scalp microneedling tool to stimulate thinning edges and support oil absorption.',
    description:
      'Sterile-packaged 0.5mm titanium microneedle Derma Roller System crafted to gently stimulate dormant follicles along thinning hairlines and crown areas prior to applying Ayurvedic Hair Growth Oil.',
    botanicals: ['0.5mm Titanium Micro-Needles', 'Protective Storage Case'],
    ritual:
      'Sanitize roller head with rubbing alcohol before each use. Gently roll horizontally and vertically 3 to 4 times over clean scalp or sparse edges twice weekly, then follow with Ayurvedic Hair Growth Oil.',
    imageSrc: '/src/assets/images/derma_roller_enhanced_1794760515818.jpg',
    featured: false,
    variants: [
      { id: 'adult-derma-roller-1', sizeLabel: '1 Unit', priceNgn: 8000, inStock: true },
    ],
  },

  // =========================================================================
  // KIDDIES SESSION (5 products)
  // =========================================================================
  {
    id: 'bn-kiddies-shampoo',
    slug: 'kiddies-nature-pop-conditioning-sample',
    name: 'Kiddies Nature Pop Conditioning Sample',
    line: 'kiddies',
    category: 'Cleanse',
    shortNote: 'Gentle children’s conditioning shampoo formulated with aloe and lavender.',
    description:
      'Mild, soothing wash-day cleanser created specifically for children’s tender scalps and delicate coils. Enriched with fresh aloe and calming lavender.',
    botanicals: ['Aloe Vera', 'Lavender', 'Gentle Botanical Cleansers'],
    ritual:
      'Wet child’s hair thoroughly with warm water, massage gently into scalp and curls, and rinse clean.',
    imageSrc: '/src/assets/images/kiddies_shampoo_enhanced_1794760522719.jpg',
    featured: true,
    variants: [
      { id: 'kiddies-shampoo-250', sizeLabel: '250ml', priceNgn: 5500, inStock: true },
    ],
  },
  {
    id: 'bn-kiddies-leave-in',
    slug: 'kiddies-nature-bloom-leave-in-conditioner',
    name: 'Kiddies Nature Bloom Leave-In Conditioner',
    line: 'kiddies',
    category: 'Daily Styling',
    shortNote: 'With honey and coconut for soft, moisturized puffs, twists, and braids.',
    description:
      'Nourishing daily leave-in conditioner made with raw honey and coconut milk to keep children’s curls hydrated and easy to comb throughout the school week.',
    botanicals: ['Raw Honey', 'Coconut', 'Plant Humectants'],
    ritual:
      'Smooth evenly through damp or misted hair before braiding or styling. Do not rinse out.',
    imageSrc: '/src/assets/images/kiddies_leavein_enhanced_1794760524912.jpg',
    featured: true,
    variants: [
      { id: 'kiddies-leavein-250', sizeLabel: '250ml', priceNgn: 5500, inStock: true },
    ],
  },
  {
    id: 'bn-kiddies-rinse-out',
    slug: 'kiddies-nature-melt-rinse-out-conditioner',
    name: 'Kiddies Nature Melt Rinse-Out Conditioner',
    line: 'kiddies',
    category: 'Moisture & Masks',
    shortNote: 'With oats and shea butter for slip-rich, knot-free wash day detangling.',
    description:
      'Creamy rinse-out conditioner enriched with colloidal oats and unrefined shea butter to melt tangles and keep children’s curls soft and manageable.',
    botanicals: ['Oats', 'Shea Butter', 'Botanical Emollients'],
    ritual:
      'Apply generously to freshly cleansed hair, finger-detangle from ends upward, rest for 3 minutes, and rinse.',
    imageSrc: '/src/assets/images/kiddies_rinseout_enhanced_1794760524283.jpg',
    featured: true,
    variants: [
      { id: 'kiddies-rinse-250', sizeLabel: '250ml', priceNgn: 5500, inStock: true },
    ],
  },
  {
    id: 'bn-kiddies-butter',
    slug: 'kiddies-nature-shield-anti-bald-hair-butter',
    name: 'Kiddies Nature Shield Anti Bald Hair Butter',
    line: 'kiddies',
    category: 'Moisture & Masks',
    shortNote: 'Ultra-protection shea, almond, and lavender butter for fragile spots and edges.',
    description:
      'Rich ultra-protection whipped butter combining unrefined shea butter, sweet almond oil, and calming lavender to cushion delicate edges and bald patches.',
    botanicals: ['Shea Butter', 'Sweet Almond Oil', 'Lavender', 'Vitamin E'],
    ritual:
      'Apply a pea-sized amount over Leave-In Conditioner or directly onto delicate scalp areas to seal in moisture.',
    imageSrc: '/src/assets/images/kiddies_butter_enhanced_1794760525588.jpg',
    featured: true,
    variants: [
      { id: 'kiddies-butter-150', sizeLabel: '150g', priceNgn: 5500, inStock: true },
    ],
  },
  {
    id: 'bn-kiddies-growth-oil',
    slug: 'kiddies-hair-growth-oil',
    name: 'Kiddies Hair Growth Oil',
    line: 'kiddies',
    category: 'Scalp & Roots',
    shortNote: 'Gentle herbal scalp oil with easy applicator nozzle for children’s hair.',
    description:
      'Lightweight, child-safe botanical oil blend packaged in a pointed applicator bottle to nourish children’s scalps and seal moisture into braids and puffs.',
    botanicals: ['Sweet Almond Oil', 'Jojoba Oil', 'Chamomile', 'Vitamin E'],
    ritual:
      'Apply a few drops directly along the scalp and massage lightly with fingertips three times weekly.',
    imageSrc: '/src/assets/images/kiddies_oil_enhanced_1794760525511.jpg',
    featured: false,
    variants: [
      { id: 'kiddies-oil-50', sizeLabel: '50ml', priceNgn: 4000, inStock: true },
    ],
  },

  // =========================================================================
  // COMBO SESSION (9 exact sets & kits)
  // =========================================================================
  {
    id: 'bn-combo-volumizing-set',
    slug: 'volumizing-set',
    name: 'Volumizing Set',
    line: 'combo',
    category: 'Moisture & Masks',
    shortNote: 'Moisturizing Black Shampoo, Keratin Repair Deep Conditioner, Hair Butter, Leave-In, and Growth Oil.',
    description:
      'Five-piece protein-and-moisture wash day set pairing Moisturizing Black Shampoo and Keratin Repair Deep Conditioner with Moisturizing Hair Butter, Ayurvedic Leave-In Conditioner (Extra Luster), and Ayurvedic Hair Growth Oil.',
    botanicals: ['Hydrolyzed Keratin', 'Aloe & Honey', 'Shea Butter', 'Fenugreek'],
    includes: [
      'Moisturizing Black Shampoo (250ml)',
      'Keratin Repair Deep Conditioner (250g)',
      'Moisturizing Hair Butter (250g)',
      'Ayurvedic Leave-In Conditioner (Extra Luster) (250ml)',
      'Ayurvedic Hair Growth Oil (100ml)',
    ],
    ritual:
      'Cleanse with Moisturizing Black Shampoo, strengthen with Keratin Repair Deep Conditioner, layer Ayurvedic Leave-In Conditioner, seal with Moisturizing Hair Butter, and massage Ayurvedic Hair Growth Oil along scalp parts.',
    imageSrc: '/assets/aistudio/IMG-20261003-WA0008_2ebc23ac.jpg',
    featured: true,
    variants: [
      { id: 'combo-volumizing-5pc', sizeLabel: '5-Piece Set', priceNgn: 33000, inStock: true },
    ],
  },
  {
    id: 'bn-combo-basic-set',
    slug: 'basic-set',
    name: 'Basic Set',
    line: 'combo',
    category: 'Moisture & Masks',
    shortNote: 'Volumizing Set essentials plus a second Moisturizing Hair Butter for extended sealing.',
    description:
      'Six-piece routine combining Moisturizing Black Shampoo, Keratin Repair Deep Conditioner, Ayurvedic Leave-In Conditioner (Extra Luster), Ayurvedic Hair Growth Oil, and two jars of Moisturizing Hair Butter.',
    botanicals: ['Hydrolyzed Keratin', 'Aloe & Honey', 'Shea Butter', 'Amla Extract'],
    includes: [
      'Moisturizing Black Shampoo (250ml)',
      'Keratin Repair Deep Conditioner (250g)',
      'Moisturizing Hair Butter (250g) × 2',
      'Ayurvedic Leave-In Conditioner (Extra Luster) (250ml)',
      'Ayurvedic Hair Growth Oil (100ml)',
    ],
    ritual:
      'Follow your wash-day cleanse and keratin deep condition with Leave-In Conditioner, then use the extra Moisturizing Hair Butter for mid-week moisture refreshes and protective styling.',
    imageSrc: '/assets/aistudio/IMG-20261003-WA0005_eebb5ec0.jpg',
    featured: false,
    variants: [
      { id: 'combo-basic-6pc', sizeLabel: '6-Piece Set', priceNgn: 39500, inStock: true },
    ],
  },
  {
    id: 'bn-combo-mini-hair-growth-kit',
    slug: 'mini-hair-growth-kit',
    name: 'Mini Hair Growth Kit',
    line: 'combo',
    category: 'Scalp & Roots',
    shortNote: 'Anti-Itch Hydrating Hair Mist, Hair Booster Cream, Growth Oil, and Derma Roller System.',
    description:
      'Targeted four-piece root stimulation and edges recovery kit combining Ayurvedic Anti-Itch Hydrating Hair Mist, Ayurvedic Hair Booster Cream, Ayurvedic Hair Growth Oil, and the Derma Roller System.',
    botanicals: ['Tea Tree Extract', 'Fenugreek', 'Moringa', 'Amla Extract'],
    includes: [
      'Ayurvedic Anti-Itch Hydrating Hair Mist (250ml)',
      'Ayurvedic Hair Booster Cream (300g)',
      'Ayurvedic Hair Growth Oil (100ml)',
      'Derma Roller System',
    ],
    ritual:
      'Refresh scalp with Anti-Itch Hydrating Hair Mist, gently roll sparse hairline areas as directed, massage in Ayurvedic Hair Growth Oil, and seal with Ayurvedic Hair Booster Cream.',
    imageSrc: '/assets/aistudio/IMG-20261003-WA0010_5a71abfc.jpg',
    featured: true,
    variants: [
      { id: 'combo-mini-growth-4pc', sizeLabel: '4-Piece Kit', priceNgn: 29500, inStock: true },
    ],
  },
  {
    id: 'bn-combo-standard-hair-growth-kit',
    slug: 'standard-hair-growth-kit',
    name: 'Standard Hair Growth Kit',
    line: 'combo',
    category: 'Daily Styling',
    shortNote: 'Complete Basic Set plus Clarifying Shampoo (Anti-Dandruff) and Anti-Itch Hydrating Hair Mist.',
    description:
      'Eight-piece full wash and scalp-hydration kit uniting the entire Basic Set (with two Moisturizing Hair Butters) alongside Clarifying Shampoo (Anti-Dandruff) and Ayurvedic Anti-Itch Hydrating Hair Mist.',
    botanicals: ['Tea Tree', 'Aloe & Honey', 'Keratin', 'Shea Butter'],
    includes: [
      'Clarifying Shampoo (Anti-Dandruff) (250ml)',
      'Moisturizing Black Shampoo (250ml)',
      'Keratin Repair Deep Conditioner (250g)',
      'Moisturizing Hair Butter (250g) × 2',
      'Ayurvedic Leave-In Conditioner (Extra Luster) (250ml)',
      'Ayurvedic Hair Growth Oil (100ml)',
      'Ayurvedic Anti-Itch Hydrating Hair Mist (250ml)',
    ],
    ritual:
      'Alternate Clarifying Shampoo and Black Shampoo based on scalp build-up, deep condition with Keratin Repair, and maintain daily hydration with Mist, Leave-In, Butter, and Growth Oil.',
    imageSrc: '/assets/aistudio/IMG-20261003-WA0009_1596c272.jpg',
    featured: false,
    variants: [
      { id: 'combo-standard-growth-8pc', sizeLabel: '8-Piece Kit', priceNgn: 53000, inStock: true },
    ],
  },
  {
    id: 'bn-combo-anti-dandruff-kit',
    slug: 'anti-dandruff-kit',
    name: 'Anti-Dandruff Kit',
    line: 'combo',
    category: 'Cleanse',
    shortNote: 'Seven-piece scalp detox & flake-control routine with Clarifying Shampoo, Balm, and Bentonite Clay.',
    description:
      'Seven-piece targeted scalp reset bundle pairing Clarifying Shampoo (Anti-Dandruff), Ayurvedic Anti-Dandruff Hair Balm, and Bentonite Clay Mask with Moisturizing Hair Butter, Keratin Repair Deep Conditioner, Leave-In Conditioner, and Anti-Itch Hydrating Hair Mist.',
    botanicals: ['Bentonite Clay', 'Tea Tree', 'Neem', 'Keratin'],
    includes: [
      'Clarifying Shampoo (Anti-Dandruff) (250ml)',
      'Ayurvedic Anti-Dandruff Hair Balm (300g)',
      'Bentonite Clay Mask (100g)',
      'Moisturizing Hair Butter (250g)',
      'Keratin Repair Deep Conditioner (250g)',
      'Ayurvedic Leave-In Conditioner (Extra Luster) (250ml)',
      'Ayurvedic Anti-Itch Hydrating Hair Mist (250ml)',
    ],
    ritual:
      'Detox with Bentonite Clay Mask, wash with Clarifying Shampoo, strengthen strands with Keratin Repair, hydrate with Leave-In and Mist, and soothe scalp with Anti-Dandruff Hair Balm.',
    imageSrc: '/assets/aistudio/IMG-20261003-WA0006_363bc44f.jpg',
    featured: true,
    variants: [
      { id: 'combo-anti-dandruff-7pc', sizeLabel: '7-Piece Kit', priceNgn: 43500, inStock: true },
    ],
  },
  {
    id: 'bn-combo-edges-combo',
    slug: 'edges-combo',
    name: 'Edges Combo',
    line: 'combo',
    category: 'Scalp & Roots',
    shortNote: 'Ayurvedic Hair Growth Oil paired with the Derma Roller System for edge care.',
    description:
      'Focused two-piece edges and hairline stimulation duo combining Ayurvedic Hair Growth Oil with the Derma Roller System.',
    botanicals: ['Fenugreek', 'Moringa', 'Amla Extract'],
    includes: [
      'Ayurvedic Hair Growth Oil (100ml)',
      'Derma Roller System',
    ],
    ritual:
      'Gently roll along sparse hairline zones as directed, then apply a few drops of Ayurvedic Hair Growth Oil and massage with fingertips.',
    imageSrc: '/assets/aistudio/IMG-20261003-WA0010_5a71abfc.jpg',
    featured: false,
    variants: [
      { id: 'combo-edges-2pc', sizeLabel: '2-Piece Combo', priceNgn: 15000, inStock: true },
    ],
  },
  {
    id: 'bn-combo-moisture-reset-kit',
    slug: 'moisture-reset-kit',
    name: 'Moisture Reset Kit',
    line: 'combo',
    category: 'Moisture & Masks',
    shortNote: 'Five-piece intense hydration wash-day kit with Deep Conditioning Treatment and Hair Butter.',
    description:
      'Five-piece moisture restoration bundle built around Moisturizing Black Shampoo, Moisturizing Deep Conditioning Treatment, Moisturizing Hair Butter, Ayurvedic Leave-In Conditioner (Extra Luster), and Ayurvedic Hair Growth Oil.',
    botanicals: ['Aloe & Honey', 'Shea Butter', 'Coconut Oil', 'Amla Extract'],
    includes: [
      'Moisturizing Black Shampoo (250ml)',
      'Moisturizing Hair Butter (250g)',
      'Moisturizing Deep Conditioning Treatment (250g)',
      'Ayurvedic Leave-In Conditioner (Extra Luster) (250ml)',
      'Ayurvedic Hair Growth Oil (100ml)',
    ],
    ritual:
      'Wash gently with Moisturizing Black Shampoo, deep condition for 25 minutes with Moisturizing Deep Conditioning Treatment, layer Leave-In Conditioner, and seal with Hair Butter and Growth Oil.',
    imageSrc: '/assets/aistudio/IMG-20261003-WA0007_6cfa5b6a.jpg',
    featured: true,
    variants: [
      { id: 'combo-moisture-reset-5pc', sizeLabel: '5-Piece Kit', priceNgn: 32000, inStock: true },
    ],
  },
  {
    id: 'bn-combo-complete-haircare-set',
    slug: 'complete-haircare-set',
    name: 'Complete Haircare Set',
    line: 'combo',
    category: 'Daily Styling',
    shortNote: 'Full eleven-piece Adult treatment collection from Bentonite Clay Mask to Growth Oil.',
    description:
      'Complete eleven-piece Bev Naturals Adult haircare collection covering clarifying and moisturizing shampoos, both deep conditioners, leave-in conditioner, butter, booster cream, anti-dandruff balm, bentonite clay, hydrating mist, and growth oil (Derma Roller not included).',
    botanicals: ['Bentonite Clay', 'Ayurvedic Herbs', 'Keratin', 'Shea Butter'],
    includes: [
      'Clarifying Shampoo (Anti-Dandruff) (250ml)',
      'Moisturizing Black Shampoo (250ml)',
      'Keratin Repair Deep Conditioner (250g)',
      'Moisturizing Deep Conditioning Treatment (250g)',
      'Ayurvedic Anti-Itch Hydrating Hair Mist (250ml)',
      'Ayurvedic Leave-In Conditioner (Extra Luster) (250ml)',
      'Moisturizing Hair Butter (250g)',
      'Ayurvedic Hair Growth Oil (100ml)',
      'Ayurvedic Hair Booster Cream (300g)',
      'Ayurvedic Anti-Dandruff Hair Balm (300g)',
      'Bentonite Clay Mask (100g)',
    ],
    ritual:
      'Everything needed for detox wash days, alternating moisture and protein masks, daily mist hydration, scalp care, and growth sealing.',
    imageSrc: '/assets/aistudio/IMG-20261003-WA0003_f717a6bf.jpg',
    featured: true,
    variants: [
      { id: 'combo-complete-11pc', sizeLabel: '11-Piece Set', priceNgn: 71000, inStock: true },
    ],
  },
  {
    id: 'bn-combo-complete-kiddies-set',
    slug: 'complete-kiddies-set',
    name: 'Complete Kiddies Set',
    line: 'combo',
    category: 'Daily Styling',
    shortNote: 'Full five-piece Kiddies NaturePop & NatureShield wash-day and styling set.',
    description:
      'Gentle five-piece children’s haircare bundle bringing together Kiddies NaturePop Conditioning Shampoo, Kiddies Naturebloom Leave-In Conditioner, Kiddies NatureMelt Rinse-Out Conditioner, Kiddies NatureShield Anti-Bald Hair Butter, and Kiddies Hair Growth Oil.',
    botanicals: ['Aloe & Lavender', 'Honey & Coconut', 'Oats & Shea Butter', 'Sweet Almond'],
    includes: [
      'Kiddies NaturePop Conditioning Shampoo (250ml)',
      'Kiddies Naturebloom Leave-In Conditioner (250ml)',
      'Kiddies NatureMelt Rinse-Out Conditioner (250ml)',
      'Kiddies NatureShield Anti-Bald Hair Butter (150g)',
      'Kiddies Hair Growth Oil (50ml)',
    ],
    ritual:
      'Cleanse gently with NaturePop Shampoo, detangle with NatureMelt Rinse-Out Conditioner, hydrate with Naturebloom Leave-In Conditioner, and seal with NatureShield Hair Butter and Kiddies Hair Growth Oil.',
    imageSrc: '/src/assets/images/kiddies_shampoo_enhanced_1794760522719.jpg',
    featured: true,
    variants: [
      { id: 'combo-kiddies-5pc', sizeLabel: '5-Piece Set', priceNgn: 26000, inStock: true },
    ],
  },
];

export function getLineLabel(line: Product['line']): string {
  if (line === 'adult') return 'Adult';
  if (line === 'kiddies') return 'Kiddies';
  return 'Combo';
}

export function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function findProductBySlug(slug: string): Product | undefined {
  return CATALOG.find((p) => p.slug === slug);
}

export function findProductAndVariant(
  productId: string,
  variantId: string
): { product: Product; variant: Product['variants'][number] } | null {
  const product = CATALOG.find((p) => p.id === productId);
  if (!product) return null;
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return null;
  return { product, variant };
}
