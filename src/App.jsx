import { useState, useCallback, useMemo, useRef } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Treemap, Legend, LineChart, Line, ReferenceLine
} from "recharts";

// ── NIGP 18th Edition — 264 official class codes ──────────────────────────────
const NIGP_CLASS_LOOKUP = {"005":"ABRASIVES","010":"ACOUSTICAL TILE, INSULATING MATERIALS, AND SUPPLIES","015":"ADDRESSING, COPYING, MIMEOGRAPH, AND SPIRIT DUPLICATING MACHINE SUPPLIES","019":"AGRICULTURAL CROPS AND GRAINS INCLUDING FRUITS, MELONS, NUTS, AND VEGETABLES","020":"AGRICULTURAL EQUIPMENT, IMPLEMENTS, AND ACCESSORIES","022":"AGRICULTURAL EQUIPMENT AND IMPLEMENT PARTS","025":"AIR COMPRESSORS AND ACCESSORIES","031":"AIR CONDITIONING, HEATING, AND VENTILATING EQUIPMENT, PARTS AND ACCESSORIES","035":"AIRCRAFT AND AIRPORT EQUIPMENT, PARTS, AND SUPPLIES","037":"AMUSEMENT, DECORATIONS, ENTERTAINMENT, GIFTS, TOYS, ETC.","040":"ANIMALS, BIRDS, MARINE LIFE, AND POULTRY, LIVE","050":"ART EQUIPMENT AND SUPPLIES","052":"ART OBJECTS","055":"AUTOMOTIVE ACCESSORIES FOR AUTOMOBILES, BUSES, TRAILERS, TRUCKS, ETC.","060":"AUTOMOTIVE AND TRAILER EQUIPMENT AND PARTS","065":"AUTOMOTIVE AND TRAILER BODIES, BODY ACCESSORIES, AND PARTS","070":"AUTOMOTIVE VEHICLES AND RELATED TRANSPORTATION EQUIPMENT","072":"TRUCKS (INCLUDING DIESEL, GASOLINE, ELECTRIC, HYBRID, AND ALTERNATIVE FUEL UNITS)","073":"TRAILERS","075":"AUTOMOTIVE SHOP AND RELATED EQUIPMENT AND SUPPLIES","080":"BADGES, AWARDS, EMBLEMS, NAME TAGS AND PLATES, JEWELRY, ETC.","085":"BAGS, BAGGING, TIES, AND EROSION SHEETING, ETC.","090":"BAKERY EQUIPMENT, COMMERCIAL","095":"BARBER AND BEAUTY SHOP EQUIPMENT AND SUPPLIES","100":"BARRELS, DRUMS, KEGS, AND CONTAINERS","105":"BEARINGS","110":"BELTS AND BELTING: AUTOMOTIVE AND INDUSTRIAL","115":"BIOCHEMICALS, RESEARCH","120":"BOATS, MOTORS, AND MARINE EQUIPMENT","125":"BOOKBINDING SUPPLIES","135":"BRICKS, CLAY, REFRACTORY MATERIALS, STONE, AND TILE PRODUCTS","140":"BROOM, BRUSH, AND MOP MANUFACTURING MACHINERY AND SUPPLIES","145":"BRUSHES","150":"BUILDER'S SUPPLIES","155":"BUILDINGS AND STRUCTURES: FABRICATED AND PREFABRICATED","160":"BUTCHER SHOP AND MEAT PROCESSING EQUIPMENT","165":"CAFETERIA AND KITCHEN EQUIPMENT, COMMERCIAL","175":"CHEMICAL LABORATORY EQUIPMENT AND SUPPLIES","180":"CHEMICAL RAW MATERIALS (IN LARGE QUANTITIES)","190":"CHEMICALS AND SOLVENTS, COMMERCIAL (IN BULK)","192":"CLEANING COMPOSITIONS, DETERGENTS, SOLVENTS, AND STRIPPERS - PREPACKAGED","193":"CLINICAL LABORATORY REAGENTS AND TESTS","195":"CLOCKS, WATCHES, TIMEPIECES, JEWELRY AND PRECIOUS STONES","200":"CLOTHING: ATHLETIC, CASUAL, DRESS, UNIFORM, WEATHER AND WORK RELATED","201":"CLOTHING ACCESSORIES","204":"COMPUTER HARDWARE AND PERIPHERALS FOR MICROCOMPUTERS","206":"COMPUTER HARDWARE AND PERIPHERALS FOR MINI AND MAIN FRAME COMPUTERS","207":"COMPUTER ACCESSORIES AND SUPPLIES","208":"COMPUTER SOFTWARE FOR MICROCOMPUTERS (PREPROGRAMMED)","209":"COMPUTER SOFTWARE FOR MINI AND MAINFRAME COMPUTERS (PREPROGRAMMED)","210":"CONCRETE AND METAL PRODUCTS, CULVERTS, PILINGS, SEPTIC TANKS, ACCESSORIES AND SUPPLIES","220":"CONTROLLING, INDICATING, MEASURING, MONITORING, AND RECORDING INSTRUMENTS AND SUPPLIES","225":"COOLERS, DRINKING WATER (WATER FOUNTAINS)","232":"CRAFTS, GENERAL","233":"CRAFTS, SPECIALIZED","240":"CUTLERY, COOKWARE, DISHES, GLASSWARE, SILVERWARE, UTENSILS, AND SUPPLIES","245":"DAIRY EQUIPMENT AND SUPPLIES","250":"DATA PROCESSING CARDS AND PAPER","255":"DECALS AND STAMPS","257":"DEFENSE SYSTEM AND HOMELAND SECURITY EQUIPMENT, WEAPONS AND ACCESSORIES","260":"DENTAL EQUIPMENT AND SUPPLIES","265":"DRAPERIES, CURTAINS, AND UPHOLSTERY MATERIAL","269":"DRUGS AND PHARMACEUTICALS","271":"DRUG AND FEEDING ADMINISTRATION, INFUSION, AND IRRIGATION EQUIPMENT AND SUPPLIES","280":"ELECTRICAL CABLES AND WIRES (NOT ELECTRONIC)","285":"ELECTRICAL EQUIPMENT AND SUPPLIES (EXCEPT CABLE AND WIRE)","287":"ELECTRONIC EQUIPMENT, COMPONENTS, PARTS, AND ACCESSORIES","290":"ENERGY COLLECTING EQUIPMENT AND ACCESSORIES: SOLAR AND WIND","295":"ELEVATORS, ESCALATORS, AND MOVING WALKS (BUILDING TYPE)","305":"ENGINEERING AND ARCHITECTURAL EQUIPMENT, SURVEYING EQUIPMENT, DRAWING INSTRUMENTS","310":"ENVELOPES, PLAIN","312":"ENVIRONMENTAL PROTECTIVE EQUIPMENT (INSIDE AND OUTSIDE)","315":"EPOXY BASED FORMULATIONS FOR ADHESIVES, COATINGS, AND RELATED AGENTS","318":"FARE COLLECTION EQUIPMENT AND SUPPLIES","320":"FASTENERS: BOLTS, NUTS, PINS, RIVETS, SCREWS, ETC.","325":"FEED, BEDDING, VITAMINS AND SUPPLEMENTS FOR ANIMALS","330":"FENCING","335":"FERTILIZERS AND SOIL CONDITIONERS","340":"FIRE PROTECTION EQUIPMENT AND SUPPLIES","345":"FIRST AID AND SAFETY EQUIPMENT AND SUPPLIES","350":"FLAGS, FLAG POLES, BANNERS, AND ACCESSORIES","360":"FLOOR COVERING, INSTALLATION AND REMOVAL EQUIPMENT, AND SUPPLIES","365":"FLOOR MAINTENANCE MACHINES, PARTS, AND ACCESSORIES","370":"FOOD PROCESSING AND CANNING EQUIPMENT AND SUPPLIES","375":"FOODS: BAKERY PRODUCTS (FRESH)","380":"FOODS: DAIRY PRODUCTS (FRESH)","385":"FOODS, FROZEN","390":"FOODS: PERISHABLE","393":"FOODS: STAPLE GROCERY AND GROCER'S MISCELLANEOUS ITEMS","395":"FORMS, CONTINUOUS: COMPUTER PAPER, FORM LABELS, SNAP-OUT FORMS","400":"FOUNDRY CASTINGS, EQUIPMENT, AND SUPPLIES","405":"FUEL, OIL, GREASE AND LUBRICANTS","410":"FURNITURE: HEALTH CARE, HOSPITAL AND/OR DOCTOR'S OFFICE","415":"FURNITURE: LABORATORY","420":"FURNITURE: CAFETERIA, CHAPEL, DORMITORY, HOUSEHOLD, LIBRARY, LOUNGE, SCHOOL","425":"FURNITURE: OFFICE","430":"GASES, CONTAINERS, EQUIPMENT: LABORATORY, MEDICAL, AND WELDING","435":"GERMICIDES, CLEANERS, AND RELATED SANITATION PRODUCTS FOR HEALTH CARE PERSONNEL","436":"GERMICIDES, CLEANERS, AND SANITATION PRODUCTS FOR HEALTH CARE (ENVIRONMENTALLY CERTIFIED)","440":"GLASS AND GLAZING SUPPLIES","445":"HAND TOOLS (POWERED AND NON-POWERED), ACCESSORIES AND SUPPLIES","450":"HARDWARE AND RELATED ITEMS","460":"HOSE, ACCESSORIES, AND SUPPLIES: INDUSTRIAL, COMMERCIAL, AND GARDEN","465":"HOSPITAL AND SURGICAL EQUIPMENT, INSTRUMENTS, AND SUPPLIES","470":"HOSPITAL, NURSING HOME OR RESIDENTIAL SPECIALIZED EQUIPMENT FOR HANDICAPPED AND DISABLED","475":"HOSPITAL, SURGICAL, AND MEDICAL RELATED ACCESSORIES AND SUNDRY ITEMS","485":"JANITORIAL SUPPLIES, GENERAL LINE","486":"JANITORIAL SUPPLIES, GENERAL LINE, ENVIRONMENTALLY CERTIFIED","490":"LABORATORY EQUIPMENT, ACCESSORIES AND SUPPLIES: GENERAL ANALYTICAL AND RESEARCH","493":"LABORATORY EQUIPMENT, ACCESSORIES, AND SUPPLIES: BIOCHEMISTRY, CHEMISTRY, ENVIRONMENTAL","495":"LABORATORY AND FIELD EQUIPMENT AND SUPPLIES: BIOLOGY, BOTANY, GEOLOGY, MICROBIOLOGY","500":"LAUNDRY AND DRY CLEANING EQUIPMENT, ACCESSORIES AND SUPPLIES, COMMERCIAL","505":"LAUNDRY AND DRY CLEANING COMPOUNDS, DETERGENTS, AND SUPPLIES","510":"LAUNDRY TEXTILES AND SUPPLIES","515":"LAWN MAINTENANCE EQUIPMENT AND ACCESSORIES","520":"LEATHER AND SHOE ACCESSORIES, EQUIPMENT, AND SUPPLIES","525":"LIBRARY AND ARCHIVAL EQUIPMENT, MACHINES, AND SUPPLIES","530":"LUGGAGE, BRIEF CASES, PURSES AND RELATED ITEMS","540":"LUMBER, SIDING, AND RELATED PRODUCTS","545":"MACHINERY AND HARDWARE, INDUSTRIAL","550":"MARKERS, PLAQUES AND TRAFFIC CONTROL DEVICES","553":"MANUFACTURING COMPONENTS AND SUPPLIES","555":"METAL, PAPER, AND PLASTIC STENCILS AND STENCILING DEVICES","556":"MASS TRANSPORTATION - TRANSIT BUS","557":"MASS TRANSPORTATION - TRANSIT BUS ACCESSORIES AND PARTS","558":"MASS TRANSPORTATION - RAIL VEHICLES AND SYSTEMS","559":"MASS TRANSPORTATION - RAIL VEHICLE PARTS AND ACCESSORIES","560":"MATERIAL HANDLING, CONVEYORS, STORAGE EQUIPMENT AND ACCESSORIES","565":"MATTRESS AND PILLOW MANUFACTURING MACHINERY AND SUPPLIES","570":"METALS: BARS, PLATES, RODS, SHEETS, STRIPS, STRUCTURAL SHAPES, TUBING","575":"MICROFICHE AND MICROFILM EQUIPMENT, ACCESSORIES, AND SUPPLIES","578":"MISCELLANEOUS PRODUCTS (NOT OTHERWISE CLASSIFIED)","580":"MUSICAL INSTRUMENTS, ACCESSORIES, AND SUPPLIES","590":"NOTIONS AND RELATED SEWING ACCESSORIES AND SUPPLIES","593":"NUCLEAR EQUIPMENT COMPONENTS, ACCESSORIES AND SUPPLIES","595":"NURSERY (PLANTS) STOCK, EQUIPMENT, AND SUPPLIES","600":"OFFICE MACHINES, EQUIPMENT, AND ACCESSORIES","605":"OFFICE MECHANICAL AIDS, SMALL MACHINES, AND APPARATUSES","610":"OFFICE SUPPLIES: CARBON PAPER AND RIBBONS, ALL TYPES","615":"OFFICE SUPPLIES, GENERAL","620":"OFFICE SUPPLIES: ERASERS, INKS, LEADS, PENS, PENCILS, ETC.","625":"OPTICAL EQUIPMENT, ACCESSORIES, AND SUPPLIES","630":"PAINT, PROTECTIVE COATINGS, VARNISH, WALLPAPER, AND RELATED PRODUCTS","631":"PAINT, PROTECTIVE COATINGS, VARNISH, WALLPAPER (ENVIRONMENTALLY CERTIFIED)","635":"PAINTING EQUIPMENT AND ACCESSORIES","640":"PAPER AND PLASTIC PRODUCTS, DISPOSABLE","645":"PAPER, FOR OFFICE AND PRINT SHOP USE","650":"PARK, PLAYGROUND, RECREATIONAL AREA AND SWIMMING POOL EQUIPMENT AND SUPPLIES","652":"PERSONAL HYGIENE AND GROOMING EQUIPMENT AND SUPPLIES","655":"PHOTOGRAPHIC EQUIPMENT, FILM, AND SUPPLIES","658":"PIPE, TUBING, AND ACCESSORIES (NOT FITTINGS)","659":"PIPE AND TUBING FITTINGS","665":"PLASTICS, RESINS, FIBERGLASS: CONSTRUCTION, FORMING, LAMINATING, AND MOLDING EQUIPMENT","670":"PLUMBING EQUIPMENT, FIXTURES, AND SUPPLIES","675":"PESTICIDES AND CHEMICALS: AGRICULTURAL AND INDUSTRIAL","680":"POLICE AND PRISON EQUIPMENT AND SUPPLIES","685":"POULTRY EQUIPMENT AND SUPPLIES","690":"POWER GENERATION EQUIPMENT, ACCESSORIES, AND SUPPLIES","691":"POWER TRANSMISSION EQUIPMENT (ELECTRICAL, MECHANICAL, AIR AND HYDRAULIC)","700":"PRINTING PLANT EQUIPMENT AND SUPPLIES (EXCEPT PAPER)","710":"PROSTHETIC DEVICES, HEARING AIDS, AUDITORY TESTING EQUIPMENT, ELECTRONIC READING DEVICES","715":"PUBLICATIONS, AUDIOVISUAL MATERIALS, BOOKS, TEXTBOOKS (PREPARED MATERIALS ONLY)","720":"PUMPING EQUIPMENT AND ACCESSORIES","725":"RADIO COMMUNICATION, TELEPHONE, AND TELECOMMUNICATION EQUIPMENT, ACCESSORIES, AND SUPPLIES","726":"RADIO COMMUNICATION EQUIPMENT, ACCESSORIES AND SUPPLIES","730":"RADIO COMMUNICATION AND TELECOMMUNICATION TESTING, MEASURING, AND ANALYZING EQUIPMENT","735":"RAGS, SHOP TOWELS, AND WIPING CLOTHS","740":"REFRIGERATION EQUIPMENT AND ACCESSORIES","745":"ROAD AND HIGHWAY BUILDING MATERIALS (ASPHALTIC)","750":"ROAD AND HIGHWAY BUILDING MATERIALS (NOT ASPHALTIC)","755":"ROAD AND HIGHWAY ASPHALT AND CONCRETE HANDLING AND PROCESSING EQUIPMENT","760":"ROAD AND HIGHWAY EQUIPMENT: EARTH HANDLING, GRADING, MOVING, PACKING, ETC.","765":"ROAD AND HIGHWAY EQUIPMENT (EXCEPT EQUIPMENT IN CLASSES 755 AND 760)","770":"ROOFING MATERIALS AND SUPPLIES","775":"SALT (SODIUM CHLORIDE)","780":"SCALES AND WEIGHING APPARATUS","785":"SCHOOL EQUIPMENT, TEACHING AIDS, AND SUPPLIES","790":"SEED, SOD, SOIL, AND INOCULANTS","795":"SEWING AND TEXTILE MACHINERY AND ACCESSORIES","800":"SHOES AND BOOTS","801":"SIGNS, SIGN MATERIALS, SIGN MAKING EQUIPMENT, AND RELATED SUPPLIES","803":"SOUND SYSTEMS, COMPONENTS, AND ACCESSORIES: GROUP INTERCOM, MUSIC, PUBLIC ADDRESS","805":"SPORTING GOODS, ATHLETIC EQUIPMENT AND ATHLETIC FACILITY EQUIPMENT","810":"SPRAYING EQUIPMENT","815":"STEAM AND HOT WATER FITTINGS, ACCESSORIES, AND SUPPLIES","820":"STEAM AND HOT WATER BOILERS AND STEAM HEATING EQUIPMENT","825":"STOCKMAN EQUIPMENT AND SUPPLIES","830":"TANKS (METAL, PLASTIC, WOOD, AND SYNTHETIC MATERIALS): MOBILE, PORTABLE, STATIONARY","832":"TAPE (NOT DATA PROCESSING, MEASURING, OPTICAL, SEWING, SOUND, OR VIDEO)","838":"TELECOMMUNICATION EQUIPMENT, ACCESSORIES AND SUPPLIES","839":"TELEPHONE EQUIPMENT, ACCESSORIES AND SUPPLIES","840":"TELEVISION EQUIPMENT AND ACCESSORIES","845":"TESTING APPARATUS AND INSTRUMENTS (NOT FOR ELECTRICAL OR ELECTRONIC MEASUREMENTS)","850":"TEXTILES, FIBERS, HOUSEHOLD LINENS, AND PIECE GOODS","855":"THEATRICAL EQUIPMENT AND SUPPLIES","860":"TICKETS, COUPON BOOKS, SALES BOOKS, STRIP BOOKS, ETC.","863":"TIRES AND TUBES (INCL. RECAPPED/RETREADED TIRES)","865":"TWINE AND STRING","870":"VENETIAN BLINDS, AWNINGS, AND SHADES","875":"VETERINARY EQUIPMENT AND SUPPLIES","880":"VISUAL EDUCATION EQUIPMENT AND SUPPLIES","883":"VOICE RESPONSE SYSTEMS","885":"WATER AND WASTEWATER TREATING CHEMICALS","890":"WATER SUPPLY, GROUNDWATER, SEWAGE TREATMENT, AND RELATED EQUIPMENT","895":"WELDING EQUIPMENT AND SUPPLIES","898":"X-RAY AND OTHER RADIOLOGICAL EQUIPMENT AND SUPPLIES (MEDICAL)","905":"AIRCRAFT AND AIRPORT OPERATIONS SERVICES","906":"ARCHITECTURAL SERVICES, PROFESSIONAL","907":"ARCHITECTURAL AND ENGINEERING SERVICES, NON-PROFESSIONAL","908":"BOOKBINDING AND REPAIRING SERVICES","909":"BUILDING CONSTRUCTION SERVICES, NEW (INCL. MAINTENANCE AND REPAIR SERVICES)","910":"BUILDING MAINTENANCE, INSTALLATION AND REPAIR SERVICES","912":"CONSTRUCTION SERVICES, GENERAL (INCL. MAINTENANCE AND REPAIR SERVICES)","913":"CONSTRUCTION SERVICES, HEAVY (INCL. MAINTENANCE AND REPAIR SERVICES)","914":"CONSTRUCTION SERVICES, TRADE (NEW CONSTRUCTION)","915":"COMMUNICATIONS AND MEDIA RELATED SERVICES","918":"CONSULTING SERVICES","920":"DATA PROCESSING, COMPUTER, PROGRAMMING, AND SOFTWARE SERVICES","924":"EDUCATIONAL/TRAINING SERVICES","925":"ENGINEERING SERVICES, PROFESSIONAL","926":"ENVIRONMENTAL AND ECOLOGICAL SERVICES","928":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR AUTOMOBILES, TRUCKS, TRAILERS","929":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR AGRICULTURAL, CONSTRUCTION, HEAVY INDUSTRIAL","931":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR APPLIANCE, ATHLETIC, CAFETERIA, FURNITURE","934":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR LAUNDRY, LAWN, PAINTING, PLUMBING","938":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR HOSPITAL, LABORATORY, AND TESTING EQUIPMENT","939":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR COMPUTERS, OFFICE, PHOTOGRAPHIC","940":"EQUIPMENT MAINTENANCE, REPAIR, CONSTRUCTION, AND RELATED SERVICES FOR RAILROADS","941":"EQUIPMENT MAINTENANCE, REPAIR, AND RELATED SERVICES FOR POWER GENERATION AND TRANSMISSION","944":"FARMING AND RANCHING SERVICES, ANIMAL AND CROP","946":"FINANCIAL SERVICES","947":"FORESTRY SERVICES","948":"HEALTH RELATED SERVICES","952":"HUMAN SERVICES","953":"INSURANCE AND INSURANCE SERVICES (ALL TYPES)","954":"LAUNDRY AND DRY CLEANING SERVICES","956":"LIBRARY SERVICES (INCL. RESEARCH AND SUBSCRIPTION SERVICES)","958":"MANAGEMENT SERVICES","961":"MISCELLANEOUS SERVICES, NO. 1 (NOT OTHERWISE CLASSIFIED)","962":"MISCELLANEOUS SERVICES, NO. 2 (NOT OTHERWISE CLASSIFIED)","963":"NON-BIDDABLE MISCELLANEOUS ITEMS","965":"PRINTING PREPARATIONS","966":"PRINTING AND TYPESETTING SERVICES","967":"PRODUCTION AND MANUFACTURING SERVICES","968":"PUBLIC WORKS AND RELATED SERVICES","971":"REAL PROPERTY RENTAL OR LEASE","975":"RENTAL OR LEASE SERVICES OF AGRICULTURAL, AIRCRAFT, AIRPORT, AUTOMOTIVE, MARINE, AND HEAVY EQUIPMENT","977":"RENTAL OR LEASE SERVICES OF APPLIANCES, CAFETERIA, FILM, FURNITURE, HARDWARE, MUSICAL, SEWING","979":"RENTAL OR LEASE SERVICES OF ENGINEERING, HOSPITAL, LABORATORY, PRECISION INSTRUMENTS","981":"RENTAL OR LEASE OF GENERAL EQUIPMENT (HVAC, ATHLETIC, FIRE AND POLICE PROTECTION)","983":"RENTAL OR LEASE SERVICES OF CLOTHING, JANITORIAL, LAUNDRY, LAWN, PAINTING, SPRAYING","984":"RENTAL OR LEASE SERVICES OF COMPUTERS, DATA PROCESSING, AND WORD PROCESSING EQUIPMENT","985":"RENTAL OR LEASE SERVICES OF OFFICE, PHOTOGRAPHIC, PRINTING, RADIO/TELEVISION/TELEPHONE","988":"ROADSIDE, GROUNDS, RECREATIONAL AND PARK AREA SERVICES","989":"SAMPLING AND SAMPLE PREPARATION SERVICES (FOR TESTING)","990":"SECURITY, FIRE, SAFETY, AND EMERGENCY SERVICES","992":"TESTING AND CALIBRATION SERVICES","998":"SALE OF SURPLUS AND OBSOLETE ITEMS"};

