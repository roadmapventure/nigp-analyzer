import { useState, useCallback, useMemo, useRef } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Treemap, Legend, LineChart, Line, ReferenceLine,
  LabelList
} from "recharts";

const NIGP_CLASS_LOOKUP = {"005":"ABRASIVES","010":"ACOUSTICAL TILE, INSULATING MATERIALS, AND SUPPLIES","015":"ADDRESSING, COPYING, MIMEOGRAPH, AND SPIRIT DUPLICATING MACHINE SUPPLIES","019":"AGRICULTURAL CROPS AND GRAINS INCLUDING FRUITS, MELONS, NUTS, AND VEGETABLES","020":"AGRICULTURAL EQUIPMENT, IMPLEMENTS, AND ACCESSORIES","022":"AGRICULTURAL EQUIPMENT AND IMPLEMENT PARTS","025":"AIR COMPRESSORS AND ACCESSORIES","031":"AIR CONDITIONING, HEATING, AND VENTILATING EQUIPMENT, PARTS AND ACCESSORIES","035":"AIRCRAFT AND AIRPORT EQUIPMENT, PARTS, AND SUPPLIES","037":"AMUSEMENT, DECORATIONS, ENTERTAINMENT, GIFTS, TOYS, ETC.","040":"ANIMALS, BIRDS, MARINE LIFE, AND POULTRY, LIVE","050":"ART EQUIPMENT AND SUPPLIES","052":"ART OBJECTS","055":"AUTOMOTIVE ACCESSORIES FOR AUTOMOBILES, BUSES, TRAILERS, TRUCKS, ETC.","060":"AUTOMOTIVE AND TRAILER EQUIPMENT AND PARTS","065":"AUTOMOTIVE AND TRAILER BODIES, BODY ACCESSORIES, AND PARTS","070":"AUTOMOTIVE VEHICLES AND RELATED TRANSPORTATION EQUIPMENT","072":"TRUCKS (INCLUDING DIESEL, GASOLINE, ELECTRIC, HYBRID, AND ALTERNATIVE FUEL UNITS)","073":"TRAILERS","075":"AUTOMOTIVE SHOP AND RELATED EQUIPMENT AND SUPPLIES","080":"BADGES, AWARDS, EMBLEMS, NAME TAGS AND PLATES, JEWELRY, ETC.","085":"BAGS, BAGGING, TIES, AND EROSION SHEETING, ETC.","090":"BAKERY EQUIPMENT, COMMERCIAL","095":"BARBER AND BEAUTY SHOP EQUIPMENT AND SUPPLIES","100":"BARRELS, DRUMS, KEGS, AND CONTAINERS","105":"BEARINGS","110":"BELTS AND BELTING: AUTOMOTIVE AND INDUSTRIAL","115":"BIOCHEMICALS, RESEARCH","120":"BOATS, MOTORS, AND MARINE EQUIPMENT","125":"BOOKBINDING SUPPLIES","135":"BRICKS, CLAY, REFRACTORY MATERIALS, STONE, AND TILE PRODUCTS","140":"BROOM, BRUSH, AND MOP MANUFACTURING MACHINERY AND SUPPLIES","145":"BRUSHES","150":"BUILDER'S SUPPLIES","155":"BUILDINGS AND STRUCTURES: FABRICATED AND PREFABRICATED","160":"BUTCHER SHOP AND MEAT PROCESSING EQUIPMENT","165":"CAFETERIA AND KITCHEN EQUIPMENT, COMMERCIAL","175":"CHEMICAL LABORATORY EQUIPMENT AND SUPPLIES","180":"CHEMICAL RAW MATERIALS (IN LARGE QUANTITIES)","190":"CHEMICALS AND SOLVENTS, COMMERCIAL (IN BULK)","192":"CLEANING COMPOSITIONS, DETERGENTS, SOLVENTS, AND STRIPPERS - PREPACKAGED","193":"CLINICAL LABORATORY REAGENTS AND TESTS","195":"CLOCKS, WATCHES, TIMEPIECES, JEWELRY AND PRECIOUS STONES","200":"CLOTHING: ATHLETIC, CASUAL, DRESS, UNIFORM, WEATHER AND WORK RELATED","201":"CLOTHING ACCESSORIES","204":"COMPUTER HARDWARE AND PERIPHERALS FOR MICROCOMPUTERS","206":"COMPUTER HARDWARE AND PERIPHERALS FOR MINI AND MAIN FRAME COMPUTERS","207":"COMPUTER ACCESSORIES AND SUPPLIES","208":"COMPUTER SOFTWARE FOR MICROCOMPUTERS (PREPROGRAMMED)","209":"COMPUTER SOFTWARE FOR MINI AND MAINFRAME COMPUTERS (PREPROGRAMMED)","210":"CONCRETE AND METAL PRODUCTS, CULVERTS, PILINGS, SEPTIC TANKS, ACCESSORIES AND SUPPLIES","220":"CONTROLLING, INDICATING, MEASURING, MONITORING, AND RECORDING INSTRUMENTS AND SUPPLIES","225":"COOLERS, DRINKING WATER (WATER FOUNTAINS)","232":"CRAFTS, GENERAL","233":"CRAFTS, SPECIALIZED","240":"CUTLERY, COOKWARE, DISHES, GLASSWARE, SILVERWARE, UTENSILS, AND SUPPLIES","245":"DAIRY EQUIPMENT AND SUPPLIES","250":"DATA PROCESSING CARDS AND PAPER","255":"DECALS AND STAMPS","257":"DEFENSE SYSTEM AND HOMELAND SECURITY EQUIPMENT, WEAPONS AND ACCESSORIES","260":"DENTAL EQUIPMENT AND SUPPLIES","265":"DRAPERIES, CURTAINS, AND UPHOLSTERY MATERIAL","269":"DRUGS AND PHARMACEUTICALS","271":"DRUG AND FEEDING ADMINISTRATION, INFUSION, AND IRRIGATION EQUIPMENT AND SUPPLIES","280":"ELECTRICAL CABLES AND WIRES (NOT ELECTRONIC)","285":"ELECTRICAL EQUIPMENT AND SUPPLIES (EXCEPT CABLE AND WIRE)","287":"ELECTRONIC EQUIPMENT, COMPONENTS, PARTS, AND ACCESSORIES","290":"ENERGY COLLECTING EQUIPMENT AND ACCESSORIES: SOLAR AND WIND","295":"ELEVATORS, ESCALATORS, AND MOVING WALKS (BUILDING TYPE)","305":"ENGINEERING AND ARCHITECTURAL EQUIPMENT, SURVEYING EQUIPMENT, DRAWING INSTRUMENTS","310":"ENVELOPES, PLAIN","312":"ENVIRONMENTAL PROTECTIVE EQUIPMENT (INSIDE AND OUTSIDE)","315":"EPOXY BASED FORMULATIONS FOR ADHESIVES, COATINGS, AND RELATED AGENTS","318":"FARE COLLECTION EQUIPMENT AND SUPPLIES","320":"FASTENERS: BOLTS, NUTS, PINS, RIVETS, SCREWS, ETC.","325":"FEED, BEDDING, VITAMINS AND SUPPLEMENTS FOR ANIMALS","330":"FENCING","335":"FERTILIZERS AND SOIL CONDITIONERS","340":"FIRE PROTECTION EQUIPMENT AND SUPPLIES","345":"FIRST AID AND SAFETY EQUIPMENT AND SUPPLIES","350":"FLAGS, FLAG POLES, BANNERS, AND ACCESSORIES","360":"FLOOR COVERING, INSTALLATION AND REMOVAL EQUIPMENT, AND SUPPLIES","365":"FLOOR MAINTENANCE MACHINES, PARTS, AND ACCESSORIES","370":"FOOD PROCESSING AND CANNING EQUIPMENT AND SUPPLIES","375":"FOODS: BAKERY PRODUCTS (FRESH)","380":"FOODS: DAIRY PRODUCTS (FRESH)","385":"FOODS, FROZEN","390":"FOODS: PERISHABLE","393":"FOODS: STAPLE GROCERY AND GROCER'S MISCELLANEOUS ITEMS","395":"FORMS, CONTINUOUS: COMPUTER PAPER, FORM LABELS, SNAP-OUT FORMS","400":"FOUNDRY CASTINGS, EQUIPMENT, AND SUPPLIES","405":"FUEL, OIL, GREASE AND LUBRICANTS","410":"FURNITURE: HEALTH CARE, HOSPITAL AND/OR DOCTOR'S OFFICE","415":"FURNITURE: LABORATORY","420":"FURNITURE: CAFETERIA, CHAPEL, DORMITORY, HOUSEHOLD, LIBRARY, LOUNGE, SCHOOL","425":"FURNITURE: OFFICE","430":"GASES, CONTAINERS, EQUIPMENT: LABORATORY, MEDICAL, AND WELDING","435":"GERMICIDES, CLEANERS, AND RELATED SANITATION PRODUCTS FOR HEALTH CARE PERSONNEL","436":"GERMICIDES, CLEANERS, AND SANITATION PRODUCTS FOR HEALTH CARE (ENVIRONMENTALLY CERTIFIED)","440":"GLASS AND GLAZING SUPPLIES","445":"HAND TOOLS (POWERED AND NON-POWERED), ACCESSORIES AND SUPPLIES","450":"HARDWARE AND RELATED ITEMS","460":"HOSE, ACCESSORIES, AND SUPPLIES: INDUSTRIAL, COMMERCIAL, AND GARDEN","465":"HOSPITAL AND SURGICAL EQUIPMENT, INSTRUMENTS, AND SUPPLIES","470":"HOSPITAL, NURSING HOME OR RESIDENTIAL SPECIALIZED EQUIPMENT FOR HANDICAPPED AND DISABLED","475":"HOSPITAL, SURGICAL, AND MEDICAL RELATED ACCESSORIES AND SUNDRY ITEMS","485":"JANITORIAL SUPPLIES, GENERAL LINE","486":"JANITORIAL SUPPLIES, GENERAL LINE, ENVIRONMENTALLY CERTIFIED","490":"LABORATORY EQUIPMENT, ACCESSORIES AND SUPPLIES: GENERAL ANALYTICAL AND RESEARCH","493":"LABORATORY EQUIPMENT, ACCESSORIES, AND SUPPLIES: BIOCHEMISTRY, CHEMISTRY, ENVIRONMENTAL","495":"LABORATORY AND FIELD EQUIPMENT AND SUPPLIES: BIOLOGY, BOTANY, GEOLOGY, MICROBIOLOGY","500":"LAUNDRY AND DRY CLEANING EQUIPMENT, ACCESSORIES AND SUPPLIES, COMMERCIAL","505":"LAUNDRY AND DRY CLEANING COMPOUNDS, DETERGENTS, AND SUPPLIES","510":"LAUNDRY TEXTILES AND SUPPLIES","515":"LAWN MAINTENANCE EQUIPMENT AND ACCESSORIES","520":"LEATHER AND SHOE ACCESSORIES, EQUIPMENT, AND SUPPLIES","525":"LIBRARY AND ARCHIVAL EQUIPMENT, MACHINES, AND SUPPLIES","530":"LUGGAGE, BRIEF CASES, PURSES AND RELATED ITEMS","540":"LUMBER, SIDING, AND RELATED PRODUCTS","545":"MACHINERY AND HARDWARE, INDUSTRIAL","550":"MARKERS, PLAQUES AND TRAFFIC CONTROL DEVICES","553":"MANUFACTURING COMPONENTS AND SUPPLIES","555":"METAL, PAPER, AND PLASTIC STENCILS AND STENCILING DEVICES","556":"MASS TRANSPORTATION - TRANSIT BUS","557":"MASS TRANSPORTATION - TRANSIT BUS ACCESSORIES AND PARTS","558":"MASS TRANSPORTATION - RAIL VEHICLES AND SYSTEMS","559":"MASS TRANSPORTATION - RAIL VEHICLE PARTS AND ACCESSORIES","560":"MATERIAL HANDLING, CONVEYORS, STORAGE EQUIPMENT AND ACCESSORIES","565":"MATTRESS AND PILLOW MANUFACTURING MACHINERY AND SUPPLIES","570":"METALS: BARS, PLATES, RODS, SHEETS, STRIPS, STRUCTURAL SHAPES, TUBING","575":"MICROFICHE AND MICROFILM EQUIPMENT, ACCESSORIES, AND SUPPLIES","578":"MISCELLANEOUS PRODUCTS (NOT OTHERWISE CLASSIFIED)","580":"MUSICAL INSTRUMENTS, ACCESSORIES, AND SUPPLIES","590":"NOTIONS AND RELATED SEWING ACCESSORIES AND SUPPLIES","593":"NUCLEAR EQUIPMENT COMPONENTS, ACCESSORIES AND SUPPLIES","595":"NURSERY (PLANTS) STOCK, EQUIPMENT, AND SUPPLIES","600":"OFFICE MACHINES, EQUIPMENT, AND ACCESSORIES","605":"OFFICE MECHANICAL AIDS, SMALL MACHINES, AND APPARATUSES","610":"OFFICE SUPPLIES: CARBON PAPER AND RIBBONS, ALL TYPES","615":"OFFICE SUPPLIES, GENERAL","620":"OFFICE SUPPLIES: ERASERS, INKS, LEADS, PENS, PENCILS, ETC.","625":"OPTICAL EQUIPMENT, ACCESSORIES, AND SUPPLIES","630":"PAINT, PROTECTIVE COATINGS, VARNISH, WALLPAPER, AND RELATED PRODUCTS","631":"PAINT, PROTECTIVE COATINGS, VARNISH, WALLPAPER (ENVIRONMENTALLY CERTIFIED)","635":"PAINTING EQUIPMENT AND ACCESSORIES","640":"PAPER AND PLASTIC PRODUCTS, DISPOSABLE","645":"PAPER, FOR OFFICE AND PRINT SHOP USE","650":"PARK, PLAYGROUND, RECREATIONAL AREA AND SWIMMING POOL EQUIPMENT AND SUPPLIES","652":"PERSONAL HYGIENE AND GROOMING EQUIPMENT AND SUPPLIES","655":"PHOTOGRAPHIC EQUIPMENT, FILM, AND SUPPLIES","658":"PIPE, TUBING, AND ACCESSORIES (NOT FITTINGS)","659":"PIPE AND TUBING FITTINGS","665":"PLASTICS, RESINS, FIBERGLASS: CONSTRUCTION, FORMING, LAMINATING, AND MOLDING EQUIPMENT","670":"PLUMBING EQUIPMENT, FIXTURES, AND SUPPLIES","675":"PESTICIDES AND CHEMICALS: AGRICULTURAL AND INDUSTRIAL","680":"POLICE AND PRISON EQUIPMENT AND SUPPLIES","685":"POULTRY EQUIPMENT AND SUPPLIES","690":"POWER GENERATION EQUIPMENT, ACCESSORIES, AND SUPPLIES","691":"POWER TRANSMISSION EQUIPMENT (ELECTRICAL, MECHANICAL, AIR AND HYDRAULIC)","700":"PRINTING PLANT EQUIPMENT AND SUPPLIES (EXCEPT PAPER)","710":"PROSTHETIC DEVICES, HEARING AIDS, AUDITORY TESTING EQUIPMENT, ELECTRONIC READING DEVICES","715":"PUBLICATIONS, AUDIOVISUAL MATERIALS, BOOKS, TEXTBOOKS (PREPARED MATERIALS ONLY)","720":"PUMPING EQUIPMENT AND ACCESSORIES","725":"RADIO COMMUNICATION, TELEPHONE, AND TELECOMMUNICATION EQUIPMENT, ACCESSORIES, AND SUPPLIES","726":"RADIO COMMUNICATION EQUIPMENT, ACCESSORIES AND SUPPLIES","730":"RADIO COMMUNICATION AND TELECOMMUNICATION TESTING, MEASURING, AND ANALYZING EQUIPMENT","735":"RAGS, SHOP TOWELS, AND WIPING CLOTHS","740":"REFRIGERATION EQUIPMENT AND ACCESSORIES","745":"ROAD AND HIGHWAY BUILDING MATERIALS (ASPHALTIC)","750":"ROAD AND HIGHWAY BUILDING MATERIALS (NOT ASPHALTIC)","755":"ROAD AND HIGHWAY ASPHALT AND CONCRETE HANDLING AND PROCESSING EQUIPMENT","760":"ROAD AND HIGHWAY EQUIPMENT: EARTH HANDLING, GRADING, MOVING, PACKING, ETC.","765":"ROAD AND HIGHWAY EQUIPMENT (EXCEPT EQUIPMENT IN CLASSES 755 AND 760)","770":"ROOFING MATERIALS AND SUPPLIES","775":"SALT (SODIUM CHLORIDE)","780":"SCALES AND WEIGHING APPARATUS","785":"SCHOOL EQUIPMENT, TEACHING AIDS, AND SUPPLIES","790":"SEED, SOD, SOIL, AND INOCULANTS","795":"SEWING AND TEXTILE MACHINERY AND ACCESSORIES","800":"SHOES AND BOOTS","801":"SIGNS, SIGN MATERIALS, SIGN MAKING EQUIPMENT, AND RELATED SUPPLIES","803":"SOUND SYSTEMS, COMPONENTS, AND ACCESSORIES: GROUP INTERCOM, MUSIC, PUBLIC ADDRESS","805":"SPORTING GOODS, ATHLETIC EQUIPMENT AND ATHLETIC FACILITY EQUIPMENT","810":"SPRAYING EQUIPMENT","815":"STEAM AND HOT WATER FITTINGS, ACCESSORIES, AND SUPPLIES","820":"STEAM AND HOT WATER BOILERS AND STEAM HEATING EQUIPMENT","825":"STOCKMAN EQUIPMENT AND SUPPLIES","830":"TANKS (METAL, PLASTIC, WOOD, AND SYNTHETIC MATERIALS): MOBILE, PORTABLE, STATIONARY","832":"TAPE (NOT DATA PROCESSING, MEASURING, OPTICAL, SEWING, SOUND, OR VIDEO)","838":"TELECOMMUNICATION EQUIPMENT, ACCESSORIES AND SUPPLIES","839":"TELEPHONE EQUIPMENT, ACCESSORIES AND SUPPLIES","840":"TELEVISION EQUIPMENT AND ACCESSORIES","845":"TESTING APPARATUS AND INSTRUMENTS (NOT FOR ELECTRICAL OR ELECTRONIC MEASUREMENTS)","850":"TEXTILES, FIBERS, HOUSEHOLD LINENS, AND PIECE GOODS","855":"THEATRICAL EQUIPMENT AND SUPPLIES","860":"TICKETS, COUPON BOOKS, SALES BOOKS, STRIP BOOKS, ETC.","863":"TIRES AND TUBES (INCL. RECAPPED/RETREADED TIRES)","865":"TWINE AND STRING","870":"VENETIAN BLINDS, AWNINGS, AND SHADES","875":"VETERINARY EQUIPMENT AND SUPPLIES","880":"VISUAL EDUCATION EQUIPMENT AND SUPPLIES","883":"VOICE RESPONSE SYSTEMS","885":"WATER AND WASTEWATER TREATING CHEMICALS","890":"WATER SUPPLY, GROUNDWATER, SEWAGE TREATMENT, AND RELATED EQUIPMENT","895":"WELDING EQUIPMENT AND SUPPLIES","898":"X-RAY AND OTHER RADIOLOGICAL EQUIPMENT AND SUPPLIES (MEDICAL)","905":"AIRCRAFT AND AIRPORT OPERATIONS SERVICES","906":"ARCHITECTURAL SERVICES, PROFESSIONAL","907":"ARCHITECTURAL AND ENGINEERING SERVICES, NON-PROFESSIONAL","908":"BOOKBINDING AND REPAIRING SERVICES","909":"BUILDING CONSTRUCTION SERVICES, NEW (INCL. MAINTENANCE AND REPAIR SERVICES)","910":"BUILDING MAINTENANCE, INSTALLATION AND REPAIR SERVICES","912":"CONSTRUCTION SERVICES, GENERAL (INCL. MAINTENANCE AND REPAIR SERVICES)","913":"CONSTRUCTION SERVICES, HEAVY (INCL. MAINTENANCE AND REPAIR SERVICES)","914":"CONSTRUCTION SERVICES, TRADE (NEW CONSTRUCTION)","915":"COMMUNICATIONS AND MEDIA RELATED SERVICES","918":"CONSULTING SERVICES","920":"DATA PROCESSING, COMPUTER, PROGRAMMING, AND SOFTWARE SERVICES","924":"EDUCATIONAL/TRAINING SERVICES","925":"ENGINEERING SERVICES, PROFESSIONAL","926":"ENVIRONMENTAL AND ECOLOGICAL SERVICES","928":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR AUTOMOBILES, TRUCKS, TRAILERS","929":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR AGRICULTURAL, CONSTRUCTION, HEAVY INDUSTRIAL","931":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR APPLIANCE, ATHLETIC, CAFETERIA, FURNITURE","934":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR LAUNDRY, LAWN, PAINTING, PLUMBING","938":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR HOSPITAL, LABORATORY, AND TESTING EQUIPMENT","939":"EQUIPMENT MAINTENANCE AND REPAIR SERVICES FOR COMPUTERS, OFFICE, PHOTOGRAPHIC","940":"EQUIPMENT MAINTENANCE, REPAIR, CONSTRUCTION, AND RELATED SERVICES FOR RAILROADS","941":"EQUIPMENT MAINTENANCE, REPAIR, AND RELATED SERVICES FOR POWER GENERATION AND TRANSMISSION","944":"FARMING AND RANCHING SERVICES, ANIMAL AND CROP","946":"FINANCIAL SERVICES","947":"FORESTRY SERVICES","948":"HEALTH RELATED SERVICES","952":"HUMAN SERVICES","953":"INSURANCE AND INSURANCE SERVICES (ALL TYPES)","954":"LAUNDRY AND DRY CLEANING SERVICES","956":"LIBRARY SERVICES (INCL. RESEARCH AND SUBSCRIPTION SERVICES)","958":"MANAGEMENT SERVICES","961":"MISCELLANEOUS SERVICES, NO. 1 (NOT OTHERWISE CLASSIFIED)","962":"MISCELLANEOUS SERVICES, NO. 2 (NOT OTHERWISE CLASSIFIED)","963":"NON-BIDDABLE MISCELLANEOUS ITEMS","965":"PRINTING PREPARATIONS","966":"PRINTING AND TYPESETTING SERVICES","967":"PRODUCTION AND MANUFACTURING SERVICES","968":"PUBLIC WORKS AND RELATED SERVICES","971":"REAL PROPERTY RENTAL OR LEASE","975":"RENTAL OR LEASE SERVICES OF AGRICULTURAL, AIRCRAFT, AIRPORT, AUTOMOTIVE, MARINE, AND HEAVY EQUIPMENT","977":"RENTAL OR LEASE SERVICES OF APPLIANCES, CAFETERIA, FILM, FURNITURE, HARDWARE, MUSICAL, SEWING","979":"RENTAL OR LEASE SERVICES OF ENGINEERING, HOSPITAL, LABORATORY, PRECISION INSTRUMENTS","981":"RENTAL OR LEASE OF GENERAL EQUIPMENT (HVAC, ATHLETIC, FIRE AND POLICE PROTECTION)","983":"RENTAL OR LEASE SERVICES OF CLOTHING, JANITORIAL, LAUNDRY, LAWN, PAINTING, SPRAYING","984":"RENTAL OR LEASE SERVICES OF COMPUTERS, DATA PROCESSING, AND WORD PROCESSING EQUIPMENT","985":"RENTAL OR LEASE SERVICES OF OFFICE, PHOTOGRAPHIC, PRINTING, RADIO/TELEVISION/TELEPHONE","988":"ROADSIDE, GROUNDS, RECREATIONAL AND PARK AREA SERVICES","989":"SAMPLING AND SAMPLE PREPARATION SERVICES (FOR TESTING)","990":"SECURITY, FIRE, SAFETY, AND EMERGENCY SERVICES","992":"TESTING AND CALIBRATION SERVICES","998":"SALE OF SURPLUS AND OBSOLETE ITEMS"};

function resolveNIGP(rawCode) {
  if (!rawCode) return { classCode:"000", label:"Unknown / Unclassified" };
  const digits = String(rawCode).replace(/\D/g,"");
  if (!digits) return { classCode:"000", label:"Unknown / Unclassified" };
  const classCode = digits.padStart(3,"0").slice(0,3);
  const label = NIGP_CLASS_LOOKUP[classCode] || `Unrecognized Class ${classCode}`;
  return { classCode, label };
}

<<<<<<< HEAD
// ── FIELD_DEFS: department synonyms restricted to actual department/agency/division names only (#4)
=======
>>>>>>> c158944 (v2.2)
const FIELD_DEFS = {
  amount:      { label:"💰 Spend Amount",      required:true,  color:"#00C49F", hint:"Dollar value per transaction",         synonyms:["itm_tot_am","amount","total","spend","cost","price","value","sum","extended","amt","dollar","extended_amount","total_amount","line_total","po_amount"] },
  nigp:        { label:"🏷 NIGP Code",          required:true,  color:"#0088FE", hint:"Commodity / class code",              synonyms:["commodity","nigp","class","code","item_class","commodity_code","nigp_code","item_no","class_code","nigp_class","nigp_commodity"] },
  description: { label:"📋 Item Description",  required:false, color:"#FFBB28", hint:"What was purchased",                   synonyms:["commodity_description","description","desc","item_desc","service","product","title","line_desc","item_description","extended_description"] },
  vendor:      { label:"🏢 Vendor Name",        required:false, color:"#FF8042", hint:"Supplier / contractor legal name",     synonyms:["lgl_nm","vendor","supplier","payee","contractor","company","vendor_name","legal_name","legalname","vendor_legal_name","firm"] },
  contract:    { label:"📄 Contract / MA #",    required:false, color:"#A45CFF", hint:"Master agreement or contract number",  synonyms:["master_agreement","contract","contract_no","contract_number","ma_number","agreement","po_contract","contract_id","master_agreement_no"] },
  po:          { label:"🔢 PO Number",          required:false, color:"#29B6F6", hint:"Purchase order number",               synonyms:["purchase_order","po","po_number","po_no","order_number","doc_no","po_num"] },
  department:  { label:"🏛 Department",         required:false, color:"#FFA726", hint:"Agency or division that purchased",
    synonyms:["department","dept","agency","division","bureau","org_unit","department_name","dept_name","department_id","dept_id","agency_name","agency_code","division_name","org_name","cost_center","fund","program","department_code"] },
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
    if (field === "department") { result[field] = ""; continue; }
    const partial = columns.find(c => def.synonyms.some(s => c.toLowerCase().replace(/[^a-z0-9_]/g,"").includes(s)));
    result[field] = partial || "";
  }
  return result;
}

