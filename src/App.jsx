import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase, loadImmobilien, saveImmobilie, deleteImmobilie } from './supabaseClient';
import Auth from './Auth';

// PLZ-basierte Preise pro m² für verschiedene deutsche Städte und Regionen
const PLZ_PREISE = {
  // Berlin (10xxx - 14xxx)
  '10115': 5800, '10117': 7200, '10119': 5500, '10178': 6800, '10179': 6200,
  '10243': 5200, '10245': 5000, '10247': 4800, '10249': 4600, '10315': 3800,
  '10317': 3600, '10318': 3400, '10319': 3200, '10365': 3500, '10367': 3300,
  '10369': 3100, '10405': 5300, '10407': 5100, '10409': 4900, '10435': 5600,
  '10437': 5400, '10439': 5200, '10551': 4800, '10553': 4600, '10555': 4400,
  '10557': 5000, '10559': 4200, '10585': 4500, '10587': 4700, '10589': 4300,
  '10623': 5500, '10625': 5300, '10627': 5100, '10629': 5400, '10707': 5800,
  '10709': 5600, '10711': 5400, '10713': 5200, '10715': 5000, '10717': 4800,
  '10719': 6000, '10777': 5200, '10779': 5000, '10781': 4800, '10783': 4600,
  '10785': 5500, '10787': 5800, '10789': 5600, '10823': 4400, '10825': 4200,
  '10827': 4000, '10829': 3800, '10961': 4500, '10963': 4700, '10965': 4300,
  '10967': 4100, '10969': 4900, '10997': 5100, '10999': 5300,
  '12043': 4200, '12045': 4000, '12047': 3800, '12049': 3600, '12051': 3400,
  '12053': 3200, '12055': 3000, '12057': 2800, '12059': 2600, '12099': 3500,
  '12101': 3700, '12103': 3900, '12105': 4100, '12107': 4300, '12109': 4500,
  '12157': 4000, '12159': 4200, '12161': 4400, '12163': 4600, '12165': 4800,
  '12167': 5000, '12169': 5200, '12203': 4500, '12205': 4700, '12207': 4900,
  '12209': 5100, '12247': 4300, '12249': 4500, '12277': 3800, '12279': 4000,
  '12305': 3500, '12307': 3700, '12309': 3900, '12347': 3600, '12349': 3800,
  '12351': 4000, '12353': 4200, '12355': 4400, '12357': 4600, '12359': 4800,
  '12435': 4500, '12437': 4700, '12439': 4900, '12459': 4200, '12487': 3800,
  '12489': 4000, '12524': 3500, '12526': 3700, '12527': 3900, '12529': 4100,
  '12555': 3400, '12557': 3600, '12559': 3800, '12587': 4000, '12589': 4200,
  '12619': 3200, '12621': 3400, '12623': 3600, '12627': 3000, '12629': 2800,
  '12679': 2900, '12681': 3100, '12683': 3300, '12685': 3500, '12687': 3700,
  '12689': 3900,
  '13051': 3000, '13053': 3200, '13055': 3400, '13057': 3600, '13059': 3800,
  '13086': 4200, '13088': 4400, '13089': 4600, '13125': 3500, '13127': 3700,
  '13129': 3900, '13156': 4000, '13158': 4200, '13159': 4400, '13187': 4500,
  '13189': 4700, '13347': 4300, '13349': 4500, '13351': 4700, '13353': 4900,
  '13355': 5100, '13357': 5300, '13359': 5500, '13403': 3800, '13405': 4000,
  '13407': 4200, '13409': 4400, '13435': 3500, '13437': 3700, '13439': 3900,
  '13465': 4500, '13467': 4700, '13469': 4900, '13503': 4200, '13505': 4400,
  '13507': 4600, '13509': 4800, '13581': 3600, '13583': 3800, '13585': 4000,
  '13587': 4200, '13589': 4400, '13591': 3400, '13593': 3600, '13595': 3800,
  '13597': 4000, '13599': 4200,
  '14050': 4500, '14052': 4700, '14053': 4900, '14055': 5100, '14057': 5300,
  '14059': 5500, '14089': 4800, '14109': 6000, '14129': 5500, '14163': 5200,
  '14165': 5000, '14167': 4800, '14169': 4600, '14193': 6500, '14195': 6800,
  '14197': 5800, '14199': 5600,

  // Hamburg (20xxx - 22xxx)
  '20095': 6500, '20097': 6200, '20099': 5800, '20144': 6800, '20146': 7200,
  '20148': 7500, '20149': 7000, '20249': 5500, '20251': 5300, '20253': 5100,
  '20255': 4900, '20257': 4700, '20259': 4500, '20354': 7800, '20355': 8200,
  '20357': 5200, '20359': 4800, '20457': 6000, '20459': 5800, '20535': 4500,
  '20537': 4300, '20539': 4100,
  '21029': 3800, '21031': 3600, '21033': 3400, '21035': 3200, '21037': 3000,
  '21039': 2800, '21073': 3500, '21075': 3700, '21077': 3900, '21079': 4100,
  '21107': 3300, '21109': 3500, '21129': 4000, '21147': 4200, '21149': 4400,
  '22041': 4500, '22043': 4300, '22045': 4100, '22047': 3900, '22049': 3700,
  '22081': 5000, '22083': 4800, '22085': 4600, '22087': 4400, '22089': 4200,
  '22111': 3800, '22113': 3600, '22115': 3400, '22117': 3200, '22119': 3000,
  '22143': 4000, '22145': 4200, '22147': 4400, '22149': 4600, '22159': 4800,
  '22175': 4500, '22177': 4700, '22179': 4900, '22297': 5200, '22299': 5400,
  '22301': 5600, '22303': 5800, '22305': 5000, '22307': 4800, '22309': 4600,
  '22335': 4200, '22337': 4400, '22339': 4600, '22359': 5500, '22391': 5800,
  '22393': 5600, '22395': 5400, '22397': 5200, '22399': 5000, '22415': 4500,
  '22417': 4700, '22419': 4900, '22453': 4300, '22455': 4500, '22457': 4700,
  '22459': 4900, '22523': 4000, '22525': 4200, '22527': 4400, '22529': 4600,
  '22547': 3800, '22549': 4000, '22559': 5000, '22587': 6500, '22589': 6200,
  '22605': 5500, '22607': 5300, '22609': 5100, '22761': 4800, '22763': 5000,
  '22765': 5200, '22767': 5400, '22769': 5600,

  // München (80xxx - 85xxx)
  '80331': 12000, '80333': 11500, '80335': 10800, '80336': 10500, '80337': 10200,
  '80339': 9800, '80469': 11000, '80538': 12500, '80539': 13000, '80634': 9500,
  '80636': 9200, '80637': 8900, '80638': 8600, '80639': 8300, '80686': 8000,
  '80687': 7800, '80689': 7500, '80796': 9800, '80797': 9500, '80798': 9200,
  '80799': 10500, '80801': 11000, '80802': 10800, '80803': 10500, '80804': 10200,
  '80805': 9900, '80807': 8500, '80809': 8200, '80933': 7500, '80935': 7200,
  '80937': 6900, '80939': 6600, '80992': 8800, '80993': 8500, '80995': 8200,
  '80997': 7900, '80999': 7600,
  '81241': 8500, '81243': 8200, '81245': 7900, '81247': 7600, '81249': 7300,
  '81369': 8000, '81371': 7800, '81373': 7500, '81375': 7200, '81377': 6900,
  '81379': 6600, '81475': 8500, '81476': 8800, '81477': 9100, '81479': 9400,
  '81539': 8200, '81541': 8500, '81543': 8800, '81545': 9100, '81547': 9400,
  '81549': 9700, '81667': 9000, '81669': 8700, '81671': 8400, '81673': 8100,
  '81675': 7800, '81677': 7500, '81679': 10500, '81735': 7800, '81737': 7500,
  '81739': 7200, '81825': 7000, '81827': 6800, '81829': 6500,
  '82008': 7500, '82024': 8000, '82031': 7800, '82041': 7200, '82049': 6800,
  '82054': 7000, '82057': 6500, '82061': 7200, '82064': 7500, '82065': 7800,
  '82067': 8000, '82069': 8200, '82110': 7000, '82131': 7500, '82140': 7200,
  '82152': 8500, '82166': 8800, '82178': 7000, '82194': 8000, '82205': 7500,
  '82216': 7200, '82223': 6800, '82229': 6500, '82234': 7000, '82237': 6800,
  '82256': 7500, '82266': 7000, '82272': 6800, '82276': 6500, '82279': 6200,
  '82284': 6000, '82285': 5800, '82287': 5500, '82288': 5200, '82291': 5000,
  '82293': 4800, '82294': 4500, '82296': 4200, '82297': 4000,
  '85521': 6500, '85540': 6200, '85551': 5800, '85560': 5500, '85567': 5200,
  '85579': 5000, '85586': 6000, '85591': 5800, '85598': 5500, '85604': 5200,
  '85609': 5000, '85622': 7000, '85625': 6800, '85630': 6500, '85635': 6200,
  '85640': 6000, '85643': 5800, '85646': 5500, '85649': 5200, '85652': 5000,
  '85653': 4800, '85654': 4500, '85656': 4200, '85658': 4000, '85659': 3800,
  '85661': 3500, '85662': 3200, '85664': 3000,

  // Frankfurt (60xxx - 65xxx)
  '60306': 7500, '60308': 7200, '60310': 6900, '60311': 8500, '60313': 8200,
  '60314': 7800, '60316': 6500, '60318': 6200, '60320': 5900, '60322': 7000,
  '60323': 7500, '60325': 7200, '60326': 6800, '60327': 6500, '60329': 6200,
  '60385': 5500, '60386': 5200, '60388': 4900, '60389': 4600, '60431': 5800,
  '60433': 5500, '60435': 5200, '60437': 4900, '60438': 4600, '60439': 4300,
  '60486': 6000, '60487': 5800, '60488': 5500, '60489': 5200, '60528': 5000,
  '60529': 4800, '60549': 4500, '60594': 6500, '60596': 6200, '60598': 5900,
  '60599': 5600,
  '61118': 4500, '61130': 4200, '61137': 4000, '61138': 3800, '61169': 3500,
  '61184': 3800, '61191': 3500, '61194': 3200, '61197': 3000,
  '63065': 4200, '63067': 4000, '63069': 3800, '63071': 3500, '63073': 3200,
  '63075': 3000, '63110': 4500, '63128': 4200, '63150': 4000, '63165': 3800,
  '63179': 4500, '63225': 3800, '63263': 4000, '63303': 4200, '63322': 4500,
  '63329': 4200, '63450': 4800, '63452': 4500, '63454': 4200, '63456': 4000,
  '63457': 3800, '63477': 3500, '63486': 4000, '63500': 4200, '63505': 4000,
  '63512': 3800, '63517': 3500, '63526': 3200, '63533': 3000,
  '65183': 5500, '65185': 5200, '65187': 5000, '65189': 4800, '65191': 4500,
  '65193': 4200, '65195': 4000, '65197': 3800, '65199': 3500,

  // Köln (50xxx - 51xxx)
  '50667': 5500, '50668': 5200, '50670': 4800, '50672': 4500, '50674': 5000,
  '50676': 4800, '50677': 4500, '50678': 4200, '50679': 4000, '50733': 4500,
  '50735': 4200, '50737': 4000, '50739': 3800, '50765': 3500, '50767': 3200,
  '50769': 3000, '50823': 4000, '50825': 3800, '50827': 3500, '50829': 3200,
  '50858': 4200, '50859': 4000, '50931': 5200, '50933': 5000, '50935': 4800,
  '50937': 4500, '50939': 4200, '50968': 4500, '50969': 4200, '50996': 4800,
  '50997': 4500, '50999': 4200,
  '51061': 3500, '51063': 3200, '51065': 3000, '51067': 2800, '51069': 2600,
  '51103': 3200, '51105': 3000, '51107': 2800, '51109': 2600, '51143': 3500,
  '51145': 3200, '51147': 3000, '51149': 2800,

  // Düsseldorf (40xxx)
  '40210': 5500, '40211': 5200, '40212': 6000, '40213': 6500, '40215': 5800,
  '40217': 5500, '40219': 5200, '40221': 4800, '40223': 4500, '40225': 4200,
  '40227': 4000, '40229': 3800, '40231': 3500, '40233': 3200, '40235': 3800,
  '40237': 4200, '40239': 4500, '40468': 4000, '40470': 4200, '40472': 4500,
  '40474': 4800, '40476': 5000, '40477': 5200, '40479': 5500, '40489': 4200,
  '40545': 5800, '40547': 6000, '40549': 5500, '40589': 4500, '40591': 4200,
  '40593': 4000, '40595': 3800, '40597': 3500, '40599': 3200, '40625': 4000,
  '40627': 4200, '40629': 4500, '40667': 4500, '40668': 4200, '40670': 4000,
  '40699': 3800, '40721': 4200, '40723': 4000, '40724': 3800, '40764': 4000,
  '40789': 4200, '40822': 4500, '40878': 5000, '40880': 4800,

  // Ruhrgebiet (44xxx - 47xxx)
  '44135': 2800, '44137': 2600, '44139': 2400, '44141': 2200, '44143': 2000,
  '44145': 1800, '44147': 2000, '44149': 2200, '44225': 2500, '44227': 2300,
  '44229': 2100, '44263': 2400, '44265': 2200, '44267': 2000, '44269': 1800,
  '44287': 2200, '44289': 2000, '44309': 1800, '44319': 2000, '44328': 1800,
  '44329': 1600, '44339': 1800, '44357': 2000, '44359': 2200, '44369': 2400,
  '44379': 2200, '44388': 2000, '44532': 2500, '44534': 2300, '44536': 2100,
  '44575': 2200, '44577': 2000, '44579': 1800, '44623': 2300, '44625': 2100,
  '44627': 1900, '44628': 1700, '44629': 1500, '44787': 2800, '44789': 2600,
  '44791': 2400, '44793': 2200, '44795': 2000, '44797': 1800, '44799': 1600,
  '44801': 2000, '44803': 2200, '44805': 2400, '44807': 2600, '44809': 2800,
  '44866': 2000, '44867': 1800, '44869': 1600, '44879': 2200, '44892': 2000,
  '44894': 1800,
  '45127': 2500, '45128': 2300, '45130': 2100, '45131': 1900, '45133': 1700,
  '45134': 1500, '45136': 1700, '45138': 1900, '45139': 2100, '45141': 2300,
  '45143': 2500, '45144': 2700, '45145': 2900, '45147': 3100, '45149': 3300,
  '45219': 2800, '45239': 2600, '45257': 2400, '45259': 2200, '45276': 2000,
  '45277': 1800, '45279': 1600, '45289': 1800, '45307': 1600, '45309': 1400,
  '45326': 1600, '45327': 1400, '45329': 1200, '45355': 1500, '45356': 1300,
  '45357': 1100, '45359': 1300, '45468': 2200, '45470': 2000, '45472': 1800,
  '45473': 1600, '45475': 1400, '45476': 1200, '45478': 1400, '45479': 1600,
  '45481': 1800,
  '46045': 2000, '46047': 1800, '46049': 1600, '46117': 1800, '46119': 1600,
  '46145': 1700, '46147': 1500, '46149': 1300, '46236': 1600, '46238': 1400,
  '46240': 1200, '46242': 1400, '46244': 1600, '46282': 1500, '46284': 1300,
  '46286': 1100, '46325': 1400, '46342': 1200, '46348': 1000, '46354': 1200,
  '46359': 1400, '46395': 1300, '46397': 1100, '46399': 900, '46414': 1400,
  '46446': 1300, '46459': 1200, '46483': 1100, '46485': 900, '46487': 1000,
  '46499': 1100, '46509': 1200, '46514': 1300, '46519': 1400, '46535': 1200,
  '46537': 1000, '46539': 800,
  '47051': 2200, '47053': 2000, '47055': 1800, '47057': 1600, '47058': 1400,
  '47059': 1200, '47119': 1500, '47137': 1700, '47138': 1500, '47139': 1300,
  '47166': 1400, '47167': 1200, '47169': 1000, '47178': 1300, '47179': 1100,
  '47198': 1200, '47199': 1000, '47226': 1100, '47228': 900, '47229': 700,
  '47239': 1000, '47249': 1200, '47259': 1400, '47269': 1600, '47279': 1800,

  // Stuttgart (70xxx - 71xxx)
  '70173': 6500, '70174': 6200, '70176': 5800, '70178': 5500, '70180': 5200,
  '70182': 6000, '70184': 5800, '70186': 5500, '70188': 5200, '70190': 4900,
  '70191': 5500, '70192': 5200, '70193': 4900, '70195': 4600, '70197': 4300,
  '70199': 4000, '70327': 4500, '70329': 4200, '70372': 4000, '70374': 3800,
  '70376': 3500, '70378': 3200, '70435': 4200, '70437': 4000, '70439': 3800,
  '70469': 4500, '70499': 4800, '70563': 5500, '70565': 5200, '70567': 4900,
  '70569': 4600, '70597': 5000, '70599': 4800, '70619': 4500, '70629': 4200,
  '70734': 4000, '70736': 3800, '70771': 4200, '70794': 4500, '70806': 4000,
  '70825': 3800, '70839': 4200,
  '71032': 4000, '71034': 3800, '71063': 4200, '71065': 4000, '71067': 3800,
  '71069': 3500, '71083': 3800, '71088': 3500, '71093': 3200, '71101': 4200,
  '71106': 4000, '71108': 3800, '71111': 4500, '71116': 4200, '71120': 4000,
  '71229': 4200, '71254': 3800, '71263': 3500, '71272': 3800, '71277': 3500,
  '71282': 3200, '71287': 3000, '71292': 2800, '71296': 2600, '71297': 2400,
  '71299': 2200, '71332': 4000, '71334': 3800, '71336': 3500, '71364': 3200,
  '71394': 3500, '71397': 3200, '71404': 3000, '71409': 2800, '71522': 3500,
  '71540': 3200, '71543': 3000, '71546': 2800, '71549': 2600, '71554': 2400,
  '71560': 2200, '71563': 2000, '71566': 1800, '71570': 1600, '71573': 1400,
  '71576': 1200, '71577': 1000, '71579': 800,

  // Baden-Württemberg (weitere)
  '76131': 3800, '76133': 3600, '76135': 3400, '76137': 3200, '76139': 3000,
  '76149': 3500, '76185': 3200, '76187': 3000, '76189': 2800, '76199': 3500,
  '76227': 3200, '76228': 3000, '76229': 2800, '76275': 3500, '76287': 3200,
  '76297': 3000, '76327': 2800, '76332': 2600, '76337': 2400, '76344': 3000,
  '76356': 2800, '76437': 2500, '76448': 2300, '76530': 3200, '76532': 3000,
  '76534': 2800, '76547': 2600, '76571': 2400, '76593': 2200, '76596': 2000,
  '76597': 1800, '76599': 1600,
  '68159': 3500, '68161': 3200, '68163': 3000, '68165': 2800, '68167': 2600,
  '68169': 2400, '68199': 3000, '68219': 2800, '68229': 2600, '68239': 2400,
  '68259': 2200, '68305': 2000, '68307': 1800, '68309': 1600,
  '69115': 4200, '69117': 4000, '69118': 3800, '69120': 3600, '69121': 3400,
  '69123': 3200, '69124': 3000, '69126': 2800,

  // Hannover (30xxx)
  '30159': 4000, '30161': 3800, '30163': 3600, '30165': 3400, '30167': 3200,
  '30169': 3000, '30171': 2800, '30173': 2600, '30175': 2400, '30177': 2200,
  '30179': 2000, '30419': 3500, '30449': 3200, '30451': 3000, '30453': 2800,
  '30455': 2600, '30457': 2400, '30459': 2200, '30519': 3000, '30521': 2800,
  '30539': 2600, '30559': 2400, '30625': 3200, '30627': 3000, '30629': 2800,
  '30655': 3500, '30657': 3200, '30659': 3000, '30669': 2800,

  // Leipzig (04xxx)
  '04103': 3200, '04105': 3000, '04107': 2800, '04109': 2600, '04129': 2400,
  '04155': 2800, '04157': 2600, '04158': 2400, '04159': 2200, '04177': 2800,
  '04178': 2600, '04179': 2400, '04205': 2200, '04207': 2000, '04209': 1800,
  '04229': 2500, '04249': 2300, '04275': 2800, '04277': 2600, '04279': 2400,
  '04288': 2200, '04289': 2000, '04299': 2600, '04315': 2400, '04316': 2200,
  '04317': 2000, '04318': 1800, '04319': 1600, '04328': 2200, '04329': 2000,
  '04347': 2400, '04349': 2200, '04356': 2600, '04357': 2400,

  // Dresden (01xxx)
  '01067': 3000, '01069': 2800, '01097': 3200, '01099': 3000, '01108': 2600,
  '01109': 2400, '01127': 2800, '01129': 2600, '01139': 2400, '01157': 2200,
  '01159': 2000, '01169': 2400, '01187': 2600, '01189': 2400, '01217': 2800,
  '01219': 2600, '01237': 2200, '01239': 2000, '01257': 2400, '01259': 2200,
  '01277': 3000, '01279': 2800, '01307': 3200, '01309': 3000, '01324': 2600,
  '01326': 2400, '01328': 2200, '01445': 2000, '01454': 1800, '01458': 1600,
  '01465': 1400, '01468': 1200, '01471': 1000,

  // Nürnberg (90xxx)
  '90402': 3800, '90403': 3600, '90408': 3400, '90409': 3200, '90411': 3000,
  '90419': 2800, '90425': 2600, '90427': 2400, '90429': 2200, '90431': 2000,
  '90439': 2200, '90441': 2400, '90443': 2600, '90449': 2800, '90451': 3000,
  '90453': 3200, '90455': 3400, '90459': 3600, '90461': 3800, '90469': 4000,
  '90471': 3500, '90473': 3200, '90475': 3000, '90478': 2800, '90480': 2600,
  '90482': 2400, '90489': 2200, '90491': 2000, '90513': 2500, '90518': 2800,
  '90522': 3000, '90537': 2500, '90542': 2800, '90547': 2600, '90552': 2400,
  '90556': 2200, '90559': 2000, '90571': 2500, '90574': 2800, '90579': 3000,
  '90584': 2800, '90587': 2600, '90592': 2400, '90596': 2200, '90599': 2000,
  '90602': 3000, '90607': 2800, '90610': 2600, '90613': 2400, '90614': 2200,
  '90617': 2000, '90619': 1800,

  // Bremen (28xxx)
  '28195': 3200, '28197': 3000, '28199': 2800, '28201': 2600, '28203': 2400,
  '28205': 2200, '28207': 2000, '28209': 2500, '28211': 3000, '28213': 2800,
  '28215': 2600, '28217': 2400, '28219': 2200, '28237': 2000, '28239': 1800,
  '28259': 2200, '28277': 2500, '28279': 2300, '28307': 2100, '28309': 1900,
  '28325': 2000, '28327': 1800, '28329': 1600, '28355': 2800, '28357': 2600,
  '28359': 2400, '28717': 2200, '28719': 2000, '28755': 1800, '28757': 1600,
  '28759': 1400, '28777': 1800, '28779': 1600,

  // Regensburg (93xxx)
  '93047': 4200, '93049': 4000, '93051': 3800, '93053': 3600, '93055': 3400,
  '93057': 3200, '93059': 3000, '93073': 3500, '93077': 3300, '93080': 3100,
  '93083': 2900, '93086': 2700, '93087': 2500, '93089': 2300, '93093': 3000,
  '93095': 2800, '93096': 2600, '93098': 2400, '93099': 2200,
  '93101': 3500, '93102': 3300, '93104': 3100, '93105': 2900,
  '93107': 2700, '93109': 2500, '93128': 2600, '93133': 2400, '93138': 2200,
  '93142': 2000, '93149': 1800, '93152': 2200, '93155': 2400, '93158': 2600,
  '93161': 2200, '93164': 2000, '93167': 1800, '93170': 1600, '93173': 1400,
  '93176': 2000, '93177': 1800, '93179': 1600, '93180': 1400, '93183': 1200,
  '93185': 1000, '93186': 1200, '93188': 1400, '93189': 1600, '93191': 1800,
  '93192': 2000, '93194': 2200, '93195': 2400, '93197': 2600, '93199': 2800,

  // Cham (93xxx)
  '93413': 1800, '93426': 1600, '93437': 1500, '93444': 1400, '93449': 1300,
  '93453': 1200, '93455': 1100, '93458': 1000, '93462': 1200, '93464': 1400,
  '93466': 1300, '93468': 1200, '93470': 1100, '93471': 1000, '93473': 900,
  '93474': 1100, '93476': 1300, '93477': 1200, '93479': 1100, '93480': 1000,
  '93482': 900, '93483': 1000, '93485': 1100, '93486': 1200, '93488': 1100,
  '93489': 1000, '93491': 900, '93492': 1000, '93494': 1100, '93495': 1200,
  '93497': 1100, '93499': 1000,

  // Neutraubling (bei Regensburg)
  '93073': 3500, // Neutraubling
  '93092': 3200, // Barbing
  '93093': 3000, // Donaustauf
  '93080': 2800, // Pentling
  '93176': 2600, // Beratzhausen

  // Erfurt (99xxx)
  '99084': 2800, '99085': 2600, '99086': 2400, '99087': 2200, '99089': 2000,
  '99091': 2200, '99092': 2400, '99094': 2600, '99095': 2400, '99096': 2200,
  '99097': 2000, '99098': 1800, '99099': 2200, '99100': 2000, '99102': 1800,
  '99104': 1600, '99105': 1400, '99106': 1200, '99107': 1400, '99108': 1600,
  '99109': 1800, '99110': 2000, '99189': 1800, '99192': 1600, '99195': 1400,
  '99198': 1200,
};