function resolveNIGP(rawCode) {
  if (!rawCode) return { classCode:"000", label:"Unknown / Unclassified" };
  const digits = String(rawCode).replace(/\D/g,"");
  if (!digits) return { classCode:"000", label:"Unknown / Unclassified" };
  const classCode = digits.padStart(3,"0").slice(0,3);
  const label = NIGP_CLASS_LOOKUP[classCode] || `Unrecognized Class ${classCode}`;
  return { classCode, label };
}

// ── Field synonyms ────────────────────────────────────────────────────────────
const FIELD_DEFS = {
  amount:      { label:"💰 Spend Amount",      required:true,  color:"#00C49F", hint:"Dollar value per transaction",         synonyms:["itm_tot_am","amount","total","spend","cost","price","value","sum","extended","amt","dollar","extended_amount","total_amount","line_total","po_amount"] },
  nigp:        { label:"🏷 NIGP Code",          required:true,  color:"#0088FE", hint:"NIGP commodity / class code",          synonyms:["commodity","nigp","class","code","item_class","commodity_code","nigp_code","item_no","class_code","nigp_class","nigp_commodity"] },
  description: { label:"📋 Item Description",  required:false, color:"#FFBB28", hint:"What was purchased",                   synonyms:["commodity_description","description","desc","item_desc","service","product","title","line_desc","item_description","extended_description"] },
  vendor:      { label:"🏢 Vendor Name",        required:false, color:"#FF8042", hint:"Supplier / contractor legal name",     synonyms:["lgl_nm","vendor","supplier","payee","contractor","company","vendor_name","legal_name","legalname","vendor_legal_name","firm"] },
  contract:    { label:"📄 Contract / MA #",    required:false, color:"#A45CFF", hint:"Master agreement or contract number",  synonyms:["master_agreement","contract","contract_no","contract_number","ma_number","agreement","po_contract","contract_id","master_agreement_no"] },
  po:          { label:"🔢 PO Number",          required:false, color:"#29B6F6", hint:"Purchase order number",               synonyms:["purchase_order","po","po_number","po_no","order_number","doc_no","po_num"] },
  department:  { label:"🏛 Department",         required:false, color:"#FFA726", hint:"Agency or division that purchased",   synonyms:["dept","department","agency","division","org","bureau","unit","department_name","dept_name","organization"] },
  vendor_city: { label:"🏙 Vendor City",         required:false, color:"#26C6DA", hint:"City where vendor is located",        synonyms:["city","vendor_city","supplier_city","address_city","vendor_city_name","city_name"] },
  vendor_state:{ label:"📍 Vendor State",        required:false, color:"#66BB6A", hint:"State where vendor is located",       synonyms:["st","state","vendor_state","supplier_state","address_state","vendor_st"] },
  date:        { label:"📅 Date",               required:false, color:"#EF5350", hint:"Award or transaction date",           synonyms:["award_date","date","po_date","order_date","transaction_date","purchase_date","doc_date","invoice_date"] },
};

function autoDetect(columns) {
  const result = {};
  const norm = columns.map(c => c.toLowerCase().replace(/[^a-z0-9_]/g,""));
  for (const [field, def] of Object.entries(FIELD_DEFS)) {
    const idx = def.synonyms.findIndex(s => norm.includes(s));
    if (idx !== -1) { result[field] = columns[norm.indexOf(def.synonyms[idx])]; continue; }
    const partial = columns.find(c => def.synonyms.some(s => c.toLowerCase().replace(/[^a-z0-9_]/g,"").includes(s)));
    result[field] = partial || "";
  }
  return result;
}

// ── Utilities ─────────────────────────────────────────────────────────────────
const PALETTE = ["#00C49F","#FFBB28","#FF8042","#0088FE","#A45CFF","#FF6B9D","#29B6F6","#FFA726","#66BB6A","#EF5350","#AB47BC","#26C6DA","#D4E157","#FF7043","#42A5F5","#EC407A","#7E57C2","#26A69A","#FFA000","#78909C","#4DD0E1","#AED581","#FFD54F","#F48FB1","#CE93D8"];

const fmt = n => n>=1e9?`$${(n/1e9).toFixed(2)}B`:n>=1e6?`$${(n/1e6).toFixed(1)}M`:n>=1e3?`$${(n/1e3).toFixed(0)}K`:`$${n.toFixed(0)}`;
const fmtFull = n => "$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const parseAmt = raw => { if(!raw) return NaN; return parseFloat(String(raw).replace(/[$,\s]/g,"")); };
const toTC = str => str.replace(/\w\S*/g, w => ["AND","OR","FOR","THE","IN","OF","A","AN","TO","WITH","NOT","ETC","BY","AT","AS","FROM","BUT","INC","LLC"].includes(w.toUpperCase()) ? w.charAt(0).toUpperCase()+w.slice(1).toLowerCase() : w.charAt(0).toUpperCase()+w.slice(1).toLowerCase());
const shortLabel = (s,n=38) => { const tc=toTC(s); return tc.length>n?tc.slice(0,n-1)+"…":tc; };

const fmtPct = (n, decimals=1) => `${n.toFixed(decimals)}%`;

// Inline percentage pill — used next to spend values in charts/tables
const PctPill = ({pct, color="#00C49F", size="sm"}) => {
  const fs = size==="lg" ? 13 : size==="md" ? 12 : 11;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:3,
      background:`${color}18`,border:`1px solid ${color}44`,
      borderRadius:5,padding:size==="lg"?"3px 9px":"2px 7px",
      fontSize:fs,fontWeight:700,color,whiteSpace:"nowrap",flexShrink:0,
    }}>
      {fmtPct(pct)}
    </span>
  );
};

// Mini horizontal progress bar + pct label
const PctBar = ({pct, color="#00C49F", width=80}) => (
  <div style={{display:"flex",alignItems:"center",gap:7,minWidth:width+44}}>
    <div style={{height:5,borderRadius:3,background:"#0d1e2e",width,overflow:"hidden",flexShrink:0}}>
      <div style={{height:"100%",borderRadius:3,background:color,width:`${Math.min(100,pct)}%`,transition:"width 0.3s"}}/>
    </div>
    <span style={{color:"#6a9ab8",fontSize:11,minWidth:38,fontWeight:600}}>{fmtPct(pct)}</span>
  </div>
);

// Custom bar label that shows % of total to the right of a recharts Bar
const PctBarLabel = ({x,y,width,height,value,total,color="#8ab4cc"}) => {
  if(!total||width<30) return null;
  const pct = (value/total*100).toFixed(1);
  return (
    <text x={x+width+7} y={y+height/2+1} fill={color} fontSize={10} fontWeight={600} dominantBaseline="middle">
      {pct}%
    </text>
  );
};