const PALETTE = ["#00C49F","#FFBB28","#FF8042","#0088FE","#A45CFF","#FF6B9D","#29B6F6","#FFA726","#66BB6A","#EF5350","#AB47BC","#26C6DA","#D4E157","#FF7043","#42A5F5","#EC407A","#7E57C2","#26A69A","#FFA000","#78909C","#4DD0E1","#AED581","#FFD54F","#F48FB1","#CE93D8"];
<<<<<<< HEAD

// #5 — fmtFull rounds to nearest dollar (no decimals)
=======
>>>>>>> c158944 (v2.2)
const fmt = n => n>=1e9?`$${(n/1e9).toFixed(1)}B`:n>=1e6?`$${(n/1e6).toFixed(1)}M`:n>=1e3?`$${(n/1e3).toFixed(0)}K`:`$${Math.round(n).toLocaleString()}`;
const fmtFull = n => "$"+Math.round(Number(n)).toLocaleString("en-US");
const parseAmt = raw => { if(!raw) return NaN; return parseFloat(String(raw).replace(/[$,\s]/g,"")); };
const toTC = str => str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase()+w.slice(1).toLowerCase());
const shortLabel = (s,n=38) => { const tc=toTC(s); return tc.length>n?tc.slice(0,n-1)+"…":tc; };
const fmtPct = (n, decimals=1) => `${n.toFixed(decimals)}%`;

const PctBar = ({pct, color="#00C49F", width=80}) => (
  <div style={{display:"flex",alignItems:"center",gap:7,minWidth:width+44}}>
    <div style={{height:5,borderRadius:3,background:"#0d1e2e",width,overflow:"hidden",flexShrink:0}}>
      <div style={{height:"100%",borderRadius:3,background:color,width:`${Math.min(100,pct)}%`,transition:"width 0.3s"}}/>
    </div>
    <span style={{color:"#6a9ab8",fontSize:11,minWidth:38,fontWeight:600}}>{fmtPct(pct)}</span>
  </div>
);

