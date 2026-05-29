import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Treemap, Legend, LineChart, Line, ReferenceLine,
  LabelList
} from "recharts";

// ── Treasury Design Tokens ────────────────────────────────────────────────────
const T = {
  paper:      "#ebe5d5",
  paperDeep:  "#ddd5be",
  card:       "#f8f2e2",
  cardAlt:    "#f2ead4",
  navy:       "#12243c",
  navyDeep:   "#0b1929",
  navyMid:    "#1a2e4a",
  ink:        "#28221a",
  muted:      "#786d52",
  mutedDeep:  "#58503a",
  line:       "#c8bb9a",
  lineSoft:   "#d8cbac",
  brass:      "#b6873a",
  brassDeep:  "#886224",
  brassLight: "#e4c786",
  moss:       "#5a7538",
  mossLight:  "#a6bc82",
  flag:       "#a83319",
};
const display = '"Fraunces", Georgia, serif';
const body    = '"Inter", -apple-system, system-ui, sans-serif';
const mono    = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace';

// ── NIGP Lookup ───────────────────────────────────────────────────────────────
const NIGP_CLASS_LOOKUP = {"005":"ABRASIVES","010":"ACOUSTICAL TILE, INSULATING MATERIALS, AND SUPPLIES","015":"ADDRESSING, COPYING, MIMEOGRAPH, AND SPIRIT DUPLICATING MACHINE SUPPLIES","019":"AGRICULTURAL CROPS AND GRAINS INCLUDING FRUITS, MELONS, NUTS, AND VEGETABLES","020":"AGRICULTURAL EQUIPMENT, IMPLEMENTS, AND ACCESSORIES","022":"AGRICULTURAL EQUIPMENT AND IMPLEMENT PARTS","025":"AIR COMPRESSORS AND ACCESSORIES","031":"AIR CONDITIONING, HEATING, AND VENTILATING EQUIPMENT, PARTS AND ACCESSORIES","035":"AIRCRAFT AND AIRPORT EQUIPMENT, PARTS, AND SUPPLIES","037":"AMUSEMENT, DECORATIONS, ENTERTAINMENT, GIFTS, TOYS, ETC.","040":"ANIMALS, BIRDS, MARINE LIFE, AND POULTRY, LIVE","050":"ART EQUIPMENT AND SUPPLIES","052":"ART OBJECTS","055":"AUTOMOTIVE ACCESSORIES FOR AUTOMOBILES, BUSES, TRAILERS, TRUCKS, ETC.","060":"AUTOMOTIVE AND TRAILER EQUIPMENT AND PARTS","065":"AUTOMOTIVE AND TRAILER BODIES, BODY ACCESSORIES, AND PARTS","070":"AUTOMOTIVE VEHICLES AND RELATED TRANSPORTATION EQUIPMENT","072":"TRUCKS (INCLUDING DIESEL, GASOLINE, ELECTRIC, HYBRID, AND ALTERNATIVE FUEL UNITS)","073":"TRAILERS","075":"AUTOMOTIVE SHOP AND RELATED EQUIPMENT AND SUPPLIES","080":"BADGES, AWARDS, EMBLEMS, NAME TAGS AND PLATES, JEWELRY, ETC.","085":"BAGS, BAGGING, TIES, AND EROSION SHEETING, ETC.","090":"BAKERY EQUIPMENT, COMMERCIAL","095":"BARBER AND BEAUTY SHOP EQUIPMENT AND SUPPLIES","100":"BARRELS, DRUMS, KEGS, AND CONTAINERS","105":"BEARINGS","110":"BELTS AND BELTING: AUTOMOTIVE AND INDUSTRIAL","115":"BIOCHEMICALS, RESEARCH","120":"BOATS, MOTORS, AND MARINE EQUIPMENT","125":"BOOKBINDING SUPPLIES","135":"BRICKS, CLAY, REFRACTORY MATERIALS, STONE, AND TILE PRODUCTS","140":"BROOM, BRUSH, AND MOP MANUFACTURING MACHINERY AND SUPPLIES","145":"BRUSHES","150":"BUILDER'S SUPPLIES","155":"BUILDINGS AND STRUCTURES: FABRICATED AND PREFABRICATED","160":"BUTCHER SHOP AND MEAT PROCESSING EQUIPMENT","165":"CAFETERIA AND KITCHEN EQUIPMENT, COMMERCIAL","175":"CHEMICAL LABORATORY EQUIPMENT AND SUPPLIES","180":"CHEMICAL RAW MATERIALS (IN LARGE QUANTITIES)","190":"CHEMICALS AND SOLVENTS, COMMERCIAL (IN BULK)","192":"CLEANING COMPOSITIONS, DETERGENTS, SOLVENTS, AND STRIPPERS - PREPACKAGED","193":"CLINICAL LABORATORY REAGENTS AND TESTS","195":"CLOCKS, WATCHES, TIMEPIECES, JEWELRY AND PRECIOUS STONES","200":"CLOTHING: ATHLETIC, CASUAL, DRESS, UNIFORM, WEATHER AND WORK RELATED","201":"CLOTHING ACCESSORIES","204":"COMPUTER HARDWARE AND PERIPHERALS FOR MICROCOMPUTERS","206":"COMPUTER HARDWARE AND PERIPHERALS FOR MINI AND MAIN FRAME COMPUTERS","207":"COMPUTER ACCESSORIES AND SUPPLIES","208":"COMPUTER SOFTWARE FOR MICROCOMPUTERS (PREPROGRAMMED)","209":"COMPUTER SOFTWARE FOR MINI AND MAINFRAME COMPUTERS (PREPROGRAMMED)","210":"CONCRETE AND METAL PRODUCTS, CULVERTS, PILINGS, SEPTIC TANKS, ACCESSORIES AND SUPPLIES","220":"CONTROLLING, INDICATING, MEASURING, MONITORING, AND RECORDING INSTRUMENTS AND SUPPLIES","225":"COOLERS, DRINKING WATER (WATER FOUNTAINS)","232":"CRAFTS, GENERAL","233":"CRAFTS, SPECIALIZED","240":"CUTLERY, COOKWARE, DISHES, GLASSWARE, SILVERWARE, UTENSILS, AND SUPPLIES","245":"DAIRY EQUIPMENT AND SUPPLIES","250":"DATA PROCESSING CARDS AND PAPER","255":"DECALS AND STAMPS","257":"DEFENSE SYSTEM AND HOMELAND SECURITY EQUIPMENT, WEAPONS AND ACCESSORIES","260":"DENTAL EQUIPMENT AND SUPPLIES","265":"DRAPERIES, CURTAINS, AND UPHOLSTERY MATERIAL","269":"DRUGS AND PHARMACEUTICALS","271":"DRUG AND FEEDING ADMINISTRATION, INFUSION, AND IRRIGATION EQUIPMENT AND SUPPLIES","280":"ELECTRICAL CABLES AND WIRES (NOT ELECTRONIC)","285":"ELECTRICAL EQUIPMENT AND SUPPLIES (EXCEPT CABLE AND WIRE)","287":"ELECTRONIC EQUIPMENT, COMPONENTS, PARTS, AND ACCESSORIES","290":"ENERGY COLLECTING EQUIPMENT AND ACCESSORIES: SOLAR AND WIND","295":"ELEVATORS, ESCALATORS, AND MOVING WALKS (BUILDING TYPE)","305":"ENGINEERING AND ARCHITECTURAL EQUIPMENT, SURVEYING EQUIPMENT, DRAWING INSTRUMENTS","310":"ENVELOPES, PLAIN","312":"ENVIRONMENTAL PROTECTIVE EQUIPMENT (INSIDE AND OUTSIDE)","315":"EPOXY BASED FORMULATIONS FOR ADHESIVES, COATINGS, AND RELATED AGENTS","318":"FARE COLLECTION EQUIPMENT AND SUPPLIES","320":"FASTENERS: BOLTS, NUTS, PINS, RIVETS, SCREWS, ETC.","325":"FEED, BEDDING, VITAMINS AND SUPPLEMENTS FOR ANIMALS","330":"FENCING","335":"FERTILIZERS AND SOIL CONDITIONERS","340":"FIRE PROTECTION EQUIPMENT AND SUPPLIES","345":"FIRST AID AND SAFETY EQUIPMENT AND SUPPLIES","350":"FLAGS, FLAG POLES, BANNERS, AND ACCESSORIES","360":"FLOOR COVERING, INSTALLATION AND REMOVAL EQUIPMENT, AND SUPPLIES","365":"FLOOR MAINTENANCE MACHINES, PARTS, AND ACCESSORIES","370":"FOOD PROCESSING AND CANNING EQUIPMENT AND SUPPLIES","375":"FOODS: BAKERY PRODUCTS (FRESH)","380":"FOODS: DAIRY PRODUCTS (FRESH)","385":"FOODS, FROZEN","390":"FOODS: PERISHABLE","393":"FOODS: STAPLE GROCERY AND GROCER'S MISCELLANEOUS ITEMS","395":"FORMS, CONTINUOUS: COMPUTER PAPER, FORM LABELS, SNAP-OUT FORMS","400":"FOUNDRY CASTINGS, EQUIPMENT, AND SUPPLIES","405":"FUEL, OIL, GREASE AND LUBRICANTS","410":"FURNITURE: HEALTH CARE, HOSPITAL AND/OR DOCTOR'S OFFICE","415":"FURNITURE: LABORATORY","420":"FURNITURE: CAFETERIA, CHAPEL, DORMITORY, HOUSEHOLD, LIBRARY, LOUNGE, SCHOOL","425":"FURNITURE: OFFICE","430":"GASES, CONTAINERS, EQUIPMENT: LABORATORY, MEDICAL, AND WELDING","435":"GERMICIDES, CLEANERS, AND RELATED SANITATION PRODUCTS FOR HEALTH CARE PERSONNEL","436":"GERMICIDES, CLEANERS, AND SANITATION PRODUCTS FOR HEALTH CARE (ENVIRONMENTALLY CERTIFIED)","440":"GLASS AND GLAZING SUPPLIES","445":"HAND TOOLS (POWERED AND NON-POWERED), ACCESSORIES AND SUPPLIES","450":"HARDWARE AND RELATED ITEMS","460":"HOSE, ACCESSORIES, AND SUPPLIES: INDUSTRIAL, COMMERCIAL, AND GARDEN","465":"HOSPITAL AND SURGICAL EQUIPMENT, INSTRUMENTS, AND SUPPLIES","470":"HOSPITAL, NURSING HOME OR RESIDENTIAL SPECIALIZED EQUIPMENT FOR HANDICAPPED AND DISABLED","475":"HOSPITAL, SURGICAL, AND MEDICAL RELATED ACCESSORIES AND SUNDRY ITEMS","485":"JANITORIAL SUPPLIES, GENERAL LINE","486":"JANITORIAL SUPPLIES, GENERAL LINE, ENVIRONMENTALLY CERTIFIED","490":"LABORATORY EQUIPMENT, ACCESSORIES AND SUPPLIES: GENERAL ANALYTICAL AND RESEARCH","493":"LABORATORY EQUIPMENT, ACCESSORIES, AND SUPPLIES: BIOCHEMISTRY, CHEMISTRY, ENVIRONMENTAL","495":"LABORATORY AND FIELD EQUIPMENT AND SUPPLIES: BIOLOGY, BOTANY, GEOLOGY, MICROBIOLOGY","500":"LAUNDRY AND DRY CLEANING EQUIPMENT, ACCESSORIES AND SUPPLIES, COMMERCIAL","505":"LAUNDRY AND DRY CLEANING COMPOUNDS, DETERGENTS, AND SUPPLIES","510":"LAUNDRY TEXTILES AND SUPPLIES","515":"LAWN MAINTENANCE EQUIPMENT AND ACCESSORIES","520":"LEATHER AND SHOE ACCESSORIES, EQUIPMENT, AND SUPPLIES","525":"LIBRARY AND ARCHIVAL EQUIPMENT, MACHINES, AND SUPPLIES","530":"LUGGAGE, BRIEF CASES, PURSES AND RELATED ITEMS","540":"LUMBER, SIDING, AND RELATED PRODUCTS","545":"MACHINERY AND HARDWARE, INDUSTRIAL","550":"MARKERS, PLAQUES AND TRAFFIC CONTROL DEVICES","553":"MANUFACTURING COMPONENTS AND SUPPLIES","555":"METAL, PAPER, AND PLASTIC STENCILS AND STENCILING DEVICES","556":"MASS TRANSPORTATION - TRANSIT BUS","557":"MASS TRANSPORTATION - TRANSIT BUS ACCESSORIES AND PARTS","558":"MASS TRANSPORTATION - RAIL VEHICLES AND SYSTEMS","559":"MASS TRANSPORTATION - RAIL VEHICLE PARTS AND ACCESSORIES","560":"MATERIAL HANDLING, CONVEYORS, STORAGE EQUIPMENT AND ACCESSORIES","565":"MATTRESS AND PILLOW MANUFACTURING MACHINERY AND SUPPLIES","570":"METALS: BARS, PLATES, RODS, SHEETS, STRIPS, STRUCTURAL SHAPES, TUBING","575":"MICROFICHE AND MICROFILM EQUIPMENT, ACCESSORIES, AND SUPPLIES","578":"MISCELLANEOUS PRODUCTS (NOT OTHERWISE CLASSIFIED)","580":"MUSICAL INSTRUMENTS, ACCESSORIES, AND SUPPLIES","590":"NOTIONS AND RELATED SEWING ACCESSORIES AND SUPPLIES","593":"NUCLEAR EQUIPMENT COMPONENTS, ACCESSORIES AND SUPPLIES","595":"NURSERY (PLANTS) STOCK, EQUIPMENT, AND SUPPLIES","600":"OFFICE MACHINES, EQUIPMENT, AND ACCESSORIES","605":"OFFICE MECHANICAL AIDS, SMALL MACHINES, AND APPARATUSES","610":"OFFICE SUPPLIES: CARBON PAPER AND RIBBONS, ALL TYPES","615":"OFFICE SUPPLIES, GENERAL","620":"OFFICE SUPPLIES: ERASERS, INKS, LEADS, PENS, PENCILS, ETC.","625":"OPTICAL EQUIPMENT, ACCESSORIES, AND SUPPLIES","630":"PAINT, PROTECTIVE COATINGS, VARNISH, WALLPAPER, AND RELATED PRODUCTS","631":"PAINT, PROTECTIVE COATINGS, VARNISH, WALLPAPER (ENVIRONMENTALLY CERTIFIED)","635":"PAINTING EQUIPMENT AND ACCESSORIES","640":"PAPER AND PLASTIC PRODUCTS, DISPOSABLE","645":"PAPER, FOR OFFICE AND PRINT SHOP USE","650":"PARK, PLAYGROUND, RECREATIONAL AREA AND SWIMMING POOL EQUIPMENT AND SUPPLIES","652":"PERSONAL HYGIENE AND GROOMING EQUIPMENT AND SUPPLIES","655":"PHOTOGRAPHIC EQUIPMENT, FILM, AND SUPPLIES","658":"PIPE, TUBING, AND ACCESSORIES (NOT FITTINGS)","659":"PIPE AND TUBING FITTINGS","665":"PLASTICS, RESINS, FIBERGLASS: CONSTRUCTION, FORMING, LAMINATING, AND MOLDING EQUIPMENT","670":"PLUMBING EQUIPMENT, FIXTURES, AND SUPPLIES","675":"PESTICIDES AND CHEMICALS: AGRICULTURAL AND INDUSTRIAL","680":"POLICE AND PRISON EQUIPMENT AND SUPPLIES","685":"POULTRY EQUIPMENT AND SUPPLIES","690":"POWER GENERATION EQUIPMENT, ACCESSORIES, AND SUPPLIES","691":"POWER TRANSMISSION EQUIPMENT (ELECTRICAL, MECHANICAL, AIR AND HYDRAULIC)","700":"PRINTING PLANT EQUIPMENT AND SUPPLIES (EXCEPT PAPER)","710":"PROSTHETIC DEVICES, HEARING AIDS, AUDITORY TESTING EQUIPMENT, ELECTRONIC READING DEVICES","715":"PUBLICATIONS, AUDIOVISUAL MATERIALS, BOOKS, TEXTBOOKS (PREPARED MATERIALS ONLY)","720":"PUMPING EQUIPMENT AND ACCESSORIES","725":"RADIO COMMUNICATION, TELEPHONE, AND TELECOMMUNICATION EQUIPMENT, ACCESSORIES, AND SUPPLIES","726":"RADIO COMMUNICATION EQUIPMENT, ACCESSORIES AND SUPPLIES","730":"RADIO COMMUNICATION AND TELECOMMUNICATION TESTING, MEASURING, AND ANALYZING EQUIPMENT","735":"RAGS, SHOP TOWELS, AND WIPING CLOTHS","740":"REFRIGERATION EQUIPMENT AND ACCESSORIES","745":"ROAD AND HIGHWAY BUILDING MATERIALS (ASPHALTIC)","750":"ROAD AND HIGHWAY BUILDING MATERIALS (NOT ASPHALTIC)","755":"ROAD AND HIGHWAY ASPHALT AND CONCRETE HANDLING AND PROCESSING EQUIPMENT","760":"ROAD AND HIGHWAY EQUIPMENT: EARTH HANDLING, GRADING, MOVING, PACKING, ETC.","765":"ROAD AND HIGHWAY EQUIPMENT (EXCEPT EQUIPMENT IN CLASSES 755 AND 760)","770":"ROOFING MATERIALS AND SUPPLIES","775":"SALT (SODIUM CHLORIDE)","780":"SCALES AND WEIGHING APPARATUS","785":"SCHOOL EQUIPMENT, TEACHING AIDS, AND SUPPLIES","790":"SEED, SOD, SOIL, AND INOCULANTS","795":"SEWING AND TEXTILE MACHINERY AND ACCESSORIES","800":"SHOES AND BOOTS","801":"SIGNS, SIGN MATERIALS, SIGN MAKING EQUIPMENT, AND RELATED SUPPLIES","803":"SOUND SYSTEMS, COMPONENTS, AND ACCESSORIES: GROUP INTERCOM, MUSIC, PUBLIC ADDRESS","805":"SPORTING GOODS, ATHLETIC EQUIPMENT AND ATHLETIC FACILITY EQUIPMENT","810":"SPRAYING EQUIPMENT","815":"STEAM AND HOT WATER FITTINGS, ACCESSORIES, AND SUPPLIES","820":"STEAM AND HOT WATER BOILERS AND STEAM HEATING EQUIPMENT","825":"STOCKMAN EQUIPMENT AND SUPPLIES","830":"TANKS (METAL, PLASTIC, WOOD, AND SYNTHETIC MATERIALS): MOBILE, PORTABLE, STATIONARY","832":"TAPE (NOT DATA PROCESSING, MEASURING, OPTICAL, SEWING, SOUND, OR VIDEO)","838":"TELECOMMUNICATION EQUIPMENT, ACCESSORIES AND SUPPLIES","839":"TELEPHONE EQUIPMENT, ACCESSORIES AND SUPPLIES","840":"TELEVISION EQUIPMENT AND ACCESSORIES","845":"TESTING APPARATUS AND INSTRUMENTS (NOT FOR ELECTRICAL OR ELECTRONIC MEASUREMENTS)","850":"TEXTILES, FIBERS, HOUSEHOLD LINENS, AND PIECE GOODS","855":"THEATRICAL EQUIPMENT AND SUPPLIES","860":"TICKETS, COUPON BOOKS, SALES BOOKS, STRIP BOOKS, ETC.","863":"TIRES AND TUBES (INCL. RECAPPED/RETREADED TIRES)","865":"TWINE AND STRING","870":"VENETIAN BLINDS, AWNINGS, AND SHADES","875":"VETERINARY EQUIPMENT AND SUPPLIES","880":"VISUAL EDUCATION EQUIPMENT AND SUPPLIES","883":"VOICE RESPONSE SYSTEMS","885":"WATER AND WASTEWATER TREATING CHEMICALS","890":"WATER SUPPLY, GROUNDWATER, SEWAGE TREATMENT, AND RELATED EQUIPMENT","895":"WELDING EQUIPMENT AND SUPPLIES","898":"X-RAY AND OTHER RADIOLOGICAL EQUIPMENT AND SUPPLIES (MEDICAL)","905":"AIRCRAFT AND AIRPORT OPERATIONS SERVICES","906":"ARCHITECTURAL SERVICES, PROFESSIONAL","907":"ARCHITECTURAL AND ENGINEERING SERVICES, NON-PROFESSIONAL","908":"BOOKBINDING AND REPAIRING SERVICES","909":"BUILDING CONSTRUCTION SERVICES, NEW (INCL. MAINTENANCE AND REPAIR SERVICES)","910":"BUILDING MAINTENANCE, INSTALLATION AND REPAIR SERVICES","912":"CONSTRUCTION SERVICES, GENERAL (INCL. MAINTENANCE AND REPAIR SERVICES)","913":"CONSTRUCTION SERVICES, HEAVY (INCL. MAINTENANCE AND REPAIR SERVICES)","914":"CONSTRUCTION SERVICES, TRADE (NEW CONSTRUCTION)","915":"COMMUNICATIONS AND MEDIA RELATED SERVICES","918":"CONSULTING SERVICES","920":"DATA PROCESSING, COMPUTER, PROGRAMMING, AND SOFTWARE SERVICES","924":"EDUCATIONAL/TRAINING SERVICES","925":"ENGINEERING SERVICES, PROFESSIONAL","926":"ENVIRONMENTAL AND ECOLOGICAL SERVICES","928":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR AUTOMOBILES, TRUCKS, TRAILERS","929":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR AGRICULTURAL, CONSTRUCTION, HEAVY INDUSTRIAL","931":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR APPLIANCE, ATHLETIC, CAFETERIA, FURNITURE","934":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR LAUNDRY, LAWN, PAINTING, PLUMBING","938":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR HOSPITAL, LABORATORY, AND TESTING EQUIPMENT","939":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR COMPUTERS, OFFICE, PHOTOGRAPHIC","940":"EQUIPMENT MAINTENANCE, REPAIR, CONSTRUCTION, AND RELATED SERVICES FOR RAILROADS","941":"EQUIPMENT MAINTENANCE, REPAIR, AND RELATED SERVICES FOR POWER GENERATION AND TRANSMISSION","944":"FARMING AND RANCHING SERVICES, ANIMAL AND CROP","946":"FINANCIAL SERVICES","947":"FORESTRY SERVICES","948":"HEALTH RELATED SERVICES","952":"HUMAN SERVICES","953":"INSURANCE AND INSURANCE SERVICES (ALL TYPES)","954":"LAUNDRY AND DRY CLEANING SERVICES","956":"LIBRARY SERVICES (INCL. RESEARCH AND SUBSCRIPTION SERVICES)","958":"MANAGEMENT SERVICES","961":"MISCELLANEOUS SERVICES, NO. 1 (NOT OTHERWISE CLASSIFIED)","962":"MISCELLANEOUS SERVICES, NO. 2 (NOT OTHERWISE CLASSIFIED)","963":"NON-BIDDABLE MISCELLANEOUS ITEMS","965":"PRINTING PREPARATIONS","966":"PRINTING AND TYPESETTING SERVICES","967":"PRODUCTION AND MANUFACTURING SERVICES","968":"PUBLIC WORKS AND RELATED SERVICES","971":"REAL PROPERTY RENTAL OR LEASE","975":"RENTAL OR LEASE SERVICES OF AGRICULTURAL, AIRCRAFT, AIRPORT, AUTOMOTIVE, MARINE, AND HEAVY EQUIPMENT","977":"RENTAL OR LEASE SERVICES OF APPLIANCES, CAFETERIA, FILM, FURNITURE, HARDWARE, MUSICAL, SEWING","979":"RENTAL OR LEASE SERVICES OF ENGINEERING, HOSPITAL, LABORATORY, PRECISION INSTRUMENTS","981":"RENTAL OR LEASE OF GENERAL EQUIPMENT (HVAC, ATHLETIC, FIRE AND POLICE PROTECTION)","983":"RENTAL OR LEASE SERVICES OF CLOTHING, JANITORIAL, LAUNDRY, LAWN, PAINTING, SPRAYING","984":"RENTAL OR LEASE SERVICES OF COMPUTERS, DATA PROCESSING, AND WORD PROCESSING EQUIPMENT","985":"RENTAL OR LEASE SERVICES OF OFFICE, PHOTOGRAPHIC, PRINTING, RADIO/TELEVISION/TELEPHONE","988":"ROADSIDE, GROUNDS, RECREATIONAL AND PARK AREA SERVICES","989":"SAMPLING AND SAMPLE PREPARATION SERVICES (FOR TESTING)","990":"SECURITY, FIRE, SAFETY, AND EMERGENCY SERVICES","992":"TESTING AND CALIBRATION SERVICES","998":"SALE OF SURPLUS AND OBSOLETE ITEMS"};