const Tip = ({active,payload,label,total}) => {
  if(!active||!payload?.length) return null;
  const val = payload[0].value;
  const pct = total && total>0 ? (val/total*100) : (payload[0].payload?._pct ?? null);
  return <div style={{background:"#0f1923",border:"1px solid #1e3a4a",borderRadius:8,padding:"10px 14px",color:"#e0f0ff",fontSize:13,maxWidth:300}}><div style={{fontWeight:700,marginBottom:4,color:"#00C49F",lineHeight:1.3}}>{label||payload[0].name}</div><div style={{color:"#a0c4d8"}}>{fmtFull(val)}</div>{pct!=null&&<div style={{color:"#6a9ab8",fontSize:11,marginTop:3}}>📊 {fmtPct(pct)} of total spend</div>}</div>;
};

// treemapTotal is set at render time before Treemap is drawn
let _treemapTotal = 0;
const TreeCell = ({x,y,width,height,name,value,index}) => {
  if(width<30||height<20) return null;
  const color=PALETTE[index%PALETTE.length];
  const pct = _treemapTotal>0 ? (value/_treemapTotal*100).toFixed(1) : null;
  const showName = width>70&&height>32;
  const showAmt  = width>70&&height>55;
  const showPct  = width>70&&height>72&&pct!=null;
  const midY = y+height/2;
  const nameY = showPct ? midY-14 : showAmt ? midY-9 : midY+4;
  return (
    <g>
      <rect x={x+1} y={y+1} width={width-2} height={height-2} rx={4} fill={color} fillOpacity={0.85} stroke="#0a1520" strokeWidth={1}/>
      {showName&&<text x={x+width/2} y={nameY} textAnchor="middle" fill="#fff" fontSize={Math.min(11,width/9)} fontWeight="600" style={{pointerEvents:"none"}}>{name?.length>18?name.slice(0,17)+"…":name}</text>}
      {showAmt&&<text x={x+width/2} y={nameY+(showPct?14:showName?13:0)} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize={Math.min(10,width/10)} style={{pointerEvents:"none"}}>{fmt(value)}</text>}
      {showPct&&<text x={x+width/2} y={nameY+27} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={Math.min(11,width/9)} fontWeight="700" style={{pointerEvents:"none"}}>{pct}%</text>}
    </g>
  );
};

const Card = ({title,subtitle,children,span2}) => (
  <div style={{background:"#0a1729",borderRadius:14,padding:"20px 22px",border:"1px solid #1a3040",gridColumn:span2?"1/-1":undefined}}>
    <div style={{marginBottom:14}}><div style={{fontSize:15,fontWeight:700,color:"#d0e8f5"}}>{title}</div>{subtitle&&<div style={{fontSize:12,color:"#4a7a96",marginTop:2}}>{subtitle}</div>}</div>
    {children}
  </div>
);

// ── Flag card component ───────────────────────────────────────────────────────
const FLAG_COLORS = { high:"#EF5350", medium:"#FFA726", low:"#FFBB28", info:"#0088FE" };
const FLAG_BG     = { high:"rgba(239,83,80,0.08)", medium:"rgba(255,167,38,0.08)", low:"rgba(255,187,40,0.08)", info:"rgba(0,136,254,0.08)" };
const FLAG_ICONS  = { high:"🔴", medium:"🟠", low:"🟡", info:"🔵" };

const FlagCard = ({severity,title,summary,detail,amount,count,recommendation,totalSpend}) => {
  const [open,setOpen] = useState(false);
  const c = FLAG_COLORS[severity]; const bg = FLAG_BG[severity];
  const pct = totalSpend && amount ? (amount/totalSpend*100) : null;
  return (
    <div style={{background:bg,border:`1px solid ${c}44`,borderRadius:12,padding:"16px 20px",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <span style={{fontSize:16}}>{FLAG_ICONS[severity]}</span>
            <span style={{fontSize:14,fontWeight:700,color:"#e8f4ff"}}>{title}</span>
            <span style={{fontSize:10,background:`${c}22`,color:c,borderRadius:4,padding:"2px 7px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>{severity} priority</span>
          </div>
          <div style={{fontSize:13,color:"#8ab4cc",lineHeight:1.5}}>{summary}</div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"flex-start",flexShrink:0}}>
          {amount!=null&&(
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"#4a7a96",marginBottom:2}}>SPEND AT RISK</div>
              <div style={{fontSize:16,fontWeight:800,color:c}}>{fmt(amount)}</div>
              {pct!=null&&<div style={{fontSize:10,color:`${c}cc`,marginTop:2,fontWeight:700}}>{fmtPct(pct)} of total</div>}
            </div>
          )}
          {count!=null&&<div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#4a7a96",marginBottom:2}}>INSTANCES</div><div style={{fontSize:16,fontWeight:800,color:"#8ab4cc"}}>{count}</div></div>}
          <div style={{color:"#3a6a86",fontSize:18,marginTop:2}}>{open?"▲":"▼"}</div>
        </div>
      </div>
      {open&&(
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${c}22`}}>
          {detail&&<div style={{fontSize:13,color:"#8ab4cc",lineHeight:1.6,marginBottom:10}}>{detail}</div>}
          {recommendation&&<div style={{background:"rgba(0,196,159,0.07)",border:"1px solid #00C49F33",borderRadius:8,padding:"10px 14px"}}>
            <div style={{fontSize:11,color:"#00C49F",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>💡 Recommended Action</div>
            <div style={{fontSize:13,color:"#a0d8c8",lineHeight:1.5}}>{recommendation}</div>
          </div>}
        </div>
      )}
    </div>
  );
};

// ── Run procurement flags analysis ───────────────────────────────────────────
function computeFlags(rows, mapping) {
  const { amount:aC, nigp:nC, vendor:vC, contract:cC, po:pC, vendor_state:sC, date:dC } = mapping;
  const flags = [];
  const total = rows.reduce((s,r)=>s+r._amt,0);

  // 1. MAVERICK SPEND — no contract coverage
  if (cC) {
    const maverick = rows.filter(r => !r[cC] || String(r[cC]).trim()==="");
    const mAmt = maverick.reduce((s,r)=>s+r._amt,0);
    const mPct = mAmt/total*100;
    if (mPct > 2) {
      flags.push({ severity: mPct>15?"high":mPct>7?"medium":"low",
        title:"Maverick Spend — Purchases Outside Contract Coverage",
        summary:`${mPct.toFixed(1)}% of total spend (${fmtFull(mAmt)}) on ${maverick.length.toLocaleString()} transactions has no master agreement or contract on record.`,
        detail:`Off-contract purchases typically cost 15–25% more than contracted prices and bypass competitive procurement requirements. Review the largest off-contract POs for compliance with your procurement policy thresholds.`,
        recommendation:`Identify the top 20 off-contract vendors by spend. For recurring categories, initiate competitive solicitations. For one-time large purchases, review with legal to confirm exemptions were properly documented.`,
        amount:mAmt, count:maverick.length });
    }
  }

  // 2. PO SPLITTING — same vendor, same date, multiple POs
  if (pC && vC && dC) {
    const grouped = {};
    for (const r of rows) {
      const v=String(r[vC]||"").trim(); const d=String(r[dC]||"").trim();
      if(!v||!d) continue;
      const k=`${v}||${d}`;
      if(!grouped[k]) grouped[k]={vendor:v,date:d,pos:new Set(),amt:0,count:0};
      grouped[k].pos.add(r[pC]); grouped[k].amt+=r._amt; grouped[k].count++;
    }
    const splits = Object.values(grouped).filter(g=>g.pos.size>=3).sort((a,b)=>b.amt-a.amt);
    const splitAmt = splits.reduce((s,g)=>s+g.amt,0);
    if(splits.length>0) {
      const topExamples = splits.slice(0,3).map(g=>`${g.vendor} (${g.pos.size} POs on ${g.date}, ${fmtFull(g.amt)})`).join("; ");
      flags.push({ severity:"high",
        title:"Potential PO Splitting — Multiple POs to Same Vendor on Same Day",
        summary:`${splits.length} instances found where a single vendor received 3+ purchase orders on the same date, totaling ${fmtFull(splitAmt)}.`,
        detail:`PO splitting — intentionally breaking a large purchase into smaller ones — is used to circumvent approval thresholds and competitive bidding requirements. It is a leading indicator of procurement fraud and control bypass. Top instances: ${topExamples}.`,
        recommendation:`Pull full purchase histories for flagged vendors. Compare PO values to your jurisdiction's small purchase and competitive bid thresholds. Escalate repeat offenders to your internal auditor or inspector general.`,
        amount:splitAmt, count:splits.length });
    }
  }

  // 3. SINGLE SOURCE CONCENTRATION by category
  if (vC && nC) {
    const catVendor={}, catTotal={};
    for(const r of rows){
      const {classCode}=resolveNIGP(r[nC]);
      const v=String(r[vC]||"Unknown").trim();
      const k=`${classCode}||${v}`;
      if(!catVendor[k]) catVendor[k]={classCode,vendor:v,amt:0};
      catVendor[k].amt+=r._amt;
      if(!catTotal[classCode]) catTotal[classCode]=0;
      catTotal[classCode]+=r._amt;
    }
    const singles=Object.values(catVendor)
      .filter(x=>catTotal[x.classCode]>=250000 && x.amt/catTotal[x.classCode]>=0.80)
      .map(x=>({...x,pct:x.amt/catTotal[x.classCode]*100,catAmt:catTotal[x.classCode],label:shortLabel(NIGP_CLASS_LOOKUP[x.classCode]||`Class ${x.classCode}`)}))
      .sort((a,b)=>b.catAmt-a.catAmt);
    if(singles.length>0){
      const totalSingle=singles.reduce((s,x)=>s+x.catAmt,0);
      const ex=singles.slice(0,3).map(x=>`${x.label} (${x.vendor}, ${x.pct.toFixed(0)}% share, ${fmtFull(x.catAmt)})`).join("; ");
      flags.push({ severity:singles.length>=5?"high":"medium",
        title:"Single-Source Vendor Concentration — Categories With One Dominant Supplier",
        summary:`${singles.length} spend categories (totaling ${fmtFull(totalSingle)}) have one vendor controlling 80%+ of category spend, creating supply chain and pricing risk.`,
        detail:`Single-source dependency limits price competition and creates operational risk if a vendor fails or terminates. Top examples: ${ex}.`,
        recommendation:`For categories with >$500K single-source spend, initiate market surveys to identify alternative qualified vendors. Add competitive re-bids to your solicitation calendar. Consider multi-award contracts to introduce competitive tension while maintaining supply continuity.`,
        amount:totalSingle, count:singles.length });
    }
  }

  // 4. END-OF-YEAR / FISCAL-YEAR SPENDING SPIKE
  if(dC){
    const monthly={};
    for(const r of rows){
      const raw=String(r[dC]||"");
      const m=raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if(m){
        const mo=m[1].padStart(2,"0"); const yr=m[3].length===2?"20"+m[3]:m[3];
        const k=`${yr}-${mo}`;
        if(!monthly[k]) monthly[k]=0; monthly[k]+=r._amt;
      }
    }
    const months=Object.entries(monthly).sort((a,b)=>a[0].localeCompare(b[0]));
    if(months.length>=4){
      const amts=months.map(([,a])=>a);
      const avg=amts.reduce((s,a)=>s+a,0)/amts.length;
      const spikes=months.filter(([,a])=>a>avg*1.8).map(([mo,a])=>({month:mo,amt:a,ratio:a/avg}));
      if(spikes.length>0){
        const spikeAmt=spikes.reduce((s,sp)=>s+sp.amt,0);
        const spikeDesc=spikes.map(sp=>`${sp.month} (${fmt(sp.amt)}, ${sp.ratio.toFixed(1)}× avg)`).join(", ");
        flags.push({ severity:"medium",
          title:"Abnormal Monthly Spend Spikes — Potential Use-It-or-Lose-It Budgeting",
          summary:`${spikes.length} month${spikes.length>1?"s":""} show spending more than 1.8× the monthly average: ${spikeDesc}.`,
          detail:`End-of-fiscal-year spending surges often indicate "use it or lose it" budget behavior, where departments rush to spend remaining budget before fiscal year close rather than return funds. This typically results in poor vendor selection, inflated pricing, and unnecessary purchases.`,
          recommendation:`Cross-reference spike months against your fiscal year end. Audit the 20 largest purchases during spike months for appropriate vendor selection and competitive process. Consider multi-year budget flexibility policies to reduce year-end dumping incentives.`,
          amount:spikeAmt, count:spikes.length });
      }
    }
  }

  // 5. LONG TAIL VENDOR INEFFICIENCY
  if(vC){
    const vendorSpend={};
    for(const r of rows){ const v=String(r[vC]||"Unknown").trim(); if(!vendorSpend[v]) vendorSpend[v]=0; vendorSpend[v]+=r._amt; }
    const sorted=Object.values(vendorSpend).sort((a,b)=>b-a);
    const n=sorted.length;
    const tail=sorted.slice(Math.floor(n*0.8));
    const tailAmt=tail.reduce((s,a)=>s+a,0);
    const tailPct=tailAmt/total*100;
    const tailCount=tail.length;
    if(tailCount>20 && tailPct>1){
      flags.push({ severity:"low",
        title:"Long-Tail Vendor Sprawl — Administrative Overhead Risk",
        summary:`The bottom 20% of vendors (${tailCount.toLocaleString()} suppliers) account for only ${tailPct.toFixed(1)}% of spend (${fmtFull(tailAmt)}) but generate disproportionate invoice processing, vendor onboarding, and compliance overhead.`,
        detail:`Managing hundreds of small vendors creates significant administrative burden: each requires W-9/tax compliance, insurance verification, vendor registration, and accounts payable processing. Consolidating long-tail spend onto existing contracts or purchasing cards improves efficiency and compliance.`,
        recommendation:`Identify long-tail spend categories with existing master agreements. Route micro-purchases through procurement cards (P-cards) where appropriate. Set a minimum vendor spend threshold (e.g., $500/year) below which purchases must be consolidated or P-carded.`,
        amount:tailAmt, count:tailCount });
    }
  }

  // 6. OUT-OF-STATE VENDOR CONCENTRATION (if state data available)
  if(sC){
    const stateSpend={};
    for(const r of rows){ const s=String(r[sC]||"Unknown").trim().toUpperCase(); if(!stateSpend[s]) stateSpend[s]=0; stateSpend[s]+=r._amt; }
    const localState=Object.entries(stateSpend).sort((a,b)=>b[1]-a[1])[0];
    if(localState){
      const localPct=localState[1]/total*100;
      const outOfState=total-localState[1];
      const outPct=outOfState/total*100;
      if(outPct>40){
        flags.push({ severity:"info",
          title:"Out-of-State Vendor Spend — Review Local Preference Compliance",
          summary:`${outPct.toFixed(1)}% of spend (${fmtFull(outOfState)}) flows to out-of-state vendors. The top vendor state (${localState[0]}) accounts for ${localPct.toFixed(1)}%.`,
          detail:`Many government jurisdictions have local vendor preference policies that require evaluation preference for in-state or in-jurisdiction businesses. High out-of-state spend may indicate these preferences are not being systematically applied, or may reflect valid sole-source / specialized procurement.`,
          recommendation:`Review your jurisdiction's local preference ordinance. Audit the top 10 out-of-state vendor contracts to confirm that local preference evaluation was documented. For upcoming solicitations in categories with high out-of-state concentration, actively market to local vendors.`,
          amount:outOfState, count:null });
      }
    }
  }

  return flags;
}