const PctBarLabel = ({x,y,width,height,value,total,color="#8ab4cc"}) => {
  if(!total||width<30) return null;
  return <text x={x+width+7} y={y+height/2+1} fill={color} fontSize={10} fontWeight={600} dominantBaseline="middle">{(value/total*100).toFixed(1)}%</text>;
};

const Tip = ({active,payload,label,total}) => {
  if(!active||!payload?.length) return null;
  const val = payload[0].value;
  const pct = total && total>0 ? (val/total*100) : (payload[0].payload?._pct ?? null);
  return <div style={{background:"#0f1923",border:"1px solid #1e3a4a",borderRadius:8,padding:"10px 14px",color:"#e0f0ff",fontSize:13,maxWidth:300}}><div style={{fontWeight:700,marginBottom:4,color:"#00C49F",lineHeight:1.3}}>{label||payload[0].name}</div><div style={{color:"#a0c4d8"}}>{fmtFull(val)}</div>{pct!=null&&<div style={{color:"#6a9ab8",fontSize:11,marginTop:3}}>📊 {fmtPct(pct)} of total spend</div>}</div>;
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
          {amount!=null&&(<div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#4a7a96",marginBottom:2}}>SPEND AT RISK</div><div style={{fontSize:16,fontWeight:800,color:c}}>{fmt(amount)}</div>{pct!=null&&<div style={{fontSize:10,color:`${c}cc`,marginTop:2,fontWeight:700}}>{fmtPct(pct)} of total</div>}</div>)}
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

<<<<<<< HEAD
// ── SIDEBAR NAV CONFIG (#7) ──────────────────────────────────────────────────
=======
// #1 — blinking border CSS injected once
const BLINK_STYLE = `
@keyframes borderPulse {
  0%,100% { border-color: #00C49F55; box-shadow: 0 0 0 0 rgba(0,196,159,0); }
  50% { border-color: #00C49F; box-shadow: 0 0 18px 4px rgba(0,196,159,0.25); }
}
.upload-blink { animation: borderPulse 2s ease-in-out infinite; }
`;

>>>>>>> c158944 (v2.2)
const NAV_GROUPS = [
  { id:"overview-group", label:"Overview", tabs:[{id:"overview",label:"Overview",icon:"▦"}] },
  { id:"analysis-group", label:"Analysis", tabs:[
    {id:"categories",label:"Categories",icon:"◈"},
    {id:"treemap",label:"Treemap",icon:"⊞"},
    {id:"vendors",label:"Vendors",icon:"🏢"},
    {id:"timeline",label:"Timeline",icon:"📅"},
  ]},
  { id:"strategy-group", label:"Strategy", tabs:[
    {id:"flags",label:"Concerns",icon:"⚠"},
    {id:"localspend",label:"Local Spend",icon:"📍"},
    {id:"concentration",label:"Vendor Risk",icon:"⚡"},
    {id:"aibriefing",label:"AI Briefing",icon:"✨"},
  ]},
  { id:"data-group", label:"Data", tabs:[
    {id:"cleanup",label:"Cleanup",icon:"🧹"},
    {id:"table",label:"Full Table",icon:"📋"},
  ]},
];

<<<<<<< HEAD
=======
// #6 — custom bar label showing % on top of timeline bars
const TimelinePctLabel = ({x,y,width,value,total}) => {
  if(!total||!value||width<20) return null;
  const pct = (value/total*100).toFixed(1);
  return <text x={x+width/2} y={y-4} textAnchor="middle" fill="#8ab4cc" fontSize={9} fontWeight={600}>{pct}%</text>;
};

>>>>>>> c158944 (v2.2)
export default function NIGPAnalyzer() {
  const [stage,setStage]=useState("overview"); // #1 — start on overview, not upload
  const [columns,setColumns]=useState([]);
  const [fileName,setFileName]=useState("");
  const [mapping,setMapping]=useState({});
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [dragOver,setDragOver]=useState(false);
  const [activeTab,setActiveTab]=useState("overview");
  const [searchTerm,setSearchTerm]=useState("");
  const inputRef = useRef();
  const hiddenInputRef = useRef(); // for overview upload trigger

  const [localViewBy,setLocalViewBy]=useState("city");
  const [localSelected,setLocalSelected]=useState("");
  const [localApplied,setLocalApplied]=useState(null);

  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const [aiError,setAiError]=useState("");
<<<<<<< HEAD

  // #9 — HHI tooltip state
=======
>>>>>>> c158944 (v2.2)
  const [hhiTooltipVisible,setHhiTooltipVisible]=useState(false);

  const generateBriefing = async () => {
    if (!data) return;
    setAiLoading(true); setAiResult(null); setAiError("");
    const top5cats = data.classArr.slice(0,5).map(c=>`${c.displayLabel}: ${fmtFull(c.total)} (${(c.total/data.totalSpend*100).toFixed(1)}%)`);
    const top5vend = data.vendorArr.slice(0,5).map(v=>`${v.name}: ${fmtFull(v.total)} (${(v.total/data.totalSpend*100).toFixed(1)}%)`);
    const flagSummary = data.flags.map(f=>`[${f.severity.toUpperCase()}] ${f.title}: ${f.summary}`);
    const hhi = data.vendorConc ? data.vendorConc.hhi.toFixed(0) : "N/A";
    const systemPrompt = `You are a senior government procurement analyst writing an executive briefing for a Chief Procurement Officer (CPO). Write in a direct, authoritative tone. Use precise numbers from the data. Structure your response in clean HTML using only: <h2>, <h3>, <p>, <strong>, <span style="...">, <div style="...">. Use colors: accent #00C49F, risk #EF5350, warning #FFA726, text #c8dcea. Do not use bullet points. Write in flowing paragraphs like a McKinsey memo.`;
<<<<<<< HEAD
    const userPrompt = `Write a CPO Executive Briefing for this procurement data.\n\nFile: ${fileName}\nTotal Spend: ${fmtFull(data.totalSpend)}\nTransactions: ${data.txCount.toLocaleString()}\nCategories: ${data.classArr.length}\nUnique Vendors: ${data.vendorArr.length}\nVendor HHI: ${hhi} (>2500=highly concentrated)\n\nTOP 5 CATEGORIES:\n${top5cats.join("\n")}\n\nTOP 5 VENDORS:\n${top5vend.join("\n")}\n\nPROCUREMENT FLAGS:\n${flagSummary.join("\n")}\n\nWrite exactly four sections:\n1. PORTFOLIO OVERVIEW — 2-3 sentences on spend scale and category mix\n2. RISK ASSESSMENT — narrative analysis of top flags with dollar exposure\n3. STRATEGIC OPPORTUNITIES — 3 concrete 90-day actions with estimated value\n4. BOTTOM LINE — one paragraph the CPO can read aloud to city council in 30 seconds\n\nFormat as clean HTML. Make it feel like a premium consulting deliverable.`;
    try {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const endpoint = isLocalhost ? "https://api.anthropic.com/v1/messages" : "/api/brief";
      const response = await fetch(endpoint, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:6000, system:systemPrompt, messages:[{role:"user",content:userPrompt}] }),
      });
=======
    const userPrompt = `Write a CPO Executive Briefing for this procurement data.\n\nFile: ${fileName}\nTotal Spend: ${fmtFull(data.totalSpend)}\nTransactions: ${data.txCount.toLocaleString()}\nCategories: ${data.classArr.length}\nUnique Vendors: ${data.vendorArr.length}\nVendor HHI: ${hhi} (>2500=highly concentrated)\n\nTOP 5 CATEGORIES:\n${top5cats.join("\n")}\n\nTOP 5 VENDORS:\n${top5vend.join("\n")}\n\nPROCUREMENT FLAGS:\n${flagSummary.join("\n")}\n\nWrite exactly four sections:\n1. PORTFOLIO OVERVIEW\n2. RISK ASSESSMENT\n3. STRATEGIC OPPORTUNITIES\n4. BOTTOM LINE\n\nFormat as clean HTML. Make it feel like a premium consulting deliverable.`;
    try {
      const isLocalhost = window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";
      const endpoint = isLocalhost?"https://api.anthropic.com/v1/messages":"/api/brief";
      const response = await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:6000,system:systemPrompt,messages:[{role:"user",content:userPrompt}]})});
