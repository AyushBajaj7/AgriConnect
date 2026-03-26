/**
 * File: schemeService.js
 * Description: Dataset of 35 Indian government agricultural schemes with
 *              live-style status (ongoing / upcoming / completed), ministry,
 *              budget, and deadline. Ongoing schemes are sorted first.
 * Used in: pages/GovernmentSchemes/GovernmentSchemes.js
 *          pages/SchemeDetails/SchemeDetails.js
 */

/**
 * Status ordering for scheme sorting: ongoing → upcoming → completed.
 * @type {Record<string, number>}
 */
const STATUS_ORDER = { ongoing: 0, upcoming: 1, completed: 2 };

const SCHEMES_RAW = [
  // ── ONGOING ──────────────────────────────────────────────────────────────────
  { id:1,  title:'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',          status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹60,000 Cr / yr',  deadline:'Ongoing',        beneficiaries:'11 Cr+ farmers',   description:'Provides ₹6,000 annually in three equal installments of ₹2,000 as direct income support to all small and marginal farmer families across India.' },
  { id:2,  title:'Pradhan Mantri Fasal Bima Yojana (PMFBY)',              status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹15,500 Cr / yr',  deadline:'Ongoing',        beneficiaries:'5.5 Cr farmers',   description:'Crop insurance scheme covering rabi and kharif crops at low premium rates (2% for Kharif, 1.5% for Rabi) to protect farmers from natural calamity losses.' },
  { id:3,  title:'PM-KUSUM Scheme',                                        status:'ongoing',   ministry:'New & Renewable Energy',        budget:'₹34,035 Cr',       deadline:'Mar 2026',       beneficiaries:'35 Lakh farmers',  description:'Subsidises solar pumps and grid-connected solar power plants for farmers. Covers up to 60% of pump cost under Component-A; farmers earn extra income from grid exports.' },
  { id:4,  title:'Kisan Credit Card (KCC) Scheme',                         status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹2 Lakh Cr credit',deadline:'Ongoing',        beneficiaries:'7 Cr+ farmers',    description:'Provides flexible short-term credit at subsidised 4% interest rate (after 3% interest subvention) for seeds, fertilizers, pesticides, and allied activities.' },
  { id:5,  title:'Soil Health Card Scheme',                                status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹368 Cr',          deadline:'Ongoing',        beneficiaries:'22 Cr farmers',    description:'Issues biennial soil health cards to farmers with crop-wise nutrient recommendations, helping optimize fertilizer use and improve soil productivity.' },
  { id:6,  title:'National Agriculture Market (e-NAM)',                    status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹415 Cr',          deadline:'Ongoing',        beneficiaries:'1,000+ mandis',    description:'National electronic trading portal linking 1,000+ APMC mandis for unified national market. Ensures transparent price discovery and direct access to buyers.' },
  { id:7,  title:'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',        status:'ongoing',   ministry:'Jal Shakti / Agriculture',      budget:'₹93,068 Cr',       deadline:'Mar 2026',       beneficiaries:'7 Lakh+ hectares', description:'Aims for "Har Khet Ko Pani, More Crop Per Drop" — ensures water access to every farm, promotes drip/sprinkler micro-irrigation for water-use efficiency.' },
  { id:8,  title:'Rashtriya Krishi Vikas Yojana (RKVY)',                  status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹10,433 Cr',       deadline:'Mar 2026',       beneficiaries:'All states',       description:'Provides state governments flexibility to choose projects for holistic agricultural development including infrastructure, innovation, and allied sectors.' },
  { id:9,  title:'Paramparagat Krishi Vikas Yojana (PKVY)',               status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹2,481 Cr',        deadline:'Mar 2026',       beneficiaries:'5 Lakh+ farmers',  description:'Promotes certified organic farming through cluster approach (50 farmers/cluster), covering 3-year conversion costs and linking farmers with organic markets.' },
  { id:10, title:'Agriculture Infrastructure Fund (AIF)',                  status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹1 Lakh Cr',       deadline:'Mar 2029',       beneficiaries:'FPOs, PACs',       description:'Provides medium to long-term debt financing at 3% interest subvention for post-harvest infrastructure: cold storage, warehouses, sorting units, and primary processing.' },
  { id:11, title:'Drones for Precision Farming',                           status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹1,261 Cr',        deadline:'Mar 2026',       beneficiaries:'1 Lakh+ villages', description:'Subsidises 40–100% of agricultural drone cost for FPOs, cooperatives, and agencies. Enables precision spray of fertilizers, pesticides, and crop monitoring.' },
  { id:12, title:'Farmer Producer Organization (FPO) Promotion',          status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹6,865 Cr',        deadline:'Mar 2028',       beneficiaries:'10,000 FPOs',      description:'Sets up 10,000 new FPOs to give small farmers collective bargaining power, better access to inputs at lower cost, and direct market linkage with ₹18 Lakh grant.' },
  { id:13, title:'National Horticulture Mission (NHM)',                    status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹2,600 Cr / yr',   deadline:'Ongoing',        beneficiaries:'Horticulture farmers',description:'Promotes holistic development of horticulture — fruits, vegetables, spices, mushrooms — with subsidies for planting material, protected cultivation, and storage.' },
  { id:14, title:'National Mission for Sustainable Agriculture (NMSA)',   status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹1,492 Cr',        deadline:'Mar 2026',       beneficiaries:'Dryland farmers',  description:'Enhances agricultural productivity in rain-fed areas through soil health management, integrated farming, water conservation, and climate adaptation practices.' },
  { id:15, title:'PM Matsya Sampada Yojana',                              status:'ongoing',   ministry:'Fisheries, Animal & Dairying',  budget:'₹20,050 Cr',       deadline:'Mar 2025',       beneficiaries:'55 Lakh fishers',  description:'Flagship fisheries scheme providing subsidies for fish production, aquaculture, infrastructure, cold chain, and fish farmer welfare across coastal and inland areas.' },
  { id:16, title:'Rashtriya Gokul Mission (RGM)',                         status:'ongoing',   ministry:'Fisheries, Animal & Dairying',  budget:'₹2,400 Cr',        deadline:'Mar 2026',       beneficiaries:'Cattle farmers',   description:'Conserves and develops indigenous bovine breeds (Gir, Sahiwal, Rathi) and improves genetic quality through bull mother farms and semen stations.' },
  { id:17, title:'Pradhan Mantri Kisan Mandhan Yojana',                   status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹10,774 Cr',       deadline:'Ongoing',        beneficiaries:'5 Cr farmers by 2027',description:'Voluntary pension scheme for small and marginal farmers. Both farmer and government contribute equally. Farmer receives ₹3,000/month guaranteed pension after age 60.' },
  { id:18, title:'Sub-Mission on Agricultural Mechanization (SMAM)',       status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹3,500 Cr',        deadline:'Mar 2026',       beneficiaries:'Small & marginal farmers',description:'Provides 40–80% subsidy on tractors, power tillers, harvesters, and other farm machinery to small and SC/ST farmers to improve farm productivity.' },

  // ── UPCOMING ─────────────────────────────────────────────────────────────────
  { id:19, title:'Digital Agriculture Mission 2025–2030',                 status:'upcoming',  ministry:'Agriculture & Farmers Welfare', budget:'₹2,817 Cr',        deadline:'Launch: 2025',   beneficiaries:'All farmers',      description:'Creates AgriStack — a unified digital platform with farmer IDs, soil profiles, satellite crop monitoring, and AI-driven advisory services for all Indian farmers.' },
  { id:20, title:'Natural Farming National Mission',                       status:'upcoming',  ministry:'Agriculture & Farmers Welfare', budget:'₹2,481 Cr',        deadline:'2025–2027',      beneficiaries:'1 Cr farmers',     description:'Promotes zero-budget natural farming (ZBNF) with full coverage of conversion costs, on-farm input production training, and market linkage for natural produce.' },
  { id:21, title:'Nano Urea & Nano DAP Policy 2025',                      status:'upcoming',  ministry:'Chemicals & Fertilizers',       budget:'₹6,200 Cr subsidy', deadline:'Q2 2025',        beneficiaries:'All farmers',      description:'Mandates adoption of IFFCO Nano Urea and Nano DAP to reduce conventional fertilizer use by 50%, lower soil degradation, and cut import costs.' },
  { id:22, title:'AgriSURE Fund (Agri-Startups)',                         status:'upcoming',  ministry:'Agriculture & Farmers Welfare', budget:'₹750 Cr',           deadline:'2025',           beneficiaries:'Agri-startups',    description:'Dedicated ₹750 Cr fund to back agri-tech and agri-infra startups with equity and debt support, accelerating innovation in Indian agriculture.' },
  { id:23, title:'One District One Product (Agri Focus)',                 status:'upcoming',  ministry:'Commerce & Industry',           budget:'₹5,000 Cr',         deadline:'2025–2026',      beneficiaries:'300+ districts',   description:'Extends ODOP to agriculture, promoting one specialty crop per district for GI tagging, branding, and export market development.' },

  // ── COMPLETED ────────────────────────────────────────────────────────────────
  { id:24, title:'National Food Security Mission (NFSM)',                 status:'completed', ministry:'Agriculture & Farmers Welfare', budget:'₹6,893 Cr',        deadline:'Mar 2022',       beneficiaries:'20 Lakh farmers',  description:'Boosted production of rice, wheat, and pulses through area expansion and productivity improvement. Achieved targets and integrated into RKVY from 2022–23.' },
  { id:25, title:'Krishi Unnati Yojana (KUY)',                            status:'completed', ministry:'Agriculture & Farmers Welfare', budget:'₹44,323 Cr',       deadline:'Mar 2020',       beneficiaries:'All states',       description:'Umbrella scheme integrating multiple missions for green revolution — seed development, crop insurance base, and irrigation. Merged into RKVY and standalone missions.' },
  { id:26, title:'Interest Subvention Scheme (ISS) — Standalone',        status:'completed', ministry:'Agriculture & Farmers Welfare', budget:'₹19,468 Cr',       deadline:'Mar 2022',       beneficiaries:'Farmers with KCC', description:'Provided 2% interest subvention + 3% prompt-repayment incentive on short-term crop loans. Benefits merged into the enhanced KCC scheme from 2022–23.' },
  { id:27, title:'Agri-Market Infrastructure Fund (AMIF)',                status:'completed', ministry:'Agriculture & Farmers Welfare', budget:'₹2,000 Cr',        deadline:'Mar 2022',       beneficiaries:'APMC mandis',      description:'Funded development and upgrading of agricultural marketing infrastructure in Gramin Haats and APMC mandis. Successfully completed; superseded by AIF.' },
  { id:28, title:'Pradhan Mantri Annadata Aay Sanrakshan Abhiyan (PM-AASHA)',status:'completed',ministry:'Agriculture & Farmers Welfare',budget:'₹15,053 Cr',     deadline:'Mar 2023',       beneficiaries:'Oilseed, pulse farmers',description:'Price support scheme for oilseeds and pulses during deficit market periods. Operations absorbed into NAFED procurement and eNAM from 2023–24.' },

  // Additional ongoing schemes
  { id:29, title:'Dairy Entrepreneurship Development Scheme (DEDS)',      status:'ongoing',   ministry:'Fisheries, Animal & Dairying',  budget:'₹325 Cr',          deadline:'Ongoing',        beneficiaries:'Dairy farmers',    description:'Provides financial assistance (25–33% back-end subsidy) to establish modern dairy farms, purchase quality milch animals, and set up milk processing units.' },
  { id:30, title:'Seed Village Scheme',                                   status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹100 Cr',          deadline:'Ongoing',        beneficiaries:'Seed villages',    description:'Trains farmers to produce quality seeds within villages, reducing dependency on commercial seeds, cutting costs, and ensuring timely availability of suited varieties.' },
  { id:31, title:'Organic Farming Certification Support',                 status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹460 Cr',          deadline:'Mar 2026',       beneficiaries:'1 Lakh+ farmers',  description:'Covers the cost of PGS-India and third-party certification for organic farmers, making certified organic produce eligible for premium market prices and exports.' },
  { id:32, title:'National Beekeeping & Honey Mission (NBHM)',            status:'ongoing',   ministry:'Agriculture & Farmers Welfare', budget:'₹500 Cr',          deadline:'Mar 2026',       beneficiaries:'Beekeepers',       description:'Promotes scientific beekeeping to boost pollination-linked crop productivity and increase honey production with subsidies on bee colonies and equipment.' },
  { id:33, title:'Krishi Udan Scheme 2.0',                               status:'ongoing',   ministry:'Civil Aviation / Agriculture',  budget:'₹600 Cr',          deadline:'Mar 2027',       beneficiaries:'Hilly region farmers',description:'Improves air cargo connectivity for perishable produce from hilly and tribal regions to metro markets, reducing post-harvest losses with subsidised freight.' },
  { id:34, title:'Feed & Fodder Development Scheme',                      status:'ongoing',   ministry:'Fisheries, Animal & Dairying',  budget:'₹198 Cr',          deadline:'Mar 2026',       beneficiaries:'Livestock farmers', description:'Develops quality fodder seeds and expands cultivated fodder area to address seasonal fodder scarcity and support improved livestock productivity.' },
  { id:35, title:'National Mission on Edible Oils (NMEO–Oilseeds)',      status:'upcoming',  ministry:'Agriculture & Farmers Welfare', budget:'₹10,103 Cr',       deadline:'2024–2031',      beneficiaries:'Oilseed farmers',  description:'Aims to make India self-sufficient in edible oils by tripling domestic oilseed production by 2031 with MSP support, HYV seeds, and processing infrastructure.' },
];

// Sort: ongoing → upcoming → completed, then by id within each group
const SCHEMES = [...SCHEMES_RAW].sort(
  (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.id - b.id
);

export function getAllSchemes() {
  return SCHEMES;
}

export function getSchemeById(id) {
  return SCHEMES.find(s => s.id === id) ?? null;
}

export function searchSchemes(query) {
  const q = query.toLowerCase();
  return SCHEMES.filter(s => s.title.toLowerCase().includes(q) || s.ministry?.toLowerCase().includes(q));
}

export function getSchemesByStatus(status) {
  if (status === 'all') return SCHEMES;
  return SCHEMES.filter(s => s.status === status);
}

export const SCHEME_STATUSES = ['all', 'ongoing', 'upcoming', 'completed'];