function resolveNIGP(rawCode) {
  if (!rawCode) return { classCode:"000", label:"Unknown / Unclassified" };
  const digits = String(rawCode).replace(/\D/g,"");
  if (!digits) return { classCode:"000", label:"Unknown / Unclassified" };
  const classCode = digits.padStart(3,"0").slice(0,3);
  const label = NIGP_CLASS_LOOKUP[classCode] || `Unrecognized Class ${classCode}`;
  return { classCode, label };
}

const FIELD_DEFS = {
  amount:      { label:"💰 Spend Amount",      required:true,  color:T.moss,   hint:"Dollar value per transaction",         synonyms:["itm_tot_am","amount","total","spend","cost","price","value","sum","extended","amt","dollar","extended_amount","total_amount","line_total","po_amount"] },
  nigp:        { label:"🏷 NIGP Code",          required:false, color:T.brass,  hint:"Commodity / class code (optional — leave blank if not available)",              synonyms:["commodity","nigp","class","code","item_class","commodity_code","nigp_code","item_no","class_code","nigp_class","nigp_commodity"] },
  description: { label:"📋 Item Description",  required:false, color:T.muted,  hint:"What was purchased",                   synonyms:["commodity_description","description","desc","item_desc","service","product","title","line_desc","item_description","extended_description"] },
  vendor:      { label:"🏢 Vendor Name",        required:false, color:T.brass,  hint:"Supplier / contractor legal name",     synonyms:["lgl_nm","vendor","supplier","payee","contractor","company","vendor_name","legal_name","legalname","vendor_legal_name","firm"] },
  contract:    { label:"📄 Contract / MA #",    required:false, color:T.muted,  hint:"Master agreement or contract number",  synonyms:["master_agreement","contract","contract_no","contract_number","ma_number","agreement","po_contract","contract_id","master_agreement_no"] },
  po:          { label:"🔢 PO Number",          required:false, color:T.muted,  hint:"Purchase order number",               synonyms:["purchase_order","po","po_number","po_no","order_number","doc_no","po_num"] },
  department:  { label:"🏛 Department",         required:false, color:T.muted,  hint:"Agency or division that purchased",    synonyms:["department","dept","agency","division","bureau","org_unit","department_name","dept_name","department_id","dept_id","agency_name","agency_code","division_name","org_name","cost_center","fund","program","department_code"] },
  vendor_city: { label:"🏙 Vendor City",         required:false, color:T.muted,  hint:"City where vendor is located",        synonyms:["city","vendor_city","supplier_city","address_city","vendor_city_name","city_name"] },
  vendor_state:{ label:"📍 Vendor State",        required:false, color:T.muted,  hint:"State where vendor is located",       synonyms:["st","state","vendor_state","supplier_state","address_state","vendor_st"] },
  date:        { label:"📅 Date",               required:false, color:T.muted,  hint:"Award or transaction date",           synonyms:["award_date","date","po_date","order_date","transaction_date","purchase_date","doc_date","invoice_date"] },
};

function autoDetect(columns) {
  const result = {};
  const norm = columns.map(c => c.toLowerCase().replace(/[^a-z0-9_]/g,""));
  for (const [field, def] of Object.entries(FIELD_DEFS)) {
    const idx = def.synonyms.findIndex(s => norm.includes(s));
    if (idx !== -1) { result[field] = columns[norm.indexOf(def.synonyms[idx])]; continue; }
    if (field === "department") { result[field] = ""; continue; }
    const partial = columns.find(c => def.synonyms.some(s => c.toLowerCase().replace(/[^a-z0-9_]/g,"").includes(s)));
    result[field] = partial || "";
  }
  return result;
}

const PALETTE = ["#b6873a","#5a7538","#12243c","#a83319","#786d52","#886224","#1a2e4a","#58503a","#c8bb9a","#a6bc82","#e4c786","#d8cbac","#7a6040","#3a5828","#0b1929","#8a3319","#5a4a2a","#6a5520","#2a3e5a","#4a3c2a"];
const fmt = n => n>=1e9?`$${(n/1e9).toFixed(1)}B`:n>=1e6?`$${(n/1e6).toFixed(1)}M`:n>=1e3?`$${(n/1e3).toFixed(0)}K`:`$${Math.round(n).toLocaleString()}`;
const fmtFull = n => "$"+Math.round(Number(n)).toLocaleString("en-US");
const parseAmt = raw => { if(!raw) return NaN; return parseFloat(String(raw).replace(/[$,\s]/g,"")); };
const toTC = str => str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase()+w.slice(1).toLowerCase());
const shortLabel = (s,n=38) => { const tc=toTC(s); return tc.length>n?tc.slice(0,n-1)+"…":tc; };
const fmtPct = (n, decimals=1) => `${n.toFixed(decimals)}%`;

// ── Treasury-styled shared components ────────────────────────────────────────
const Corners = () => (
  <>
    <svg width="10" height="10" style={{position:"absolute",top:4,left:4,color:T.brass}} viewBox="0 0 10 10" fill="currentColor"><path d="M0 0h4v1H1v3H0V0z"/></svg>
    <svg width="10" height="10" style={{position:"absolute",top:4,right:4,color:T.brass}} viewBox="0 0 10 10" fill="currentColor"><path d="M10 0H6v1h3v3h1V0z"/></svg>
    <svg width="10" height="10" style={{position:"absolute",bottom:4,left:4,color:T.brass}} viewBox="0 0 10 10" fill="currentColor"><path d="M0 10h4v-1H1V6H0v4z"/></svg>
    <svg width="10" height="10" style={{position:"absolute",bottom:4,right:4,color:T.brass}} viewBox="0 0 10 10" fill="currentColor"><path d="M10 10H6v-1h3V6h1v4z"/></svg>
  </>
);

const PctBar = ({pct, color=T.brass, width=80}) => (
  <div style={{display:"flex",alignItems:"center",gap:7,minWidth:width+44}}>
    <div style={{height:5,background:T.paperDeep,border:`1px solid ${T.lineSoft}`,width,overflow:"hidden",flexShrink:0}}>
      <div style={{height:"100%",background:color,width:`${Math.min(100,pct)}%`,transition:"width 0.3s"}}/>
    </div>
    <span style={{color:T.brassDeep,fontSize:11,minWidth:38,fontWeight:600,fontFamily:mono}}>{fmtPct(pct)}</span>
  </div>
);

const PctBarLabel = ({x,y,width,height,value,total}) => {
  if(!total||width<30) return null;
  return <text x={x+width+7} y={y+height/2+1} fill={T.brassDeep} fontSize={10} fontWeight={600} fontFamily={mono} dominantBaseline="middle">{(value/total*100).toFixed(1)}%</text>;
};

const Tip = ({active,payload,label,total}) => {
  if(!active||!payload?.length) return null;
  const val = payload[0].value;
  const pct = total && total>0 ? (val/total*100) : (payload[0].payload?._pct ?? null);
  return (
    <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"10px 14px",color:T.ink,fontSize:13,maxWidth:300,fontFamily:body}}>
      <div style={{fontWeight:700,marginBottom:4,color:T.navy,lineHeight:1.3,fontFamily:display}}>{label||payload[0].name}</div>
      <div style={{color:T.mutedDeep}}>{fmtFull(val)}</div>
      {pct!=null&&<div style={{color:T.brassDeep,fontSize:11,marginTop:3,fontFamily:mono}}>📊 {fmtPct(pct)} of total spend</div>}
    </div>
  );
};

let _treemapTotal = 0;
const TreeCell = ({x,y,width,height,name,value,index}) => {
  if(width<30||height<20) return null;
  const color=PALETTE[index%PALETTE.length];
  const pct = _treemapTotal>0 ? (value/_treemapTotal*100).toFixed(1) : null;
  const showName = width>70&&height>32; const showAmt = width>70&&height>55; const showPct = width>70&&height>72&&pct!=null;
  const midY = y+height/2; const nameY = showPct ? midY-14 : showAmt ? midY-9 : midY+4;
  return (
    <g>
      <rect x={x+1} y={y+1} width={width-2} height={height-2} rx={2} fill={color} fillOpacity={0.9} stroke={T.paperDeep} strokeWidth={1}/>
      {showName&&<text x={x+width/2} y={nameY} textAnchor="middle" fill="#fff" fontSize={Math.min(11,width/9)} fontWeight="600" style={{pointerEvents:"none"}}>{name?.length>18?name.slice(0,17)+"…":name}</text>}
      {showAmt&&<text x={x+width/2} y={nameY+(showPct?14:showName?13:0)} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={Math.min(10,width/10)} style={{pointerEvents:"none"}}>{fmt(value)}</text>}
      {showPct&&<text x={x+width/2} y={nameY+27} textAnchor="middle" fill="rgba(255,255,255,0.95)" fontSize={Math.min(11,width/9)} fontWeight="700" style={{pointerEvents:"none"}}>{pct}%</text>}
    </g>
  );
};