>>>>>>> c158944 (v2.2)
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

  const runAnalysis = useCallback(()=>{
    if(!mapping.amount){setError("Please assign the Spend Amount column.");return;}
    if(!mapping.nigp){setError("Please assign the NIGP Code column.");return;}
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
    const s=new Set(["overview","categories","treemap","flags","concentration","localspend","aibriefing","table"]);
    if(data.hasVendor) s.add("vendors");
    if(data.hasDept) s.add("departments");
    if(data.hasDate) s.add("timeline");
    if(dirtyCount>0) s.add("cleanup");
    return s;
  },[data,dirtyCount]);

  const Header = ()=>(
    <div style={{background:"linear-gradient(135deg,#0a1929 0%,#0d2137 50%,#091520 100%)",borderBottom:"1px solid #1a3548",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#00C49F,#0088FE)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff"}}>N</div>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:"#e8f4ff",letterSpacing:"-0.5px"}}>NIGP Spend Analyzer</div>
          <div style={{fontSize:11,color:"#5a8aaa"}}>Government Procurement Intelligence</div>
        </div>
      </div>
      {/* #2 — header buttons */}
      <div style={{display:"flex",gap:8}}>
        {stage==="analyze"&&<button onClick={()=>setStage("map")} style={{background:"transparent",border:"1px solid #1e3a4a",color:"#7aafc9",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12}}>✏ Edit Mapping</button>}
        {/* Add New File — always visible once past overview */}
        {(stage==="map"||stage==="analyze")&&(
          <button onClick={()=>{setStage("overview");setData(null);setError("");setFileName("");}} style={{background:"transparent",border:"1px solid #1e3a4a",color:"#7aafc9",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12}}>+ Add New File</button>
        )}
        {/* #2 — Run Analysis button next to Add New File on map screen */}
        {stage==="map"&&(
          <button onClick={runAnalysis} style={{background:"linear-gradient(135deg,#00C49F,#0088FE)",border:"none",color:"#fff",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:12,fontWeight:700}}>Run Analysis →</button>
        )}
      </div>
    </div>
  );

<<<<<<< HEAD
  // ── LOADING ──────────────────────────────────────────────────────────────────
=======
>>>>>>> c158944 (v2.2)
  if(loading) return (
    <div style={{minHeight:"100vh",background:"#080f18",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#c8dcea"}}>
      <style>{BLINK_STYLE}</style>
      <Header/>
      <div style={{textAlign:"center",padding:"120px 0",color:"#5a8aaa"}}>
        <div style={{fontSize:40,marginBottom:16}}>⚙️</div>
        <div style={{fontSize:18,fontWeight:600}}>Analyzing spend data…</div>
      </div>
    </div>
  );

<<<<<<< HEAD
  // ── UPLOAD STAGE (#1 — animated welcome + upload button) ────────────────────
  if(stage==="upload") return (
    <div style={{minHeight:"100vh",background:"#080f18",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#c8dcea"}}>
      <Header/>
      <div style={{maxWidth:780,margin:"50px auto 0",padding:"0 24px"}}>

        {/* Animated welcome / app description (#1 option 4) */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:13,fontWeight:700,color:"#00C49F",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>Government Procurement Intelligence</div>
          <h1 style={{fontSize:32,fontWeight:900,color:"#e8f4ff",margin:"0 0 14px",letterSpacing:"-0.5px",lineHeight:1.2}}>
            Turn raw spend data into<br/>
            <span style={{background:"linear-gradient(135deg,#00C49F,#0088FE)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>boardroom-ready intelligence</span>
          </h1>
          <p style={{fontSize:15,color:"#5a8aaa",maxWidth:520,margin:"0 auto",lineHeight:1.7}}>
            Upload your procurement CSV and get instant analysis — spend categories, vendor concentration, risk flags, and an AI-generated executive briefing in under 30 seconds.
          </p>
        </div>

        {/* Preview cards (greyed-out placeholder, option 2) */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:36,opacity:0.35,pointerEvents:"none",userSelect:"none"}}>
          {[{l:"Total Spend",v:"$000,000,000",c:"#00C49F"},{l:"Transactions",v:"00,000",c:"#0088FE"},{l:"Health Flags",v:"—",c:"#FFA726"},{l:"Vendor HHI",v:"—",c:"#A45CFF"}].map(p=>(
            <div key={p.l} style={{background:"#0a1729",border:"1px solid #1a3040",borderRadius:12,padding:"14px 16px"}}>
              <div style={{fontSize:10,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{p.l}</div>
              <div style={{fontSize:18,fontWeight:800,color:p.c,filter:"blur(5px)"}}>{p.v}</div>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div onClick={()=>inputRef.current.click()} onDrop={e=>{e.preventDefault();processFile(e.dataTransfer.files[0]);}} onDragOver={e=>{e.preventDefault();}} onDragLeave={()=>{}}
          style={{border:`2px dashed ${dragOver?"#00C49F":"#1e3a4a"}`,borderRadius:16,padding:"50px 40px",textAlign:"center",cursor:"pointer",background:"#0a1729",transition:"all 0.2s"}}>
          <div style={{fontSize:44,marginBottom:14}}>📊</div>
          <div style={{fontSize:19,fontWeight:700,color:"#d0e8f5",marginBottom:8}}>Drop your government spend CSV here</div>
          <div style={{fontSize:13,color:"#4a7a96",marginBottom:24}}>Procurement health analysis · Vendor risk scoring · AI Executive Briefing</div>
          {/* #3 — "Upload Spend" button */}
          <div style={{display:"inline-block",background:"linear-gradient(135deg,#00C49F,#0088FE)",color:"#fff",borderRadius:10,padding:"13px 32px",fontWeight:700,fontSize:15}}>↑ Upload Spend</div>
          <input ref={inputRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>processFile(e.target.files[0])}/>
        </div>
        <div style={{marginTop:20,background:"rgba(164,92,255,0.07)",border:"1px solid #A45CFF33",borderRadius:12,padding:"14px 18px",fontSize:13,color:"#8a6aaa",lineHeight:1.6}}>
          ✨ <strong style={{color:"#C47CFF"}}>AI CPO Briefing</strong> — After uploading, navigate to AI Briefing under Strategy to generate a board-ready executive summary powered by Claude AI.
        </div>
        {error&&<div style={{marginTop:16,background:"rgba(239,83,80,0.1)",border:"1px solid #ef535044",borderRadius:10,padding:"12px 16px",color:"#ff8a80",fontSize:14}}>⚠ {error}</div>}
      </div>
    </div>
  );

  // ── MAPPING STAGE ────────────────────────────────────────────────────────────
=======
  // ── MAPPING STAGE (#2) ──────────────────────────────────────────────────────
>>>>>>> c158944 (v2.2)
  if(stage==="map") return (
    <div style={{minHeight:"100vh",background:"#080f18",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#c8dcea"}}>
      <style>{BLINK_STYLE}</style>
      <Header/>
      <div style={{maxWidth:820,margin:"36px auto",padding:"0 24px"}}>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:20,fontWeight:800,color:"#d0e8f5",marginBottom:5}}>Confirm Column Mapping</div>
          <div style={{fontSize:14,color:"#4a7a96"}}>Found <strong style={{color:"#8ab4cc"}}>{columns.length} columns</strong> in <strong style={{color:"#8ab4cc"}}>{fileName}</strong>.</div>
        </div>
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
        {/* #2 — Add New File + Run Analysis buttons */}
        <div style={{display:"flex",gap:12,marginTop:20}}>
          <button onClick={()=>{setStage("overview");setData(null);setError("");setFileName("");}} style={{background:"transparent",border:"1px solid #1e3a4a",color:"#7aafc9",borderRadius:10,padding:"12px 24px",cursor:"pointer",fontSize:14}}>+ Add New File</button>
          <button onClick={runAnalysis} style={{flex:1,background:"linear-gradient(135deg,#00C49F,#0088FE)",border:"none",color:"#fff",borderRadius:10,padding:"12px 24px",cursor:"pointer",fontSize:15,fontWeight:700}}>Run Analysis →</button>
        </div>
      </div>
    </div>
  );

<<<<<<< HEAD
  // ── ANALYZE STAGE ────────────────────────────────────────────────────────────
  const vc=data.vendorConc;
=======
  // ── ANALYZE / OVERVIEW STAGE ─────────────────────────────────────────────────
  const vc = data?.vendorConc;
>>>>>>> c158944 (v2.2)

  const localAreaName = localApplied ? localApplied.value : "Local Area";

  return (
    <div style={{minHeight:"100vh",background:"#080f18",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#c8dcea",display:"flex",flexDirection:"column"}}>
      <style>{BLINK_STYLE}</style>
      <Header/>

<<<<<<< HEAD
      {/* ── MAIN LAYOUT: sidebar + content ── */}
=======
>>>>>>> c158944 (v2.2)
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── SIDEBAR (#3 — 70% = ~154px) ── */}
        <div style={{width:154,flexShrink:0,background:"#0c1a28",borderRight:"1px solid #1a3040",padding:"16px 0",display:"flex",flexDirection:"column",overflowY:"auto"}}>
          {data&&(
            <div style={{padding:"0 12px 12px",borderBottom:"1px solid #1a3040",marginBottom:10}}>
              <div style={{fontSize:9,color:"#3a6a86",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Analyzing</div>
              <div style={{fontSize:11,color:"#7aafc9",fontWeight:600,wordBreak:"break-all",lineHeight:1.3}}>{fileName}</div>
              <div style={{fontSize:10,color:"#2a4a5a",marginTop:2}}>{data.txCount.toLocaleString()} txns</div>
            </div>
          )}
          {NAV_GROUPS.map(group=>{
            const groupTabs=group.tabs.filter(t=>availableTabs.has(t.id));
            if(groupTabs.length===0) return null;
            return(
              <div key={group.id} style={{marginBottom:4}}>
                <div style={{padding:"5px 12px 3px",fontSize:9,fontWeight:700,color:"#3a6a86",textTransform:"uppercase",letterSpacing:"0.1em"}}>{group.label}</div>
                {groupTabs.map(t=>{
                  const isActive=activeTab===t.id&&stage==="analyze";
                  const isAI=t.id==="aibriefing";
                  const isAlert=t.id==="flags"&&highFlags>0;
                  const isCleanup=t.id==="cleanup"&&dirtyCount>0;
                  const accentColor=isAI?"#A45CFF":isAlert?"#EF5350":isCleanup?"#FFA726":"#00C49F";
                  const disabled=!data&&t.id!=="overview";
                  return(
                    <button key={t.id}
                      onClick={()=>{if(!disabled){setActiveTab(t.id);if(stage!=="analyze"&&data) setStage("analyze");}}}
                      style={{width:"100%",textAlign:"left",padding:"8px 12px 8px 18px",fontSize:12,fontWeight:isActive?700:400,cursor:disabled?"not-allowed":"pointer",border:"none",fontFamily:"inherit",background:isActive?`${accentColor}18`:"transparent",color:isActive?accentColor:disabled?"#2a4a5a":"#6a9ab8",borderLeft:isActive?`2px solid ${accentColor}`:"2px solid transparent",transition:"all 0.15s",display:"flex",alignItems:"center",gap:6,opacity:disabled?0.4:1}}>
                      <span style={{fontSize:10,opacity:0.7}}>{t.icon}</span>
                      <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</span>
                      {isAlert&&<span style={{fontSize:9,background:"#EF535022",color:"#EF5350",borderRadius:3,padding:"1px 4px",fontWeight:700}}>{highFlags}</span>}
                      {isCleanup&&<span style={{fontSize:9,background:"#FFA72622",color:"#FFA726",borderRadius:3,padding:"1px 4px",fontWeight:700}}>{dirtyCount}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div style={{marginTop:"auto",padding:"12px",borderTop:"1px solid #1a3040"}}>
            <div style={{fontSize:9,color:"#2a4a5a",textAlign:"center"}}>v2.1</div>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>

          {/* ── #1 — NO DATA: Overview with upload prompt ── */}
          {!data&&(
            <div style={{maxWidth:680,margin:"0 auto"}}>
              {/* Animated headline */}
              <div style={{textAlign:"center",marginBottom:36}}>
                <div style={{fontSize:12,fontWeight:700,color:"#00C49F",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Government Procurement Intelligence</div>
                <h1 style={{fontSize:30,fontWeight:900,color:"#e8f4ff",margin:"0 0 12px",letterSpacing:"-0.5px",lineHeight:1.2}}>
                  Turn raw spend data into<br/>
                  <span style={{background:"linear-gradient(135deg,#00C49F,#0088FE)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>boardroom-ready intelligence</span>
                </h1>
                <p style={{fontSize:14,color:"#5a8aaa",maxWidth:480,margin:"0 auto",lineHeight:1.7}}>
                  Upload your procurement CSV and get instant analysis — spend categories, vendor concentration, risk flags, and an AI-generated executive briefing.
                </p>
              </div>

              {/* Greyed blurred placeholder KPI cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:32,opacity:0.3,pointerEvents:"none",userSelect:"none"}}>
                {[{l:"Total Spend",v:"$000,000,000",c:"#00C49F"},{l:"Transactions",v:"00,000",c:"#0088FE"},{l:"Health Flags",v:"—",c:"#FFA726"},{l:"Vendor HHI",v:"—",c:"#A45CFF"}].map(p=>(
                  <div key={p.l} style={{background:"#0a1729",border:"1px solid #1a3040",borderRadius:12,padding:"14px 16px"}}>
                    <div style={{fontSize:10,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{p.l}</div>
                    <div style={{fontSize:18,fontWeight:800,color:p.c,filter:"blur(5px)"}}>{p.v}</div>
                  </div>
                ))}
              </div>

              {/* #1 — Upload drop zone with blinking border */}
              <div
                onClick={()=>hiddenInputRef.current.click()}
                onDrop={e=>{e.preventDefault();processFile(e.dataTransfer.files[0]);}}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                className="upload-blink"
                style={{border:"2px solid #00C49F55",borderRadius:16,padding:"44px 40px",textAlign:"center",cursor:"pointer",background:"#0a1729",transition:"background 0.2s",boxSizing:"border-box"}}>
                <div style={{fontSize:42,marginBottom:12}}>📊</div>
                <div style={{fontSize:18,fontWeight:700,color:"#d0e8f5",marginBottom:8}}>Drop your government spend CSV here</div>
                <div style={{fontSize:13,color:"#4a7a96",marginBottom:22}}>Procurement health analysis · Vendor risk scoring · AI Executive Briefing</div>
                <div style={{display:"inline-block",background:"linear-gradient(135deg,#00C49F,#0088FE)",color:"#fff",borderRadius:10,padding:"12px 30px",fontWeight:700,fontSize:14}}>↑ Upload Spend</div>
                <input ref={hiddenInputRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>processFile(e.target.files[0])}/>
              </div>

              {error&&<div style={{marginTop:16,background:"rgba(239,83,80,0.1)",border:"1px solid #ef535044",borderRadius:10,padding:"12px 16px",color:"#ff8a80",fontSize:14}}>⚠ {error}</div>}
            </div>
          )}

          {/* ── DATA LOADED ── */}
          {data&&(
            <>
              {/* KPI Cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(148px,1fr))",gap:10,marginBottom:22}}>
                {[
                  {label:"Total Spend",value:fmtFull(data.totalSpend),accent:"#00C49F"},
                  {label:"Transactions",value:data.txCount.toLocaleString(),accent:"#0088FE"},
                  {label:"Categories",value:data.classArr.length,accent:"#FFBB28"},
                  ...(data.hasVendor?[{label:"Unique Vendors",value:data.vendorArr.length.toLocaleString(),accent:"#FF8042"}]:[]),
                  {label:"Health Flags",value:data.flags.length,accent:data.flags.filter(f=>f.severity==="high").length>0?"#EF5350":"#FFA726"},
                  ...(vc?[{label:"Vendor HHI",value:vc.hhi.toFixed(0),accent:vc.hhi>2500?"#EF5350":vc.hhi>1500?"#FFA726":"#00C49F"}]:[]),
                  ...(data.classArr.length>0?[{label:"Top Category %",value:fmtPct(data.classArr[0].total/data.totalSpend*100),sub:data.classArr[0].displayLabel,accent:"#A45CFF"}]:[]),
                  ...(data.hasVendor&&data.vendorArr.length>0?[{label:"Top Vendor %",value:fmtPct(data.vendorArr[0].total/data.totalSpend*100),sub:data.vendorArr[0].name.length>22?data.vendorArr[0].name.slice(0,21)+"…":data.vendorArr[0].name,accent:"#29B6F6"}]:[]),
                ].map(s=>(
                  <div key={s.label} style={{background:"#0a1729",borderRadius:12,padding:"12px 14px",border:"1px solid #1a3040",overflow:"hidden"}}>
                    <div style={{fontSize:10,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</div>
                    <div style={{fontSize:s.label==="Total Spend"?15:19,fontWeight:800,color:s.accent,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.value}</div>
                    {s.sub&&<div style={{fontSize:10,color:"#3a6a86",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.sub}</div>}
                  </div>
                ))}
              </div>

              {/* ── OVERVIEW TAB ── */}
              {activeTab==="overview"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr",gap:20}}>
                  {data.flags.length>0&&(
                    <div style={{background:"rgba(239,83,80,0.06)",border:"1px solid #EF535033",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
                      <div style={{fontSize:26}}>⚠️</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#e8f4ff",marginBottom:3}}>{highFlags} high-priority procurement concerns detected</div>
                        <div style={{fontSize:13,color:"#8ab4cc"}}>
                          {data.flags.map(f=>`${FLAG_ICONS[f.severity]} ${f.title.split("—")[0].trim()}`).join(" · ")}
                          {" "}<button onClick={()=>setActiveTab("flags")} style={{background:"none",border:"none",color:"#EF5350",cursor:"pointer",fontSize:13,fontWeight:700,padding:0}}>View all →</button>
                        </div>
                      </div>
                    </div>
<<<<<<< HEAD
=======
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                    <Card title="Top 15 Categories by Spend">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={top15C.map(x=>({...x,label:x.displayLabel,_pct:x.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:70,top:5,bottom:5}}>
                          <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                          <YAxis type="category" dataKey="label" width={155} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                          <Tooltip content={<Tip total={data.totalSpend}/>}/>
                          <Bar dataKey="total" radius={[0,5,5,0]} label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>}>
                            {top15C.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.9}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                    {/* #4 — pie chart: reduced outerRadius, raised cy, legend below with enough room */}
                    <Card title="Spend Distribution" subtitle="Share of total by category">
                      <div style={{width:"100%",height:440,position:"relative"}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{top:0,right:0,bottom:0,left:0}}>
                            <Pie data={pieData} cx="50%" cy="36%" outerRadius={105} dataKey="value" nameKey="name"
                              label={({percent})=>percent>0.04?`${(percent*100).toFixed(0)}%`:""}
                              labelLine={{stroke:"#1e3a4a",strokeWidth:1}}>
                              {pieData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} stroke="#0a1729" strokeWidth={2}/>)}
                            </Pie>
                            <Tooltip content={<Tip/>}/>
                            <Legend formatter={v=><span style={{color:"#8ab4cc",fontSize:9}}>{v}</span>} wrapperStyle={{paddingTop:4,fontSize:9}}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
>>>>>>> c158944 (v2.2)
                  </div>
                </div>
              )}

              {activeTab==="flags"&&(
                <div>
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:18,fontWeight:800,color:"#e8f4ff",marginBottom:6}}>Procurement Health Review</div>
                    <div style={{fontSize:13,color:"#5a8aaa"}}>{data.flags.length} concern{data.flags.length!==1?"s":""} detected · {data.flags.filter(f=>f.severity==="high").length} high · {data.flags.filter(f=>f.severity==="medium").length} medium · {data.flags.filter(f=>f.severity==="low").length} low</div>
                  </div>
                  {data.flags.length===0&&(<div style={{background:"rgba(0,196,159,0.07)",border:"1px solid #00C49F33",borderRadius:12,padding:"40px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>✅</div><div style={{fontSize:16,fontWeight:700,color:"#00C49F"}}>No significant procurement concerns detected</div></div>)}
                  {["high","medium","low","info"].map(sev=>{ const grp=data.flags.filter(f=>f.severity===sev); if(!grp.length) return null; const labels={high:"🔴 High Priority",medium:"🟠 Medium Priority",low:"🟡 Low Priority",info:"🔵 Informational"}; return(<div key={sev} style={{marginBottom:24}}><div style={{fontSize:13,fontWeight:700,color:FLAG_COLORS[sev],marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{labels[sev]}</div>{grp.map((f,i)=><FlagCard key={i} {...f} totalSpend={data.totalSpend}/>)}</div>); })}
                </div>
              )}

              {activeTab==="concentration"&&vc&&(()=>{
                // ── Traffic light helpers ──
                const trafficLight = (field, value) => {
                  if(field==="hhi")    return value>2500?"red":value>1500?"yellow":"green";
                  if(field==="v50")    return value<3?"red":value<=6?"yellow":"green";
                  if(field==="v75")    return value<6?"red":value<=12?"yellow":"green";
                  if(field==="v90")    return value<10?"red":value<=25?"yellow":"green";
                  return "green";
                };
                const tlColors = {red:"#EF5350",yellow:"#FFA726",green:"#00C49F"};
                const tlLabels = {red:"High Risk",yellow:"Moderate",green:"Healthy"};
                const TrafficLight = ({status}) => (
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,paddingTop:10,borderTop:"1px solid #1a3040"}}>
                    {["red","yellow","green"].map(c=>(
                      <div key={c} style={{width:11,height:11,borderRadius:"50%",flexShrink:0,
                        background: status===c ? tlColors[c] : "#0d1e2e",
                        boxShadow: status===c ? `0 0 7px ${tlColors[c]}99` : "none",
                        border: status===c ? `1px solid ${tlColors[c]}` : "1px solid #1e3a4a",
                        transition:"all 0.2s"}}/>
                    ))}
                    <span style={{fontSize:10,color:tlColors[status],fontWeight:700,marginLeft:4}}>{tlLabels[status]}</span>
                  </div>
                );

                // ── Lorenz curve computation ──
                // Convert cumulativeCurve (rank-based) → lorenz (% of vendor population)
                const totalVendors = vc.vendorArr.length;
                const lorenzData = vc.cumulativeCurve.map(p=>({
                  vendorPct: parseFloat(((p.rank/totalVendors)*100).toFixed(2)),
                  cumSpendPct: parseFloat(p.cumPct.toFixed(2)),
                  // healthy benchmark: follows Pareto — at x% vendors, spend ≈ x^0.5 * 100 scaled so 20%→80%
                  // We use a power curve: cumSpend = 100 * (vendorPct/100)^0.32
                  // At vendorPct=20: 100*(0.2)^0.32 = 100*0.598 ≈ 60... let's tune exponent
                  // Target: at 20% vendors → 80% spend. Solve: 80 = 100*(0.2)^e → e = log(0.8)/log(0.2) ≈ 0.139
                  healthyPct: parseFloat((100*Math.pow(p.rank/totalVendors, 0.139)).toFixed(2)),
                }));

                // Find Marker 1: at 20% of vendors, what is actual cumSpend?
                const marker1 = lorenzData.find(p=>p.vendorPct>=20) || lorenzData[lorenzData.length-1];
                const marker1Pct = marker1 ? marker1.cumSpendPct.toFixed(1) : "—";

                // Find Marker 2: where does actual curve first cross 80% spend?
                const marker2 = lorenzData.find(p=>p.cumSpendPct>=80);
                const marker2VendorPct = marker2 ? marker2.vendorPct.toFixed(1) : "—";

                // Option B: top 10 vendors % bar chart data
                const top10pct = vc.vendorArr.slice(0,10).map(v=>({
                  name: v.name.length>28?v.name.slice(0,27)+"…":v.name,
                  pct: parseFloat((v.pct).toFixed(2)),
                  // color by risk
                  color: v.pct>15?"#EF5350":v.pct>10?"#FFA726":"#00C49F",
                }));

                // Custom bar for Option B — color per bar
                const VendorPctBar = (props) => {
                  const {x,y,width,height,index} = props;
                  const item = top10pct[index];
                  if(!item) return null;
                  return <rect x={x} y={y} width={width} height={height} rx={4} fill={item.color} fillOpacity={0.85}/>;
                };
                const VendorPctLabel = (props) => {
                  const {x,y,width,value,index} = props;
                  const item = top10pct[index];
                  if(!item||width<20) return null;
                  return <text x={x+width+6} y={y+10} fill={item.color} fontSize={11} fontWeight={700} dominantBaseline="middle">{value.toFixed(1)}%</text>;
                };

                return(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

                  {/* ── 4 KPI cards with traffic lights ── */}
                  <div style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                    {[
                      {field:"hhi",  label:"HHI Score", value:vc.hhi.toFixed(0), sub:vc.hhi>2500?"Highly Concentrated":vc.hhi>1500?"Moderately Concentrated":"Competitive", accent:vc.hhi>2500?"#EF5350":vc.hhi>1500?"#FFA726":"#00C49F", numVal:vc.hhi, hhi:true},
                      {field:"v50",  label:"Vendors for 50% of Spend", value:vc.v50, sub:"higher = more diverse", accent:"#0088FE", numVal:vc.v50},
                      {field:"v75",  label:"Vendors for 75% of Spend", value:vc.v75, sub:"higher = more diverse", accent:"#FFBB28", numVal:vc.v75},
                      {field:"v90",  label:"Vendors for 90% of Spend", value:vc.v90, sub:`of ${data.vendorArr.length} total`, accent:"#FF8042", numVal:vc.v90},
                    ].map(s=>{
                      const status = trafficLight(s.field, s.numVal);
                      const borderCol = tlColors[status];
                      return(
                        <div key={s.label} style={{background:"#0a1729",borderRadius:12,padding:"14px 16px",border:`1px solid ${borderCol}33`,position:"relative"}}>
                          <div style={{fontSize:10,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5,display:"flex",alignItems:"center",gap:6}}>
                            {s.label}
                            {s.hhi&&(
                              <span style={{position:"relative",display:"inline-flex",alignItems:"center"}}
                                onMouseEnter={()=>setHhiTooltipVisible(true)}
                                onMouseLeave={()=>setHhiTooltipVisible(false)}>
                                <span style={{width:13,height:13,borderRadius:"50%",background:"#1e3a4a",border:"1px solid #2a5a7a",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#5a9ab8",cursor:"help",fontWeight:700,flexShrink:0}}>i</span>
                                {hhiTooltipVisible&&(
                                  <div style={{position:"absolute",left:"calc(100% + 10px)",top:"50%",transform:"translateY(-50%)",background:"#0d1e2e",border:"1px solid #2a4a5a",borderRadius:10,padding:"12px 14px",width:290,zIndex:200,pointerEvents:"none",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
                                    <div style={{fontSize:12,fontWeight:700,color:"#29B6F6",marginBottom:6}}>Herfindahl-Hirschman Index (HHI)</div>
                                    <div style={{fontSize:11,color:"#8ab4cc",lineHeight:1.6}}>The HHI measures market concentration by summing the squares of each vendor's percentage share of total spend. A score below 1,500 indicates a competitive market; 1,500–2,500 signals moderate concentration; above 2,500 is considered highly concentrated and may warrant regulatory attention. In this app, HHI is calculated across all vendors using their percentage of total dollar spend, producing a score from 0 to 10,000.</div>
                                    <div style={{position:"absolute",left:-6,top:"50%",transform:"translateY(-50%)",width:10,height:10,background:"#0d1e2e",borderLeft:"1px solid #2a4a5a",borderBottom:"1px solid #2a4a5a",rotate:"45deg"}}/>
                                  </div>
                                )}
                              </span>
                            )}
                          </div>
                          <div style={{fontSize:24,fontWeight:800,color:s.accent,marginBottom:2}}>{s.value}</div>
                          <div style={{fontSize:11,color:"#3a6a86",marginBottom:0}}>{s.sub}</div>
                          <TrafficLight status={status}/>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Option B: Top 10 Vendor Share Bar Chart ── */}
                  <Card title="Vendor Spend Concentration" subtitle="Each vendor's individual share of total spend">
                    <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:16,fontSize:11,flexWrap:"wrap"}}>
                      {[{c:"#EF5350",l:"Over 15% — risk"},{c:"#FFA726",l:"10–15% — caution"},{c:"#00C49F",l:"Under 10% — healthy"}].map(i=>(
                        <div key={i.l} style={{display:"flex",alignItems:"center",gap:5}}>
                          <div style={{width:9,height:9,borderRadius:"50%",background:i.c,flexShrink:0}}/>
                          <span style={{color:"#6a9ab8"}}>{i.l}</span>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={top10pct} layout="vertical" margin={{left:10,right:60,top:5,bottom:20}}>
                        <XAxis type="number" domain={[0,Math.max(40,Math.ceil(top10pct[0]?.pct||20/5)*5+5)]}
                          tickFormatter={v=>`${v}%`} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis type="category" dataKey="name" width={180} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                        <Tooltip formatter={(v)=>[`${v.toFixed(2)}% of total spend`,"Share"]} cursor={{fill:"#ffffff08"}}/>
                        {/* 15% risk ceiling line */}
                        <ReferenceLine x={15} stroke="#29B6F6" strokeWidth={1.5} strokeDasharray="5 3"
                          label={{value:"15% threshold",position:"top",fill:"#29B6F6",fontSize:10,fontWeight:700}}/>
                        {/* 10% caution line */}
                        <ReferenceLine x={10} stroke="#FFA72655" strokeWidth={1} strokeDasharray="3 3"/>
                        <Bar dataKey="pct" radius={[0,4,4,0]} shape={<VendorPctBar/>} label={<VendorPctLabel/>}/>
                      </BarChart>
                    </ResponsiveContainer>
                    {/* Risk zone note */}
                    <div style={{fontSize:11,color:"#3a6a86",marginTop:6,lineHeight:1.6}}>
                      Any vendor exceeding <span style={{color:"#29B6F6",fontWeight:700}}>15%</span> of total spend represents a single-source dependency risk. The <span style={{color:"#FFA726"}}>10% caution zone</span> is a watch threshold for emerging concentration.
                    </div>
                  </Card>

                  {/* ── Lorenz Curve ── */}
                  <Card title="Spend Concentration — Lorenz Curve" subtitle="How evenly is spend distributed across your vendor base?">
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={lorenzData} margin={{left:10,right:20,top:10,bottom:30}}>
                        <XAxis dataKey="vendorPct" type="number" domain={[0,100]}
                          tickFormatter={v=>`${v}%`}
                          tick={{fill:"#4a7a96",fontSize:10}} axisLine={false} tickLine={false}
                          label={{value:"% of Vendor Base (sorted: largest spend → smallest)",position:"insideBottom",fill:"#4a7a96",fontSize:10,offset:-18}}/>
                        <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fill:"#7aafc9",fontSize:10}} axisLine={false} tickLine={false}/>
                        <Tooltip
                          formatter={(v,name)=>[`${Number(v).toFixed(1)}%`, name==="cumSpendPct"?"Cumulative Spend":"Healthy Benchmark"]}
                          labelFormatter={l=>`Top ${Number(l).toFixed(1)}% of vendors`}
                          contentStyle={{background:"#0f1923",border:"1px solid #1e3a4a",borderRadius:8,fontSize:12}}/>
                        {/* Perfect equality diagonal — just two points */}
                        <Line type="linear" data={[{vendorPct:0,eq:0},{vendorPct:100,eq:100}]}
                          dataKey="eq" stroke="#1e3a4a" strokeWidth={1.5} strokeDasharray="6 4" dot={false} legendType="none"/>
                        {/* Healthy benchmark */}
                        <Line type="monotone" dataKey="healthyPct" stroke="#00C49F" strokeWidth={2}
                          strokeDasharray="7 4" dot={false} opacity={0.8}/>
                        {/* Actual curve */}
                        <Line type="monotone" dataKey="cumSpendPct" stroke="#EF5350" strokeWidth={3} dot={false}/>
                        {/* 80% spend horizontal reference */}
                        <ReferenceLine y={80} stroke="#FFA726" strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
                          label={{value:"80%",position:"insideTopRight",fill:"#FFA726",fontSize:10}}/>
                        {/* 20% vendor vertical reference */}
                        <ReferenceLine x={20} stroke="#29B6F6" strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
                          label={{value:"20%",position:"insideTopRight",fill:"#29B6F6",fontSize:10}}/>
                      </LineChart>
                    </ResponsiveContainer>

                    {/* Legend: 2 rows */}
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:10}}>
                      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                        {[
                          {style:{width:22,height:3,background:"#EF5350",borderRadius:2},label:"Your data"},
                          {style:{width:22,height:0,borderTop:"2px dashed #00C49F"},label:"Healthy benchmark (Pareto 80/20)"},
                          {style:{width:22,height:0,borderTop:"2px dashed #1e3a4a"},label:"Perfect equality (theoretical)"},
                        ].map(i=>(
                          <div key={i.label} style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#8ab4cc"}}>
                            <div style={i.style}/>
                            {i.label}
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                        {[
                          {dot:{border:"2px solid #29B6F6",background:"#29B6F6"},label:"① 20% vendor line — your top 20% vendor spend distribution"},
                          {dot:{border:"2px solid #FFA726",background:"#FFA726"},label:"② 80% spend crossover — your distribution of vendors at 80% of spend"},
                        ].map(i=>(
                          <div key={i.label} style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#8ab4cc"}}>
                            <div style={{width:12,height:12,borderRadius:"50%",flexShrink:0,...i.dot}}/>
                            {i.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Marker summary cards */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
                      <div style={{background:"rgba(41,182,246,0.08)",border:"1px solid #29B6F633",borderRadius:8,padding:"11px 14px"}}>
                        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#29B6F6",marginBottom:4}}>① 20% Vendor Mark</div>
                        <div style={{fontSize:20,fontWeight:800,color:"#29B6F6",marginBottom:4}}>{marker1Pct}%</div>
                        <div style={{fontSize:11,color:"#8ab4cc",lineHeight:1.5}}>
                          of spend is controlled by your top 20% of vendors.{" "}
                          <span style={{color:"#00C49F"}}>A healthy portfolio sits at 80% spend from 20% of vendors.</span>{" "}
                          {parseFloat(marker1Pct)>80&&<span style={{color:"#EF5350"}}>You are significantly less diversified.</span>}
                          {parseFloat(marker1Pct)<=80&&<span style={{color:"#00C49F"}}>Your portfolio is well diversified.</span>}
                        </div>
                      </div>
                      <div style={{background:"rgba(255,167,38,0.08)",border:"1px solid #FFA72633",borderRadius:8,padding:"11px 14px"}}>
                        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#FFA726",marginBottom:4}}>② 80% Spend Crossover</div>
                        <div style={{fontSize:20,fontWeight:800,color:"#FFA726",marginBottom:4}}>{marker2VendorPct}%</div>
                        <div style={{fontSize:11,color:"#8ab4cc",lineHeight:1.5}}>
                          of your vendors account for 80% of total spend.{" "}
                          <span style={{color:"#00C49F"}}>A healthy portfolio reaches 80% at the 20% vendor mark.</span>{" "}
                          {parseFloat(marker2VendorPct)<20&&<span style={{color:"#EF5350"}}>Yours gets there {(20/parseFloat(marker2VendorPct)).toFixed(1)}× sooner.</span>}
                          {parseFloat(marker2VendorPct)>=20&&<span style={{color:"#00C49F"}}>Your portfolio meets the benchmark.</span>}
                        </div>
                      </div>
                    </div>

                    {/* How to read */}
                    <div style={{fontSize:11,color:"#5a8aaa",lineHeight:1.75,marginTop:14,paddingTop:12,borderTop:"1px solid #1a3040"}}>
                      <strong style={{color:"#c8dcea"}}>How to read:</strong> The X-axis is your entire vendor base as a percentage, sorted largest to smallest spend amounts. The Y-axis is cumulative spend percentage. The steeper the curve hugs the top-left corner, the less diversified your spend. The <span style={{color:"#00C49F"}}>green dashed benchmark</span> shows a healthy Pareto portfolio where top 20% of vendors = 80% of spend. The <span style={{color:"#5a8aaa"}}>diagonal</span> is a theoretical extreme where every vendor is identical — useful only as a reference anchor, not a real target.
                    </div>
                  </Card>
                </div>
                );
              })()}

              {/* #5 — Categories: dual X-axis */}
              {activeTab==="categories"&&(
                <Card title="All Categories — Full Spend Breakdown" subtitle={`${data.classArr.length} categories matched`} span2>
                  <ResponsiveContainer width="100%" height={Math.max(500,data.classArr.length*26)}>
                    <BarChart data={data.classArr.map(x=>({...x,label:x.displayLabel,_pct:x.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:20,bottom:5}}>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="bottom" orientation="bottom"/>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="top" orientation="top"/>
                      <YAxis type="category" dataKey="label" width={160} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip total={data.totalSpend}/>}/>
                      <Bar dataKey="total" radius={[0,5,5,0]} label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>} xAxisId="bottom">
                        {data.classArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

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

              {activeTab==="vendors"&&data.hasVendor&&(
                <Card title="Top 15 Vendors by Spend" span2>
                  <ResponsiveContainer width="100%" height={440}>
                    <BarChart data={top15V.map(v=>({...v,_pct:v.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:20,bottom:5}}>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="bottom" orientation="bottom"/>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="top" orientation="top"/>
                      <YAxis type="category" dataKey="name" width={200} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip total={data.totalSpend}/>}/>
                      <Bar dataKey="total" radius={[0,5,5,0]} label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>} xAxisId="bottom">
                        {top15V.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {activeTab==="departments"&&data.hasDept&&(
                <Card title="Spend by Department" span2>
                  <ResponsiveContainer width="100%" height={Math.max(430,data.deptArr.length*28)}>
                    <BarChart data={data.deptArr.map(d=>({...d,_pct:d.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:5,bottom:5}}>
                      <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="name" width={180} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip total={data.totalSpend}/>}/>
                      <Bar dataKey="total" radius={[0,5,5,0]} label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>}>
                        {data.deptArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* #6 — Timeline: % on bars, avg line red */}
              {activeTab==="timeline"&&data.hasDate&&(
                <Card title="Monthly Spend" subtitle="Total procurement spend by month" span2>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={data.monthArr} margin={{left:10,right:20,top:24,bottom:20}}>
                      <XAxis dataKey="month" tick={{fill:"#8ab4cc",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tickFormatter={fmt} tick={{fill:"#8ab4cc",fontSize:11}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip total={data.totalSpend}/>}/>
                      {/* #6 — avg line red, bold label */}
                      <ReferenceLine y={data.totalSpend/data.monthArr.length} stroke="#EF535099" strokeDasharray="4 4"
                        label={{value:`Avg ${fmt(data.totalSpend/data.monthArr.length)}`,position:"insideTopRight",fill:"#EF5350",fontSize:12,fontWeight:700}}/>
                      <Bar dataKey="total" radius={[5,5,0,0]}>
                        {data.monthArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                        {/* #6 — % label on top of each bar */}
                        <LabelList content={<TimelinePctLabel total={data.totalSpend}/>}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {activeTab==="table"&&(
                <Card title="Full Category Table" subtitle="All categories with spend breakdown" span2>
                  <input placeholder="Search category name or code…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{width:"100%",boxSizing:"border-box",marginBottom:14,background:"#0d1e2e",border:"1px solid #1e3a4a",borderRadius:8,padding:"9px 14px",color:"#c8dcea",fontSize:13,outline:"none"}}/>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead><tr>{["#","Class","Description","Total Spend","% Spend","Txns","Avg/Txn"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 12px",color:"#4a7a96",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #1a3040",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filtered.map(row=>{ const rank=data.classArr.indexOf(row)+1; const spendPct=row.total/data.totalSpend*100; return(
                          <tr key={row.classCode+row.label} style={{borderBottom:"1px solid #101e2e"}} onMouseOver={e=>e.currentTarget.style.background="#0d1e2e"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                            <td style={{textAlign:"center",padding:"9px 12px",color:"#3a6a86"}}>{rank}</td>
                            <td style={{textAlign:"center",padding:"9px 12px"}}><span style={{background:"#0d1e2e",borderRadius:5,padding:"2px 8px",fontSize:12,color:"#5a9aaa",border:"1px solid #1e3a4a",fontWeight:700}}>{row.classCode}</span></td>
                            <td style={{padding:"9px 12px",color:"#c8dcea",fontWeight:500,maxWidth:300}}>{toTC(row.label)}</td>
                            <td style={{padding:"9px 12px",color:"#00C49F",fontWeight:700,whiteSpace:"nowrap"}}>{fmtFull(row.total)}</td>
                            <td style={{padding:"9px 12px",minWidth:130}}><PctBar pct={spendPct} color={PALETTE[rank%PALETTE.length]} width={70}/></td>
                            <td style={{padding:"9px 12px",color:"#8ab4cc"}}>{row.count.toLocaleString()}</td>
                            <td style={{padding:"9px 12px",color:"#8ab4cc",whiteSpace:"nowrap"}}>{fmtFull(row.total/row.count)}</td>
                          </tr>
                        ); })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

<<<<<<< HEAD
          {activeTab==="flags"&&(
            <div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:18,fontWeight:800,color:"#e8f4ff",marginBottom:6}}>Procurement Health Review</div>
                <div style={{fontSize:13,color:"#5a8aaa"}}>{data.flags.length} concern{data.flags.length!==1?"s":""} detected · {data.flags.filter(f=>f.severity==="high").length} high · {data.flags.filter(f=>f.severity==="medium").length} medium · {data.flags.filter(f=>f.severity==="low").length} low · {data.flags.filter(f=>f.severity==="info").length} informational.</div>
              </div>
              {data.flags.length===0&&(<div style={{background:"rgba(0,196,159,0.07)",border:"1px solid #00C49F33",borderRadius:12,padding:"40px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>✅</div><div style={{fontSize:16,fontWeight:700,color:"#00C49F"}}>No significant procurement concerns detected</div></div>)}
              {["high","medium","low","info"].map(sev=>{ const grp=data.flags.filter(f=>f.severity===sev); if(!grp.length) return null; const labels={high:"🔴 High Priority",medium:"🟠 Medium Priority",low:"🟡 Low Priority",info:"🔵 Informational"}; return(<div key={sev} style={{marginBottom:24}}><div style={{fontSize:13,fontWeight:700,color:FLAG_COLORS[sev],marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{labels[sev]}</div>{grp.map((f,i)=><FlagCard key={i} {...f} totalSpend={data.totalSpend}/>)}</div>); })}
            </div>
          )}

          {activeTab==="concentration"&&vc&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <div style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                {[
                  // #9 — HHI card with tooltip
                  {label:"HHI Score",value:vc.hhi.toFixed(0),sub:vc.hhi>2500?"Highly Concentrated":vc.hhi>1500?"Moderately Concentrated":"Competitive",accent:vc.hhi>2500?"#EF5350":vc.hhi>1500?"#FFA726":"#00C49F",hhi:true},
                  {label:"Vendors for 50% of Spend",value:vc.v50,sub:"higher = more diverse",accent:"#0088FE"},
                  {label:"Vendors for 75% of Spend",value:vc.v75,sub:"higher = more diverse",accent:"#FFBB28"},
                  {label:"Vendors for 90% of Spend",value:vc.v90,sub:`of ${data.vendorArr.length} total`,accent:"#FF8042"},
                ].map(s=>(
                  <div key={s.label} style={{background:"#0a1729",borderRadius:12,padding:"14px 16px",border:"1px solid #1a3040",position:"relative"}}>
                    <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5,display:"flex",alignItems:"center",gap:6}}>
                      {s.label}
                      {s.hhi&&(
                        <span style={{position:"relative",display:"inline-flex",alignItems:"center"}}
                          onMouseEnter={()=>setHhiTooltipVisible(true)}
                          onMouseLeave={()=>setHhiTooltipVisible(false)}>
                          {/* #9 — info icon */}
                          <span style={{width:14,height:14,borderRadius:"50%",background:"#1e3a4a",border:"1px solid #2a5a7a",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#5a9ab8",cursor:"help",fontWeight:700,flexShrink:0}}>i</span>
                          {hhiTooltipVisible&&(
                            <div style={{position:"absolute",left:"50%",bottom:"calc(100% + 8px)",transform:"translateX(-50%)",background:"#0d1e2e",border:"1px solid #2a4a5a",borderRadius:10,padding:"12px 14px",width:280,zIndex:100,pointerEvents:"none",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                              <div style={{fontSize:12,fontWeight:700,color:"#29B6F6",marginBottom:6}}>Herfindahl-Hirschman Index (HHI)</div>
                              <div style={{fontSize:11,color:"#8ab4cc",lineHeight:1.6}}>
                                The HHI measures market concentration by summing the squares of each vendor's percentage share of total spend. A score below 1,500 indicates a competitive market; 1,500–2,500 signals moderate concentration; above 2,500 is considered highly concentrated and may warrant regulatory attention. In this app, HHI is calculated across all vendors using their percentage of total dollar spend, then summed to produce a single score from 0 to 10,000.
                              </div>
                              <div style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",width:10,height:10,background:"#0d1e2e",borderRight:"1px solid #2a4a5a",borderBottom:"1px solid #2a4a5a",rotate:"45deg"}}/>
                            </div>
                          )}
                        </span>
                      )}
                    </div>
                    <div style={{fontSize:24,fontWeight:800,color:s.accent,marginBottom:2}}>{s.value}</div>
                    <div style={{fontSize:11,color:"#3a6a86"}}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <Card title="Top 15 Vendors by Spend">
                {/* #11 — dual X-axis top + bottom */}
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={top15V.map(v=>({...v,_pct:v.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:70,top:20,bottom:5}}>
                    <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="bottom" orientation="bottom"/>
                    <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="top" orientation="top"/>
                    <YAxis type="category" dataKey="name" width={185} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<Tip total={data.totalSpend}/>}/>
                    <Bar dataKey="total" radius={[0,5,5,0]} label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>} xAxisId="bottom">
                      {top15V.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              {/* #10 — best practice dot on concentration curve */}
              <Card title="Spend Concentration Curve">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={vc.cumulativeCurve.slice(0,Math.min(50,vc.cumulativeCurve.length))} margin={{left:10,right:20,top:10,bottom:20}}>
                    <XAxis dataKey="rank" label={{value:"Vendor Rank",position:"insideBottom",fill:"#4a7a96",fontSize:11,offset:-5}} tick={{fill:"#4a7a96",fontSize:10}}/>
                    <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fill:"#7aafc9",fontSize:11}} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={(v)=>[`${v.toFixed(1)}%`,"Cumulative Spend"]} labelFormatter={l=>`Vendor #${l}`}/>
                    <ReferenceLine y={50} stroke="#00C49F44" strokeDasharray="4 4" label={{value:"50%",fill:"#00C49F",fontSize:11}}/>
                    <ReferenceLine y={80} stroke="#FFA72644" strokeDasharray="4 4" label={{value:"80%",fill:"#FFA726",fontSize:11}}/>
                    {/* #10 — best practice reference: healthy = top 10 vendors = 80% of spend */}
                    <ReferenceLine x={10} stroke="#29B6F633" strokeDasharray="4 4" label={{value:"Best Practice",fill:"#29B6F6",fontSize:10,position:"insideTopRight"}}/>
                    <Line type="monotone" dataKey="cumPct" stroke="#0088FE" strokeWidth={2} dot={false}/>
                    {/* Best practice dot — rendered as a custom dot at x=10, y=80 */}
                  </LineChart>
                </ResponsiveContainer>
                <div style={{fontSize:11,color:"#3a6a86",marginTop:8,lineHeight:1.5}}>
                  <span style={{color:"#29B6F6",fontWeight:700}}>●</span> Best practice: Top 10 vendors account for ~80% of spend in a healthy procurement portfolio.
                </div>
              </Card>
            </div>
          )}

          {activeTab==="categories"&&(
            // #11 — dual X-axis top + bottom
            <Card title="All Categories — Full Spend Breakdown" subtitle={`${data.classArr.length} categories matched`} span2>
              <ResponsiveContainer width="100%" height={Math.max(500,data.classArr.length*26)}>
                <BarChart data={data.classArr.map(x=>({...x,label:x.displayLabel,_pct:x.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:20,bottom:5}}>
                  <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="bottom" orientation="bottom"/>
                  <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="top" orientation="top"/>
                  <YAxis type="category" dataKey="label" width={160} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip total={data.totalSpend}/>}/>
                  <Bar dataKey="total" radius={[0,5,5,0]} label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>} xAxisId="bottom">
                    {data.classArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {activeTab==="treemap"&&(
            <Card title="Spend Treemap" subtitle="Area proportional to dollar volume · top 30 categories" span2>
              {(()=>{ _treemapTotal = data.totalSpend; return null; })()}
              <ResponsiveContainer width="100%" height={540}>
                <Treemap data={treemapData} dataKey="size" aspectRatio={16/9} content={<TreeCell/>}>
                  <Tooltip formatter={(v,n,p)=>[`${fmtFull(v)} · ${(v/data.totalSpend*100).toFixed(1)}%`,p.payload?.name||n]}/>
                </Treemap>
              </ResponsiveContainer>
            </Card>
          )}

          {activeTab==="vendors"&&data.hasVendor&&(
            // #11 — dual X-axis
            <Card title="Top 15 Vendors by Spend" span2>
              <ResponsiveContainer width="100%" height={440}>
                <BarChart data={top15V.map(v=>({...v,_pct:v.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:20,bottom:5}}>
                  <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="bottom" orientation="bottom"/>
                  <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false} xAxisId="top" orientation="top"/>
                  <YAxis type="category" dataKey="name" width={200} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip total={data.totalSpend}/>}/>
                  <Bar dataKey="total" radius={[0,5,5,0]} label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>} xAxisId="bottom">
                    {top15V.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {activeTab==="departments"&&data.hasDept&&(
            <Card title="Spend by Department" span2>
              <ResponsiveContainer width="100%" height={Math.max(430,data.deptArr.length*28)}>
                <BarChart data={data.deptArr.map(d=>({...d,_pct:d.total/data.totalSpend*100}))} layout="vertical" margin={{left:10,right:80,top:5,bottom:5}}>
                  <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={180} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip total={data.totalSpend}/>}/>
                  <Bar dataKey="total" radius={[0,5,5,0]} label={<PctBarLabel total={data.totalSpend} color="#5a8aaa"/>}>
                    {data.deptArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* #12 — Timeline: brighter avg label and Y-axis */}
          {activeTab==="timeline"&&data.hasDate&&(
            <Card title="Monthly Spend" subtitle="Total procurement spend by month" span2>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={data.monthArr} margin={{left:10,right:20,top:5,bottom:20}}>
                  <XAxis dataKey="month" tick={{fill:"#8ab4cc",fontSize:11}} axisLine={false} tickLine={false}/>
                  {/* #12 — brighter Y-axis tick color */}
                  <YAxis tickFormatter={fmt} tick={{fill:"#8ab4cc",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip total={data.totalSpend}/>}/>
                  {/* #12 — more prominent avg label */}
                  <ReferenceLine y={data.totalSpend/data.monthArr.length} stroke="#00C49F99" strokeDasharray="4 4"
                    label={{value:`Avg ${fmt(data.totalSpend/data.monthArr.length)}`,position:"insideTopRight",fill:"#00C49F",fontSize:12,fontWeight:700}}/>
                  <Bar dataKey="total" radius={[5,5,0,0]}>{data.monthArr.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.85}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {activeTab==="table"&&(
            <Card title="Full Category Table" subtitle="All categories with spend breakdown" span2>
              <input placeholder="Search category name or code…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{width:"100%",boxSizing:"border-box",marginBottom:14,background:"#0d1e2e",border:"1px solid #1e3a4a",borderRadius:8,padding:"9px 14px",color:"#c8dcea",fontSize:13,outline:"none"}}/>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr>{["#","Class","Description","Total Spend","% Spend","Txns","Avg/Txn"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 12px",color:"#4a7a96",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #1a3040",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filtered.map(row=>{ const rank=data.classArr.indexOf(row)+1; const spendPct=row.total/data.totalSpend*100; return(
                      <tr key={row.classCode+row.label} style={{borderBottom:"1px solid #101e2e"}} onMouseOver={e=>e.currentTarget.style.background="#0d1e2e"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{textAlign:"center",padding:"9px 12px",color:"#3a6a86"}}>{rank}</td>
                        <td style={{textAlign:"center",padding:"9px 12px"}}><span style={{background:"#0d1e2e",borderRadius:5,padding:"2px 8px",fontSize:12,color:"#5a9aaa",border:"1px solid #1e3a4a",fontWeight:700}}>{row.classCode}</span></td>
                        <td style={{padding:"9px 12px",color:"#c8dcea",fontWeight:500,maxWidth:300}}>{toTC(row.label)}</td>
                        <td style={{padding:"9px 12px",color:"#00C49F",fontWeight:700,whiteSpace:"nowrap"}}>{fmtFull(row.total)}</td>
                        <td style={{padding:"9px 12px",minWidth:130}}><PctBar pct={spendPct} color={PALETTE[rank%PALETTE.length]} width={70}/></td>
                        <td style={{padding:"9px 12px",color:"#8ab4cc"}}>{row.count.toLocaleString()}</td>
                        <td style={{padding:"9px 12px",color:"#8ab4cc",whiteSpace:"nowrap"}}>{fmtFull(row.total/row.count)}</td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab==="cleanup"&&(
            <div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:18,fontWeight:800,color:"#e8f4ff",marginBottom:6}}>Data Quality — Code Cleanup</div>
                <div style={{fontSize:13,color:"#5a8aaa"}}>{data.dirtyRows.length.toLocaleString()} transactions could not be fully classified due to missing, malformed, or unrecognized codes.</div>
              </div>
              <div style={{background:"#0a1729",borderRadius:14,padding:"20px 22px",border:"1px solid #1a3040"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead><tr>{["Issue","Raw Code","Description","Vendor","Spend"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#4a7a96",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #1a3040"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {data.dirtyRows.slice(0,100).map((row,i)=>{ const ic={"Missing Code":"#EF5350","Code Too Short":"#FFA726","Unrecognized Class":"#FFBB28"}[row.issue]||"#8ab4cc"; return(
                        <tr key={i} style={{borderBottom:"1px solid #101e2e"}} onMouseOver={e=>e.currentTarget.style.background="#0d1e2e"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{padding:"9px 12px"}}><span style={{background:`${ic}15`,borderRadius:5,padding:"2px 8px",fontSize:11,color:ic,border:`1px solid ${ic}44`}}>{row.issue}</span></td>
                          <td style={{padding:"9px 12px"}}><span style={{background:"#0d1e2e",borderRadius:5,padding:"2px 7px",fontSize:11,color:"#FFBB28",border:"1px solid #FFBB2833",fontWeight:700}}>{row.rawCode}</span></td>
                          <td style={{padding:"9px 12px",color:"#c8dcea",maxWidth:220,fontSize:12}}>{String(row.description||"—").slice(0,55)}</td>
                          <td style={{padding:"9px 12px",color:"#8ab4cc",maxWidth:160,fontSize:12}}>{String(row.vendor||"—").slice(0,35)}</td>
                          <td style={{padding:"9px 12px",color:"#00C49F",fontWeight:700,whiteSpace:"nowrap"}}>{fmtFull(row.amount)}</td>
                        </tr>
                      ); })}
                    </tbody>
                  </table>
                  {data.dirtyRows.length>100&&<div style={{textAlign:"center",padding:"14px",fontSize:12,color:"#3a6a86"}}>Showing first 100 of {data.dirtyRows.length.toLocaleString()} rows</div>}
                </div>
              </div>
            </div>
          )}

          {/* #13 — Local Spend with dynamic city/state labels */}
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
              return {localTotal,nonLocalTotal:data.totalSpend-localTotal,localPct,nonLocalPct:100-localPct,localVendors:localVendors.size,localTxns:localRows.length,nonLocalTxns:nonLocalRows.length,value};
            })():null;
            // #13 — dynamic label
            const areaName = ls ? ls.value : "—";
            return(
              <div>
                <div style={{background:"#0a1729",border:"1px solid #1a3040",borderRadius:14,padding:"20px 24px",marginBottom:20}}>
                  <div style={{fontSize:15,fontWeight:700,color:"#d0e8f5",marginBottom:12}}>Local Spend Analysis</div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end"}}>
                    <div style={{display:"flex",background:"#0d1e2e",borderRadius:9,border:"1px solid #1a3040",overflow:"hidden"}}>
                      {[{val:"city",label:"🏙 City",avail:hasCity},{val:"state",label:"🗺 State",avail:hasState}].map(opt=>(
                        <button key={opt.val} onClick={()=>{if(opt.avail){setLocalViewBy(opt.val);setLocalSelected("");}}} disabled={!opt.avail}
                          style={{padding:"9px 22px",fontSize:13,fontWeight:700,cursor:opt.avail?"pointer":"not-allowed",border:"none",fontFamily:"inherit",opacity:opt.avail?1:0.35,background:localViewBy===opt.val&&opt.avail?"rgba(102,187,106,0.15)":"transparent",color:localViewBy===opt.val&&opt.avail?"#66BB6A":"#4a7a96"}}>{opt.label}</button>
                      ))}
                    </div>
                    <select value={localSelected} onChange={e=>setLocalSelected(e.target.value)} disabled={dropdownOptions.length===0}
                      style={{background:"#0d1e2e",border:"1px solid #2a4a5a",borderRadius:8,padding:"9px 14px",color:localSelected?"#d0e8f5":"#5a8aaa",fontSize:13,fontFamily:"inherit",cursor:"pointer",outline:"none",minWidth:200}}>
                      <option value="">— Choose a {localViewBy==="city"?"city":"state"} —</option>
                      {dropdownOptions.map(v=><option key={v} value={v}>{v}</option>)}
                    </select>
                    <button onClick={()=>{if(localSelected) setLocalApplied({viewBy:localViewBy,value:localSelected});}} disabled={!localSelected}
                      style={{background:localSelected?"linear-gradient(135deg,#66BB6A,#29B6F6)":"#1a3040",border:"none",color:localSelected?"#fff":"#3a6a86",borderRadius:8,padding:"9px 22px",fontSize:13,fontWeight:700,cursor:localSelected?"pointer":"not-allowed",fontFamily:"inherit"}}>Apply →</button>
                    {localApplied&&<button onClick={()=>{setLocalApplied(null);setLocalSelected("");}} style={{background:"transparent",border:"1px solid #1e3a4a",color:"#5a8aaa",borderRadius:8,padding:"9px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Reset</button>}
                  </div>
                </div>
                {!localApplied&&<div style={{background:"rgba(102,187,106,0.05)",border:"1px solid #66BB6A22",borderRadius:14,padding:"60px 40px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:14}}>📍</div><div style={{fontSize:17,fontWeight:700,color:"#d0e8f5",marginBottom:8}}>Select a local area to begin</div></div>}
                {ls&&(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                    {[
                      // #13 — dynamic labels using areaName
                      {label:`In ${areaName}`,val:fmtFull(ls.localTotal),pill:`${ls.localPct.toFixed(1)}%`,accent:"#66BB6A"},
                      {label:`Out of ${areaName}`,val:fmtFull(ls.nonLocalTotal),pill:`${ls.nonLocalPct.toFixed(1)}%`,accent:"#EF5350"},
                      {label:`Vendors in ${areaName}`,val:ls.localVendors,pill:`${ls.localTxns.toLocaleString()} txns`,accent:"#FFBB28"},
                      {label:`TXNs out of ${areaName}`,val:ls.nonLocalTxns.toLocaleString(),pill:`${ls.nonLocalPct.toFixed(1)}% of txns`,accent:"#FFA726"},
                    ].map(k=>(
                      <div key={k.label} style={{background:"#0a1729",border:"1px solid #1a3040",borderRadius:14,padding:"18px 20px"}}>
                        <div style={{fontSize:11,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,fontWeight:600,lineHeight:1.3}}>{k.label}</div>
                        <div style={{fontSize:22,fontWeight:800,color:k.accent,marginBottom:5}}>{k.val}</div>
                        <div style={{fontSize:12,color:"#5a8aaa"}}>{k.pill}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── AI CPO BRIEFING (#14) ── */}
          {activeTab==="aibriefing"&&(
            <div>
              <div style={{marginBottom:24,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
=======
              {activeTab==="cleanup"&&(
>>>>>>> c158944 (v2.2)
                <div>
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:18,fontWeight:800,color:"#e8f4ff",marginBottom:6}}>Data Quality — Code Cleanup</div>
                    <div style={{fontSize:13,color:"#5a8aaa"}}>{data.dirtyRows.length.toLocaleString()} transactions could not be fully classified.</div>
                  </div>
                  <div style={{background:"#0a1729",borderRadius:14,padding:"20px 22px",border:"1px solid #1a3040"}}>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                        <thead><tr>{["Issue","Raw Code","Description","Vendor","Spend"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#4a7a96",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid #1a3040"}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {data.dirtyRows.slice(0,100).map((row,i)=>{ const ic={"Missing Code":"#EF5350","Code Too Short":"#FFA726","Unrecognized Class":"#FFBB28"}[row.issue]||"#8ab4cc"; return(
                            <tr key={i} style={{borderBottom:"1px solid #101e2e"}} onMouseOver={e=>e.currentTarget.style.background="#0d1e2e"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                              <td style={{padding:"9px 12px"}}><span style={{background:`${ic}15`,borderRadius:5,padding:"2px 8px",fontSize:11,color:ic,border:`1px solid ${ic}44`}}>{row.issue}</span></td>
                              <td style={{padding:"9px 12px"}}><span style={{background:"#0d1e2e",borderRadius:5,padding:"2px 7px",fontSize:11,color:"#FFBB28",border:"1px solid #FFBB2833",fontWeight:700}}>{row.rawCode}</span></td>
                              <td style={{padding:"9px 12px",color:"#c8dcea",maxWidth:220,fontSize:12}}>{String(row.description||"—").slice(0,55)}</td>
                              <td style={{padding:"9px 12px",color:"#8ab4cc",maxWidth:160,fontSize:12}}>{String(row.vendor||"—").slice(0,35)}</td>
                              <td style={{padding:"9px 12px",color:"#00C49F",fontWeight:700,whiteSpace:"nowrap"}}>{fmtFull(row.amount)}</td>
                            </tr>
                          ); })}
                        </tbody>
                      </table>
                      {data.dirtyRows.length>100&&<div style={{textAlign:"center",padding:"14px",fontSize:12,color:"#3a6a86"}}>Showing first 100 of {data.dirtyRows.length.toLocaleString()} rows</div>}
                    </div>
                  </div>
                </div>
              )}

<<<<<<< HEAD
              {/* #14 — updated labels */}
              {!aiResult&&!aiLoading&&!aiError&&(
                <div style={{background:"#0a1729",border:"1px dashed #A45CFF33",borderRadius:16,padding:"60px 40px",textAlign:"center"}}>
                  <div style={{fontSize:42,marginBottom:16}}>📋</div>
                  <div style={{fontSize:17,fontWeight:700,color:"#d0e8f5",marginBottom:8}}>Ready to generate your CPO briefing</div>
                  <div style={{fontSize:13,color:"#4a7a96",maxWidth:480,margin:"0 auto",lineHeight:1.6}}>
                    Click <strong style={{color:"#C47CFF"}}>Generate Executive Briefing</strong> to have Claude AI analyze your {data.txCount.toLocaleString()} transactions and produce a board-ready executive summary.
                  </div>
                  <div style={{marginTop:20,display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",fontSize:12,color:"#3a6a86"}}>
                    {/* #14a — ~30 seconds */}
                    <span style={{background:"#0d1e2e",padding:"5px 12px",borderRadius:6,border:"1px solid #1a3040"}}>~30 seconds to generate</span>
                    {/* #14b — ~$0.02 per briefing */}
                    <span style={{background:"#0d1e2e",padding:"5px 12px",borderRadius:6,border:"1px solid #1a3040"}}>~$0.02 per briefing</span>
                    {/* #14c — Board-ready PDF export */}
                    <span style={{background:"#0d1e2e",padding:"5px 12px",borderRadius:6,border:"1px solid #1a3040"}}>Board-ready PDF export</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer row */}
          <div style={{marginTop:14,fontSize:12,color:"#2a4a5a",textAlign:"center"}}>
            {fileName} · {data.rowCount.toLocaleString()} rows · {data.txCount.toLocaleString()} valid transactions · {data.skipped} skipped
          </div>

        </div>{/* end content area */}
      </div>{/* end main layout */}
=======
              {/* #7 — Local Spend: restored 4 cards + pie chart + bar chart */}
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
                  // top categories within local spend
                  const localCats={};
                  for(const r of localRows){ const {classCode,label}=resolveNIGP(r[mapping.nigp]); const dl=shortLabel(label); if(!localCats[dl]) localCats[dl]={name:dl,value:0}; localCats[dl].value+=r._amt; }
                  const topLocalCats=Object.values(localCats).sort((a,b)=>b.value-a.value).slice(0,8);
                  return {localTotal,nonLocalTotal:data.totalSpend-localTotal,localPct,nonLocalPct:100-localPct,localVendors:localVendors.size,localTxns:localRows.length,nonLocalTxns:nonLocalRows.length,value,topLocalCats};
                })():null;
                const areaName=ls?ls.value:"—";
                return(
                  <div>
                    <div style={{background:"#0a1729",border:"1px solid #1a3040",borderRadius:14,padding:"18px 22px",marginBottom:20}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#d0e8f5",marginBottom:12}}>Local Spend Analysis</div>
                      <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-end"}}>
                        <div style={{display:"flex",background:"#0d1e2e",borderRadius:8,border:"1px solid #1a3040",overflow:"hidden"}}>
                          {[{val:"city",label:"🏙 City",avail:hasCity},{val:"state",label:"🗺 State",avail:hasState}].map(opt=>(
                            <button key={opt.val} onClick={()=>{if(opt.avail){setLocalViewBy(opt.val);setLocalSelected("");}}} disabled={!opt.avail}
                              style={{padding:"8px 18px",fontSize:12,fontWeight:700,cursor:opt.avail?"pointer":"not-allowed",border:"none",fontFamily:"inherit",opacity:opt.avail?1:0.35,background:localViewBy===opt.val&&opt.avail?"rgba(102,187,106,0.15)":"transparent",color:localViewBy===opt.val&&opt.avail?"#66BB6A":"#4a7a96"}}>{opt.label}</button>
                          ))}
                        </div>
                        <select value={localSelected} onChange={e=>setLocalSelected(e.target.value)} disabled={dropdownOptions.length===0}
                          style={{background:"#0d1e2e",border:"1px solid #2a4a5a",borderRadius:8,padding:"8px 12px",color:localSelected?"#d0e8f5":"#5a8aaa",fontSize:13,fontFamily:"inherit",cursor:"pointer",outline:"none",minWidth:180}}>
                          <option value="">— Choose a {localViewBy==="city"?"city":"state"} —</option>
                          {dropdownOptions.map(v=><option key={v} value={v}>{v}</option>)}
                        </select>
                        <button onClick={()=>{if(localSelected) setLocalApplied({viewBy:localViewBy,value:localSelected});}} disabled={!localSelected}
                          style={{background:localSelected?"linear-gradient(135deg,#66BB6A,#29B6F6)":"#1a3040",border:"none",color:localSelected?"#fff":"#3a6a86",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:localSelected?"pointer":"not-allowed",fontFamily:"inherit"}}>Apply →</button>
                        {localApplied&&<button onClick={()=>{setLocalApplied(null);setLocalSelected("");}} style={{background:"transparent",border:"1px solid #1e3a4a",color:"#5a8aaa",borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Reset</button>}
                      </div>
                    </div>

                    {!localApplied&&<div style={{background:"rgba(102,187,106,0.05)",border:"1px solid #66BB6A22",borderRadius:14,padding:"60px 40px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:14}}>📍</div><div style={{fontSize:17,fontWeight:700,color:"#d0e8f5",marginBottom:8}}>Select a local area to begin</div></div>}

                    {ls&&(
                      <>
                        {/* 4 KPI cards */}
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
                          {[
                            {label:`In ${areaName}`,val:fmtFull(ls.localTotal),pill:`${ls.localPct.toFixed(1)}%`,accent:"#66BB6A"},
                            {label:`Out of ${areaName}`,val:fmtFull(ls.nonLocalTotal),pill:`${ls.nonLocalPct.toFixed(1)}%`,accent:"#EF5350"},
                            {label:`Vendors in ${areaName}`,val:ls.localVendors,pill:`${ls.localTxns.toLocaleString()} txns`,accent:"#FFBB28"},
                            {label:`TXNs out of ${areaName}`,val:ls.nonLocalTxns.toLocaleString(),pill:`${ls.nonLocalPct.toFixed(1)}% of txns`,accent:"#FFA726"},
                          ].map(k=>(
                            <div key={k.label} style={{background:"#0a1729",border:"1px solid #1a3040",borderRadius:14,padding:"16px 18px"}}>
                              <div style={{fontSize:10,color:"#4a7a96",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6,fontWeight:600,lineHeight:1.3}}>{k.label}</div>
                              <div style={{fontSize:20,fontWeight:800,color:k.accent,marginBottom:4}}>{k.val}</div>
                              <div style={{fontSize:12,color:"#5a8aaa"}}>{k.pill}</div>
                            </div>
                          ))}
                        </div>

                        {/* #7 — Pie + bar charts */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                          <Card title="% In & Out" subtitle="Share of total spend">
                            <div style={{height:300}}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={[{name:`In ${areaName}`,value:ls.localTotal},{name:`Out of ${areaName}`,value:ls.nonLocalTotal}]}
                                    cx="50%" cy="44%" outerRadius={100} dataKey="value"
                                    label={({percent})=>`${(percent*100).toFixed(1)}%`} labelLine={{stroke:"#1e3a4a"}}>
                                    <Cell fill="#66BB6A" stroke="#0a1729" strokeWidth={2}/>
                                    <Cell fill="#EF5350" stroke="#0a1729" strokeWidth={2}/>
                                  </Pie>
                                  <Tooltip content={<Tip/>}/>
                                  <Legend formatter={v=><span style={{color:"#8ab4cc",fontSize:11}}>{v}</span>}/>
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </Card>
                          <Card title={`Top Categories in ${areaName}`} subtitle="Spend by NIGP class within local area">
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={ls.topLocalCats} layout="vertical" margin={{left:10,right:60,top:5,bottom:5}}>
                                <XAxis type="number" tickFormatter={fmt} tick={{fill:"#4a7a96",fontSize:10}} axisLine={false} tickLine={false}/>
                                <YAxis type="category" dataKey="name" width={150} tick={{fill:"#8ab4cc",fontSize:10}} axisLine={false} tickLine={false}/>
                                <Tooltip content={<Tip total={ls.localTotal}/>}/>
                                <Bar dataKey="value" radius={[0,5,5,0]} label={<PctBarLabel total={ls.localTotal} color="#5a8aaa"/>}>
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

              {/* #9 — AI Briefing: remove chips, center button */}
              {activeTab==="aibriefing"&&(
                <div>
                  <div style={{textAlign:"center",marginBottom:28}}>
                    <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>
                      <span style={{background:"linear-gradient(135deg,#A45CFF,#FF6B9D)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>✨ AI CPO Executive Briefing</span>
                    </div>
                    <div style={{fontSize:13,color:"#5a8aaa",marginBottom:20,lineHeight:1.5}}>
                      Powered by Claude AI · Produces a board-ready executive summary from your spend data in ~30 seconds.
                    </div>
                    {/* #9 — centered button */}
                    <button onClick={generateBriefing} disabled={aiLoading}
                      style={{background:aiLoading?"#1a2a3a":"linear-gradient(135deg,#A45CFF,#FF6B9D)",border:"none",color:"#fff",borderRadius:12,padding:"14px 40px",cursor:aiLoading?"not-allowed":"pointer",fontSize:16,fontWeight:700,boxShadow:aiLoading?"none":"0 4px 24px rgba(164,92,255,0.35)",transition:"all 0.2s"}}>
                      {aiLoading?"⏳ Generating…":"⚡ Generate Executive Briefing"}
                    </button>
                  </div>

                  {aiError&&<div style={{background:"rgba(239,83,80,0.1)",border:"1px solid #EF535044",borderRadius:10,padding:"14px 18px",color:"#ff8a80",fontSize:14,marginBottom:20}}>⚠ {aiError}</div>}

                  {aiLoading&&(
                    <div style={{background:"#0a1729",border:"1px solid #A45CFF33",borderRadius:16,padding:"60px 40px",textAlign:"center"}}>
                      <div style={{fontSize:36,marginBottom:16}}>🤖</div>
                      <div style={{fontSize:16,fontWeight:700,color:"#C47CFF",marginBottom:8}}>Claude is analyzing your procurement data…</div>
                      <div style={{fontSize:13,color:"#5a8aaa"}}>Reading {data.txCount.toLocaleString()} transactions · {data.flags.length} health flags · {data.classArr.length} categories</div>
                    </div>
                  )}

                  {aiResult&&!aiLoading&&(
                    <div style={{background:"#0a1729",border:"1px solid #A45CFF44",borderRadius:16,padding:"32px 36px"}}>
                      <div style={{borderBottom:"1px solid #1a3040",paddingBottom:20,marginBottom:24,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
                        <div>
                          <div style={{fontSize:11,color:"#A45CFF",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>CONFIDENTIAL · EXECUTIVE BRIEFING</div>
                          <div style={{fontSize:22,fontWeight:800,color:"#e8f4ff",marginBottom:4}}>Procurement Intelligence Report</div>
                          <div style={{fontSize:13,color:"#5a8aaa"}}>{fileName} · Generated {new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>{ const blob=new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>CPO Briefing</title><style>body{background:#080f18;font-family:'Segoe UI',sans-serif;color:#c8dcea;max-width:860px;margin:0 auto;padding:40px}h2{color:#A45CFF;font-size:13px;text-transform:uppercase;letter-spacing:.12em;border-bottom:1px solid #1a3040;padding-bottom:8px;margin-top:32px}h3{color:#e8f4ff}p{color:#8ab4cc;line-height:1.7}strong{color:#d0e8f5}</style></head><body><h1 style="color:#e8f4ff">Procurement Intelligence Report</h1><p style="color:#5a8aaa">${fileName} · ${new Date().toLocaleDateString()}</p>${aiResult}</body></html>`],{type:"text/html"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="cpo-briefing.html"; a.click(); }} style={{background:"#0d1e2e",border:"1px solid #1e3a4a",color:"#7aafc9",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600}}>⬇ Download HTML</button>
                          <button onClick={generateBriefing} style={{background:"transparent",border:"1px solid #A45CFF44",color:"#A45CFF",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600}}>↻ Regenerate</button>
                        </div>
                      </div>
                      <div style={{lineHeight:1.7}} dangerouslySetInnerHTML={{__html:aiResult}}/>
                      <div style={{marginTop:28,paddingTop:16,borderTop:"1px solid #1a3040",fontSize:11,color:"#2a4a5a",display:"flex",gap:16,flexWrap:"wrap"}}>
                        <span>Generated by Claude AI</span><span>·</span>
                        <span>{data.txCount.toLocaleString()} transactions · {fmtFull(data.totalSpend)} total spend</span>
                      </div>
                    </div>
                  )}

                  {!aiResult&&!aiLoading&&!aiError&&(
                    <div style={{background:"#0a1729",border:"1px dashed #A45CFF33",borderRadius:16,padding:"50px 40px",textAlign:"center"}}>
                      <div style={{fontSize:42,marginBottom:16}}>📋</div>
                      <div style={{fontSize:16,fontWeight:700,color:"#d0e8f5",marginBottom:8}}>Ready to generate your CPO briefing</div>
                      <div style={{fontSize:13,color:"#4a7a96",maxWidth:460,margin:"0 auto",lineHeight:1.6,marginBottom:20}}>
                        Click <strong style={{color:"#C47CFF"}}>Generate Executive Briefing</strong> above to have Claude AI analyze your {data.txCount.toLocaleString()} transactions.
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",fontSize:12,color:"#3a6a86"}}>
                        <span style={{background:"#0d1e2e",padding:"5px 12px",borderRadius:6,border:"1px solid #1a3040"}}>~30 seconds to generate</span>
                        <span style={{background:"#0d1e2e",padding:"5px 12px",borderRadius:6,border:"1px solid #1a3040"}}>~$0.02 per briefing</span>
                        <span style={{background:"#0d1e2e",padding:"5px 12px",borderRadius:6,border:"1px solid #1a3040"}}>Board-ready PDF export</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{marginTop:14,fontSize:11,color:"#2a4a5a",textAlign:"center"}}>
                {fileName} · {data.rowCount.toLocaleString()} rows · {data.txCount.toLocaleString()} valid transactions · {data.skipped} skipped
              </div>
            </>
          )}
        </div>
      </div>
>>>>>>> c158944 (v2.2)
    </div>
  );
}