// ── Vendor concentration analysis ────────────────────────────────────────────
function computeVendorConc(rows, mapping, totalSpend) {
  const { vendor:vC, nigp:nC } = mapping;
  if(!vC) return null;

  // Overall spend by vendor
  const byVendor={};
  for(const r of rows){
    const v=String(r[vC]||"Unknown").trim();
    if(!byVendor[v]) byVendor[v]={name:v,total:0,count:0,categories:new Set()};
    byVendor[v].total+=r._amt; byVendor[v].count++;
    if(nC){ const {classCode}=resolveNIGP(r[nC]); byVendor[v].categories.add(classCode); }
  }
  const vendorArr=Object.values(byVendor)
    .map(v=>({...v,categories:v.categories.size,pct:v.total/totalSpend*100}))
    .sort((a,b)=>b.total-a.total);

  // Herfindahl-Hirschman Index (HHI) — market concentration
  const hhi=vendorArr.reduce((s,v)=>s+(v.pct)*(v.pct),0);

  // Cumulative concentration curve
  let cum=0;
  const cumulativeCurve=vendorArr.map((v,i)=>{ cum+=v.pct; return {rank:i+1,vendor:v.name,pct:v.pct,cumPct:cum}; });

  // Vendor count needed for 50/75/90% of spend
  const v50=cumulativeCurve.find(p=>p.cumPct>=50)?.rank||0;
  const v75=cumulativeCurve.find(p=>p.cumPct>=75)?.rank||0;
  const v90=cumulativeCurve.find(p=>p.cumPct>=90)?.rank||0;

  // Category dominance — single vendor >80% per category
  const catVendor={}, catTotal={};
  if(nC){
    for(const r of rows){
      const {classCode}=resolveNIGP(r[nC]);
      const v=String(r[vC]||"Unknown").trim();
      const k=`${classCode}||${v}`;
      if(!catVendor[k]) catVendor[k]={classCode,label:shortLabel(NIGP_CLASS_LOOKUP[classCode]||`Class ${classCode}`),vendor:v,amt:0};
      catVendor[k].amt+=r._amt;
      if(!catTotal[classCode]) catTotal[classCode]=0;
      catTotal[classCode]+=r._amt;
    }
  }
  const catDominance=Object.values(catVendor)
    .filter(x=>catTotal[x.classCode]>=100000)
    .map(x=>({...x,pct:x.amt/catTotal[x.classCode]*100,catAmt:catTotal[x.classCode]}))
    .sort((a,b)=>b.catAmt-a.catAmt)
    .filter(x=>x.pct>=70)
    .slice(0,20);

  return { vendorArr, cumulativeCurve, hhi, v50, v75, v90, catDominance };
}

// ── File store ────────────────────────────────────────────────────────────────
const fileStore={current:null};

