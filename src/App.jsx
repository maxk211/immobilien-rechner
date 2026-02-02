import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

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
  const eigenkapital = immobilie.eigenkapital ?? immobilie.kaufpreis * 0.2;

  // Fremdkapital berechnen
  const kaufnebenkostenAbsolut = immobilie.kaufpreis * (kaufnebenkosten / 100);
  const gesamtkosten = immobilie.kaufpreis + kaufnebenkostenAbsolut;
  const anfangsFremdkapital = Math.max(0, gesamtkosten - eigenkapital);

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
    kaufpreis, eigenkapital, zinssatz, tilgung, laufzeit,
    kaltmiete, nebenkosten, instandhaltung, verwaltung,
    wertsteigerung, mietsteigerung, kaufnebenkosten
  } = params;

  const kaufnebenkostenAbsolut = kaufpreis * (kaufnebenkosten / 100);
  const gesamtkosten = kaufpreis + kaufnebenkostenAbsolut;
  const fremdkapital = gesamtkosten - eigenkapital;

  const jahresmieteKalt = kaltmiete * 12;
  const jahresnebenkosten = nebenkosten * 12; // Wird vom Mieter getragen, nicht in Nettorendite
  const jahresinstandhaltung = instandhaltung * 12;
  const jahresverwaltung = verwaltung * 12;

  const bruttorendite = (jahresmieteKalt / kaufpreis) * 100;
  // Nettorendite: Nur Instandhaltung und Verwaltung abziehen (Nebenkosten trägt der Mieter)
  const nettoEinnahmen = jahresmieteKalt - jahresinstandhaltung - jahresverwaltung;
  const nettorendite = (nettoEinnahmen / kaufpreis) * 100;

  const monatszins = zinssatz / 100 / 12;
  const annuitaet = fremdkapital > 0 ? fremdkapital * (monatszins * Math.pow(1 + monatszins, laufzeit * 12)) / (Math.pow(1 + monatszins, laufzeit * 12) - 1) : 0;
  const jahresannuitaet = annuitaet * 12;

  const cashflowVorSteuern = nettoEinnahmen - jahresannuitaet;
  const cashOnCash = eigenkapital > 0 ? (cashflowVorSteuern / eigenkapital) * 100 : 0;

  const eigenkapitalRendite = eigenkapital > 0 ? ((nettoEinnahmen + (kaufpreis * wertsteigerung / 100)) / eigenkapital) * 100 : 0;

  const leverageEffekt = eigenkapitalRendite - nettorendite;

  // Entwicklung über Zeit
  const entwicklung = [];
  let aktuellerWert = kaufpreis;
  let aktuelleMiete = kaltmiete;
  let restschuld = fremdkapital;
  let gesamtTilgung = 0;
  let gesamtZinsen = 0;

  for (let jahr = 0; jahr <= laufzeit; jahr++) {
    const jahresZinsen = restschuld * (zinssatz / 100);
    const jahresTilgung = Math.min(jahresannuitaet - jahresZinsen, restschuld);

    entwicklung.push({
      jahr,
      immobilienwert: Math.round(aktuellerWert),
      restschuld: Math.round(restschuld),
      eigenkapital: Math.round(aktuellerWert - restschuld),
      jahresmiete: Math.round(aktuelleMiete * 12),
      cashflow: Math.round((aktuelleMiete * 12) - jahresinstandhaltung - jahresverwaltung - jahresannuitaet)
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
    kaufdatum: ''
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
                    placeholder="z.B. Wohnung München"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kaufdatum</label>
                  <input
                    type="date"
                    value={formData.kaufdatum}
                    onChange={(e) => handleChange('kaufdatum', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

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
  const aktuellerWert = immobilie.geschaetzterWert || immobilie.kaufpreis;
  const wertsteigerung = berechneWertsteigerungSeitKauf(immobilie, aktuellerWert);
  const restschuldInfo = berechneRestschuld(immobilie);

  return (
    <div
      className="bg-white rounded-xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-shadow border border-gray-100"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-800">{immobilie.name || 'Unbenannte Immobilie'}</h3>
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
      </div>
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

    portfolio.forEach(immo => {
      gesamtKaufpreis += immo.kaufpreis;
      gesamtWert += immo.geschaetzterWert || immo.kaufpreis;
      gesamtMiete += immo.kaltmiete * 12;
      gesamtFlaeche += immo.wohnflaeche;
    });

    return {
      anzahl: portfolio.length,
      gesamtKaufpreis,
      gesamtWert,
      wertsteigerung: gesamtWert - gesamtKaufpreis,
      gesamtMiete,
      gesamtFlaeche,
      durchschnittRendite: gesamtKaufpreis > 0 ? (gesamtMiete / gesamtKaufpreis) * 100 : 0
    };
  }, [portfolio]);

  if (portfolio.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-6">
      <h2 className="text-xl font-bold mb-4">Portfolio-Übersicht</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-blue-200 text-sm">Immobilien</div>
          <div className="text-2xl font-bold">{stats.anzahl}</div>
        </div>
        <div>
          <div className="text-blue-200 text-sm">Gesamtwert</div>
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
    grunderwerbsteuer: kaufpreis * 0.035, // 3,5% - 6,5% je nach Bundesland
    notar: kaufpreis * 0.015, // ca. 1,5%
    grundbuch: kaufpreis * 0.005, // ca. 0,5%
    makler: kaufpreis * 0.0357, // 3,57% (inkl. MwSt)
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

  const gesamtManuell = Object.values(positionen).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const gesamtProzent = kaufpreis > 0 ? (gesamtManuell / kaufpreis) * 100 : 0;

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
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Kaufnebenkosten</h3>
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
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-600">Grunderwerbsteuer ({bundeslaender[bundesland].grunderwerbsteuer}%)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={Math.round(positionen.grunderwerbsteuer)}
                  onChange={(e) => handlePositionChange('grunderwerbsteuer', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-sm text-right"
                />
                <span className="text-xs text-gray-500">€</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-600">Notar (ca. 1,5%)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={Math.round(positionen.notar)}
                  onChange={(e) => handlePositionChange('notar', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-sm text-right"
                />
                <span className="text-xs text-gray-500">€</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-600">Grundbuch (ca. 0,5%)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={Math.round(positionen.grundbuch)}
                  onChange={(e) => handlePositionChange('grundbuch', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-sm text-right"
                />
                <span className="text-xs text-gray-500">€</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-600">Makler (ca. 3,57%)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={Math.round(positionen.makler)}
                  onChange={(e) => handlePositionChange('makler', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-sm text-right"
                />
                <span className="text-xs text-gray-500">€</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-600">Sonstige</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={Math.round(positionen.sonstige)}
                  onChange={(e) => handlePositionChange('sonstige', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-sm text-right"
                />
                <span className="text-xs text-gray-500">€</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="font-semibold text-gray-700">Gesamt</span>
            <div className="text-right">
              <div className="font-bold text-lg">{formatCurrency(gesamtManuell)}</div>
              <div className="text-xs text-gray-500">{gesamtProzent.toFixed(2)}% vom Kaufpreis</div>
            </div>
          </div>
        </div>
      )}
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

          <div className="max-h-64 overflow-y-auto">
            {ansicht === 'jahr' ? (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="text-left p-1">Jahr</th>
                    <th className="text-right p-1">Miete</th>
                    <th className="text-right p-1">NK</th>
                    <th className="text-right p-1">Inst.</th>
                    <th className="text-right p-1">Verw.</th>
                  </tr>
                </thead>
                <tbody>
                  {jahre.map(jahr => (
                    <tr key={jahr} className={jahr === aktuellesJahr ? 'bg-blue-50' : ''}>
                      <td className="p-1 font-semibold">{jahr}</td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={getWertFuerZeitraum(jahr, null, 'kaltmiete')}
                          onChange={(e) => setWertFuerZeitraum(jahr, null, 'kaltmiete', e.target.value)}
                          className="w-16 px-1 py-0.5 border rounded text-right"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={getWertFuerZeitraum(jahr, null, 'nebenkosten')}
                          onChange={(e) => setWertFuerZeitraum(jahr, null, 'nebenkosten', e.target.value)}
                          className="w-14 px-1 py-0.5 border rounded text-right"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={getWertFuerZeitraum(jahr, null, 'instandhaltung')}
                          onChange={(e) => setWertFuerZeitraum(jahr, null, 'instandhaltung', e.target.value)}
                          className="w-14 px-1 py-0.5 border rounded text-right"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={getWertFuerZeitraum(jahr, null, 'verwaltung')}
                          onChange={(e) => setWertFuerZeitraum(jahr, null, 'verwaltung', e.target.value)}
                          className="w-14 px-1 py-0.5 border rounded text-right"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>
                <select
                  className="w-full mb-2 p-1 border rounded text-sm"
                  onChange={(e) => document.getElementById(`monat-${e.target.value}`)?.scrollIntoView()}
                >
                  {jahre.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                {jahre.map(jahr => (
                  <div key={jahr} id={`monat-${jahr}`} className="mb-4">
                    <div className="font-semibold text-sm bg-gray-200 p-1 rounded mb-1">{jahr}</div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left p-1">Mon</th>
                          <th className="text-right p-1">Miete</th>
                          <th className="text-right p-1">NK</th>
                          <th className="text-right p-1">Inst.</th>
                          <th className="text-right p-1">Verw.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monate.map((monat, idx) => (
                          <tr key={`${jahr}-${idx}`}>
                            <td className="p-1">{monat}</td>
                            <td className="p-1">
                              <input
                                type="number"
                                value={getWertFuerZeitraum(jahr, idx, 'kaltmiete')}
                                onChange={(e) => setWertFuerZeitraum(jahr, idx, 'kaltmiete', e.target.value)}
                                className="w-16 px-1 py-0.5 border rounded text-right"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                value={getWertFuerZeitraum(jahr, idx, 'nebenkosten')}
                                onChange={(e) => setWertFuerZeitraum(jahr, idx, 'nebenkosten', e.target.value)}
                                className="w-14 px-1 py-0.5 border rounded text-right"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                value={getWertFuerZeitraum(jahr, idx, 'instandhaltung')}
                                onChange={(e) => setWertFuerZeitraum(jahr, idx, 'instandhaltung', e.target.value)}
                                className="w-14 px-1 py-0.5 border rounded text-right"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                value={getWertFuerZeitraum(jahr, idx, 'verwaltung')}
                                onChange={(e) => setWertFuerZeitraum(jahr, idx, 'verwaltung', e.target.value)}
                                className="w-14 px-1 py-0.5 border rounded text-right"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Alle Werte in € pro Monat</p>
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
      const jahresKosten = (params.nebenkosten + params.instandhaltung + params.verwaltung) * 12;
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

  const monatsDaten = {
    einnahmen: params.kaltmiete,
    nebenkosten: params.nebenkosten,
    instandhaltung: params.instandhaltung,
    verwaltung: params.verwaltung,
    kreditrate: ergebnis.monatlicheRate,
    cashflow: ergebnis.cashflowMonatlich
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
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-red-600">- Kreditrate</span>
              <span className="font-semibold text-red-600">{formatCurrency(monatsDaten.kreditrate)}</span>
            </div>
            <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${monatsDaten.cashflow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className="font-semibold">= Cashflow/Monat</span>
              <span className={`text-xl font-bold ${monatsDaten.cashflow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {monatsDaten.cashflow >= 0 ? '+' : ''}{formatCurrency(monatsDaten.cashflow)}
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Jährlicher Cashflow: {formatCurrency(monatsDaten.cashflow * 12)}
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

// Steuerberechnung Komponente
const Steuerberechnung = ({ params, ergebnis, immobilie, onUpdateParams }) => {
  const [steuersatz, setSteuersatz] = useState(immobilie.steuersatz || 42);
  const [gebaeudeAnteilProzent, setGebaeudeAnteilProzent] = useState(immobilie.gebaeudeAnteilProzent || 80);
  const [afaSatz, setAfaSatz] = useState(immobilie.afaSatz || 2.0);
  const [showDetails, setShowDetails] = useState(false);

  // Fahrtkosten
  const [fahrtenProMonat, setFahrtenProMonat] = useState(immobilie.fahrtenProMonat || 0);
  const [entfernungKm, setEntfernungKm] = useState(immobilie.entfernungKm || 0);
  const [kmPauschale, setKmPauschale] = useState(immobilie.kmPauschale || 0.30); // 0,30 €/km

  // AfA Berechnung (Abschreibung)
  const gebaeudeAnteil = params.kaufpreis * (gebaeudeAnteilProzent / 100);
  const jahresAfa = gebaeudeAnteil * (afaSatz / 100);

  // Zinsanteil der Kreditrate (im ersten Jahr)
  const fremdkapital = params.kaufpreis + (params.kaufpreis * params.kaufnebenkosten / 100) - params.eigenkapital;
  const jahresZinsen = fremdkapital * (params.zinssatz / 100);

  // Werbungskosten (nur Instandhaltung und Verwaltung, Nebenkosten trägt der Mieter)
  const jahresWerbungskosten = (params.instandhaltung + params.verwaltung) * 12;

  // Fahrtkosten berechnen (Hin- und Rückfahrt)
  const jahresFahrtkosten = fahrtenProMonat * 12 * entfernungKm * 2 * kmPauschale;

  // Zu versteuernde Mieteinnahmen
  const jahresMiete = params.kaltmiete * 12;

  // Absetzbare Kosten
  const absetzbareKosten = jahresAfa + jahresZinsen + jahresWerbungskosten + jahresFahrtkosten;

  // Zu versteuernder Gewinn/Verlust
  const zuVersteuern = jahresMiete - absetzbareKosten;

  // Steuerersparnis/Steuerlast
  const steuerEffekt = zuVersteuern * (steuersatz / 100);

  // AfA-Jahre berechnen
  const afaJahre = afaSatz > 0 ? Math.round(100 / afaSatz) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">📋 Steuerberechnung</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showDetails ? 'Weniger' : 'Details'}
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">Persönlicher Steuersatz</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="45"
            value={steuersatz}
            onChange={(e) => setSteuersatz(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right font-semibold">{steuersatz}%</span>
        </div>
      </div>

      {/* AfA Einstellungen */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">AfA-Einstellungen</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Gebäudeanteil</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={gebaeudeAnteilProzent}
                onChange={(e) => setGebaeudeAnteilProzent(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border rounded text-sm text-right"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">= {formatCurrency(gebaeudeAnteil)}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">AfA-Satz</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={afaSatz}
                onChange={(e) => setAfaSatz(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border rounded text-sm text-right"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{afaJahre} Jahre linear</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
          💡 Standard: 2% für Gebäude ab 1925 (50 Jahre), 2,5% für Gebäude vor 1925 (40 Jahre)
        </div>
      </div>

      {/* Fahrtkosten */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">🚗 Fahrtkosten</h4>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fahrten/Monat</label>
            <input
              type="number"
              min="0"
              max="30"
              value={fahrtenProMonat}
              onChange={(e) => setFahrtenProMonat(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 border rounded text-sm text-right"
              placeholder="z.B. 2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Entfernung</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={entfernungKm}
                onChange={(e) => setEntfernungKm(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-sm text-right"
                placeholder="km"
              />
              <span className="text-xs text-gray-500">km</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">€/km</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={kmPauschale}
              onChange={(e) => setKmPauschale(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 border rounded text-sm text-right"
            />
          </div>
        </div>
        {jahresFahrtkosten > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            = {fahrtenProMonat} × 12 × {entfernungKm} km × 2 (Hin+Rück) × {kmPauschale.toFixed(2)} € = <span className="font-semibold">{formatCurrency(jahresFahrtkosten)}/Jahr</span>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="space-y-2 mb-4 text-sm border-t pt-3">
          <div className="flex justify-between">
            <span className="text-green-600">+ Mieteinnahmen</span>
            <span className="text-green-600">{formatCurrency(jahresMiete)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>- AfA ({afaSatz}% von {formatCurrency(gebaeudeAnteil)})</span>
            <span>{formatCurrency(jahresAfa)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>- Schuldzinsen</span>
            <span>{formatCurrency(jahresZinsen)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>- Werbungskosten (Inst. + Verw.)</span>
            <span>{formatCurrency(jahresWerbungskosten)}</span>
          </div>
          {jahresFahrtkosten > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>- Fahrtkosten</span>
              <span>{formatCurrency(jahresFahrtkosten)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>= Zu versteuern</span>
            <span className={zuVersteuern >= 0 ? 'text-gray-800' : 'text-green-600'}>
              {formatCurrency(zuVersteuern)}
            </span>
          </div>
        </div>
      )}

      <div className={`p-3 rounded-lg ${steuerEffekt > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
        <div className="flex justify-between items-center">
          <span className="font-semibold">{steuerEffekt > 0 ? 'Steuerlast' : 'Steuerersparnis'}/Jahr</span>
          <span className={`text-xl font-bold ${steuerEffekt > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {steuerEffekt > 0 ? '-' : '+'}{formatCurrency(Math.abs(steuerEffekt))}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {steuerEffekt > 0
            ? `Sie zahlen ca. ${formatCurrency(steuerEffekt / 12)}/Monat Steuern auf die Mieteinnahmen`
            : `Sie sparen ca. ${formatCurrency(Math.abs(steuerEffekt) / 12)}/Monat durch Verlustverrechnung`
          }
        </div>
      </div>

      <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
        ⚠️ Vereinfachte Berechnung. Konsultieren Sie einen Steuerberater für genaue Werte.
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
    kategorie: 'reparatur'
  });

  const kategorien = {
    'reparatur': { label: 'Reparatur', color: 'orange', icon: '🔧' },
    'modernisierung': { label: 'Modernisierung', color: 'blue', icon: '🏠' },
    'instandhaltung': { label: 'Instandhaltung', color: 'gray', icon: '🔨' },
    'ausstattung': { label: 'Ausstattung', color: 'purple', icon: '🛋️' },
    'energie': { label: 'Energetisch', color: 'green', icon: '🌱' }
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
      kategorie: 'reparatur'
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

// Immobilien-Detail Komponente
const ImmobilienDetail = ({ immobilie, onClose, onSave }) => {
  const initialWert = immobilie.geschaetzterWert || immobilie.kaufpreis;
  const initialQmPreis = immobilie.wohnflaeche > 0 ? Math.round(initialWert / immobilie.wohnflaeche) : 0;

  const [params, setParams] = useState({
    kaufpreis: immobilie.kaufpreis,
    eigenkapital: immobilie.eigenkapital,
    zinssatz: immobilie.zinssatz ?? 4.0,
    tilgung: immobilie.tilgung ?? 2.0,
    laufzeit: immobilie.laufzeit ?? 25,
    kaltmiete: immobilie.kaltmiete,
    nebenkosten: immobilie.nebenkosten ?? 200,
    instandhaltung: immobilie.instandhaltung ?? 100,
    verwaltung: immobilie.verwaltung ?? 30,
    wertsteigerung: immobilie.wertsteigerung ?? 2.0,
    mietsteigerung: immobilie.mietsteigerung ?? 1.5,
    kaufnebenkosten: immobilie.kaufnebenkosten ?? 10,
    geschaetzterWert: initialWert,
    mietModus: immobilie.mietModus || 'automatisch',
    mietHistorie: immobilie.mietHistorie || {},
    steuersatz: immobilie.steuersatz || 42,
    investitionen: immobilie.investitionen || []
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [qmPreis, setQmPreis] = useState(initialQmPreis.toString());
  const [activeTab, setActiveTab] = useState('uebersicht'); // 'uebersicht', 'cashflow', 'steuern', 'investitionen'

  const updateParams = (newParams) => {
    setParams(newParams);
    setHasChanges(true);
  };

  const handleQmPreisChange = (value) => {
    setQmPreis(value);
    const numValue = parseFloat(value) || 0;
    if (numValue > 0 && immobilie.wohnflaeche > 0) {
      const neuerWert = Math.round(numValue * immobilie.wohnflaeche);
      updateParams({...params, geschaetzterWert: neuerWert});
    }
  };

  const handleGesamtwertChange = (value) => {
    const numValue = parseFloat(value) || 0;
    updateParams({...params, geschaetzterWert: numValue});
    if (numValue > 0 && immobilie.wohnflaeche > 0) {
      setQmPreis(Math.round(numValue / immobilie.wohnflaeche).toString());
    }
  };

  const handleSave = () => {
    onSave({ ...immobilie, ...params });
    setHasChanges(false);
  };

  const ergebnis = useMemo(() => berechneRendite(params), [params]);
  const aktuellerWert = params.geschaetzterWert || immobilie.kaufpreis;
  const wertsteigerungSeitKauf = berechneWertsteigerungSeitKauf(immobilie, aktuellerWert);

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
                  <span className="text-sm text-gray-600">{immobilie.wohnflaeche} m²</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Parameter */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Finanzierung</h3>
                <InputSliderCombo label="Kaufpreis" value={params.kaufpreis} onChange={(v) => updateParams({...params, kaufpreis: v})} min={50000} max={2000000} step={10000} unit="€" />
                <InputSliderCombo label="Eigenkapital" value={params.eigenkapital} onChange={(v) => updateParams({...params, eigenkapital: v})} min={0} max={params.kaufpreis} step={5000} unit="€" />
                <InputSliderCombo label="Zinssatz" value={params.zinssatz} onChange={(v) => updateParams({...params, zinssatz: v})} min={0.5} max={8} step={0.1} unit="%" />
                <InputSliderCombo label="Tilgung" value={params.tilgung} onChange={(v) => updateParams({...params, tilgung: v})} min={1} max={5} step={0.5} unit="%" />
                <InputSliderCombo label="Laufzeit" value={params.laufzeit} onChange={(v) => updateParams({...params, laufzeit: v})} min={5} max={35} step={1} unit="J" />
              </div>

              <KaufnebenkostenManager
                params={params}
                updateParams={updateParams}
                kaufpreis={params.kaufpreis}
              />

              <MietKostenManager
                params={params}
                updateParams={updateParams}
                immobilie={immobilie}
                hasChanges={hasChanges}
                setHasChanges={setHasChanges}
              />

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Prognose</h3>
                <InputSliderCombo label="Wertsteigerung p.a." value={params.wertsteigerung} onChange={(v) => updateParams({...params, wertsteigerung: v})} min={0} max={5} step={0.1} unit="%" />
              </div>
            </div>

            {/* Ergebnisse & Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Renditekennzahlen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4">
                  {[
                    { id: 'uebersicht', label: '📊 Übersicht', },
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
                <>
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
                </>
              )}

              {activeTab === 'cashflow' && (
                <CashflowUebersicht
                  params={params}
                  ergebnis={ergebnis}
                  immobilie={immobilie}
                  investitionen={params.investitionen}
                />
              )}

              {activeTab === 'steuern' && (
                <Steuerberechnung
                  params={params}
                  ergebnis={ergebnis}
                  immobilie={immobilie}
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
      </div>
    </div>
  );
};

// Haupt-App Komponente
function App() {
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('immobilien-portfolio');
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedImmobilie, setSelectedImmobilie] = useState(null);
  const [editImmobilie, setEditImmobilie] = useState(null);

  useEffect(() => {
    localStorage.setItem('immobilien-portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const handleSave = (data) => {
    if (editImmobilie) {
      setPortfolio(prev => prev.map(i => i.id === editImmobilie.id ? { ...data, id: i.id } : i));
      setEditImmobilie(null);
    } else {
      setPortfolio(prev => [...prev, { ...data, id: Date.now() }]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (confirm('Möchten Sie diese Immobilie wirklich löschen?')) {
      setPortfolio(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            🏠 Immobilien Portfolio & Leverage Rechner
          </h1>
          <p className="mt-2 text-blue-100">Rendite • Cashflow • Wertentwicklung • Portfolio</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <PortfolioOverview portfolio={portfolio} />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Meine Immobilien</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span> Neue Immobilie
          </button>
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

      {selectedImmobilie && (
        <ImmobilienDetail
          immobilie={selectedImmobilie}
          onClose={() => setSelectedImmobilie(null)}
          onSave={(data) => {
            setPortfolio(prev => prev.map(i => i.id === selectedImmobilie.id ? { ...data, id: i.id } : i));
            setSelectedImmobilie(data);
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
