// ============================================================
// story.js — Narrative cut-scenes between SQL tasks
// Each scene = a serif full-screen overlay with typewriter prose,
// optional photo, multiple paragraphs, [Continue] button.
// ============================================================

(function () {

  // Scene library. Keys reference task IDs that trigger them.
  const SCENES = {

    // ----- Ch 1 prologue -----
    "ch1_open": {
      photo: "portraits/Manor.png",
      photoCaption: "Ashford Manor · 周日上午",
      paragraphs: [
        `Brennan 把一台银色笔记本电脑放在 Ashford Manor 楼下 Drawing Room 那张铺着绿呢的赌牌桌上。`,
        `窗外，鉴证警员们正在书房门口贴胶带。秋天的阳光斜切过厚重的窗帘，把灰尘照成金色。`,
        `"在我们开始之前，"他说，"先认识一下这庄园里的所有人。任何人都可能是凶手——包括看起来最没有动机的。"`,
        `他打开了 Persons 这张表。"把它当作整本案卷的'登场人物'页。"`
      ]
    },

    // ----- Ch 1 close -----
    "ch1_close": {
      paragraphs: [
        `Brennan 合上笔记本。`,
        `"明天上午同一时间。"他说。"我需要你把昨晚 11 点到今天凌晨 1 点半之间，所有人进出每个房间的时间给我排出来。"`,
        `"最后一个见到 Elias 还活着的人，会是我们第一个去问话的人。"`
      ]
    },

    // ----- Ch 2 -----
    "ch2_open": {
      photo: "portraits/Study.png",
      photoCaption: "Room 103 · 案发书房",
      paragraphs: [
        `法医在午饭前送来了精炼后的死亡时间窗：周日 00:30 – 01:30。`,
        `"一小时的窗口，"Brennan 在 Drawing Room 来回踱步，"七个嫌疑人，一个被杀的男人，一栋有 24 个带读卡器房间的房子。"`,
        `"我需要时间线。我需要知道这一小时里——每张门卡在响什么。"`
      ]
    },
    "ch2_close": {
      paragraphs: [
        `Brennan 在白板上画了一道红线，从 23:58 到 00:48。`,
        `"Marcus 在 ToD 前 32 分钟离开。Eleanor 在 ToD 中段，从档案室那扇连接门进入。"`,
        `"她有书房权限。她是传记作者。她那天下午借了一本 Margaret 的手稿。"`,
        `"——但第一个看上去显而易见的答案，往往是凶手希望你看到的答案。"`
      ]
    },

    // ----- Ch 3 -----
    "ch3_open": {
      photo: "portraits/Bookend.png",
      photoCaption: "凶器 · 青铜书挡（已收押）",
      paragraphs: [
        `"我曾经以为，"Brennan 一边给自己倒咖啡一边说，"读懂人心需要心理学博士学位。"`,
        `"后来我入行后才知道——只要把他们晚上 11 点之后发的短信调出来读读，就够了。"`,
        `他打开 PhoneRecords 表。"Saturday 14:00 到 Sunday 03:00 之间一共 13 条记录。我们找几个特定的字眼。"`
      ]
    },
    "ch3_close": {
      paragraphs: [
        `Brennan 在白板上写了三个名字下面打了三种符号：`,
        `Marcus — £。怕破产。`,
        `Vivienne — §。怕失去庄园。`,
        `Eleanor — ?。"日记本"。"最后的篇章"。`,
        `"动机有了三个。明天，"他说，"我们看看酒窖。"`
      ]
    },

    // ----- Ch 4 -----
    "ch4_open": {
      paragraphs: [
        `第二天上午，Drawing Room 桌面上放着两本旧账册。`,
        `一本是手写的——Mrs Hodge 那本传奇笔记本的复印件。另一本是 Pemberton 用 iPad 维护的电子台账。两本都同步进了 WineCellarLog。`,
        `"庄园的酒窖在地下，恒温 13 度，"Brennan 说，"正常情况下，凌晨没人下去。"`,
        `"——除非他们想找一瓶能让自己睡着的酒。或者——"他停了一下，"——他们要去拿什么不希望别人看到的东西。"`
      ]
    },
    "ch4_close": {
      paragraphs: [
        `Brennan 在白板上把 Vivienne 的名字划掉。`,
        `"她偷了一份草稿合同，藏在酒窖 B-04 格子里，案发当晚去取回。动机存在，但她在 ToD 期间都在酒窖或自己卧室。"`,
        `"明天，"他说，"我们去图书馆。书会告诉你一个人在想什么——比他们自己说的更诚实。"`
      ]
    },

    // ----- Ch 5 -----
    "ch5_open": {
      paragraphs: [
        `Ashford Manor 的图书馆有四千七百本书。每本书脊上都贴了一枚 RFID 标签。`,
        `"这是个金矿，"Brennan 站在投影前说。"杀人犯有时会读他要杀的那个人的书。"`,
        `"或者读关于'怎么杀'的书。或者读关于'被杀之后'的法律后果的书。"`,
        `"这三种类型的读者都很有意思。"`
      ]
    },
    "ch5_close": {
      paragraphs: [
        `Eleanor 手里现在有：Elias 妹妹 Margaret 的未发表手稿、Gloucestershire 1975-1985 年的领养档案、Margaret 的私人日记本、Elias 的成名作。`,
        `Brennan 在白板上写了一个字：著作权。`,
        `"作家最在乎的不是钱——是名字。"`,
        `"明天我们让 JOIN 走得更深。一条孤立的记录可能误导人；三个数据源一起核对，真相就只剩一个版本了。"`
      ]
    },

    // ----- Ch 6 -----
    "ch6_open": {
      paragraphs: [
        `"前五章你们一直在两张表之间用 INNER JOIN，"Brennan 说，"——人接刷卡、人接借书、人接瓶酒。"`,
        `"今天加一层：多表交叉印证。"`,
        `"一条门禁记录可能被误读，一段 Wi-Fi 会话可能解释不通。但当 KeycardAccess 的时间戳、WiFiSessions 的接入点、Rooms 的物理布局三方拼到一起——真相只剩一种解释。"`,
        `"这才是 JOIN 真正的威力。不是把名字接到 ID 上，是把分散的证据缝成一个无法反驳的故事。"`
      ]
    },
    "ch6_close": {
      paragraphs: [
        `Brennan 在白板上又划掉一个名字：Marcus。`,
        `Eleanor 的 Wi-Fi 在 00:28 离线，01:35 才重新上线。整整 67 分钟——完整覆盖 ToD 窗口，比 ToD 结束晚 5 分钟。`,
        `"明天，"他说，"我们看晚宴。最重要的对话发生在饭桌上。"`,
        `"那些低声的、被服务生听到的、被记下的话。"`
      ]
    },

    // ----- Ch 7 -----
    "ch7_open": {
      photo: "portraits/Hodge.png",
      photoCaption: "Mrs Eileen Hodge · 管家，30 年",
      paragraphs: [
        `Mrs Hodge 有一本墨绿色封皮的笔记本，她在庄园服务的三十年里一直随身带着。`,
        `"我并不偷听，"她对 Brennan 说，"只是有些话——客人们觉得在饭桌上轻声说就没人听到。"`,
        `"但厨房进出的脚步、玻璃杯放下的间隙、椅子挪动——总有些瞬间，话会突然清晰。"`,
        `"我只记下来。我没告诉过任何人。"`
      ]
    },
    "ch7_close": {
      paragraphs: [
        `Eleanor 21:40 对 Elias 说："今夜，宴会之后。档案室。什么都不要带。"`,
        `Elias 22:30 在走廊回应她："你以为名字刻在大理石牌上就是家人了。"`,
        `"她说我是家人。他说不是。"Brennan 自言自语。`,
        `"明天我们做反向调查。不是'谁去过哪里'——是谁不在他应该在的地方。"`
      ]
    },

    // ----- Ch 8 -----
    "ch8_open": {
      paragraphs: [
        `"凶手有时候被找到，"Brennan 说，"不是因为他出现在不该出现的地方——"`,
        `"是因为他没有出现在他应该出现的地方。"`,
        `"档案室有 WiFi。可她断网了。"`
      ]
    },
    "ch8_close": {
      photo: "portraits/Pemberton.png",
      photoCaption: "Mr Albert Pemberton · CCTV 系统管理员",
      paragraphs: [
        `Brennan 走到白板前，从右上角那张"嫌疑人列表"上，把所有名字都画了横线。`,
        `只留下三个字：Eleanor Wright。`,
        `"但我还不能逮捕她，"他说，"我有手段、机会、行为反常——我没有动机。"`,
        `"她为什么要杀他？为了一本封存的日记？没有陪审团会信的。"`,
        `他转过身。"明天，我们查家谱。"`
      ]
    },

    // ----- Ch 9 -----
    "ch9_open": {
      photo: "portraits/Margaret.png",
      photoCaption: "Margaret Blackwood · 1964 — 1986",
      paragraphs: [
        `FamilyTree 表。一张自我引用的关系表——每一行是 PersonID 跟另一个 PersonID 的关系。`,
        `"族谱是侦探最古老的工具，"Brennan 说，"比指纹早三百年。"`,
        `"问'谁有动机'就是问'谁恨他到底'——而人最恨的往往是血亲。"`
      ]
    },
    "ch9_close": {
      photo: "portraits/Margaret.png",
      photoCaption: "1980 年的封存领养档案 · 已解密",
      paragraphs: [
        `Eleanor 是 Margaret 的女儿。Margaret 1980 年生她时，只有 16 岁。`,
        `六年后，Margaret 从黑木庄园的井里走了。`,
        `Elias 是 Margaret 的兄弟。Eleanor 是他的外甥女——血缘关系封存了 44 年。`,
        `Brennan 把这条关系链画在白板上：`,
        `"动机有了。但还差一根针——能不能证明 Eleanor 进了书房后，跟 Elias 谈过这件事？"`,
        `"我们还需要 Elias 自己的笔记本。"`
      ]
    },

    // ----- Ch 10 -----
    "ch10_open": {
      paragraphs: [
        `Elias 的笔记本电脑被法医带走了——但里面 Scrivener 文字处理软件的自动保存日志，已经全部进了 WritingSoftwareLog 表。`,
        `"Scrivener 每三十秒就自动保存一次版本，附带预览文本。"Brennan 解释。`,
        `"即使用户删除了文件，自动保存的元数据预览依然在云端缓存里保留。"`,
        `"这是个数字考古遗址。我们要找到一个特定的痕迹——一个被写下来又被删掉的痕迹。"`
      ]
    },
    "ch10_close": {
      paragraphs: [
        `Brennan 沉默了很久。他把笔记本电脑合上，揉了揉眉心。`,
        `Elias 计划周日早晨在颁奖宴上公开承认《沉默时刻》部分来自妹妹。他写好了讲稿。`,
        `Eleanor 不知道。她杀了一个 24 小时后会自己揭穿一切的男人。`,
        `"明天，"他说，"我们写最后一次查询。"`,
        `"一条 SQL，把所有线索缝在一起。作为申请逮捕令的核心证据。"`
      ]
    },

    // ----- Ch 11 -----
    "ch11_open": {
      paragraphs: [
        `第十一天清晨，Brennan 把检察官 Sarah Mendel 请到了 Drawing Room。`,
        `她穿着深灰色西装，头发挽成一个紧绷的发髻。她看上去十年没笑过。`,
        `"DI Brennan，"她说，"我没有时间。给我一个查询。"`,
        `"一条 SQL，能让我说服法官签逮捕令。要满足：手段、机会、动机、行为反常、物证关联——全部在一份输出里。"`,
        `Brennan 看向桌前的你。`
      ]
    },

    // ----- Finale · Eleanor's confession -----
    "finale_confession": {
      photo: "portraits/Eleanor.png",
      photoCaption: "Eleanor Wright · 讯问室 · 11 月 1 日",
      paragraphs: [
        `Eleanor Wright 在档案室被捕。她没有反抗。`,
        `讯问室里，她要了一杯茶。`,
        `"我以为没人会想到查连接门的读卡器。"她说。`,
        `Brennan 回答："读卡器不是我们查到的。是我请的几位数据分析师，把整栋庄园的日志缝在一起。"`,
        `她笑了一下。"那也是一种文学。把碎片缝成一个故事。"`,
        ``,
        `她讲了她的故事。不是辩白——是讲述。`,
        ``,
        `她 17 岁第一次知道自己是被领养的。22 岁找到生母的名字——Margaret Blackwood。`,
        `25 岁意识到 Margaret 的死法、年龄、自杀前的那段日子。`,
        `她花了十年研究，把所有的碎片摆在一起。最后一片是：Elias 处女作《沉默时刻》的初稿，跟 Margaret 1985 年留在 Cotswolds 小屋里的手稿，是同一份。`,
        ``,
        `她说她不是来杀人的。她带的是日记本，是为了让他亲口承认。她做好了——按她原本的话——"进行一场对话"。`,
        ``,
        `但 Elias 跟她说："你以为名字刻在牌子上就是家人了？"`,
        `"你以为我会在颁奖宴上为一个 38 年前的死人下跪？"`,
        ``,
        `她说："你已经写好了。我读了你的笔记本电脑。我读了第七章。你打算明早承认这件事。"`,
        ``,
        `他笑了。`,
        `"那是文学，亲爱的 Eleanor。那是修辞。"`,
        `"我从不会真的承认任何事。第七章是诱饵——明早我会在演讲里反过来说：'有人想给我编一段悔过的故事，我要在此澄清——我什么都没做错。'"`,
        ``,
        `她以为自己听错了。`,
        `"你打算在颁奖宴上——反过来？"`,
        `"当然。我活了 67 年。Margaret 死了 38 年。死人不会回来争名字。活人会。"`,
        ``,
        `她拿起了书挡。`,
        ``,
        `她说她做完事走出书房，回头看见笔记本电脑屏幕上自己的名字。`,
        `她不能让别人看到 Elias 写过她。她删了那份文件。`,
        ``,
        `她说她忘了 Scrivener 自动保存的预览不会消失。`,
        `她说她忘了连接门有读卡器。`,
        `她说她想她忘了很多很多东西。`,
        ``,
        `她说她最后一次看 Margaret 的画像——挂在档案室壁炉上方那张——是 01:14 am，被捕的整整十一天前。`,
        ``,
        `她说她以为她做这件事是为 Margaret。`,
        `她说她不知道死人想要什么。`,
        ``,
        `她说她希望——这是她最后一句话——`,
        `学生们读到这桩案子的时候，能想起 Margaret Blackwood 这个名字。`
      ]
    },

    // ================================================================
    // OPENING PROLOGUE — 6-beat cinematic sequence played before workspace
    // ================================================================
    "prologue_01_manor": {
      photo: "portraits/Manor.png",
      photoCaption: "Ashford Manor · Cotswolds, England",
      paragraphs: [
        `周日清晨。八点四十七分。`,
        `浓雾压在 Cotswolds 的山谷上方。`,
        `十月的第三个周末——本来是 黑木文学奖 的颁奖周末。`,
        `Ashford Manor，三层石砌庄园，西翼最高的窗依然亮着——昨晚没有人去关那盏灯。`,
        `庄园里住着十二个人。`,
        `二十一分钟前，他们当中的一个被发现死在自己的书房里。`
      ]
    },
    "prologue_02_police": {
      photo: "cutscenes/S02-police-arrival.jpg",
      photoCaption: "Sunday 20 October 2024 · 08:50 AM",
      paragraphs: [
        `Sarah Whitcombe 给庄园做了三年秘书。`,
        `她每周日上午八点二十五分准时按响后厨的指纹锁，把 Elias Blackwood 当天的报纸、邮件和早餐一并送到书房门口。`,
        `风暴吹散之后，秋天的山谷一片清冽。`,
        `她比往常迟到了五分钟。`
      ]
    },
    "prologue_03_discovery": {
      photo: "cutscenes/S03-sarah-discovery.jpg",
      photoCaption: "Sarah Whitcombe · 08:30 — the moment of finding",
      paragraphs: [
        `一小时前。`,
        `书房门把手在 Sarah 的手心打转。她敲了三声——这是规矩。`,
        `没有回应。`,
        `她推门进去。`,
        `然后她做了三件事：`,
        `一，伸手摸 Elias 的颈动脉，没有；`,
        `二，退后两步，没碰任何东西；`,
        `三，从外套口袋里摸出手机，拨了 999。`,
        `她没有尖叫。`
      ]
    },
    "prologue_04_study": {
      photo: "cutscenes/S04-the-study.jpg",
      photoCaption: "Room 103 · The Study · Crime scene as found",
      paragraphs: [
        `书房不大。两面墙到顶的书架。`,
        `Elias Blackwood，六十七岁，三度获奖作家。`,
        `他趴在自己的书桌上。右手仍然压住一张写满字的便笺。`,
        `笔记本电脑屏幕依然亮着，标题栏闪烁着 Memoir_Chapter7.scriv。`,
        `桌角那只张翅的青铜隼——三十年前他在伦敦古董行买的——倒在波斯地毯上。`,
        `隼的爪子上有暗色的污渍。`,
        `屋里没有打斗的痕迹。`,
        `Elias 认识杀他的人。`
      ]
    },
    "prologue_05_brennan": {
      photo: "cutscenes/S05-brennan-arrives.jpg",
      photoCaption: "DI James Brennan · Gloucestershire CID · 09:42",
      paragraphs: [
        `上午九点四十二分。`,
        `DI James Brennan 站在书房门口。`,
        `四十出头，瘦削，西装比他的薪水级别贵半档。`,
        `他没有走进去——他在等鉴证组把脚印画完。`,
        `他不喜欢站在现场太久。`,
        `他喜欢看完照片之后回到办公桌前，慢慢看数据。`,
        `「数据胜过直觉。」`,
        `他这样跟自己说了二十二年。`
      ]
    },
    "prologue_06_command": {
      photo: "cutscenes/S06-brennan-desk.jpg",
      photoCaption: "Drawing Room · Temporary command post",
      paragraphs: [
        `一楼 Drawing Room。`,
        `Brennan 让人在那张铺着绿呢的赌牌桌上摆好了笔记本电脑。`,
        `庄园的服务器仍在运行——昨晚风暴只打掉了对外的主路由。`,
        `读卡器、Wi-Fi、酒窖盘点、监控元数据……整夜的痕迹，都在硬盘上。`,
        `他抽出一根烟，又放回去。`,
        `他戒了八年，但每次案子开始的那一刻，手依然记得这个动作。`,
        `他拨通了一个号码。`,
        `「IT 那边吗？我要一份案件数据库副本。」`,
        `「不是给我——给我请的几位顾问。」`,
        `沉默两秒。`,
        `「年纪？嗯。是有点轻。」`,
        `他看向窗外。`,
        `「但他们对 SQL 的理解，比这庄园里任何人都靠得住。」`
      ]
    },

    // ================================================================
    // MID-GAME CINEMATIC NODES — triggered after key chapter tasks
    // ================================================================
    "A_marcus_alibi": {
      photo: "cutscenes/A-marcus-drunk.jpg",
      photoCaption: "Marcus Thorne · Room 301 · 00:30 → 02:30",
      paragraphs: [
        `Marcus Thorne，四十九岁，文学经纪人。`,
        `当晚零点十七分回房。`,
        `把领带拉松。倒了第三杯威士忌，没喝完。`,
        `给前妻发了那条短信——`,
        `「He's going to ruin me.」`,
        `然后他在床上睡死过去。`,
        `手机贴在身边的枕头上，整夜挂在 Wi-Fi 上没断过。`,
        `他不是凶手。`,
        `但他失去了未来二十年的合同。`,
        `这对他来说，可能比死还糟。`
      ]
    },
    "B_corridor_deadzone": {
      photo: "cutscenes/B-corridor-deadzone.jpg",
      photoCaption: "Connecting Corridor · Archive ↔ Study · No CCTV, no Wi-Fi",
      paragraphs: [
        `同一时间。凌晨零点二十八分。`,
        `Eleanor Wright 的手机最后一次连上档案室的 Wi-Fi。`,
        `然后——`,
        `静默。`,
        `整整六十七分钟。凌晨零点二十八分到一点三十五分。`,
        `在那段时间里，她在哪里？`,
        `庄园里有一个房间，没有 Wi-Fi 覆盖。`,
        `一个房间，没有监控。`,
        `一个房间——也只有一个——`,
        `连接着档案室和书房。`,
        `那条短走廊。`
      ]
    },
    "E_margaret_reveal": {
      photo: "cutscenes/E-margaret-1985.jpg",
      photoCaption: "Margaret Blackwood · 1964 — 1986",
      paragraphs: [
        `Margaret Blackwood。`,
        `一九六四年生，一九八六年死。`,
        `二十二岁。`,
        `她的死因记录在郡医院档案里只有四个字——`,
        `self-inflicted.`,
        `在她死前六年的某个春天，`,
        `十六岁的 Margaret 在 Cotswolds 小屋里生下了一个女孩。`,
        `那年是一九八〇年。`,
        `那个女孩——`,
        `四十四年后，坐在档案室里翻找自己生母的所有作品。`,
        `三年时间。`,
        `现在，她终于把所有东西都找齐了。`
      ]
    },

    // ================================================================
    // REPLACED / ENHANCED chapter-close scenes (now with cinematic images)
    // ================================================================
    // ----- Epilogue (after confession, before final report) -----
    "finale_epilogue": {
      photo: "cutscenes/G-book-and-courtroom.jpg",
      photoCaption: "Three months later · January 2025",
      paragraphs: [
        `三个月后。`,
        `二〇二五年一月。`,
        `Whittaker & Hayes 出版社在伦敦发布了一本薄薄的小书。`,
        `封面是手绘的，一只张翅的隼，下面写着——`,
        `Notebooks 1983–1986`,
        `by Margaret Blackwood`,
        ``,
        `扉页献辞：`,
        `「For my mother. 1964 — 1986.」`,
        ``,
        `那本书卖了八千册。`,
        `没有任何 Blackwood 家族成员出现在新闻发布会上。`,
        ``,
        `同一个月，`,
        `Eleanor Wright 在 Bristol Crown Court 被起诉为二级谋杀罪。`,
        `她没有请辩护律师。`,
        ``,
        `庭审记录第三十一页，她对法官说了一句话——`,
        `「他用了她三十八年。我只用了他一个晚上。」`,
        `然后她沉默了。`,
        ``,
        `法官记录在案的最后一句话是：`,
        `「被告，请坐下。」`
      ]
    }
  };

  // Override ch7_close with new C image (Hodge notebook)
  SCENES["ch7_close"] = {
    photo: "cutscenes/C-hodge-notebook.jpg",
    photoCaption: "Mrs Eileen Hodge · Housekeeper · 30 years of service",
    paragraphs: [
      `Mrs Eileen Hodge 给 Ashford Manor 做了三十年管家。`,
      `她有一本墨绿色封皮的小本子，从不离身。`,
      `她说：「我并不偷听，先生。」`,
      `「只是有些话——客人们觉得在饭桌上轻声说就没人听到。」`,
      `「但厨房进出的脚步、玻璃杯放下的间隙、椅子挪动——」`,
      `「总有些瞬间，话会突然清晰。我只记下来。」`,
      `三十年间，她从未把那个本子给任何人看过。`,
      `直到今天。`
    ]
  };
  // Override ch8_close with new D image (Archive room)
  SCENES["ch8_close"] = {
    photo: "cutscenes/D-archive-room.jpg",
    photoCaption: "Room 405 · The Archive · No surveillance, no public log",
    paragraphs: [
      `二楼最东侧的档案室。`,
      `没有监控。没有公开访客记录。`,
      `庄园里唯一一个房间——只有 Elias 本人和「授权传记作者」 Eleanor Wright 能进。`,
      `Eleanor 用了三年。`,
      `三年时间，她翻遍了 Blackwood 家族的每一页旧信、每一本旧账、`,
      `每一张她不被允许带走的领养记录。`,
      `她做这一切的时候，没有人怀疑她。`,
      `她是写传记的。`,
      `她当然要看这些。`
    ]
  };
  // Override ch10_close with new F image (the deleted memo on screen)
  SCENES["ch10_close"] = {
    photo: "cutscenes/F-elias-laptop-memo.jpg",
    photoCaption: "Elias's laptop · 00:38 → 00:51 · The note that was deleted",
    paragraphs: [
      `凌晨零点三十八分。`,
      `Elias 坐在书桌前，给自己写一张便条——`,
      `不为发给任何人，只为整理自己的想法。`,
      ``,
      `「Eleanor coming in 10 min. She knows. We will settle this.」`,
      `「她有权利问。她没有权利毁了我。 —E.B.」`,
      ``,
      `他按下了 ⌘+S。`,
      `然后，自动保存系统忠实地在云端备份了这个文件——`,
      `连同它的预览图。`,
      ``,
      `十三分钟后，`,
      `这个文件在他自己的笔记本上被删除。`,
      `那时候他已经死了至少三分钟。`
    ]
  };

  // Mapping: task ID → scene to play before/after
  const SCENE_BEFORE = {
    "1.1":  "ch1_open",
    "2.1":  "ch2_open",
    "3.1":  "ch3_open",
    "4.1":  "ch4_open",
    "5.1":  "ch5_open",
    "6.1":  "ch6_open",
    "7.1":  "ch7_open",
    "8.1":  "ch8_open",
    "9.1":  "ch9_open",
    "10.1": "ch10_open",
    "11.1": "ch11_open"
  };
  // The "after" scene plays once the LAST task of a chapter completes.
  // Each chapter's last task by ID. Values may be a string OR an array
  // of scene IDs (played back-to-back as a sequence).
  const SCENE_AFTER = {
    "1.1":  "ch1_close",
    "2.1":  "ch2_close",
    "3.3":  "ch3_close",
    "4.5":  "ch4_close",
    "5.3":  "ch5_close",
    // Ch6 ToD evidence revealed — TWO scenes chain: Marcus alibi → Eleanor's gap
    "6.3":  ["A_marcus_alibi", "B_corridor_deadzone"],
    "7.3":  "ch7_close",           // now with Hodge notebook image
    "8.4":  "ch8_close",           // Ch8 now ends on the elimination task
    // Ch9 plays the family-tree ritual (chapters.js), THEN Margaret reveal scene
    "9.3":  ["ch9_close", "E_margaret_reveal"],
    "10.2": "ch10_close",          // now with laptop memo image
    "11.1": "finale_confession"    // played after Ch11 stamp ritual
  };

  // ============================================================
  // Renderer — full-screen serif overlay, typewriter per paragraph
  // ============================================================
  // When the player skips a multi-scene run (the 6-beat opening prologue, or
  // a mid-game A→B chain), this aborts every remaining scene in the run.
  let __abortSequence = false;

  function playScene(sceneId, opts) {
    opts = opts || {};
    const scene = SCENES[sceneId];
    if (!scene) return Promise.resolve();
    if (__abortSequence) return Promise.resolve();   // run already skipped
    const inSequence = !!opts.sequence;
    return new Promise(resolve => {
      const veil = document.createElement("div");
      veil.className = "scene-veil";
      const skipLabel = inSequence ? "跳过开场 ⏭" : "跳过";
      veil.innerHTML = `
        <div class="scene-card ${scene.photo ? "has-photo" : ""}">
          ${scene.photo ? `
            <div class="scene-photo">
              <img src="${scene.photo}" alt="" loading="lazy" decoding="async" />
              ${scene.photoCaption ? `<div class="scene-photo-caption">${esc(scene.photoCaption)}</div>` : ""}
            </div>
          ` : ""}
          <div class="scene-body">
            <div class="scene-text" id="scene-text"></div>
            <div class="scene-actions">
              <button class="scene-skip">${skipLabel}</button>
              <button class="scene-continue" disabled>继续 →</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(veil);
      requestAnimationFrame(() => veil.classList.add("open"));

      const text = veil.querySelector("#scene-text");
      const btn  = veil.querySelector(".scene-continue");
      const skip = veil.querySelector(".scene-skip");
      const paragraphs = scene.paragraphs || [];
      let aborted = false;   // finish-typing-of-this-scene
      let closed = false;

      function close() {
        if (closed) return;
        closed = true;
        window.removeEventListener("keydown", onKey);
        veil.classList.remove("open");
        setTimeout(() => {
          veil.remove();
          // Keep the task card in sync — a chapter-close cutscene can
          // otherwise leave it showing the just-finished task.
          if (window.refreshTaskCard) window.refreshTaskCard();
          resolve();
        }, 320);
      }
      function renderAll() {
        text.innerHTML = paragraphs.map(p => `<p>${esc(p)}</p>`).join("");
        btn.disabled = false;
        btn.focus();
      }
      btn.addEventListener("click", () => { if (!btn.disabled) close(); });
      skip.addEventListener("click", () => {
        if (inSequence) {
          // One click skips the WHOLE run (e.g. all 6 prologue beats).
          __abortSequence = true;
          close();
        } else {
          aborted = true;
          renderAll();
        }
      });

      let pIdx = 0;
      async function step() {
        if (aborted || closed) return;
        if (pIdx >= paragraphs.length) {
          btn.disabled = false;
          btn.focus();
          return;
        }
        const p = paragraphs[pIdx++];
        const pEl = document.createElement("p");
        text.appendChild(pEl);
        // Empty paragraph = pause
        if (!p.trim()) {
          pEl.innerHTML = "&nbsp;";
          await sleep(120);
          step();
          return;
        }
        await typeInto(pEl, p, 18, () => aborted || closed);
        if (aborted || closed) return;
        await sleep(220);
        step();
      }
      step();

      // Keyboard: Esc/Enter close; any other key finishes the current typing.
      function onKey(e) {
        if (e.key === "Escape") {
          if (inSequence) __abortSequence = true;
          close();
        } else if (e.key === "Enter" && !btn.disabled) {
          close();
        } else if (btn.disabled) {
          aborted = true; renderAll();
        }
      }
      window.addEventListener("keydown", onKey);
    });
  }

  // Time-based typewriter. requestAnimationFrame pauses cleanly when the tab
  // is backgrounded and resumes without permanently stalling — the char count
  // is derived from elapsed time, so it self-heals instead of freezing.
  function typeInto(el, text, speed, isAborted) {
    return new Promise(resolve => {
      const start = performance.now();
      function frame(now) {
        if (isAborted && isAborted()) { el.textContent = text; resolve(); return; }
        const chars = Math.min(text.length, Math.floor((now - start) / speed));
        el.textContent = text.slice(0, chars);
        if (chars >= text.length) { resolve(); return; }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function esc(s) {
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Play a sequence of scenes back-to-back. Resolves when all complete.
  // A multi-scene run shows a "跳过开场" button that skips the whole run.
  async function playSceneSequence(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    __abortSequence = false;
    const multi = ids.filter(Boolean).length > 1;
    for (const id of ids) {
      if (__abortSequence) break;
      if (id) await playScene(id, { sequence: multi });
    }
    __abortSequence = false;
  }

  // Convenience: the full opening prologue sequence (6 beats).
  // Called by workspace.js after the Brennan splash monologue.
  const OPENING_PROLOGUE = [
    "prologue_01_manor",
    "prologue_02_police",
    "prologue_03_discovery",
    "prologue_04_study",
    "prologue_05_brennan",
    "prologue_06_command"
  ];
  function playOpeningPrologue() {
    return playSceneSequence(OPENING_PROLOGUE);
  }

  window.BMM2_SCENES = SCENES;
  window.BMM2_SCENE_BEFORE = SCENE_BEFORE;
  window.BMM2_SCENE_AFTER = SCENE_AFTER;
  window.BMM2_playScene = playScene;
  window.BMM2_playSceneSequence = playSceneSequence;
  window.BMM2_playOpeningPrologue = playOpeningPrologue;
})();