// Regionale Durchschnittspreise (für PLZ-Bereiche)
const PLZ_BEREICH_PREISE = {
  '10': 4500, '11': 4200, '12': 3800, '13': 4000, '14': 4800,
  '20': 5500, '21': 3800, '22': 4800, '23': 3200, '24': 3000, '25': 2800,
  '26': 2500, '27': 2800, '28': 2500, '29': 2200,
  '30': 3200, '31': 2800, '32': 2500, '33': 2800, '34': 2500, '35': 2800,
  '36': 2200, '37': 2500, '38': 2800, '39': 2200,
  '40': 4200, '41': 3500, '42': 3200, '44': 2200, '45': 2500, '46': 1800,
  '47': 1800, '48': 2800, '49': 2500,
  '50': 4200, '51': 3200, '52': 3000, '53': 3500, '54': 2500, '55': 3200,
  '56': 2800, '57': 2500, '58': 2800, '59': 2200,
  '60': 5500, '61': 3800, '63': 3800, '64': 3500, '65': 4200, '66': 2800,
  '67': 3200, '68': 3000, '69': 3800,
  '70': 5000, '71': 3800, '72': 3500, '73': 3200, '74': 3000, '75': 2800,
  '76': 3200, '77': 2800, '78': 3000, '79': 3500,
  '80': 9500, '81': 8500, '82': 7000, '83': 4500, '84': 3200, '85': 5500,
  '86': 4000, '87': 3500, '88': 3800, '89': 3500,
  '90': 3200, '91': 2800, '92': 2500, '93': 2800, '94': 2200, '95': 2500,
  '96': 2200, '97': 2800, '98': 2200, '99': 2200,
  '01': 2800, '02': 2200, '03': 1800, '04': 2800, '06': 2200, '07': 2000,
  '08': 1800, '09': 1800,
  'default': 3000
};

// Funktion zum Ermitteln des Preises basierend auf PLZ
const getPreisNachPLZ = (plz) => {
  if (!plz) return { preis: PLZ_BEREICH_PREISE['default'], genauigkeit: 'keine PLZ' };

  const plzString = plz.toString().trim();

  // 1. Exakte PLZ-Suche (5-stellig)
  if (PLZ_PREISE[plzString]) {
    return { preis: PLZ_PREISE[plzString], genauigkeit: 'exakt' };
  }

  // 2. 4-stellige PLZ-Suche
  const plz4 = plzString.substring(0, 4);
  const matches4 = Object.keys(PLZ_PREISE).filter(p => p.startsWith(plz4));
  if (matches4.length > 0) {
    const avgPreis = Math.round(matches4.reduce((sum, p) => sum + PLZ_PREISE[p], 0) / matches4.length);
    return { preis: avgPreis, genauigkeit: 'PLZ-Bereich (4-stellig)' };
  }

  // 3. 3-stellige PLZ-Suche
  const plz3 = plzString.substring(0, 3);
  const matches3 = Object.keys(PLZ_PREISE).filter(p => p.startsWith(plz3));
  if (matches3.length > 0) {
    const avgPreis = Math.round(matches3.reduce((sum, p) => sum + PLZ_PREISE[p], 0) / matches3.length);
    return { preis: avgPreis, genauigkeit: 'PLZ-Bereich (3-stellig)' };
  }

  // 4. 2-stellige Bereichssuche
  const plz2 = plzString.substring(0, 2);
  if (PLZ_BEREICH_PREISE[plz2]) {
    return { preis: PLZ_BEREICH_PREISE[plz2], genauigkeit: 'Region' };
  }

  // 5. Default
  return { preis: PLZ_BEREICH_PREISE['default'], genauigkeit: 'Deutschland Durchschnitt' };
};

// Immobilienwert schätzen
const schaetzeImmobilienwert = (immobilie) => {
  const { preis: basisPreis, genauigkeit } = getPreisNachPLZ(immobilie.plz);
  let preisProQm = basisPreis;

  // Zustandsfaktoren
  const zustandsFaktoren = {
    'neuwertig': 1.15,
    'sehr gut': 1.08,
    'gut': 1.0,
    'normal': 0.95,
    'renovierungsbedürftig': 0.80,
    'sanierungsbedürftig': 0.65
  };

  // Objektart-Faktoren
  const objektFaktoren = {
    'eigentumswohnung': 1.0,
    'einfamilienhaus': 1.1,
    'doppelhaushälfte': 1.05,
    'reihenhaus': 0.95,
    'mehrfamilienhaus': 0.9,
    'grundstück': 0.7
  };

  // Energieeffizienz-Faktoren
  const energieFaktoren = {
    'A+': 1.08, 'A': 1.05, 'B': 1.02, 'C': 1.0,
    'D': 0.98, 'E': 0.95, 'F': 0.92, 'G': 0.88, 'H': 0.85
  };

  // Faktoren anwenden
  preisProQm *= zustandsFaktoren[immobilie.zustand] || 1.0;
  preisProQm *= objektFaktoren[immobilie.objektart] || 1.0;
  preisProQm *= energieFaktoren[immobilie.energieeffizienz] || 1.0;

  // Baujahr-Anpassung
  if (immobilie.baujahr) {
    const alter = new Date().getFullYear() - parseInt(immobilie.baujahr);
    if (alter <= 5) preisProQm *= 1.1;
    else if (alter <= 15) preisProQm *= 1.05;
    else if (alter <= 30) preisProQm *= 1.0;
    else if (alter <= 50) preisProQm *= 0.95;
    else if (alter <= 80) preisProQm *= 0.90;
    else preisProQm *= 0.85;
  }

  // Extras
  if (immobilie.balkon) preisProQm *= 1.03;
  if (immobilie.garage) preisProQm *= 1.04;
  if (immobilie.keller) preisProQm *= 1.02;

  const geschaetzterWert = Math.round(preisProQm * (immobilie.wohnflaeche || 80));

  // Konfidenzbereich basierend auf Genauigkeit
  let konfidenz = 0.15;
  if (genauigkeit === 'exakt') konfidenz = 0.08;
  else if (genauigkeit === 'PLZ-Bereich (4-stellig)') konfidenz = 0.12;
  else if (genauigkeit === 'PLZ-Bereich (3-stellig)') konfidenz = 0.15;
  else if (genauigkeit === 'Region') konfidenz = 0.20;
  else konfidenz = 0.25;

  return {
    wert: geschaetzterWert,
    preisProQm: Math.round(preisProQm),
    genauigkeit,
    konfidenzMin: Math.round(geschaetzterWert * (1 - konfidenz)),
    konfidenzMax: Math.round(geschaetzterWert * (1 + konfidenz))
  };
};

// Wertsteigerung seit Kauf berechnen
const berechneWertsteigerungSeitKauf = (immobilie, aktuellerWert) => {
  if (!immobilie.kaufdatum || !immobilie.kaufpreis) return null;

  const kaufdatum = new Date(immobilie.kaufdatum);
  const heute = new Date();
  const jahreSeitKauf = (heute - kaufdatum) / (1000 * 60 * 60 * 24 * 365.25);

  if (jahreSeitKauf <= 0) return null;

  const absoluteSteigerung = aktuellerWert - immobilie.kaufpreis;
  const prozentSteigerung = ((aktuellerWert / immobilie.kaufpreis) - 1) * 100;
  const jaehrlicheRendite = (Math.pow(aktuellerWert / immobilie.kaufpreis, 1 / jahreSeitKauf) - 1) * 100;

  return {
    absoluteSteigerung,
    prozentSteigerung,
    jaehrlicheRendite,
    jahreSeitKauf
  };
};

// Restschuld berechnen basierend auf Kaufdatum und Finanzierung
const berechneRestschuld = (immobilie) => {
  if (!immobilie.kaufdatum || !immobilie.kaufpreis) return null;

  const kaufdatum = new Date(immobilie.kaufdatum);
  const heute = new Date();
  const monateSeitKauf = Math.floor((heute - kaufdatum) / (1000 * 60 * 60 * 24 * 30.44));

  if (monateSeitKauf <= 0) return null;

  // Finanzierungsparameter mit Defaults
  const zinssatz = immobilie.zinssatz ?? 4.0;
  const tilgung = immobilie.tilgung ?? 2.0;
  const kaufnebenkosten = immobilie.kaufnebenkosten ?? 10;
  const finanzierungsbetrag = immobilie.finanzierungsbetrag;

  // Fremdkapital berechnen
  const kaufnebenkostenAbsolut = immobilie.kaufpreis * (kaufnebenkosten / 100);
  const gesamtinvestition = immobilie.kaufpreis + kaufnebenkostenAbsolut;

  // Eigenkapital aus neuer Aufteilung oder legacy
  const gesamtEK = (immobilie.ekFuerNebenkosten !== undefined && immobilie.ekFuerKaufpreis !== undefined)
    ? (immobilie.ekFuerNebenkosten || 0) + (immobilie.ekFuerKaufpreis || 0)
    : (immobilie.eigenkapital ?? immobilie.kaufpreis * 0.2);

  // Finanzierungsbetrag: Entweder manuell eingegeben oder berechnet
  const anfangsFremdkapital = finanzierungsbetrag !== null && finanzierungsbetrag !== undefined
    ? finanzierungsbetrag
    : Math.max(0, gesamtinvestition - gesamtEK);

  if (anfangsFremdkapital <= 0) return { restschuld: 0, anfangsFremdkapital: 0, getilgt: 0 };

  // Monatliche Annuität berechnen (Zins + Tilgung)
  const monatszins = zinssatz / 100 / 12;
  const laufzeit = immobilie.laufzeit ?? 25;
  const annuitaet = anfangsFremdkapital * (monatszins * Math.pow(1 + monatszins, laufzeit * 12)) / (Math.pow(1 + monatszins, laufzeit * 12) - 1);

  // Restschuld iterativ berechnen
  let restschuld = anfangsFremdkapital;
  for (let monat = 0; monat < monateSeitKauf && restschuld > 0; monat++) {
    const monatsZinsen = restschuld * monatszins;
    const monatsTilgung = Math.min(annuitaet - monatsZinsen, restschuld);
    restschuld = Math.max(0, restschuld - monatsTilgung);
  }

  return {
    restschuld: Math.round(restschuld),
    anfangsFremdkapital: Math.round(anfangsFremdkapital),
    getilgt: Math.round(anfangsFremdkapital - restschuld)
  };
};

// InputSliderCombo Komponente
const InputSliderCombo = ({ label, value, onChange, min, max, step, unit, info }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toString());
    }
  }, [value, isFocused]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let numValue = parseFloat(localValue);
    if (isNaN(numValue)) numValue = min;
    numValue = Math.min(Math.max(numValue, min), max);
    setLocalValue(numValue.toString());
    onChange(numValue);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            min={min}
            max={max}
            step={step}
            className="w-24 px-2 py-1 text-right text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500 w-8">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      {info && <p className="text-xs text-gray-500 mt-1">{info}</p>}
    </div>
  );
};

// Formatierungsfunktionen
const formatCurrency = (value) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
const formatPercent = (value) => new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);

// Rendite-Berechnung
const berechneRendite = (params) => {
  const {
    kaufpreis, zinssatz, tilgung, laufzeit,
    kaltmiete, nebenkosten, instandhaltung, verwaltung,
    hausgeld = 0, strom = 0, internet = 0,
    wertsteigerung, mietsteigerung, kaufnebenkosten,
    finanzierungsbetrag, kaufdatum,
    ekFuerNebenkosten, ekFuerKaufpreis, eigenkapital
  } = params;

  // Kaufjahr für Chart-Darstellung
  const kaufjahr = kaufdatum ? new Date(kaufdatum).getFullYear() : new Date().getFullYear();

  const kaufnebenkostenAbsolut = kaufpreis * (kaufnebenkosten / 100);
  const gesamtinvestition = kaufpreis + kaufnebenkostenAbsolut;

  // Eigenkapital berechnen aus neuer Aufteilung (falls vorhanden) oder legacy
  const gesamtEK = (ekFuerNebenkosten !== undefined && ekFuerKaufpreis !== undefined)
    ? (ekFuerNebenkosten || 0) + (ekFuerKaufpreis || 0)
    : (eigenkapital || 0);

  // Finanzierungsbetrag: Entweder manuell eingegeben oder berechnet
  const fremdkapital = finanzierungsbetrag !== null && finanzierungsbetrag !== undefined
    ? finanzierungsbetrag
    : Math.max(0, gesamtinvestition - gesamtEK);

  const jahresmieteKalt = kaltmiete * 12;
  const jahresnebenkosten = nebenkosten * 12; // Wird vom Mieter getragen, nicht in Nettorendite
  const jahresinstandhaltung = instandhaltung * 12;
  const jahresverwaltung = verwaltung * 12;
  // Zusätzliche Kosten (z.B. bei möblierter Vermietung)
  const jahresHausgeld = hausgeld * 12;
  const jahresStrom = strom * 12;
  const jahresInternet = internet * 12;

  const bruttorendite = (jahresmieteKalt / kaufpreis) * 100;
  // Nettorendite: Alle vom Vermieter getragenen Kosten abziehen (Nebenkosten trägt der Mieter)
  const nettoEinnahmen = jahresmieteKalt - jahresinstandhaltung - jahresverwaltung - jahresHausgeld - jahresStrom - jahresInternet;
  const nettorendite = (nettoEinnahmen / kaufpreis) * 100;

  const monatszins = zinssatz / 100 / 12;
  const annuitaet = fremdkapital > 0 ? fremdkapital * (monatszins * Math.pow(1 + monatszins, laufzeit * 12)) / (Math.pow(1 + monatszins, laufzeit * 12) - 1) : 0;
  const jahresannuitaet = annuitaet * 12;

  const cashflowVorSteuern = nettoEinnahmen - jahresannuitaet;
  const cashOnCash = gesamtEK > 0 ? (cashflowVorSteuern / gesamtEK) * 100 : 0;

  const eigenkapitalRendite = gesamtEK > 0 ? ((nettoEinnahmen + (kaufpreis * wertsteigerung / 100)) / gesamtEK) * 100 : 0;

  const leverageEffekt = eigenkapitalRendite - nettorendite;

  // Entwicklung über Zeit
  const entwicklung = [];
  let aktuellerWert = kaufpreis;
  let aktuelleMiete = kaltmiete;
  let restschuld = fremdkapital;
  let gesamtTilgung = 0;
  let gesamtZinsen = 0;

  for (let i = 0; i <= laufzeit; i++) {
    const jahresZinsen = restschuld * (zinssatz / 100);
    const jahresTilgung = Math.min(jahresannuitaet - jahresZinsen, restschuld);

    entwicklung.push({
      jahr: kaufjahr + i, // Absolutes Jahr statt relativ
      jahrRelativ: i,
      immobilienwert: Math.round(aktuellerWert),
      restschuld: Math.round(restschuld),
      eigenkapital: Math.round(aktuellerWert - restschuld),
      jahresmiete: Math.round(aktuelleMiete * 12),
      cashflow: Math.round((aktuelleMiete * 12) - jahresinstandhaltung - jahresverwaltung - jahresHausgeld - jahresStrom - jahresInternet - jahresannuitaet)
    });

    aktuellerWert *= (1 + wertsteigerung / 100);
    aktuelleMiete *= (1 + mietsteigerung / 100);
    restschuld = Math.max(0, restschuld - jahresTilgung);
    gesamtTilgung += jahresTilgung;
    gesamtZinsen += jahresZinsen;
  }

  return {
    bruttorendite,
    nettorendite,
    eigenkapitalRendite,
    cashOnCash,
    leverageEffekt,
    monatlicheRate: annuitaet,
    cashflowMonatlich: cashflowVorSteuern / 12,
    entwicklung,
    gesamtTilgung,
    gesamtZinsen,
    fremdkapital,
    kaufnebenkostenAbsolut
  };
};