// ═════════════════════════════════════════════════════════════════════════════
export default function NIGPAnalyzer() {
  const [stage,      setStage]      = useState("upload");
  const [columns,    setColumns]    = useState([]);
  const [fileName,   setFileName]   = useState("");
  const [mapping,    setMapping]    = useState({});
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [dragOver,   setDragOver]   = useState(false);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef();

  // ── Local Spend state ─────────────────────────────────────────────────────
  const [localViewBy,    setLocalViewBy]    = useState("city");
  const [localSelected,  setLocalSelected]  = useState("");
  const [localThreshold, setLocalThreshold] = useState("");
  const [localApplied,   setLocalApplied]   = useState(null);

  const processFile = useCallback(file => {
    if(!file) return;
    setLoading(true); setError(""); setFileName(file.name); fileStore.current=file;
    Papa.parse(file,{ header:true, skipEmptyLines:true, preview:5,
      complete:results=>{
        const cols=Object.keys(results.data[0]||{});
        if(!cols.length){setError("No columns found.");setLoading(false);return;}
        setColumns(cols); setMapping(autoDetect(cols)); setStage("map"); setLoading(false);
      },
      error:e=>{setError("Parse error: "+e.message);setLoading(false);}
    });
  },[]);

  const runAnalysis = useCallback(()=>{
    if(!mapping.amount){setError("Please assign the Spend Amount column.");return;}
    if(!mapping.nigp)  {setError("Please assign the NIGP Code column.");return;}
    setLoading(true); setError("");
    Papa.parse(fileStore.current,{ header:true, skipEmptyLines:true,
      complete:results=>{
        try{
          const {amount:aC,nigp:nC,vendor:vC,contract:cC,po:pC,department:dC,vendor_state:sC,vendor_city:cityC,date:dtC}=mapping;
          const rows=[]; const byClass={},byVendor={},byDept={},byMonth={};
          let total=0,txCount=0,skipped=0,unrecognized=0;
          const dirtyRows=[];  // rows needing NIGP cleanup

          const allRows = results.data || [];
          for(const row of allRows){
            const amt=parseAmt(row[aC]);
            if(isNaN(amt)||amt<=0){skipped++;continue;}
            row._amt=amt; rows.push(row);
            const rawCode=row[nC];
            const {classCode,label}=resolveNIGP(rawCode);
            // Classify the dirtiness type
            const isMissing = !rawCode || String(rawCode).trim()==='' || String(rawCode).trim()==='0';
            const isPlaceholder = !isMissing && String(rawCode).replace(/\D/g,'').length < 3;
            const isUnrecognized = !isMissing && !isPlaceholder && label.startsWith("Unrecognized");
            if(isMissing||isPlaceholder||isUnrecognized){
              unrecognized++;
              dirtyRows.push({
                rawCode: isMissing ? '(blank)' : String(rawCode).trim(),
                classCode,
                issue: isMissing ? 'Missing Code' : isPlaceholder ? 'Code Too Short' : 'Unrecognized Class',
                description: row[nC && mapping.description] || row['COMMODITY_DESCRIPTION'] || '',
                vendor: vC ? (String(row[vC]||'').trim()||'Unknown') : '',
                amount: amt,
                po: mapping.po ? String(row[mapping.po]||'').trim() : '',
                date: dtC ? String(row[dtC]||'').trim() : '',
                rawRow: row,
              });
            }
            const key=`${classCode}|${label}`;
            if(!byClass[key]) byClass[key]={label,displayLabel:shortLabel(label),classCode,total:0,count:0};
            byClass[key].total+=amt; byClass[key].count++;
            if(vC&&row[vC]){const v=String(row[vC]).trim()||"Unknown"; if(!byVendor[v])byVendor[v]={name:v,total:0,count:0}; byVendor[v].total+=amt; byVendor[v].count++;}
            if(dC&&row[dC]){const d=String(row[dC]).trim()||"Unknown"; if(!byDept[d])byDept[d]={name:d,total:0,count:0}; byDept[d].total+=amt; byDept[d].count++;}
            if(dtC&&row[dtC]){const m=String(row[dtC]).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/); if(m){const mo=m[1].padStart(2,"0"),yr=m[3].length===2?"20"+m[3]:m[3],k=`${yr}-${mo}`; if(!byMonth[k])byMonth[k]={month:k,total:0,count:0}; byMonth[k].total+=amt; byMonth[k].count++;}}
            total+=amt; txCount++;
          }

          const classArr=Object.values(byClass).sort((a,b)=>b.total-a.total);
          const vendorArr=Object.values(byVendor).sort((a,b)=>b.total-a.total);
          const deptArr=Object.values(byDept).sort((a,b)=>b.total-a.total);
          const monthArr=Object.values(byMonth).sort((a,b)=>a.month.localeCompare(b.month));

          const flags=computeFlags(rows,mapping);
          const vendorConc=computeVendorConc(rows,mapping,total);

          // Unique city / state values for Local Spend dropdowns
          const cityValues = cityC
            ? [...new Set(rows.map(r=>String(r[cityC]||"").trim()).filter(Boolean))].sort()
            : [];
          const stateValues = sC
            ? [...new Set(rows.map(r=>String(r[sC]||"").trim().toUpperCase()).filter(Boolean))].sort()
            : [];

          setData({classArr,vendorArr,deptArr,monthArr,totalSpend:total,txCount,skipped,unrecognized,
            hasVendor:!!mapping.vendor&&vendorArr.length>0,
            hasDept:!!mapping.department&&deptArr.length>0,
            hasDate:monthArr.length>0,
            hasContract:!!mapping.contract,
            rowCount:(results.data||[]).length,
            flags, vendorConc, dirtyRows,
            rows, cityValues, stateValues,
            hasCityField:!!cityC, hasStateField:!!sC});
          setActiveTab("overview"); setStage("analyze");
        }catch(e){setError(e.message);}
        setLoading(false);
      },
      error:e=>{setError("Parse error: "+e.message);setLoading(false);}
    });
  },[mapping]);

  const top15C  = useMemo(()=>data?.classArr.slice(0,15)||[],[data]);
  const top15V  = useMemo(()=>data?.vendorArr.slice(0,15)||[],[data]);
  const pieData = useMemo(()=>{
    if(!data) return [];
    const top=data.classArr.slice(0,9); const other=data.classArr.slice(9).reduce((s,x)=>s+x.total,0);
    const r=top.map(x=>({name:x.displayLabel,value:x.total}));
    if(other>0) r.push({name:"All Other",value:other}); return r;
  },[data]);
  const treemapData=useMemo(()=>data?.classArr.slice(0,30).map(x=>({name:x.displayLabel,size:x.total,value:x.total}))||[],[data]);
  const filtered=useMemo(()=>{ if(!data) return []; const q=searchTerm.toLowerCase(); return data.classArr.filter(x=>x.label.toLowerCase().includes(q)||x.classCode.includes(q)); },[data,searchTerm]);

  const highFlags=(data?.flags||[]).filter(f=>f.severity==="high").length;
  const dirtyCount=data?.dirtyRows?.length||0;
  const tabs=!data?[]:[
    {id:"overview",   label:"Overview"},
    {id:"flags",      label:`⚠ Concerns${highFlags>0?` (${highFlags})`:""}`, alert:highFlags>0},
    {id:"concentration", label:"Vendor Risk"},
    {id:"categories", label:"Categories"},
    {id:"treemap",    label:"Treemap"},
    ...(data.hasVendor?[{id:"vendors",label:"Vendors"}]:[]),
    ...(data.hasDept ?[{id:"departments",label:"Departments"}]:[]),
    ...(data.hasDate ?[{id:"timeline",label:"Timeline"}]:[]),
    {id:"table",label:"Full Table"},
    ...(dirtyCount>0?[{id:"cleanup",label:`🧹 Data Cleanup (${dirtyCount})`,alert:true,alertColor:"#FFA726"}]:[]),
    {id:"localspend",label:"📍 Local Spend"},
  ];

  const Header = ()=>(
    <div style={{background:"linear-gradient(135deg,#0a1929 0%,#0d2137 50%,#091520 100%)",borderBottom:"1px solid #1a3548",padding:"20px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
          <div style={{width:34,height:34,borderRadius:8,background:"linear-gradient(135deg,#00C49F,#0088FE)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:"#fff"}}>N</div>
          <span style={{fontSize:20,fontWeight:800,color:"#e8f4ff",letterSpacing:"-0.5px"}}>NIGP Spend Analyzer</span>
        </div>
        <div style={{fontSize:12,color:"#5a8aaa"}}>Government Procurement Intelligence · NIGP 18th Edition · {Object.keys(NIGP_CLASS_LOOKUP).length} official class codes</div>
      </div>
      {stage!=="upload"&&<div style={{display:"flex",gap:8}}>
        {stage==="analyze"&&<button onClick={()=>setStage("map")} style={{background:"transparent",border:"1px solid #1e3a4a",color:"#7aafc9",borderRadius:8,padding:"7px 15px",cursor:"pointer",fontSize:13}}>✏ Edit Mapping</button>}
        <button onClick={()=>{setStage("upload");setData(null);setError("");}} style={{background:"transparent",border:"1px solid #1e3a4a",color:"#7aafc9",borderRadius:8,padding:"7px 15px",cursor:"pointer",fontSize:13}}>↑ New File</button>
      </div>}
    </div>
  );

  if(loading) return <div style={{minHeight:"100vh",background:"#080f18",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#c8dcea"}}><Header/><div style={{textAlign:"center",padding:"120px 0",color:"#5a8aaa"}}><div style={{fontSize:40,marginBottom:16}}>⚙️</div><div style={{fontSize:18,fontWeight:600}}>Analyzing spend data…</div><div style={{fontSize:13,marginTop:8,color:"#3a6a86"}}>Matching codes against NIGP 18th Edition &amp; running procurement health checks</div></div></div>;

  // ── UPLOAD ──────────────────────────────────────────────────────────────────
  if(stage==="upload") return (
    <div style={{minHeight:"100vh",background:"#080f18",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#c8dcea"}}>
      <Header/>
      <div style={{maxWidth:680,margin:"60px auto 0",padding:"0 24px"}}>
        <div onClick={()=>inputRef.current.click()} onDrop={e=>{e.preventDefault();setDragOver(false);processFile(e.dataTransfer.files[0]);}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          style={{border:`2px dashed ${dragOver?"#00C49F":"#1e3a4a"}`,borderRadius:16,padding:"60px 40px",textAlign:"center",cursor:"pointer",background:dragOver?"rgba(0,196,159,0.04)":"#0a1729",transition:"all 0.2s"}}>
          <div style={{fontSize:48,marginBottom:16}}>📊</div>
          <div style={{fontSize:20,fontWeight:700,color:"#d0e8f5",marginBottom:8}}>Drop your government spend CSV</div>
          <div style={{fontSize:14,color:"#4a7a96",marginBottom:24}}>NIGP 18th Edition lookup · Procurement health analysis · Vendor risk scoring</div>
          <div style={{display:"inline-block",background:"linear-gradient(135deg,#00C49F,#0088FE)",color:"#fff",borderRadius:10,padding:"12px 28px",fontWeight:700,fontSize:15}}>Choose CSV File</div>
          <input ref={inputRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>processFile(e.target.files[0])}/>
        </div>
        {error&&<div style={{marginTop:16,background:"rgba(239,83,80,0.1)",border:"1px solid #ef535044",borderRadius:10,padding:"12px 16px",color:"#ff8a80",fontSize:14}}>⚠ {error}</div>}
      </div>
    </div>
  );

  // ── MAP ─────────────────────────────────────────────────────────────────────
  if(stage==="map") return (
    <div style={{minHeight:"100vh",background:"#080f18",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#c8dcea"}}>
      <Header/>
      <div style={{maxWidth:820,margin:"36px auto",padding:"0 24px"}}>
        <div style={{marginBottom:22}}><div style={{fontSize:20,fontWeight:800,color:"#d0e8f5",marginBottom:5}}>Confirm Column Mapping</div><div style={{fontSize:14,color:"#4a7a96"}}>Found <strong style={{color:"#8ab4cc"}}>{columns.length} columns</strong> in <strong style={{color:"#8ab4cc"}}>{fileName}</strong>. Map PO # and Contract # to unlock the procurement health checks.</div></div>
        <div style={{display:"grid",gap:10}}>
          {Object.entries(FIELD_DEFS).map(([field,def])=>{
            const val=mapping[field]||"";
            return(
              <div key={field} style={{background:"#0a1729",borderRadius:12,padding:"13px 18px",border:`1px solid ${val?def.color+"44":"#1a3040"}`,display:"grid",gridTemplateColumns:"1fr 1.3fr",gap:16,alignItems:"center"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                    <span style={{fontSize:14,fontWeight:700,color:"#d0e8f5"}}>{def.label}</span>
                    {def.required&&<span style={{fontSize:10,background:"rgba(0,196,159,0.15)",color:"#00C49F",borderRadius:4,padding:"1px 6px",fontWeight:700}}>REQUIRED</span>}
                  </div>
                  <div style={{fontSize:12,color:"#4a7a96"}}>{def.hint}</div>
                </div>
                <div>
                  <select value={val} onChange={e=>setMapping(m=>({...m,[field]:e.target.value}))} style={{width:"100%",background:"#0d1e2e",border:`1px solid ${val?def.color+"66":"#1e3a4a"}`,borderRadius:8,padding:"9px 12px",color:val?"#d0e8f5":"#5a8aaa",fontSize:13,cursor:"pointer",outline:"none"}}>
                    <option value="">— Skip this field —</option>
                    {columns.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  {val&&<div style={{fontSize:11,color:def.color,marginTop:4}}>✓ {val}</div>}
                </div>
              </div>
            );
          })}
        </div>
        {error&&<div style={{marginTop:14,background:"rgba(239,83,80,0.1)",border:"1px solid #ef535044",borderRadius:10,padding:"12px 16px",color:"#ff8a80",fontSize:14}}>⚠ {error}</div>}
        <div style={{display:"flex",gap:12,marginTop:20}}>
          <button onClick={()=>setStage("upload")} style={{background:"transparent",border:"1px solid #1e3a4a",color:"#7aafc9",borderRadius:10,padding:"12px 24px",cursor:"pointer",fontSize:14}}>← Back</button>
          <button onClick={runAnalysis} style={{flex:1,background:"linear-gradient(135deg,#00C49F,#0088FE)",border:"none",color:"#fff",borderRadius:10,padding:"12px 24px",cursor:"pointer",fontSize:15,fontWeight:700}}>Run Analysis →</button>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD ───────────────────────────────────────────────────────────────
  const vc=data.vendorConc;
  return (
    <div style={{minHeight:"100vh",background:"#080f18",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#c8dcea"}}>
      <Header/>
      <div style={{padding:"22px 32px",maxWidth:1400,margin:"0 auto"}}>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:22}}>
          {[
            {label:"Total Spend",     value:fmtFull(data.totalSpend), accent:"#00C49F"},
            {label:"Transactions",    value:data.txCount.toLocaleString(), accent:"#0088FE"},
            {label:"NIGP Classes",    value:data.classArr.length, accent:"#FFBB28"},
            ...(data.hasVendor?[{label:"Unique Vendors",value:data.vendorArr.length.toLocaleString(),accent:"#FF8042"}]:[]),
            {label:"Health Flags",    value:data.flags.length, accent:data.flags.filter(f=>f.severity==="high").length>0?"#EF5350":"#FFA726"},
            ...(vc?[{label:"Vendor HHI",value:vc.hhi.toFixed(0),accent:vc.hhi>2500?"#EF5350":vc.hhi>1500?"#FFA726":"#00C49F"}]:[]),
            ...(data.classArr.length>0?[{label:"Top Category %",value:fmtPct(data.classArr[0].total/data.totalSpend*100),sub:data.classArr[0].displayLabel,accent:"#A45CFF"}]:[]),
            ...(data.hasVendor&&data.vendorArr.length>0?[{label:"Top Vendor %",value:fmtPct(data.vendorArr[0].total/data.totalSpend*100),sub:data.vendorArr[0].name.length>22?data.vendorArr[0].name.slice(0,21)+"…":data.vendorArr[0].name,accent:"#29B6F6"}]:[]),
          ].map(s=>(
            <div key={s.label} style={{background:"#0a1729",borderRadius:12,padding:"13px 16px",border:"1px solid #1a3040"}}>
              <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>{s.label}</div>
              <div style={{fontSize:20,fontWeight:800,color:s.accent}}>{s.value}</div>
              {s.sub&&<div style={{fontSize:10,color:"#3a6a86",marginTop:3,lineHeight:1.3}}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>
          {tabs.map(t=>{
            const ac=t.alertColor||"#EF5350";
            return(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",transition:"all 0.15s",
                background:activeTab===t.id?t.alert?`${ac}22`:"linear-gradient(135deg,#00C49F22,#0088FE22)":"transparent",
                borderColor:activeTab===t.id?t.alert?ac:"#00C49F":"#1e3a4a",
                color:activeTab===t.id?t.alert?ac:"#00C49F":"#5a8aaa"}}>
              {t.label}
            </button>
            );
          })}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab==="overview"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {data.flags.length>0&&(
              <div style={{gridColumn:"1/-1",background:"rgba(239,83,80,0.06)",border:"1px solid #EF535033",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:28}}>⚠️</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#e8f4ff",marginBottom:3}}>{data.flags.filter(f=>f.severity==="high").length} high-priority procurement concerns detected</div>
                  <div style={{fontSize:13,color:"#8ab4cc"}}>
                    {data.flags.map(f=>`${FLAG_ICONS[f.severity]} ${f.title.split("—")[0].trim()}`).join(" · ")}
                    {" "}<button onClick={()=>setActiveTab("flags")} style={{background:"none",border:"none",color:"#EF5350",cursor:"pointer",fontSize:13,fontWeight:700,padding:0}}>View all →</button>
                  </div>
                </div>
              </div>
            )}
            <Card title="Top 15 NIGP Classes by Spend" subtitle="NIGP 18th Edition official descriptions">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={top15C.map(x=>({...x,label:x.displayLabel,_pct:x.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:70,top:5,bottom:5}}>
                  <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="label" width={155} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip total={data.totalSpend}/>}/>
                  <Bar dataKey="total" radius={[0,5,5,0]}
                    label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>}>
                    {top15C.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.9}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Spend Distribution" subtitle="Share of total by NIGP class">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="46%" outerRadius={140} dataKey="value" nameKey="name" label={({percent})=>percent>0.04?`${(percent*100).toFixed(0)}%`:""} labelLine={{stroke:"#1e3a4a"}}>
                    {pieData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} stroke="#0a1729" strokeWidth={2}/>)}
                  </Pie>
                  <Tooltip content={<Tip/>}/>
                  <Legend formatter={v=><span style={{color:"#8ab4cc",fontSize:10}}>{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── FLAGS / CONCERNS ── */}
        {activeTab==="flags"&&(
          <div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:18,fontWeight:800,color:"#e8f4ff",marginBottom:6}}>Procurement Health Review</div>
              <div style={{fontSize:13,color:"#5a8aaa"}}>
                {data.flags.length} concern{data.flags.length!==1?"s":""} detected · {data.flags.filter(f=>f.severity==="high").length} high · {data.flags.filter(f=>f.severity==="medium").length} medium · {data.flags.filter(f=>f.severity==="low").length} low · {data.flags.filter(f=>f.severity==="info").length} informational.
                {" "}Click any item to expand details and recommended actions.
              </div>
            </div>

            {/* % of total spend at risk summary */}
            {data.flags.filter(f=>f.amount!=null).length>0&&(()=>{
              const totalAtRisk=data.flags.reduce((s,f)=>s+(f.amount||0),0);
              const pctAtRisk=totalAtRisk/data.totalSpend*100;
              return(
                <div style={{background:"rgba(239,83,80,0.06)",border:"1px solid #EF535033",borderRadius:12,padding:"14px 18px",marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#e8f4ff"}}>Total Spend Flagged Across All Concerns</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                      <span style={{fontSize:22,fontWeight:800,color:"#EF5350"}}>{fmtPct(pctAtRisk)}</span>
                      <span style={{fontSize:13,color:"#8ab4cc"}}>of total spend · {fmt(totalAtRisk)}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {["high","medium","low"].map(sev=>{
                      const grp=data.flags.filter(f=>f.severity===sev&&f.amount!=null);
                      if(!grp.length) return null;
                      const sevAmt=grp.reduce((s,f)=>s+(f.amount||0),0);
                      const sevPct=sevAmt/data.totalSpend*100;
                      const c=FLAG_COLORS[sev];
                      return(
                        <div key={sev} style={{background:`${c}12`,border:`1px solid ${c}33`,borderRadius:8,padding:"7px 14px",display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:13}}>{FLAG_ICONS[sev]}</span>
                          <div>
                            <div style={{fontSize:14,fontWeight:800,color:c}}>{fmtPct(sevPct)}</div>
                            <div style={{fontSize:10,color:"#5a8aaa",textTransform:"capitalize"}}>{sev} priority · {fmt(sevAmt)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{marginTop:10,height:6,borderRadius:3,background:"#0d1e2e",overflow:"hidden",display:"flex"}}>
                    {["high","medium","low"].map(sev=>{
                      const grp=data.flags.filter(f=>f.severity===sev&&f.amount!=null);
                      const sevAmt=grp.reduce((s,f)=>s+(f.amount||0),0);
                      const w=totalAtRisk>0?(sevAmt/totalAtRisk*100):0;
                      return w>0?<div key={sev} style={{height:"100%",background:FLAG_COLORS[sev],width:`${w}%`}}/>:null;
                    })}
                  </div>
                </div>
              );
            })()}

            {data.flags.length===0&&(
              <div style={{background:"rgba(0,196,159,0.07)",border:"1px solid #00C49F33",borderRadius:12,padding:"40px",textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:12}}>✅</div>
                <div style={{fontSize:16,fontWeight:700,color:"#00C49F",marginBottom:6}}>No significant procurement concerns detected</div>
                <div style={{fontSize:13,color:"#5a8aaa"}}>Map Contract #, PO #, Vendor State, and Date columns for deeper analysis.</div>
              </div>
            )}

            {["high","medium","low","info"].map(sev=>{
              const grp=data.flags.filter(f=>f.severity===sev);
              if(!grp.length) return null;
              const labels={high:"🔴 High Priority",medium:"🟠 Medium Priority",low:"🟡 Low Priority",info:"🔵 Informational"};
              return(
                <div key={sev} style={{marginBottom:24}}>
                  <div style={{fontSize:13,fontWeight:700,color:FLAG_COLORS[sev],marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{labels[sev]}</div>
                  {grp.map((f,i)=><FlagCard key={i} {...f} totalSpend={data.totalSpend}/>)}
                </div>
              );
            })}

            <div style={{background:"#0a1729",border:"1px solid #1a3040",borderRadius:12,padding:"16px 20px",marginTop:8}}>
              <div style={{fontSize:12,color:"#4a7a96",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>ℹ Analysis Methodology</div>
              <div style={{fontSize:12,color:"#3a6a86",lineHeight:1.7}}>
                Maverick spend: transactions with no contract/MA number. · PO splitting: 3+ POs same vendor same calendar date. · Single source: one vendor ≥80% of category spend where category ≥$250K. · Spending spikes: months ≥1.8× average monthly spend. · Long-tail: bottom 20% of vendors by spend. · Out-of-state: requires Vendor State column mapping.
              </div>
            </div>
          </div>
        )}

        {/* ── VENDOR CONCENTRATION ── */}
        {activeTab==="concentration"&&vc&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {/* HHI score card */}
            <div style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[
                {label:"Herfindahl-Hirschman Index",value:vc.hhi.toFixed(0),sub:vc.hhi>2500?"Highly Concentrated":vc.hhi>1500?"Moderately Concentrated":"Competitive",accent:vc.hhi>2500?"#EF5350":vc.hhi>1500?"#FFA726":"#00C49F"},
                {label:"Vendors for 50% of Spend",value:vc.v50,sub:"higher = more diverse",accent:"#0088FE"},
                {label:"Vendors for 75% of Spend",value:vc.v75,sub:"higher = more diverse",accent:"#FFBB28"},
                {label:"Vendors for 90% of Spend",value:vc.v90,sub:`of ${data.vendorArr.length} total vendors`,accent:"#FF8042"},
              ].map(s=>(
                <div key={s.label} style={{background:"#0a1729",borderRadius:12,padding:"14px 16px",border:"1px solid #1a3040"}}>
                  <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{s.label}</div>
                  <div style={{fontSize:24,fontWeight:800,color:s.accent,marginBottom:2}}>{s.value}</div>
                  <div style={{fontSize:11,color:"#3a6a86"}}>{s.sub}</div>
                </div>
              ))}
            </div>

            <Card title="Top 15 Vendors by Spend" subtitle="Click bar to see share of total">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={top15V.map(v=>({...v,_pct:v.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:70,top:5,bottom:5}}>
                  <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={185} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip total={data.totalSpend}/>}/>
                  <Bar dataKey="total" radius={[0,5,5,0]}
                    label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>}>
                    {top15V.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Spend Concentration Curve" subtitle="How many vendors account for cumulative % of spend">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={vc.cumulativeCurve.slice(0,Math.min(50,vc.cumulativeCurve.length))} margin={{left:10,right:20,top:10,bottom:20}}>
                  <XAxis dataKey="rank" label={{value:"Vendor Rank",position:"insideBottom",fill:"#4a7a96",fontSize:11,offset:-5}} tick={{fill:"#4a7a96",fontSize:10}}/>
                  <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v,n)=>[`${v.toFixed(1)}%`,"Cumulative Spend"]} labelFormatter={l=>`Vendor #${l}`}/>
                  <ReferenceLine y={50} stroke="#00C49F44" strokeDasharray="4 4" label={{value:"50%",fill:"#00C49F",fontSize:11}}/>
                  <ReferenceLine y={80} stroke="#FFA72644" strokeDasharray="4 4" label={{value:"80%",fill:"#FFA726",fontSize:11}}/>
                  <Line type="monotone" dataKey="cumPct" stroke="#0088FE" strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {vc.catDominance.length>0&&(
              <Card title="Category Dominance — Single Vendor ≥70% Share" subtitle="Categories where one supplier controls most spend" span2>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead><tr>{["NIGP Class","Category","Dominant Vendor","Vendor Spend","Category Total","Share"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#4a7a96",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #1a3040"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {vc.catDominance.map((row,i)=>{
                        const risk=row.pct>=95?"#EF5350":row.pct>=85?"#FFA726":"#FFBB28";
                        return(
                          <tr key={i} style={{borderBottom:"1px solid #101e2e"}} onMouseOver={e=>e.currentTarget.style.background="#0d1e2e"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                            <td style={{padding:"9px 12px"}}><span style={{background:"#0d1e2e",borderRadius:5,padding:"2px 8px",fontSize:11,color:"#5a9aaa",border:"1px solid #1e3a4a",fontWeight:700}}>{row.classCode}</span></td>
                            <td style={{padding:"9px 12px",color:"#c8dcea",fontWeight:500,maxWidth:220}}>{row.label}</td>
                            <td style={{padding:"9px 12px",color:"#8ab4cc"}}>{row.vendor.length>35?row.vendor.slice(0,34)+"…":row.vendor}</td>
                            <td style={{padding:"9px 12px",color:"#00C49F",fontWeight:700,whiteSpace:"nowrap"}}>{fmtFull(row.amt)}</td>
                            <td style={{padding:"9px 12px",color:"#8ab4cc",whiteSpace:"nowrap"}}>{fmtFull(row.catAmt)}</td>
                            <td style={{padding:"9px 12px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{height:5,borderRadius:3,background:"#0d1e2e",width:60,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:risk,width:`${row.pct}%`}}/></div>
                                <span style={{color:risk,fontWeight:700,fontSize:12}}>{row.pct.toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {activeTab==="categories"&&(
          <Card title="All NIGP Classes — Full Spend Breakdown" subtitle={`${data.classArr.length} classes matched · NIGP 18th Edition · % of total shown on each row`} span2>
            <ResponsiveContainer width="100%" height={Math.max(500,data.classArr.length*26)}>
              <BarChart data={data.classArr.map(x=>({...x,label:x.displayLabel,_pct:x.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:5,bottom:5}}>
                <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="label" width={160} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip total={data.totalSpend}/>}/>
                <Bar dataKey="total" radius={[0,5,5,0]}
                  label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>}>
                  {data.classArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* ── TREEMAP ── */}
        {activeTab==="treemap"&&(
          <Card title="Spend Treemap" subtitle="Area proportional to dollar volume · top 30 NIGP classes · % of total spend shown in each tile" span2>
            {(()=>{ _treemapTotal = data.totalSpend; return null; })()}
            <ResponsiveContainer width="100%" height={540}>
              <Treemap data={treemapData} dataKey="size" aspectRatio={16/9} content={<TreeCell/>}
                onClick={()=>{}}
              >
                <Tooltip formatter={(v,n,p)=>{
                  const pct=(v/data.totalSpend*100).toFixed(1);
                  return [`${fmtFull(v)} · ${pct}% of total`,p.payload?.name||n];
                }}/>
              </Treemap>
            </ResponsiveContainer>
            {/* Top-5 % summary strip below treemap */}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16,paddingTop:14,borderTop:"1px solid #1a3040"}}>
              {treemapData.slice(0,5).map((d,i)=>{
                const pct=(d.value/data.totalSpend*100);
                return(
                  <div key={d.name} style={{flex:1,minWidth:110,background:"#0d1e2e",borderRadius:8,padding:"8px 12px",border:`1px solid ${PALETTE[i%PALETTE.length]}33`}}>
                    <div style={{fontSize:9,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3,lineHeight:1.3}}>{d.name.length>26?d.name.slice(0,25)+"…":d.name}</div>
                    <div style={{fontSize:16,fontWeight:800,color:PALETTE[i%PALETTE.length]}}>{fmtPct(pct)}</div>
                    <div style={{fontSize:10,color:"#3a6a86"}}>{fmt(d.value)}</div>
                  </div>
                );
              })}
              <div style={{flex:1,minWidth:110,background:"#0d1e2e",borderRadius:8,padding:"8px 12px",border:"1px solid #1e3a4a"}}>
                <div style={{fontSize:9,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>All Other Classes</div>
                <div style={{fontSize:16,fontWeight:800,color:"#78909C"}}>{fmtPct(treemapData.slice(5).reduce((s,d)=>s+d.value,0)/data.totalSpend*100)}</div>
                <div style={{fontSize:10,color:"#3a6a86"}}>{fmt(treemapData.slice(5).reduce((s,d)=>s+d.value,0))}</div>
              </div>
            </div>
          </Card>
        )}

        {/* ── VENDORS ── */}
        {activeTab==="vendors"&&data.hasVendor&&(
          <Card title="Top 15 Vendors by Spend" subtitle={`Total payment / contract value · % of $${(data.totalSpend/1e6).toFixed(1)}M total spend`} span2>
            <ResponsiveContainer width="100%" height={440}>
              <BarChart data={top15V.map(v=>({...v,_pct:v.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:5,bottom:5}}>
                <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" width={200} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip total={data.totalSpend}/>}/>
                <Bar dataKey="total" radius={[0,5,5,0]}
                  label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>}>
                  {top15V.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* % share summary row */}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16,paddingTop:14,borderTop:"1px solid #1a3040"}}>
              {[1,3,5,10].filter(n=>top15V.length>=n).map(n=>{
                const pct = top15V.slice(0,n).reduce((s,v)=>s+v.total,0)/data.totalSpend*100;
                return(
                  <div key={n} style={{background:"#0d1e2e",borderRadius:8,padding:"7px 14px",border:"1px solid #1e3a4a",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Top {n} Vendor{n>1?"s":""}</div>
                    <div style={{fontSize:16,fontWeight:800,color:"#29B6F6"}}>{fmtPct(pct)}</div>
                    <div style={{fontSize:10,color:"#3a6a86",marginTop:1}}>of total spend</div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── DEPARTMENTS ── */}
        {activeTab==="departments"&&data.hasDept&&(
          <Card title="Spend by Department" subtitle="Total allocated spend per agency / division · % of total shown on bars" span2>
            <ResponsiveContainer width="100%" height={Math.max(430,data.deptArr.length*28)}>
              <BarChart data={data.deptArr.map(d=>({...d,_pct:d.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:5,bottom:5}}>
                <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" width={180} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip total={data.totalSpend}/>}/>
                <Bar dataKey="total" radius={[0,5,5,0]}
                  label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>}>
                  {data.deptArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {data.deptArr.length>1&&(
              <div style={{display:"flex",gap:8,marginTop:14,paddingTop:14,borderTop:"1px solid #1a3040",flexWrap:"wrap"}}>
                {data.deptArr.slice(0,5).map((d,i)=>{
                  const pct=d.total/data.totalSpend*100;
                  return(
                    <div key={d.name} style={{flex:1,minWidth:100,background:"#0d1e2e",borderRadius:8,padding:"8px 12px",border:`1px solid ${PALETTE[i%PALETTE.length]}33`}}>
                      <div style={{fontSize:9,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3,lineHeight:1.3}}>{d.name.length>24?d.name.slice(0,23)+"…":d.name}</div>
                      <div style={{fontSize:15,fontWeight:800,color:PALETTE[i%PALETTE.length]}}>{fmtPct(pct)}</div>
                      <div style={{fontSize:10,color:"#3a6a86"}}>{fmt(d.total)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ── TIMELINE ── */}
        {activeTab==="timeline"&&data.hasDate&&(
          <Card title="Monthly Spend" subtitle="Total procurement spend by month · hover for % of annual total" span2>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={data.monthArr.map(m=>({...m,_pct:m.total/data.totalSpend*100}))} margin={{left:10,right:20,top:5,bottom:20}}>
                <XAxis dataKey="month" tick={{fill:"#8ab4cc",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip total={data.totalSpend}/>}/>
                <ReferenceLine y={data.totalSpend/data.monthArr.length} stroke="#00C49F55" strokeDasharray="4 4"
                  label={{value:`Avg ${fmt(data.totalSpend/data.monthArr.length)}`,position:"insideTopRight",fill:"#00C49F",fontSize:10}}/>
                <Bar dataKey="total" radius={[5,5,0,0]}>{data.monthArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Monthly % breakdown strip */}
            {data.monthArr.length>1&&(
              <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid #1a3040"}}>
                <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>Monthly Share of Total Spend</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {data.monthArr.map((m,i)=>{
                    const pct=m.total/data.totalSpend*100;
                    const avg=data.totalSpend/data.monthArr.length;
                    const aboveAvg=m.total>avg*1.3;
                    const color=aboveAvg?"#EF5350":PALETTE[i%PALETTE.length];
                    return(
                      <div key={m.month} style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:56,fontSize:11,color:"#5a8aaa",flexShrink:0,textAlign:"right"}}>{m.month}</div>
                        <div style={{flex:1,height:6,borderRadius:3,background:"#0d1e2e",overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:3,background:color,width:`${Math.min(100,pct*4)}%`,transition:"width 0.3s"}}/>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,minWidth:120}}>
                          <span style={{fontSize:11,fontWeight:700,color:color,minWidth:40}}>{fmtPct(pct)}</span>
                          <span style={{fontSize:10,color:"#3a6a86"}}>{fmt(m.total)}</span>
                          {aboveAvg&&<span style={{fontSize:9,background:"#EF535022",color:"#EF5350",borderRadius:3,padding:"1px 5px",border:"1px solid #EF535044",fontWeight:700}}>↑ spike</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── TABLE ── */}
        {activeTab==="table"&&(
          <Card title="Full NIGP Class Table" subtitle="All classes · official 18th Edition descriptions" span2>
            <input placeholder="Search class name or 3-digit code…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
              style={{width:"100%",boxSizing:"border-box",marginBottom:14,background:"#0d1e2e",border:"1px solid #1e3a4a",borderRadius:8,padding:"9px 14px",color:"#c8dcea",fontSize:13,outline:"none"}}/>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr>{["#","Class","NIGP Class Description","Total Spend","% of Spend","Txns","% of Txns","Avg / Txn"].map(h=><th key={h} style={{textAlign:h==="#"||h==="Class"?"center":"left",padding:"10px 12px",color:"#4a7a96",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #1a3040",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map(row=>{
                    const rank=data.classArr.indexOf(row)+1;
                    const spendPct=row.total/data.totalSpend*100;
                    const txnPct=row.count/data.txCount*100;
                    return(
                      <tr key={row.classCode+row.label} style={{borderBottom:"1px solid #101e2e"}} onMouseOver={e=>e.currentTarget.style.background="#0d1e2e"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{textAlign:"center",padding:"9px 12px",color:"#3a6a86"}}>{rank}</td>
                        <td style={{textAlign:"center",padding:"9px 12px"}}><span style={{background:"#0d1e2e",borderRadius:5,padding:"2px 8px",fontSize:12,color:"#5a9aaa",border:"1px solid #1e3a4a",fontWeight:700}}>{row.classCode}</span></td>
                        <td style={{padding:"9px 12px",color:"#c8dcea",fontWeight:500,maxWidth:300}}>{toTC(row.label)}</td>
                        <td style={{padding:"9px 12px",color:"#00C49F",fontWeight:700,whiteSpace:"nowrap"}}>{fmtFull(row.total)}</td>
                        <td style={{padding:"9px 12px",minWidth:130}}>
                          <PctBar pct={spendPct} color={PALETTE[rank%PALETTE.length]} width={70}/>
                        </td>
                        <td style={{padding:"9px 12px",color:"#8ab4cc"}}>{row.count.toLocaleString()}</td>
                        <td style={{padding:"9px 12px",minWidth:100}}>
                          <PctBar pct={txnPct} color="#4a7a96" width={55}/>
                        </td>
                        <td style={{padding:"9px 12px",color:"#8ab4cc",whiteSpace:"nowrap"}}>{fmtFull(row.total/row.count)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── DATA CLEANUP ── */}
        {activeTab==="cleanup"&&(
          <div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:18,fontWeight:800,color:"#e8f4ff",marginBottom:6}}>Data Quality — NIGP Code Cleanup</div>
              {(()=>{
                const dirtyAmt=data.dirtyRows.reduce((s,r)=>s+r.amount,0);
                const dirtySpendPct=dirtyAmt/data.totalSpend*100;
                const dirtyTxnPct=data.dirtyRows.length/data.txCount*100;
                return(
                  <div>
                    <div style={{fontSize:13,color:"#5a8aaa",lineHeight:1.7,marginBottom:10}}>
                      {data.dirtyRows.length.toLocaleString()} transactions ({fmtFull(dirtyAmt)} spend) could not be fully classified due to missing, malformed, or unrecognized NIGP codes.
                      {" "}These rows are still included in your spend totals but appear as "Unrecognized Class" in charts. Correcting these codes will improve the accuracy of all analysis.
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <div style={{background:"rgba(255,187,40,0.08)",border:"1px solid #FFBB2833",borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:10}}>
                        <div>
                          <div style={{fontSize:10,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>Spend Affected</div>
                          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                            <span style={{fontSize:18,fontWeight:800,color:"#FFBB28"}}>{fmtPct(dirtySpendPct)}</span>
                            <span style={{fontSize:11,color:"#5a8aaa"}}>{fmt(dirtyAmt)}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{background:"rgba(255,187,40,0.08)",border:"1px solid #FFBB2833",borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:10}}>
                        <div>
                          <div style={{fontSize:10,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>Transactions Affected</div>
                          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                            <span style={{fontSize:18,fontWeight:800,color:"#FFBB28"}}>{fmtPct(dirtyTxnPct)}</span>
                            <span style={{fontSize:11,color:"#5a8aaa"}}>{data.dirtyRows.length.toLocaleString()} txns</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Summary by issue type */}
            {(()=>{
              const byIssue={};
              for(const r of data.dirtyRows){
                if(!byIssue[r.issue]) byIssue[r.issue]={count:0,amount:0};
                byIssue[r.issue].count++; byIssue[r.issue].amount+=r.amount;
              }
              const issueColors={"Missing Code":"#EF5350","Code Too Short":"#FFA726","Unrecognized Class":"#FFBB28"};
              const issueIcons={"Missing Code":"❌","Code Too Short":"✂️","Unrecognized Class":"❓"};
              const issueDesc={
                "Missing Code":"No NIGP code was recorded for this transaction. Likely a data entry gap at time of PO creation.",
                "Code Too Short":"The code has fewer than 3 digits and can't be matched to a NIGP class. May be a truncation error.",
                "Unrecognized Class":"The 3-digit class extracted from this code doesn't exist in the NIGP 18th Edition. Could be a newer edition code, a typo, or a local custom code."
              };
              return(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,marginBottom:24}}>
                  {Object.entries(byIssue).map(([issue,stats])=>{
                    const spendPct=stats.amount/data.totalSpend*100;
                    const txnPct=stats.count/data.txCount*100;
                    const c=issueColors[issue]||"#8ab4cc";
                    return(
                    <div key={issue} style={{background:"#0a1729",borderRadius:12,padding:"16px 18px",border:`1px solid ${c}33`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <span style={{fontSize:18}}>{issueIcons[issue]||"⚠"}</span>
                        <span style={{fontSize:14,fontWeight:700,color:c}}>{issue}</span>
                      </div>
                      <div style={{fontSize:22,fontWeight:800,color:"#e8f4ff",marginBottom:2}}>
                        {stats.count.toLocaleString()} <span style={{fontSize:14,color:"#4a7a96",fontWeight:400}}>transactions</span>
                        <span style={{marginLeft:8,fontSize:12,fontWeight:700,color:`${c}cc`,background:`${c}15`,border:`1px solid ${c}33`,borderRadius:4,padding:"1px 7px"}}>{fmtPct(txnPct)} of txns</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:15,fontWeight:700,color:"#00C49F"}}>{fmtFull(stats.amount)}</span>
                        <span style={{fontSize:12,fontWeight:700,color:"#00C49Fcc",background:"rgba(0,196,159,0.1)",border:"1px solid #00C49F33",borderRadius:4,padding:"1px 7px"}}>{fmtPct(spendPct)} of spend</span>
                      </div>
                      <PctBar pct={spendPct} color={c} width={100}/>
                      <div style={{fontSize:12,color:"#4a7a96",lineHeight:1.5,marginTop:8}}>{issueDesc[issue]||""}</div>
                    </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Group by raw code for unrecognized — shows what codes need remapping */}
            {(()=>{
              const unrecRows=data.dirtyRows.filter(r=>r.issue==="Unrecognized Class");
              if(!unrecRows.length) return null;
              const byCode={};
              for(const r of unrecRows){
                if(!byCode[r.rawCode]) byCode[r.rawCode]={rawCode:r.rawCode,classCode:r.classCode,count:0,amount:0,descriptions:new Set(),vendors:new Set()};
                byCode[r.rawCode].count++; byCode[r.rawCode].amount+=r.amount;
                if(r.description) byCode[r.rawCode].descriptions.add(String(r.description).slice(0,60));
                if(r.vendor) byCode[r.rawCode].vendors.add(r.vendor);
              }
              const codeArr=Object.values(byCode)
                .map(x=>({...x,descriptions:[...x.descriptions].slice(0,2).join("; "),vendors:x.vendors.size}))
                .sort((a,b)=>b.amount-a.amount);
              const dirtyTotal=unrecRows.reduce((s,r)=>s+r.amount,0);
              return(
                <div style={{background:"#0a1729",borderRadius:14,padding:"20px 22px",border:"1px solid #1a3040",marginBottom:20}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#d0e8f5",marginBottom:4}}>Unrecognized Class Codes — Grouped by Code</div>
                  <div style={{fontSize:12,color:"#4a7a96",marginBottom:14}}>These class codes (first 3 digits of your NIGP field) don't match any entry in the NIGP 18th Edition. They may be valid codes from a newer edition or local extensions.</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead><tr>
                        {["Raw Code","Extracted Class","Transactions","Spend","% of Dirty","Sample Descriptions","Unique Vendors","Suggested Action"].map(h=>(
                          <th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#4a7a96",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #1a3040",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {codeArr.map((row,i)=>{
                          const cls=row.classCode;
                          const nearby=Object.keys(NIGP_CLASS_LOOKUP).filter(k=>Math.abs(parseInt(k)-parseInt(cls))<=5).slice(0,2);
                          const suggestion=nearby.length?`Check class ${nearby.join(" or ")}: ${nearby.map(k=>shortLabel(NIGP_CLASS_LOOKUP[k],30)).join(" / ")}`:"Verify with NIGP current edition";
                          const rowPct=dirtyTotal>0?row.amount/dirtyTotal*100:0;
                          return(
                            <tr key={i} style={{borderBottom:"1px solid #101e2e"}} onMouseOver={e=>e.currentTarget.style.background="#0d1e2e"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                              <td style={{padding:"9px 12px"}}><span style={{background:"#0d1e2e",borderRadius:5,padding:"2px 8px",fontSize:12,color:"#FFBB28",border:"1px solid #FFBB2844",fontWeight:700}}>{row.rawCode}</span></td>
                              <td style={{padding:"9px 12px"}}><span style={{background:"#0d1e2e",borderRadius:5,padding:"2px 8px",fontSize:12,color:"#5a9aaa",border:"1px solid #1e3a4a",fontWeight:700}}>{row.classCode}</span></td>
                              <td style={{padding:"9px 12px",color:"#8ab4cc"}}>{row.count.toLocaleString()}</td>
                              <td style={{padding:"9px 12px",color:"#00C49F",fontWeight:700,whiteSpace:"nowrap"}}>{fmtFull(row.amount)}</td>
                              <td style={{padding:"9px 12px",minWidth:110}}><PctBar pct={rowPct} color="#FFBB28" width={55}/></td>
                              <td style={{padding:"9px 12px",color:"#8ab4cc",maxWidth:220,fontSize:12}}>{row.descriptions||"—"}</td>
                              <td style={{padding:"9px 12px",color:"#8ab4cc",textAlign:"center"}}>{row.vendors}</td>
                              <td style={{padding:"9px 12px",color:"#4a7a96",fontSize:11,maxWidth:200}}>{suggestion}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Full dirty row table */}
            <div style={{background:"#0a1729",borderRadius:14,padding:"20px 22px",border:"1px solid #1a3040"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#d0e8f5",marginBottom:4}}>All Transactions Needing Cleanup</div>
              <div style={{fontSize:12,color:"#4a7a96",marginBottom:14}}>Export or share this list with your purchasing teams to correct NIGP codes at the source.</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr>
                    {["Issue","Raw Code","Item Description","Vendor",mapping.po?"PO Number":"",mapping.date?"Date":"","Spend","% of Total"].filter(Boolean).map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#4a7a96",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #1a3040",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {data.dirtyRows.slice(0,200).map((row,i)=>{
                      const issueColor={"Missing Code":"#EF5350","Code Too Short":"#FFA726","Unrecognized Class":"#FFBB28"}[row.issue]||"#8ab4cc";
                      const rowPct=row.amount/data.totalSpend*100;
                      return(
                        <tr key={i} style={{borderBottom:"1px solid #101e2e"}} onMouseOver={e=>e.currentTarget.style.background="#0d1e2e"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{padding:"9px 12px"}}><span style={{background:`${issueColor}15`,borderRadius:5,padding:"2px 8px",fontSize:11,color:issueColor,border:`1px solid ${issueColor}44`,whiteSpace:"nowrap"}}>{row.issue}</span></td>
                          <td style={{padding:"9px 12px"}}><span style={{background:"#0d1e2e",borderRadius:5,padding:"2px 7px",fontSize:11,color:"#FFBB28",border:"1px solid #FFBB2833",fontWeight:700}}>{row.rawCode}</span></td>
                          <td style={{padding:"9px 12px",color:"#c8dcea",maxWidth:260,fontSize:12}}>{String(row.description||"—").slice(0,70)}{row.description?.length>70?"…":""}</td>
                          <td style={{padding:"9px 12px",color:"#8ab4cc",maxWidth:180,fontSize:12}}>{String(row.vendor||"—").slice(0,40)}{row.vendor?.length>40?"…":""}</td>
                          {mapping.po&&<td style={{padding:"9px 12px",color:"#5a8aaa",fontSize:11}}>{row.po||"—"}</td>}
                          {mapping.date&&<td style={{padding:"9px 12px",color:"#5a8aaa",fontSize:11,whiteSpace:"nowrap"}}>{row.date||"—"}</td>}
                          <td style={{padding:"9px 12px",color:"#00C49F",fontWeight:700,whiteSpace:"nowrap"}}>{fmtFull(row.amount)}</td>
                          <td style={{padding:"9px 12px",minWidth:90}}><PctBar pct={rowPct} color={issueColor} width={50}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {data.dirtyRows.length>200&&<div style={{textAlign:"center",padding:"14px",fontSize:12,color:"#3a6a86"}}>Showing first 200 of {data.dirtyRows.length.toLocaleString()} rows</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── LOCAL SPEND ── */}
        {activeTab==="localspend"&&(()=>{
          const cityC = mapping.vendor_city;
          const stateC = mapping.vendor_state;
          const hasCity = !!cityC && data.cityValues.length > 0;
          const hasState = !!stateC && data.stateValues.length > 0;

          // Dropdown options based on viewBy
          const dropdownOptions = localViewBy==="city" ? data.cityValues : data.stateValues;

          // Compute local spend analytics when applied
          const ls = localApplied ? (()=>{
            const {viewBy, value, threshold} = localApplied;
            const fieldCol = viewBy==="city" ? cityC : stateC;
            if (!fieldCol) return null;

            const localRows=[], nonLocalRows=[];
            for (const r of data.rows) {
              const v = String(r[fieldCol]||"").trim();
              const match = viewBy==="state" ? v.toUpperCase()===value.toUpperCase() : v.toLowerCase()===value.toLowerCase();
              if (match) localRows.push(r); else nonLocalRows.push(r);
            }
            const localTotal = localRows.reduce((s,r)=>s+r._amt,0);
            const nonLocalTotal = nonLocalRows.reduce((s,r)=>s+r._amt,0);
            const localPct = data.totalSpend>0 ? localTotal/data.totalSpend*100 : 0;
            const nonLocalPct = 100-localPct;
            const localVendors = new Set(localRows.map(r=>mapping.vendor?String(r[mapping.vendor]||"").trim():"").filter(Boolean));
            const nonLocalVendors = new Set(nonLocalRows.map(r=>mapping.vendor?String(r[mapping.vendor]||"").trim():"").filter(Boolean));

            // By NIGP category
            const catMap={};
            for (const r of data.rows) {
              const {classCode,label} = resolveNIGP(r[mapping.nigp]);
              const key=`${classCode}|${label}`;
              if (!catMap[key]) catMap[key]={classCode,label:shortLabel(label),fullLabel:label,localAmt:0,nonLocalAmt:0,total:0};
              const v = String(r[fieldCol]||"").trim();
              const isLocal = viewBy==="state" ? v.toUpperCase()===value.toUpperCase() : v.toLowerCase()===value.toLowerCase();
              catMap[key].total+=r._amt;
              if (isLocal) catMap[key].localAmt+=r._amt; else catMap[key].nonLocalAmt+=r._amt;
            }
            const catArr = Object.values(catMap).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
            const catWithLocal = catArr.filter(c=>c.localAmt>0).length;

            // Top local vendors
            const localVendorMap={};
            for (const r of localRows) {
              if (!mapping.vendor) continue;
              const v = String(r[mapping.vendor]||"").trim()||"Unknown";
              if (!localVendorMap[v]) localVendorMap[v]={name:v,total:0,count:0};
              localVendorMap[v].total+=r._amt; localVendorMap[v].count++;
            }
            const topLocalVendors = Object.values(localVendorMap).sort((a,b)=>b.total-a.total).slice(0,10);

            const belowThreshold = threshold!==null && localPct < threshold;
            const gapAmt = threshold!==null ? Math.max(0,(threshold/100)*data.totalSpend - localTotal) : 0;

            // Lowest local % categories (opportunity)
            const catByLocalPct = catArr.filter(c=>c.total>=10000).map(c=>({...c,localPct:c.localAmt/c.total*100})).sort((a,b)=>a.localPct-b.localPct);

            return {localRows,nonLocalRows,localTotal,nonLocalTotal,localPct,nonLocalPct,
              localVendors:localVendors.size, nonLocalVendors:nonLocalVendors.size,
              localTxns:localRows.length, nonLocalTxns:nonLocalRows.length,
              catArr, catByLocalPct, topLocalVendors, catWithLocal,
              avgLocalVendor: localVendors.size>0 ? localTotal/localVendors.size : 0,
              avgNonLocalVendor: nonLocalVendors.size>0 ? nonLocalTotal/nonLocalVendors.size : 0,
              belowThreshold, gapAmt, threshold, value};
          })() : null;

          // pill color by pct
          const pctPillColor = (pct) => pct>=33?"#66BB6A":pct>=15?"#FFA726":"#EF5350";

          return (
            <div>
              {/* ── FILTER BAR ── */}
              <div style={{background:"#0a1729",border:"1px solid #1a3040",borderRadius:14,padding:"20px 24px",marginBottom:20}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:"#d0e8f5",marginBottom:3}}>Local Spend Analysis</div>
                    <div style={{fontSize:12,color:"#4a7a96"}}>Choose whether to analyze local spend by vendor city or vendor state, then select a value from your uploaded data.</div>
                  </div>
                  {localApplied&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginTop:4,flexWrap:"wrap"}}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(102,187,106,0.12)",border:"1px solid #66BB6A44",borderRadius:8,padding:"5px 12px",fontSize:12,color:"#66BB6A",fontWeight:700}}>
                        📍 {localApplied.value} · {localApplied.viewBy==="city"?"City":"State"} view
                      </span>
                      {localApplied.threshold!==null&&<span style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,167,38,0.1)",border:"1px solid #FFA72644",borderRadius:8,padding:"5px 12px",fontSize:12,color:"#FFA726",fontWeight:700}}>
                        ⚠ {localApplied.threshold}% threshold
                      </span>}
                    </div>
                  )}
                </div>

                <div style={{borderTop:"1px solid #111e2e",paddingTop:16,display:"flex",alignItems:"flex-end",gap:20,flexWrap:"wrap"}}>
                  {/* View By toggle */}
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>View By</div>
                    <div style={{display:"flex",background:"#0d1e2e",borderRadius:9,border:"1px solid #1a3040",overflow:"hidden",width:"fit-content"}}>
                      {[{val:"city",label:"Vendor City",avail:hasCity},{val:"state",label:"Vendor State",avail:hasState}].map(opt=>(
                        <button key={opt.val} onClick={()=>{if(opt.avail){setLocalViewBy(opt.val);setLocalSelected("");}}}
                          title={!opt.avail?"This field was not mapped in your data":""}
                          style={{padding:"9px 22px",fontSize:13,fontWeight:700,cursor:opt.avail?"pointer":"not-allowed",border:"none",fontFamily:"inherit",transition:"all 0.15s",opacity:opt.avail?1:0.35,
                            background:localViewBy===opt.val&&opt.avail?"rgba(102,187,106,0.15)":"transparent",
                            color:localViewBy===opt.val&&opt.avail?"#66BB6A":"#4a7a96"}}>
                          {opt.val==="city"?"🏙":"🗺"} {opt.label}
                        </button>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:"#3a6a86"}}>
                      {localViewBy==="city"?(hasCity?"Populated from Vendor City field":"⚠ Vendor City not mapped — add it in Edit Mapping"):(hasState?"Populated from Vendor State field":"⚠ Vendor State not mapped — add it in Edit Mapping")}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{color:"#1e3a4a",fontSize:20,marginBottom:18}}>→</div>

                  {/* Value dropdown */}
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>
                      Select Local {localViewBy==="city"?"City":"State"}
                    </div>
                    <select value={localSelected} onChange={e=>setLocalSelected(e.target.value)}
                      disabled={dropdownOptions.length===0}
                      style={{background:"#0d1e2e",border:"1px solid #2a4a5a",borderRadius:8,padding:"9px 14px",color:localSelected?"#d0e8f5":"#5a8aaa",fontSize:13,fontFamily:"inherit",cursor:"pointer",outline:"none",minWidth:220}}>
                      <option value="">— Choose a {localViewBy==="city"?"city":"state"} —</option>
                      {dropdownOptions.map(v=><option key={v} value={v}>{v}</option>)}
                    </select>
                    <div style={{fontSize:11,color:"#3a6a86"}}>Only values from your uploaded data are shown</div>
                  </div>

                  {/* Arrow */}
                  <div style={{color:"#1e3a4a",fontSize:20,marginBottom:18}}>→</div>

                  {/* Threshold */}
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>
                      Flag Threshold <span style={{color:"#3a6a86",fontWeight:400,fontSize:10,textTransform:"none"}}>(optional)</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <input type="number" min="0" max="100" value={localThreshold} onChange={e=>setLocalThreshold(e.target.value)} placeholder="—"
                        style={{background:"#0d1e2e",border:"1px solid #2a4a5a",borderRadius:8,padding:"9px 12px",color:"#d0e8f5",fontSize:13,fontFamily:"inherit",width:72,outline:"none",textAlign:"center"}}/>
                      <span style={{fontSize:13,color:"#8ab4cc"}}>% minimum local spend</span>
                    </div>
                    <div style={{fontSize:11,color:"#3a6a86",maxWidth:200,lineHeight:1.4}}>Leave blank to skip. A warning appears if local % falls below this.</div>
                  </div>

                  {/* Actions */}
                  <div style={{display:"flex",gap:8,alignItems:"flex-end",marginLeft:"auto"}}>
                    <button onClick={()=>{setLocalSelected("");setLocalThreshold("");setLocalApplied(null);setLocalViewBy("city");}}
                      style={{background:"transparent",border:"1px solid #1e3a4a",color:"#5a8aaa",borderRadius:8,padding:"9px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Reset</button>
                    <button onClick={()=>{
                      if(!localSelected){return;}
                      const t=localThreshold!==""?parseFloat(localThreshold):null;
                      setLocalApplied({viewBy:localViewBy,value:localSelected,threshold:isNaN(t)?null:t});
                    }} disabled={!localSelected}
                      style={{background:localSelected?"linear-gradient(135deg,#66BB6A,#29B6F6)":"#1a3040",border:"none",color:localSelected?"#fff":"#3a6a86",borderRadius:8,padding:"9px 22px",fontSize:13,fontWeight:700,cursor:localSelected?"pointer":"not-allowed",fontFamily:"inherit"}}>
                      Apply →
                    </button>
                  </div>
                </div>
              </div>

              {/* ── NO SELECTION STATE ── */}
              {!localApplied&&(
                <div style={{background:"rgba(102,187,106,0.05)",border:"1px solid #66BB6A22",borderRadius:14,padding:"60px 40px",textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:14}}>📍</div>
                  <div style={{fontSize:17,fontWeight:700,color:"#d0e8f5",marginBottom:8}}>Select a local area to begin</div>
                  <div style={{fontSize:13,color:"#4a7a96",maxWidth:420,margin:"0 auto",lineHeight:1.7}}>
                    Choose "Vendor City" or "Vendor State" above, select a value from your data, then click Apply to see the full local vs. non-local spend breakdown.
                  </div>
                  {!hasCity&&!hasState&&(
                    <div style={{marginTop:20,background:"rgba(255,167,38,0.08)",border:"1px solid #FFA72633",borderRadius:10,padding:"12px 20px",fontSize:13,color:"#FFA726",maxWidth:440,margin:"20px auto 0"}}>
                      ⚠ Neither Vendor City nor Vendor State was mapped. Go to <strong>Edit Mapping</strong> to assign those columns.
                    </div>
                  )}
                </div>
              )}

              {/* ── RESULTS ── */}
              {ls&&(
                <div>
                  {/* Threshold alert */}
                  {ls.belowThreshold&&(
                    <div style={{background:"rgba(255,167,38,0.07)",border:"1px solid #FFA72633",borderRadius:12,padding:"14px 20px",display:"flex",alignItems:"flex-start",gap:12,marginBottom:20}}>
                      <div style={{fontSize:22,marginTop:1}}>⚠️</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#FFD54F",marginBottom:4}}>Local Spend Below Threshold — {ls.localPct.toFixed(1)}% vs. {ls.threshold}% target</div>
                        <div style={{fontSize:13,color:"#8ab4cc",lineHeight:1.6}}>
                          Local vendor spend is <strong style={{color:"#ffe082"}}>{ls.localPct.toFixed(1)}%</strong> of total —{" "}
                          <strong style={{color:"#FFA726"}}>{(ls.threshold-ls.localPct).toFixed(1)} pts</strong> below your {ls.threshold}% threshold.
                          Closing this gap would require routing an additional <strong style={{color:"#ffe082"}}>{fmtFull(ls.gapAmt)}</strong> to local vendors.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KPI cards */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
                    {[
                      {label:"Local Spend",val:fmtFull(ls.localTotal),accent:"#66BB6A",pill:`${ls.localPct.toFixed(1)}% of total`,pillColor:"#66BB6A",sub:`${ls.localVendors} vendors · ${ls.localTxns.toLocaleString()} txns`,topColor:"#66BB6A"},
                      {label:"Non-Local Spend",val:fmtFull(ls.nonLocalTotal),accent:"#EF5350",pill:`${ls.nonLocalPct.toFixed(1)}% of total`,pillColor:"#EF5350",sub:`${ls.nonLocalVendors} vendors · ${ls.nonLocalTxns.toLocaleString()} txns`,topColor:"#EF5350"},
                      {label:"Categories w/ Local Vendors",val:ls.catWithLocal,accent:"#FFBB28",pill:`of ${ls.catArr.length} total classes`,pillColor:"#FFBB28",sub:`${(ls.catWithLocal/ls.catArr.length*100).toFixed(0)}% coverage`,topColor:"#FFBB28"},
                      {label:"Avg Spend per Local Vendor",val:fmt(ls.avgLocalVendor),accent:"#FFA726",pill:null,sub:`vs. ${fmt(ls.avgNonLocalVendor)} non-local avg`,topColor:"#FFA726"},
                    ].map(k=>(
                      <div key={k.label} style={{background:"#0a1729",border:"1px solid #1a3040",borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${k.topColor},${k.topColor}88)`}}/>
                        <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,fontWeight:600}}>{k.label}</div>
                        <div style={{fontSize:26,fontWeight:800,color:k.accent,marginBottom:5}}>{k.val}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          {k.pill&&<span style={{display:"inline-flex",alignItems:"center",background:`${k.pillColor}22`,border:`1px solid ${k.pillColor}44`,borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:700,color:k.pillColor}}>{k.pill}</span>}
                          <span style={{fontSize:12,color:"#5a8aaa"}}>{k.sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Donut + Stacked bars */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>

                    {/* Donut */}
                    <div style={{background:"#0a1729",borderRadius:14,padding:"20px 22px",border:"1px solid #1a3040"}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#d0e8f5",marginBottom:3}}>Local vs. Non-Local Spend</div>
                      <div style={{fontSize:12,color:"#4a7a96",marginBottom:14}}>Overall split · Currently viewing: <strong style={{color:"#66BB6A"}}>{ls.value}</strong></div>
                      <div style={{display:"flex",alignItems:"center",gap:24}}>
                        {/* Donut SVG */}
                        {(()=>{
                          const r=62, cx=80, cy=80, stroke=28;
                          const circ=2*Math.PI*r;
                          const localDash=circ*(ls.localPct/100);
                          const nonLocalDash=circ*(ls.nonLocalPct/100);
                          return(
                            <svg width="160" height="160" viewBox="0 0 160 160" style={{flexShrink:0}}>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0d1e2e" strokeWidth={stroke}/>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EF5350" strokeWidth={stroke}
                                strokeDasharray={`${nonLocalDash} ${circ}`} strokeDashoffset={0}
                                transform={`rotate(-90 ${cx} ${cy})`} opacity={0.8}/>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#66BB6A" strokeWidth={stroke}
                                strokeDasharray={`${localDash} ${circ}`} strokeDashoffset={-nonLocalDash}
                                transform={`rotate(-90 ${cx} ${cy})`} opacity={0.9}/>
                              <text x={cx} y={cy-8} textAnchor="middle" fill="#d0e8f5" fontSize="18" fontWeight="800" fontFamily="DM Sans,sans-serif">{ls.localPct.toFixed(1)}%</text>
                              <text x={cx} y={cy+10} textAnchor="middle" fill="#5a8aaa" fontSize="10" fontFamily="DM Sans,sans-serif">Local</text>
                            </svg>
                          );
                        })()}
                        <div style={{display:"flex",flexDirection:"column",gap:12,flex:1}}>
                          {[
                            {label:"Local",val:fmtFull(ls.localTotal),pct:ls.localPct,color:"#66BB6A"},
                            {label:"Non-Local",val:fmtFull(ls.nonLocalTotal),pct:ls.nonLocalPct,color:"#EF5350"},
                          ].map(leg=>(
                            <div key={leg.label} style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:10,height:10,borderRadius:"50%",background:leg.color,flexShrink:0}}/>
                              <div style={{fontSize:13,color:"#8ab4cc",flex:1}}>{leg.label}</div>
                              <div style={{fontSize:13,fontWeight:700,color:"#d0e8f5"}}>{leg.val}</div>
                              <div style={{fontSize:11,color:"#4a7a96",minWidth:38,textAlign:"right"}}>{leg.pct.toFixed(1)}%</div>
                            </div>
                          ))}
                          <div style={{borderTop:"1px solid #111e2e",paddingTop:10,marginTop:2}}>
                            <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Transactions</div>
                            {[
                              {label:"Local",val:ls.localTxns.toLocaleString(),pct:ls.localTxns/(ls.localTxns+ls.nonLocalTxns)*100,color:"#66BB6A"},
                              {label:"Non-Local",val:ls.nonLocalTxns.toLocaleString(),pct:ls.nonLocalTxns/(ls.localTxns+ls.nonLocalTxns)*100,color:"#EF5350"},
                            ].map(leg=>(
                              <div key={leg.label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                                <div style={{width:8,height:8,borderRadius:"50%",background:leg.color,flexShrink:0}}/>
                                <div style={{fontSize:12,color:"#8ab4cc",flex:1}}>{leg.label}</div>
                                <div style={{fontSize:12,fontWeight:700,color:"#d0e8f5"}}>{leg.val}</div>
                                <div style={{fontSize:11,color:"#4a7a96",minWidth:38,textAlign:"right"}}>{leg.pct.toFixed(1)}%</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stacked bars by NIGP category */}
                    <div style={{background:"#0a1729",borderRadius:14,padding:"20px 22px",border:"1px solid #1a3040"}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#d0e8f5",marginBottom:3}}>Local vs. Non-Local by NIGP Category</div>
                      <div style={{fontSize:12,color:"#4a7a96",marginBottom:14}}>Top 10 spend categories — <span style={{color:"#66BB6A"}}>■ local</span> <span style={{color:"#EF5350",opacity:0.7}}>■ non-local</span></div>
                      {ls.catArr.slice(0,10).map((cat,i)=>{
                        const lp = cat.total>0?cat.localAmt/cat.total*100:0;
                        const nlp = 100-lp;
                        return(
                          <div key={cat.classCode+i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                            <div style={{fontSize:12,color:"#8ab4cc",width:175,flexShrink:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={cat.fullLabel}>{cat.label}</div>
                            <div style={{flex:1,height:18,borderRadius:4,overflow:"hidden",display:"flex"}}>
                              {lp>0&&<div style={{width:`${lp}%`,background:"#66BB6A",opacity:0.85,height:"100%"}}/>}
                              {nlp>0&&<div style={{width:`${nlp}%`,background:"#EF5350",opacity:0.4,height:"100%"}}/>}
                            </div>
                            <div style={{fontSize:12,fontWeight:700,color:"#d0e8f5",minWidth:58,textAlign:"right"}}>{fmt(cat.total)}</div>
                          </div>
                        );
                      })}
                      <div style={{display:"flex",gap:16,marginTop:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#8ab4cc"}}><div style={{width:10,height:10,borderRadius:2,background:"#66BB6A"}}/>Local</div>
                        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#8ab4cc"}}><div style={{width:10,height:10,borderRadius:2,background:"#EF5350",opacity:0.55}}/>Non-Local</div>
                      </div>
                    </div>
                  </div>

                  {/* Top local vendors + category table */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>

                    {/* Top local vendors */}
                    <div style={{background:"#0a1729",borderRadius:14,padding:"20px 22px",border:"1px solid #1a3040"}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#d0e8f5",marginBottom:3}}>Top Local Vendors</div>
                      <div style={{fontSize:12,color:"#4a7a96",marginBottom:14}}>Highest spend among local vendors · <strong style={{color:"#66BB6A"}}>{ls.value}</strong></div>
                      {mapping.vendor ? (
                        ls.topLocalVendors.length>0 ? ls.topLocalVendors.map((v,i)=>{
                          const pct=ls.localTotal>0?v.total/ls.localTotal*100:0;
                          const maxAmt=ls.topLocalVendors[0].total;
                          return(
                            <div key={v.name} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                              <div style={{fontSize:12,color:"#8ab4cc",width:165,flexShrink:0,lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={v.name}>{v.name}</div>
                              <div style={{flex:1,height:7,background:"#0d1e2e",borderRadius:4,overflow:"hidden"}}>
                                <div style={{height:"100%",borderRadius:4,background:"#66BB6A",opacity:0.85-i*0.06,width:`${maxAmt>0?v.total/maxAmt*100:0}%`,transition:"width 0.3s"}}/>
                              </div>
                              <div style={{fontSize:12,fontWeight:700,color:"#d0e8f5",minWidth:56,textAlign:"right"}}>{fmt(v.total)}</div>
                              <div style={{fontSize:11,color:"#4a7a96",minWidth:36,textAlign:"right"}}>{pct.toFixed(1)}%</div>
                            </div>
                          );
                        }) : <div style={{fontSize:13,color:"#4a7a96",padding:"20px 0",textAlign:"center"}}>No local vendors found for this selection.</div>
                      ) : <div style={{fontSize:13,color:"#4a7a96",padding:"20px 0",textAlign:"center"}}>Map the Vendor Name column to see top local vendors.</div>}
                    </div>

                    {/* Category breakdown table */}
                    <div style={{background:"#0a1729",borderRadius:14,padding:"20px 22px",border:"1px solid #1a3040"}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#d0e8f5",marginBottom:3}}>Local % by NIGP Category</div>
                      <div style={{fontSize:12,color:"#4a7a96",marginBottom:14}}>Sorted by local % ascending — lowest local share at top</div>
                      <div style={{overflowX:"auto",maxHeight:340,overflowY:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                          <thead style={{position:"sticky",top:0,background:"#0a1729"}}>
                            <tr>{["NIGP Category","Total","Local $","Local %"].map(h=>(
                              <th key={h} style={{textAlign:h==="Total"||h==="Local $"?"right":h==="Local %"?"center":"left",padding:"9px 12px",color:"#4a7a96",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #1a3040",whiteSpace:"nowrap"}}>{h}</th>
                            ))}</tr>
                          </thead>
                          <tbody>
                            {ls.catByLocalPct.map((cat,i)=>{
                              const lp=cat.localPct;
                              const pillColor=pctPillColor(lp);
                              return(
                                <tr key={cat.classCode+i} style={{borderBottom:"1px solid #111e2e"}} onMouseOver={e=>e.currentTarget.style.background="#0d1e2e"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                                  <td style={{padding:"9px 12px",color:"#c8dcea",maxWidth:200}} title={cat.fullLabel}>{cat.label}</td>
                                  <td style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:"#d0e8f5",whiteSpace:"nowrap"}}>{fmt(cat.total)}</td>
                                  <td style={{padding:"9px 12px",textAlign:"right",fontWeight:600,color:"#66BB6A",whiteSpace:"nowrap"}}>{fmt(cat.localAmt)}</td>
                                  <td style={{padding:"9px 12px",textAlign:"center"}}>
                                    <span style={{display:"inline-flex",alignItems:"center",background:`${pillColor}22`,border:`1px solid ${pillColor}44`,borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:700,color:pillColor}}>{lp.toFixed(0)}%</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Insight panel */}
                  {(()=>{
                    const lowest3=ls.catByLocalPct.filter(c=>c.localPct<20&&c.total>=50000).slice(0,3);
                    if(!lowest3.length) return null;
                    return(
                      <div style={{background:"rgba(102,187,106,0.07)",border:"1px solid #66BB6A33",borderRadius:12,padding:"16px 22px",display:"flex",alignItems:"flex-start",gap:14,marginBottom:20}}>
                        <div style={{fontSize:24,marginTop:2}}>💡</div>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:"#e8f4ff",marginBottom:5}}>Local Spend Insight</div>
                          <div style={{fontSize:13,color:"#8ab4cc",lineHeight:1.65}}>
                            <strong style={{color:"#a5d6a7"}}>{ls.localPct.toFixed(1)}%</strong> of total spend flows to local vendors ({fmtFull(ls.localTotal)} across {ls.localVendors} vendors).
                            {lowest3.length>0&&<> The lowest local penetration is in{" "}
                              {lowest3.map((c,i)=>(
                                <span key={c.classCode}>{i>0&&(i===lowest3.length-1?" and ":", ")}<strong style={{color:"#a5d6a7"}}>{c.label}</strong> ({c.localPct.toFixed(0)}%)</span>
                              ))}.
                              {" "}If your jurisdiction has a local preference policy, these categories represent the strongest outreach opportunities.
                            </>}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Future features note */}
                  <div style={{background:"#0a1729",border:"1px dashed #1a3040",borderRadius:10,padding:"12px 18px",fontSize:12,color:"#3a6a86",lineHeight:1.7}}>
                    <strong style={{color:"#4a7a96"}}>📋 Future Features:</strong>{" "}
                    Cascading city → state filter · Export local spend summary to CSV · Year-over-year local spend trend · Department-level local spend breakdown
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <div style={{marginTop:14,fontSize:12,color:"#2a4a5a",textAlign:"center"}}>
          {fileName} · {data.rowCount.toLocaleString()} rows · {data.txCount.toLocaleString()} valid transactions · {data.skipped} skipped
        </div>
      </div>
    </div>
  );
}
