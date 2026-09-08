/* =====================================================================
   BANQUE DE MOTS — fichier de données, modifiable librement
   =====================================================================
   Ce fichier ne contient que des données. Il est chargé avant le reste
   de l'application et expose l'objet global WORDS.

   1. SERIES     : un objet par univers (anime). Ajoutez un duo avec
                   ["Nom A","Nom B"]. Pour créer une nouvelle série,
                   copiez un bloc entier et changez id, label et tint.
   2. CROSSOVER  : duos de personnages qui se ressemblent mais viennent
                   d'œuvres différentes. Format :
                   ["Nom A","Série A","Nom B","Série B"]
   3. GENERAL    : duos de mots français courants, format
                   ["Mot A","Mot B", niveau] où niveau vaut
                   1 (facile), 2 (intermédiaire) ou 3 (hardcore).
                   Ce groupe compte plusieurs centaines de paires.
   4. THEMES     : catégories hors manga (jeux vidéo, football, rap,
                   cinéma…), même structure que SERIES.
   5. IMAGES     : portraits facultatifs, voir plus bas.
   ===================================================================== */
(function(global){
  "use strict";

  var SERIES = [
    {
      id:"one-piece", label:"One Piece", tint:"#D4553A",
      pairs:[
        ["Luffy","Ace"],["Zoro","Sanji"],["Nami","Robin"],["Usopp","Franky"],
        ["Chopper","Brook"],["Shanks","Barbe Blanche"],["Barbe Noire","Kaido"],
        ["Doflamingo","Crocodile"],["Akainu","Aokiji"],["Law","Kid"],
        ["Sabo","Ace"],["Garp","Sengoku"],["Mihawk","Baggy"],
        ["Boa Hancock","Nami"],["Big Mom","Kaido"],["Katakuri","Marco"],
        ["Sanji","Jinbe"],["Jinbe","Franky"],["Robin","Vivi"],["Vivi","Rebecca"],
        ["Perona","Boa Hancock"],["Bartolomeo","Cavendish"],["Bepo","Chopper"],
        ["Rayleigh","Garp"],["Gold Roger","Barbe Blanche"],["Kizaru","Fujitora"],
        ["Smoker","Tashigi"],["Coby","Helmeppo"],["Enel","Crocodile"],
        ["Arlong","Kuro"],["Baggy","Alvida"],["Zeff","Sanji"],
        ["Kuma","Ivankov"],["Yamato","Kaido"],["Queen","King"],["King","Jack"],
        ["Oden","Gold Roger"],["Momonosuke","Yamato"],["Brook","Laboon"],
        ["Shirahoshi","Vivi"]
      ]
    },
    {
      id:"hxh", label:"Hunter x Hunter", tint:"#4E9B6E",
      pairs:[
        ["Gon","Kirua"],["Kurapika","Leorio"],["Hisoka","Illumi"],["Chrollo","Feitan"],
        ["Meruem","Netero"],["Neferpitou","Shaiapouf"],["Ging","Kaito"],["Bisky","Wing"],
        ["Machi","Shizuku"],["Silva","Zeno"],["Alluka","Kalluto"],["Knuckle","Shoot"],
        ["Leorio","Knuckle"],["Netero","Zeno"],["Pariston","Ging"],["Cheadle","Pariston"],
        ["Kaito","Gon"],["Palm","Melody"],["Melody","Bisky"],["Kortopi","Shalnark"],
        ["Nobunaga","Uvogin"],["Uvogin","Phinks"],["Phinks","Feitan"],["Genthru","Chrollo"],
        ["Colt","Ikalgo"],["Menthuthuyoupi","Neferpitou"],["Komugi","Meruem"],
        ["Illumi","Milluki"],["Milluki","Kalluto"],["Zushi","Gon"],["Wing","Zushi"],
        ["Hanzo","Hisoka"],["Pokkle","Ponzu"],["Biscuit","Machi"]
      ]
    },
    {
      id:"7ds", label:"Seven Deadly Sins", tint:"#C7A15A",
      pairs:[
        ["Meliodas","Ban"],["King","Diane"],["Escanor","Estarossa"],["Merlin","Gowther"],
        ["Elizabeth","Elaine"],["Zeldris","Estarossa"],["Hendrickson","Dreyfus"],
        ["Gilthunder","Howzer"],["Arthur","Merlin"],["Hawk","Oslo"],
        ["Meliodas","Zeldris"],["Galand","Monspiet"],
        ["Ban","Elaine"],["Diane","Matrona"],["Escanor","Meliodas"],["Merlin","Escanor"],
        ["Gowther","King"],["Zeldris","Gelda"],["Gelda","Elizabeth"],["Derieri","Monspiet"],
        ["Fraudrin","Galand"],["Grayroad","Melascula"],["Melascula","Derieri"],
        ["Chandler","Cusack"],["Chandler","Zeldris"],["Baltra","Arthur"],
        ["Gilthunder","Margaret"],["Griamore","Gilthunder"],["Jericho","Diane"],
        ["Hawk","Wild"],["Drole","Gloxinia"],["Gloxinia","King"],["Mael","Estarossa"],
        ["Tristan","Arthur"]
      ]
    },
    {
      id:"snk", label:"Shingeki no Kyojin", tint:"#7C8C9E",
      pairs:[
        ["Eren","Mikasa"],["Armin","Jean"],["Levi","Erwin"],["Hansi","Erwin"],
        ["Reiner","Bertholdt"],["Annie","Ymir"],["Historia","Ymir"],["Sasha","Connie"],
        ["Zeke","Eren"],["Falco","Gabi"],["Pieck","Porco"],["Kenny","Grisha"],
        ["Erwin","Pixis"],["Pixis","Shadis"],["Bertholdt","Annie"],["Porco","Marcel"],
        ["Marcel","Bertholdt"],["Gabi","Udo"],["Udo","Zofia"],["Colt","Falco"],
        ["Yelena","Onyankopon"],["Onyankopon","Hansi"],["Floch","Jean"],["Nile","Pixis"],
        ["Kuchel","Kenny"],["Uri","Rod Reiss"],["Rod Reiss","Historia"],["Frieda","Historia"],
        ["Carla","Dina"],["Grisha","Eren"],["Mikasa","Levi"],["Hansi","Moblit"],
        ["Petra","Oluo"],["Oluo","Gunther"],["Eld","Gunther"]
      ]
    },
    {
      id:"death-note", label:"Death Note", tint:"#9B7BC4",
      pairs:[
        ["Light","L"],["Near","Mello"],["Ryuk","Rem"],["Misa","Takada"],
        ["Matsuda","Aizawa"],["Soichiro Yagami","Watari"],["Mikami","Higuchi"],
        ["Naomi Misora","Raye Penber"],["L","Near"],["Light","Mikami"],
        ["Light","Near"],["Misa","Sayu"],["Sayu","Takada"],["Watari","Roger"],
        ["Mello","Matt"],["Matt","Near"],["Aizawa","Mogi"],["Mogi","Ide"],
        ["Ide","Matsuda"],["Ukita","Mogi"],["Rem","Sidoh"],["Sidoh","Ryuk"],
        ["Gelus","Rem"],["Demegawa","Takada"],["Halle Lidner","Naomi Misora"],
        ["Rester","Gevanni"],["Gevanni","Mikami"],["Roi des Shinigami","Ryuk"]
      ]
    },
    {
      id:"dbz", label:"Dragon Ball Z", tint:"#E08A2E",
      pairs:[
        ["Sangoku","Vegeta"],["Gohan","Trunks"],["Piccolo","Dendé"],["Krilin","Yamcha"],
        ["Freezer","Cell"],["Cell","Boo"],["C-17","C-18"],["C-16","C-19"],
        ["Bulma","Chichi"],["Nappa","Raditz"],["Tortue Géniale","Kaio"],
        ["Mr Satan","Videl"],["Capitaine Ginyu","Recoome"],["Tenshinhan","Yamcha"],
        ["Gohan","Goten"],["Goten","Trunks"],["Videl","Chichi"],["Kaio","Kaioshin"],
        ["Kaioshin","Kibito"],["Dabra","Babidi"],["Babidi","Bibidi"],["Vegeta","Nappa"],
        ["Raditz","Turles"],["Cooler","Freezer"],["Zarbon","Dodoria"],["Ginyu","Burter"],
        ["Jeece","Burter"],["Guldo","Recoome"],["Cell","C-16"],["Piccolo","Kami"],
        ["Kami","Mister Popo"],["Yajirobé","Krilin"],["Chaozu","Tenshinhan"],
        ["Uub","Goten"],["Pan","Bra"],["Bra","Marron"],["Dendé","Mister Popo"],
        ["Shenron","Porunga"],["Bardock","Roi Vegeta"]
      ]
    },
    {
      id:"dbs", label:"Dragon Ball Super", tint:"#4F9BD4",
      pairs:[
        ["Beerus","Champa"],["Whis","Vados"],["Goku Black","Zamasu"],["Jiren","Toppo"],
        ["Hit","Cabba"],["Caulifla","Kale"],["Broly","Gogeta"],["Vegeto","Gogeta"],
        ["Zeno","Grand Prêtre"],["Frost","Freezer"],["Kefla","Caulifla"],
        ["Moro","Granolah"],["Ultra Instinct","Super Saiyan Blue"],
        ["Beerus","Quitela"],["Toppo","Dyspo"],["Dyspo","Hit"],["Kale","Ribrianne"],
        ["Zamasu","Gowasu"],["Gowasu","Shin"],["Merus","Jaco"],["Granolah","Gas"],
        ["Gas","Elec"],["Cheelai","Lemo"],["Broly","Paragus"],
        ["Freezer doré","Super Saiyan Rosé"],["Trunks du futur","Mai"],["Mai","Bulma"],
        ["Zeno","Zeno du futur"],["Grand Prêtre","Whis"],["Hit","Jiren"],
        ["Botamo","Magetta"],["Monaka","Mr Satan"]
      ]
    },
    {
      id:"jjk", label:"Jujutsu Kaisen", tint:"#6E8BD0",
      pairs:[
        ["Yuji","Megumi"],["Nobara","Maki"],["Gojo","Nanami"],["Sukuna","Mahito"],
        ["Toji","Choso"],["Yuta","Rika"],["Panda","Inumaki"],["Todo","Mei Mei"],
        ["Kenjaku","Geto"],["Jogo","Hanami"],["Yaga","Gakuganji"],["Higuruma","Hakari"],
        ["Yuji","Nobara"],["Megumi","Yuta"],["Maki","Mai"],["Mai","Toji"],
        ["Inumaki","Nobara"],["Nanami","Ino"],["Ino","Megumi"],["Mechamaru","Miwa"],
        ["Miwa","Momo"],["Momo","Nobara"],["Todo","Yuji"],["Kashimo","Hakari"],
        ["Hakari","Kirara"],["Uraume","Sukuna"],["Jogo","Dagon"],["Dagon","Hanami"],
        ["Mahito","Kenjaku"],["Geto","Gojo"],["Yorozu","Uraume"],["Tengen","Yaga"],
        ["Rika","Sukuna"],["Choso","Eso"]
      ]
    },
    {
      id:"pokemon", label:"Pokémon", tint:"#D8B23A",
      pairs:[
        ["Sacha","Ondine"],["Pierre","Ondine"],["Pikachu","Évoli"],["Salamèche","Carapuce"],
        ["Bulbizarre","Carapuce"],["Dracaufeu","Tortank"],["Mewtwo","Mew"],
        ["Jessie","James"],["Miaouss","Persian"],["Lugia","Ho-Oh"],["Dialga","Palkia"],
        ["Arceus","Giratina"],["Ronflex","Léviator"],["Professeur Chen","Professeur Sorbier"],
        ["Aurore","Flora"],["Serena","Iris"],["Lem","Pierre"],["Sacha","Régis"],
        ["Pikachu","Raichu"],["Salamèche","Reptincel"],["Carapuce","Carabaffe"],
        ["Bulbizarre","Herbizarre"],["Évoli","Aquali"],["Aquali","Pyroli"],
        ["Voltali","Mentali"],["Noctali","Phyllali"],["Ronflex","Rondoudou"],
        ["Magicarpe","Léviator"],["Roucool","Piafabec"],["Rattata","Rattatac"],
        ["Abra","Kadabra"],["Machoc","Racaillou"],["Onix","Steelix"],
        ["Mew","Celebi"],["Celebi","Jirachi"],["Jirachi","Manaphy"],
        ["Rayquaza","Groudon"],["Groudon","Kyogre"],["Zekrom","Reshiram"],
        ["Xerneas","Yveltal"],["Solgaleo","Lunala"],["Zacian","Zamazenta"],
        ["Giovanni","Jessie"],["Cynthia","Peter"],["Poké Ball","Master Ball"]
      ]
    },
    {
      id:"solo-leveling", label:"Solo Leveling", tint:"#5CC0C0",
      pairs:[
        ["Sung Jinwoo","Cha Hae-In"],["Igris","Beru"],["Igris","Tusk"],
        ["Go Gunhee","Baek Yoonho"],["Choi Jong-In","Baek Yoonho"],
        ["Sung Jinwoo","Yoo Jinho"],["Thomas Andre","Liu Zhigang"],
        ["Antares","Ashborn"],["Woo Jinchul","Go Gunhee"],["Sung Il-Hwan","Sung Jinwoo"],
        ["Cha Hae-In","Choi Jong-In"],["Baek Yoonho","Ma Dongwook"],
        ["Ma Dongwook","Yoo Jinho"],["Woo Jinchul","Choi Jong-In"],
        ["Hwang Dongsoo","Hwang Dongsuk"],["Yoo Myunghan","Go Gunhee"],
        ["Sung Jinah","Park Kyunghye"],["Igris","Iron"],["Iron","Tusk"],
        ["Beru","Kaisel"],["Kaisel","Kamish"],["Kamish","Antares"],
        ["Ashborn","Legia"],["Thomas Andre","Christopher Reed"],
        ["Liu Zhigang","Goto Ryuji"],["Goto Ryuji","Thomas Andre"],
        ["Esil Radiru","Cha Hae-In"],["Bellion","Beru"],["Querehsha","Antares"],
        ["Yuri Orlov","Liu Zhigang"]
      ]
    },
    {
      id:"mha", label:"My Hero Academia", tint:"#5FA86B",
      pairs:[
        ["Deku","Bakugo"],["All Might","Endeavor"],["Todoroki","Bakugo"],
        ["Uraraka","Tsuyu"],["Iida","Kirishima"],["Kirishima","Kaminari"],
        ["Momo","Jiro"],["Shigaraki","Dabi"],["Dabi","Toga"],
        ["All For One","Shigaraki"],["Aizawa","Present Mic"],["Mirio","Amajiki"],
        ["Overhaul","Stain"],
        ["Deku","Mirio"],["All Might","Nighteye"],["Nighteye","Aizawa"],
        ["Hawks","Endeavor"],["Best Jeanist","Hawks"],["Midnight","Mt Lady"],
        ["Tokoyami","Shoji"],["Shoji","Sato"],["Mineta","Kaminari"],
        ["Sero","Ojiro"],["Ashido","Hagakure"],["Hagakure","Koda"],
        ["Aoyama","Sero"],["Shinso","Monoma"],["Monoma","Kendo"],
        ["Kendo","Tetsutetsu"],["Tetsutetsu","Kirishima"],
        ["Gentle Criminal","La Brava"],["Twice","Toga"],["Spinner","Mustard"],
        ["Compress","Twice"],["Re-Destro","Shigaraki"],["Lady Nagant","Hawks"],
        ["Star and Stripe","All Might"],["Eri","Kota"],["Bakugo","Kirishima"],
        ["Uraraka","Toga"]
      ]
    },
    {
      id:"naruto", label:"Naruto", tint:"#E2803C",
      pairs:[
        ["Naruto","Sasuke"],["Sakura","Ino"],["Kakashi","Yamato"],["Jiraiya","Orochimaru"],
        ["Tsunade","Jiraiya"],["Itachi","Shisui"],["Gaara","Kankuro"],["Temari","Kankuro"],
        ["Rock Lee","Neji"],["Neji","Hinata"],["Hinata","Sakura"],["Shikamaru","Choji"],
        ["Kiba","Shino"],["Minato","Kushina"],["Hashirama","Madara"],["Madara","Obito"],
        ["Obito","Kakashi"],["Pain","Konan"],["Deidara","Sasori"],["Hidan","Kakuzu"],
        ["Kisame","Itachi"],["Zetsu","Tobi"],["Kabuto","Orochimaru"],["Killer Bee","Naruto"],
        ["Boruto","Sarada"],["Sarada","Mitsuki"],["Danzo","Hiruzen"],["Hiruzen","Tsunade"],
        ["Kurama","Gyuki"],["Asuma","Kurenai"]
      ]
    },
    {
      id:"bleach", label:"Bleach", tint:"#B85C7A",
      pairs:[
        ["Ichigo","Rukia"],["Rukia","Renji"],["Renji","Byakuya"],["Byakuya","Toshiro"],
        ["Toshiro","Rangiku"],["Kenpachi","Yachiru"],["Mayuri","Nemu"],["Urahara","Yoruichi"],
        ["Yoruichi","Soi Fon"],["Aizen","Gin"],["Gin","Tosen"],["Tosen","Komamura"],
        ["Ulquiorra","Grimmjow"],["Grimmjow","Nnoitra"],["Nnoitra","Szayel"],
        ["Halibel","Starrk"],["Starrk","Barragan"],["Orihime","Tatsuki"],["Chad","Uryu"],
        ["Uryu","Ryuken"],["Isshin","Masaki"],["Yamamoto","Kyoraku"],["Kyoraku","Ukitake"],
        ["Nelliel","Halibel"],["Yhwach","Aizen"],["Jugram","Bazz-B"],["Ichigo","Kaien"]
      ]
    },
    {
      id:"demon-slayer", label:"Demon Slayer", tint:"#6FA8C7",
      pairs:[
        ["Tanjiro","Nezuko"],["Zenitsu","Inosuke"],["Giyu","Shinobu"],["Shinobu","Kanao"],
        ["Kanao","Aoi"],["Rengoku","Tengen"],["Tengen","Muichiro"],["Muichiro","Gyomei"],
        ["Gyomei","Sanemi"],["Sanemi","Genya"],["Genya","Tanjiro"],["Obanai","Mitsuri"],
        ["Mitsuri","Shinobu"],["Muzan","Kokushibo"],["Kokushibo","Yoriichi"],
        ["Akaza","Doma"],["Doma","Gyutaro"],["Gyutaro","Daki"],["Daki","Nezuko"],
        ["Enmu","Rui"],["Rui","Akaza"],["Urokodaki","Shinjuro"],["Kagaya","Muzan"],
        ["Yushiro","Tamayo"],["Tamayo","Shinobu"],["Susamaru","Yahaba"],["Sabito","Makomo"]
      ]
    },
    {
      id:"chainsaw-man", label:"Chainsaw Man", tint:"#C25B4E",
      pairs:[
        ["Denji","Power"],["Power","Aki"],["Aki","Himeno"],["Himeno","Kobeni"],
        ["Kobeni","Arai"],["Makima","Kishibe"],["Kishibe","Quanxi"],["Quanxi","Katana Man"],
        ["Reze","Makima"],["Denji","Reze"],["Pochita","Power"],["Angel","Aki"],
        ["Beam","Pochita"],["Sawatari","Kobeni"],["Yoshida","Denji"],["Asa","Yoru"],
        ["Yoru","Makima"],["Nayuta","Makima"],["Fami","Yoru"],["Barem","Kishibe"],
        ["Diable Tronçonneuse","Diable Arme à Feu"],["Diable Ténèbres","Diable Enfer"],
        ["Diable Éternité","Diable Zombie"],["Hirokazu","Aki"]
      ]
    },
    {
      id:"fma", label:"Fullmetal Alchemist", tint:"#C99A4E",
      pairs:[
        ["Edward Elric","Alphonse Elric"],["Roy Mustang","Riza Hawkeye"],["Riza Hawkeye","Rebecca"],
        ["Winry","Riza Hawkeye"],["Envy","Lust"],["Lust","Gluttony"],["Gluttony","Sloth"],
        ["Sloth","Pride"],["Pride","Wrath"],["Wrath","Greed"],["Greed","Ling"],
        ["Ling","Lan Fan"],["Lan Fan","Fu"],["Scar","Kimblee"],["Kimblee","Roy Mustang"],
        ["Hughes","Roy Mustang"],["Armstrong","Olivier"],["Olivier","Buccaneer"],
        ["Hohenheim","Trisha"],["Père","Hohenheim"],["Izumi","Sig"],["Marcoh","Knox"],
        ["Bradley","Roy Mustang"],["Alphonse Elric","Ling"],["Mei Chan","Lan Fan"],
        ["Xiao Mei","Den"]
      ]
    },
    {
      id:"opm", label:"One Punch Man", tint:"#D9C24E",
      pairs:[
        ["Saitama","Genos"],["Genos","Bang"],["Bang","Bomb"],["King","Saitama"],
        ["Tatsumaki","Fubuki"],["Fubuki","Psykos"],["Psykos","Orochi"],["Orochi","Garou"],
        ["Garou","Bang"],["Boros","Saitama"],["Metal Bat","Puri Puri Prisoner"],
        ["Puri Puri Prisoner","Atomic Samurai"],["Atomic Samurai","Metal Knight"],
        ["Metal Knight","Drive Knight"],["Child Emperor","Zombieman"],["Zombieman","Pig God"],
        ["Pig God","Superalloy"],["Mumen Rider","Saitama"],["Sonic","Flashy Flash"],
        ["Flashy Flash","Atomic Samurai"],["Roi des Profondeurs","Boros"],
        ["Vaccine Man","Mosquito Girl"],["Amai Mask","King"],["Blast","Tatsumaki"],
        ["Gouketsu","Garou"]
      ]
    },
    {
      id:"fairy-tail", label:"Fairy Tail", tint:"#B67ACB",
      pairs:[
        ["Natsu","Gray"],["Gray","Gajeel"],["Gajeel","Laxus"],["Laxus","Makarov"],
        ["Erza","Mirajane"],["Mirajane","Lisanna"],["Lisanna","Elfman"],["Lucy","Levy"],
        ["Levy","Wendy"],["Wendy","Chelia"],["Happy","Carla"],["Carla","Panther Lily"],
        ["Juvia","Gray"],["Jellal","Erza"],["Zeref","Mavis"],["Mavis","Makarov"],
        ["Acnologia","Zeref"],["Sting","Rogue"],["Rogue","Gajeel"],["Cobra","Midnight"],
        ["Ultear","Meredy"],["Gildarts","Natsu"],["Ivan","Laxus"],["Kagura","Erza"]
      ]
    },
    {
      id:"blue-lock", label:"Blue Lock", tint:"#4E7FD4",
      pairs:[
        ["Isagi","Bachira"],["Bachira","Chigiri"],["Chigiri","Kunigami"],["Kunigami","Nagi"],
        ["Nagi","Reo"],["Reo","Isagi"],["Rin","Sae"],["Sae","Isagi"],["Barou","Aryu"],
        ["Aryu","Otoya"],["Karasu","Otoya"],["Hiori","Isagi"],["Kaiser","Ness"],
        ["Ness","Hiori"],["Lorenzo","Snuffy"],["Snuffy","Loki"],["Loki","Charles"],
        ["Charles","Kaiser"],["Ego","Anri"],["Anri","Teieri"],["Gagamaru","Niko"],
        ["Niko","Yukimiya"],["Yukimiya","Kurona"],["Kurona","Zantetsu"]
      ]
    }
  ];

  var CROSSOVER = [
    ["Sangoku","Dragon Ball Z","Luffy","One Piece"],
    ["Luffy","One Piece","Meliodas","Seven Deadly Sins"],
    ["Sacha","Pokémon","Luffy","One Piece"],
    ["Deku","My Hero Academia","Yuji","Jujutsu Kaisen"],
    ["Gon","Hunter x Hunter","Yuji","Jujutsu Kaisen"],
    ["Deku","My Hero Academia","Sung Jinwoo","Solo Leveling"],
    ["Vegeta","Dragon Ball Z","Bakugo","My Hero Academia"],
    ["Bakugo","My Hero Academia","Zoro","One Piece"],
    ["Levi","Shingeki no Kyojin","Zoro","One Piece"],
    ["Igris","Solo Leveling","Levi","Shingeki no Kyojin"],
    ["Mikasa","Shingeki no Kyojin","Cha Hae-In","Solo Leveling"],
    ["Maki","Jujutsu Kaisen","Mikasa","Shingeki no Kyojin"],
    ["Megumi","Jujutsu Kaisen","Sung Jinwoo","Solo Leveling"],
    ["Beru","Solo Leveling","Meruem","Hunter x Hunter"],
    ["Antares","Solo Leveling","Kaido","One Piece"],
    ["Gojo","Jujutsu Kaisen","All Might","My Hero Academia"],
    ["Whis","Dragon Ball Super","Netero","Hunter x Hunter"],
    ["Netero","Hunter x Hunter","Tortue Géniale","Dragon Ball Z"],
    ["Piccolo","Dragon Ball Z","Aizawa","My Hero Academia"],
    ["Nanami","Jujutsu Kaisen","Aizawa","My Hero Academia"],
    ["Escanor","Seven Deadly Sins","All Might","My Hero Academia"],
    ["Jiren","Dragon Ball Super","Escanor","Seven Deadly Sins"],
    ["Sukuna","Jujutsu Kaisen","Freezer","Dragon Ball Z"],
    ["Boo","Dragon Ball Z","Mahito","Jujutsu Kaisen"],
    ["Mewtwo","Pokémon","Cell","Dragon Ball Z"],
    ["Arceus","Pokémon","Zeno","Dragon Ball Super"],
    ["Ryuk","Death Note","Beerus","Dragon Ball Super"],
    ["Light","Death Note","Kenjaku","Jujutsu Kaisen"],
    ["Light","Death Note","Eren","Shingeki no Kyojin"],
    ["Zamasu","Dragon Ball Super","Light","Death Note"],
    ["L","Death Note","Kurapika","Hunter x Hunter"],
    ["Kurapika","Hunter x Hunter","Eren","Shingeki no Kyojin"],
    ["Shigaraki","My Hero Academia","Eren","Shingeki no Kyojin"],
    ["Kirua","Hunter x Hunter","Todoroki","My Hero Academia"],
    ["Hisoka","Hunter x Hunter","Toga","My Hero Academia"],
    ["Illumi","Hunter x Hunter","Toji","Jujutsu Kaisen"],
    ["Chopper","One Piece","Pikachu","Pokémon"],
    ["Pikachu","Pokémon","Hawk","Seven Deadly Sins"],
    ["Miaouss","Pokémon","Chopper","One Piece"],
    ["Dracaufeu","Pokémon","Marco","One Piece"],
    ["Krilin","Dragon Ball Z","Usopp","One Piece"],
    ["Bulma","Dragon Ball Z","Nami","One Piece"],
    ["Merlin","Seven Deadly Sins","Momo","My Hero Academia"],
    ["Jessie","Pokémon","Baggy","One Piece"],
    ["Ban","Seven Deadly Sins","Zoro","One Piece"],
    ["Thomas Andre","Solo Leveling","Jiren","Dragon Ball Super"],
    ["Gohan","Dragon Ball Z","Megumi","Jujutsu Kaisen"],
    ["Trunks","Dragon Ball Z","Yuta","Jujutsu Kaisen"],
    ["Yuji","Jujutsu Kaisen","Sung Jinwoo","Solo Leveling"],
    ["Gon","Hunter x Hunter","Sacha","Pokémon"],
    ["Kirua","Hunter x Hunter","Megumi","Jujutsu Kaisen"],
    ["Todoroki","My Hero Academia","Zeldris","Seven Deadly Sins"],
    ["Gojo","Jujutsu Kaisen","Whis","Dragon Ball Super"],
    ["Meliodas","Seven Deadly Sins","Sangoku","Dragon Ball Z"],
    ["Ban","Seven Deadly Sins","Kid","One Piece"],
    ["King","Seven Deadly Sins","Tokoyami","My Hero Academia"],
    ["Diane","Seven Deadly Sins","Mt Lady","My Hero Academia"],
    ["Elizabeth","Seven Deadly Sins","Historia","Shingeki no Kyojin"],
    ["Hawk","Seven Deadly Sins","Miaouss","Pokémon"],
    ["Beerus","Dragon Ball Super","Antares","Solo Leveling"],
    ["Vados","Dragon Ball Super","Merlin","Seven Deadly Sins"],
    ["Zeno","Dragon Ball Super","Eri","My Hero Academia"],
    ["Hit","Dragon Ball Super","Toji","Jujutsu Kaisen"],
    ["Hit","Dragon Ball Super","Illumi","Hunter x Hunter"],
    ["Broly","Dragon Ball Super","Kaido","One Piece"],
    ["Freezer","Dragon Ball Z","Doflamingo","One Piece"],
    ["Cell","Dragon Ball Z","Kenjaku","Jujutsu Kaisen"],
    ["C-18","Dragon Ball Z","Annie","Shingeki no Kyojin"],
    ["Krilin","Dragon Ball Z","Leorio","Hunter x Hunter"],
    ["Bulma","Dragon Ball Z","Momo","My Hero Academia"],
    ["Piccolo","Dragon Ball Z","Nanami","Jujutsu Kaisen"],
    ["Gohan","Dragon Ball Z","Deku","My Hero Academia"],
    ["Vegeta","Dragon Ball Z","Endeavor","My Hero Academia"],
    ["Sangoku","Dragon Ball Z","All Might","My Hero Academia"],
    ["Mr Satan","Dragon Ball Z","Baggy","One Piece"],
    ["Sanji","One Piece","Leorio","Hunter x Hunter"],
    ["Robin","One Piece","Merlin","Seven Deadly Sins"],
    ["Brook","One Piece","Panda","Jujutsu Kaisen"],
    ["Franky","One Piece","C-16","Dragon Ball Z"],
    ["Shanks","One Piece","All Might","My Hero Academia"],
    ["Barbe Blanche","One Piece","Ashborn","Solo Leveling"],
    ["Garp","One Piece","Go Gunhee","Solo Leveling"],
    ["Law","One Piece","Kurapika","Hunter x Hunter"],
    ["Boa Hancock","One Piece","Midnight","My Hero Academia"],
    ["Nami","One Piece","Ondine","Pokémon"],
    ["Sanji","One Piece","Pierre","Pokémon"],
    ["Sasha","Shingeki no Kyojin","Luffy","One Piece"],
    ["Armin","Shingeki no Kyojin","L","Death Note"],
    ["Erwin","Shingeki no Kyojin","Go Gunhee","Solo Leveling"],
    ["Hansi","Shingeki no Kyojin","Bulma","Dragon Ball Z"],
    ["Reiner","Shingeki no Kyojin","Choso","Jujutsu Kaisen"],
    ["Zeke","Shingeki no Kyojin","Kenjaku","Jujutsu Kaisen"],
    ["Gabi","Shingeki no Kyojin","Bakugo","My Hero Academia"],
    ["Falco","Shingeki no Kyojin","Deku","My Hero Academia"],
    ["Levi","Shingeki no Kyojin","Hit","Dragon Ball Super"],
    ["Near","Death Note","Gowther","Seven Deadly Sins"],
    ["Ryuk","Death Note","Hisoka","Hunter x Hunter"],
    ["Misa","Death Note","Toga","My Hero Academia"],
    ["Meruem","Hunter x Hunter","Sukuna","Jujutsu Kaisen"],
    ["Chrollo","Hunter x Hunter","Geto","Jujutsu Kaisen"],
    ["Bisky","Hunter x Hunter","Merlin","Seven Deadly Sins"],
    ["Komugi","Hunter x Hunter","Eri","My Hero Academia"],
    ["Kamish","Solo Leveling","Rayquaza","Pokémon"],
    ["Yoo Jinho","Solo Leveling","Usopp","One Piece"],
    ["Thomas Andre","Solo Leveling","All Might","My Hero Academia"],
    ["Cha Hae-In","Solo Leveling","Maki","Jujutsu Kaisen"],
    ["Igris","Solo Leveling","Zoro","One Piece"],
    ["Pikachu","Pokémon","Kaminari","My Hero Academia"],
    ["Dracaufeu","Pokémon","Endeavor","My Hero Academia"],
    ["Tortank","Pokémon","Jinbe","One Piece"],
    ["Lugia","Pokémon","Marco","One Piece"],
    ["Arceus","Pokémon","Ashborn","Solo Leveling"],
    ["Giovanni","Pokémon","All For One","My Hero Academia"],
    ["Sacha","Pokémon","Deku","My Hero Academia"],
    ["Professeur Chen","Pokémon","Tortue Géniale","Dragon Ball Z"],
    ["Mewtwo","Pokémon","Rika","Jujutsu Kaisen"],
    ["Dabi","My Hero Academia","Choso","Jujutsu Kaisen"],
    ["Hawks","My Hero Academia","Marco","One Piece"],
    ["Shigaraki","My Hero Academia","Mahito","Jujutsu Kaisen"],
    ["Uraraka","My Hero Academia","Elizabeth","Seven Deadly Sins"],
    ["Naruto","Naruto","Deku","My Hero Academia"],
    ["Naruto","Naruto","Luffy","One Piece"],
    ["Sasuke","Naruto","Todoroki","My Hero Academia"],
    ["Kakashi","Naruto","Gojo","Jujutsu Kaisen"],
    ["Jiraiya","Naruto","Tortue Géniale","Dragon Ball Z"],
    ["Itachi","Naruto","Zeke","Shingeki no Kyojin"],
    ["Gaara","Naruto","Kirua","Hunter x Hunter"],
    ["Rock Lee","Naruto","Kirishima","My Hero Academia"],
    ["Orochimaru","Naruto","Kenjaku","Jujutsu Kaisen"],
    ["Madara","Naruto","Antares","Solo Leveling"],
    ["Hinata","Naruto","Uraraka","My Hero Academia"],
    ["Ichigo","Bleach","Yuji","Jujutsu Kaisen"],
    ["Rukia","Bleach","Mikasa","Shingeki no Kyojin"],
    ["Kenpachi","Bleach","Zoro","One Piece"],
    ["Byakuya","Bleach","Levi","Shingeki no Kyojin"],
    ["Aizen","Bleach","Light","Death Note"],
    ["Urahara","Bleach","Gojo","Jujutsu Kaisen"],
    ["Toshiro","Bleach","Todoroki","My Hero Academia"],
    ["Grimmjow","Bleach","Bakugo","My Hero Academia"],
    ["Yoruichi","Bleach","Cha Hae-In","Solo Leveling"],
    ["Tanjiro","Demon Slayer","Deku","My Hero Academia"],
    ["Nezuko","Demon Slayer","Eri","My Hero Academia"],
    ["Zenitsu","Demon Slayer","Usopp","One Piece"],
    ["Inosuke","Demon Slayer","Bakugo","My Hero Academia"],
    ["Giyu","Demon Slayer","Levi","Shingeki no Kyojin"],
    ["Rengoku","Demon Slayer","Endeavor","My Hero Academia"],
    ["Muzan","Demon Slayer","Freezer","Dragon Ball Z"],
    ["Shinobu","Demon Slayer","Nobara","Jujutsu Kaisen"],
    ["Denji","Chainsaw Man","Yuji","Jujutsu Kaisen"],
    ["Power","Chainsaw Man","Toga","My Hero Academia"],
    ["Makima","Chainsaw Man","Kenjaku","Jujutsu Kaisen"],
    ["Aki","Chainsaw Man","Nanami","Jujutsu Kaisen"],
    ["Edward Elric","Fullmetal Alchemist","Deku","My Hero Academia"],
    ["Alphonse Elric","Fullmetal Alchemist","Panda","Jujutsu Kaisen"],
    ["Roy Mustang","Fullmetal Alchemist","Endeavor","My Hero Academia"],
    ["Envy","Fullmetal Alchemist","Mahito","Jujutsu Kaisen"],
    ["Saitama","One Punch Man","Escanor","Seven Deadly Sins"],
    ["Saitama","One Punch Man","Sangoku","Dragon Ball Z"],
    ["Genos","One Punch Man","C-16","Dragon Ball Z"],
    ["Garou","One Punch Man","Shigaraki","My Hero Academia"],
    ["Tatsumaki","One Punch Man","Uraraka","My Hero Academia"],
    ["Natsu","Fairy Tail","Luffy","One Piece"],
    ["Erza","Fairy Tail","Mikasa","Shingeki no Kyojin"],
    ["Gray","Fairy Tail","Todoroki","My Hero Academia"],
    ["Lucy","Fairy Tail","Megumi","Jujutsu Kaisen"],
    ["Acnologia","Fairy Tail","Kamish","Solo Leveling"],
    ["Isagi","Blue Lock","Deku","My Hero Academia"],
    ["Rin","Blue Lock","Sasuke","Naruto"],
    ["Kaiser","Blue Lock","Bakugo","My Hero Academia"]
  ];

  function tagged(level, list){
    return list.map(function(p){ return [p[0], p[1], level]; });
  }

  var GENERAL = [].concat(
    tagged(1, [
      ["Chien","Chat"],["Plage","Montagne"],["Soleil","Lune"],["Été","Hiver"],["Jour","Nuit"],["Feu","Eau"],
      ["Ciel","Terre"],["Voiture","Bateau"],["Avion","Train"],["Vélo","Moto"],["Livre","Film"],
      ["Guitare","Piano"],["Pizza","Sushi"],["Café","Bière"],["École","Hôpital"],["Docteur","Policier"],
      ["Roi","Clown"],["Football","Natation"],["Piscine","Forêt"],["Neige","Sable"],["Chaussure","Chapeau"],
      ["Téléphone","Télévision"],["Ordinateur","Réfrigérateur"],["Lion","Souris"],["Éléphant","Fourmi"],
      ["Requin","Papillon"],["Dinosaure","Licorne"],["Fantôme","Robot"],["Sorcière","Astronaute"],
      ["Pirate","Cowboy"],["Vampire","Zombie"],["Noël","Halloween"],["Anniversaire","Mariage"],
      ["Prison","Hôtel"],["Banque","Boulangerie"],["Chocolat","Fromage"],["Pomme","Steak"],["Soupe","Glace"],
      ["Miel","Sel"],["Pluie","Vent"],["Volcan","Océan"],["Désert","Jungle"],["Montre","Marteau"],
      ["Lunettes","Parapluie"],["Ballon","Épée"],["Poupée","Fusée"],["Aspirateur","Guitare"],
      ["Bougie","Radiateur"],["Jardin","Garage"],["Cuisine","Salle de bain"],["Facteur","Pompier"],
      ["Professeur","Chanteur"],["Boulanger","Mécanicien"],["Coiffeur","Jardinier"],["Ferme","Usine"],
      ["Vache","Poisson"],["Poule","Serpent"],["Cheval","Tortue"],["Abeille","Ours"],["Pingouin","Chameau"],
      ["Perroquet","Grenouille"],["Araignée","Dauphin"],["Fleur","Caillou"],["Arbre","Nuage"],
      ["Rivière","Route"],["Pont","Tunnel"],["Église","Stade"],["Musée","Marché"],["Cinéma","Bibliothèque"],
      ["Zoo","Aéroport"],["Valise","Oreiller"],["Couteau","Crayon"],["Savon","Ketchup"],["Miroir","Tapis"],
      ["Porte","Fenêtre"],["Escalier","Ascenseur"],["Clé","Cadenas"],["Trésor","Poubelle"],
      ["Diamant","Charbon"],["Roi","Mendiant"],["Géant","Nain"],["Ange","Démon"],["Héros","Voleur"],
      ["Bébé","Grand-père"],["Mariage","Enterrement"],["Vacances","Examen"],["Pizza","Salade"],
      ["Frites","Carotte"],["Bonbon","Médicament"],["Thé","Soda"],["Lait","Vin"],["Œuf","Pain"],
      ["Riz","Pomme de terre"],["Poivre","Sucre"],["Citron","Banane"],["Champignon","Fraise"],
      ["Carotte","Ananas"],["Pastèque","Noix"],["Barbecue","Micro-ondes"],["Fourchette","Louche"],
      ["Assiette","Casserole"],["Verre","Seau"],["Serviette","Couverture"],["Lit","Chaise"],
      ["Canapé","Bureau"],["Lampe","Ventilateur"],["Rideau","Tapis"],["Balai","Marteau"],["Échelle","Chaise"],
      ["Tente","Maison"],["Igloo","Cabane"],["Château","Grotte"],["Ville","Village"],["Île","Montagne"],
      ["Lac","Cascade"],["Étoile","Planète"],["Fusée","Sous-marin"],["Satellite","Cerf-volant"],
      ["Parachute","Trampoline"],["Ski","Surf"],["Boxe","Échecs"],["Marathon","Sieste"],["Danse","Karaoké"],
      ["Théâtre","Concert"],["Peinture","Photographie"],["Journal","Podcast"],["Radio","Console"],
      ["Clavier","Manette"],["Casque","Micro"],["Batterie","Chargeur"],["Ampoule","Bougie"],
      ["Ciseaux","Colle"],["Gomme","Règle"],["Cartable","Trousse"],["Uniforme","Pyjama"],
      ["Cravate","Casquette"],["Bague","Ceinture"],["Parfum","Dentifrice"],["Rasoir","Peigne"]
    ]),
    tagged(2, [
      ["Café","Thé"],["Métro","Bus"],["Neige","Pluie"],["Football","Rugby"],["Livre","Magazine"],
      ["Miel","Confiture"],["Piscine","Baignoire"],["Château","Palais"],["Montre","Bracelet"],
      ["Fromage","Beurre"],["Avion","Hélicoptère"],["Médecin","Infirmier"],["Bougie","Lampe"],
      ["Sable","Terre"],["Crayon","Stylo"],["Boulangerie","Pâtisserie"],["Ski","Snowboard"],
      ["Théâtre","Cinéma"],["Oreiller","Couverture"],["Casque","Écouteurs"],["Rivière","Canal"],
      ["Nuage","Brouillard"],["Sorcière","Fée"],["Prison","Cage"],["Barbe","Moustache"],
      ["Escalier","Échelle"],["Serveur","Cuisinier"],["Aspirateur","Balai"],["Tatouage","Cicatrice"],
      ["Poker","Belote"],["Robot","Automate"],["Voisin","Colocataire"],["Mariage","Baptême"],
      ["Épée","Couteau"],["Ascenseur","Escalator"],["Train","Tramway"],["Bateau","Sous-marin"],
      ["Camion","Camionnette"],["Taxi","Ambulance"],["Trottinette","Skateboard"],["Rollers","Patins à glace"],
      ["Parapluie","Parasol"],["Chapeau","Casquette"],["Écharpe","Foulard"],["Gant","Moufle"],
      ["Chaussette","Collant"],["Botte","Chausson"],["Ceinture","Bretelles"],["Cravate","Nœud papillon"],
      ["Manteau","Blouson"],["Pyjama","Peignoir"],["Rideau","Store"],["Tapis","Moquette"],
      ["Canapé","Fauteuil"],["Tabouret","Chaise"],["Armoire","Commode"],["Étagère","Placard"],
      ["Lampadaire","Applique"],["Miroir","Fenêtre"],["Porte","Portail"],["Balcon","Terrasse"],
      ["Grenier","Cave"],["Garage","Hangar"],["Cheminée","Radiateur"],["Ventilateur","Climatiseur"],
      ["Four","Micro-ondes"],["Poêle","Casserole"],["Fourchette","Cuillère"],["Assiette","Plateau"],
      ["Verre","Tasse"],["Bouteille","Gourde"],["Bocal","Boîte de conserve"],["Serviette","Nappe"],
      ["Éponge","Chiffon"],["Savon","Gel douche"],["Shampoing","Après-shampoing"],
      ["Dentifrice","Bain de bouche"],["Rasoir","Tondeuse"],["Peigne","Brosse"],["Parfum","Déodorant"],
      ["Pansement","Bandage"],["Sirop","Comprimé"],["Thermomètre","Tensiomètre"],["Dentiste","Orthodontiste"],
      ["Pharmacien","Herboriste"],["Vétérinaire","Éleveur"],["Pompier","Secouriste"],["Policier","Gendarme"],
      ["Juge","Avocat"],["Professeur","Formateur"],["Facteur","Livreur"],["Coiffeur","Barbier"],
      ["Plombier","Électricien"],["Menuisier","Charpentier"],["Peintre","Sculpteur"],
      ["Photographe","Vidéaste"],["Journaliste","Écrivain"],["Chanteur","Rappeur"],
      ["Batteur","Percussionniste"],["Piano","Orgue"],["Flûte","Clarinette"],["Trompette","Saxophone"],
      ["Harpe","Accordéon"],["Chorale","Orchestre"],["Concert","Festival"],["Musée","Galerie"],
      ["Zoo","Aquarium"],["Cirque","Fête foraine"],["Parc d'attractions","Aire de jeux"],
      ["Toboggan","Balançoire"],["Trampoline","Bac à sable"],["Étang","Lac"],["Forêt","Jungle"],
      ["Colline","Montagne"],["Grotte","Tunnel"],["Volcan","Geyser"],["Île","Presqu'île"],["Falaise","Dune"],
      ["Marais","Mangrove"],["Cascade","Fontaine"],["Puits","Citerne"],["Pont","Viaduc"],["Phare","Moulin"],
      ["Église","Cathédrale"],["Temple","Monastère"],["Château fort","Forteresse"],["Tour","Gratte-ciel"],
      ["Stade","Arène"],["Vestiaire","Tribune"],["Arbitre","Entraîneur"],["Marathon","Triathlon"],
      ["Boxe","Judo"],["Escrime","Tir à l'arc"],["Tennis","Badminton"],["Ping-pong","Squash"],
      ["Volley","Handball"],["Basket-ball","Netball"],["Golf","Pétanque"],["Échecs","Dames"],
      ["Sudoku","Mots croisés"],["Carte à jouer","Dé"],["Puzzle","Maquette"],["Console","Ordinateur"],
      ["Souris","Télécommande"],["Écran","Projecteur"],["Enceinte","Micro"],
      ["Radio","Podcast"],["Journal","Affiche"],["Timbre","Autocollant"],["Enveloppe","Colis"],
      ["Clé","Badge"],["Cadenas","Verrou"],["Coffre-fort","Tirelire"],["Portefeuille","Trousse"],
      ["Sac à dos","Valise"],["Passeport","Carte d'identité"],["Billet","Ticket"],["Boussole","GPS"],
      ["Carte routière","Plan de métro"],["Tente","Caravane"],["Hamac","Duvet"],["Lampe torche","Briquet"],
      ["Allumette","Silex"],["Barbecue","Feu de camp"],["Chocolat chaud","Cappuccino"],
      ["Croissant","Pain au chocolat"],["Baguette","Brioche"],["Crêpe","Gaufre"],["Beignet","Churros"],
      ["Glace","Sorbet"],["Yaourt","Fromage blanc"],["Ketchup","Mayonnaise"],["Moutarde","Wasabi"],
      ["Sel","Poivre"],["Vinaigre","Citron"],["Riz","Semoule"],["Pâtes","Nouilles"],["Soupe","Bouillon"],
      ["Salade","Crudités"],["Steak","Escalope"],["Saucisse","Merguez"],["Jambon","Bacon"],["Thon","Saumon"],
      ["Crevette","Langoustine"],["Huître","Moule"],["Pomme","Poire"],["Fraise","Framboise"],
      ["Pastèque","Melon"],["Raisin","Cerise"],["Noix","Noisette"],["Champignon","Truffe"],["Pizza","Quiche"],
      ["Guitare","Violon"],["Sushi","Sashimi"]
    ]),
    tagged(3, [
      ["Canapé","Sofa"],["Vélo","Bicyclette"],["Voiture","Automobile"],["Ordinateur portable","Tablette"],
      ["Téléphone","Smartphone"],["Autoroute","Voie rapide"],["Sentier","Chemin"],["Colline","Butte"],
      ["Ruisseau","Torrent"],["Averse","Ondée"],["Brume","Brouillard"],["Tempête","Ouragan"],
      ["Séisme","Secousse"],["Fauteuil","Chaise longue"],["Coussin","Oreiller"],["Drap","Housse"],
      ["Couette","Édredon"],["Placard","Penderie"],["Étagère","Rayonnage"],["Bureau","Pupitre"],
      ["Tabouret","Pouf"],["Casserole","Faitout"],["Poêle","Sauteuse"],["Louche","Écumoire"],
      ["Saladier","Bol"],["Mug","Tasse"],["Carafe","Pichet"],["Torchon","Chiffon"],["Balai","Serpillière"],
      ["Seau","Bassine"],["Marmite","Cocotte"],["Assiette creuse","Assiette plate"],["Nappe","Set de table"],
      ["Pain de mie","Brioche"],["Baguette","Ficelle"],["Chausson aux pommes","Pain aux raisins"],
      ["Éclair","Religieuse"],["Tarte","Tartelette"],["Flan","Crème brûlée"],
      ["Mousse au chocolat","Panna cotta"],["Sorbet","Glace italienne"],["Sirop","Nectar"],["Jus","Smoothie"],
      ["Soda","Limonade"],["Cidre","Poiré"],["Vin blanc","Vin rosé"],["Bière blonde","Bière blanche"],
      ["Whisky","Bourbon"],["Rhum","Cachaça"],["Espresso","Ristretto"],["Cappuccino","Latte"],
      ["Thé vert","Thé blanc"],["Infusion","Tisane"],["Bouillon","Consommé"],["Potage","Velouté"],
      ["Purée","Écrasé"],["Gratin","Tian"],["Ragoût","Mijoté"],["Steak haché","Boulette"],
      ["Escalope","Paillard"],["Saucisson","Chorizo"],["Pâté","Terrine"],["Rillettes","Mousse de foie"],
      ["Comté","Gruyère"],["Emmental","Beaufort"],["Yaourt","Skyr"],["Fromage blanc","Faisselle"],
      ["Crème fraîche","Mascarpone"],["Beurre","Margarine"],["Huile d'olive","Huile de tournesol"],
      ["Vinaigre balsamique","Vinaigre de vin"],["Sel fin","Gros sel"],["Poivre noir","Poivre blanc"],
      ["Cannelle","Muscade"],["Basilic","Menthe"],["Persil","Coriandre"],["Thym","Romarin"],
      ["Oignon","Échalote"],["Ail","Gingembre"],["Courgette","Concombre"],["Aubergine","Poivron"],
      ["Patate douce","Igname"],["Navet","Rutabaga"],["Épinard","Blette"],["Laitue","Mâche"],
      ["Clémentine","Mandarine"],["Nectarine","Brugnon"],["Prune","Mirabelle"],["Myrtille","Cassis"],
      ["Groseille","Grenade"],["Abricot","Pêche"],["Amande","Noisette"],["Pistache","Cacahuète"],
      ["Lentille","Pois chiche"],["Haricot","Flageolet"],["Blé","Épeautre"],["Avoine","Orge"],
      ["Sarrasin","Millet"],["Veste","Blouson"],["Pull","Sweat"],["Gilet","Cardigan"],["Chemise","Chemisier"],
      ["Jean","Pantalon en toile"],["Short","Bermuda"],["Jupe","Robe"],["Basket","Sneaker"],
      ["Mocassin","Derby"],["Sandale","Nu-pieds"],["Bonnet","Tuque"],["Écharpe","Étole"],
      ["Sac à main","Pochette"],["Bracelet","Gourmette"],["Collier","Chaîne"],["Bague","Chevalière"],
      ["Lunettes de soleil","Lunettes de vue"],["Montre","Chronomètre"],
      ["Téléphone portable","Téléphone fixe"],["Écran","Moniteur"],["Clavier","Pavé numérique"],
      ["Souris","Trackpad"],["Casque","Oreillette"],["Chargeur","Adaptateur"],["Câble","Cordon"],
      ["Routeur","Box internet"],["Clé USB","Disque dur externe"],["Imprimante","Photocopieuse"],
      ["Agrafeuse","Perforatrice"],["Surligneur","Feutre"],["Carnet","Bloc-notes"],
      ["Classeur","Chemise cartonnée"],["Trombone","Punaise"],["Ruban adhésif","Colle"],
      ["Enveloppe","Pochette kraft"],["Devis","Facture"],["Reçu","Ticket de caisse"],
      ["Virement","Prélèvement"],["Crédit","Prêt"],["Assurance","Mutuelle"],["Loyer","Charges"]
    ])
  );

  /* THEMES — catégories hors manga. Même structure que SERIES. */
  var THEMES = [
    { id:"general", label:"Tout public", tint:"#8B9AB0", pairs:GENERAL },
    {
      id:"jeux-video", label:"Jeux vidéo", tint:"#7E6BD0",
      pairs:[
        ["Mario","Luigi"],["Peach","Daisy"],["Bowser","Ganondorf"],["Link","Zelda"],
        ["Sonic","Tails"],["Tails","Knuckles"],["Kirby","Yoshi"],["Donkey Kong","Diddy Kong"],
        ["Pac-Man","Bomberman"],["Master Chief","Doom Slayer"],["Kratos","Dante"],
        ["Dante","Vergil"],["Ryu","Ken"],["Chun-Li","Cammy"],["Scorpion","Sub-Zero"],
        ["Lara Croft","Nathan Drake"],["Geralt","Ciri"],["Ezio","Altaïr"],
        ["Arthur Morgan","John Marston"],["Joel","Ellie"],["Leon Kennedy","Chris Redfield"],
        ["Jill Valentine","Ada Wong"],["Solid Snake","Big Boss"],["Cloud","Sephiroth"],
        ["Tifa","Aerith"],["Steve","Alex"],["Creeper","Enderman"],["Tracer","Widowmaker"],
        ["Jinx","Vi"],["Yasuo","Yone"],["Teemo","Veigar"],["Sackboy","Rayman"]
      ]
    },
    {
      id:"football", label:"Football", tint:"#4FA86B",
      pairs:[
        ["Messi","Ronaldo"],["Mbappé","Haaland"],["Neymar","Vinicius"],["Benzema","Griezmann"],
        ["Zidane","Platini"],["Ronaldinho","Ronaldo Nazario"],["Iniesta","Xavi"],
        ["Pirlo","Modric"],["Kanté","Casemiro"],["Ramos","Piqué"],["Van Dijk","Rüdiger"],
        ["Maldini","Cannavaro"],["Buffon","Casillas"],["Neuer","Courtois"],["Lloris","Maignan"],
        ["Mbappé","Dembélé"],["Giroud","Lacazette"],["Pogba","Rabiot"],["Deschamps","Zidane"],
        ["Guardiola","Mourinho"],["Ancelotti","Klopp"],["Bellingham","Camavinga"],
        ["Yamal","Musiala"],["Salah","Mané"],["Lewandowski","Kane"],["Ibrahimovic","Drogba"],
        ["Henry","Trezeguet"],["Thuram","Desailly"],["Real Madrid","Barcelone"],
        ["Paris Saint-Germain","Marseille"]
      ]
    },
    {
      id:"rap-fr", label:"Rap français", tint:"#C86A9E",
      pairs:[
        ["Booba","Kaaris"],["Rohff","Booba"],["Ninho","Gazo"],["Gazo","Freeze Corleone"],
        ["SCH","Jul"],["Jul","Naps"],["Naps","Soso Maness"],["Ademo","N.O.S"],
        ["Nekfeu","Alpha Wann"],["Alpha Wann","Laylow"],["Laylow","Damso"],["Damso","Hamza"],
        ["Hamza","Tiakola"],["Tiakola","Werenoi"],["Werenoi","Ninho"],["Orelsan","Gringe"],
        ["Gringe","Vald"],["Vald","Lorenzo"],["Lorenzo","Seth Gueko"],["Kery James","Youssoupha"],
        ["Youssoupha","Soprano"],["Soprano","Black M"],["Sexion d'Assaut","Sniper"],
        ["IAM","NTM"],["Akhenaton","Kool Shen"],["MC Solaar","Oxmo Puccino"],
        ["Aya Nakamura","Shay"]
      ]
    },
    {
      id:"cinema", label:"Cinéma", tint:"#D08A55",
      pairs:[
        ["Dark Vador","Kylo Ren"],["Luke Skywalker","Rey"],["Yoda","Obi-Wan"],
        ["Frodon","Sam"],["Gandalf","Saroumane"],["Aragorn","Legolas"],["Gollum","Bilbon"],
        ["Harry Potter","Ron"],["Hermione","Luna"],["Dumbledore","Rogue"],
        ["Voldemort","Grindelwald"],["Neo","Morpheus"],["Terminator","RoboCop"],
        ["John Wick","Jason Bourne"],["Indiana Jones","Tintin"],["Rocky","Ivan Drago"],
        ["Forrest Gump","Truman"],["Jack Sparrow","Davy Jones"],["Vito Corleone","Tony Montana"],
        ["Hannibal Lecter","Norman Bates"],["Alien","Predator"],["E.T.","Wall-E"],
        ["Simba","Mufasa"],["Elsa","Anna"],["Woody","Buzz"],["Shrek","Fiona"],
        ["Po","Maître Shifu"],["Marty McFly","Doc Brown"],["Batman","Superman"],
        ["Iron Man","Captain America"],["Thor","Loki"],["Joker","Bane"]
      ]
    }
  ];

  /* ---------------------------------------------------------------------
     IMAGES — portraits facultatifs
     Les visuels officiels sont protégés et ne sont pas fournis. Placez vos
     propres fichiers à côté de ce document, puis ajoutez une ligne par
     personnage, en minuscules, sans accent ni espace :
        "luffy": "images/luffy.jpg",
        "sungjinwoo": "images/jinwoo.png",
     Sans entrée, un médaillon aux initiales est généré automatiquement.
     --------------------------------------------------------------------- */
  var IMAGES = {
  };


  var WORDS = { SERIES:SERIES, CROSSOVER:CROSSOVER, GENERAL:GENERAL, THEMES:THEMES, IMAGES:IMAGES };
  global.WORDS = WORDS;
  if (typeof module !== "undefined" && module.exports) module.exports = WORDS;
})(typeof window !== "undefined" ? window : globalThis);