const Card = ({title, subtitle, children, span2}) => (
  <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"18px 20px",gridColumn:span2?"1/-1":undefined,position:"relative"}}>
    <Corners/>
    <div style={{marginBottom:14}}>
      <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.navy}}>{title}</div>
      {subtitle&&<div style={{fontSize:12,color:T.muted,marginTop:2,fontFamily:body}}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

const FLAG_COLORS = { high:T.flag, medium:"#b8721a", low:"#a08020", info:T.navy };
const FLAG_BG     = { high:`${T.flag}10`, medium:"rgba(184,114,26,0.08)", low:"rgba(160,128,32,0.08)", info:`${T.navy}08` };
const FLAG_ICONS  = { high:"⚑", medium:"⚑", low:"⚑", info:"ℹ" };

const FlagCard = ({severity,title,summary,detail,amount,count,recommendation,totalSpend}) => {
  const [open,setOpen] = useState(false);
  const c = FLAG_COLORS[severity]; const bg = FLAG_BG[severity];
  const pct = totalSpend && amount ? (amount/totalSpend*100) : null;
  return (
    <div style={{background:bg,border:`1px solid ${c}44`,padding:"14px 18px",marginBottom:10,position:"relative"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <span style={{fontSize:13,color:c,fontFamily:mono}}>{FLAG_ICONS[severity]}</span>
            <span style={{fontSize:13,fontWeight:700,color:T.navy,fontFamily:display}}>{title}</span>
            <span style={{fontSize:9.5,background:`${c}18`,color:c,padding:"1px 7px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",border:`1px solid ${c}40`,fontFamily:mono}}>{severity} priority</span>
          </div>
          <div style={{fontSize:12.5,color:T.mutedDeep,lineHeight:1.5,fontFamily:body}}>{summary}</div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"flex-start",flexShrink:0}}>
          {amount!=null&&(<div style={{textAlign:"right"}}><div style={{fontSize:10,color:T.muted,marginBottom:2,fontFamily:mono,letterSpacing:1,textTransform:"uppercase"}}>Spend at Risk</div><div style={{fontSize:15,fontWeight:700,color:c,fontFamily:display}}>{fmt(amount)}</div>{pct!=null&&<div style={{fontSize:10,color:`${c}cc`,marginTop:2,fontWeight:700,fontFamily:mono}}>{fmtPct(pct)} of total</div>}</div>)}
          {count!=null&&<div style={{textAlign:"right"}}><div style={{fontSize:10,color:T.muted,marginBottom:2,fontFamily:mono,letterSpacing:1,textTransform:"uppercase"}}>Instances</div><div style={{fontSize:15,fontWeight:700,color:T.mutedDeep,fontFamily:display}}>{count}</div></div>}
          <div style={{color:T.brassDeep,fontSize:14,marginTop:2,fontFamily:mono}}>{open?"▲":"▼"}</div>
        </div>
      </div>
      {open&&(
        <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${c}22`}}>
          {detail&&<div style={{fontSize:12.5,color:T.mutedDeep,lineHeight:1.6,marginBottom:10,fontFamily:body}}>{detail}</div>}
          {recommendation&&<div style={{background:`${T.moss}10`,border:`1px solid ${T.moss}40`,padding:"10px 14px"}}>
            <div style={{fontSize:10,color:T.moss,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:mono}}>💡 Recommended Action</div>
            <div style={{fontSize:12.5,color:T.mutedDeep,lineHeight:1.5,fontFamily:body}}>{recommendation}</div>
          </div>}
        </div>
      )}
    </div>
  );
};

// ── computeFlags / computeVendorConc (unchanged logic) ───────────────────────
function computeFlags(rows, mapping) {
  const { amount:aC, nigp:nC, vendor:vC, contract:cC, po:pC, vendor_state:sC, date:dC } = mapping;
  const flags = []; const total = rows.reduce((s,r)=>s+r._amt,0);
  if (cC) { const maverick = rows.filter(r => !r[cC] || String(r[cC]).trim()===""); const mAmt = maverick.reduce((s,r)=>s+r._amt,0); const mPct = mAmt/total*100; if (mPct > 2) { flags.push({ severity: mPct>15?"high":mPct>7?"medium":"low", title:"Maverick Spend — Purchases Outside Contract Coverage", summary:`${mPct.toFixed(1)}% of total spend (${fmtFull(mAmt)}) on ${maverick.length.toLocaleString()} transactions has no master agreement or contract on record.`, detail:`Off-contract purchases typically cost 15–25% more than contracted prices and bypass competitive procurement requirements.`, recommendation:`Identify the top 20 off-contract vendors by spend. For recurring categories, initiate competitive solicitations.`, amount:mAmt, count:maverick.length }); } }
  if (pC && vC && dC) { const grouped = {}; for (const r of rows) { const v=String(r[vC]||"").trim(); const d=String(r[dC]||"").trim(); if(!v||!d) continue; const k=`${v}||${d}`; if(!grouped[k]) grouped[k]={vendor:v,date:d,pos:new Set(),amt:0,count:0}; grouped[k].pos.add(r[pC]); grouped[k].amt+=r._amt; grouped[k].count++; } const splits = Object.values(grouped).filter(g=>g.pos.size>=3).sort((a,b)=>b.amt-a.amt); const splitAmt = splits.reduce((s,g)=>s+g.amt,0); if(splits.length>0) { const topExamples = splits.slice(0,3).map(g=>`${g.vendor} (${g.pos.size} POs on ${g.date}, ${fmtFull(g.amt)})`).join("; "); flags.push({ severity:"high", title:"Potential PO Splitting — Multiple POs to Same Vendor on Same Day", summary:`${splits.length} instances found where a single vendor received 3+ purchase orders on the same date, totaling ${fmtFull(splitAmt)}.`, detail:`PO splitting is used to circumvent approval thresholds. Top instances: ${topExamples}.`, recommendation:`Pull full purchase histories for flagged vendors. Compare PO values to your jurisdiction's small purchase and competitive bid thresholds.`, amount:splitAmt, count:splits.length }); } }
  if (vC && nC) { const catVendor={}, catTotal={}; for(const r of rows){ const {classCode}=resolveNIGP(r[nC]); const v=String(r[vC]||"Unknown").trim(); const k=`${classCode}||${v}`; if(!catVendor[k]) catVendor[k]={classCode,vendor:v,amt:0}; catVendor[k].amt+=r._amt; if(!catTotal[classCode]) catTotal[classCode]=0; catTotal[classCode]+=r._amt; } const singles=Object.values(catVendor).filter(x=>catTotal[x.classCode]>=250000 && x.amt/catTotal[x.classCode]>=0.80).map(x=>({...x,pct:x.amt/catTotal[x.classCode]*100,catAmt:catTotal[x.classCode],label:shortLabel(NIGP_CLASS_LOOKUP[x.classCode]||`Class ${x.classCode}`)})).sort((a,b)=>b.catAmt-a.catAmt); if(singles.length>0){ const totalSingle=singles.reduce((s,x)=>s+x.catAmt,0); const ex=singles.slice(0,3).map(x=>`${x.label} (${x.vendor}, ${x.pct.toFixed(0)}% share)`).join("; "); flags.push({ severity:singles.length>=5?"high":"medium", title:"Single-Source Vendor Concentration — Categories With One Dominant Supplier", summary:`${singles.length} spend categories (totaling ${fmtFull(totalSingle)}) have one vendor controlling 80%+ of category spend.`, detail:`Single-source dependency limits price competition. Examples: ${ex}.`, recommendation:`For categories with >$500K single-source spend, initiate market surveys to identify alternative qualified vendors.`, amount:totalSingle, count:singles.length }); } }
  if(dC){ const monthly={}; for(const r of rows){ const raw=String(r[dC]||""); const m=raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/); if(m){ const mo=m[1].padStart(2,"0"); const yr=m[3].length===2?"20"+m[3]:m[3]; const k=`${yr}-${mo}`; if(!monthly[k]) monthly[k]=0; monthly[k]+=r._amt; } } const months=Object.entries(monthly).sort((a,b)=>a[0].localeCompare(b[0])); if(months.length>=4){ const amts=months.map(([,a])=>a); const avg=amts.reduce((s,a)=>s+a,0)/amts.length; const spikes=months.filter(([,a])=>a>avg*1.8).map(([mo,a])=>({month:mo,amt:a,ratio:a/avg})); if(spikes.length>0){ const spikeAmt=spikes.reduce((s,sp)=>s+sp.amt,0); const spikeDesc=spikes.map(sp=>`${sp.month} (${fmt(sp.amt)}, ${sp.ratio.toFixed(1)}× avg)`).join(", "); flags.push({ severity:"medium", title:"Abnormal Monthly Spend Spikes — Potential Use-It-or-Lose-It Budgeting", summary:`${spikes.length} month${spikes.length>1?"s":""} show spending more than 1.8× the monthly average: ${spikeDesc}.`, detail:`End-of-fiscal-year spending surges often indicate "use it or lose it" budget behavior.`, recommendation:`Cross-reference spike months against your fiscal year end. Audit the 20 largest purchases during spike months.`, amount:spikeAmt, count:spikes.length }); } } }
  if(vC){ const vendorSpend={}; for(const r of rows){ const v=String(r[vC]||"Unknown").trim(); if(!vendorSpend[v]) vendorSpend[v]=0; vendorSpend[v]+=r._amt; } const sorted=Object.values(vendorSpend).sort((a,b)=>b-a); const n=sorted.length; const tail=sorted.slice(Math.floor(n*0.8)); const tailAmt=tail.reduce((s,a)=>s+a,0); const tailPct=tailAmt/total*100; const tailCount=tail.length; if(tailCount>20 && tailPct>1){ flags.push({ severity:"low", title:"Long-Tail Vendor Sprawl — Administrative Overhead Risk", summary:`The bottom 20% of vendors (${tailCount.toLocaleString()} suppliers) account for only ${tailPct.toFixed(1)}% of spend but generate disproportionate overhead.`, detail:`Managing hundreds of small vendors creates significant administrative burden.`, recommendation:`Set a minimum vendor spend threshold below which purchases must be consolidated or P-carded.`, amount:tailAmt, count:tailCount }); } }
  if(sC){ const stateSpend={}; for(const r of rows){ const s=String(r[sC]||"Unknown").trim().toUpperCase(); if(!stateSpend[s]) stateSpend[s]=0; stateSpend[s]+=r._amt; } const localState=Object.entries(stateSpend).sort((a,b)=>b[1]-a[1])[0]; if(localState){ const outOfState=total-localState[1]; const outPct=outOfState/total*100; if(outPct>40){ flags.push({ severity:"info", title:"Out-of-State Vendor Spend — Review Local Preference Compliance", summary:`${outPct.toFixed(1)}% of spend (${fmtFull(outOfState)}) flows to out-of-state vendors.`, detail:`Many government jurisdictions have local vendor preference policies.`, recommendation:`Review your jurisdiction's local preference ordinance.`, amount:outOfState, count:null }); } } }
  return flags;
}

function computeVendorConc(rows, mapping, totalSpend) {
  const { vendor:vC, nigp:nC } = mapping;
  if(!vC) return null;
  const byVendor={};
  for(const r of rows){ const v=String(r[vC]||"Unknown").trim(); if(!byVendor[v]) byVendor[v]={name:v,total:0,count:0,categories:new Set()}; byVendor[v].total+=r._amt; byVendor[v].count++; if(nC){ const {classCode}=resolveNIGP(r[nC]); byVendor[v].categories.add(classCode); } }
  const vendorArr=Object.values(byVendor).map(v=>({...v,categories:v.categories.size,pct:v.total/totalSpend*100})).sort((a,b)=>b.total-a.total);
  const hhi=vendorArr.reduce((s,v)=>s+(v.pct)*(v.pct),0);
  let cum=0; const cumulativeCurve=vendorArr.map((v,i)=>{ cum+=v.pct; return {rank:i+1,vendor:v.name,pct:v.pct,cumPct:cum}; });
  const v50=cumulativeCurve.find(p=>p.cumPct>=50)?.rank||0; const v75=cumulativeCurve.find(p=>p.cumPct>=75)?.rank||0; const v90=cumulativeCurve.find(p=>p.cumPct>=90)?.rank||0;
  const catVendor={}, catTotal={};
  if(nC){ for(const r of rows){ const {classCode}=resolveNIGP(r[nC]); const v=String(r[vC]||"Unknown").trim(); const k=`${classCode}||${v}`; if(!catVendor[k]) catVendor[k]={classCode,label:shortLabel(NIGP_CLASS_LOOKUP[classCode]||`Class ${classCode}`),vendor:v,amt:0}; catVendor[k].amt+=r._amt; if(!catTotal[classCode]) catTotal[classCode]=0; catTotal[classCode]+=r._amt; } }
  const catDominance=Object.values(catVendor).filter(x=>catTotal[x.classCode]>=100000).map(x=>({...x,pct:x.amt/catTotal[x.classCode]*100,catAmt:catTotal[x.classCode]})).sort((a,b)=>b.catAmt-a.catAmt).filter(x=>x.pct>=70).slice(0,20);
  return { vendorArr, cumulativeCurve, hhi, v50, v75, v90, catDominance };
}

const fileStore={current:null};

// ── Fetch Agent Constants (module-level to avoid minifier TDZ issues) ─────────
const FETCH_API_BASE_DEFAULT = "http://localhost:3001";
const FETCH_STATES=[
  {key:"maryland",   name:"Maryland",    portal:"MD-VIEW · Comptroller",  years:["2025","2024","2023","2022"], live:true,  url:"https://interactive2.marylandtaxes.gov/MDVIEW/"},
  {key:"illinois",   name:"Illinois",    portal:"IL Comptroller",          years:["2025","2024","2023","2022"], live:true,  url:"https://illinoiscomptroller.gov/financial-reports-data/expenditures-state-spending/statewide"},
  {key:"oregon",     name:"Oregon",      portal:"OregonBuys · Socrata",    years:["2024","2023","2022"],        live:false, url:"https://data.oregon.gov"},
  {key:"texas",      name:"Texas",       portal:"CAPPS · DIR",              years:["2025","2024"],               live:false, url:"https://www.txsmartbuy.gov"},
  {key:"california", name:"California",  portal:"Cal eProcure",             years:["2025","2024"],               live:false, url:"https://eprocure.dgs.ca.gov"},
  {key:"florida",    name:"Florida",     portal:"MyFloridaMarket",          years:["2025","2024"],               live:false, url:"https://www.myfloridamarketplace.com"},
];
const AI_AGENTS=[
  {id:"chloe",  name:"Chloe Okafor",     role:"Junior Procurement Analyst",    arch:"LLM Prompt",      skill:18, awareness:10, cost:"Free",  costNum:0,   color:T.brass},
  {id:"mike",   name:"Mike Alvarez",      role:"Senior Procurement Analyst",    arch:"LLM Deep Prompt", skill:42, awareness:25, cost:"$141",  costNum:141, color:T.brass},
  {id:"bob",    name:"Bob Whitfield",     role:"Prof. Procurement Analyst",     arch:"RAG",             skill:71, awareness:25, cost:"$339",  costNum:339, color:T.moss},
  {id:"robyn",  name:"Robyn Castellanos", role:"NIGP Consultant",               arch:"RAG + Deep",      skill:88, awareness:35, cost:"$521",  costNum:521, color:T.brass},
  {id:"christy",name:"Christy Park",      role:"Marketing Designer",            arch:"LLM Format",      skill:36, awareness:5,  cost:"+$141", costNum:141, color:T.brass, addonOnly:true},
];
// Pat Smiley — untrained intern, no memory, no RAG, used as demo baseline
const PAT_AGENT = {id:"pat", name:"Pat Smiley", role:"Intern Researcher", arch:"No Training", skill:12, awareness:5, cost:"Free", costNum:0, color:T.muted, isIntern:true, noMemory:true};
const ACTION_COLORS_FETCH={CLICK:"rgba(45,111,181,0.12)",FILL:"rgba(0,200,150,0.1)",SELECT:"rgba(245,166,35,0.1)",NAVIGATE:"rgba(155,110,243,0.1)",SCROLL:"rgba(138,173,202,0.1)",WAIT:"rgba(138,173,202,0.1)",DOWNLOAD:"rgba(0,200,150,0.15)",DONE:"rgba(0,200,150,0.15)",STUCK:"rgba(168,51,25,0.1)",ERROR:"rgba(168,51,25,0.1)"};
const ACTION_TEXT_COLORS_FETCH={CLICK:"#2d6fb5",FILL:"#00c896",SELECT:"#f5a623",NAVIGATE:"#9b6ef3",SCROLL:"#8aadca",WAIT:"#8aadca",DOWNLOAD:"#00c896",DONE:"#00c896",STUCK:"#c0392b",ERROR:"#c0392b"};

const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@keyframes borderPulse {
  0%,100% { border-color: ${T.brass}55; box-shadow: 0 0 0 0 rgba(182,135,58,0); }
  50% { border-color: ${T.brass}; box-shadow: 0 0 18px 4px rgba(182,135,58,0.2); }
}
.upload-blink { animation: borderPulse 2s ease-in-out infinite; }
*, *::before, *::after { box-sizing: border-box; }
html, body, #root { margin: 0; padding: 0; width: 100%; min-height: 100vh; background: ${T.paperDeep}; }
@keyframes hModalFadeIn { from{opacity:0} to{opacity:1} }
@keyframes hModalPopIn  { from{opacity:0;transform:translate(-50%,-50%) scale(0.93)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
@keyframes pdot { 0%,100%{opacity:1} 50%{opacity:0.2} }
@keyframes dbounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-3px);opacity:1} }
`;

const NAV_GROUPS = [
  { id:"overview-group", label:"Overview", tabs:[{id:"overview",label:"Dashboard",icon:"▦"}] },
  { id:"analysis-group", label:"Analysis", tabs:[
    {id:"categories",label:"Categories",icon:"◈"},
    {id:"treemap",label:"Treemap",icon:"⊞"},
    {id:"vendors",label:"Vendors",icon:"🏢"},
    {id:"timeline",label:"Timeline",icon:"📅"},
  ]},
  { id:"strategy-group", label:"Strategy", tabs:[
    {id:"flags",label:"Concerns",icon:"⚑"},
    {id:"localspend",label:"Local Spend",icon:"📍"},
    {id:"concentration",label:"Vendor Diversity",icon:"⚡"},
    {id:"aibriefing",label:"AI Review",icon:"✨"},
  ]},
  { id:"data-group", label:"Data", tabs:[
    {id:"updatefile",label:"Update File",icon:"↺"},
    {id:"cleanup",label:"Cleanup",icon:"🧹"},
    {id:"table",label:"Full Table",icon:"📋"},
  ]},
];

const TimelinePctLabel = ({x,y,width,value,total}) => {
  if(!total||!value||width<20) return null;
  const pct = (value/total*100).toFixed(1);
  return <text x={x+width/2} y={y-4} textAnchor="middle" fill={T.brassDeep} fontSize={9} fontWeight={600} fontFamily={mono}>{pct}%</text>;
};

export default function NIGPAnalyzer() {
  // ── Fetch Agent State ────────────────────────────────────────────────────────
  const [fetchScreen,setFetchScreen]=useState("landing"); // "landing"|"configure"|"running"
  const [fetchState,setFetchState]=useState("maryland");
  const [fetchYear,setFetchYear]=useState("2025");
  const [fetchDateFrom,setFetchDateFrom]=useState("01/01/2025");
  const [fetchDateTo,setFetchDateTo]=useState("01/30/2025");
  const [fetchEvents,setFetchEvents]=useState([]);
  const [fetchRunning,setFetchRunning]=useState(false);
  const [fetchThinking,setFetchThinking]=useState(false);
  const [fetchThinkingText,setFetchThinkingText]=useState("");
  const [fetchComplete,setFetchComplete]=useState(null); // {fileName, filePath, steps}
  const [fetchStopped,setFetchStopped]=useState(false);
  // Feature 1: timing
  const fetchStartTimeRef=useRef(null);
  const [fetchTotalTime,setFetchTotalTime]=useState(null);
  // Feature 3+4: which agent is fetching — default Brent, option to use Pat
  const [fetchAgentId,setFetchAgentId]=useState("brent"); // "brent"|"pat"
  const fetchEventSourceRef=useRef(null);
  const fetchListRef=useRef(null);
  const fetchEventsRef=useRef([]); // ref copy for SSE closure access
  // Canonical step count — action events only, used for all step displays
  const fetchActionCount = fetchEvents.filter(e=>e.action||e.type==="downloaded").length;
  const [fetchSelectedEvent,setFetchSelectedEvent]=useState(null);
  const fetchApiBase = import.meta.env.VITE_FETCH_API_URL || FETCH_API_BASE_DEFAULT;

  // Auto-scroll event list to bottom (latest) unless user has scrolled up
  const fetchUserScrolledRef = useRef(false);
  useEffect(()=>{
    const el = fetchListRef.current;
    if(!el) return;
    // If user hasn't scrolled up, keep pinned to bottom
    if(!fetchUserScrolledRef.current){
      el.scrollTop = el.scrollHeight;
    }
    // Auto-select latest event so screenshot always shows current step
    if(fetchEvents.length>0 && !fetchUserScrolledRef.current){
      setFetchSelectedEvent(fetchEvents.length-1);
    }
  },[fetchEvents]);
  // Track if user manually scrolled up
  const handleFetchScroll = useCallback(()=>{
    const el = fetchListRef.current;
    if(!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    fetchUserScrolledRef.current = !atBottom;
  },[]);

  const stopFetchAgent=useCallback(()=>{
    if(fetchEventSourceRef.current){fetchEventSourceRef.current.close();fetchEventSourceRef.current=null;}
    setFetchRunning(false);
    setFetchThinking(false);
    setFetchStopped(true);
    const elapsed=fetchStartTimeRef.current?((Date.now()-fetchStartTimeRef.current)/1000):null;
    setFetchTotalTime(elapsed);
    setFetchEvents(prev=>{
      const actionCount=prev.filter(e=>e.action||e.type==="downloaded").length;
      return [...prev,{type:"stopped",narration:`Agent halted by user after ${elapsed?elapsed.toFixed(1)+"s":""} · ${actionCount} steps taken.`,timestamp:new Date().toISOString()}];
    });
    fetchUserScrolledRef.current=false;
    setTimeout(()=>{ if(fetchListRef.current){ fetchListRef.current.scrollTop=fetchListRef.current.scrollHeight; }},100);
  },[]);

  const runFetchAgent=useCallback((agentId="brent")=>{
    setFetchAgentId(agentId);
    setFetchEvents([]);
    setFetchComplete(null);
    setFetchStopped(false);
    setFetchRunning(true);
    setFetchThinking(true);
    setFetchThinkingText("Connecting to agent…");
    setFetchTotalTime(null);
    fetchStartTimeRef.current=Date.now();
    setFetchScreen("running");
    const stateConfig=FETCH_STATES.find(s=>s.key===fetchState);
    const usePat=agentId==="pat";
    const url=`${fetchApiBase}/agent/run?state=${fetchState}&year=${fetchYear}&dateFrom=${encodeURIComponent(fetchDateFrom)}&dateTo=${encodeURIComponent(fetchDateTo)}${usePat?"&noMemory=true":""}`;
    const es=new EventSource(url);
    fetchEventSourceRef.current=es;
    es.onmessage=(event)=>{
      const data=JSON.parse(event.data);
      if(data.type==="end"){es.close();fetchEventSourceRef.current=null;setFetchRunning(false);setFetchThinking(false);return;}
      if(data.type==="complete"){
        const elapsed=fetchStartTimeRef.current?((Date.now()-fetchStartTimeRef.current)/1000):null;
        setFetchTotalTime(elapsed);
        // Count only real agent action events for canonical step count
        const canonicalSteps=fetchEventsRef.current.filter(e=>e.action||e.type==="downloaded").length;
        setFetchComplete({fileName:data.fileName,filePath:data.filePath,steps:canonicalSteps,narration:data.narration,success:data.success,totalTime:elapsed});
        setFetchThinking(false);
        const timeStr=elapsed?` in ${elapsed<60?elapsed.toFixed(1)+"s":Math.floor(elapsed/60)+"m "+Math.round(elapsed%60)+"s"}`:"";
        setFetchThinkingText(data.success?`✓ Complete — ${data.fileName} downloaded in ${canonicalSteps} steps${timeStr}. No human required.`:"Agent finished but could not complete the download.");
        setFetchRunning(false);
        // Force scroll to bottom so action items are visible
        fetchUserScrolledRef.current=false;
        setTimeout(()=>{ if(fetchListRef.current){ fetchListRef.current.scrollTop=fetchListRef.current.scrollHeight; }},100);
        // Browser-side memory accuracy patch — update the just-saved entry with canonical values
        if(data.success && fetchAgentId!=="pat"){
          fetch("/api/web-memory-patch",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              steps_taken: canonicalSteps,
              total_time_seconds: elapsed,
            }),
          }).catch(()=>{});
        }
        return;
      }
      if(["start","step","downloaded","error","stuck","max_steps","action_error"].includes(data.type)){
        setFetchEvents(prev=>{const next=[...prev,data];fetchEventsRef.current=next;return next;});
        if(data.type==="step") setFetchThinkingText(`Analyzing screenshot — deciding next action… (step ${data.step})`);
        if(data.type==="downloaded") setFetchThinkingText(`File downloaded: ${data.narration}`);
        if(data.type==="error"||data.type==="stuck") setFetchThinkingText(`⚠ ${data.narration}`);
        setFetchThinking(data.type==="step"||data.type==="start");
      }
    };
    es.onerror=()=>{
      setFetchEvents(prev=>[...prev,{type:"error",narration:"Connection to agent server lost. Is the Railway backend running?",timestamp:new Date().toISOString()}]);
      setFetchRunning(false);setFetchThinking(false);
      setFetchThinkingText("⚠ Connection lost. Check that the Railway backend is running.");
      es.close();fetchEventSourceRef.current=null;
    };
  },[fetchState,fetchYear,fetchDateFrom,fetchDateTo,fetchApiBase]);

  const [stage,setStage]=useState("overview");
  const [helpOpen,setHelpOpen]=useState(false);
  const [helpDropdown,setHelpDropdown]=useState(false);
  const [columns,setColumns]=useState([]);
  const [fileName,setFileName]=useState("");
  const [mapping,setMapping]=useState({});
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [activeTab,setActiveTab]=useState("overview");
  const [searchTerm,setSearchTerm]=useState("");
  const inputRef = useRef();
  const hiddenInputRef = useRef();

  const [localViewBy,setLocalViewBy]=useState("city");
  const [localSelected,setLocalSelected]=useState("");
  const [localApplied,setLocalApplied]=useState(null);

  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const [aiError,setAiError]=useState("");
  const [hhiTooltipVisible,setHhiTooltipVisible]=useState(false);

  // AI Review agent picker state
  const [aiReviewStage,setAiReviewStage]=useState(1); // 1=pick, 2=generating, 3=results
  const [aiPickedAgents,setAiPickedAgents]=useState([]);
  const [aiResults,setAiResults]=useState({});
  const [aiReviewError,setAiReviewError]=useState("");
  const [aiChristySelected,setAiChristySelected]=useState(false);

  // Session-persistent config selections: { [agent_id]: { role_prompt_id, output_format_id } }
  // Persists for the browser session; resets on page reload.
  const [sessionConfigs,setSessionConfigs]=useState({});
  // Per-agent selectable config options loaded on demand
  const [agentConfigOptions,setAgentConfigOptions]=useState({});

  const loadAgentConfigOptions=async(agentId)=>{
    if(agentConfigOptions[agentId]) return;
    try{
      const [rRes,fRes]=await Promise.all([
        fetch(`/api/agent-configs?tenant_id=global&agent_id=${agentId}&type=role_prompt`),
        fetch(`/api/agent-configs?tenant_id=global&agent_id=${agentId}&type=output_format`),
      ]);
      const [rData,fData]=await Promise.all([rRes.json(),fRes.json()]);
      const rolePrompts=(rData.configs||[]).filter(c=>c.is_user_selectable||c.is_default);
      const outputFormats=(fData.configs||[]).filter(c=>c.is_user_selectable||c.is_default);
      setSessionConfigs(prev=>{
        const current=prev[agentId]||{};
        const defRole=rolePrompts.find(c=>c.is_default);
        const defFormat=outputFormats.find(c=>c.is_default);
        return{...prev,[agentId]:{
          role_prompt_id: current.role_prompt_id||(defRole?.id||""),
          output_format_id: current.output_format_id||(defFormat?.id||""),
        }};
      });
      setAgentConfigOptions(prev=>({...prev,[agentId]:{rolePrompts,outputFormats}}));
    }catch(e){console.warn("Could not load agent config options for",agentId,e.message);}
  };

  const setSessionConfig=(agentId,field,value)=>{
    setSessionConfigs(prev=>({...prev,[agentId]:{...(prev[agentId]||{}), [field]:value}}));
  };

  

  const toggleAiAgent=(id)=>{
    if(id==="christy") return; // add-on only, not pickable here
    setAiPickedAgents(prev=>{
      if(prev.includes(id)) return prev.filter(x=>x!==id);
      if(prev.length>=2) return prev;
      // Load user-selectable config options for this agent on first selection
      loadAgentConfigOptions(id);
      return [...prev,id];
    });
  };

  const runAiReview=async()=>{
    if(aiPickedAgents.length===0) return;
    setAiReviewStage(2); setAiResults({}); setAiReviewError("");
    const top5cats=data.classArr.slice(0,5).map(c=>`${c.displayLabel}: ${fmtFull(c.total)} (${(c.total/data.totalSpend*100).toFixed(1)}%)`);
    const top5vend=data.vendorArr.slice(0,5).map(v=>`${v.name}: ${fmtFull(v.total)} (${(v.total/data.totalSpend*100).toFixed(1)}%)`);
    const flagSummary=data.flags.map(f=>`[${f.severity.toUpperCase()}] ${f.title}: ${f.summary}`);
    const userMsg=`Analyze this procurement portfolio for an executive briefing.\n\nFile: ${fileName}\nTotal Spend: ${fmtFull(data.totalSpend)}\nTransactions: ${data.txCount.toLocaleString()}\nCategories: ${data.classArr.length}\nVendors: ${data.vendorArr.length}\n\nTOP CATEGORIES:\n${top5cats.join("\n")}\n\nTOP VENDORS:\n${top5vend.join("\n")}\n\nFLAGS:\n${flagSummary.join("\n")}\n\nWrite four sections: Portfolio Overview, Risk Assessment, Strategic Opportunities, Bottom Line. Use flowing paragraphs, no bullet points.`;
    try{
      const newResults={};
      for(const agentId of aiPickedAgents){
        const agentSession=sessionConfigs[agentId]||{};
        const res=await fetch("/api/brief",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          messages:[{role:"user",content:userMsg}],
          agent_id:agentId,
          tenant_id:"global",
          role_prompt_id:agentSession.role_prompt_id||undefined,
          output_format_id:agentSession.output_format_id||undefined,
          ragContext:{queryText:`${data.flags.map(f=>f.title).join(" ")} procurement analysis ${fileName}`,jurisdiction:"Texas",triggers:[]},
        })});
        const json=await res.json();
        newResults[agentId]=json.content?.[0]?.text||json.error||"No response";
      }
      setAiResults(newResults);
      setAiReviewStage(3);
    }catch(err){
      setAiReviewError("Generation failed: "+err.message);
      setAiReviewStage(2); // stay on generating screen so error is visible
    }
  };

  const analyzeAiText=(text)=>{
    if(!text) return{words:0,statutes:0,dollars:0,orgs:0,claims:0,hedges:0};
    return{
      words:(text.split(/\s+/).filter(Boolean)).length,
      statutes:(text.match(/§\s*\d+|CFR\s+\d+|\bLGC\b|\bU\.S\.C\b/gi)||[]).length,
      dollars:(text.match(/\$[\d,]+(?:\.\d+)?/gi)||[]).length,
      orgs:(text.match(/\b(?:NIGP|NASPO|GAO|OMB|CPPO|FAR|DIR)\b/g)||[]).length,
      claims:(text.match(/\d+(?:\.\d+)?%|\d{1,3}(?:,\d{3})+/g)||[]).length,
      hedges:(text.match(/\b(?:may|might|could|possibly|potentially|appears|seems|likely|unclear|suggests)\b/gi)||[]).length,
    };
  };

  const generateBriefing = async () => {
    if (!data) return;
    setAiLoading(true); setAiResult(null); setAiError("");
    const top5cats = data.classArr.slice(0,5).map(c=>`${c.displayLabel}: ${fmtFull(c.total)} (${(c.total/data.totalSpend*100).toFixed(1)}%)`);
    const top5vend = data.vendorArr.slice(0,5).map(v=>`${v.name}: ${fmtFull(v.total)} (${(v.total/data.totalSpend*100).toFixed(1)}%)`);
    const flagSummary = data.flags.map(f=>`[${f.severity.toUpperCase()}] ${f.title}: ${f.summary}`);
    const hhi = data.vendorConc ? data.vendorConc.hhi.toFixed(0) : "N/A";
    const systemPrompt = `You are a senior government procurement analyst writing an executive briefing for a Chief Procurement Officer (CPO). Write in a direct, authoritative tone. Use precise numbers from the data. Structure your response in clean HTML using only: <h2>, <h3>, <p>, <strong>, <span style="...">, <div style="...">. Use colors: accent #b6873a, risk #a83319, warning #b8721a, text #28221a. Do not use bullet points. Write in flowing paragraphs like a McKinsey memo. IMPORTANT: Do not add any margin, padding, max-width, or width styles to any element. Do not wrap content in a body or html tag. Do not add page-level layout styles.`;
    const userPrompt = `Write a CPO Executive Briefing for this procurement data.\n\nFile: ${fileName}\nTotal Spend: ${fmtFull(data.totalSpend)}\nTransactions: ${data.txCount.toLocaleString()}\nCategories: ${data.classArr.length}\nUnique Vendors: ${data.vendorArr.length}\nVendor HHI: ${hhi} (>2500=highly concentrated)\n\nTOP 5 CATEGORIES:\n${top5cats.join("\n")}\n\nTOP 5 VENDORS:\n${top5vend.join("\n")}\n\nPROCUREMENT FLAGS:\n${flagSummary.join("\n")}\n\nWrite exactly four sections:\n1. PORTFOLIO OVERVIEW\n2. RISK ASSESSMENT\n3. STRATEGIC OPPORTUNITIES\n4. BOTTOM LINE\n\nFormat as clean HTML. Make it feel like a premium consulting deliverable.`;
    try {
      const isLocalhost = window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";
      const endpoint = isLocalhost?"https://api.anthropic.com/v1/messages":"/api/brief";
      const response = await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:6000,system:systemPrompt,messages:[{role:"user",content:userPrompt}]})});
      const result = await response.json();
      if(result.error) throw new Error(result.error.message||JSON.stringify(result.error));
      const raw = result.content?.map(b=>b.text||"").join("")||"";
      const html = raw.replace(/^```html\s*/i,"").replace(/```\s*$/i,"").trim();
      setAiResult(html);
    } catch(err){ setAiError("Generation failed: "+err.message); }
    setAiLoading(false);
  };

  const processFile = useCallback(file => {
    if(!file) return;
    setLoading(true); setError(""); setFileName(file.name); fileStore.current=file;
    Papa.parse(file,{ header:true, skipEmptyLines:true, preview:5,
      complete:results=>{ const cols=Object.keys(results.data[0]||{}); if(!cols.length){setError("No columns found.");setLoading(false);return;} setColumns(cols); setMapping(autoDetect(cols)); setStage("map"); setLoading(false); },
      error:e=>{setError("Parse error: "+e.message);setLoading(false);}
    });
  },[]);

  // When fetch completes successfully, load the downloaded file via the proxy and hand it to processFile
  const handleFetchAnalyze=useCallback(async()=>{
    if(!fetchComplete?.filePath) return;
    setLoading(true);setError("");
    try{
      const url=`${fetchApiBase}/agent/download?file=${encodeURIComponent(fetchComplete.filePath)}`;
      const res=await fetch(url);
      if(!res.ok) throw new Error("Could not retrieve downloaded file from agent server.");
      const blob=await res.blob();
      const stateConfig=FETCH_STATES.find(s=>s.key===fetchState);
      const fileName=fetchComplete.fileName||`${stateConfig?.name||fetchState}_${fetchYear}.csv`;
      const file=new File([blob],fileName,{type:"text/csv"});
      setFetchScreen("landing");
      processFile(file);
    }catch(e){setError("Could not load fetched file: "+e.message);setLoading(false);}
  },[fetchComplete,fetchState,fetchYear,fetchApiBase,processFile]);


  const runAnalysis = useCallback(()=>{
    if(!mapping.amount){setError("Please assign the Spend Amount column.");return;}
    // NIGP column is optional — analysis proceeds without it
    setLoading(true); setError("");
    Papa.parse(fileStore.current,{ header:true, skipEmptyLines:true,
      complete:results=>{
        try{
          const {amount:aC,nigp:nC,vendor:vC,contract:cC,po:pC,department:dC,vendor_state:sC,vendor_city:cityC,date:dtC}=mapping;
          const rows=[]; const byClass={},byVendor={},byDept={},byMonth={}; let total=0,txCount=0,skipped=0,unrecognized=0; const dirtyRows=[];
          for(const row of results.data||[]){
            const amt=parseAmt(row[aC]); if(isNaN(amt)||amt<=0){skipped++;continue;} row._amt=amt; rows.push(row);
            const rawCode=row[nC]; const {classCode,label}=resolveNIGP(rawCode);
            const isMissing=!rawCode||String(rawCode).trim()===''||String(rawCode).trim()==='0';
            const isPlaceholder=!isMissing&&String(rawCode).replace(/\D/g,'').length<3;
            const isUnrecognized=!isMissing&&!isPlaceholder&&label.startsWith("Unrecognized");
            if(isMissing||isPlaceholder||isUnrecognized){ unrecognized++; dirtyRows.push({rawCode:isMissing?'(blank)':String(rawCode).trim(),classCode,issue:isMissing?'Missing Code':isPlaceholder?'Code Too Short':'Unrecognized Class',description:row[mapping.description]||row['COMMODITY_DESCRIPTION']||'',vendor:vC?(String(row[vC]||'').trim()||'Unknown'):'',amount:amt,po:mapping.po?String(row[mapping.po]||'').trim():'',date:dtC?String(row[dtC]||'').trim():'',rawRow:row}); }
            const key=`${classCode}|${label}`; if(!byClass[key]) byClass[key]={label,displayLabel:shortLabel(label),classCode,total:0,count:0}; byClass[key].total+=amt; byClass[key].count++;
            if(vC&&row[vC]){const v=String(row[vC]).trim()||"Unknown"; if(!byVendor[v])byVendor[v]={name:v,total:0,count:0}; byVendor[v].total+=amt; byVendor[v].count++;}
            if(dC&&row[dC]){const d=String(row[dC]).trim()||"Unknown"; if(!byDept[d])byDept[d]={name:d,total:0,count:0}; byDept[d].total+=amt; byDept[d].count++;}
            if(dtC&&row[dtC]){const m=String(row[dtC]).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/); if(m){const mo=m[1].padStart(2,"0"),yr=m[3].length===2?"20"+m[3]:m[3],k=`${yr}-${mo}`; if(!byMonth[k])byMonth[k]={month:k,total:0,count:0}; byMonth[k].total+=amt; byMonth[k].count++;}}
            total+=amt; txCount++;
          }
          const classArr=Object.values(byClass).sort((a,b)=>b.total-a.total);
          const vendorArr=Object.values(byVendor).sort((a,b)=>b.total-a.total);
          const deptArr=Object.values(byDept).sort((a,b)=>b.total-a.total);
          const monthArr=Object.values(byMonth).sort((a,b)=>a.month.localeCompare(b.month));
          const flags=computeFlags(rows,mapping); const vendorConc=computeVendorConc(rows,mapping,total);
          const cityValues=cityC?[...new Set(rows.map(r=>String(r[cityC]||"").trim()).filter(Boolean))].sort():[];
          const stateValues=sC?[...new Set(rows.map(r=>String(r[sC]||"").trim().toUpperCase()).filter(Boolean))].sort():[];
          setData({classArr,vendorArr,deptArr,monthArr,totalSpend:total,txCount,skipped,unrecognized,hasVendor:!!mapping.vendor&&vendorArr.length>0,hasDept:!!mapping.department&&deptArr.length>0,hasDate:monthArr.length>0,hasContract:!!mapping.contract,rowCount:(results.data||[]).length,flags,vendorConc,dirtyRows,rows,cityValues,stateValues,hasCityField:!!cityC,hasStateField:!!sC});
          setActiveTab("overview"); setStage("analyze");
        }catch(e){setError(e.message);}
        setLoading(false);
      },
      error:e=>{setError("Parse error: "+e.message);setLoading(false);}
    });
  },[mapping]);

  const top15C=useMemo(()=>data?.classArr.slice(0,15)||[],[data]);
  const top15V=useMemo(()=>data?.vendorArr.slice(0,15)||[],[data]);
  const pieData=useMemo(()=>{ if(!data) return []; const top=data.classArr.slice(0,9); const other=data.classArr.slice(9).reduce((s,x)=>s+x.total,0); const r=top.map(x=>({name:x.displayLabel,value:x.total})); if(other>0) r.push({name:"All Other",value:other}); return r; },[data]);
  const treemapData=useMemo(()=>data?.classArr.slice(0,30).map(x=>({name:x.displayLabel,size:x.total,value:x.total}))||[],[data]);
  const filtered=useMemo(()=>{ if(!data) return []; const q=searchTerm.toLowerCase(); return data.classArr.filter(x=>x.label.toLowerCase().includes(q)||x.classCode.includes(q)); },[data,searchTerm]);

  const highFlags=(data?.flags||[]).filter(f=>f.severity==="high").length;
  const dirtyCount=data?.dirtyRows?.length||0;

  const availableTabs = useMemo(()=>{
    if(!data) return new Set(["overview"]);
    const s=new Set(["overview","categories","treemap","flags","concentration","localspend","aibriefing","table","updatefile"]);
    if(data.hasVendor) s.add("vendors");
    if(data.hasDept) s.add("departments");
    if(data.hasDate) s.add("timeline");
    if(dirtyCount>0) s.add("cleanup");
    return s;
  },[data,dirtyCount]);

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const Header = () => (
    <div style={{background:T.navy,color:T.card,padding:"0 28px",display:"flex",alignItems:"stretch",height:60,borderBottom:`3px solid ${T.brass}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:T.brass,color:T.navy,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:display,fontWeight:700,fontSize:15,border:`2px solid ${T.card}`}}>N</div>
        <div>
          <div style={{fontFamily:display,fontSize:17,fontWeight:600,letterSpacing:0.2,lineHeight:1}}>NIGP Spend Analyzer</div>
          <div style={{fontFamily:body,fontSize:9.5,color:"#b8c5d8",letterSpacing:1.5,textTransform:"uppercase",marginTop:3}}>Procurement Intelligence</div>
        </div>
      </div>
      <div style={{flex:1}}/>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {stage==="analyze"&&data&&(
          <button onClick={()=>setStage("map")} style={{background:"transparent",border:`1px solid ${T.card}40`,color:T.card,padding:"6px 14px",cursor:"pointer",fontSize:12,fontFamily:body}}>← Column Mapping</button>
        )}
        <button onClick={()=>window.open("/admin","_blank")} style={{background:"transparent",border:`1px solid ${T.card}40`,color:T.card,padding:"6px 14px",cursor:"pointer",fontSize:12,fontFamily:body,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:11}}>⚙</span> Build AI Analyst Team
        </button>
        <div style={{position:"relative"}}>
          <button onClick={()=>setHelpDropdown(d=>!d)} style={{background:helpDropdown?`${T.brass}30`:"transparent",border:`1px solid ${T.card}40`,color:T.card,padding:"6px 14px",cursor:"pointer",fontSize:12,fontFamily:body,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:12}}>?</span> Help <span style={{fontSize:9,opacity:0.7}}>▼</span>
          </button>
          {helpDropdown&&(
            <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:T.card,border:`1px solid ${T.line}`,minWidth:210,boxShadow:"0 12px 32px rgba(0,0,0,0.3)",zIndex:1000,overflow:"hidden"}}>
              <div style={{padding:"7px 14px",borderBottom:`1px solid ${T.line}`}}>
                <span style={{fontSize:9.5,color:T.brassDeep,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,fontFamily:mono}}>Video Guides</span>
              </div>
              <button onClick={()=>{setHelpOpen(true);setHelpDropdown(false);}} style={{width:"100%",background:"none",border:"none",padding:"10px 14px",textAlign:"left",color:T.ink,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:9,fontFamily:body}}
                onMouseEnter={e=>e.currentTarget.style.background=T.cardAlt}
                onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <span style={{fontSize:14}}>▶</span>
                <div>
                  <div style={{fontWeight:600,fontSize:12,color:T.navy}}>NIGP Analyzer Demo</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:1}}>1 min · Getting Started</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if(loading) return (
    <div style={{minHeight:"100vh",background:T.paperDeep,fontFamily:body,color:T.ink}}>
      <style>{GLOBAL_STYLE}</style>
      <Header/>
      <div style={{textAlign:"center",padding:"120px 0",color:T.muted}}>
        <div style={{fontFamily:display,fontSize:28,fontWeight:500,color:T.navy,marginBottom:12}}>Analyzing spend data…</div>
        <div style={{fontFamily:mono,fontSize:12,color:T.brass}}>Processing transactions · Classifying NIGP codes · Computing vendor concentration</div>
      </div>
    </div>
  );

  // ── MAPPING STAGE ────────────────────────────────────────────────────────────
  if(stage==="map") return (
    <div style={{minHeight:"100vh",background:T.paperDeep,fontFamily:body,color:T.ink}}>
      <style>{GLOBAL_STYLE}</style>
      <Header/>
      <div style={{maxWidth:"100%",margin:"32px auto",padding:"0 28px"}}>
        {/* Top action strip */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <div style={{fontFamily:display,fontSize:22,fontWeight:600,color:T.navy,marginBottom:5}}>Confirm Column Mapping</div>
            <div style={{fontSize:13,color:T.muted}}>Found <strong style={{color:T.ink}}>{columns.length} columns</strong> in <strong style={{color:T.ink}}>{fileName}</strong>.</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            {activeTab==="updatefile"&&<button onClick={()=>{setStage("analyze");setActiveTab("overview");}} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"10px 20px",cursor:"pointer",fontSize:13,fontFamily:body}}>Cancel</button>}
            <button onClick={()=>{setStage("overview");setData(null);setError("");setFileName("");setFetchScreen("landing");}} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"10px 20px",cursor:"pointer",fontSize:13,fontFamily:body}}>← Cancel</button>
            <button onClick={runAnalysis} style={{background:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,border:"none",color:T.navy,padding:"10px 24px",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:display}}>Run Analysis →</button>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          {Object.entries(FIELD_DEFS).map(([field,def])=>{
            const val=mapping[field]||"";
            return(
              <div key={field} style={{background:T.card,border:`1px solid ${val?T.brass+"66":T.line}`,padding:"13px 18px",display:"grid",gridTemplateColumns:"1fr 1.3fr",gap:16,alignItems:"center",position:"relative"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:700,color:T.navy,fontFamily:display}}>{def.label}</span>
                    {def.required&&<span style={{fontSize:9.5,background:`${T.moss}18`,color:T.moss,padding:"1px 7px",fontWeight:700,fontFamily:mono,border:`1px solid ${T.moss}40`}}>REQUIRED</span>}
                  </div>
                  <div style={{fontSize:12,color:T.muted}}>{def.hint}</div>
                </div>
                <div>
                  <select value={val} onChange={e=>setMapping(m=>({...m,[field]:e.target.value}))} style={{width:"100%",background:T.cardAlt,border:`1px solid ${val?T.brass+"66":T.line}`,padding:"9px 12px",color:val?T.ink:T.muted,fontSize:13,cursor:"pointer",outline:"none",fontFamily:body}}>
                    <option value="">— Skip this field —</option>
                    {columns.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  {val&&<div style={{fontSize:11,color:T.moss,marginTop:4,fontFamily:mono}}>✓ {val}</div>}
                </div>
              </div>
            );
          })}
        </div>
        {error&&<div style={{marginTop:14,background:`${T.flag}10`,border:`1px solid ${T.flag}44`,padding:"12px 16px",color:T.flag,fontSize:14}}>⚠ {error}</div>}
        {/* Bottom action strip */}
        <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
          {activeTab==="updatefile"&&<button onClick={()=>{setStage("analyze");setActiveTab("overview");}} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"12px 24px",cursor:"pointer",fontSize:13,fontFamily:body}}>Cancel</button>}
          <button onClick={()=>{setStage("overview");setData(null);setError("");setFileName("");}} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"12px 24px",cursor:"pointer",fontSize:14,fontFamily:body}}>+ Add New File</button>
          <button onClick={runAnalysis} style={{background:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,border:"none",color:T.navy,padding:"12px 24px",cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:display}}>Run Analysis →</button>
        </div>
      </div>
    </div>
  );

  // ── LANDING / FETCH SCREENS (full-page, no sidebar) ─────────────────────────
  if(!data) {
    const wfAdmin = (
      <div onClick={()=>window.open("/admin","_blank")} style={{width:130,flexShrink:0,flexGrow:0,padding:"11px 12px 10px",background:"#2a2016",borderLeft:`3px solid ${T.brass}`,display:"flex",flexDirection:"column",gap:3,cursor:"pointer"}}>
        <div style={{fontFamily:mono,fontSize:"8.5px",color:`${T.brass}88`,letterSpacing:1,fontWeight:500}}>⚙</div>
        <div style={{fontFamily:display,fontSize:11,fontWeight:600,color:`${T.brassLight}AA`,lineHeight:1.3,fontStyle:"italic"}}>Admin Options</div>
        <div style={{fontFamily:mono,fontSize:"7.5px",color:`${T.brass}55`,marginTop:2,letterSpacing:0.5}}>Build AI Analyst Team</div>
      </div>
    );
    const Workflow = () => (
      <div style={{display:"flex",alignItems:"stretch",marginBottom:28,border:`1px solid ${T.line}`,background:T.card,overflow:"hidden"}}>
        {[{n:"01",l:"Load Data",active:true},{n:"02",l:"Map Columns & Fields"},{n:"03",l:"Auto-Analyze"},{n:"04",l:"Strategic Action Items",last:true}].map(s=>(
          <div key={s.n} style={{flex:1,padding:"11px 12px 10px",position:"relative",display:"flex",flexDirection:"column",gap:3,background:s.active?T.navy:T.card,borderRight:s.last?"none":`1px solid ${T.line}`}}>
            <div style={{fontFamily:mono,fontSize:"8.5px",color:s.active?"rgba(255,255,255,0.4)":T.muted,letterSpacing:1,fontWeight:500}}>{s.n}</div>
            <div style={{fontFamily:display,fontSize:11,fontWeight:600,color:s.active?T.brassLight:T.navyMid,lineHeight:1.3}}>{s.l}</div>
            {!s.last&&<span style={{position:"absolute",right:-7,top:"50%",transform:"translateY(-50%)",zIndex:2,fontSize:8,color:s.active?"rgba(255,255,255,0.25)":T.line,pointerEvents:"none"}}>▶</span>}
          </div>
        ))}
        <div style={{width:8,flexShrink:0,background:T.paperDeep,borderLeft:`1px solid ${T.line}`}}/>
        {wfAdmin}
      </div>
    );

    // ── RUNNING SCREEN (full viewport) ──────────────────────────────────────
    if(fetchScreen==="running") return (
      <div style={{height:"100vh",background:T.paperDeep,fontFamily:body,color:T.ink,display:"flex",flexDirection:"column",overflow:"hidden",position:"fixed",inset:0}}>
        <style>{GLOBAL_STYLE}</style>
        {/* Sticky app header */}
        <div style={{flexShrink:0}}>
          <Header/>
        </div>
        {/* Sticky fetch topbar */}
        <div style={{background:T.navy,borderBottom:`2px solid ${T.brass}`,padding:"8px 20px",display:"flex",alignItems:"center",gap:0,flexShrink:0,flexWrap:"nowrap"}}>
          <div style={{flexShrink:0,marginRight:20}}>
            <div style={{fontFamily:display,fontSize:13,fontWeight:600,color:T.brassLight}}>
              {fetchAgentId==="pat"?"👩‍💼 Pat (Intern)":"🌐 Brent"} — {FETCH_STATES.find(s=>s.key===fetchState)?.name} · {FETCH_STATES.find(s=>s.key===fetchState)?.portal}
              {fetchTotalTime&&<span style={{fontFamily:mono,fontSize:10,color:T.brassLight,marginLeft:12}}>⏱ {fetchTotalTime<60?fetchTotalTime.toFixed(1)+"s":Math.floor(fetchTotalTime/60)+"m "+Math.round(fetchTotalTime%60)+"s"} total</span>}
            </div>
            <div style={{fontFamily:mono,fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:0.5,marginTop:1}}>{fetchDateFrom} → {fetchDateTo} · claude-sonnet-4-5 · Playwright</div>
          </div>
          <div style={{display:"flex",alignItems:"center",flex:1,overflow:"hidden"}}>
            {["Load Data","Map Fields","Auto-Analyze","Strategy"].map((s,i,arr)=>(
              <span key={s}>
                <span style={{fontFamily:mono,fontSize:"8px",textTransform:"uppercase",letterSpacing:1,padding:"3px 8px",color:i===0?T.brassLight:"rgba(255,255,255,0.25)",fontWeight:i===0?600:400,position:"relative"}}>
                  {s}
                  {i===0&&<span style={{position:"absolute",bottom:-1,left:8,right:8,height:1.5,background:T.brass,display:"block"}}/>}
                </span>
                {i<arr.length-1&&<span style={{color:"rgba(255,255,255,0.12)",fontSize:9}}>›</span>}
              </span>
            ))}
            <span style={{fontFamily:mono,fontSize:"8px",textTransform:"uppercase",letterSpacing:1,padding:"3px 8px",color:"rgba(182,135,58,0.35)",borderLeft:"2px solid rgba(182,135,58,0.2)",marginLeft:4,fontStyle:"italic"}}>⚙ Admin / AI Team</span>
          </div>
          <button onClick={()=>{if(fetchRunning)stopFetchAgent();setFetchScreen("configure");}} style={{marginLeft:16,fontFamily:mono,fontSize:"9px",textTransform:"uppercase",letterSpacing:1.5,color:"rgba(255,255,255,0.45)",background:"none",border:"1px solid rgba(255,255,255,0.2)",padding:"5px 12px",cursor:"pointer",flexShrink:0}}>← Cancel</button>
        </div>
        {/* Stop bar — only shown while running */}
        {fetchRunning&&(
          <div style={{background:"#7f1d1d",borderBottom:"2px solid #ef4444",padding:"6px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{fontSize:12,color:"#fff",fontWeight:600,display:"flex",alignItems:"center",gap:7}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"#ef4444",display:"inline-block",flexShrink:0}}/>
              Agent is running — click Stop to halt at any time
            </div>
            <button onClick={stopFetchAgent} style={{background:"#c0392b",color:"#fff",border:"none",padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:body}}>⬛ Stop Agent</button>
          </div>
        )}
        {/* Split pane — fills ALL remaining viewport height */}
        <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>
          {/* Event pane — own scrollable column, pinned to bottom */}
          <div style={{width:300,flexShrink:0,background:T.card,borderRight:`1px solid ${T.line}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"9px 12px",borderBottom:`1px solid ${T.line}`,background:T.cardAlt,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <span style={{fontFamily:mono,fontSize:"9px",textTransform:"uppercase",letterSpacing:2,color:T.muted,fontWeight:500}}>Event Log</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:mono,fontSize:"9px",color:T.brass,fontWeight:600}}>
                  {fetchActionCount} steps
                  {fetchEvents.length > fetchActionCount && (
                    <span style={{color:T.muted,fontWeight:400}}> · {fetchEvents.length - fetchActionCount} retries</span>
                  )}
                </span>
                {(!fetchRunning||fetchStopped||fetchComplete)&&(
                  <button onClick={()=>setFetchScreen("configure")} style={{fontFamily:mono,fontSize:"8.5px",textTransform:"uppercase",letterSpacing:1,color:T.muted,background:"none",border:`1px solid ${T.line}`,padding:"2px 8px",cursor:"pointer"}}>← Back</button>
                )}
              </div>
            </div>
            <div ref={fetchListRef} onScroll={handleFetchScroll} style={{flex:1,overflowY:"auto",padding:0,scrollBehavior:"smooth"}}>
              {fetchEvents.map((ev,idx)=>{
                const act=ev.action?.toUpperCase()||ev.type?.toUpperCase()||"";
                const bg=ACTION_COLORS_FETCH[act]||"rgba(120,109,82,0.05)";
                const tc=ACTION_TEXT_COLORS_FETCH[act]||T.muted;
                const isError=ev.type==="error"||ev.type==="stuck"||ev.type==="action_error";
                const isComplete=ev.type==="downloaded"||ev.type==="complete";
                const isStopped=ev.type==="stopped";
                const borderLeft=isError?`2.5px solid ${T.flag}`:isComplete?`2.5px solid ${T.moss}`:`2.5px solid transparent`;
                return(
                  <div key={idx} onClick={()=>setFetchSelectedEvent(idx)}
                    style={{padding:"9px 12px",borderBottom:`1px solid ${T.lineSoft}`,cursor:"pointer",
                      borderLeft:fetchSelectedEvent===idx?`2.5px solid #2d6fb5`:borderLeft,
                      paddingLeft:"9.5px",
                      background:fetchSelectedEvent===idx?"rgba(45,111,181,0.08)":isError?`rgba(168,51,25,0.04)`:isComplete?`rgba(0,135,90,0.04)`:isStopped?`rgba(120,109,82,0.04)`:"transparent",
                      transition:"background 0.1s"}}>
                    <div style={{fontFamily:mono,fontSize:"8px",color:T.muted,marginBottom:4}}>
                      #{String(idx+1).padStart(2,"0")} · {act}
                      {ev.timestamp&&fetchEvents[0]?.timestamp&&(()=>{
                        const elapsed=(new Date(ev.timestamp)-new Date(fetchEvents[0].timestamp))/1000;
                        return <span style={{color:T.brass,marginLeft:4}}>+{elapsed<60?elapsed.toFixed(1)+"s":Math.floor(elapsed/60)+"m"+Math.round(elapsed%60)+"s"}</span>;
                      })()}
                    </div>
                    {act&&<span style={{display:"inline-block",fontFamily:mono,fontSize:"8px",textTransform:"uppercase",letterSpacing:1,padding:"1px 5px",fontWeight:600,background:bg,color:tc,marginBottom:5}}>{act}</span>}
                    <div style={{fontSize:"11.5px",color:T.mutedDeep,lineHeight:1.45}}>{ev.narration}</div>
                    {ev.reasoning&&<div style={{marginTop:5,fontSize:"10.5px",color:T.muted,lineHeight:1.5,fontStyle:"italic",borderLeft:`2px solid ${T.lineSoft}`,paddingLeft:6}}>{ev.reasoning}</div>}
                    {ev.target&&<div style={{marginTop:4,fontFamily:mono,fontSize:"8.5px",color:"rgba(45,111,181,0.7)"}}>target: {String(ev.target).slice(0,80)}</div>}
                    {ev.value&&<div style={{fontFamily:mono,fontSize:"8.5px",color:`rgba(0,135,90,0.8)`}}>value: "{String(ev.value).slice(0,60)}"</div>}
                  </div>
                );
              })}
              {fetchComplete?.success&&(
                <>
                  <div style={{padding:"9px 12px",borderBottom:`1px solid ${T.lineSoft}`,borderLeft:`2.5px solid ${T.brass}`,paddingLeft:"9.5px",background:`rgba(182,135,58,0.05)`}}>
                    <div style={{fontFamily:mono,fontSize:"8px",color:T.brass,marginBottom:4}}>⬇ Available Action</div>
                    <span style={{display:"inline-block",fontFamily:mono,fontSize:"8px",textTransform:"uppercase",padding:"1px 5px",fontWeight:600,background:`rgba(182,135,58,0.15)`,color:T.brass,marginBottom:5}}>Download</span>
                    <div style={{fontSize:"11.5px",color:T.mutedDeep,lineHeight:1.45,marginBottom:7}}>{fetchComplete.fileName} is ready to save to your computer.</div>
                    <button onClick={()=>window.open(`${fetchApiBase}/agent/download?file=${encodeURIComponent(fetchComplete.filePath)}`,"_blank")} style={{background:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,color:T.navy,border:"none",padding:"6px 14px",cursor:"pointer",fontFamily:display,fontSize:11,fontWeight:700}}>↓ Save CSV File</button>
                  </div>
                  <div style={{padding:"9px 12px",borderLeft:`2.5px solid ${T.brass}`,paddingLeft:"9.5px",background:`rgba(182,135,58,0.05)`,borderTop:`2px solid ${T.brass}`}}>
                    <div style={{fontFamily:mono,fontSize:"8px",color:T.brass,marginBottom:4}}>→ Next Step</div>
                    <span style={{display:"inline-block",fontFamily:mono,fontSize:"8px",textTransform:"uppercase",padding:"1px 5px",fontWeight:600,background:`rgba(182,135,58,0.15)`,color:T.brassDeep,marginBottom:5}}>Analyze</span>
                    <div style={{fontSize:"11.5px",color:T.mutedDeep,lineHeight:1.45,marginBottom:7}}>
                      Data is ready. Proceed to field mapping and analysis.
                      {fetchTotalTime&&<span style={{display:"block",fontFamily:mono,fontSize:9,color:T.brass,marginTop:4}}>⏱ Total time: {fetchTotalTime<60?fetchTotalTime.toFixed(1)+"s":Math.floor(fetchTotalTime/60)+"m "+Math.round(fetchTotalTime%60)+"s"} · {fetchActionCount} steps</span>}
                    </div>
                    <button onClick={handleFetchAnalyze} style={{background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,color:T.brassLight,border:"none",padding:"6px 14px",cursor:"pointer",fontFamily:display,fontSize:11,fontWeight:700}}>Map Fields → Analyze ▶</button>
                  </div>
                </>
              )}
            </div>
            {/* Thinking footer */}
            <div style={{flexShrink:0,padding:"10px 14px",borderTop:`1px solid ${T.line}`,background:T.cardAlt,display:"flex",alignItems:"flex-start",gap:8,minHeight:52}}>
              {fetchRunning&&[0,0.15,0.3].map((d,i)=>(
                <span key={i} style={{display:"inline-block",width:4,height:4,borderRadius:"50%",background:"#2d6fb5",animation:`dbounce 1.2s ${d}s infinite`,flexShrink:0,marginTop:5}}/>
              ))}
              {!fetchRunning&&<span style={{fontSize:14,flexShrink:0,marginTop:1}}>{fetchComplete?.success?"✓":fetchStopped?"◼":"⚠"}</span>}
              <div style={{fontSize:11,lineHeight:1.5,flex:1,color:fetchComplete?.success?T.moss:fetchStopped?T.muted:fetchRunning?T.mutedDeep:T.flag}}>{fetchThinkingText||"Waiting…"}</div>
            </div>
          </div>
          {/* Screenshot pane */}
          <div style={{flex:1,display:"flex",flexDirection:"column",background:"#0b1929",overflow:"hidden",minWidth:0}}>
            <div style={{background:"rgba(0,0,0,0.45)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"0 12px",height:30,display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              {["#e85d4a","#f5a623","#3eca7f"].map(c=><div key={c} style={{width:9,height:9,borderRadius:"50%",background:c}}/>)}
              <div style={{flex:1,background:"rgba(255,255,255,0.05)",borderRadius:2,height:16,display:"flex",alignItems:"center",padding:"0 10px",fontFamily:mono,fontSize:"8px",color:"rgba(255,255,255,0.25)",overflow:"hidden",whiteSpace:"nowrap",marginLeft:6}}>
                {FETCH_STATES.find(s=>s.key===fetchState)?.url||"about:blank"}
              </div>
            </div>
            {/* Image area: flex:1 with height:0 forces it to never exceed parent */}
            <div style={{flex:1,height:0,overflow:"hidden",position:"relative",background:"#0b1929"}}>
              {(()=>{
                const evIdx = fetchSelectedEvent !== null ? fetchSelectedEvent : fetchEvents.length-1;
                const shot = fetchEvents[evIdx]?.screenshot;
                return shot
                  ? <img
                      src={`data:image/jpeg;base64,${shot}`}
                      alt={`Step ${evIdx+1} screenshot`}
                      style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",objectPosition:"top center",display:"block"}}
                    />
                  : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{textAlign:"center",padding:24}}>
                        <div style={{fontSize:28,marginBottom:10,opacity:0.15}}>🖥</div>
                        <div style={{fontFamily:mono,fontSize:10,color:"rgba(255,255,255,0.15)",letterSpacing:0.5,lineHeight:1.9}}>
                          {fetchRunning?"[ LIVE SCREENSHOT STREAM ]":"[ Waiting for agent to start ]"}<br/>
                          Click any event in the left panel<br/>to view that step's screenshot
                        </div>
                      </div>
                    </div>;
              })()}
              {fetchSelectedEvent!==null&&fetchSelectedEvent!==fetchEvents.length-1&&(
                <div style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,0.6)",color:"rgba(255,255,255,0.6)",fontFamily:mono,fontSize:9,padding:"3px 8px",letterSpacing:1}}>
                  STEP {fetchSelectedEvent+1} OF {fetchEvents.length} EVENTS · CLICK TO REPLAY
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    // ── CONFIGURE SCREEN ────────────────────────────────────────────────────
    if(fetchScreen==="configure") return (
      <div style={{minHeight:"100vh",background:T.paperDeep,fontFamily:body,color:T.ink}}>
        <style>{GLOBAL_STYLE}</style>
        <Header/>
        <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px 80px"}}>
          <div style={{marginBottom:24,display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:mono,fontSize:"10px",letterSpacing:3,textTransform:"uppercase",color:T.brass,fontWeight:500,marginBottom:10}}>Roadmap Venture · Procurement Intelligence</div>
              <div style={{fontFamily:display,fontSize:32,fontWeight:700,color:T.navy,lineHeight:1.15,letterSpacing:"-0.5px"}}>Government Spend Analyzer</div>
            </div>
            <button onClick={()=>setFetchScreen("landing")} style={{fontFamily:mono,fontSize:"9px",textTransform:"uppercase",letterSpacing:1.5,color:T.muted,background:"none",border:`1px solid ${T.line}`,padding:"7px 14px",cursor:"pointer",marginTop:4}}>← Cancel</button>
          </div>
          <Workflow/>
          <div style={{background:T.card,border:`1.5px solid ${T.brass}`,overflow:"hidden"}}>
            <div style={{background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,padding:"14px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.brassLight}}>Configure State Data Fetch</div>
              <button onClick={()=>setFetchScreen("landing")} style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:18,cursor:"pointer",lineHeight:1}}>✕</button>
            </div>
            <div style={{padding:24}}>
              <div style={{fontFamily:mono,fontSize:"9.5px",letterSpacing:"2.5px",textTransform:"uppercase",color:T.mutedDeep,marginBottom:10,fontWeight:500}}>Select state portal</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:22}}>
                {FETCH_STATES.map(s=>(
                  <div key={s.key} onClick={()=>s.live&&setFetchState(s.key)}
                    style={{background:fetchState===s.key?"#d4e4f5":T.cardAlt,border:`1.5px solid ${fetchState===s.key?"#2d6fb5":T.line}`,padding:"11px 12px 10px",cursor:s.live?"pointer":"not-allowed",opacity:s.live?1:0.38,position:"relative",display:"flex",flexDirection:"column",gap:2,transition:"border-color 0.15s"}}>
                    <span style={{position:"absolute",top:7,right:8,fontFamily:mono,fontSize:"7.5px",letterSpacing:1,textTransform:"uppercase",padding:"1px 5px",fontWeight:600,color:s.live?T.moss:T.muted,background:s.live?"rgba(90,117,56,0.1)":"rgba(120,109,82,0.1)",border:`1px solid ${s.live?"rgba(90,117,56,0.3)":"rgba(120,109,82,0.25)"}`}}>{s.live?"Live":"Soon"}</span>
                    <span style={{fontFamily:display,fontSize:13,fontWeight:600,color:T.navy}}>{s.name}</span>
                    <span style={{fontFamily:mono,fontSize:"8.5px",color:T.muted,marginTop:2}}>{s.portal}</span>
                  </div>
                ))}
              </div>
              <div style={{fontFamily:mono,fontSize:"9.5px",letterSpacing:"2.5px",textTransform:"uppercase",color:T.mutedDeep,marginBottom:10,fontWeight:500}}>Date range</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:22}}>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <label style={{fontFamily:mono,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1.5px",color:T.mutedDeep,fontWeight:500}}>Fiscal Year</label>
                  <select value={fetchYear} onChange={e=>setFetchYear(e.target.value)} style={{background:T.cardAlt,border:`1px solid ${T.line}`,padding:"9px 10px",fontFamily:body,fontSize:13,color:T.navy,appearance:"none"}}>
                    {(FETCH_STATES.find(s=>s.key===fetchState)?.years||["2025"]).map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <label style={{fontFamily:mono,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1.5px",color:T.mutedDeep,fontWeight:500}}>From Date</label>
                  <input type="text" value={fetchDateFrom} onChange={e=>setFetchDateFrom(e.target.value)} style={{background:T.cardAlt,border:`1px solid ${T.line}`,padding:"9px 10px",fontFamily:body,fontSize:13,color:T.navy}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <label style={{fontFamily:mono,fontSize:"9px",textTransform:"uppercase",letterSpacing:"1.5px",color:T.mutedDeep,fontWeight:500}}>To Date</label>
                  <input type="text" value={fetchDateTo} onChange={e=>setFetchDateTo(e.target.value)} style={{background:T.cardAlt,border:`1px solid ${T.line}`,padding:"9px 10px",fontFamily:body,fontSize:13,color:T.navy}}/>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,paddingTop:4}}>
                <div>
                  <div style={{fontSize:"11.5px",color:T.muted,lineHeight:1.65}}>Agent will navigate the portal, fill date fields,<br/>and download the CSV — autonomously.</div>
                  <button onClick={()=>setFetchScreen("landing")} style={{fontFamily:mono,fontSize:"10px",textTransform:"uppercase",letterSpacing:"1.5px",color:T.muted,background:"none",border:"none",cursor:"pointer",padding:0,marginTop:7,display:"block"}}>← Cancel, go back</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                  <button onClick={()=>runFetchAgent("brent")}
                    style={{background:"linear-gradient(135deg,#2d6fb5,#1a4e85)",color:"#fff",border:"none",padding:"13px 30px",cursor:"pointer",fontFamily:display,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
                    ⇲ Run Fetch Agent
                  </button>
                  <button onClick={()=>runFetchAgent("pat")}
                    style={{background:"none",border:"none",cursor:"pointer",fontFamily:mono,fontSize:"9px",color:T.muted,letterSpacing:1,textDecoration:"underline",padding:0}}>
                    I'd rather have an intern fetch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // ── LANDING SCREEN ──────────────────────────────────────────────────────
    const scCorners = (
      <>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" style={{position:"absolute",top:4,left:4,color:T.brass}}><path d="M0 0h3.5v1H1v2.5H0z"/></svg>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" style={{position:"absolute",top:4,right:4,color:T.brass}}><path d="M9 0H5.5v1H8v2.5H9z"/></svg>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" style={{position:"absolute",bottom:4,left:4,color:T.brass}}><path d="M0 9h3.5V8H1V5.5H0z"/></svg>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" style={{position:"absolute",bottom:4,right:4,color:T.brass}}><path d="M9 9H5.5V8H8V5.5H9z"/></svg>
      </>
    );
    return (
      <div style={{minHeight:"100vh",background:T.paperDeep,fontFamily:body,color:T.ink}}>
        <style>{GLOBAL_STYLE}</style>
        <Header/>
        <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px 80px",position:"relative",zIndex:1}}>
          {/* Eyebrow + title + subtitle */}
          <div style={{marginBottom:30}}>
            <div style={{fontFamily:mono,fontSize:"10px",letterSpacing:3,textTransform:"uppercase",color:T.brass,fontWeight:500,marginBottom:10}}>Roadmap Venture · Procurement Intelligence</div>
            <div style={{fontFamily:display,fontSize:32,fontWeight:700,color:T.navy,lineHeight:1.15,letterSpacing:"-0.5px",marginBottom:8}}>Government Spend Analyzer</div>
            <p style={{fontSize:"13.5px",color:T.muted,lineHeight:1.65,maxWidth:580}}>Load procurement data from a demo dataset, a live state portal, or your own file — then get instant vendor risk analysis, category intelligence, and an AI-generated executive briefing.</p>
          </div>
          <Workflow/>
          <div style={{fontFamily:mono,fontSize:"9.5px",letterSpacing:"2.5px",textTransform:"uppercase",color:T.mutedDeep,marginBottom:12,fontWeight:500}}>Choose your data source</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {/* 1 — Austin Demo */}
            <div style={{background:T.card,border:`1.5px solid ${T.line}`,padding:"22px 20px 20px",cursor:"pointer",position:"relative",display:"flex",flexDirection:"column",transition:"border-color 0.18s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.brass} onMouseLeave={e=>e.currentTarget.style.borderColor=T.line}>
              {scCorners}
              <span style={{display:"inline-block",fontFamily:mono,fontSize:"8.5px",textTransform:"uppercase",letterSpacing:"1.5px",padding:"2px 7px",border:`1px solid ${T.moss}`,color:T.moss,background:"rgba(90,117,56,0.07)",marginBottom:9,alignSelf:"flex-start",fontWeight:600}}>Demo dataset</span>
              <span style={{fontSize:24,marginBottom:10,display:"block"}}>🏙</span>
              <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.navy,marginBottom:5}}>City of Austin</div>
              <div style={{fontSize:12,color:T.muted,lineHeight:1.6,flex:1}}>Load Austin's FY2025 public procurement data instantly. See the full analysis workflow without uploading anything.</div>
              <button onClick={async()=>{setLoading(true);setError("");try{const res=await fetch("/Austin_2025Data_.csv");if(!res.ok)throw new Error("Could not load demo file");const blob=await res.blob();const file=new File([blob],"Austin_2025Data_.csv",{type:"text/csv"});processFile(file);}catch(e){setLoading(false);setError("Demo failed to load: "+e.message);}}}
                style={{marginTop:14,padding:"9px 18px",fontWeight:700,fontSize:12,fontFamily:display,border:"none",cursor:"pointer",alignSelf:"flex-start",background:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,color:T.navy}}>▶ Load Demo</button>
            </div>
            {/* 2 — Fetch State Data */}
            <div style={{background:T.card,border:`1.5px solid ${T.line}`,padding:"22px 20px 20px",cursor:"pointer",position:"relative",display:"flex",flexDirection:"column",transition:"border-color 0.18s"}}
              onClick={()=>setFetchScreen("configure")} onMouseEnter={e=>e.currentTarget.style.borderColor=T.brass} onMouseLeave={e=>e.currentTarget.style.borderColor=T.line}>
              {scCorners}
              <span style={{display:"inline-block",fontFamily:mono,fontSize:"8.5px",textTransform:"uppercase",letterSpacing:"1.5px",padding:"2px 7px",border:"1px solid #2d6fb5",color:"#2d6fb5",background:"#d4e4f5",marginBottom:9,alignSelf:"flex-start",fontWeight:600}}>Live fetch · AI Agent</span>
              <span style={{fontSize:24,marginBottom:10,display:"block"}}>🌐</span>
              <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.navy,marginBottom:5}}>Fetch State Data</div>
              <div style={{fontSize:12,color:T.muted,lineHeight:1.6,flex:1}}>AI agent navigates a government portal, fills forms, and downloads spend data automatically. No manual export required.</div>
              <button style={{marginTop:14,padding:"9px 18px",fontWeight:700,fontSize:12,fontFamily:display,border:"none",cursor:"pointer",alignSelf:"flex-start",background:"linear-gradient(135deg,#2d6fb5,#1a4e85)",color:"#fff"}}>⇲ Fetch Live Data</button>
            </div>
            {/* 3 — Upload Your Own File */}
            <div className="upload-blink" style={{background:T.card,border:`1.5px solid ${T.line}`,padding:"22px 20px 20px",position:"relative",display:"flex",flexDirection:"column"}}>
              {scCorners}
              <span style={{display:"inline-block",fontFamily:mono,fontSize:"8.5px",textTransform:"uppercase",letterSpacing:"1.5px",padding:"2px 7px",border:`1px solid ${T.brass}`,color:T.brassDeep,background:`rgba(182,135,58,0.06)`,marginBottom:9,alignSelf:"flex-start",fontWeight:600}}>Your data</span>
              <span style={{fontSize:24,marginBottom:10,display:"block"}}>📂</span>
              <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.navy,marginBottom:5}}>Upload Your Own File</div>
              <div style={{fontSize:12,color:T.muted,lineHeight:1.6,flex:1}}>Drop or select a procurement CSV from your system. Supports any column format — fields are mapped automatically.</div>
              <div onClick={()=>hiddenInputRef.current.click()} onDrop={e=>{e.preventDefault();processFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()}>
                <div style={{marginTop:14,display:"inline-block",padding:"9px 18px",fontWeight:700,fontSize:12,fontFamily:display,cursor:"pointer",background:"transparent",border:`1.5px solid ${T.brass}`,color:T.brassDeep}}>↑ Upload CSV</div>
                <input ref={hiddenInputRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>processFile(e.target.files[0])}/>
              </div>
            </div>
          </div>
          {error&&<div style={{marginTop:14,background:`${T.flag}10`,border:`1px solid ${T.flag}44`,padding:"12px 16px",color:T.flag,fontSize:14}}>⚠ {error}</div>}
        </div>
      </div>
    );
  }

  // ── MAIN ANALYZE STAGE ───────────────────────────────────────────────────────
  const vc = data?.vendorConc;
  const localAreaName = localApplied ? localApplied.value : "Local Area";

  return (
    <div style={{minHeight:"100vh",background:T.paperDeep,fontFamily:body,color:T.ink,display:"flex",flexDirection:"column",width:"100%",margin:0,padding:0}}>
      <style>{GLOBAL_STYLE}</style>
      <Header/>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── SIDEBAR ── */}
        <div style={{width:200,flexShrink:0,background:T.paper,borderRight:`1px solid ${T.line}`,padding:"16px 0",display:"flex",flexDirection:"column",overflowY:"auto"}}>
          {data&&(
            <div style={{padding:"0 16px 12px",borderBottom:`1px solid ${T.line}`,marginBottom:10}}>
              <div style={{fontSize:8.5,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.6,fontWeight:600,marginBottom:3,fontFamily:mono}}>Now Analyzing</div>
              <div style={{fontFamily:display,fontSize:13,fontWeight:600,color:T.navy,lineHeight:1.2}}>{fileName.replace(/\.csv$/i,"")}</div>
              <div style={{fontSize:10,color:T.muted,marginTop:2,fontFamily:mono}}>{data.txCount.toLocaleString()} rows</div>
            </div>
          )}
          {NAV_GROUPS.map(group=>{
            const groupTabs=group.tabs.filter(t=>availableTabs.has(t.id));
            if(groupTabs.length===0) return null;
            return(
              <div key={group.id} style={{marginBottom:6}}>
                <div style={{padding:"5px 16px 3px",fontSize:8.5,fontWeight:700,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontFamily:mono}}>{group.label}</div>
                {groupTabs.map(t=>{
                  const isActive=activeTab===t.id&&stage==="analyze";
                  const isAI=t.id==="aibriefing";
                  const isAlert=t.id==="flags"&&highFlags>0;
                  const isCleanup=t.id==="cleanup"&&dirtyCount>0;
                  const accentColor=isAI?"#7a5fc0":isAlert?T.flag:isCleanup?T.brass:T.brass;
                  const disabled=!data&&t.id!=="overview";
                  return(
                    <button key={t.id}
                      onClick={()=>{
                        if(!disabled){
                          if(t.id==="updatefile"){ setStage("map"); setActiveTab("updatefile"); }
                          else { setActiveTab(t.id); if(stage!=="analyze"&&data) setStage("analyze"); }
                        }
                      }}
                      style={{width:"100%",textAlign:"left",padding:"7px 16px 7px 20px",fontSize:12.5,fontWeight:isActive?600:400,cursor:disabled?"not-allowed":"pointer",border:"none",fontFamily:body,background:isActive?T.card:"transparent",color:isActive?T.navy:disabled?T.lineSoft:T.mutedDeep,borderLeft:isActive?`3px solid ${accentColor}`:"3px solid transparent",transition:"all 0.15s",display:"flex",alignItems:"center",gap:6,opacity:disabled?0.4:1}}>
                      <span style={{fontSize:10,opacity:0.7}}>{t.icon}</span>
                      <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</span>
                      {isAlert&&<span style={{fontSize:9,background:`${T.flag}18`,color:T.flag,padding:"1px 5px",fontWeight:700,fontFamily:mono,border:`1px solid ${T.flag}30`}}>{highFlags}</span>}
                      {isCleanup&&<span style={{fontSize:9,background:`${T.brass}18`,color:T.brassDeep,padding:"1px 5px",fontWeight:700,fontFamily:mono,border:`1px solid ${T.brass}30`}}>{dirtyCount}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div style={{marginTop:"auto",padding:"12px 16px",borderTop:`1px solid ${T.line}`}}>
            <div style={{fontSize:9,color:T.lineSoft,fontFamily:mono,textAlign:"center"}}>v3.0</div>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div style={{flex:1,overflowY:"auto",padding:"22px 26px",background:T.paperDeep}}>


                    {/* ── DATA LOADED ── */}
          {/* ── DATA LOADED ── */}
          {data&&(
            <>
              {/* ── KPI Strip (8 cards) ── */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:18}}>
                {[
                  {label:"Total Spend",value:fmtFull(data.totalSpend),sub:"FY Total"},
                  {label:"Transactions",value:data.txCount.toLocaleString()},
                  {label:"Categories",value:data.classArr.length},
                  ...(data.hasVendor?[{label:"Unique Vendors",value:data.vendorArr.length.toLocaleString()}]:[]),
                  {label:"Health Flags",value:data.flags.length,flagged:data.flags.filter(f=>f.severity==="high").length>0,sub:"requires review"},
                  ...(vc?[{label:"Vendor HHI",value:vc.hhi.toFixed(0),flagged:vc.hhi>2500}]:[]),
                  ...(data.classArr.length>0?[{label:"Top Category %",value:fmtPct(data.classArr[0].total/data.totalSpend*100),sub:data.classArr[0].displayLabel}]:[]),
                  ...(data.hasVendor&&data.vendorArr.length>0?[{label:"Top Vendor %",value:fmtPct(data.vendorArr[0].total/data.totalSpend*100),sub:data.vendorArr[0].name.length>22?data.vendorArr[0].name.slice(0,21)+"…":data.vendorArr[0].name}]:[]),
                ].map(s=>(
                  <div key={s.label} style={{background:T.card,border:`1px solid ${T.line}`,padding:"12px 14px",position:"relative",overflow:"hidden"}}>
                    <Corners/>
                    <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5,fontFamily:mono,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</div>
                    <div style={{fontFamily:display,fontSize:s.label==="Total Spend"?18:22,fontWeight:500,color:s.flagged?T.flag:T.navy,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
                    {s.sub&&<div style={{fontSize:9.5,color:T.mutedDeep,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontStyle:"italic"}}>{s.sub}</div>}
                  </div>
                ))}
              </div>

              {/* ── OVERVIEW TAB ── */}
              {activeTab==="overview"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr",gap:16}}>
                  {/* Concerns banner */}
                  {data.flags.length>0&&(
                    <div style={{background:`${T.flag}08`,border:`1px solid ${T.flag}40`,padding:"11px 16px",display:"flex",alignItems:"center",gap:12}}>
                      <span style={{color:T.flag,fontFamily:mono,fontSize:12,fontWeight:700,flexShrink:0}}>!</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:2,fontFamily:display}}>{data.flags.length} concern{data.flags.length!==1?"s":""} detected · {data.flags.filter(f=>f.severity==="high").length} high · {data.flags.filter(f=>f.severity==="medium").length} medium</div>
                        <div style={{fontSize:12,color:T.mutedDeep}}>
                          {data.flags.map(f=>`⚑ ${f.title.split("—")[0].trim()}`).join(" · ")}
                          {" "}<button onClick={()=>setActiveTab("flags")} style={{background:"none",border:"none",color:T.flag,cursor:"pointer",fontSize:12,fontWeight:700,padding:0,fontFamily:body}}>View all →</button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    <Card title="Categories by Spend">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={top15C.map(x=>({...x,label:x.displayLabel,_pct:x.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:70,top:5,bottom:5}}>
                          <XAxis type="number" tickFormatter={fmt} tick={{fill:T.muted,fontSize:11,fontFamily:mono}} axisLine={false} tickLine={false}/>
                          <YAxis type="category" dataKey="label" width={150} tick={{fill:T.mutedDeep,fontSize:10,fontFamily:body}} axisLine={false} tickLine={false}/>
                          <Tooltip content={<Tip total={data.totalSpend}/>}/>
                          <Bar dataKey="total" radius={[0,3,3,0]} label={<PctBarLabel total={data.totalSpend}/>}>
                            {top15C.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.9}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                    <Card title="Spend Distribution" subtitle="Share of total by category">
                      <div style={{width:"100%",height:440,position:"relative"}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{top:20,right:30,bottom:0,left:30}}>
                            <Pie data={pieData} cx="50%" cy="42%" outerRadius={120} dataKey="value" nameKey="name"
                              label={({percent,name})=>percent>0.05?`${(percent*100).toFixed(0)}%`:""}
                              labelLine={{stroke:T.line,strokeWidth:1,length:12}}>
                              {pieData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} stroke={T.paperDeep} strokeWidth={2}/>)}
                            </Pie>
                            <Tooltip content={<Tip/>}/>
                            <Legend formatter={v=><span style={{color:T.mutedDeep,fontSize:9,fontFamily:body}}>{v.length>22?v.slice(0,21)+"…":v}</span>} wrapperStyle={{paddingTop:8,fontSize:9}}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* ── CONCERNS ── */}
              {activeTab==="flags"&&(
                <div>
                  <div style={{marginBottom:18}}>
                    <div style={{fontFamily:display,fontSize:20,fontWeight:600,color:T.navy,marginBottom:5}}>Procurement Health Review</div>
                    <div style={{fontSize:13,color:T.muted}}>{data.flags.length} concern{data.flags.length!==1?"s":""} detected · {data.flags.filter(f=>f.severity==="high").length} high · {data.flags.filter(f=>f.severity==="medium").length} medium · {data.flags.filter(f=>f.severity==="low").length} low</div>
                  </div>
                  {data.flags.length===0&&(<div style={{background:`${T.moss}08`,border:`1px solid ${T.moss}40`,padding:"40px",textAlign:"center"}}><div style={{fontFamily:display,fontSize:18,fontWeight:600,color:T.moss}}>✓ No significant procurement concerns detected</div></div>)}
                  {["high","medium","low","info"].map(sev=>{ const grp=data.flags.filter(f=>f.severity===sev); if(!grp.length) return null; const labels={high:"⚑ High Priority",medium:"⚑ Medium Priority",low:"⚑ Low Priority",info:"ℹ Informational"}; return(<div key={sev} style={{marginBottom:22}}><div style={{fontSize:11,fontWeight:700,color:FLAG_COLORS[sev],marginBottom:8,textTransform:"uppercase",letterSpacing:1.2,fontFamily:mono}}>{labels[sev]}</div>{grp.map((f,i)=><FlagCard key={i} {...f} totalSpend={data.totalSpend}/>)}</div>); })}
                </div>
              )}

              {/* ── CATEGORIES ── */}
              {activeTab==="categories"&&(
                <Card title="All Categories — Full Spend Breakdown" subtitle={`${data.classArr.length} categories matched`} span2>
                  <ResponsiveContainer width="100%" height={Math.max(500,data.classArr.length*26)}>
                    <BarChart data={data.classArr.map(x=>({...x,label:x.displayLabel,_pct:x.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:8,bottom:8}}>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:T.muted,fontSize:11,fontFamily:mono}} axisLine={false} tickLine={false} xAxisId="top" orientation="top"/>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:T.muted,fontSize:11,fontFamily:mono}} axisLine={false} tickLine={false} xAxisId="bottom" orientation="bottom"/>
                      <YAxis type="category" dataKey="label" width={160} tick={{fill:T.mutedDeep,fontSize:10,fontFamily:body}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip total={data.totalSpend}/>}/>
                      <Bar dataKey="total" radius={[0,3,3,0]} label={<PctBarLabel total={data.totalSpend}/>} xAxisId="top">
                        {data.classArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* ── TREEMAP ── */}
              {activeTab==="treemap"&&(
                <Card title="Spend Treemap" subtitle="Area proportional to dollar volume · top 30 categories" span2>
                  {(()=>{ _treemapTotal=data.totalSpend; return null; })()}
                  <ResponsiveContainer width="100%" height={540}>
                    <Treemap data={treemapData} dataKey="size" aspectRatio={16/9} content={<TreeCell/>}>
                      <Tooltip formatter={(v,n,p)=>[`${fmtFull(v)} · ${(v/data.totalSpend*100).toFixed(1)}%`,p.payload?.name||n]}/>
                    </Treemap>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* ── VENDORS ── */}
              {activeTab==="vendors"&&data.hasVendor&&(
                <Card title="Top 15 Vendors by Spend" span2>
                  <ResponsiveContainer width="100%" height={440}>
                    <BarChart data={top15V.map(v=>({...v,_pct:v.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:20,bottom:5}}>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:T.muted,fontSize:11,fontFamily:mono}} axisLine={false} tickLine={false} xAxisId="bottom" orientation="bottom"/>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:T.muted,fontSize:11,fontFamily:mono}} axisLine={false} tickLine={false} xAxisId="top" orientation="top"/>
                      <YAxis type="category" dataKey="name" width={200} tick={{fill:T.mutedDeep,fontSize:10,fontFamily:body}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip total={data.totalSpend}/>}/>
                      <Bar dataKey="total" radius={[0,3,3,0]} label={<PctBarLabel total={data.totalSpend}/>} xAxisId="bottom">
                        {top15V.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* ── DEPARTMENTS ── */}
              {activeTab==="departments"&&data.hasDept&&(
                <Card title="Spend by Department" span2>
                  <ResponsiveContainer width="100%" height={Math.max(430,data.deptArr.length*28)}>
                    <BarChart data={data.deptArr.map(d=>({...d,_pct:d.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:5,bottom:5}}>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:T.muted,fontSize:11,fontFamily:mono}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="name" width={180} tick={{fill:T.mutedDeep,fontSize:10,fontFamily:body}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip total={data.totalSpend}/>}/>
                      <Bar dataKey="total" radius={[0,3,3,0]} label={<PctBarLabel total={data.totalSpend}/>}>
                        {data.deptArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* ── TIMELINE ── */}
              {activeTab==="timeline"&&data.hasDate&&(
                <Card title="Monthly Spend" subtitle="Total procurement spend by month" span2>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={data.monthArr} margin={{left:10,right:20,top:24,bottom:20}}>
                      <XAxis dataKey="month" tick={{fill:T.mutedDeep,fontSize:11,fontFamily:mono}} axisLine={false} tickLine={false}/>
                      <YAxis tickFormatter={fmt} tick={{fill:T.muted,fontSize:11,fontFamily:mono}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip total={data.totalSpend}/>}/>
                      <ReferenceLine y={data.totalSpend/data.monthArr.length} stroke={`${T.flag}99`} strokeDasharray="4 4"
                        label={{value:`Avg ${fmt(data.totalSpend/data.monthArr.length)}`,position:"insideTopRight",fill:T.flag,fontSize:11,fontWeight:700,fontFamily:mono}}/>
                      <Bar dataKey="total" radius={[3,3,0,0]}>
                        {data.monthArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                        <LabelList content={<TimelinePctLabel total={data.totalSpend}/>}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* ── VENDOR RISK / CONCENTRATION ── */}
              {activeTab==="concentration"&&vc&&(()=>{
                const trafficLight = (field, value) => {
                  if(field==="hhi")    return value>2500?"red":value>1500?"yellow":"green";
                  if(field==="v50")    return value<3?"red":value<=6?"yellow":"green";
                  if(field==="v75")    return value<6?"red":value<=12?"yellow":"green";
                  if(field==="v90")    return value<10?"red":value<=25?"yellow":"green";
                  return "green";
                };
                const tlColors = {red:T.flag,yellow:T.brass,green:T.moss};
                const tlLabels = {red:"High Risk",yellow:"Moderate",green:"Healthy"};
                const TrafficLight = ({status}) => (
                  <div style={{display:"flex",alignItems:"center",gap:5,marginTop:10,paddingTop:10,borderTop:`1px solid ${T.lineSoft}`}}>
                    {["red","yellow","green"].map(c=>(
                      <div key={c} style={{width:10,height:10,borderRadius:"50%",flexShrink:0,background:status===c?tlColors[c]:T.paperDeep,border:`1px solid ${status===c?tlColors[c]:T.line}`}}/>
                    ))}
                    <span style={{fontSize:10,color:tlColors[status],fontWeight:700,marginLeft:4,fontFamily:mono}}>{tlLabels[status]}</span>
                  </div>
                );
                const totalVendors = vc.vendorArr.length;
                const lorenzData = vc.cumulativeCurve.map(p=>({
                  vendorPct: parseFloat(((p.rank/totalVendors)*100).toFixed(2)),
                  cumSpendPct: parseFloat(p.cumPct.toFixed(2)),
                  healthyPct: parseFloat((100*Math.pow(p.rank/totalVendors, 0.139)).toFixed(2)),
                }));
                const marker1 = lorenzData.find(p=>p.vendorPct>=20) || lorenzData[lorenzData.length-1];
                const marker1Pct = marker1 ? marker1.cumSpendPct.toFixed(1) : "—";
                const marker2 = lorenzData.find(p=>p.cumSpendPct>=80);
                const marker2VendorPct = marker2 ? marker2.vendorPct.toFixed(1) : "—";
                const top10pct = vc.vendorArr.slice(0,10).map(v=>({
                  name: v.name.length>28?v.name.slice(0,27)+"…":v.name,
                  pct: parseFloat((v.pct).toFixed(2)),
                  color: v.pct>15?T.flag:v.pct>10?T.brass:T.moss,
                }));
                const VendorPctBar = (props) => { const {x,y,width,height,index}=props; const item=top10pct[index]; if(!item) return null; return <rect x={x} y={y} width={width} height={height} rx={2} fill={item.color} fillOpacity={0.85}/>; };
                const VendorPctLabel = (props) => { const {x,y,width,value,index}=props; const item=top10pct[index]; if(!item||width<20) return null; return <text x={x+width+6} y={y+10} fill={item.color} fontSize={11} fontWeight={700} fontFamily={mono} dominantBaseline="middle">{value.toFixed(1)}%</text>; };
                return(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    <div style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                      {[
                        {field:"hhi",  label:"HHI Score", value:vc.hhi.toFixed(0), sub:vc.hhi>2500?"Highly Concentrated":vc.hhi>1500?"Moderately Concentrated":"Competitive", numVal:vc.hhi},
                        {field:"v50",  label:"Vendors for 50% of Spend", value:vc.v50, sub:"higher = more diverse", numVal:vc.v50},
                        {field:"v75",  label:"Vendors for 75% of Spend", value:vc.v75, sub:"higher = more diverse", numVal:vc.v75},
                        {field:"v90",  label:"Vendors for 90% of Spend", value:vc.v90, sub:`of ${data.vendorArr.length} total`, numVal:vc.v90},
                      ].map(s=>{
                        const status=trafficLight(s.field,s.numVal);
                        return(
                          <div key={s.label} style={{background:T.card,border:`1px solid ${T.line}`,padding:"14px 16px",position:"relative"}}>
                            <Corners/>
                            <div style={{fontSize:9.5,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:5,fontFamily:mono,display:"flex",alignItems:"center",gap:6}}>
                              {s.label}
                              {s.field==="hhi"&&(
                                <span style={{position:"relative",display:"inline-flex",alignItems:"center"}}
                                  onMouseEnter={()=>setHhiTooltipVisible(true)}
                                  onMouseLeave={()=>setHhiTooltipVisible(false)}>
                                  <span style={{width:13,height:13,borderRadius:"50%",background:T.cardAlt,border:`1px solid ${T.line}`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:T.muted,cursor:"help",fontWeight:700}}>i</span>
                                  {hhiTooltipVisible&&(
                                    <div style={{position:"absolute",left:"calc(100% + 10px)",top:"50%",transform:"translateY(-50%)",background:T.card,border:`1px solid ${T.line}`,padding:"12px 14px",width:290,zIndex:200,pointerEvents:"none",boxShadow:"0 8px 32px rgba(0,0,0,0.15)"}}>
                                      <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6,fontFamily:display}}>Herfindahl-Hirschman Index (HHI)</div>
                                      <div style={{fontSize:11,color:T.mutedDeep,lineHeight:1.6,fontFamily:body}}>The HHI measures market concentration by summing the squares of each vendor's percentage share of total spend. A score below 1,500 indicates a competitive market; 1,500–2,500 signals moderate concentration; above 2,500 is considered highly concentrated. In this app, HHI is calculated across all vendors using their percentage of total dollar spend.</div>
                                      <div style={{position:"absolute",left:-6,top:"50%",transform:"translateY(-50%)",width:10,height:10,background:T.card,borderLeft:`1px solid ${T.line}`,borderBottom:`1px solid ${T.line}`,rotate:"45deg"}}/>
                                    </div>
                                  )}
                                </span>
                              )}
                            </div>
                            <div style={{fontFamily:display,fontSize:24,fontWeight:500,color:tlColors[status],marginBottom:2,fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
                            <div style={{fontSize:11,color:T.muted,marginBottom:0,fontStyle:"italic"}}>{s.sub}</div>
                            <TrafficLight status={status}/>
                          </div>
                        );
                      })}
                    </div>
                    <Card title="Vendor Spend Concentration" subtitle="Each vendor's individual share of total spend">
                      <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:14,fontSize:11,flexWrap:"wrap"}}>
                        {[{c:T.flag,l:"Over 15% — risk"},{c:T.brass,l:"10–15% — caution"},{c:T.moss,l:"Under 10% — healthy"}].map(i=>(
                          <div key={i.l} style={{display:"flex",alignItems:"center",gap:5}}>
                            <div style={{width:9,height:9,borderRadius:"50%",background:i.c,flexShrink:0}}/>
                            <span style={{color:T.mutedDeep,fontFamily:body}}>{i.l}</span>
                          </div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={top10pct} layout="vertical" margin={{left:10,right:60,top:5,bottom:20}}>
                          <XAxis type="number" domain={[0,Math.max(40,Math.ceil((top10pct[0]?.pct||20)/5)*5+5)]} tickFormatter={v=>`${v}%`} tick={{fill:T.muted,fontSize:11,fontFamily:mono}} axisLine={false} tickLine={false}/>
                          <YAxis type="category" dataKey="name" width={180} tick={{fill:T.mutedDeep,fontSize:10,fontFamily:body}} axisLine={false} tickLine={false}/>
                          <Tooltip formatter={(v)=>[`${v.toFixed(2)}% of total spend`,"Share"]} cursor={{fill:`${T.brass}08`}}/>
                          <ReferenceLine x={15} stroke={T.brass} strokeWidth={1.5} strokeDasharray="5 3" label={{value:"15% threshold",position:"top",fill:T.brassDeep,fontSize:10,fontWeight:700,fontFamily:mono}}/>
                          <ReferenceLine x={10} stroke={`${T.brass}55`} strokeWidth={1} strokeDasharray="3 3"/>
                          <Bar dataKey="pct" radius={[0,2,2,0]} shape={<VendorPctBar/>} label={<VendorPctLabel/>}/>
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{fontSize:11,color:T.muted,marginTop:6,lineHeight:1.6,fontFamily:body}}>Any vendor exceeding <span style={{color:T.brassDeep,fontWeight:700}}>15%</span> of total spend represents a single-source dependency risk.</div>
                    </Card>
                    <Card title="Spend Concentration — Lorenz Curve" subtitle="How evenly is spend distributed across your vendor base?">
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={lorenzData} margin={{left:10,right:20,top:10,bottom:30}}>
                          <XAxis dataKey="vendorPct" type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fill:T.muted,fontSize:10,fontFamily:mono}} axisLine={false} tickLine={false} label={{value:"% of vendor base",position:"insideBottom",offset:-20,fill:T.muted,fontSize:10,fontFamily:mono}}/>
                          <YAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fill:T.muted,fontSize:10,fontFamily:mono}} axisLine={false} tickLine={false}/>
                          <Tooltip formatter={(v,n)=>[`${v.toFixed(1)}%`,n==="cumSpendPct"?"Actual spend":n==="healthyPct"?"Healthy benchmark":n]} cursor={{stroke:T.line}}/>
                          <ReferenceLine x={20} stroke={`${T.brass}60`} strokeDasharray="3 3"/>
                          <ReferenceLine y={80} stroke={`${T.brass}60`} strokeDasharray="3 3"/>
                          <Line type="monotone" dataKey="healthyPct" stroke={T.moss} strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="Healthy benchmark"/>
                          <Line type="monotone" dataKey="cumSpendPct" stroke={T.flag} strokeWidth={2} dot={false} name="Your data"/>
                          <ReferenceLine x={marker1?.vendorPct} stroke={T.brass} strokeWidth={1.5} strokeDasharray="4 3" label={{value:"20%",position:"insideTopRight",fill:T.brassDeep,fontSize:10,fontFamily:mono}}/>
                        </LineChart>
                      </ResponsiveContainer>
                      <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:10}}>
                        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                          {[{style:{width:20,height:3,background:T.flag,borderRadius:1},label:"Your data"},{style:{width:20,height:0,borderTop:`2px dashed ${T.moss}`},label:"Healthy benchmark (Pareto 80/20)"},{style:{width:20,height:0,borderTop:`1px dashed ${T.line}`},label:"Perfect equality (theoretical)"}].map(i=>(
                            <div key={i.label} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.mutedDeep,fontFamily:body}}>
                              <div style={i.style}/>{i.label}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
                        <div style={{background:`${T.brass}08`,border:`1px solid ${T.brass}40`,padding:"11px 14px"}}>
                          <div style={{fontSize:9.5,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:T.brassDeep,marginBottom:4,fontFamily:mono}}>① 20% Vendor Mark</div>
                          <div style={{fontFamily:display,fontSize:20,fontWeight:600,color:T.brassDeep,marginBottom:4}}>{marker1Pct}%</div>
                          <div style={{fontSize:11,color:T.mutedDeep,lineHeight:1.5,fontFamily:body}}>of spend controlled by your top 20% of vendors. {parseFloat(marker1Pct)>80?<span style={{color:T.flag}}>Less diversified than benchmark.</span>:<span style={{color:T.moss}}>Well diversified.</span>}</div>
                        </div>
                        <div style={{background:`${T.moss}08`,border:`1px solid ${T.moss}40`,padding:"11px 14px"}}>
                          <div style={{fontSize:9.5,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:T.moss,marginBottom:4,fontFamily:mono}}>② 80% Spend Crossover</div>
                          <div style={{fontFamily:display,fontSize:20,fontWeight:600,color:T.moss,marginBottom:4}}>{marker2VendorPct}%</div>
                          <div style={{fontSize:11,color:T.mutedDeep,lineHeight:1.5,fontFamily:body}}>of vendors account for 80% of spend. {parseFloat(marker2VendorPct)<20?<span style={{color:T.flag}}>Reaches 80% {(20/parseFloat(marker2VendorPct)).toFixed(1)}× sooner than benchmark.</span>:<span style={{color:T.moss}}>Meets the benchmark.</span>}</div>
                        </div>
                      </div>
                      <div style={{fontSize:11,color:T.muted,lineHeight:1.75,marginTop:12,paddingTop:12,borderTop:`1px solid ${T.lineSoft}`,fontFamily:body}}>
                        <strong style={{color:T.navy,fontFamily:display}}>How to read:</strong> The steeper the curve hugs the top-left, the less diversified your spend. The <span style={{color:T.moss}}>green dashed benchmark</span> shows a healthy Pareto portfolio (top 20% of vendors = 80% of spend).
                      </div>
                    </Card>
                    {vc.catDominance.length>0&&(
                      <Card title="Category Dominance — Single-Vendor Risk" subtitle="Categories where one vendor controls 70%+ of spend" span2>
                        <div style={{overflowX:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,fontFamily:body}}>
                            <thead><tr>{["Category","Dominant Vendor","Category Spend","Vendor Share","Vendor Spend"].map(h=><th key={h} style={{textAlign:"left",padding:"9px 12px",color:T.brassDeep,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,borderBottom:`2px solid ${T.brass}`,whiteSpace:"nowrap",fontFamily:mono}}>{h}</th>)}</tr></thead>
                            <tbody>
                              {vc.catDominance.map((row,i)=>(
                                <tr key={i} style={{borderBottom:`1px solid ${T.lineSoft}`,background:i%2===1?T.cardAlt:"transparent"}}
                                  onMouseOver={e=>e.currentTarget.style.background=T.card}
                                  onMouseOut={e=>e.currentTarget.style.background=i%2===1?T.cardAlt:"transparent"}>
                                  <td style={{padding:"9px 12px",color:T.navy,fontWeight:500}}>{row.label}</td>
                                  <td style={{padding:"9px 12px",color:T.ink}}>{row.vendor}</td>
                                  <td style={{padding:"9px 12px",color:T.brassDeep,fontWeight:700,fontFamily:mono}}>{fmtFull(row.catAmt)}</td>
                                  <td style={{padding:"9px 12px"}}><PctBar pct={row.pct} color={row.pct>=90?T.flag:row.pct>=80?T.brass:T.moss} width={60}/></td>
                                  <td style={{padding:"9px 12px",color:T.mutedDeep,fontFamily:mono}}>{fmtFull(row.amt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                  </div>
                );
              })()}

              {/* ── LOCAL SPEND ── */}
              {activeTab==="localspend"&&(()=>{
                const cityC=mapping.vendor_city; const stateC=mapping.vendor_state;
                const hasCity=!!cityC&&data.cityValues.length>0; const hasState=!!stateC&&data.stateValues.length>0;
                const dropdownOptions=localViewBy==="city"?data.cityValues:data.stateValues;
                const ls=localApplied?(()=>{
                  const {viewBy,value}=localApplied; const fieldCol=viewBy==="city"?cityC:stateC; if(!fieldCol) return null;
                  const localRows=[],nonLocalRows=[];
                  for(const r of data.rows){ const v=String(r[fieldCol]||"").trim(); const match=viewBy==="state"?v.toUpperCase()===value.toUpperCase():v.toLowerCase()===value.toLowerCase(); if(match) localRows.push(r); else nonLocalRows.push(r); }
                  const localTotal=localRows.reduce((s,r)=>s+r._amt,0); const localPct=data.totalSpend>0?localTotal/data.totalSpend*100:0;
                  const localVendors=new Set(localRows.map(r=>mapping.vendor?String(r[mapping.vendor]||"").trim():"").filter(Boolean));
                  const localCats={};
                  for(const r of localRows){ const {classCode,label}=resolveNIGP(r[mapping.nigp]); const dl=shortLabel(label); if(!localCats[dl]) localCats[dl]={name:dl,value:0}; localCats[dl].value+=r._amt; }
                  const topLocalCats=Object.values(localCats).sort((a,b)=>b.value-a.value).slice(0,8);
                  return {localTotal,nonLocalTotal:data.totalSpend-localTotal,localPct,nonLocalPct:100-localPct,localVendors:localVendors.size,localTxns:localRows.length,nonLocalTxns:nonLocalRows.length,value,topLocalCats};
                })():null;
                const areaName=ls?ls.value:"—";
                return(
                  <div>
                    <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"16px 20px",marginBottom:16,position:"relative"}}>
                      <Corners/>
                      <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.navy,marginBottom:12}}>Local Spend Analysis</div>
                      <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
                        <div>
                          <div style={{fontFamily:mono,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:8}}>Choose either — City or State</div>
                          <div style={{display:"flex",flexDirection:"column",gap:6}}>
                            {[{val:"city",label:"🏙 Search by City",avail:hasCity},{val:"state",label:"🗺 Search by State",avail:hasState}].map(opt=>(
                              <button key={opt.val} onClick={()=>{if(opt.avail){setLocalViewBy(opt.val);setLocalSelected("");}}} disabled={!opt.avail}
                                style={{padding:"8px 16px",fontSize:12,fontWeight:700,cursor:opt.avail?"pointer":"not-allowed",border:`1px solid ${localViewBy===opt.val&&opt.avail?T.moss:T.line}`,fontFamily:body,opacity:opt.avail?1:0.35,background:localViewBy===opt.val&&opt.avail?`${T.moss}15`:T.cardAlt,color:localViewBy===opt.val&&opt.avail?T.moss:T.muted,textAlign:"left",minWidth:180}}>{opt.label}</button>
                            ))}
                          </div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:8,alignSelf:"flex-end"}}>
                          <select value={localSelected} onChange={e=>setLocalSelected(e.target.value)} disabled={dropdownOptions.length===0}
                            style={{background:T.cardAlt,border:`1px solid ${T.line}`,padding:"8px 12px",color:localSelected?T.ink:T.muted,fontSize:13,fontFamily:body,cursor:"pointer",outline:"none",minWidth:200}}>
                            <option value="">— Choose a {localViewBy==="city"?"city":"state"} —</option>
                            {dropdownOptions.map(v=><option key={v} value={v}>{v}</option>)}
                          </select>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>{if(localSelected) setLocalApplied({viewBy:localViewBy,value:localSelected});}} disabled={!localSelected}
                              style={{background:localSelected?`linear-gradient(135deg,${T.moss},${T.brassDeep})`:`${T.line}`,border:"none",color:localSelected?T.card:T.muted,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:localSelected?"pointer":"not-allowed",fontFamily:display}}>Apply →</button>
                            {localApplied&&<button onClick={()=>{setLocalApplied(null);setLocalSelected("");}} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:body}}>Reset</button>}
                          </div>
                        </div>
                      </div>
                    </div>
                    {!localApplied&&<div style={{background:`${T.moss}06`,border:`1px solid ${T.moss}22`,padding:"60px 40px",textAlign:"center"}}><div style={{fontFamily:display,fontSize:18,fontWeight:600,color:T.navy,marginBottom:8}}>Select a local area to begin</div></div>}
                    {ls&&(
                      <>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                          {[
                            {label:`In ${areaName}`,val:fmtFull(ls.localTotal),pill:`${ls.localPct.toFixed(1)}%`,accent:T.moss},
                            {label:`Out of ${areaName}`,val:fmtFull(ls.nonLocalTotal),pill:`${ls.nonLocalPct.toFixed(1)}%`,accent:T.flag},
                            {label:`Vendors in ${areaName}`,val:ls.localVendors,pill:`${ls.localTxns.toLocaleString()} txns`,accent:T.brass},
                            {label:`TXNs out of ${areaName}`,val:ls.nonLocalTxns.toLocaleString(),pill:`${ls.nonLocalPct.toFixed(1)}% of txns`,accent:T.brassDeep},
                          ].map(k=>(
                            <div key={k.label} style={{background:T.card,border:`1px solid ${T.line}`,padding:"14px 16px",position:"relative"}}>
                              <Corners/>
                              <div style={{fontSize:9.5,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:5,fontWeight:600,lineHeight:1.3,fontFamily:mono}}>{k.label}</div>
                              <div style={{fontFamily:display,fontSize:20,fontWeight:500,color:k.accent,marginBottom:3}}>{k.val}</div>
                              <div style={{fontSize:11.5,color:T.mutedDeep,fontStyle:"italic"}}>{k.pill}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                          <Card title="% In & Out" subtitle="Share of total spend">
                            <div style={{height:300}}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={[{name:`In ${areaName}`,value:ls.localTotal},{name:`Out of ${areaName}`,value:ls.nonLocalTotal}]}
                                    cx="50%" cy="44%" outerRadius={100} dataKey="value"
                                    label={({percent})=>`${(percent*100).toFixed(1)}%`} labelLine={{stroke:T.line}}>
                                    <Cell fill={T.moss} stroke={T.paperDeep} strokeWidth={2}/>
                                    <Cell fill={T.flag} stroke={T.paperDeep} strokeWidth={2}/>
                                  </Pie>
                                  <Tooltip content={<Tip/>}/>
                                  <Legend formatter={v=><span style={{color:T.mutedDeep,fontSize:11,fontFamily:body}}>{v}</span>}/>
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </Card>
                          <Card title={`Top Categories in ${areaName}`} subtitle="Spend by NIGP class within local area">
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={ls.topLocalCats} layout="vertical" margin={{left:10,right:60,top:5,bottom:5}}>
                                <XAxis type="number" tickFormatter={fmt} tick={{fill:T.muted,fontSize:10,fontFamily:mono}} axisLine={false} tickLine={false}/>
                                <YAxis type="category" dataKey="name" width={150} tick={{fill:T.mutedDeep,fontSize:10,fontFamily:body}} axisLine={false} tickLine={false}/>
                                <Tooltip content={<Tip total={ls.localTotal}/>}/>
                                <Bar dataKey="value" radius={[0,3,3,0]} label={<PctBarLabel total={ls.localTotal}/>}>
                                  {ls.topLocalCats.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </Card>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* ── AI REVIEW ── */}
              {activeTab==="aibriefing"&&(()=>{
                const a1id=aiPickedAgents[0]; const a2id=aiPickedAgents[1];
                const a1=AI_AGENTS.find(a=>a.id===a1id); const a2=AI_AGENTS.find(a=>a.id===a2id);
                const totalCost=aiPickedAgents.reduce((s,id)=>{const a=AI_AGENTS.find(x=>x.id===id);return s+(a?.costNum||0);},0);
                const showDelta=aiReviewStage===3&&a1id&&a2id&&aiResults[a1id]&&aiResults[a2id];
                const m1=showDelta?analyzeAiText(aiResults[a1id]):null;
                const m2=showDelta?analyzeAiText(aiResults[a2id]):null;
                const SBAR=[["Words",m1?.words,m2?.words],[`Statutes`,m1?.statutes,m2?.statutes],["$ Refs",m1?.dollars,m2?.dollars],["Org Refs",m1?.orgs,m2?.orgs],["Data Claims",m1?.claims,m2?.claims],["Hedges",m1?.hedges,m2?.hedges]];
                return(
                  <div style={{maxWidth:"100%"}}>
                    {/* Page title */}
                    <div style={{marginBottom:4}}>
                      <div style={{fontFamily:mono,fontSize:9.5,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:5}}>Strategy · AI Review</div>
                      <div style={{fontFamily:display,fontSize:26,fontWeight:500,color:T.navy,letterSpacing:"-.5px",marginBottom:5}}>Your AI Team's Strategic Report</div>
                      <div style={{fontFamily:body,fontStyle:"italic",fontSize:13,color:T.mutedDeep,marginBottom:16,maxWidth:580}}>Choose up to 2 analysts from your team. Each will review your data through the lens of their specialty and knowledge base. Compare their reports side by side, then choose the one that fits your audience.</div>
                    </div>
                    <div style={{height:2,background:T.brass,marginBottom:18}}/>

                    {/* Stage tabs */}
                    <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`2px solid ${T.brass}`}}>
                      {[["① Pick Your Team",1],["② Generating",2],["③ Review & Choose",3]].map(([label,n])=>(
                        <div key={n} style={{padding:"8px 20px",fontFamily:mono,fontSize:10,letterSpacing:1,textTransform:"uppercase",color:aiReviewStage===n?T.navy:aiReviewStage>n?T.moss:T.muted,fontWeight:aiReviewStage===n?700:400,borderBottom:`2px solid ${aiReviewStage===n?T.navy:"transparent"}`,marginBottom:-2,cursor:aiReviewStage>n?"pointer":"default"}} onClick={()=>aiReviewStage>n&&setAiReviewStage(n)}>{label}</div>
                      ))}
                    </div>

                    {/* STAGE 1: PICK */}
                    {aiReviewStage===1&&(
                      <div>
                        <div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic",marginBottom:16,padding:"9px 14px",background:`${T.brass}06`,border:`1px solid ${T.brass}20`}}>
                          Select 1 or 2 analysts to generate your strategic report. Analysts with RAG training deliver deeper, jurisdiction-specific insights.
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:16}}>
                          {AI_AGENTS.map(a=>{
                            const isSel=aiPickedAgents.includes(a.id);
                            const bc=isSel?(a.color===T.moss?T.moss:T.brass):T.line;
                            return(
                              <div key={a.id} onClick={()=>toggleAiAgent(a.id)} style={{background:T.card,border:`2px solid ${bc}`,position:"relative",cursor:a.addonOnly?"default":"pointer",padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",background:isSel?`${bc}08`:T.card,boxShadow:isSel?`0 0 0 1px ${bc}30`:"none",opacity:a.addonOnly?0.55:1,transition:"all .15s"}}>
                                {isSel&&<div style={{position:"absolute",top:7,right:7,width:16,height:16,borderRadius:"50%",background:bc,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:8,fontWeight:700}}>✓</span></div>}
                                <div style={{width:52,height:52,borderRadius:"50%",background:T.paperDeep,border:`2px solid ${bc}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:7,fontSize:18,overflow:"hidden"}}>
                                  {["🧑🏾‍💼","👨🏽‍💼","👴🏻","👩🏻‍💼","👩🏻‍🎨"][AI_AGENTS.indexOf(a)]}
                                </div>
                                <div style={{fontFamily:display,fontSize:12,fontWeight:600,color:T.navy,marginBottom:1}}>{a.name.split(" ")[0]}</div>
                                <div style={{fontFamily:body,fontSize:9.5,color:T.mutedDeep,fontStyle:"italic",marginBottom:6,lineHeight:1.3}}>{a.role}</div>
                                <div style={{fontFamily:mono,fontSize:8,padding:"1px 5px",border:`1px solid ${bc}40`,color:a.color===T.moss?T.moss:T.brassDeep,background:`${bc}08`,marginBottom:6}}>{a.arch}</div>
                                <div style={{width:"100%",height:4,background:T.paperDeep,border:`1px solid ${T.lineSoft}`,position:"relative",marginBottom:5}}>
                                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${a.skill}%`,background:a.color===T.moss?T.moss:T.brass}}/>
                                </div>
                                <div style={{fontFamily:mono,fontSize:10,fontWeight:700,color:a.awareness>=30?T.brass:T.muted}}>{a.awareness}%</div>
                                <div style={{fontFamily:body,fontSize:9,color:T.muted,fontStyle:"italic",marginBottom:5}}>situational awareness</div>
                                {a.addonOnly
                                  ?<div style={{fontFamily:mono,fontSize:9,color:T.muted,padding:"2px 7px",border:`1px dashed ${T.line}`,fontStyle:"italic"}}>Add-on after review</div>
                                  :<div style={{fontFamily:mono,fontSize:10.5,color:a.costNum===0?T.moss:T.brassDeep,fontWeight:700,paddingTop:5,borderTop:`1px solid ${T.lineSoft}`,width:"100%",textAlign:"center"}}>{a.cost}</div>
                                }
                              </div>
                            );
                          })}
                        </div>
                        {/* Session config selectors — shown per selected agent when user-selectable options exist */}
                        {aiPickedAgents.map(agentId=>{
                          const opts=agentConfigOptions[agentId];
                          if(!opts) return null;
                          const hasRoleChoice=opts.rolePrompts.filter(c=>c.is_user_selectable).length>0;
                          const hasFormatChoice=opts.outputFormats.filter(c=>c.is_user_selectable).length>0;
                          if(!hasRoleChoice&&!hasFormatChoice) return null;
                          const agentDef=AI_AGENTS.find(a=>a.id===agentId);
                          const agentSession=sessionConfigs[agentId]||{};
                          return(
                            <div key={agentId} style={{background:T.cardAlt,border:`1px solid ${T.lineSoft}`,padding:"10px 14px",marginBottom:8,display:"flex",gap:14,alignItems:"flex-end",flexWrap:"wrap"}}>
                              <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600,alignSelf:"center",flexShrink:0}}>{agentDef?.name.split(" ")[0]} →</div>
                              {hasRoleChoice&&(
                                <div>
                                  <div style={{fontFamily:mono,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:.8,marginBottom:3}}>Role Prompt</div>
                                  <select value={agentSession.role_prompt_id||""} onChange={e=>setSessionConfig(agentId,"role_prompt_id",e.target.value)}
                                    style={{background:T.paper,border:`1px solid ${T.line}`,padding:"5px 9px",fontFamily:body,fontSize:11.5,color:T.ink,cursor:"pointer",appearance:"none",minWidth:160}}>
                                    {opts.rolePrompts.map(c=><option key={c.id} value={c.id}>{c.name}{c.is_default?" (default)":""}</option>)}
                                  </select>
                                </div>
                              )}
                              {hasFormatChoice&&(
                                <div>
                                  <div style={{fontFamily:mono,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:.8,marginBottom:3}}>Output Format</div>
                                  <select value={agentSession.output_format_id||""} onChange={e=>setSessionConfig(agentId,"output_format_id",e.target.value)}
                                    style={{background:T.paper,border:`1px solid ${T.line}`,padding:"5px 9px",fontFamily:body,fontSize:11.5,color:T.ink,cursor:"pointer",appearance:"none",minWidth:160}}>
                                    {opts.outputFormats.map(c=><option key={c.id} value={c.id}>{c.name}{c.is_default?" (default)":""}</option>)}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Selected strip + generate */}
                        <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
                          <Corners/>
                          <div>
                            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:5}}>Selected Analysts</div>
                            {aiPickedAgents.length===0
                              ?<div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic"}}>No analysts selected yet</div>
                              :<div style={{display:"flex",gap:16,alignItems:"center"}}>
                                {aiPickedAgents.map((id,i)=>{const a=AI_AGENTS.find(x=>x.id===id);return(<span key={id} style={{display:"flex",alignItems:"center",gap:6,fontFamily:body,fontSize:12,fontWeight:600,color:T.navy}}>{i>0&&<span style={{color:T.muted,fontFamily:mono,fontSize:10}}>+</span>}<span style={{fontSize:14}}>{"🧑🏾‍💼👨🏽‍💼👴🏻👩🏻‍💼"[AI_AGENTS.indexOf(a)]}</span>{a?.name.split(" ")[0]}<span style={{fontFamily:mono,fontSize:10,color:a?.costNum===0?T.moss:T.brassDeep}}>{a?.cost}</span></span>);})}
                              </div>
                            }
                          </div>
                          <div style={{textAlign:"right"}}>
                            {aiPickedAgents.length>0&&<div style={{fontFamily:mono,fontSize:10,color:T.muted,marginBottom:8}}>Total cost: <strong style={{color:T.brassDeep}}>{totalCost===0?"Free":"$"+totalCost}</strong> · ~60 seconds</div>}
                            <button onClick={runAiReview} disabled={aiPickedAgents.length===0} style={{background:aiPickedAgents.length===0?T.line:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,border:"none",color:aiPickedAgents.length===0?T.muted:T.navy,padding:"11px 24px",fontFamily:display,fontSize:14,fontWeight:700,cursor:aiPickedAgents.length===0?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8}}>
                              <span>⚡</span> Generate Strategic Report
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STAGE 2: GENERATING */}
                    {aiReviewStage===2&&(
                      <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"18px 20px"}}>
                        <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:14}}>Generating Your Reports…</div>
                        <div style={{display:"grid",gridTemplateColumns:aiPickedAgents.length===2?"1fr 1fr":"1fr",gap:16}}>
                          {aiPickedAgents.map(id=>{const a=AI_AGENTS.find(x=>x.id===id);return(
                            <div key={id} style={{background:T.cardAlt,border:`1px solid ${T.line}`,padding:"20px",textAlign:"center"}}>
                              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${T.lineSoft}`}}>
                                <span style={{fontSize:24}}>{"🧑🏾‍💼👨🏽‍💼👴🏻👩🏻‍💼"[AI_AGENTS.indexOf(a)]}</span>
                                <div style={{textAlign:"left"}}>
                                  <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.navy}}>{a?.name}</div>
                                  <div style={{fontFamily:body,fontSize:11,color:T.mutedDeep,fontStyle:"italic"}}>{a?.role}</div>
                                </div>
                              </div>
                              <div style={{width:40,height:40,border:`3px solid ${T.brass}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/>
                              <div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic"}}>Analyzing {data.txCount.toLocaleString()} transactions…</div>
                              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                            </div>
                          );})}
                        </div>
                        {aiReviewError&&<div style={{marginTop:14,background:`${T.flag}10`,border:`1px solid ${T.flag}40`,padding:"12px 16px",color:T.flag,fontSize:13}}>⚠ {aiReviewError} <button onClick={()=>setAiReviewStage(1)} style={{marginLeft:12,background:"transparent",border:`1px solid ${T.flag}`,color:T.flag,padding:"3px 10px",cursor:"pointer",fontFamily:body,fontSize:12}}>← Back</button></div>}
                      </div>
                    )}

                    {/* STAGE 3: RESULTS */}
                    {aiReviewStage===3&&(
                      <div>
                        {/* Data context strip */}
                        <div style={{background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,color:T.card,padding:"11px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
                          <div style={{fontFamily:mono,fontSize:9,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1.2}}>Analyzing</div>
                          {[["File",fileName.replace(/\.csv$/i,"")],["Total Spend",fmtFull(data.totalSpend)],["Transactions",data.txCount.toLocaleString()],["Health Flags",data.flags.length],["Vendor HHI",vc?vc.hhi.toFixed(0):"—"]].map(([k,v])=>(
                            <div key={k} style={{borderLeft:`1px solid rgba(255,255,255,.12)`,paddingLeft:16}}>
                              <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1.2,marginBottom:2}}>{k}</div>
                              <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.card}}>{v}</div>
                            </div>
                          ))}
                          <div style={{flex:1}}/>
                          <button onClick={()=>{setAiReviewStage(1);setAiPickedAgents([]);setAiResults({});setAiChristySelected(false);}} style={{background:"transparent",border:`1px solid rgba(248,242,226,.3)`,color:"#b8c5d8",padding:"5px 12px",fontFamily:body,fontSize:11,cursor:"pointer"}}>← New Report</button>
                        </div>

                        {/* Side by side reports */}
                        <div style={{display:"grid",gridTemplateColumns:aiPickedAgents.length===2?"1fr 1fr":"1fr",gap:16,marginBottom:16}}>
                          {aiPickedAgents.map(id=>{
                            const a=AI_AGENTS.find(x=>x.id===id);
                            const text=aiResults[id]||"";
                            return(
                              <div key={id} style={{display:"flex",flexDirection:"column"}}>
                                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:T.cardAlt,border:`1px solid ${a?.color===T.moss?T.moss:T.line}`,borderBottom:"none"}}>
                                  <span style={{fontSize:20}}>{"🧑🏾‍💼👨🏽‍💼👴🏻👩🏻‍💼"[AI_AGENTS.indexOf(a)]}</span>
                                  <div>
                                    <div style={{fontFamily:display,fontSize:13,fontWeight:600,color:T.navy}}>{a?.name}</div>
                                    <div style={{fontFamily:mono,fontSize:9,color:T.muted}}>{a?.arch} · {a?.awareness}% awareness</div>
                                  </div>
                                  <div style={{marginLeft:"auto",fontFamily:mono,fontSize:10,color:a?.costNum===0?T.moss:T.brassDeep,fontWeight:700}}>{a?.cost}</div>
                                </div>
                                <div style={{background:T.card,border:`1px solid ${T.line}`,borderTop:"none",padding:"18px 20px",flex:1,fontSize:13,lineHeight:1.8,color:T.mutedDeep,fontFamily:body}}
                                  dangerouslySetInnerHTML={{__html:(()=>{
                                    const raw=(text||"").trim();
                                    const stripped=raw.replace(/^```html\s*/i,"").replace(/^```\s*/,"").trim();
                                    if(stripped.startsWith("<")){
                                      const fi=stripped.indexOf("\n```");
                                      return fi>-1?stripped.slice(0,fi).trim():stripped;
                                    }
                                    return stripped
                                      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
                                      .replace(/## (.+)/g,"<h3 style='margin:12px 0 6px;color:#12243c'>$1</h3>")
                                      .replace(/# (.+)/g,"<h2 style='margin:14px 0 8px;color:#12243c'>$1</h2>")
                                      .replace(/\n/g,"<br/>");
                                  })()}}
                                />
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:T.cardAlt,border:`1px solid ${T.line}`,borderTop:`2px solid ${T.brass}`}}>
                                  <div style={{fontFamily:body,fontSize:11,color:T.muted,fontStyle:"italic"}}>{a?.arch.includes("RAG")?"RAG-grounded · jurisdiction-specific":"Generic LLM analysis"}</div>
                                  <button onClick={()=>{
                                    const pw=window.open("","_blank","width=900,height=700");
                                    pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${a?.name} — ${fileName}</title><style>body{font-family:Georgia,serif;color:#28221a;max-width:780px;margin:40px auto;padding:0 24px;line-height:1.8}h1{font-size:20px;color:#12243c}p{margin:0 0 12px}@media print{body{font-size:12px}}</style></head><body><h1>${a?.name} — Procurement Report</h1><p><em>${fileName} · ${new Date().toLocaleDateString()}</em></p><hr/><div>${text.replace(/\n/g,"<br/>")}</div></body></html>`);
                                    pw.document.close(); setTimeout(()=>{pw.print();pw.close();},400);
                                  }} style={{background:T.card,border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"6px 14px",cursor:"pointer",fontFamily:body,fontSize:11,fontWeight:600}}>⬇ Print / Download</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Delta panel — only when 2 agents */}
                        {showDelta&&(()=>{
                          return(
                            <div style={{background:T.card,border:`1px solid ${T.line}`,marginBottom:16,position:"relative"}}>
                              <Corners/>
                              <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.lineSoft}`,display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
                                <div>
                                  <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:3}}>Report Comparison</div>
                                  <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.navy}}>How the two reports differ</div>
                                </div>
                                <div style={{fontFamily:body,fontSize:11,color:T.muted,fontStyle:"italic"}}>Quality metrics only — prompt details available in Test My Team</div>
                              </div>
                              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",padding:"14px 18px",gap:0,borderBottom:`1px solid ${T.lineSoft}`}}>
                                {SBAR.map(([label,v1,v2],i)=>{
                                  const diff=(v2||0)-(v1||0);
                                  const isHedge=label==="Hedges";
                                  const diffColor=isHedge?(diff<0?T.moss:diff>0?T.flag:T.muted):(diff>0?T.moss:diff<0?T.flag:T.muted);
                                  const diffLabel=isHedge?(diff<0?`−${Math.abs(diff)} better`:diff>0?`+${diff} more`:"Same"):(diff>0?`+${diff} ${a2?.name.split(" ")[0]}`:diff<0?`+${Math.abs(diff)} ${a1?.name.split(" ")[0]}`:"Same");
                                  return(
                                    <div key={label} style={{padding:`0 ${i>0?"14px":"0"} 0 ${i>0?"14px":"0"}`,borderRight:i<5?`1px solid ${T.lineSoft}`:"none"}}>
                                      <div style={{fontFamily:mono,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:8}}>{label}</div>
                                      <div style={{fontFamily:mono,fontSize:13,fontWeight:700,color:T.ink,marginBottom:4}}>{v1||0} <span style={{fontSize:10,color:T.muted}}>({a1?.name.split(" ")[0]})</span></div>
                                      <div style={{fontFamily:mono,fontSize:13,fontWeight:700,color:T.ink,marginBottom:4}}>{v2||0} <span style={{fontSize:10,color:T.muted}}>({a2?.name.split(" ")[0]})</span></div>
                                      <div style={{fontFamily:mono,fontSize:10,fontWeight:700,color:diffColor}}>{diffLabel}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div style={{padding:"12px 18px",background:T.cardAlt,display:"flex",alignItems:"center",gap:12}}>
                                <div style={{width:8,height:8,borderRadius:"50%",background:T.moss,flexShrink:0}}/>
                                <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,flex:1}}>
                                  Full quality rubric and prompt visibility available in <strong style={{color:T.navy}}>Test My Team</strong>.
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Christy upsell — after results */}
                        <div style={{background:T.navy,border:`2px solid ${T.brass}`,padding:"18px 22px",display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
                          <span style={{fontSize:28}}>👩🏻‍🎨</span>
                          <div style={{flex:1,minWidth:200}}>
                            <div style={{fontFamily:mono,fontSize:8.5,color:"#8fa3bf",letterSpacing:1.2,marginBottom:2}}>MK-05 · MARKETING DESIGNER</div>
                            <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.card,marginBottom:3}}>Christy Park</div>
                            <div style={{fontFamily:body,fontSize:12,color:"#b8c5d8",fontStyle:"italic",marginBottom:8}}>"Package an Executive &amp; Legislative Presentation."</div>
                            <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
                              {[["Situational Awareness","5%"],["Skill","Developing · 36"],["Architecture","LLM Format"],["Add-on Cost","+$141"]].map(([k,v])=>(
                                <div key={k}>
                                  <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{k}</div>
                                  <div style={{fontFamily:display,fontSize:13,fontWeight:600,color:v==="+$141"?T.brassLight:T.card}}>{v}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
                            <button style={{background:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,border:"none",color:T.navy,padding:"10px 20px",fontFamily:display,fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Add Christy + Generate Presentation</button>
                            <button onClick={()=>{
                              const id=aiPickedAgents[0];
                              const text=aiResults[id]||"";
                              const a=AI_AGENTS.find(x=>x.id===id);
                              const pw=window.open("","_blank","width=900,height=700");
                              pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report — ${fileName}</title><style>body{font-family:Georgia,serif;color:#28221a;max-width:780px;margin:40px auto;padding:0 24px;line-height:1.8}h1{font-size:20px;color:#12243c}p{margin:0 0 12px}@media print{body{font-size:12px}}</style></head><body><h1>Procurement Strategic Report</h1><p><em>${fileName} · ${new Date().toLocaleDateString()}</em></p><hr/><div>${text.replace(/\n/g,"<br/>")}</div></body></html>`);
                              pw.document.close(); setTimeout(()=>{pw.print();pw.close();},400);
                            }} style={{background:"transparent",border:`1px solid rgba(248,242,226,.35)`,color:T.card,padding:"10px 20px",fontFamily:body,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>⬇ Print / Download as-is</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── UPDATE FILE ── */}
              {activeTab==="updatefile"&&stage==="map"&&null}

              {/* ── CLEANUP ── */}
              {activeTab==="cleanup"&&(
                <div>
                  <div style={{marginBottom:16}}>
                    <div style={{fontFamily:display,fontSize:20,fontWeight:600,color:T.navy,marginBottom:5}}>Data Quality — Code Cleanup</div>
                    <div style={{fontSize:13,color:T.muted,fontFamily:body}}>{data.dirtyRows.length.toLocaleString()} transactions could not be fully classified.</div>
                  </div>
                  <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"18px 20px",position:"relative"}}>
                    <Corners/>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,fontFamily:body}}>
                        <thead><tr>{["Issue","Raw Code","Description","Vendor","Spend"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",color:T.brassDeep,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,borderBottom:`2px solid ${T.brass}`,fontFamily:mono}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {data.dirtyRows.slice(0,100).map((row,i)=>{ const ic={"Missing Code":T.flag,"Code Too Short":T.brass,"Unrecognized Class":T.brassDeep}[row.issue]||T.muted; return(
                            <tr key={i} style={{borderBottom:`1px solid ${T.lineSoft}`,background:i%2===1?T.cardAlt:"transparent"}}
                              onMouseOver={e=>e.currentTarget.style.background=T.card}
                              onMouseOut={e=>e.currentTarget.style.background=i%2===1?T.cardAlt:"transparent"}>
                              <td style={{padding:"9px 12px"}}><span style={{background:`${ic}12`,padding:"2px 8px",fontSize:10.5,color:ic,border:`1px solid ${ic}44`,fontFamily:mono}}>{row.issue}</span></td>
                              <td style={{padding:"9px 12px"}}><span style={{background:T.cardAlt,padding:"2px 7px",fontSize:10.5,color:T.brassDeep,border:`1px solid ${T.brass}40`,fontWeight:700,fontFamily:mono}}>{row.rawCode}</span></td>
                              <td style={{padding:"9px 12px",color:T.ink,maxWidth:220,fontSize:12}}>{String(row.description||"—").slice(0,55)}</td>
                              <td style={{padding:"9px 12px",color:T.mutedDeep,maxWidth:160,fontSize:12}}>{String(row.vendor||"—").slice(0,35)}</td>
                              <td style={{padding:"9px 12px",color:T.moss,fontWeight:700,whiteSpace:"nowrap",fontFamily:mono}}>{fmtFull(row.amount)}</td>
                            </tr>
                          ); })}
                        </tbody>
                      </table>
                      {data.dirtyRows.length>100&&<div style={{textAlign:"center",padding:"14px",fontSize:12,color:T.muted,fontFamily:mono}}>Showing first 100 of {data.dirtyRows.length.toLocaleString()} rows</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── FULL TABLE ── */}
              {activeTab==="table"&&(
                <Card title="Full Category Table" subtitle="All categories with spend breakdown" span2>
                  <input placeholder="Search category name or code…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{width:"100%",boxSizing:"border-box",marginBottom:14,background:T.cardAlt,border:`1px solid ${T.line}`,padding:"9px 14px",color:T.ink,fontSize:13,outline:"none",fontFamily:body}}/>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,fontFamily:body}}>
                      <thead><tr>{["#","Class","Description","Total Spend","% Spend","Txns","Avg/Txn"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 12px",color:T.brassDeep,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,borderBottom:`2px solid ${T.brass}`,whiteSpace:"nowrap",fontFamily:mono}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filtered.map(row=>{ const rank=data.classArr.indexOf(row)+1; const spendPct=row.total/data.totalSpend*100; return(
                          <tr key={row.classCode+row.label} style={{borderBottom:`1px solid ${T.lineSoft}`,background:rank%2===0?T.cardAlt:"transparent"}}
                            onMouseOver={e=>e.currentTarget.style.background=T.card}
                            onMouseOut={e=>e.currentTarget.style.background=rank%2===0?T.cardAlt:"transparent"}>
                            <td style={{textAlign:"center",padding:"9px 12px",color:T.muted,fontFamily:mono}}>{rank}</td>
                            <td style={{textAlign:"center",padding:"9px 12px"}}><span style={{background:T.cardAlt,padding:"2px 8px",fontSize:11.5,color:T.brassDeep,border:`1px solid ${T.brass}40`,fontWeight:700,fontFamily:mono}}>{row.classCode}</span></td>
                            <td style={{padding:"9px 12px",color:T.navy,fontWeight:500,maxWidth:300}}>{toTC(row.label)}</td>
                            <td style={{padding:"9px 12px",color:T.moss,fontWeight:700,whiteSpace:"nowrap",fontFamily:mono}}>{fmtFull(row.total)}</td>
                            <td style={{padding:"9px 12px",minWidth:130}}><PctBar pct={spendPct} width={70}/></td>
                            <td style={{padding:"9px 12px",color:T.mutedDeep,fontFamily:mono}}>{row.count.toLocaleString()}</td>
                            <td style={{padding:"9px 12px",color:T.mutedDeep,whiteSpace:"nowrap",fontFamily:mono}}>{fmtFull(row.total/row.count)}</td>
                          </tr>
                        ); })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Footer */}
              <div style={{marginTop:14,fontSize:10.5,color:T.muted,textAlign:"center",fontFamily:mono,paddingTop:12,borderTop:`1px solid ${T.lineSoft}`}}>
                {fileName} · {data.rowCount.toLocaleString()} rows · {data.txCount.toLocaleString()} valid transactions · {data.skipped} skipped
              </div>
            </>
          )}
        </div>
      </div>

      {/* Backdrop for help dropdown */}
      {helpDropdown&&<div onClick={()=>setHelpDropdown(false)} style={{position:"fixed",inset:0,zIndex:999}}/>}

      {/* Help Video Modal */}
      {helpOpen&&(
        <>
          <div onClick={()=>setHelpOpen(false)} style={{position:"fixed",inset:0,background:"rgba(18,36,60,0.75)",backdropFilter:"blur(4px)",zIndex:2000,animation:"hModalFadeIn 0.2s ease"}}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(680px,92vw)",background:T.card,border:`1px solid ${T.line}`,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.4)",zIndex:2001,animation:"hModalPopIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}>
            <div style={{padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.line}`,background:T.navy}}>
              <div>
                <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.card}}>NIGP Analyzer Demo</div>
                <div style={{fontSize:11,color:"#b8c5d8",marginTop:2,fontFamily:mono}}>1 min · Getting Started</div>
              </div>
              <button onClick={()=>setHelpOpen(false)} style={{background:T.navyMid,border:`1px solid ${T.card}30`,color:T.card,width:30,height:30,cursor:"pointer",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:mono}}>✕</button>
            </div>
            <div style={{background:"#000",aspectRatio:"16/9",width:"100%"}}>
              <iframe src="https://www.youtube.com/embed/U7FXpun6Kxk?autoplay=1&rel=0" title="NIGP Analyzer Demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{width:"100%",height:"100%",border:"none",display:"block"}}/>
            </div>
            <div style={{padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.cardAlt,borderTop:`1px solid ${T.line}`}}>
              <span style={{fontSize:12,color:T.muted,fontFamily:body}}>Click outside or ✕ to close and return to the app</span>
              <button onClick={()=>setHelpOpen(false)} style={{background:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,color:T.navy,border:"none",padding:"7px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:display}}>Got it ✓</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