// Immobilien-Formular Komponente
const ImmobilienFormular = ({ onSave, onClose, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    plz: '',
    adresse: '',
    immobilienTyp: 'kaufimmobilie', // NEU: kaufimmobilie oder mietimmobilie
    objektart: 'eigentumswohnung',
    zustand: 'gut',
    wohnflaeche: 80,
    grundstueck: 0,
    zimmer: 3,
    baujahr: 2000,
    stockwerk: 1,
    energieeffizienz: 'C',
    balkon: false,
    garage: false,
    keller: false,
    kaufpreis: 300000,
    eigenkapital: 60000,
    kaltmiete: 1000,
    kaufdatum: '',
    // Mietimmobilie / Arbitrage spezifische Felder
    eigeneWarmmiete: 1500,        // Was man selbst zahlt (warm)
    anzahlZimmerVermietet: 3,     // Anzahl Zimmer die untervermietet werden
    untermieteProZimmer: 600,     // Warmmiete pro Zimmer von Untermietern
    // Aufgeschlüsselte Kosten für Steuerberater
    arbitrageStrom: 0,            // Stromkosten monatlich
    arbitrageInternet: 0,         // Internetkosten monatlich
    arbitrageGEZ: 18.36,          // GEZ/Rundfunkbeitrag monatlich (Standard: 18,36€)
    mietvertragStart: ''          // Startdatum des Mietvertrags
  });

  const schaetzung = useMemo(() => schaetzeImmobilienwert(formData), [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {initialData ? 'Immobilie bearbeiten' : 'Neue Immobilie'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-6">
            {/* Immobilientyp Auswahl */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Immobilientyp</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('immobilienTyp', 'kaufimmobilie')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.immobilienTyp === 'kaufimmobilie'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">🏠</div>
                  <div className="font-semibold">Kaufimmobilie</div>
                  <div className="text-xs text-gray-500">Eigene Immobilie vermieten</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('immobilienTyp', 'mietimmobilie')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.immobilienTyp === 'mietimmobilie'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">🔄</div>
                  <div className="font-semibold">Mietimmobilie</div>
                  <div className="text-xs text-gray-500">Arbitrage: Anmieten & Untervermieten</div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Grunddaten</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name/Bezeichnung</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.immobilienTyp === 'mietimmobilie' ? 'z.B. Mitarbeiter-WG München' : 'z.B. Wohnung München'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                  <input
                    type="text"
                    value={formData.plz}
                    onChange={(e) => handleChange('plz', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 80331"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => handleChange('adresse', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Musterstraße 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.immobilienTyp === 'mietimmobilie' ? 'Mietvertrag seit' : 'Kaufdatum'}
                  </label>
                  <input
                    type="date"
                    value={formData.immobilienTyp === 'mietimmobilie' ? formData.mietvertragStart : formData.kaufdatum}
                    onChange={(e) => handleChange(formData.immobilienTyp === 'mietimmobilie' ? 'mietvertragStart' : 'kaufdatum', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Objektdetails - nur für Kaufimmobilie */}
            {formData.immobilienTyp === 'kaufimmobilie' && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Objektdetails</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objektart</label>
                    <select
                      value={formData.objektart}
                      onChange={(e) => handleChange('objektart', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="eigentumswohnung">Eigentumswohnung</option>
                      <option value="einfamilienhaus">Einfamilienhaus</option>
                      <option value="doppelhaushälfte">Doppelhaushälfte</option>
                      <option value="reihenhaus">Reihenhaus</option>
                      <option value="mehrfamilienhaus">Mehrfamilienhaus</option>
                      <option value="grundstück">Grundstück</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zustand</label>
                    <select
                      value={formData.zustand}
                      onChange={(e) => handleChange('zustand', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="neuwertig">Neuwertig</option>
                      <option value="sehr gut">Sehr gut</option>
                      <option value="gut">Gut</option>
                      <option value="normal">Normal</option>
                      <option value="renovierungsbedürftig">Renovierungsbedürftig</option>
                      <option value="sanierungsbedürftig">Sanierungsbedürftig</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wohnfläche (m²)</label>
                    <input
                      type="number"
                      value={formData.wohnflaeche}
                      onChange={(e) => handleChange('wohnflaeche', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grundstück (m²)</label>
                    <input
                      type="number"
                      value={formData.grundstueck}
                      onChange={(e) => handleChange('grundstueck', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zimmer</label>
                    <input
                      type="number"
                      value={formData.zimmer}
                      onChange={(e) => handleChange('zimmer', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Baujahr</label>
                    <input
                      type="number"
                      value={formData.baujahr}
                      onChange={(e) => handleChange('baujahr', parseInt(e.target.value) || 2000)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stockwerk</label>
                    <input
                      type="number"
                      value={formData.stockwerk}
                      onChange={(e) => handleChange('stockwerk', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Energieeffizienz</label>
                    <select
                      value={formData.energieeffizienz}
                      onChange={(e) => handleChange('energieeffizienz', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.balkon}
                      onChange={(e) => handleChange('balkon', e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Balkon/Terrasse</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.garage}
                      onChange={(e) => handleChange('garage', e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Garage/Stellplatz</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.keller}
                      onChange={(e) => handleChange('keller', e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Keller</span>
                  </label>
                </div>
              </div>
            )}

            {/* Objektdetails für Mietimmobilie - vereinfacht */}
            {formData.immobilienTyp === 'mietimmobilie' && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Objektdetails</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wohnfläche (m²)</label>
                    <input
                      type="number"
                      value={formData.wohnflaeche}
                      onChange={(e) => handleChange('wohnflaeche', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gesamtzahl Zimmer</label>
                    <input
                      type="number"
                      value={formData.zimmer}
                      onChange={(e) => handleChange('zimmer', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Marktwert - nur für Kaufimmobilie */}
            {formData.immobilienTyp === 'kaufimmobilie' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">Aktueller Marktwert</h3>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geschätzter Wert (€)</label>
                  <input
                    type="number"
                    value={formData.geschaetzterWert || ''}
                    onChange={(e) => handleChange('geschaetzterWert', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 350000"
                  />
                </div>
                <a
                  href={`https://www.homeday.de/de/preisatlas/${formData.plz ? '?search=' + formData.plz : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <span>🔍</span> Preis bei Homeday recherchieren
                </a>
                <p className="text-xs text-blue-600 mt-2">
                  Recherchiere den aktuellen Marktwert und trage ihn oben ein.
                </p>
              </div>
            )}

            {/* Finanzdaten für Kaufimmobilie */}
            {formData.immobilienTyp === 'kaufimmobilie' && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Finanzdaten</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kaufpreis (€)</label>
                    <input
                      type="number"
                      value={formData.kaufpreis}
                      onChange={(e) => handleChange('kaufpreis', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eigenkapital (€)</label>
                    <input
                      type="number"
                      value={formData.eigenkapital}
                      onChange={(e) => handleChange('eigenkapital', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kaltmiete (€/Monat)</label>
                    <input
                      type="number"
                      value={formData.kaltmiete}
                      onChange={(e) => handleChange('kaltmiete', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Arbitrage-Daten für Mietimmobilie */}
            {formData.immobilienTyp === 'mietimmobilie' && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold mb-3 text-purple-800">🔄 Arbitrage-Kalkulation</h3>
                <p className="text-sm text-purple-600 mb-4">
                  Berechne deinen Cashflow aus der Untervermietung an Mitarbeiter oder Gäste (Warmmiete).
                </p>

                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">💸 Deine Mietkosten</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eigene Warmmiete (€/Monat)</label>
                      <input
                        type="number"
                        value={formData.eigeneWarmmiete}
                        onChange={(e) => handleChange('eigeneWarmmiete', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="z.B. 1500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Die Miete, die du an den Vermieter zahlst (inkl. Nebenkosten)</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">🛏️ Untervermietung</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vermietete Zimmer</label>
                        <input
                          type="number"
                          value={formData.anzahlZimmerVermietet}
                          onChange={(e) => handleChange('anzahlZimmerVermietet', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          min="0"
                          max={formData.zimmer}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Miete pro Zimmer (€)</label>
                        <input
                          type="number"
                          value={formData.untermieteProZimmer}
                          onChange={(e) => handleChange('untermieteProZimmer', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="z.B. 600"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Warmmiete pro Zimmer, die deine Untermieter zahlen</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">📊 Zusätzliche Kosten (für Steuerberater)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">⚡ Strom (€/Mon.)</label>
                        <input
                          type="number"
                          value={formData.arbitrageStrom || 0}
                          onChange={(e) => handleChange('arbitrageStrom', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">🌐 Internet (€/Mon.)</label>
                        <input
                          type="number"
                          value={formData.arbitrageInternet || 0}
                          onChange={(e) => handleChange('arbitrageInternet', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">📺 GEZ (€/Mon.)</label>
                        <input
                          type="number"
                          value={formData.arbitrageGEZ ?? 18.36}
                          onChange={(e) => handleChange('arbitrageGEZ', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="18.36"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Summe: {formatCurrency((formData.arbitrageStrom || 0) + (formData.arbitrageInternet || 0) + (formData.arbitrageGEZ ?? 18.36))}/Monat
                    </p>
                  </div>

                  {/* Vorschau-Berechnung */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <h4 className="text-sm font-semibold text-green-800 mb-3">📈 Cashflow-Vorschau</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Einnahmen ({formData.anzahlZimmerVermietet || 0} × {formatCurrency(formData.untermieteProZimmer || 0)}):</span>
                        <span className="font-semibold text-green-600">+{formatCurrency((formData.anzahlZimmerVermietet || 0) * (formData.untermieteProZimmer || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Eigene Miete:</span>
                        <span className="font-semibold text-red-600">-{formatCurrency(formData.eigeneWarmmiete || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Strom / Internet / GEZ:</span>
                        <span className="font-semibold text-red-600">-{formatCurrency((formData.arbitrageStrom || 0) + (formData.arbitrageInternet || 0) + (formData.arbitrageGEZ ?? 18.36))}</span>
                      </div>
                      <div className="border-t border-green-300 pt-2 mt-2">
                        <div className="flex justify-between text-base">
                          <span className="font-semibold text-gray-700">Monatlicher Cashflow:</span>
                          {(() => {
                            const einnahmen = (formData.anzahlZimmerVermietet || 0) * (formData.untermieteProZimmer || 0);
                            const zusatzkosten = (formData.arbitrageStrom || 0) + (formData.arbitrageInternet || 0) + (formData.arbitrageGEZ ?? 18.36);
                            const ausgaben = (formData.eigeneWarmmiete || 0) + zusatzkosten;
                            const cashflow = einnahmen - ausgaben;
                            return (
                              <span className={`font-bold ${cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow)}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-500">Jährlicher Cashflow:</span>
                          {(() => {
                            const einnahmen = (formData.anzahlZimmerVermietet || 0) * (formData.untermieteProZimmer || 0);
                            const zusatzkosten = (formData.arbitrageStrom || 0) + (formData.arbitrageInternet || 0) + (formData.arbitrageGEZ ?? 18.36);
                            const ausgaben = (formData.eigeneWarmmiete || 0) + zusatzkosten;
                            const cashflow = (einnahmen - ausgaben) * 12;
                            return (
                              <span className={`font-semibold ${cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {cashflow >= 0 ? '+' : ''}{formatCurrency(cashflow)}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Immobilien-Karte Komponente
const ImmobilienKarte = ({ immobilie, onClick, onDelete }) => {
  const isMietimmobilie = immobilie.immobilienTyp === 'mietimmobilie';
  const aktuellerWert = immobilie.geschaetzterWert || immobilie.kaufpreis;
  const wertsteigerung = !isMietimmobilie ? berechneWertsteigerungSeitKauf(immobilie, aktuellerWert) : null;
  const restschuldInfo = !isMietimmobilie ? berechneRestschuld(immobilie) : null;

  // Arbitrage Cashflow berechnen
  const arbitrageCashflow = isMietimmobilie ? (() => {
    const einnahmen = (immobilie.anzahlZimmerVermietet || 0) * (immobilie.untermieteProZimmer || 0);
    const zusatzkosten = (immobilie.arbitrageStrom || 0) + (immobilie.arbitrageInternet || 0) + (immobilie.arbitrageGEZ ?? 18.36);
    const ausgaben = (immobilie.eigeneWarmmiete || 0) + zusatzkosten;
    return einnahmen - ausgaben;
  })() : 0;

  // Kaufimmobilie Cashflow berechnen
  const kaufCashflow = !isMietimmobilie ? (() => {
    const kaltmiete = immobilie.kaltmiete || 0;
    const zinssatz = immobilie.zinssatz ?? 4.0;
    const tilgung = immobilie.tilgung ?? 2.0;
    const kaufnebenkosten = immobilie.kaufnebenkosten ?? 10;
    const kaufnebenkostenAbsolut = (immobilie.kaufpreis || 0) * (kaufnebenkosten / 100);
    const gesamtinvestition = (immobilie.kaufpreis || 0) + kaufnebenkostenAbsolut;
    const gesamtEK = (immobilie.ekFuerNebenkosten || 0) + (immobilie.ekFuerKaufpreis || 0) || (immobilie.eigenkapital || 0);
    const kreditbetrag = immobilie.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);
    const monatlicheRate = kreditbetrag > 0 ? (kreditbetrag * ((zinssatz + tilgung) / 100)) / 12 : 0;
    const betriebskosten = (immobilie.nebenkosten || 0) + (immobilie.instandhaltung || 0) + (immobilie.verwaltung || 0) + (immobilie.hausgeld || 0) + (immobilie.strom || 0) + (immobilie.internet || 0);
    return kaltmiete - monatlicheRate - betriebskosten;
  })() : 0;

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-shadow border ${isMietimmobilie ? 'border-purple-200' : 'border-gray-100'}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{isMietimmobilie ? '🔄' : '🏠'}</span>
            <h3 className="text-lg font-bold text-gray-800">{immobilie.name || 'Unbenannte Immobilie'}</h3>
          </div>
          {isMietimmobilie && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
              Arbitrage-Modell
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Löschen
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        {immobilie.plz} {immobilie.adresse}
      </div>

      {/* Für Kaufimmobilie - normale Anzeige */}
      {!isMietimmobilie && (
        <>
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div><span className="text-gray-500">Wohnfläche:</span> {immobilie.wohnflaeche} m²</div>
            <div><span className="text-gray-500">Zimmer:</span> {immobilie.zimmer}</div>
            <div><span className="text-gray-500">Baujahr:</span> {immobilie.baujahr}</div>
            <div><span className="text-gray-500">Zustand:</span> {immobilie.zustand}</div>
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500">Kaufpreis</div>
                <div className="font-semibold">{formatCurrency(immobilie.kaufpreis)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Aktueller Wert</div>
                <div className="font-semibold text-blue-600">{formatCurrency(aktuellerWert)}</div>
              </div>
            </div>

            {restschuldInfo && restschuldInfo.anfangsFremdkapital > 0 && (
              <div className="mt-2 p-2 bg-orange-50 rounded text-sm border border-orange-100">
                <div className="flex justify-between">
                  <span className="text-gray-600">Restschuld:</span>
                  <span className="text-orange-700 font-semibold">{formatCurrency(restschuldInfo.restschuld)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">Bereits getilgt:</span>
                  <span className="text-green-600">{formatCurrency(restschuldInfo.getilgt)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">Netto-Eigenkapital:</span>
                  <span className="text-blue-600 font-medium">{formatCurrency(aktuellerWert - restschuldInfo.restschuld)}</span>
                </div>
              </div>
            )}

            {wertsteigerung && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Wertsteigerung seit Kauf:</span>
                  <span className={wertsteigerung.absoluteSteigerung >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {wertsteigerung.absoluteSteigerung >= 0 ? '+' : ''}{formatCurrency(wertsteigerung.absoluteSteigerung)}
                    ({wertsteigerung.prozentSteigerung >= 0 ? '+' : ''}{wertsteigerung.prozentSteigerung.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">Jährliche Rendite:</span>
                  <span className={wertsteigerung.jaehrlicheRendite >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {wertsteigerung.jaehrlicheRendite >= 0 ? '+' : ''}{wertsteigerung.jaehrlicheRendite.toFixed(2)}% p.a.
                  </span>
                </div>
              </div>
            )}

            {/* Cashflow für Kaufimmobilie */}
            <div className={`mt-2 p-2 rounded text-sm border ${kaufCashflow >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between">
                <span className="text-gray-600">💰 Monatlicher Cashflow:</span>
                <span className={`font-bold ${kaufCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kaufCashflow >= 0 ? '+' : ''}{formatCurrency(kaufCashflow)}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">Jährlicher Cashflow:</span>
                <span className={`font-medium ${kaufCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kaufCashflow >= 0 ? '+' : ''}{formatCurrency(kaufCashflow * 12)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Für Mietimmobilie - Arbitrage Anzeige */}
      {isMietimmobilie && (
        <>
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div><span className="text-gray-500">Wohnfläche:</span> {immobilie.wohnflaeche} m²</div>
            <div><span className="text-gray-500">Zimmer gesamt:</span> {immobilie.zimmer}</div>
            <div><span className="text-gray-500">Vermietet:</span> {immobilie.anzahlZimmerVermietet} Zimmer</div>
            <div><span className="text-gray-500">Pro Zimmer:</span> {formatCurrency(immobilie.untermieteProZimmer)}</div>
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500">Eigene Miete</div>
                <div className="font-semibold text-red-600">-{formatCurrency(immobilie.eigeneWarmmiete)}/m</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Einnahmen</div>
                <div className="font-semibold text-green-600">
                  +{formatCurrency((immobilie.anzahlZimmerVermietet || 0) * (immobilie.untermieteProZimmer || 0))}/m
                </div>
              </div>
            </div>

            <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded text-sm border border-green-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Monatlicher Cashflow:</span>
                <span className={`font-bold ${arbitrageCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {arbitrageCashflow >= 0 ? '+' : ''}{formatCurrency(arbitrageCashflow)}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">Jährlicher Cashflow:</span>
                <span className={`font-medium ${arbitrageCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {arbitrageCashflow >= 0 ? '+' : ''}{formatCurrency(arbitrageCashflow * 12)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Portfolio-Übersicht Komponente
const PortfolioOverview = ({ portfolio }) => {
  const stats = useMemo(() => {
    let gesamtKaufpreis = 0;
    let gesamtWert = 0;
    let gesamtMiete = 0;
    let gesamtFlaeche = 0;
    let gesamtCashflow = 0;
    let gesamtKreditrate = 0;
    let gesamtKosten = 0;
    let anzahlKaufimmobilien = 0;
    let anzahlMietimmobilien = 0;

    portfolio.forEach(immo => {
      const isMietimmobilie = immo.immobilienTyp === 'mietimmobilie';
      gesamtFlaeche += immo.wohnflaeche || 0;

      if (isMietimmobilie) {
        // Mietimmobilie (Arbitrage-Modell)
        anzahlMietimmobilien++;
        const einnahmen = (immo.anzahlZimmerVermietet || 0) * (immo.untermieteProZimmer || 0);
        const zusatzkosten = (immo.arbitrageStrom || 0) + (immo.arbitrageInternet || 0) + (immo.arbitrageGEZ ?? 18.36);
        const ausgaben = (immo.eigeneWarmmiete || 0) + zusatzkosten;
        const monatsCashflow = einnahmen - ausgaben;

        gesamtMiete += einnahmen * 12; // Einnahmen aus Untervermietung
        gesamtCashflow += monatsCashflow * 12;
        gesamtKosten += ausgaben * 12;
      } else {
        // Kaufimmobilie
        anzahlKaufimmobilien++;
        gesamtKaufpreis += immo.kaufpreis || 0;
        gesamtWert += immo.geschaetzterWert || immo.kaufpreis || 0;
        gesamtMiete += (immo.kaltmiete || 0) * 12;

        // Cashflow-Berechnung pro Kaufimmobilie
        const zinssatz = immo.zinssatz ?? 4.0;
        const tilgung = immo.tilgung ?? 2.0;
        const kaufnebenkosten = immo.kaufnebenkosten ?? 10;
        const instandhaltung = immo.instandhaltung ?? 100;
        const verwaltung = immo.verwaltung ?? 30;
        const hausgeld = immo.hausgeld ?? 0;
        const strom = immo.strom ?? 0;
        const internet = immo.internet ?? 0;

        // Fremdkapital berechnen
        const kaufnebenkostenAbsolut = (immo.kaufpreis || 0) * (kaufnebenkosten / 100);
        const gesamtinvestition = (immo.kaufpreis || 0) + kaufnebenkostenAbsolut;
        const gesamtEK = (immo.ekFuerNebenkosten !== undefined && immo.ekFuerKaufpreis !== undefined)
          ? (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0)
          : (immo.eigenkapital ?? (immo.kaufpreis || 0) * 0.2);
        const fremdkapital = immo.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);

        // Monatliche Kreditrate (Annuität)
        const monatszins = zinssatz / 100 / 12;
        const laufzeit = immo.laufzeit ?? 25;
        let monatlicheRate = 0;
        if (fremdkapital > 0 && monatszins > 0) {
          monatlicheRate = fremdkapital * (monatszins * Math.pow(1 + monatszins, laufzeit * 12)) /
                          (Math.pow(1 + monatszins, laufzeit * 12) - 1);
        }

        // Monatliche Kosten (inkl. zusätzliche Kosten bei möblierter Vermietung)
        const monatlicheKosten = instandhaltung + verwaltung + hausgeld + strom + internet;

        // Monatlicher Cashflow
        const monatsCashflow = (immo.kaltmiete || 0) - monatlicheRate - monatlicheKosten;

        gesamtCashflow += monatsCashflow * 12;
        gesamtKreditrate += monatlicheRate * 12;
        gesamtKosten += monatlicheKosten * 12;
      }
    });

    return {
      anzahl: portfolio.length,
      anzahlKaufimmobilien,
      anzahlMietimmobilien,
      gesamtKaufpreis,
      gesamtWert,
      wertsteigerung: gesamtWert - gesamtKaufpreis,
      gesamtMieteJahr: gesamtMiete,
      gesamtMieteMonat: gesamtMiete / 12,
      gesamtCashflowJahr: gesamtCashflow,
      gesamtCashflowMonat: gesamtCashflow / 12,
      gesamtKreditrateJahr: gesamtKreditrate,
      gesamtKostenJahr: gesamtKosten,
      gesamtFlaeche,
      durchschnittRendite: gesamtKaufpreis > 0 ? (gesamtMiete / gesamtKaufpreis) * 100 : 0
    };
  }, [portfolio]);

  if (portfolio.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-6">
      <h2 className="text-xl font-bold mb-4">Portfolio-Übersicht</h2>

      {/* Mieteinnahmen & Cashflow Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Mieteinnahmen */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-blue-200 text-sm mb-2">
            💰 Gesamte Mieteinnahmen
            {stats.anzahlMietimmobilien > 0 && stats.anzahlKaufimmobilien > 0 && (
              <span className="text-xs ml-1">(Kaltmiete + Untermiete)</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-300">{formatCurrency(stats.gesamtMieteMonat)}</div>
              <div className="text-blue-200 text-xs">pro Monat</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-300">{formatCurrency(stats.gesamtMieteJahr)}</div>
              <div className="text-blue-200 text-xs">pro Jahr</div>
            </div>
          </div>
        </div>

        {/* Cashflow */}
        <div className={`rounded-lg p-4 ${stats.gesamtCashflowMonat >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <div className="text-blue-200 text-sm mb-2">📊 Gesamt-Cashflow (nach Kredit & Kosten)</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={`text-2xl font-bold ${stats.gesamtCashflowMonat >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {stats.gesamtCashflowMonat >= 0 ? '+' : ''}{formatCurrency(stats.gesamtCashflowMonat)}
              </div>
              <div className="text-blue-200 text-xs">pro Monat</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${stats.gesamtCashflowJahr >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {stats.gesamtCashflowJahr >= 0 ? '+' : ''}{formatCurrency(stats.gesamtCashflowJahr)}
              </div>
              <div className="text-blue-200 text-xs">pro Jahr</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-blue-200 text-sm">Immobilien</div>
          <div className="text-2xl font-bold">{stats.anzahl}</div>
          {(stats.anzahlKaufimmobilien > 0 && stats.anzahlMietimmobilien > 0) && (
            <div className="text-xs text-blue-300 mt-1">
              🏠 {stats.anzahlKaufimmobilien} Kauf · 🔄 {stats.anzahlMietimmobilien} Miete
            </div>
          )}
        </div>
        <div>
          <div className="text-blue-200 text-sm">Gesamtwert (Eigentum)</div>
          <div className="text-2xl font-bold">{formatCurrency(stats.gesamtWert)}</div>
        </div>
        <div>
          <div className="text-blue-200 text-sm">Wertsteigerung</div>
          <div className={`text-2xl font-bold ${stats.wertsteigerung >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {stats.wertsteigerung >= 0 ? '+' : ''}{formatCurrency(stats.wertsteigerung)}
          </div>
        </div>
        <div>
          <div className="text-blue-200 text-sm">Ø Bruttorendite</div>
          <div className="text-2xl font-bold">{stats.durchschnittRendite.toFixed(2)}%</div>
          {stats.anzahlKaufimmobilien === 0 && stats.anzahlMietimmobilien > 0 && (
            <div className="text-xs text-blue-300 mt-1">nur Arbitrage</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Kaufnebenkosten-Manager Komponente
const KaufnebenkostenManager = ({ params, updateParams, kaufpreis }) => {
  const [modus, setModus] = useState(params.kaufnebenkostenModus || 'prozent'); // 'prozent' oder 'manuell'

  // Manuelle Positionen mit Standardwerten basierend auf Bundesland
  const [positionen, setPositionen] = useState(params.kaufnebenkostenPositionen || {
    grunderwerbsteuer: kaufpreis * 0.035,
    notar: kaufpreis * 0.015,
    grundbuch: kaufpreis * 0.005,
    makler: kaufpreis * 0.0357,
    sonstige: 0
  });

  const bundeslaender = {
    'bayern': { name: 'Bayern', grunderwerbsteuer: 3.5 },
    'baden-wuerttemberg': { name: 'Baden-Württemberg', grunderwerbsteuer: 5.0 },
    'berlin': { name: 'Berlin', grunderwerbsteuer: 6.0 },
    'brandenburg': { name: 'Brandenburg', grunderwerbsteuer: 6.5 },
    'bremen': { name: 'Bremen', grunderwerbsteuer: 5.0 },
    'hamburg': { name: 'Hamburg', grunderwerbsteuer: 5.5 },
    'hessen': { name: 'Hessen', grunderwerbsteuer: 6.0 },
    'mecklenburg': { name: 'Mecklenburg-Vorpommern', grunderwerbsteuer: 6.0 },
    'niedersachsen': { name: 'Niedersachsen', grunderwerbsteuer: 5.0 },
    'nrw': { name: 'Nordrhein-Westfalen', grunderwerbsteuer: 6.5 },
    'rheinland-pfalz': { name: 'Rheinland-Pfalz', grunderwerbsteuer: 5.0 },
    'saarland': { name: 'Saarland', grunderwerbsteuer: 6.5 },
    'sachsen': { name: 'Sachsen', grunderwerbsteuer: 5.5 },
    'sachsen-anhalt': { name: 'Sachsen-Anhalt', grunderwerbsteuer: 5.0 },
    'schleswig-holstein': { name: 'Schleswig-Holstein', grunderwerbsteuer: 6.5 },
    'thueringen': { name: 'Thüringen', grunderwerbsteuer: 5.0 }
  };

  const [bundesland, setBundesland] = useState(params.bundesland || 'bayern');

  const kaufnebenkostenAbsolut = modus === 'prozent'
    ? kaufpreis * (params.kaufnebenkosten / 100)
    : Object.values(positionen).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const gesamtinvestition = kaufpreis + kaufnebenkostenAbsolut;

  const handlePositionChange = (key, value) => {
    const neuePositionen = { ...positionen, [key]: parseFloat(value) || 0 };
    setPositionen(neuePositionen);
    const neuesGesamt = Object.values(neuePositionen).reduce((sum, val) => sum + val, 0);
    const neuerProzentsatz = kaufpreis > 0 ? (neuesGesamt / kaufpreis) * 100 : 0;
    updateParams({
      ...params,
      kaufnebenkosten: neuerProzentsatz,
      kaufnebenkostenModus: 'manuell',
      kaufnebenkostenPositionen: neuePositionen
    });
  };

  const handleBundeslandChange = (bl) => {
    setBundesland(bl);
    const neueGrunderwerbsteuer = kaufpreis * (bundeslaender[bl].grunderwerbsteuer / 100);
    const neuePositionen = { ...positionen, grunderwerbsteuer: neueGrunderwerbsteuer };
    setPositionen(neuePositionen);
    const neuesGesamt = Object.values(neuePositionen).reduce((sum, val) => sum + val, 0);
    const neuerProzentsatz = kaufpreis > 0 ? (neuesGesamt / kaufpreis) * 100 : 0;
    updateParams({
      ...params,
      kaufnebenkosten: neuerProzentsatz,
      bundesland: bl,
      kaufnebenkostenPositionen: neuePositionen
    });
  };

  const handleModusChange = (neuerModus) => {
    setModus(neuerModus);
    updateParams({ ...params, kaufnebenkostenModus: neuerModus });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-700">Kaufnebenkosten</h4>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => handleModusChange('prozent')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${modus === 'prozent' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Pauschal %
          </button>
          <button
            onClick={() => handleModusChange('manuell')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${modus === 'manuell' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Aufgeschlüsselt
          </button>
        </div>
      </div>

      {modus === 'prozent' ? (
        <div>
          <InputSliderCombo
            label="Kaufnebenkosten gesamt"
            value={params.kaufnebenkosten}
            onChange={(v) => updateParams({...params, kaufnebenkosten: v})}
            min={5}
            max={15}
            step={0.5}
            unit="%"
          />
          <div className="text-sm text-gray-600 mt-2">
            = {formatCurrency(kaufpreis * (params.kaufnebenkosten / 100))}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Bundesland (für Grunderwerbsteuer)</label>
            <select
              value={bundesland}
              onChange={(e) => handleBundeslandChange(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              {Object.entries(bundeslaender).map(([key, val]) => (
                <option key={key} value={key}>{val.name} ({val.grunderwerbsteuer}%)</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {[
              { key: 'grunderwerbsteuer', label: `Grunderwerbsteuer (${bundeslaender[bundesland].grunderwerbsteuer}%)` },
              { key: 'notar', label: 'Notar (ca. 1,5%)' },
              { key: 'grundbuch', label: 'Grundbuch (ca. 0,5%)' },
              { key: 'makler', label: 'Makler (ca. 3,57%)' },
              { key: 'sonstige', label: 'Sonstige' }
            ].map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center">
                <label className="text-sm text-gray-600">{label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={Math.round(positionen[key] || 0)}
                    onChange={(e) => handlePositionChange(key, e.target.value)}
                    className="w-24 px-2 py-1 border rounded text-sm text-right"
                  />
                  <span className="text-xs text-gray-500">€</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="font-medium text-gray-700">Nebenkosten gesamt</span>
            <span className="font-bold">{formatCurrency(kaufnebenkostenAbsolut)}</span>
          </div>
        </div>
      )}

      {/* Gesamtinvestition Anzeige */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Kaufpreis:</span>
          <span>{formatCurrency(kaufpreis)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>+ Nebenkosten:</span>
          <span>{formatCurrency(kaufnebenkostenAbsolut)}</span>
        </div>
        <div className="flex justify-between font-bold text-blue-700 pt-2 border-t border-blue-200 mt-2">
          <span>Gesamtinvestition:</span>
          <span>{formatCurrency(gesamtinvestition)}</span>
        </div>
      </div>
    </div>
  );
};

// Miet- und Kostenmanager Komponente
const MietKostenManager = ({ params, updateParams, immobilie, hasChanges, setHasChanges }) => {
  const [modus, setModus] = useState(immobilie.mietModus || 'automatisch'); // 'automatisch' oder 'manuell'
  const [ansicht, setAnsicht] = useState('jahr'); // 'jahr' oder 'monat'
  const [mietHistorie, setMietHistorie] = useState(immobilie.mietHistorie || {});

  const kaufjahr = immobilie.kaufdatum ? new Date(immobilie.kaufdatum).getFullYear() : new Date().getFullYear();
  const aktuellesJahr = new Date().getFullYear();
  const jahre = [];
  for (let j = kaufjahr; j <= aktuellesJahr + 5; j++) {
    jahre.push(j);
  }

  const monate = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  const getWertFuerZeitraum = (jahr, monat = null, feld) => {
    const key = monat !== null ? `${jahr}-${monat}` : `${jahr}`;
    if (mietHistorie[key] && mietHistorie[key][feld] !== undefined) {
      return mietHistorie[key][feld];
    }
    // Fallback auf params oder berechne mit Steigerung
    const jahreVergangen = jahr - kaufjahr;
    const basisWert = params[feld] || 0;
    if (modus === 'automatisch' && feld === 'kaltmiete') {
      return Math.round(basisWert * Math.pow(1 + (params.mietsteigerung || 0) / 100, jahreVergangen));
    }
    return basisWert;
  };

  const setWertFuerZeitraum = (jahr, monat, feld, wert) => {
    const key = monat !== null ? `${jahr}-${monat}` : `${jahr}`;
    const neueHistorie = {
      ...mietHistorie,
      [key]: {
        ...(mietHistorie[key] || {}),
        [feld]: parseFloat(wert) || 0
      }
    };
    setMietHistorie(neueHistorie);
    updateParams({ ...params, mietHistorie: neueHistorie, mietModus: modus });
  };

  const handleModusChange = (neuerModus) => {
    setModus(neuerModus);
    updateParams({ ...params, mietModus: neuerModus });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Einnahmen & Kosten</h3>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => handleModusChange('automatisch')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${modus === 'automatisch' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Automatisch
          </button>
          <button
            onClick={() => handleModusChange('manuell')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${modus === 'manuell' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Manuell
          </button>
        </div>
      </div>

      {modus === 'automatisch' ? (
        <div>
          <p className="text-xs text-gray-500 mb-3">Basiswerte mit jährlicher Steigerung</p>
          <InputSliderCombo label="Kaltmiete (Basis)" value={params.kaltmiete} onChange={(v) => updateParams({...params, kaltmiete: v})} min={200} max={5000} step={50} unit="€" />
          <InputSliderCombo label="Mietsteigerung p.a." value={params.mietsteigerung} onChange={(v) => updateParams({...params, mietsteigerung: v})} min={0} max={5} step={0.1} unit="%" />
          <div className="border-t pt-3 mt-3">
            <InputSliderCombo label="Nebenkosten" value={params.nebenkosten} onChange={(v) => updateParams({...params, nebenkosten: v})} min={0} max={500} step={10} unit="€" />
            <InputSliderCombo label="Instandhaltung" value={params.instandhaltung} onChange={(v) => updateParams({...params, instandhaltung: v})} min={0} max={500} step={10} unit="€" />
            <InputSliderCombo label="Verwaltung" value={params.verwaltung} onChange={(v) => updateParams({...params, verwaltung: v})} min={0} max={200} step={5} unit="€" />
          </div>
          {/* Zusätzliche Kosten bei möblierter Vermietung */}
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-gray-500 mb-2">📦 Zusätzliche Kosten (z.B. möblierte Vermietung)</p>
            <InputSliderCombo label="WEG / Hausgeld" value={params.hausgeld} onChange={(v) => updateParams({...params, hausgeld: v})} min={0} max={500} step={10} unit="€" info="Monatliches Hausgeld an die WEG" />
            <InputSliderCombo label="Strom" value={params.strom} onChange={(v) => updateParams({...params, strom: v})} min={0} max={300} step={5} unit="€" info="Stromkosten (wenn vom Vermieter getragen)" />
            <InputSliderCombo label="Internet" value={params.internet} onChange={(v) => updateParams({...params, internet: v})} min={0} max={100} step={5} unit="€" info="Internetkosten (wenn vom Vermieter getragen)" />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-gray-500">Manuelle Eingabe pro Zeitraum</p>
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setAnsicht('jahr')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${ansicht === 'jahr' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
              >
                Jahre
              </button>
              <button
                onClick={() => setAnsicht('monat')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${ansicht === 'monat' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
              >
                Monate
              </button>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-3">
            {ansicht === 'jahr' ? (
              // Jahresansicht - Card Layout
              jahre.map(jahr => (
                <div key={jahr} className={`border rounded-lg p-3 ${jahr === aktuellesJahr ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-gray-800">{jahr}</span>
                    {jahr === aktuellesJahr && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Aktuell</span>}
                  </div>

                  {/* Einnahmen */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-green-700 mb-2">📈 Einnahmen</div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                        <label className="text-sm text-gray-700">Kaltmiete</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'kaltmiete')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'kaltmiete', e.target.value)}
                            className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-500">€</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kosten */}
                  <div>
                    <div className="text-xs font-semibold text-red-700 mb-2">📉 Kosten</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Nebenkosten</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'nebenkosten')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'nebenkosten', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Instandhaltung</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'instandhaltung')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'instandhaltung', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Verwaltung</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'verwaltung')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'verwaltung', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Hausgeld</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'hausgeld')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'hausgeld', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Strom</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'strom')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'strom', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <label className="text-xs text-gray-600">Internet</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={getWertFuerZeitraum(jahr, null, 'internet')}
                            onChange={(e) => setWertFuerZeitraum(jahr, null, 'internet', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right text-sm"
                          />
                          <span className="text-xs text-gray-400">€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Monatsansicht - Card Layout
              <div>
                <select
                  className="w-full mb-3 p-2 border rounded-lg text-sm font-semibold"
                  onChange={(e) => document.getElementById(`monat-${e.target.value}`)?.scrollIntoView({ behavior: 'smooth' })}
                  defaultValue={aktuellesJahr}
                >
                  {jahre.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                {jahre.map(jahr => (
                  <div key={jahr} id={`monat-${jahr}`} className="mb-6">
                    <div className={`font-bold text-lg p-2 rounded-t-lg ${jahr === aktuellesJahr ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {jahr}
                    </div>
                    <div className="border border-t-0 rounded-b-lg divide-y">
                      {monate.map((monat, idx) => {
                        const aktuellerMonat = new Date().getMonth();
                        const istAktuell = jahr === aktuellesJahr && idx === aktuellerMonat;
                        return (
                          <div key={`${jahr}-${idx}`} className={`p-3 ${istAktuell ? 'bg-blue-50' : ''}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-gray-700">{monat}</span>
                              {istAktuell && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Aktuell</span>}
                            </div>

                            {/* Einnahmen */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                                <label className="text-sm text-green-800">💰 Kaltmiete</label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={getWertFuerZeitraum(jahr, idx, 'kaltmiete')}
                                    onChange={(e) => setWertFuerZeitraum(jahr, idx, 'kaltmiete', e.target.value)}
                                    className="w-24 px-2 py-1 border border-green-300 rounded text-right text-sm"
                                  />
                                  <span className="text-xs text-gray-500">€</span>
                                </div>
                              </div>
                            </div>

                            {/* Kosten Grid */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">NK</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'nebenkosten')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'nebenkosten', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Inst.</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'instandhaltung')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'instandhaltung', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Verw.</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'verwaltung')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'verwaltung', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Hausgeld</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'hausgeld')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'hausgeld', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Strom</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'strom')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'strom', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <label className="text-gray-500 block mb-1">Internet</label>
                                <input
                                  type="number"
                                  value={getWertFuerZeitraum(jahr, idx, 'internet')}
                                  onChange={(e) => setWertFuerZeitraum(jahr, idx, 'internet', e.target.value)}
                                  className="w-full px-1 py-1 border rounded text-right"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Alle Werte in € pro Monat</p>
        </div>
      )}
    </div>
  );
};

// Cashflow-Übersicht Komponente
const CashflowUebersicht = ({ params, ergebnis, immobilie, investitionen = [] }) => {
  const [ansicht, setAnsicht] = useState('monat'); // 'monat' oder 'jahr'

  const kaufjahr = immobilie.kaufdatum ? new Date(immobilie.kaufdatum).getFullYear() : new Date().getFullYear();
  const aktuellesJahr = new Date().getFullYear();

  // Berechne Cashflow-Daten pro Jahr
  const cashflowDaten = useMemo(() => {
    const daten = [];
    let kumulierterCashflow = 0;

    for (let jahr = kaufjahr; jahr <= aktuellesJahr + 5; jahr++) {
      const jahreIndex = jahr - kaufjahr;
      const mieteFaktor = Math.pow(1 + (params.mietsteigerung || 0) / 100, jahreIndex);

      const jahresMiete = params.kaltmiete * 12 * mieteFaktor;
      const jahresKosten = (params.nebenkosten + params.instandhaltung + params.verwaltung + (params.hausgeld || 0) + (params.strom || 0) + (params.internet || 0)) * 12;
      const jahresKreditrate = ergebnis.monatlicheRate * 12;

      // Investitionen für dieses Jahr
      const jahresInvestitionen = investitionen
        .filter(inv => new Date(inv.datum).getFullYear() === jahr)
        .reduce((sum, inv) => sum + inv.betrag, 0);

      const jahresCashflow = jahresMiete - jahresKosten - jahresKreditrate - jahresInvestitionen;
      kumulierterCashflow += jahresCashflow;

      daten.push({
        jahr,
        einnahmen: Math.round(jahresMiete),
        kosten: Math.round(jahresKosten),
        kreditrate: Math.round(jahresKreditrate),
        investitionen: Math.round(jahresInvestitionen),
        cashflow: Math.round(jahresCashflow),
        kumuliert: Math.round(kumulierterCashflow)
      });
    }
    return daten;
  }, [params, ergebnis, kaufjahr, investitionen]);

  // Berechne Zins- und Tilgungsanteil
  const berechneZinsTilgung = () => {
    const zinssatz = params.zinssatz ?? 4.0;
    const kaufnebenkosten = params.kaufnebenkosten ?? 10;
    const kaufnebenkostenAbsolut = params.kaufpreis * (kaufnebenkosten / 100);
    const gesamtinvestition = params.kaufpreis + kaufnebenkostenAbsolut;
    const gesamtEK = (params.ekFuerNebenkosten !== undefined && params.ekFuerKaufpreis !== undefined)
      ? (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0)
      : (params.eigenkapital ?? params.kaufpreis * 0.2);
    const fremdkapital = params.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);

    // Aktuelle Restschuld berechnen (vereinfacht: nehme anfängliche Restschuld)
    const restschuld = fremdkapital; // Für genauere Berechnung müsste man die tatsächliche Restschuld nehmen
    const monatsZinsen = restschuld * (zinssatz / 100 / 12);
    const monatsTilgung = ergebnis.monatlicheRate - monatsZinsen;

    return {
      zinsen: Math.max(0, monatsZinsen),
      tilgung: Math.max(0, monatsTilgung),
      gesamt: ergebnis.monatlicheRate
    };
  };

  const kreditDetails = berechneZinsTilgung();

  const monatsDaten = {
    einnahmen: params.kaltmiete,
    nebenkosten: params.nebenkosten,
    instandhaltung: params.instandhaltung,
    verwaltung: params.verwaltung,
    hausgeld: params.hausgeld || 0,
    strom: params.strom || 0,
    internet: params.internet || 0,
    kreditrate: ergebnis.monatlicheRate,
    zinsen: kreditDetails.zinsen,
    tilgung: kreditDetails.tilgung,
    // Cashflow neu berechnen mit allen Kosten
    get gesamtKosten() { return this.nebenkosten + this.instandhaltung + this.verwaltung + this.hausgeld + this.strom + this.internet; },
    get cashflowMitTilgung() { return this.einnahmen - this.gesamtKosten - this.kreditrate; },
    get cashflowOhneTilgung() { return this.einnahmen - this.gesamtKosten - this.zinsen; }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">💰 Cashflow-Übersicht</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setAnsicht('monat')}
            className={`px-3 py-1 text-xs rounded-md ${ansicht === 'monat' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setAnsicht('jahr')}
            className={`px-3 py-1 text-xs rounded-md ${ansicht === 'jahr' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            Jährlich
          </button>
        </div>
      </div>

      {ansicht === 'monat' ? (
        <div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-green-600">+ Mieteinnahmen</span>
              <span className="font-semibold text-green-600">{formatCurrency(monatsDaten.einnahmen)}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm">
              <span className="text-red-500">- Nebenkosten</span>
              <span className="text-red-500">{formatCurrency(monatsDaten.nebenkosten)}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm">
              <span className="text-red-500">- Instandhaltung</span>
              <span className="text-red-500">{formatCurrency(monatsDaten.instandhaltung)}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-sm">
              <span className="text-red-500">- Verwaltung</span>
              <span className="text-red-500">{formatCurrency(monatsDaten.verwaltung)}</span>
            </div>
            {monatsDaten.hausgeld > 0 && (
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-red-500">- WEG / Hausgeld</span>
                <span className="text-red-500">{formatCurrency(monatsDaten.hausgeld)}</span>
              </div>
            )}
            {monatsDaten.strom > 0 && (
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-red-500">- Strom</span>
                <span className="text-red-500">{formatCurrency(monatsDaten.strom)}</span>
              </div>
            )}
            {monatsDaten.internet > 0 && (
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-red-500">- Internet</span>
                <span className="text-red-500">{formatCurrency(monatsDaten.internet)}</span>
              </div>
            )}
            {/* Kreditrate aufgeschlüsselt */}
            <div className="border-t border-b py-2 my-1">
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-red-500">- Zinsen</span>
                <span className="text-red-500">{formatCurrency(monatsDaten.zinsen)}</span>
              </div>
              <div className="flex justify-between items-center py-1 text-sm">
                <span className="text-blue-500">- Tilgung <span className="text-xs text-gray-400">(Vermögensaufbau)</span></span>
                <span className="text-blue-500">{formatCurrency(monatsDaten.tilgung)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm border-t border-dashed">
                <span className="text-gray-600">= Kreditrate gesamt</span>
                <span className="font-semibold text-gray-600">{formatCurrency(monatsDaten.kreditrate)}</span>
              </div>
            </div>

            {/* Cashflow-Vergleich */}
            <div className="space-y-2 mt-3">
              {/* Cashflow OHNE Tilgung (nur Zinsen) */}
              <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${monatsDaten.cashflowOhneTilgung >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div>
                  <span className="font-semibold text-sm">Cashflow vor Tilgung</span>
                  <span className="text-xs text-gray-500 block">Miete - Kosten - Zinsen</span>
                </div>
                <span className={`text-lg font-bold ${monatsDaten.cashflowOhneTilgung >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monatsDaten.cashflowOhneTilgung >= 0 ? '+' : ''}{formatCurrency(monatsDaten.cashflowOhneTilgung)}
                </span>
              </div>

              {/* Cashflow MIT Tilgung */}
              <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${monatsDaten.cashflowMitTilgung >= 0 ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                <div>
                  <span className="font-semibold">Cashflow nach Tilgung</span>
                  <span className="text-xs text-gray-500 block">Miete - Kosten - Kreditrate</span>
                </div>
                <span className={`text-xl font-bold ${monatsDaten.cashflowMitTilgung >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {monatsDaten.cashflowMitTilgung >= 0 ? '+' : ''}{formatCurrency(monatsDaten.cashflowMitTilgung)}
                </span>
              </div>
            </div>
          </div>

          {/* Jahresübersicht */}
          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs">Jährlich vor Tilgung</div>
              <div className={`font-semibold ${monatsDaten.cashflowOhneTilgung >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monatsDaten.cashflowOhneTilgung >= 0 ? '+' : ''}{formatCurrency(monatsDaten.cashflowOhneTilgung * 12)}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Jährlich nach Tilgung</div>
              <div className={`font-semibold ${monatsDaten.cashflowMitTilgung >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {monatsDaten.cashflowMitTilgung >= 0 ? '+' : ''}{formatCurrency(monatsDaten.cashflowMitTilgung * 12)}
              </div>
            </div>
          </div>

          {/* Hinweis */}
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            💡 <strong>Vor Tilgung</strong> zeigt den tatsächlichen Geldfluss ohne Vermögensaufbau.
            Die Tilgung ({formatCurrency(monatsDaten.tilgung)}/Monat) baut Eigenkapital auf.
          </div>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Jahr</th>
                  <th className="text-right p-2 text-green-600">Einnahmen</th>
                  <th className="text-right p-2 text-red-500">Kosten</th>
                  <th className="text-right p-2 text-red-600">Kredit</th>
                  <th className="text-right p-2 text-orange-500">Invest.</th>
                  <th className="text-right p-2 font-semibold">Cashflow</th>
                  <th className="text-right p-2 text-blue-600">Kumuliert</th>
                </tr>
              </thead>
              <tbody>
                {cashflowDaten.map(d => (
                  <tr key={d.jahr} className={d.jahr === aktuellesJahr ? 'bg-blue-50' : ''}>
                    <td className="p-2 font-semibold">{d.jahr}</td>
                    <td className="p-2 text-right text-green-600">{formatCurrency(d.einnahmen)}</td>
                    <td className="p-2 text-right text-red-500">{formatCurrency(d.kosten)}</td>
                    <td className="p-2 text-right text-red-600">{formatCurrency(d.kreditrate)}</td>
                    <td className="p-2 text-right text-orange-500">{d.investitionen > 0 ? formatCurrency(d.investitionen) : '-'}</td>
                    <td className={`p-2 text-right font-semibold ${d.cashflow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {d.cashflow >= 0 ? '+' : ''}{formatCurrency(d.cashflow)}
                    </td>
                    <td className={`p-2 text-right ${d.kumuliert >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(d.kumuliert)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Steuerberechnung Komponente - Jahresbezogen mit Investitionen & Finanzierung
const Steuerberechnung = ({ params, ergebnis, immobilie, onUpdateParams }) => {
  const aktuellesJahr = new Date().getFullYear();
  const kaufjahr = params.kaufdatum ? new Date(params.kaufdatum).getFullYear() : aktuellesJahr;

  const [selectedJahr, setSelectedJahr] = useState(aktuellesJahr);
  const [showEinmaleffekteHerausrechnen, setShowEinmaleffekteHerausrechnen] = useState(false);
  const [showFahrtForm, setShowFahrtForm] = useState(false);
  const [neueFahrt, setNeueFahrt] = useState({
    datum: new Date().toISOString().split('T')[0],
    grund: '',
    km: params.entfernungKm || 0
  });

  // Werte aus params lesen (persistent)
  const steuersatz = params.steuersatz || 42;
  const gebaeudeAnteilProzent = params.gebaeudeAnteilProzent || 80;
  const afaSatz = params.afaSatz || 2.0;
  const fahrtkostenModus = params.fahrtkostenModus || 'pauschal';
  const fahrtenProMonat = params.fahrtenProMonat || 0;
  const entfernungKm = params.entfernungKm || 0;
  const kmPauschale = params.kmPauschale || 0.30;
  const fahrtenListe = params.fahrtenListe || [];
  const investitionen = params.investitionen || [];

  const fahrtGruende = ['Wohnungsbesichtigung', 'Mieterkontakt', 'Reparatur/Handwerker', 'Zählerablesung', 'Übergabe/Abnahme', 'Kontrolle', 'Sonstiges'];

  // Investitions-Kategorien mit steuerlicher Behandlung
  const steuerKategorien = {
    'erhaltung': { label: 'Erhaltungsaufwand', steuer: 'sofort', icon: '⚠️' },
    'herstellung': { label: 'Herstellungskosten', steuer: 'afa', icon: '🔁' },
    'anschaffung': { label: 'Anschaffungsnebenk.', steuer: 'afa', icon: '🔁' },
    'modernisierung': { label: 'Modernisierung', steuer: 'afa', icon: '🏗' },
    'nicht_relevant': { label: 'Nicht steuerlich', steuer: 'keine', icon: '📦' }
  };

  // Helper zum Aktualisieren der params
  const updateSteuerParams = (updates) => {
    if (onUpdateParams) {
      onUpdateParams({ ...params, ...updates });
    }
  };

  const handleAddFahrt = () => {
    if (!neueFahrt.datum || !neueFahrt.km) return;
    const updated = [...fahrtenListe, { ...neueFahrt, id: Date.now() }];
    updateSteuerParams({ fahrtenListe: updated });
    setNeueFahrt({ datum: new Date().toISOString().split('T')[0], grund: '', km: entfernungKm || 0 });
    setShowFahrtForm(false);
  };

  const handleDeleteFahrt = (id) => {
    updateSteuerParams({ fahrtenListe: fahrtenListe.filter(f => f.id !== id) });
  };

  // Jahre für Auswahl generieren
  const verfuegbareJahre = [];
  for (let j = kaufjahr; j <= aktuellesJahr + 2; j++) {
    verfuegbareJahre.push(j);
  }

  // Berechne Steuer für ein bestimmtes Jahr
  const berechneJahresSteuer = (jahr, bereinigt = false) => {
    const jahreIndex = jahr - kaufjahr;
    if (jahreIndex < 0) return null;

    // Mieteinnahmen mit Steigerung
    const mieteFaktor = Math.pow(1 + (params.mietsteigerung || 0) / 100, jahreIndex);
    const jahresMiete = params.kaltmiete * 12 * mieteFaktor;

    // Laufende Kosten (Werbungskosten)
    const laufendeKosten = (params.instandhaltung + params.verwaltung + (params.hausgeld || 0)) * 12;

    // Finanzierungskosten (nur Zinsen - Tilgung ist nicht absetzbar!)
    const zinssatz = params.zinssatz ?? 4.0;
    const kaufnebenkosten = params.kaufnebenkosten ?? 10;
    const kaufnebenkostenAbsolut = params.kaufpreis * (kaufnebenkosten / 100);
    const gesamtinvestition = params.kaufpreis + kaufnebenkostenAbsolut;
    const gesamtEK = (params.ekFuerNebenkosten !== undefined && params.ekFuerKaufpreis !== undefined)
      ? (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0)
      : (params.eigenkapital ?? params.kaufpreis * 0.2);
    const anfangsFremdkapital = params.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);

    // Restschuld für dieses Jahr berechnen
    const monatszins = zinssatz / 100 / 12;
    const laufzeit = params.laufzeit ?? 25;
    let annuitaet = 0;
    if (anfangsFremdkapital > 0 && monatszins > 0) {
      annuitaet = anfangsFremdkapital * (monatszins * Math.pow(1 + monatszins, laufzeit * 12)) / (Math.pow(1 + monatszins, laufzeit * 12) - 1);
    }

    let restschuld = anfangsFremdkapital;
    for (let m = 0; m < jahreIndex * 12 && restschuld > 0; m++) {
      const monatsZinsen = restschuld * monatszins;
      const monatsTilgung = Math.min(annuitaet - monatsZinsen, restschuld);
      restschuld = Math.max(0, restschuld - monatsTilgung);
    }

    // Zinsen für dieses Jahr
    let jahresZinsen = 0;
    for (let m = 0; m < 12 && restschuld > 0; m++) {
      const monatsZinsen = restschuld * monatszins;
      jahresZinsen += monatsZinsen;
      const monatsTilgung = Math.min(annuitaet - monatsZinsen, restschuld);
      restschuld = Math.max(0, restschuld - monatsTilgung);
    }

    // AfA Basis-Berechnung
    const gebaeudeAnteil = params.kaufpreis * (gebaeudeAnteilProzent / 100);
    let afaBemessungsgrundlage = gebaeudeAnteil;

    // AfA-relevante Investitionen aus Vorjahren hinzurechnen
    const afaInvestitionenBisJahr = investitionen.filter(inv => {
      const invJahr = new Date(inv.datum).getFullYear();
      const kat = steuerKategorien[inv.kategorie || 'erhaltung'];
      return invJahr <= jahr && kat?.steuer === 'afa';
    });
    const zusaetzlicheAfABasis = afaInvestitionenBisJahr.reduce((sum, inv) => sum + inv.betrag, 0);
    afaBemessungsgrundlage += zusaetzlicheAfABasis;

    const jahresAfa = afaBemessungsgrundlage * (afaSatz / 100);

    // Investitionen dieses Jahres
    const investitionenDiesesJahr = investitionen.filter(inv => new Date(inv.datum).getFullYear() === jahr);
    const sofortAbsetzbar = investitionenDiesesJahr
      .filter(inv => steuerKategorien[inv.kategorie || 'erhaltung']?.steuer === 'sofort')
      .reduce((sum, inv) => sum + inv.betrag, 0);
    const afaRelevant = investitionenDiesesJahr
      .filter(inv => steuerKategorien[inv.kategorie || 'erhaltung']?.steuer === 'afa')
      .reduce((sum, inv) => sum + inv.betrag, 0);
    const nichtRelevant = investitionenDiesesJahr
      .filter(inv => steuerKategorien[inv.kategorie || 'erhaltung']?.steuer === 'keine')
      .reduce((sum, inv) => sum + inv.betrag, 0);

    // Fahrtkosten für dieses Jahr
    let jahresFahrtkosten = 0;
    if (fahrtkostenModus === 'pauschal') {
      jahresFahrtkosten = fahrtenProMonat * 12 * entfernungKm * 2 * kmPauschale;
    } else {
      const fahrtenDiesesJahr = fahrtenListe.filter(f => new Date(f.datum).getFullYear() === jahr);
      jahresFahrtkosten = fahrtenDiesesJahr.reduce((sum, f) => sum + (f.km * 2 * kmPauschale), 0);
    }

    // Bereinigung: Einmaleffekte herausrechnen
    const einmaleffekte = bereinigt ? sofortAbsetzbar : 0;

    // Steuerliche Berechnung
    const absetzbareKosten = jahresAfa + jahresZinsen + laufendeKosten + jahresFahrtkosten + (bereinigt ? 0 : sofortAbsetzbar);
    const zuVersteuern = jahresMiete - absetzbareKosten;
    const steuerEffekt = zuVersteuern * (steuersatz / 100);

    // Jahr-Typ bestimmen
    let jahrTyp = 'normal';
    if (investitionenDiesesJahr.length > 0 && (sofortAbsetzbar + afaRelevant) > jahresMiete * 0.5) {
      jahrTyp = 'investition';
    } else if (jahresZinsen > jahresMiete * 0.7) {
      jahrTyp = 'finanzierung';
    }

    return {
      jahr,
      jahrTyp,
      einnahmen: Math.round(jahresMiete),
      laufendeKosten: Math.round(laufendeKosten),
      zinsen: Math.round(jahresZinsen),
      afa: Math.round(jahresAfa),
      afaBemessungsgrundlage: Math.round(afaBemessungsgrundlage),
      fahrtkosten: Math.round(jahresFahrtkosten),
      investitionenSofort: Math.round(sofortAbsetzbar),
      investitionenAfa: Math.round(afaRelevant),
      investitionenNichtRelevant: Math.round(nichtRelevant),
      investitionenGesamt: investitionenDiesesJahr,
      absetzbareKosten: Math.round(absetzbareKosten),
      zuVersteuern: Math.round(zuVersteuern),
      steuerEffekt: Math.round(steuerEffekt),
      restschuld: Math.round(restschuld),
      einmaleffekte: Math.round(einmaleffekte)
    };
  };

  const selectedDaten = berechneJahresSteuer(selectedJahr, showEinmaleffekteHerausrechnen);
  const selectedDatenReal = berechneJahresSteuer(selectedJahr, false);
  const afaJahre = afaSatz > 0 ? Math.round(100 / afaSatz) : 0;

  // Fahrten für gewähltes Jahr
  const fahrtenSelectedJahr = fahrtenListe.filter(f => new Date(f.datum).getFullYear() === selectedJahr);

  return (
    <div className="space-y-4">
      {/* Header mit Jahresauswahl */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h3 className="font-bold text-lg text-gray-800">📋 Steuerberechnung</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Steuerjahr:</span>
            <div className="flex flex-wrap gap-1">
              {verfuegbareJahre.map(j => {
                const jDaten = berechneJahresSteuer(j);
                const isInvest = jDaten?.jahrTyp === 'investition';
                const isFinanz = jDaten?.jahrTyp === 'finanzierung';
                return (
                  <button
                    key={j}
                    onClick={() => setSelectedJahr(j)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      selectedJahr === j
                        ? 'bg-blue-600 text-white font-semibold'
                        : isInvest
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : isFinanz
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isInvest ? 'Investitionsjahr' : isFinanz ? 'Finanzierungsstarkes Jahr' : 'Normales Jahr'}
                  >
                    {j}
                    {isInvest && ' 🔨'}
                    {isFinanz && ' 🏦'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Jahr-Typ Badge */}
        {selectedDaten && (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
            selectedDaten.jahrTyp === 'investition' ? 'bg-orange-100 text-orange-700' :
            selectedDaten.jahrTyp === 'finanzierung' ? 'bg-purple-100 text-purple-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {selectedDaten.jahrTyp === 'investition' && '🔨 Investitionsjahr'}
            {selectedDaten.jahrTyp === 'finanzierung' && '🏦 Finanzierungsstarkes Jahr'}
            {selectedDaten.jahrTyp === 'normal' && '📊 Normales Vermietungsjahr'}
          </div>
        )}

        {/* Persönlicher Steuersatz */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">Persönlicher Steuersatz</label>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="45" value={steuersatz}
              onChange={(e) => updateSteuerParams({ steuersatz: parseInt(e.target.value) })}
              className="flex-1" />
            <span className="w-12 text-right font-semibold">{steuersatz}%</span>
          </div>
        </div>
      </div>

      {/* Transparente Steuerformel */}
      {selectedDaten && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">📊 Steuerliche Berechnung {selectedJahr}</h4>

          <div className="space-y-2 text-sm">
            {/* Einnahmen */}
            <div className="flex justify-between items-center py-2 border-b border-green-200 bg-green-50 px-3 rounded">
              <span className="text-green-700 font-medium">+ Mieteinnahmen</span>
              <span className="font-semibold text-green-700">{formatCurrency(selectedDaten.einnahmen)}</span>
            </div>

            {/* Kosten */}
            <div className="flex justify-between items-center py-1 px-3">
              <span className="text-red-600">− Laufende Kosten <span className="text-xs text-gray-400">(Inst., Verw., Hausgeld)</span></span>
              <span className="text-red-600">{formatCurrency(selectedDaten.laufendeKosten)}</span>
            </div>

            <div className="flex justify-between items-center py-1 px-3">
              <span className="text-red-600">− Schuldzinsen <span className="text-xs text-gray-400">(nicht Tilgung!)</span></span>
              <span className="text-red-600">{formatCurrency(selectedDaten.zinsen)}</span>
            </div>

            {selectedDaten.fahrtkosten > 0 && (
              <div className="flex justify-between items-center py-1 px-3">
                <span className="text-red-600">− Fahrtkosten</span>
                <span className="text-red-600">{formatCurrency(selectedDaten.fahrtkosten)}</span>
              </div>
            )}

            {selectedDaten.investitionenSofort > 0 && (
              <div className="flex justify-between items-center py-1 px-3 bg-orange-50 rounded">
                <span className="text-orange-600">− Erhaltungsaufwand <span className="text-xs">⚠️ Einmaleffekt</span></span>
                <span className="text-orange-600">{formatCurrency(selectedDaten.investitionenSofort)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 px-3">
              <span className="text-red-600">− AfA <span className="text-xs text-gray-400">({afaSatz}% von {formatCurrency(selectedDaten.afaBemessungsgrundlage)})</span></span>
              <span className="text-red-600">{formatCurrency(selectedDaten.afa)}</span>
            </div>

            {/* Ergebnis */}
            <div className="flex justify-between items-center py-2 px-3 border-t-2 border-gray-300 mt-2">
              <span className="font-semibold">= Steuerlicher Überschuss/Verlust</span>
              <span className={`font-bold ${selectedDaten.zuVersteuern >= 0 ? 'text-gray-800' : 'text-green-600'}`}>
                {formatCurrency(selectedDaten.zuVersteuern)}
              </span>
            </div>

            {/* Steuereffekt */}
            <div className={`flex justify-between items-center py-3 px-4 rounded-lg mt-2 ${selectedDaten.steuerEffekt > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <div>
                <span className="font-semibold">{selectedDaten.steuerEffekt > 0 ? 'Steuerlast' : 'Steuerersparnis'}</span>
                <span className="text-xs text-gray-500 block">bei {steuersatz}% Steuersatz</span>
              </div>
              <span className={`text-xl font-bold ${selectedDaten.steuerEffekt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {selectedDaten.steuerEffekt > 0 ? '−' : '+'}{formatCurrency(Math.abs(selectedDaten.steuerEffekt))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bereinigtes Ergebnis Toggle */}
      {selectedDaten && selectedDaten.investitionenSofort > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEinmaleffekteHerausrechnen}
                onChange={(e) => setShowEinmaleffekteHerausrechnen(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium text-yellow-800">Einmaleffekte herausrechnen</span>
            </label>
          </div>
          {showEinmaleffekteHerausrechnen && (
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div className="bg-white p-3 rounded">
                <div className="text-xs text-gray-500">Real ({selectedJahr})</div>
                <div className={`font-bold ${selectedDatenReal.steuerEffekt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedDatenReal.steuerEffekt > 0 ? '−' : '+'}{formatCurrency(Math.abs(selectedDatenReal.steuerEffekt))}
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-xs text-gray-500">Bereinigt (ohne Einmaleffekte)</div>
                <div className={`font-bold ${selectedDaten.steuerEffekt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedDaten.steuerEffekt > 0 ? '−' : '+'}{formatCurrency(Math.abs(selectedDaten.steuerEffekt))}
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-yellow-700 mt-2">
            💡 So würde sich die Immobilie in einem normalen Jahr darstellen (ohne {formatCurrency(selectedDaten.investitionenSofort)} Erhaltungsaufwand).
          </p>
        </div>
      )}

      {/* Investitionen & steuerliche Behandlung */}
      {selectedDaten && selectedDaten.investitionenGesamt.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">🔧 Investitionen {selectedJahr} & steuerliche Behandlung</h4>
          <div className="space-y-2">
            {selectedDaten.investitionenGesamt.map(inv => {
              const kat = steuerKategorien[inv.kategorie || 'erhaltung'];
              return (
                <div key={inv.id} className={`flex justify-between items-center p-2 rounded text-sm ${
                  kat?.steuer === 'sofort' ? 'bg-orange-50' :
                  kat?.steuer === 'afa' ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span>{kat?.icon}</span>
                    <div>
                      <div className="font-medium">{inv.beschreibung}</div>
                      <div className="text-xs text-gray-500">{kat?.label}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(inv.betrag)}</div>
                    <div className="text-xs text-gray-500">
                      {kat?.steuer === 'sofort' && 'Sofort absetzbar'}
                      {kat?.steuer === 'afa' && `AfA über ${afaJahre} Jahre`}
                      {kat?.steuer === 'keine' && 'Keine Steuerwirkung'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedDaten.investitionenAfa > 0 && (
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
              🔁 <strong>{formatCurrency(selectedDaten.investitionenAfa)}</strong> erhöhen die AfA-Bemessungsgrundlage und wirken über {afaJahre} Jahre.
            </div>
          )}
        </div>
      )}

      {/* Finanzierung Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">🏦 Finanzierungskosten {selectedJahr}</h4>
        {selectedDaten && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-red-50 rounded">
              <div>
                <span className="font-medium text-red-700">Schuldzinsen</span>
                <span className="text-xs text-red-600 block">steuerlich absetzbar</span>
              </div>
              <span className="font-bold text-red-700">{formatCurrency(selectedDaten.zinsen)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium text-gray-600">Tilgung</span>
                <span className="text-xs text-gray-500 block">nur Cashflow, keine Steuerwirkung</span>
              </div>
              <span className="font-bold text-gray-500">{formatCurrency((ergebnis.monatlicheRate * 12) - selectedDaten.zinsen)}</span>
            </div>
          </div>
        )}
        <div className="mt-3 p-2 bg-purple-50 rounded text-xs text-purple-700">
          💡 <strong>Tilgung verbessert Vermögen, senkt aber nicht die Steuer.</strong> Nur Zinsen sind absetzbar.
        </div>
      </div>

      {/* AfA Einstellungen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">📉 AfA-Einstellungen</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Gebäudeanteil</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="100" value={gebaeudeAnteilProzent}
                onChange={(e) => updateSteuerParams({ gebaeudeAnteilProzent: parseFloat(e.target.value) || 0 })}
                className="w-20 px-2 py-1 border rounded text-sm text-right" />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">= {formatCurrency(params.kaufpreis * (gebaeudeAnteilProzent / 100))}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">AfA-Satz</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="10" step="0.5" value={afaSatz}
                onChange={(e) => updateSteuerParams({ afaSatz: parseFloat(e.target.value) || 0 })}
                className="w-20 px-2 py-1 border rounded text-sm text-right" />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{afaJahre} Jahre linear</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-3 p-2 bg-blue-50 rounded">
          💡 <strong>AfA ist ein Recheneffekt, kein Geldabfluss.</strong> Standard: 2% (50 J.) oder 2,5% vor 1925 (40 J.)
        </div>
      </div>

      {/* Fahrtkosten */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-800">🚗 Fahrtkosten {selectedJahr}</h4>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => updateSteuerParams({ fahrtkostenModus: 'pauschal' })}
              className={`px-2 py-1 text-xs rounded-md ${fahrtkostenModus === 'pauschal' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}>
              Pauschal
            </button>
            <button onClick={() => updateSteuerParams({ fahrtkostenModus: 'manuell' })}
              className={`px-2 py-1 text-xs rounded-md ${fahrtkostenModus === 'manuell' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-600'}`}>
              Einzeln
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Entfernung (einfach)</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" value={entfernungKm}
                onChange={(e) => updateSteuerParams({ entfernungKm: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 border rounded text-sm text-right" />
              <span className="text-xs text-gray-500">km</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">km-Pauschale</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="1" step="0.01" value={kmPauschale}
                onChange={(e) => updateSteuerParams({ kmPauschale: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 border rounded text-sm text-right" />
              <span className="text-xs text-gray-500">€</span>
            </div>
          </div>
        </div>

        {fahrtkostenModus === 'pauschal' ? (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fahrten pro Monat</label>
            <input type="number" min="0" max="30" value={fahrtenProMonat}
              onChange={(e) => updateSteuerParams({ fahrtenProMonat: parseFloat(e.target.value) || 0 })}
              className="w-24 px-2 py-1 border rounded text-sm text-right" />
            {fahrtenProMonat > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                = {fahrtenProMonat} × 12 × {entfernungKm} km × 2 × {kmPauschale.toFixed(2)} € = <strong>{formatCurrency(fahrtenProMonat * 12 * entfernungKm * 2 * kmPauschale)}</strong>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Fahrten in {selectedJahr}: {fahrtenSelectedJahr.length}</span>
              <button onClick={() => setShowFahrtForm(!showFahrtForm)}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                + Fahrt
              </button>
            </div>
            {showFahrtForm && (
              <div className="bg-gray-50 p-2 rounded border mb-2">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Datum</label>
                    <input type="date" value={neueFahrt.datum}
                      onChange={(e) => setNeueFahrt({...neueFahrt, datum: e.target.value})}
                      className="w-full px-2 py-1 border rounded text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">km</label>
                    <input type="number" value={neueFahrt.km}
                      onChange={(e) => setNeueFahrt({...neueFahrt, km: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 border rounded text-xs text-right" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Grund</label>
                    <select value={neueFahrt.grund}
                      onChange={(e) => setNeueFahrt({...neueFahrt, grund: e.target.value})}
                      className="w-full px-2 py-1 border rounded text-xs">
                      <option value="">Auswählen...</option>
                      {fahrtGruende.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddFahrt} className="px-2 py-1 bg-green-600 text-white text-xs rounded">Speichern</button>
                  <button onClick={() => setShowFahrtForm(false)} className="px-2 py-1 bg-gray-300 text-xs rounded">Abbrechen</button>
                </div>
              </div>
            )}
            {fahrtenSelectedJahr.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {fahrtenSelectedJahr.sort((a, b) => new Date(b.datum) - new Date(a.datum)).map(f => (
                  <div key={f.id} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded">
                    <span>{new Date(f.datum).toLocaleDateString('de-DE')} - {f.grund || 'Ohne Grund'}</span>
                    <div className="flex items-center gap-2">
                      <span>{f.km} km ({formatCurrency(f.km * 2 * kmPauschale)})</span>
                      <button onClick={() => handleDeleteFahrt(f.id)} className="text-red-400 hover:text-red-600">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hinweise */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-2">💡 Steuer-Tipps</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Investitionen</strong> wirken steuerlich nicht immer sofort – Herstellungskosten werden über AfA verteilt.</li>
          <li>• <strong>Zinsen</strong> senken die Steuer – Tilgung nicht (nur Vermögensaufbau).</li>
          <li>• <strong>AfA</strong> ist ein Recheneffekt, kein Geldabfluss – mindert aber die Steuerlast.</li>
          <li>• <strong>Einmalige Investitionen</strong> (Erhaltungsaufwand) können einzelne Jahre stark verzerren.</li>
        </ul>
        <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
          ⚠️ Vereinfachte Berechnung. Konsultieren Sie einen Steuerberater für verbindliche Auskünfte.
        </div>
      </div>
    </div>
  );
};

// Reparaturen & Investitionen Komponente
const ReparaturenInvestitionen = ({ immobilie, onUpdate }) => {
  const [investitionen, setInvestitionen] = useState(immobilie.investitionen || []);
  const [showForm, setShowForm] = useState(false);
  const [neueInvestition, setNeueInvestition] = useState({
    datum: new Date().toISOString().split('T')[0],
    beschreibung: '',
    betrag: '',
    kategorie: 'erhaltung'
  });

  const kategorien = {
    'erhaltung': { label: 'Erhaltungsaufwand', color: 'orange', icon: '🔧', steuer: 'sofort', hint: 'Sofort absetzbar im Zahlungsjahr' },
    'herstellung': { label: 'Herstellungskosten', color: 'blue', icon: '🏠', steuer: 'afa', hint: 'Erhöht AfA-Bemessungsgrundlage' },
    'anschaffung': { label: 'Anschaffungsnebenk.', color: 'purple', icon: '📋', steuer: 'afa', hint: 'Erhöht AfA-Bemessungsgrundlage' },
    'modernisierung': { label: 'Modernisierung', color: 'green', icon: '🌱', steuer: 'afa', hint: 'Wird über AfA abgeschrieben' },
    'nicht_relevant': { label: 'Nicht steuerlich', color: 'gray', icon: '📦', steuer: 'keine', hint: 'Keine Steuerwirkung' }
  };

  const handleAdd = () => {
    if (!neueInvestition.beschreibung || !neueInvestition.betrag) return;

    const updated = [...investitionen, {
      id: Date.now(),
      ...neueInvestition,
      betrag: parseFloat(neueInvestition.betrag)
    }];
    setInvestitionen(updated);
    onUpdate({ ...immobilie, investitionen: updated });
    setNeueInvestition({
      datum: new Date().toISOString().split('T')[0],
      beschreibung: '',
      betrag: '',
      kategorie: 'erhaltung'
    });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const updated = investitionen.filter(i => i.id !== id);
    setInvestitionen(updated);
    onUpdate({ ...immobilie, investitionen: updated });
  };

  const gesamtNachKategorie = useMemo(() => {
    const summen = {};
    investitionen.forEach(inv => {
      summen[inv.kategorie] = (summen[inv.kategorie] || 0) + inv.betrag;
    });
    return summen;
  }, [investitionen]);

  const gesamtInvestitionen = investitionen.reduce((sum, inv) => sum + inv.betrag, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">🔧 Reparaturen & Investitionen</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Hinzufügen
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Datum</label>
              <input
                type="date"
                value={neueInvestition.datum}
                onChange={(e) => setNeueInvestition({...neueInvestition, datum: e.target.value})}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kategorie</label>
              <select
                value={neueInvestition.kategorie}
                onChange={(e) => setNeueInvestition({...neueInvestition, kategorie: e.target.value})}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                {Object.entries(kategorien).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Beschreibung</label>
            <input
              type="text"
              value={neueInvestition.beschreibung}
              onChange={(e) => setNeueInvestition({...neueInvestition, beschreibung: e.target.value})}
              placeholder="z.B. Neue Heizung, Dachsanierung..."
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Betrag (€)</label>
            <input
              type="number"
              value={neueInvestition.betrag}
              onChange={(e) => setNeueInvestition({...neueInvestition, betrag: e.target.value})}
              placeholder="z.B. 5000"
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
              Speichern
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Zusammenfassung */}
      {investitionen.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Gesamt investiert:</span>
            <span className="text-lg font-bold text-orange-600">{formatCurrency(gesamtInvestitionen)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(gesamtNachKategorie).map(([kat, summe]) => (
              <span key={kat} className={`text-xs px-2 py-1 rounded bg-${kategorien[kat].color}-100 text-${kategorien[kat].color}-700`}>
                {kategorien[kat].icon} {formatCurrency(summe)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="max-h-48 overflow-y-auto">
        {investitionen.length === 0 ? (
          <div className="text-center text-gray-400 py-4 text-sm">
            Noch keine Reparaturen oder Investitionen erfasst
          </div>
        ) : (
          <div className="space-y-2">
            {investitionen.sort((a, b) => new Date(b.datum) - new Date(a.datum)).map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span>{kategorien[inv.kategorie]?.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{inv.beschreibung}</div>
                    <div className="text-xs text-gray-500">{new Date(inv.datum).toLocaleDateString('de-DE')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-orange-600">{formatCurrency(inv.betrag)}</span>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Mieteinnahmen-Tracker Komponente
const MieteinnahmenTracker = ({ params, updateParams, immobilie }) => {
  const [mietEingaenge, setMietEingaenge] = useState(params.mietEingaenge || []);
  const [neuerEingang, setNeuerEingang] = useState({
    datum: new Date().toISOString().split('T')[0],
    betrag: params.kaltmiete || 0,
    typ: 'kaltmiete',
    notiz: ''
  });
  const [filterJahr, setFilterJahr] = useState(new Date().getFullYear());
  const [filterMonat, setFilterMonat] = useState(null); // null = alle Monate

  const kaufjahr = immobilie.kaufdatum ? new Date(immobilie.kaufdatum).getFullYear() : new Date().getFullYear();
  const aktuellesJahr = new Date().getFullYear();
  const jahre = [];
  for (let j = kaufjahr; j <= aktuellesJahr + 1; j++) {
    jahre.push(j);
  }

  const monate = [
    { nr: 1, name: 'Januar' }, { nr: 2, name: 'Februar' }, { nr: 3, name: 'März' },
    { nr: 4, name: 'April' }, { nr: 5, name: 'Mai' }, { nr: 6, name: 'Juni' },
    { nr: 7, name: 'Juli' }, { nr: 8, name: 'August' }, { nr: 9, name: 'September' },
    { nr: 10, name: 'Oktober' }, { nr: 11, name: 'November' }, { nr: 12, name: 'Dezember' }
  ];

  const handleAddEingang = () => {
    if (!neuerEingang.datum || !neuerEingang.betrag) return;

    const neueEingaenge = [...mietEingaenge, { ...neuerEingang, id: Date.now() }];
    setMietEingaenge(neueEingaenge);
    updateParams({ ...params, mietEingaenge: neueEingaenge });

    // Reset für nächsten Eintrag
    setNeuerEingang({
      datum: new Date().toISOString().split('T')[0],
      betrag: params.kaltmiete || 0,
      typ: 'kaltmiete',
      notiz: ''
    });
  };

  const handleDeleteEingang = (id) => {
    const neueEingaenge = mietEingaenge.filter(e => e.id !== id);
    setMietEingaenge(neueEingaenge);
    updateParams({ ...params, mietEingaenge: neueEingaenge });
  };

  // Gefilterte Eingänge
  const gefilterteEingaenge = mietEingaenge.filter(e => {
    const datum = new Date(e.datum);
    if (datum.getFullYear() !== filterJahr) return false;
    if (filterMonat !== null && (datum.getMonth() + 1) !== filterMonat) return false;
    return true;
  }).sort((a, b) => new Date(b.datum) - new Date(a.datum));

  // Summen berechnen
  const summeGefiltert = gefilterteEingaenge.reduce((sum, e) => sum + (parseFloat(e.betrag) || 0), 0);

  // Erwartete Miete pro Monat
  const erwarteteMonatsmiete = params.kaltmiete || 0;

  // Monatsübersicht für aktuelles Jahr
  const monatsUebersicht = monate.map(m => {
    const monatEingaenge = mietEingaenge.filter(e => {
      const datum = new Date(e.datum);
      return datum.getFullYear() === filterJahr && (datum.getMonth() + 1) === m.nr;
    });
    const summe = monatEingaenge.reduce((sum, e) => sum + (parseFloat(e.betrag) || 0), 0);
    const erwartet = erwarteteMonatsmiete;
    const differenz = summe - erwartet;
    const status = summe === 0 ? 'offen' : (summe >= erwartet ? 'bezahlt' : 'teilweise');

    // Prüfen ob Zahlung verspätet war (nach dem 5. des Monats)
    const verspaetet = monatEingaenge.some(e => {
      const datum = new Date(e.datum);
      return datum.getDate() > 5;
    });

    return { ...m, summe, erwartet, differenz, status, verspaetet, eingaenge: monatEingaenge };
  });

  // Offene Forderungen
  const aktuellerMonat = new Date().getMonth() + 1;
  const offeneForderungen = monatsUebersicht.filter(m =>
    m.nr <= aktuellerMonat && m.status !== 'bezahlt' && filterJahr === new Date().getFullYear()
  );

  return (
    <div className="space-y-6">
      {/* Neuen Eingang hinzufügen */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-4">Mieteingang erfassen</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Eingangsdatum</label>
            <input
              type="date"
              value={neuerEingang.datum}
              onChange={(e) => setNeuerEingang({...neuerEingang, datum: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Betrag (€)</label>
            <input
              type="number"
              value={neuerEingang.betrag}
              onChange={(e) => setNeuerEingang({...neuerEingang, betrag: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Typ</label>
            <select
              value={neuerEingang.typ}
              onChange={(e) => setNeuerEingang({...neuerEingang, typ: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="kaltmiete">Kaltmiete</option>
              <option value="nebenkosten">Nebenkosten</option>
              <option value="nachzahlung">Nachzahlung</option>
              <option value="kaution">Kaution</option>
              <option value="sonstige">Sonstige</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notiz (optional)</label>
            <input
              type="text"
              value={neuerEingang.notiz}
              onChange={(e) => setNeuerEingang({...neuerEingang, notiz: e.target.value})}
              placeholder="z.B. Mieter Name"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddEingang}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              + Hinzufügen
            </button>
          </div>
        </div>
      </div>

      {/* Offene Forderungen Warnung */}
      {offeneForderungen.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h4 className="font-semibold text-red-700 mb-2">⚠️ Offene Forderungen</h4>
          <div className="space-y-1">
            {offeneForderungen.map(m => (
              <div key={m.nr} className="flex justify-between text-sm text-red-600">
                <span>{m.name} {filterJahr}:</span>
                <span className="font-medium">
                  {m.status === 'offen' ? 'Nicht bezahlt' : `Offen: ${formatCurrency(Math.abs(m.differenz))}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jahres- und Monatsfilter */}
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Jahr</label>
          <select
            value={filterJahr}
            onChange={(e) => setFilterJahr(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            {jahre.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Monat</label>
          <select
            value={filterMonat || ''}
            onChange={(e) => setFilterMonat(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Alle Monate</option>
            {monate.map(m => (
              <option key={m.nr} value={m.nr}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-gray-600">Summe {filterMonat ? monate.find(m => m.nr === filterMonat)?.name : 'Jahr'}</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(summeGefiltert)}</div>
        </div>
      </div>

      {/* Monatsübersicht Grid */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-4">Monatsübersicht {filterJahr}</h3>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {monatsUebersicht.map(m => (
            <div
              key={m.nr}
              onClick={() => setFilterMonat(filterMonat === m.nr ? null : m.nr)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                filterMonat === m.nr ? 'ring-2 ring-blue-500' : ''
              } ${
                m.status === 'bezahlt' ? 'bg-green-100 hover:bg-green-200' :
                m.status === 'teilweise' ? 'bg-yellow-100 hover:bg-yellow-200' :
                m.nr <= aktuellerMonat ? 'bg-red-100 hover:bg-red-200' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="text-xs font-medium text-gray-600">{m.name.substring(0, 3)}</div>
              <div className={`text-sm font-bold ${
                m.status === 'bezahlt' ? 'text-green-700' :
                m.status === 'teilweise' ? 'text-yellow-700' :
                m.nr <= aktuellerMonat ? 'text-red-700' : 'text-gray-500'
              }`}>
                {formatCurrency(m.summe)}
              </div>
              {m.verspaetet && m.status === 'bezahlt' && (
                <div className="text-xs text-orange-600">⏰ verspätet</div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded"></span> Bezahlt</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 rounded"></span> Teilweise</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded"></span> Offen</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded"></span> Zukunft</span>
        </div>
      </div>

      {/* Detailliste */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700 text-sm">
          Eingänge {filterMonat ? monate.find(m => m.nr === filterMonat)?.name : ''} {filterJahr} ({gefilterteEingaenge.length})
        </div>
        {gefilterteEingaenge.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Keine Mieteinnahmen für diesen Zeitraum erfasst.
          </div>
        ) : (
          <div className="divide-y">
            {gefilterteEingaenge.map(e => (
              <div key={e.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{new Date(e.datum).toLocaleDateString('de-DE')}</div>
                    <div className="text-xs text-gray-500">
                      {e.typ === 'kaltmiete' ? 'Kaltmiete' :
                       e.typ === 'nebenkosten' ? 'Nebenkosten' :
                       e.typ === 'nachzahlung' ? 'Nachzahlung' :
                       e.typ === 'kaution' ? 'Kaution' : 'Sonstige'}
                      {e.notiz && ` - ${e.notiz}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold text-green-600">{formatCurrency(e.betrag)}</div>
                  <button
                    onClick={() => handleDeleteEingang(e.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Mietimmobilie-Detail Komponente (Arbitrage-Modell)
const MietimmobilieDetail = ({ immobilie, onClose, onSave }) => {
  const [params, setParams] = useState({
    eigeneWarmmiete: immobilie.eigeneWarmmiete || 1500,
    anzahlZimmerVermietet: immobilie.anzahlZimmerVermietet || 3,
    untermieteProZimmer: immobilie.untermieteProZimmer || 600,
    // Aufgeschlüsselte Kosten für Steuerberater
    arbitrageStrom: immobilie.arbitrageStrom || 0,
    arbitrageInternet: immobilie.arbitrageInternet || 0,
    arbitrageGEZ: immobilie.arbitrageGEZ ?? 18.36,
    wohnflaeche: immobilie.wohnflaeche || 80,
    zimmer: immobilie.zimmer || 4,
    mietvertragStart: immobilie.mietvertragStart || '',
    name: immobilie.name || '',
    plz: immobilie.plz || '',
    adresse: immobilie.adresse || ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  const updateParams = (newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({ ...immobilie, ...params });
    setHasChanges(false);
  };

  // Berechnungen
  const einnahmen = params.anzahlZimmerVermietet * params.untermieteProZimmer;
  const zusatzkosten = (params.arbitrageStrom || 0) + (params.arbitrageInternet || 0) + (params.arbitrageGEZ ?? 18.36);
  const ausgaben = params.eigeneWarmmiete + zusatzkosten;
  const monatsCashflow = einnahmen - ausgaben;
  const jahresCashflow = monatsCashflow * 12;

  // Monate seit Mietvertragstart
  const mietvertragStart = params.mietvertragStart ? new Date(params.mietvertragStart) : null;
  const monateSeitStart = mietvertragStart
    ? Math.max(0, Math.floor((new Date() - mietvertragStart) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  const bisherigeCashflowGesamt = monatsCashflow * monateSeitStart;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-800 p-6 z-10 rounded-t-xl">
          <div className="flex justify-between items-center text-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🔄</span>
                <h2 className="text-2xl font-bold">{params.name || 'Mietimmobilie'}</h2>
              </div>
              <p className="text-purple-200">{params.plz} {params.adresse}</p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-white/20 rounded-full">
                Arbitrage-Modell
              </span>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
                >
                  Speichern
                </button>
              )}
              <button onClick={onClose} className="text-white hover:text-purple-200 text-3xl">&times;</button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Cashflow Übersicht */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${monatsCashflow >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="text-sm text-gray-600 mb-1">Monatlicher Cashflow</div>
              <div className={`text-3xl font-bold ${monatsCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monatsCashflow >= 0 ? '+' : ''}{formatCurrency(monatsCashflow)}
              </div>
            </div>
            <div className={`p-4 rounded-lg ${jahresCashflow >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="text-sm text-gray-600 mb-1">Jährlicher Cashflow</div>
              <div className={`text-3xl font-bold ${jahresCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Bisheriger Gewinn</div>
              <div className="text-3xl font-bold text-purple-600">
                {bisherigeCashflowGesamt >= 0 ? '+' : ''}{formatCurrency(bisherigeCashflowGesamt)}
              </div>
              <div className="text-xs text-gray-500">{monateSeitStart} Monate</div>
            </div>
          </div>

          {/* Detailberechnungs-Anzeige */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">📊 Cashflow-Berechnung</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">
                  Einnahmen ({params.anzahlZimmerVermietet} Zimmer × {formatCurrency(params.untermieteProZimmer)})
                </span>
                <span className="font-semibold text-green-600">+{formatCurrency(einnahmen)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Eigene Warmmiete</span>
                <span className="font-semibold text-red-600">-{formatCurrency(params.eigeneWarmmiete)}</span>
              </div>
              {(params.arbitrageStrom > 0 || params.arbitrageInternet > 0 || params.arbitrageGEZ > 0) && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">
                    Strom / Internet / GEZ
                    <span className="text-xs text-gray-400 ml-1">
                      ({formatCurrency(params.arbitrageStrom || 0)} + {formatCurrency(params.arbitrageInternet || 0)} + {formatCurrency(params.arbitrageGEZ ?? 18.36)})
                    </span>
                  </span>
                  <span className="font-semibold text-red-600">-{formatCurrency(zusatzkosten)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 font-bold text-lg">
                <span className="text-gray-800">= Monatlicher Cashflow</span>
                <span className={monatsCashflow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {monatsCashflow >= 0 ? '+' : ''}{formatCurrency(monatsCashflow)}
                </span>
              </div>
            </div>
          </div>

          {/* Bearbeitungsbereich */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grunddaten */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-4">📍 Grunddaten</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name/Bezeichnung</label>
                  <input
                    type="text"
                    value={params.name}
                    onChange={(e) => updateParams({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="z.B. Mitarbeiter-WG München"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">PLZ</label>
                    <input
                      type="text"
                      value={params.plz}
                      onChange={(e) => updateParams({ plz: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mietvertrag seit</label>
                    <input
                      type="date"
                      value={params.mietvertragStart}
                      onChange={(e) => updateParams({ mietvertragStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={params.adresse}
                    onChange={(e) => updateParams({ adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Musterstraße 123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Wohnfläche (m²)</label>
                    <input
                      type="number"
                      value={params.wohnflaeche}
                      onChange={(e) => updateParams({ wohnflaeche: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gesamtzahl Zimmer</label>
                    <input
                      type="number"
                      value={params.zimmer}
                      onChange={(e) => updateParams({ zimmer: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Finanzdaten */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-4">💰 Arbitrage-Kalkulation</h3>
              <div className="space-y-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <label className="block text-sm font-medium text-red-700 mb-1">Eigene Warmmiete (€/Monat)</label>
                  <input
                    type="number"
                    value={params.eigeneWarmmiete}
                    onChange={(e) => updateParams({ eigeneWarmmiete: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-lg font-semibold"
                  />
                  <p className="text-xs text-red-600 mt-1">Die Miete, die du an den Vermieter zahlst</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <label className="block text-sm font-medium text-green-700 mb-2">Untervermietung</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Vermietete Zimmer</label>
                      <input
                        type="number"
                        value={params.anzahlZimmerVermietet}
                        onChange={(e) => updateParams({ anzahlZimmerVermietet: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="0"
                        max={params.zimmer}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Miete pro Zimmer (€)</label>
                      <input
                        type="number"
                        value={params.untermieteProZimmer}
                        onChange={(e) => updateParams({ untermieteProZimmer: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Einnahmen: {params.anzahlZimmerVermietet} × {formatCurrency(params.untermieteProZimmer)} = <strong>{formatCurrency(einnahmen)}</strong>
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">📊 Zusätzliche Kosten (für Steuerberater)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">⚡ Strom</label>
                      <input
                        type="number"
                        value={params.arbitrageStrom || 0}
                        onChange={(e) => updateParams({ arbitrageStrom: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">🌐 Internet</label>
                      <input
                        type="number"
                        value={params.arbitrageInternet || 0}
                        onChange={(e) => updateParams({ arbitrageInternet: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">📺 GEZ</label>
                      <input
                        type="number"
                        value={params.arbitrageGEZ ?? 18.36}
                        onChange={(e) => updateParams({ arbitrageGEZ: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="18.36"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Summe: <strong>{formatCurrency(zusatzkosten)}</strong>/Monat · <strong>{formatCurrency(zusatzkosten * 12)}</strong>/Jahr
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prognose */}
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-3">📈 Prognose</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">In 1 Jahr</div>
                <div className={`text-lg font-bold ${jahresCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">In 2 Jahren</div>
                <div className={`text-lg font-bold ${jahresCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow * 2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">In 3 Jahren</div>
                <div className={`text-lg font-bold ${jahresCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow * 3)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">In 5 Jahren</div>
                <div className={`text-lg font-bold ${jahresCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {jahresCashflow >= 0 ? '+' : ''}{formatCurrency(jahresCashflow * 5)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Immobilien-Detail Komponente
const ImmobilienDetail = ({ immobilie, onClose, onSave }) => {
  const isMietimmobilie = immobilie.immobilienTyp === 'mietimmobilie';

  // Für Mietimmobilien: Vereinfachte Ansicht
  if (isMietimmobilie) {
    return (
      <MietimmobilieDetail
        immobilie={immobilie}
        onClose={onClose}
        onSave={onSave}
      />
    );
  }

  const initialWert = immobilie.geschaetzterWert || immobilie.kaufpreis;
  const initialQmPreis = immobilie.wohnflaeche > 0 ? Math.round(initialWert / immobilie.wohnflaeche) : 0;

  // Berechne initiale EK-Werte basierend auf altem eigenkapital
  const initKaufnebenkosten = immobilie.kaufpreis * ((immobilie.kaufnebenkosten ?? 10) / 100);
  const initEkFuerNebenkosten = immobilie.ekFuerNebenkosten ?? initKaufnebenkosten; // Default: Nebenkosten mit EK
  const initEkFuerKaufpreis = immobilie.ekFuerKaufpreis ?? (immobilie.eigenkapital ? Math.max(0, immobilie.eigenkapital - initKaufnebenkosten) : 0);

  const [params, setParams] = useState({
    kaufpreis: immobilie.kaufpreis,
    kaufdatum: immobilie.kaufdatum || '',
    // Objektdetails
    wohnflaeche: immobilie.wohnflaeche || 80,
    zimmer: immobilie.zimmer || 3,
    baujahr: immobilie.baujahr || 2000,
    // Neue EK-Aufteilung
    ekFuerNebenkosten: initEkFuerNebenkosten,
    ekFuerKaufpreis: initEkFuerKaufpreis,
    eigenkapital: immobilie.eigenkapital, // Legacy, wird aus ekFuerNebenkosten + ekFuerKaufpreis berechnet
    zinssatz: immobilie.zinssatz ?? 4.0,
    tilgung: immobilie.tilgung ?? 2.0,
    laufzeit: immobilie.laufzeit ?? 25,
    kaltmiete: immobilie.kaltmiete,
    nebenkosten: immobilie.nebenkosten ?? 200,
    instandhaltung: immobilie.instandhaltung ?? 100,
    verwaltung: immobilie.verwaltung ?? 30,
    // Zusätzliche Kosten (z.B. bei möblierter Vermietung)
    hausgeld: immobilie.hausgeld ?? 0,
    strom: immobilie.strom ?? 0,
    internet: immobilie.internet ?? 0,
    wertsteigerung: immobilie.wertsteigerung ?? 2.0,
    mietsteigerung: immobilie.mietsteigerung ?? 1.5,
    kaufnebenkosten: immobilie.kaufnebenkosten ?? 10,
    kaufnebenkostenModus: immobilie.kaufnebenkostenModus || 'prozent',
    kaufnebenkostenPositionen: immobilie.kaufnebenkostenPositionen || null,
    bundesland: immobilie.bundesland || 'bayern',
    finanzierungsbetrag: immobilie.finanzierungsbetrag ?? null,
    // Finanzierungsphasen für Anschlussfinanzierungen
    finanzierungsphasen: immobilie.finanzierungsphasen || [
      {
        id: 1,
        name: 'Erstfinanzierung',
        zinsbindung: immobilie.laufzeit ?? 10,
        zinssatz: immobilie.zinssatz ?? 4.0,
        tilgung: immobilie.tilgung ?? 2.0,
        sondertilgungJaehrlich: 0,
        aktiv: true
      }
    ],
    geschaetzterWert: initialWert,
    mietModus: immobilie.mietModus || 'automatisch',
    mietHistorie: immobilie.mietHistorie || {},
    mietEingaenge: immobilie.mietEingaenge || [],
    // Steuer-Parameter
    steuersatz: immobilie.steuersatz || 42,
    gebaeudeAnteilProzent: immobilie.gebaeudeAnteilProzent || 80,
    afaSatz: immobilie.afaSatz || 2.0,
    fahrtkostenModus: immobilie.fahrtkostenModus || 'pauschal',
    fahrtenProMonat: immobilie.fahrtenProMonat || 0,
    entfernungKm: immobilie.entfernungKm || 0,
    kmPauschale: immobilie.kmPauschale || 0.30,
    fahrtenListe: immobilie.fahrtenListe || [],
    investitionen: immobilie.investitionen || []
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [qmPreis, setQmPreis] = useState(initialQmPreis.toString());
  const [activeTab, setActiveTab] = useState('uebersicht'); // 'uebersicht', 'finanzierung', 'mieteinnahmen', 'cashflow', 'steuern', 'investitionen'

  const updateParams = (newParams) => {
    setParams(newParams);
    setHasChanges(true);
  };

  const handleQmPreisChange = (value) => {
    setQmPreis(value);
    const numValue = parseFloat(value) || 0;
    const flaeche = params.wohnflaeche || immobilie.wohnflaeche || 80;
    if (numValue > 0 && flaeche > 0) {
      const neuerWert = Math.round(numValue * flaeche);
      updateParams({...params, geschaetzterWert: neuerWert});
    }
  };

  const handleGesamtwertChange = (value) => {
    const numValue = parseFloat(value) || 0;
    updateParams({...params, geschaetzterWert: numValue});
    const flaeche = params.wohnflaeche || immobilie.wohnflaeche || 80;
    if (numValue > 0 && flaeche > 0) {
      setQmPreis(Math.round(numValue / flaeche).toString());
    }
  };

  const handleSave = () => {
    // Berechne legacy eigenkapital aus neuer Aufteilung für Abwärtskompatibilität
    const gesamtEK = (params.ekFuerNebenkosten || 0) + (params.ekFuerKaufpreis || 0);
    onSave({ ...immobilie, ...params, eigenkapital: gesamtEK });
    setHasChanges(false);
  };

  const ergebnis = useMemo(() => berechneRendite(params), [params]);
  const aktuellerWert = params.geschaetzterWert || immobilie.kaufpreis;
  // Verwende params.kaufdatum für Berechnungen (bearbeitbar)
  const immobilieMitAktuellemKaufdatum = { ...immobilie, kaufdatum: params.kaufdatum };
  const wertsteigerungSeitKauf = berechneWertsteigerungSeitKauf(immobilieMitAktuellemKaufdatum, aktuellerWert);
  const kaufjahr = params.kaufdatum ? new Date(params.kaufdatum).getFullYear() : new Date().getFullYear();

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{immobilie.name}</h2>
              <p className="text-gray-600">{immobilie.plz} {immobilie.adresse}</p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Speichern
                </button>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Wertschätzung & Wertsteigerung */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Aktueller Marktwert</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preis pro m² eingeben</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={qmPreis}
                    onChange={(e) => handleQmPreisChange(e.target.value)}
                    className="w-32 px-3 py-2 text-lg font-bold text-blue-600 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    placeholder="4000"
                  />
                  <span className="text-sm font-bold text-blue-600">€/m²</span>
                  <span className="text-gray-400">×</span>
                  <span className="text-sm text-gray-600">{params.wohnflaeche} m²</span>
                  <span className="text-gray-400">=</span>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Berechneter Gesamtwert</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={params.geschaetzterWert || ''}
                    onChange={(e) => handleGesamtwertChange(e.target.value)}
                    className="w-40 px-3 py-2 text-xl font-bold text-blue-600 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    placeholder="350000"
                  />
                  <span className="text-xl font-bold text-blue-600">€</span>
                </div>
              </div>
              <a
                href={`https://www.homeday.de/de/preisatlas/${immobilie.plz ? '?search=' + immobilie.plz : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <span>🔍</span> Preis bei Homeday recherchieren
              </a>
              <p className="text-xs text-gray-500 mt-2">Trage den qm-Preis von Homeday ein → Gesamtwert wird automatisch berechnet.</p>
            </div>

            {wertsteigerungSeitKauf && (
              <div className={`p-4 rounded-lg ${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  Wertsteigerung seit Kauf
                </h3>
                <div className={`text-3xl font-bold ${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? '+' : ''}{formatCurrency(wertsteigerungSeitKauf.absoluteSteigerung)}
                </div>
                <div className={`text-sm ${wertsteigerungSeitKauf.absoluteSteigerung >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {wertsteigerungSeitKauf.prozentSteigerung >= 0 ? '+' : ''}{wertsteigerungSeitKauf.prozentSteigerung.toFixed(1)}% in {wertsteigerungSeitKauf.jahreSeitKauf.toFixed(1)} Jahren
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Jährliche Rendite: {wertsteigerungSeitKauf.jaehrlicheRendite.toFixed(2)}% p.a.
                </div>
              </div>
            )}
          </div>

          {/* Objektdetails bearbeiten */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">🏠 Objektdetails bearbeiten</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Wohnfläche</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={params.wohnflaeche}
                    onChange={(e) => {
                      const neueFlaeche = parseFloat(e.target.value) || 0;
                      updateParams({...params, wohnflaeche: neueFlaeche});
                      // qm-Preis aktualisieren wenn Fläche sich ändert
                      if (neueFlaeche > 0 && params.geschaetzterWert > 0) {
                        setQmPreis(Math.round(params.geschaetzterWert / neueFlaeche).toString());
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                    min={1}
                  />
                  <span className="text-gray-500">m²</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Zimmer</label>
                <input
                  type="number"
                  value={params.zimmer}
                  onChange={(e) => updateParams({...params, zimmer: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                  min={1}
                  step={0.5}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Baujahr</label>
                <input
                  type="number"
                  value={params.baujahr}
                  onChange={(e) => updateParams({...params, baujahr: parseInt(e.target.value) || 2000})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                  min={1800}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </div>

          {/* Renditekennzahlen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-sm text-blue-600">Bruttorendite</div>
              <div className="text-2xl font-bold text-blue-800">{ergebnis.bruttorendite.toFixed(2)}%</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-sm text-green-600">Nettorendite</div>
              <div className="text-2xl font-bold text-green-800">{ergebnis.nettorendite.toFixed(2)}%</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-sm text-purple-600">EK-Rendite</div>
              <div className="text-2xl font-bold text-purple-800">{ergebnis.eigenkapitalRendite.toFixed(2)}%</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${ergebnis.leverageEffekt >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className={`text-sm ${ergebnis.leverageEffekt >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Leverage-Effekt</div>
              <div className={`text-2xl font-bold ${ergebnis.leverageEffekt >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                {ergebnis.leverageEffekt >= 0 ? '+' : ''}{ergebnis.leverageEffekt.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Tab-Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex flex-wrap gap-1">
              {[
                { id: 'uebersicht', label: '📊 Übersicht' },
                { id: 'finanzierung', label: '🏦 Finanzierung' },
                { id: 'mieteinnahmen', label: '💵 Mieteinnahmen' },
                { id: 'cashflow', label: '💰 Cashflow' },
                { id: 'steuern', label: '📋 Steuern' },
                { id: 'investitionen', label: '🔧 Investitionen' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab-Inhalte */}
          {activeTab === 'uebersicht' && (
            <div className="space-y-6">
              {/* Vermögensentwicklung Chart */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Vermögensentwicklung</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={ergebnis.entwicklung}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jahr" />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="immobilienwert" name="Immobilienwert" stroke="#2563eb" fill="#93c5fd" />
                    <Area type="monotone" dataKey="eigenkapital" name="Eigenkapital" stroke="#10b981" fill="#6ee7b7" />
                    <Area type="monotone" dataKey="restschuld" name="Restschuld" stroke="#ef4444" fill="#fca5a5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Leverage-Effekt Visualisierung */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Leverage-Effekt Visualisierung</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Nettorendite', wert: ergebnis.nettorendite, fill: '#10b981' },
                    { name: 'EK-Rendite', wert: ergebnis.eigenkapitalRendite, fill: '#8b5cf6' },
                    { name: 'Leverage', wert: ergebnis.leverageEffekt, fill: ergebnis.leverageEffekt >= 0 ? '#2563eb' : '#ef4444' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${v.toFixed(1)}%`} />
                    <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
                    <Bar dataKey="wert" name="Rendite">
                      {[
                        { name: 'Nettorendite', wert: ergebnis.nettorendite, fill: '#10b981' },
                        { name: 'EK-Rendite', wert: ergebnis.eigenkapitalRendite, fill: '#8b5cf6' },
                        { name: 'Leverage', wert: ergebnis.leverageEffekt, fill: ergebnis.leverageEffekt >= 0 ? '#2563eb' : '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Prognose */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Prognose</h3>
                <InputSliderCombo label="Wertsteigerung p.a." value={params.wertsteigerung} onChange={(v) => updateParams({...params, wertsteigerung: v})} min={0} max={5} step={0.1} unit="%" />
              </div>
            </div>
          )}

          {activeTab === 'finanzierung' && (() => {
            const kaufnebenkostenAbsolut = params.kaufpreis * (params.kaufnebenkosten / 100);
            const gesamtinvestition = params.kaufpreis + kaufnebenkostenAbsolut;
            const ekFuerNebenkosten = params.ekFuerNebenkosten ?? kaufnebenkostenAbsolut;
            const ekFuerKaufpreis = params.ekFuerKaufpreis ?? 0;
            const gesamtEK = ekFuerNebenkosten + ekFuerKaufpreis;
            const berechneterKredit = gesamtinvestition - gesamtEK;
            const effektiverKredit = params.finanzierungsbetrag ?? berechneterKredit;

            // Finanzierungsphasen mit Berechnungen
            const finanzierungsphasen = params.finanzierungsphasen || [{
              id: 1, name: 'Erstfinanzierung', zinsbindung: params.laufzeit ?? 10,
              zinssatz: params.zinssatz ?? 4.0, tilgung: params.tilgung ?? 2.0, sondertilgungJaehrlich: 0, aktiv: true
            }];

            // Berechne Restschulden für jede Phase
            const kaufjahr = params.kaufdatum ? new Date(params.kaufdatum).getFullYear() : new Date().getFullYear();
            const phasenMitBerechnung = [];
            let aktuelleRestschuld = effektiverKredit;
            let aktuellesStartjahr = kaufjahr;

            for (let i = 0; i < finanzierungsphasen.length; i++) {
              const phase = finanzierungsphasen[i];
              const startKredit = aktuelleRestschuld;
              const monatszins = phase.zinssatz / 100 / 12;
              const laufzeitMonate = phase.zinsbindung * 12;

              // Annuität berechnen
              let annuitaet = 0;
              if (monatszins > 0 && startKredit > 0) {
                annuitaet = startKredit * (monatszins * Math.pow(1 + monatszins, laufzeitMonate)) /
                           (Math.pow(1 + monatszins, laufzeitMonate) - 1);
              }

              // Restschuld am Ende der Phase
              let restschuld = startKredit;
              for (let monat = 0; monat < laufzeitMonate && restschuld > 0; monat++) {
                const monatsZinsen = restschuld * monatszins;
                const monatsTilgung = Math.min(annuitaet - monatsZinsen, restschuld);
                restschuld = Math.max(0, restschuld - monatsTilgung);
                // Jährliche Sondertilgung (am Jahresende)
                if ((monat + 1) % 12 === 0 && phase.sondertilgungJaehrlich > 0) {
                  restschuld = Math.max(0, restschuld - phase.sondertilgungJaehrlich);
                }
              }

              phasenMitBerechnung.push({
                ...phase,
                startjahr: aktuellesStartjahr,
                endjahr: aktuellesStartjahr + phase.zinsbindung,
                startKredit: Math.round(startKredit),
                restschuld: Math.round(restschuld),
                monatlicheRate: Math.round(annuitaet),
                getilgt: Math.round(startKredit - restschuld)
              });

              aktuelleRestschuld = restschuld;
              aktuellesStartjahr = aktuellesStartjahr + phase.zinsbindung;
            }

            const addPhase = () => {
              const letzePhase = phasenMitBerechnung[phasenMitBerechnung.length - 1];
              const neuePhase = {
                id: Date.now(),
                name: `Anschlussfinanzierung ${finanzierungsphasen.length}`,
                zinsbindung: 10,
                zinssatz: letzePhase.zinssatz + 0.5,
                tilgung: letzePhase.tilgung,
                sondertilgungJaehrlich: 0,
                aktiv: false
              };
              updateParams({...params, finanzierungsphasen: [...finanzierungsphasen, neuePhase]});
            };

            const updatePhase = (id, updates) => {
              const updated = finanzierungsphasen.map(p => p.id === id ? {...p, ...updates} : p);
              const newParams = {...params, finanzierungsphasen: updated};
              // Wenn erste Phase geändert wird, auch globale params aktualisieren für Kompatibilität
              if (finanzierungsphasen[0]?.id === id) {
                if (updates.zinssatz !== undefined) newParams.zinssatz = updates.zinssatz;
                if (updates.tilgung !== undefined) newParams.tilgung = updates.tilgung;
                if (updates.zinsbindung !== undefined) newParams.laufzeit = updates.zinsbindung;
              }
              updateParams(newParams);
            };

            const deletePhase = (id) => {
              if (finanzierungsphasen.length <= 1) return;
              const updated = finanzierungsphasen.filter(p => p.id !== id);
              updateParams({...params, finanzierungsphasen: updated});
            };

            return (
            <div className="space-y-6">
              {/* Gesamtübersicht */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                <h3 className="font-bold text-lg text-blue-800 mb-4">Gesamtinvestition</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Kaufpreis</div>
                    <div className="text-2xl font-bold text-gray-800">{formatCurrency(params.kaufpreis)}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">+ Nebenkosten ({params.kaufnebenkosten}%)</div>
                    <div className="text-2xl font-bold text-gray-800">{formatCurrency(kaufnebenkostenAbsolut)}</div>
                  </div>
                  <div className="bg-blue-600 p-4 rounded-lg shadow-sm text-white">
                    <div className="text-sm text-blue-100">= Gesamtinvestition</div>
                    <div className="text-2xl font-bold">{formatCurrency(gesamtinvestition)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Linke Spalte: Kaufpreis & Nebenkosten */}
                <div className="space-y-4">
                  {/* Kaufdatum & Kaufpreis */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-4">Kaufdetails</h4>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kaufdatum</label>
                      <input
                        type="date"
                        value={params.kaufdatum || ''}
                        onChange={(e) => updateParams({...params, kaufdatum: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <InputSliderCombo label="Kaufpreis" value={params.kaufpreis} onChange={(v) => updateParams({...params, kaufpreis: v})} min={50000} max={2000000} step={10000} unit="€" />
                  </div>

                  {/* Kaufnebenkosten */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <KaufnebenkostenManager
                      params={params}
                      updateParams={updateParams}
                      kaufpreis={params.kaufpreis}
                    />
                  </div>
                </div>

                {/* Rechte Spalte: Eigenkapital */}
                <div className="space-y-4">
                  {/* Eigenkapital Aufteilung */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-4">💰 Eigenkapitaleinsatz</h4>

                    {/* EK für Nebenkosten */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700">EK für Kaufnebenkosten</label>
                        <span className="text-xs text-gray-500">max. {formatCurrency(kaufnebenkostenAbsolut)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={kaufnebenkostenAbsolut}
                          step={1000}
                          value={ekFuerNebenkosten}
                          onChange={(e) => updateParams({...params, ekFuerNebenkosten: parseFloat(e.target.value)})}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          value={Math.round(ekFuerNebenkosten)}
                          onChange={(e) => updateParams({...params, ekFuerNebenkosten: Math.min(kaufnebenkostenAbsolut, parseFloat(e.target.value) || 0)})}
                          className="w-28 px-2 py-1 border rounded text-right text-sm"
                        />
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                      {ekFuerNebenkosten >= kaufnebenkostenAbsolut ? (
                        <p className="text-xs text-green-600 mt-1">✓ Nebenkosten komplett mit EK bezahlt</p>
                      ) : ekFuerNebenkosten > 0 ? (
                        <p className="text-xs text-yellow-600 mt-1">⚠ {formatCurrency(kaufnebenkostenAbsolut - ekFuerNebenkosten)} Nebenkosten werden mitfinanziert</p>
                      ) : (
                        <p className="text-xs text-orange-600 mt-1">⚠ Nebenkosten komplett mitfinanziert (100%-Finanzierung)</p>
                      )}
                    </div>

                    {/* EK für Kaufpreis */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700">EK für Kaufpreis</label>
                        <span className="text-xs text-gray-500">max. {formatCurrency(params.kaufpreis)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={params.kaufpreis}
                          step={5000}
                          value={ekFuerKaufpreis}
                          onChange={(e) => updateParams({...params, ekFuerKaufpreis: parseFloat(e.target.value)})}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          value={Math.round(ekFuerKaufpreis)}
                          onChange={(e) => updateParams({...params, ekFuerKaufpreis: Math.min(params.kaufpreis, parseFloat(e.target.value) || 0)})}
                          className="w-28 px-2 py-1 border rounded text-right text-sm"
                        />
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        = {params.kaufpreis > 0 ? ((ekFuerKaufpreis / params.kaufpreis) * 100).toFixed(1) : 0}% vom Kaufpreis
                      </p>
                    </div>

                    {/* Gesamt EK */}
                    <div className="pt-3 border-t border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-800">Gesamt Eigenkapital</span>
                        <span className="text-xl font-bold text-green-700">{formatCurrency(gesamtEK)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        = {gesamtinvestition > 0 ? ((gesamtEK / gesamtinvestition) * 100).toFixed(1) : 0}% der Gesamtinvestition
                      </p>
                    </div>
                  </div>

                  {/* Kreditkonditionen anpassen */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                    <h4 className="font-semibold text-yellow-800 mb-3">✏️ Kreditkonditionen anpassen</h4>
                    <p className="text-xs text-yellow-700 mb-3">Hier kannst du die Konditionen deiner Erstfinanzierung korrigieren:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zinssatz</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={15}
                            step={0.1}
                            value={params.zinssatz ?? 4.0}
                            onChange={(e) => {
                              const neuerZins = parseFloat(e.target.value) || 0;
                              const aktuellePhasen = params.finanzierungsphasen || [];
                              let neuePhasen = aktuellePhasen;
                              if (aktuellePhasen.length > 0) {
                                neuePhasen = aktuellePhasen.map((p, idx) => idx === 0 ? {...p, zinssatz: neuerZins} : p);
                              }
                              updateParams({...params, zinssatz: neuerZins, finanzierungsphasen: neuePhasen});
                            }}
                            className="w-full px-3 py-2 border border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-500 text-lg font-semibold text-right"
                          />
                          <span className="text-gray-600 font-semibold">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Anfängliche Tilgung</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={params.tilgung ?? 2.0}
                            onChange={(e) => {
                              const neueTilgung = parseFloat(e.target.value) || 0;
                              const aktuellePhasen = params.finanzierungsphasen || [];
                              let neuePhasen = aktuellePhasen;
                              if (aktuellePhasen.length > 0) {
                                neuePhasen = aktuellePhasen.map((p, idx) => idx === 0 ? {...p, tilgung: neueTilgung} : p);
                              }
                              updateParams({...params, tilgung: neueTilgung, finanzierungsphasen: neuePhasen});
                            }}
                            className="w-full px-3 py-2 border border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-500 text-lg font-semibold text-right"
                          />
                          <span className="text-gray-600 font-semibold">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-white rounded border border-yellow-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Annuität (Zins + Tilgung):</span>
                        <span className="font-bold text-yellow-800">{((params.zinssatz ?? 4.0) + (params.tilgung ?? 2.0)).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Initialer Kreditbetrag */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">🏦 Anfänglicher Kreditbetrag</h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Berechnet (Investition - EK)</span>
                      <span className="text-lg font-bold text-blue-700">{formatCurrency(berechneterKredit)}</span>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Oder manuell eingeben:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={params.finanzierungsbetrag !== null ? params.finanzierungsbetrag : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseFloat(e.target.value);
                            updateParams({...params, finanzierungsbetrag: val});
                          }}
                          placeholder="Automatisch"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <span className="text-gray-500">€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Finanzierungsphasen */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-gray-800">📅 Finanzierungsphasen</h3>
                  <button
                    onClick={addPhase}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <span>+</span> Anschlussfinanzierung
                  </button>
                </div>

                {/* Timeline-Visualisierung */}
                <div className="mb-6">
                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {phasenMitBerechnung.map((phase, idx) => {
                      const totalJahre = phasenMitBerechnung.reduce((sum, p) => sum + p.zinsbindung, 0);
                      const startProzent = phasenMitBerechnung.slice(0, idx).reduce((sum, p) => sum + p.zinsbindung, 0) / totalJahre * 100;
                      const breiteProzent = phase.zinsbindung / totalJahre * 100;
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                      return (
                        <div
                          key={phase.id}
                          className={`absolute top-0 h-full ${colors[idx % colors.length]} flex items-center justify-center text-white text-xs font-medium`}
                          style={{ left: `${startProzent}%`, width: `${breiteProzent}%` }}
                        >
                          <span className="truncate px-1">{phase.startjahr}-{phase.endjahr}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{kaufjahr}</span>
                    <span>{phasenMitBerechnung[phasenMitBerechnung.length - 1]?.endjahr}</span>
                  </div>
                </div>

                {/* Phasen-Karten */}
                <div className="space-y-4">
                  {phasenMitBerechnung.map((phase, idx) => (
                    <div key={phase.id} className={`border rounded-lg p-4 ${idx === 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white'}`}>
                              Phase {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={phase.name}
                              onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                              className="font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {phase.startjahr} – {phase.endjahr} ({phase.zinsbindung} Jahre)
                          </div>
                        </div>
                        {idx > 0 && (
                          <button
                            onClick={() => deletePhase(phase.id)}
                            className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                          >
                            Entfernen
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Zinsbindung</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={phase.zinsbindung}
                              onChange={(e) => updatePhase(phase.id, { zinsbindung: parseInt(e.target.value) || 1 })}
                              className="w-16 px-2 py-1.5 border rounded text-sm text-right"
                            />
                            <span className="text-xs text-gray-500">Jahre</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Zinssatz</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={15}
                              step={0.1}
                              value={phase.zinssatz}
                              onChange={(e) => updatePhase(phase.id, { zinssatz: parseFloat(e.target.value) || 0 })}
                              className="w-16 px-2 py-1.5 border rounded text-sm text-right"
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Anf. Tilgung</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={phase.tilgung}
                              onChange={(e) => updatePhase(phase.id, { tilgung: parseFloat(e.target.value) || 0 })}
                              className="w-16 px-2 py-1.5 border rounded text-sm text-right"
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Sondertilgung/Jahr</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={phase.sondertilgungJaehrlich}
                              onChange={(e) => updatePhase(phase.id, { sondertilgungJaehrlich: parseFloat(e.target.value) || 0 })}
                              className="w-20 px-2 py-1.5 border rounded text-sm text-right"
                            />
                            <span className="text-xs text-gray-500">€</span>
                          </div>
                        </div>
                      </div>

                      {/* Berechnungen für diese Phase */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Startbetrag</div>
                          <div className="font-semibold text-gray-800">{formatCurrency(phase.startKredit)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Monatl. Rate</div>
                          <div className="font-semibold text-gray-800">{formatCurrency(phase.monatlicheRate)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Getilgt in Phase</div>
                          <div className="font-semibold text-green-600">{formatCurrency(phase.getilgt)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Restschuld {phase.endjahr}</div>
                          <div className={`font-semibold ${phase.restschuld === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {phase.restschuld === 0 ? '✓ Abbezahlt' : formatCurrency(phase.restschuld)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gesamtzusammenfassung */}
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">📊 Gesamtübersicht Finanzierung</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Ursprünglicher Kredit</div>
                      <div className="text-lg font-bold text-gray-800">{formatCurrency(effektiverKredit)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Gesamtlaufzeit</div>
                      <div className="text-lg font-bold text-gray-800">
                        {phasenMitBerechnung.reduce((sum, p) => sum + p.zinsbindung, 0)} Jahre
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Aktuelle monatl. Rate</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(phasenMitBerechnung[0]?.monatlicheRate || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Endgültige Restschuld</div>
                      <div className={`text-lg font-bold ${phasenMitBerechnung[phasenMitBerechnung.length - 1]?.restschuld === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {formatCurrency(phasenMitBerechnung[phasenMitBerechnung.length - 1]?.restschuld || 0)}
                      </div>
                    </div>
                  </div>
                  {phasenMitBerechnung[phasenMitBerechnung.length - 1]?.restschuld > 0 && (
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ Nach {phasenMitBerechnung.reduce((sum, p) => sum + p.zinsbindung, 0)} Jahren besteht noch eine Restschuld.
                      Fügen Sie weitere Anschlussfinanzierungen hinzu oder erhöhen Sie die Tilgung.
                    </p>
                  )}
                </div>
              </div>
            </div>
            );
          })()}

          {activeTab === 'mieteinnahmen' && (
            <MieteinnahmenTracker
              params={params}
              updateParams={updateParams}
              immobilie={immobilie}
            />
          )}

          {activeTab === 'cashflow' && (
            <>
              <MietKostenManager
                params={params}
                updateParams={updateParams}
                immobilie={immobilie}
                hasChanges={hasChanges}
                setHasChanges={setHasChanges}
              />
              <CashflowUebersicht
                params={params}
                ergebnis={ergebnis}
                immobilie={immobilie}
                investitionen={params.investitionen}
              />
            </>
          )}

          {activeTab === 'steuern' && (
            <Steuerberechnung
              params={params}
              ergebnis={ergebnis}
              immobilie={{...immobilie, ...params}}
              onUpdateParams={updateParams}
            />
          )}

          {activeTab === 'investitionen' && (
            <ReparaturenInvestitionen
              immobilie={{...immobilie, investitionen: params.investitionen}}
              onUpdate={(updated) => {
                updateParams({...params, investitionen: updated.investitionen});
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Kalkulations-Komponente für schnelle Vorab-Berechnung
const KalkulationsModal = ({ onClose }) => {
  const [typ, setTyp] = useState('kauf'); // 'kauf' oder 'arbitrage'

  // Kauf-Parameter
  const [kaufpreis, setKaufpreis] = useState(300000);
  const [nebenkosten, setNebenkosten] = useState(10);
  const [eigenkapital, setEigenkapital] = useState(60000);
  const [zinssatz, setZinssatz] = useState(4.0);
  const [tilgung, setTilgung] = useState(2.0);
  const [kaltmiete, setKaltmiete] = useState(1200);
  const [betriebskosten, setBetriebskosten] = useState(300);
  const [steuersatz, setSteuersatz] = useState(42);

  // Arbitrage-Parameter
  const [eigeneWarmmiete, setEigeneWarmmiete] = useState(1500);
  const [anzahlZimmer, setAnzahlZimmer] = useState(3);
  const [mietProZimmer, setMietProZimmer] = useState(700);
  const [arbNebenkosten, setArbNebenkosten] = useState(150);

  // Berechnungen für Kaufimmobilie
  const kaufBerechnung = useMemo(() => {
    const nebenkostenAbsolut = kaufpreis * (nebenkosten / 100);
    const gesamtinvestition = kaufpreis + nebenkostenAbsolut;
    const kreditbetrag = gesamtinvestition - eigenkapital;
    const annuitaet = (zinssatz + tilgung) / 100;
    const monatlicheRate = (kreditbetrag * annuitaet) / 12;

    const monatlicheEinnahmen = kaltmiete;
    const monatlicheAusgaben = monatlicheRate + betriebskosten;
    const cashflowMonat = monatlicheEinnahmen - monatlicheAusgaben;

    // Steuerliche Berechnung
    const jahresMiete = kaltmiete * 12;
    const gebaeudeAnteil = kaufpreis * 0.8; // 80% Gebäudeanteil
    const afaJahr = gebaeudeAnteil * 0.02; // 2% AfA
    const zinsenJahr = kreditbetrag * (zinssatz / 100);
    const werbungskosten = afaJahr + zinsenJahr + (betriebskosten * 12);
    const zuVersteuern = jahresMiete - werbungskosten;
    const steuerEffekt = zuVersteuern * (steuersatz / 100);
    const cashflowNachSteuer = (cashflowMonat * 12) - steuerEffekt;

    const bruttoRendite = (jahresMiete / kaufpreis) * 100;
    const eigenkapitalRendite = eigenkapital > 0 ? (cashflowNachSteuer / eigenkapital) * 100 : 0;

    return {
      nebenkostenAbsolut,
      gesamtinvestition,
      kreditbetrag,
      monatlicheRate,
      cashflowMonat,
      jahresMiete,
      afaJahr,
      zinsenJahr,
      werbungskosten,
      zuVersteuern,
      steuerEffekt,
      cashflowNachSteuer,
      bruttoRendite,
      eigenkapitalRendite
    };
  }, [kaufpreis, nebenkosten, eigenkapital, zinssatz, tilgung, kaltmiete, betriebskosten, steuersatz]);

  // Berechnungen für Arbitrage
  const arbitrageBerechnung = useMemo(() => {
    const monatlicheEinnahmen = anzahlZimmer * mietProZimmer;
    const monatlicheAusgaben = eigeneWarmmiete + arbNebenkosten;
    const cashflowMonat = monatlicheEinnahmen - monatlicheAusgaben;
    const cashflowJahr = cashflowMonat * 12;

    // Steuerlich: Einkünfte müssen versteuert werden
    const zuVersteuern = cashflowJahr > 0 ? cashflowJahr : 0;
    const steuer = zuVersteuern * (steuersatz / 100);
    const nettoJahr = cashflowJahr - steuer;

    return {
      monatlicheEinnahmen,
      monatlicheAusgaben,
      cashflowMonat,
      cashflowJahr,
      zuVersteuern,
      steuer,
      nettoJahr
    };
  }, [eigeneWarmmiete, anzahlZimmer, mietProZimmer, arbNebenkosten, steuersatz]);

  const formatCurrency = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🧮 Schnellkalkulation</h2>
              <p className="text-purple-200 text-sm">Prüfe ob sich eine Immobilie lohnt - ohne zu speichern</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-purple-200 text-2xl">×</button>
          </div>

          {/* Typ-Auswahl */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setTyp('kauf')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${typ === 'kauf' ? 'bg-white text-purple-700' : 'bg-purple-700 text-white hover:bg-purple-600'}`}
            >
              🏠 Kaufimmobilie
            </button>
            <button
              onClick={() => setTyp('arbitrage')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${typ === 'arbitrage' ? 'bg-white text-purple-700' : 'bg-purple-700 text-white hover:bg-purple-600'}`}
            >
              🔄 Miet-Arbitrage
            </button>
          </div>
        </div>

        <div className="p-6">
          {typ === 'kauf' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Eingaben */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-2">📝 Eingaben</h3>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 text-sm mb-3">Kaufdaten</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Kaufpreis</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={kaufpreis} onChange={(e) => setKaufpreis(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={10000} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Nebenkosten</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={nebenkosten} onChange={(e) => setNebenkosten(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={0.5} />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600">Eigenkapital</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={eigenkapital} onChange={(e) => setEigenkapital(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={5000} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm mb-3">Finanzierung</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Zinssatz</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={zinssatz} onChange={(e) => setZinssatz(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={0.1} />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Tilgung</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={tilgung} onChange={(e) => setTilgung(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={0.5} />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 text-sm mb-3">Einnahmen & Kosten</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Kaltmiete/Monat</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={kaltmiete} onChange={(e) => setKaltmiete(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={50} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Betriebskosten/Monat</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={betriebskosten} onChange={(e) => setBetriebskosten(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={25} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm mb-3">Steuer</h4>
                  <div>
                    <label className="text-xs text-gray-600">Persönlicher Steuersatz</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={steuersatz} onChange={(e) => setSteuersatz(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={1} />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ergebnisse */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-2">📊 Ergebnis</h3>

                {/* Investitions-Übersicht */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Kaufpreis:</span>
                    <span className="text-right font-semibold">{formatCurrency(kaufpreis)}</span>
                    <span className="text-gray-600">+ Nebenkosten:</span>
                    <span className="text-right font-semibold">{formatCurrency(kaufBerechnung.nebenkostenAbsolut)}</span>
                    <span className="text-gray-600">= Gesamtinvestition:</span>
                    <span className="text-right font-bold text-blue-700">{formatCurrency(kaufBerechnung.gesamtinvestition)}</span>
                    <span className="text-gray-600">- Eigenkapital:</span>
                    <span className="text-right font-semibold text-green-600">{formatCurrency(eigenkapital)}</span>
                    <span className="text-gray-600">= Kreditbetrag:</span>
                    <span className="text-right font-bold">{formatCurrency(kaufBerechnung.kreditbetrag)}</span>
                  </div>
                </div>

                {/* Cashflow */}
                <div className={`p-4 rounded-lg ${kaufBerechnung.cashflowMonat >= 0 ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                  <h4 className="font-semibold text-sm mb-2">💰 Monatlicher Cashflow</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm mb-3">
                    <span>Kaltmiete:</span>
                    <span className="text-right text-green-700">+{formatCurrency(kaltmiete)}</span>
                    <span>Kreditrate:</span>
                    <span className="text-right text-red-700">-{formatCurrency(kaufBerechnung.monatlicheRate)}</span>
                    <span>Betriebskosten:</span>
                    <span className="text-right text-red-700">-{formatCurrency(betriebskosten)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Cashflow/Monat:</span>
                      <span className={`text-3xl font-bold ${kaufBerechnung.cashflowMonat >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {kaufBerechnung.cashflowMonat >= 0 ? '+' : ''}{formatCurrency(kaufBerechnung.cashflowMonat)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                      <span>Cashflow/Jahr:</span>
                      <span className="font-semibold">{formatCurrency(kaufBerechnung.cashflowMonat * 12)}</span>
                    </div>
                  </div>
                </div>

                {/* Steuerliche Betrachtung */}
                <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
                  <h4 className="font-semibold text-sm mb-2">📋 Steuerliche Betrachtung (jährlich)</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span>Mieteinnahmen:</span>
                    <span className="text-right">{formatCurrency(kaufBerechnung.jahresMiete)}</span>
                    <span>- AfA (2%):</span>
                    <span className="text-right text-green-700">-{formatCurrency(kaufBerechnung.afaJahr)}</span>
                    <span>- Schuldzinsen:</span>
                    <span className="text-right text-green-700">-{formatCurrency(kaufBerechnung.zinsenJahr)}</span>
                    <span>- Betriebskosten:</span>
                    <span className="text-right text-green-700">-{formatCurrency(betriebskosten * 12)}</span>
                    <span className="font-semibold">= Zu versteuern:</span>
                    <span className={`text-right font-semibold ${kaufBerechnung.zuVersteuern < 0 ? 'text-green-700' : ''}`}>
                      {formatCurrency(kaufBerechnung.zuVersteuern)}
                    </span>
                    <span>Steuereffekt ({steuersatz}%):</span>
                    <span className={`text-right font-semibold ${kaufBerechnung.steuerEffekt < 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {kaufBerechnung.steuerEffekt >= 0 ? '-' : '+'}{formatCurrency(Math.abs(kaufBerechnung.steuerEffekt))}
                    </span>
                  </div>
                  <div className="border-t mt-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Cashflow nach Steuer/Jahr:</span>
                      <span className={`text-lg font-bold ${kaufBerechnung.cashflowNachSteuer >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(kaufBerechnung.cashflowNachSteuer)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Renditen */}
                <div className="bg-blue-100 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">📈 Renditen</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-500">Bruttomietrendite</div>
                      <div className="text-xl font-bold text-blue-700">{kaufBerechnung.bruttoRendite.toFixed(2)}%</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-500">EK-Rendite (n. Steuer)</div>
                      <div className={`text-xl font-bold ${kaufBerechnung.eigenkapitalRendite >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {kaufBerechnung.eigenkapitalRendite.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fazit */}
                <div className={`p-4 rounded-lg ${kaufBerechnung.cashflowNachSteuer >= 0 ? 'bg-green-200' : 'bg-yellow-200'}`}>
                  <div className="font-bold">
                    {kaufBerechnung.cashflowNachSteuer >= 0 ? '✅ Cashflow-positiv!' : '⚠️ Cashflow-negativ'}
                  </div>
                  <p className="text-sm mt-1">
                    {kaufBerechnung.cashflowNachSteuer >= 0
                      ? `Die Immobilie erwirtschaftet ${formatCurrency(kaufBerechnung.cashflowNachSteuer)} Gewinn pro Jahr nach Steuern.`
                      : `Du musst ${formatCurrency(Math.abs(kaufBerechnung.cashflowNachSteuer))} pro Jahr zuschießen.`
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Arbitrage */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Eingaben */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-2">📝 Eingaben</h3>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 text-sm mb-3">Deine Mietkosten</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">Deine Warmmiete/Monat</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={eigeneWarmmiete} onChange={(e) => setEigeneWarmmiete(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={50} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Zusatzkosten (Strom, Internet, GEZ)</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={arbNebenkosten} onChange={(e) => setArbNebenkosten(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={10} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm mb-3">Untervermietung</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">Anzahl Zimmer zur Vermietung</label>
                      <input type="number" value={anzahlZimmer} onChange={(e) => setAnzahlZimmer(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" min={1} max={10} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Einnahmen pro Zimmer/Monat</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={mietProZimmer} onChange={(e) => setMietProZimmer(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={50} />
                        <span className="text-xs">€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm mb-3">Steuer</h4>
                  <div>
                    <label className="text-xs text-gray-600">Persönlicher Steuersatz</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={steuersatz} onChange={(e) => setSteuersatz(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm text-right" step={1} />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ergebnisse */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-2">📊 Ergebnis</h3>

                {/* Monatlicher Cashflow */}
                <div className={`p-4 rounded-lg ${arbitrageBerechnung.cashflowMonat >= 0 ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                  <h4 className="font-semibold text-sm mb-2">💰 Monatlicher Cashflow</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm mb-3">
                    <span>Einnahmen ({anzahlZimmer} × {formatCurrency(mietProZimmer)}):</span>
                    <span className="text-right text-green-700">+{formatCurrency(arbitrageBerechnung.monatlicheEinnahmen)}</span>
                    <span>Deine Warmmiete:</span>
                    <span className="text-right text-red-700">-{formatCurrency(eigeneWarmmiete)}</span>
                    <span>Zusatzkosten:</span>
                    <span className="text-right text-red-700">-{formatCurrency(arbNebenkosten)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Cashflow/Monat:</span>
                      <span className={`text-3xl font-bold ${arbitrageBerechnung.cashflowMonat >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {arbitrageBerechnung.cashflowMonat >= 0 ? '+' : ''}{formatCurrency(arbitrageBerechnung.cashflowMonat)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                      <span>Cashflow/Jahr:</span>
                      <span className="font-semibold">{formatCurrency(arbitrageBerechnung.cashflowJahr)}</span>
                    </div>
                  </div>
                </div>

                {/* Steuerliche Betrachtung */}
                <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
                  <h4 className="font-semibold text-sm mb-2">📋 Steuerliche Betrachtung</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span>Einkünfte/Jahr:</span>
                    <span className="text-right">{formatCurrency(arbitrageBerechnung.zuVersteuern)}</span>
                    <span>Einkommensteuer ({steuersatz}%):</span>
                    <span className="text-right text-red-700">-{formatCurrency(arbitrageBerechnung.steuer)}</span>
                  </div>
                  <div className="border-t mt-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Netto nach Steuer/Jahr:</span>
                      <span className={`text-lg font-bold ${arbitrageBerechnung.nettoJahr >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(arbitrageBerechnung.nettoJahr)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fazit */}
                <div className={`p-4 rounded-lg ${arbitrageBerechnung.cashflowMonat >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
                  <div className="font-bold text-lg">
                    {arbitrageBerechnung.cashflowMonat > 0 ? '✅ Profitabel!' : arbitrageBerechnung.cashflowMonat === 0 ? '⚖️ Break-Even' : '❌ Nicht profitabel'}
                  </div>
                  <p className="text-sm mt-1">
                    {arbitrageBerechnung.cashflowMonat > 0
                      ? `Du verdienst ${formatCurrency(arbitrageBerechnung.nettoJahr)} netto pro Jahr und wohnst quasi kostenlos!`
                      : arbitrageBerechnung.cashflowMonat === 0
                        ? 'Du wohnst kostenlos, verdienst aber nichts zusätzlich.'
                        : `Du zahlst effektiv ${formatCurrency(Math.abs(arbitrageBerechnung.cashflowMonat))}/Monat für dein Wohnen.`
                    }
                  </p>
                </div>

                {/* Hinweis */}
                <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600">
                  <strong>💡 Hinweis:</strong> Bei Miet-Arbitrage prüfe unbedingt deinen Mietvertrag auf Untervermietungsrechte und informiere dich über lokale Regelungen.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

// Haupt-App Komponente
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showKalkulation, setShowKalkulation] = useState(false);
  const [selectedImmobilie, setSelectedImmobilie] = useState(null);
  const [editImmobilie, setEditImmobilie] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'error'

  // Auth State überwachen
  useEffect(() => {
    // Aktuelle Session abrufen
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Auth State Changes abonnieren
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Daten aus Supabase laden wenn eingeloggt
  useEffect(() => {
    if (session) {
      loadPortfolioFromDB();
    } else {
      setPortfolio([]);
    }
  }, [session]);

  // Portfolio aus Datenbank laden
  const loadPortfolioFromDB = async () => {
    try {
      setSyncStatus('syncing');
      const data = await loadImmobilien();
      setPortfolio(data);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      setSyncStatus('error');
    }
  };

  const handleSave = async (data) => {
    try {
      setSyncStatus('syncing');
      if (editImmobilie) {
        // Update existierende Immobilie
        const updated = await saveImmobilie({ ...data, id: editImmobilie.id });
        setPortfolio(prev => prev.map(i => i.id === editImmobilie.id ? updated : i));
        setEditImmobilie(null);
      } else {
        // Neue Immobilie erstellen
        const created = await saveImmobilie(data);
        setPortfolio(prev => [...prev, created]);
      }
      setShowForm(false);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setSyncStatus('error');
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Möchten Sie diese Immobilie wirklich löschen?')) {
      try {
        setSyncStatus('syncing');
        await deleteImmobilie(id);
        setPortfolio(prev => prev.filter(i => i.id !== id));
        setSyncStatus('idle');
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        setSyncStatus('error');
        alert('Fehler beim Löschen: ' + error.message);
      }
    }
  };

  // Logout Funktion
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Export Portfolio als JSON
  const handleExport = () => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      portfolio: portfolio
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `immobilien-portfolio-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import Portfolio aus JSON
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result);

        // Validierung
        if (!importData.portfolio || !Array.isArray(importData.portfolio)) {
          alert('Ungültiges Dateiformat. Bitte wählen Sie eine gültige Export-Datei.');
          return;
        }

        // Frage ob ersetzen oder hinzufügen
        const choice = confirm(
          `${importData.portfolio.length} Immobilie(n) gefunden.\n\n` +
          `OK = Zu bestehenden hinzufügen\n` +
          `Abbrechen = Import abbrechen\n\n` +
          `(Um alle zu ersetzen, löschen Sie zuerst das bestehende Portfolio)`
        );

        if (choice) {
          setSyncStatus('syncing');
          let importedCount = 0;

          // Jede Immobilie einzeln in die Datenbank speichern
          for (const immo of importData.portfolio) {
            try {
              // ID entfernen damit eine neue erstellt wird
              const { id, ...immoData } = immo;
              const created = await saveImmobilie(immoData);
              setPortfolio(prev => [...prev, created]);
              importedCount++;
            } catch (err) {
              console.error('Fehler beim Importieren einer Immobilie:', err);
            }
          }

          setSyncStatus('idle');
          alert(`${importedCount} Immobilie(n) erfolgreich importiert!`);
        }
      } catch (error) {
        alert('Fehler beim Importieren: ' + error.message);
        setSyncStatus('error');
      }
    };
    reader.readAsText(file);
    // Reset input für erneuten Import
    event.target.value = '';
  };

  // Steuer-Export Funktion
  const handleSteuerExport = (jahr) => {
    if (!jahr) {
      jahr = new Date().getFullYear();
    }

    // Nur Kaufimmobilien für Steuer-Export (Mietimmobilien haben andere Logik)
    const kaufimmobilien = portfolio.filter(i => i.immobilienTyp !== 'mietimmobilie');
    const mietimmobilien = portfolio.filter(i => i.immobilienTyp === 'mietimmobilie');

    // Excel Workbook erstellen
    const wb = XLSX.utils.book_new();

    // ==================== ÜBERSICHT ====================
    const uebersichtData = [
      ['STEUERLICHE ÜBERSICHT ' + jahr],
      ['Erstellt am:', new Date().toLocaleDateString('de-DE')],
      [''],
      ['ZUSAMMENFASSUNG'],
      [''],
      ['Position', 'Betrag (€)', 'Hinweis'],
    ];

    let gesamtEinnahmen = 0;
    let gesamtWerbungskosten = 0;

    // Berechne Summen
    kaufimmobilien.forEach(immo => {
      const kaltmiete = (immo.kaltmiete || 0) * 12;
      gesamtEinnahmen += kaltmiete;

      // AfA berechnen
      const kaufpreis = immo.kaufpreis || 0;
      const gebaeudeAnteil = (immo.gebaeudeAnteilProzent || 80) / 100;
      const afaSatz = (immo.afaSatz || 2) / 100;
      const afaBasis = kaufpreis * gebaeudeAnteil;
      const afaJahr = afaBasis * afaSatz;
      gesamtWerbungskosten += afaJahr;

      // Schuldzinsen berechnen
      const zinssatz = immo.zinssatz || 4;
      const kaufnebenkosten = immo.kaufnebenkosten || 10;
      const kaufnebenkostenAbsolut = kaufpreis * (kaufnebenkosten / 100);
      const gesamtinvestition = kaufpreis + kaufnebenkostenAbsolut;
      const gesamtEK = (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0) || (immo.eigenkapital || kaufpreis * 0.2);
      const fremdkapital = immo.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);
      const schuldzinsenJahr = fremdkapital * (zinssatz / 100);
      gesamtWerbungskosten += schuldzinsenJahr;

      // Sonstige Kosten
      const instandhaltung = (immo.instandhaltung || 0) * 12;
      const verwaltung = (immo.verwaltung || 0) * 12;
      const hausgeld = (immo.hausgeld || 0) * 12;
      const strom = (immo.strom || 0) * 12;
      const internet = (immo.internet || 0) * 12;
      gesamtWerbungskosten += instandhaltung + verwaltung + hausgeld + strom + internet;

      // Fahrtkosten
      const fahrtenProMonat = immo.fahrtenProMonat || 0;
      const entfernungKm = immo.entfernungKm || 0;
      const kmPauschale = immo.kmPauschale || 0.30;
      const fahrtkosten = fahrtenProMonat * 12 * entfernungKm * 2 * kmPauschale;
      gesamtWerbungskosten += fahrtkosten;

      // Erhaltungsaufwand aus Investitionen
      const investitionen = immo.investitionen || [];
      const erhaltungsaufwandJahr = investitionen
        .filter(inv => inv.kategorie === 'erhaltung' && new Date(inv.datum).getFullYear() === jahr)
        .reduce((sum, inv) => sum + inv.betrag, 0);
      gesamtWerbungskosten += erhaltungsaufwandJahr;
    });

    // Arbitrage-Einkünfte
    let arbitrageEinnahmen = 0;
    let arbitrageAusgaben = 0;
    mietimmobilien.forEach(immo => {
      const einnahmen = (immo.anzahlZimmerVermietet || 0) * (immo.untermieteProZimmer || 0) * 12;
      const miete = (immo.eigeneWarmmiete || 0) * 12;
      const zusatzkosten = ((immo.arbitrageStrom || 0) + (immo.arbitrageInternet || 0) + (immo.arbitrageGEZ || 0)) * 12;
      arbitrageEinnahmen += einnahmen;
      arbitrageAusgaben += miete + zusatzkosten;
    });

    const steuerlichesErgebnis = gesamtEinnahmen - gesamtWerbungskosten + (arbitrageEinnahmen - arbitrageAusgaben);

    uebersichtData.push(
      ['Mieteinnahmen (Kaufimmobilien)', gesamtEinnahmen.toFixed(2), 'Kaltmiete × 12 Monate'],
      ['Werbungskosten', (-gesamtWerbungskosten).toFixed(2), 'AfA, Zinsen, Kosten'],
      [''],
      ['Arbitrage-Einnahmen', arbitrageEinnahmen.toFixed(2), 'Untervermietung'],
      ['Arbitrage-Ausgaben', (-arbitrageAusgaben).toFixed(2), 'Miete + Nebenkosten'],
      [''],
      ['STEUERLICHES ERGEBNIS', steuerlichesErgebnis.toFixed(2), steuerlichesErgebnis < 0 ? 'Verlust' : 'Gewinn']
    );

    const wsUebersicht = XLSX.utils.aoa_to_sheet(uebersichtData);
    wsUebersicht['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsUebersicht, 'Übersicht');

    // ==================== KAUFIMMOBILIEN DETAIL ====================
    if (kaufimmobilien.length > 0) {
      const detailHeader = [
        'Immobilie', 'Adresse', 'Kaufpreis €', 'Kaltmiete/Jahr €',
        'AfA €', 'Schuldzinsen €', 'Instandhaltung €', 'Verwaltung €',
        'Hausgeld €', 'Strom €', 'Internet €', 'Fahrtkosten €',
        'Erhaltungsaufwand €', 'Summe Werbungskosten €', 'Ergebnis €'
      ];

      const detailData = [detailHeader];

      kaufimmobilien.forEach(immo => {
        const kaltmieteJahr = (immo.kaltmiete || 0) * 12;

        // AfA
        const kaufpreis = immo.kaufpreis || 0;
        const gebaeudeAnteil = (immo.gebaeudeAnteilProzent || 80) / 100;
        const afaSatz = (immo.afaSatz || 2) / 100;
        const afaJahr = kaufpreis * gebaeudeAnteil * afaSatz;

        // Schuldzinsen
        const zinssatz = immo.zinssatz || 4;
        const kaufnebenkosten = immo.kaufnebenkosten || 10;
        const kaufnebenkostenAbsolut = kaufpreis * (kaufnebenkosten / 100);
        const gesamtinvestition = kaufpreis + kaufnebenkostenAbsolut;
        const gesamtEK = (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0) || (immo.eigenkapital || kaufpreis * 0.2);
        const fremdkapital = immo.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);
        const schuldzinsenJahr = fremdkapital * (zinssatz / 100);

        // Kosten
        const instandhaltung = (immo.instandhaltung || 0) * 12;
        const verwaltung = (immo.verwaltung || 0) * 12;
        const hausgeld = (immo.hausgeld || 0) * 12;
        const strom = (immo.strom || 0) * 12;
        const internet = (immo.internet || 0) * 12;

        // Fahrtkosten
        const fahrtenProMonat = immo.fahrtenProMonat || 0;
        const entfernungKm = immo.entfernungKm || 0;
        const kmPauschale = immo.kmPauschale || 0.30;
        const fahrtkosten = fahrtenProMonat * 12 * entfernungKm * 2 * kmPauschale;

        // Erhaltungsaufwand
        const investitionen = immo.investitionen || [];
        const erhaltungsaufwand = investitionen
          .filter(inv => inv.kategorie === 'erhaltung' && new Date(inv.datum).getFullYear() === jahr)
          .reduce((sum, inv) => sum + inv.betrag, 0);

        const summeWerbungskosten = afaJahr + schuldzinsenJahr + instandhaltung + verwaltung + hausgeld + strom + internet + fahrtkosten + erhaltungsaufwand;
        const ergebnis = kaltmieteJahr - summeWerbungskosten;

        detailData.push([
          immo.name || 'Unbenannt',
          `${immo.plz || ''} ${immo.adresse || ''}`,
          kaufpreis.toFixed(2),
          kaltmieteJahr.toFixed(2),
          afaJahr.toFixed(2),
          schuldzinsenJahr.toFixed(2),
          instandhaltung.toFixed(2),
          verwaltung.toFixed(2),
          hausgeld.toFixed(2),
          strom.toFixed(2),
          internet.toFixed(2),
          fahrtkosten.toFixed(2),
          erhaltungsaufwand.toFixed(2),
          summeWerbungskosten.toFixed(2),
          ergebnis.toFixed(2)
        ]);
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      wsDetail['!cols'] = Array(15).fill({ wch: 14 });
      wsDetail['!cols'][0] = { wch: 20 };
      wsDetail['!cols'][1] = { wch: 25 };
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Kaufimmobilien');
    }

    // ==================== MIETIMMOBILIEN (ARBITRAGE) ====================
    if (mietimmobilien.length > 0) {
      const arbitrageHeader = [
        'Immobilie', 'Adresse', 'Eigene Miete/Jahr €',
        'Strom/Jahr €', 'Internet/Jahr €', 'GEZ/Jahr €',
        'Einnahmen/Jahr €', 'Gewinn/Jahr €'
      ];

      const arbitrageData = [arbitrageHeader];

      mietimmobilien.forEach(immo => {
        const eigeneMiete = (immo.eigeneWarmmiete || 0) * 12;
        const strom = (immo.arbitrageStrom || 0) * 12;
        const internet = (immo.arbitrageInternet || 0) * 12;
        const gez = (immo.arbitrageGEZ || 0) * 12;
        const einnahmen = (immo.anzahlZimmerVermietet || 0) * (immo.untermieteProZimmer || 0) * 12;
        const gewinn = einnahmen - eigeneMiete - strom - internet - gez;

        arbitrageData.push([
          immo.name || 'Unbenannt',
          `${immo.plz || ''} ${immo.adresse || ''}`,
          eigeneMiete.toFixed(2),
          strom.toFixed(2),
          internet.toFixed(2),
          gez.toFixed(2),
          einnahmen.toFixed(2),
          gewinn.toFixed(2)
        ]);
      });

      const wsArbitrage = XLSX.utils.aoa_to_sheet(arbitrageData);
      wsArbitrage['!cols'] = Array(8).fill({ wch: 16 });
      wsArbitrage['!cols'][0] = { wch: 20 };
      wsArbitrage['!cols'][1] = { wch: 25 };
      XLSX.utils.book_append_sheet(wb, wsArbitrage, 'Mietimmobilien');
    }

    // ==================== INVESTITIONEN ====================
    const alleInvestitionen = [];
    kaufimmobilien.forEach(immo => {
      const investitionen = immo.investitionen || [];
      investitionen.forEach(inv => {
        if (new Date(inv.datum).getFullYear() === jahr) {
          alleInvestitionen.push({
            immobilie: immo.name || 'Unbenannt',
            ...inv
          });
        }
      });
    });

    if (alleInvestitionen.length > 0) {
      const invHeader = ['Immobilie', 'Datum', 'Beschreibung', 'Kategorie', 'Betrag €', 'Steuerliche Behandlung'];
      const kategorieLabels = {
        'erhaltung': 'Erhaltungsaufwand',
        'herstellung': 'Herstellungskosten',
        'anschaffung': 'Anschaffungsnebenkosten',
        'modernisierung': 'Modernisierung',
        'nicht_relevant': 'Nicht steuerlich relevant'
      };
      const steuerBehandlung = {
        'erhaltung': 'Sofort absetzbar',
        'herstellung': 'Über AfA abschreiben',
        'anschaffung': 'Erhöht AfA-Bemessungsgrundlage',
        'modernisierung': 'Über AfA abschreiben',
        'nicht_relevant': 'Keine Steuerwirkung'
      };

      const invData = [invHeader];
      alleInvestitionen.forEach(inv => {
        invData.push([
          inv.immobilie,
          new Date(inv.datum).toLocaleDateString('de-DE'),
          inv.beschreibung || '',
          kategorieLabels[inv.kategorie] || inv.kategorie,
          inv.betrag.toFixed(2),
          steuerBehandlung[inv.kategorie] || ''
        ]);
      });

      const wsInv = XLSX.utils.aoa_to_sheet(invData);
      wsInv['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsInv, 'Investitionen');
    }

    // Excel speichern
    XLSX.writeFile(wb, `Steuer-Export-${jahr}.xlsx`);

    // ==================== PDF ERSTELLEN ====================
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Titel
    pdf.setFontSize(20);
    pdf.text(`Steuerliche Übersicht ${jahr}`, 105, 20, { align: 'center' });

    pdf.setFontSize(10);
    pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 105, 28, { align: 'center' });

    // Zusammenfassung
    pdf.setFontSize(14);
    pdf.text('Zusammenfassung', 14, 45);

    pdf.autoTable({
      startY: 50,
      head: [['Position', 'Betrag', 'Hinweis']],
      body: [
        ['Mieteinnahmen (Kaufimmobilien)', formatCurrency(gesamtEinnahmen), 'Kaltmiete × 12 Monate'],
        ['Werbungskosten', formatCurrency(-gesamtWerbungskosten), 'AfA, Zinsen, Kosten'],
        ['Arbitrage-Einnahmen', formatCurrency(arbitrageEinnahmen), 'Untervermietung'],
        ['Arbitrage-Ausgaben', formatCurrency(-arbitrageAusgaben), 'Miete + Nebenkosten'],
        ['', '', ''],
        ['STEUERLICHES ERGEBNIS', formatCurrency(steuerlichesErgebnis), steuerlichesErgebnis < 0 ? 'Verlust' : 'Gewinn']
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        1: { halign: 'right' }
      }
    });

    // Kaufimmobilien Details
    if (kaufimmobilien.length > 0) {
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('Kaufimmobilien - Details', 14, 20);

      const kaufRows = kaufimmobilien.map(immo => {
        const kaltmieteJahr = (immo.kaltmiete || 0) * 12;
        const kaufpreis = immo.kaufpreis || 0;
        const afaJahr = kaufpreis * ((immo.gebaeudeAnteilProzent || 80) / 100) * ((immo.afaSatz || 2) / 100);
        const gesamtinvestition = kaufpreis * (1 + (immo.kaufnebenkosten || 10) / 100);
        const gesamtEK = (immo.ekFuerNebenkosten || 0) + (immo.ekFuerKaufpreis || 0) || (immo.eigenkapital || kaufpreis * 0.2);
        const fremdkapital = immo.finanzierungsbetrag ?? Math.max(0, gesamtinvestition - gesamtEK);
        const schuldzinsen = fremdkapital * ((immo.zinssatz || 4) / 100);
        const sonstigeKosten = ((immo.instandhaltung || 0) + (immo.verwaltung || 0) + (immo.hausgeld || 0) + (immo.strom || 0) + (immo.internet || 0)) * 12;

        return [
          immo.name || 'Unbenannt',
          formatCurrency(kaltmieteJahr),
          formatCurrency(afaJahr),
          formatCurrency(schuldzinsen),
          formatCurrency(sonstigeKosten)
        ];
      });

      pdf.autoTable({
        startY: 25,
        head: [['Immobilie', 'Einnahmen', 'AfA', 'Schuldzinsen', 'Sonst. Kosten']],
        body: kaufRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        }
      });
    }

    // Mietimmobilien Details
    if (mietimmobilien.length > 0) {
      const yPos = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 20 : 25;
      if (yPos > 250) pdf.addPage();

      pdf.setFontSize(14);
      pdf.text('Mietimmobilien (Arbitrage) - Details', 14, yPos > 250 ? 20 : yPos);

      const mietRows = mietimmobilien.map(immo => {
        const einnahmen = (immo.anzahlZimmerVermietet || 0) * (immo.untermieteProZimmer || 0) * 12;
        const ausgaben = ((immo.eigeneWarmmiete || 0) + (immo.arbitrageStrom || 0) + (immo.arbitrageInternet || 0) + (immo.arbitrageGEZ || 0)) * 12;
        return [
          immo.name || 'Unbenannt',
          formatCurrency(einnahmen),
          formatCurrency(ausgaben),
          formatCurrency(einnahmen - ausgaben)
        ];
      });

      pdf.autoTable({
        startY: yPos > 250 ? 25 : yPos + 5,
        head: [['Immobilie', 'Einnahmen', 'Ausgaben', 'Gewinn']],
        body: mietRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [142, 68, 173] },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
    }

    // Hinweis
    pdf.setFontSize(8);
    pdf.setTextColor(128);
    const finalY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 15 : 280;
    pdf.text('Hinweis: Diese Übersicht dient als Grundlage für die Steuererklärung. Bitte prüfen Sie alle Angaben mit Ihrem Steuerberater.', 14, Math.min(finalY, 280));

    pdf.save(`Steuer-Uebersicht-${jahr}.pdf`);

    alert(`Steuer-Export für ${jahr} erstellt!\n\n✓ Excel-Datei: Steuer-Export-${jahr}.xlsx\n✓ PDF-Datei: Steuer-Uebersicht-${jahr}.pdf`);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🏠</div>
          <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">Lade...</p>
        </div>
      </div>
    );
  }

  // Login Screen wenn nicht eingeloggt
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              🏠 Immobilien Portfolio & Leverage Rechner
            </h1>
            <p className="mt-2 text-blue-100">Rendite • Cashflow • Wertentwicklung • Portfolio</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sync Status Indicator */}
            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-2 text-blue-200 text-sm">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Synchronisiere...
              </div>
            )}
            {syncStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-300 text-sm">
                <span>⚠️</span> Sync-Fehler
              </div>
            )}
            {/* User Info & Logout */}
            <div className="text-right">
              <p className="text-sm text-blue-200">{session.user.email}</p>
              <button
                onClick={handleLogout}
                className="text-sm text-blue-100 hover:text-white underline"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <PortfolioOverview portfolio={portfolio} />

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Meine Immobilien</h2>
          <div className="flex flex-wrap gap-2">
            {/* Import/Export Buttons */}
            {portfolio.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                >
                  📤 Export
                </button>
                <div className="relative group">
                  <button
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2 text-sm"
                  >
                    📊 Steuer-Export
                  </button>
                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="py-1">
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <button
                            key={year}
                            onClick={() => handleSteuerExport(year)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-gray-700"
                          >
                            Jahr {year}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
            <label className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm cursor-pointer">
              📥 Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowKalkulation(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              🧮 Kalkulation
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <span>+</span> Neue Immobilie
            </button>
          </div>
        </div>

        {portfolio.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <div className="text-6xl mb-4">🏡</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Noch keine Immobilien</h3>
            <p className="text-gray-500 mb-4">Fügen Sie Ihre erste Immobilie hinzu, um Renditen und Cashflow zu berechnen.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Erste Immobilie hinzufügen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map(immobilie => (
              <ImmobilienKarte
                key={immobilie.id}
                immobilie={immobilie}
                onClick={() => setSelectedImmobilie(immobilie)}
                onDelete={() => handleDelete(immobilie.id)}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <ImmobilienFormular
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditImmobilie(null); }}
          initialData={editImmobilie}
        />
      )}

      {showKalkulation && (
        <KalkulationsModal onClose={() => setShowKalkulation(false)} />
      )}

      {selectedImmobilie && (
        <ImmobilienDetail
          immobilie={selectedImmobilie}
          onClose={() => setSelectedImmobilie(null)}
          onSave={async (data) => {
            try {
              setSyncStatus('syncing');
              const updated = await saveImmobilie({ ...data, id: selectedImmobilie.id });
              setPortfolio(prev => prev.map(i => i.id === selectedImmobilie.id ? updated : i));
              setSelectedImmobilie(updated);
              setSyncStatus('idle');
            } catch (error) {
              console.error('Fehler beim Speichern:', error);
              setSyncStatus('error');
              alert('Fehler beim Speichern: ' + error.message);
            }
          }}
        />
      )}

      <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>Erstellt mit ❤️ für Immobilieninvestoren</p>
          <p className="text-sm mt-2">Alle Berechnungen ohne Gewähr. Keine Anlageberatung.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
