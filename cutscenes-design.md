# 黑木庄园谋杀案 · 沉浸式播片设计

> 共 **13 段播片** = 开场 6 段 + 章节中关键节点 7 段
> 每段含：触发时机 · 图片提示词（英文，给 GPT Image2 用）· 叙事文字（中文，小说体）
> 你生成图片后命名为 `cutscenes/SXX-name.jpg` 上传，我把它接进游戏。

---

## 通用风格锚（**所有图片必须遵守**）

把下面这段**粘在每条 GPT Image2 提示的开头**作为风格统一锚：

```
STYLE ANCHOR: Cinematic British detective noir, autumn 2024, Cotswolds English
countryside. Aesthetic somewhere between BBC's Broadchurch, HBO's Mare of
Easttown, and a Knives Out still frame. Color palette: deeply desaturated —
graphite blacks, slate blue shadows, warm umber midtones, occasional accent
of blood red and aged gold. Painterly photographic quality, NOT stock photo,
NOT cartoon, NOT anime. Heavy film grain, shallow depth of field, dramatic
chiaroscuro lighting. 16:9 widescreen aspect ratio. Single image, no panels,
no text overlay, no watermarks. Subjects rendered with photographic realism
but with a slight oil-painting softness. The mood is somber, deliberate,
weighty — never melodramatic, never garish.
```

附加约束：**所有人物的脸不要看向相机**（除非特别注明），保持电影第三人称的距离感。所有内饰用历史风格（19 世纪庄园），所有外景**已有秋天落叶 + 雾气 + 雨后湿润感**。

---

# Part 1 · 开场播片（序章 · 共 6 段 + 1 标题）

替换当前过短的 Brennan 独白，扩展为完整的"案件开场"，约 90-120 秒过场，玩家可随时跳过。

---

### 序章·1 · 黎明的庄园 *（复用已有 Manor.png）*

**触发**：游戏启动后立即播放。
**图片**：复用 `portraits/Manor.png`（已生成）。
**叙事文字**（按 ENTER 推进，逐段打字机式显现）：

> 周日清晨。八点四十七分。
>
> 浓雾压在 Cotswolds 的山谷上方。
> 十月的第三个周末——本来是 **黑木文学奖** 的颁奖周末。
>
> Ashford Manor，三层石砌庄园，西翼最高的窗依然亮着——昨晚没有人去关那盏灯。
>
> 庄园里住着十二个人。
>
> 二十一分钟前，他们当中的一个被发现死在自己的书房里。

---

### 序章·2 · 警车驶入 *(新图：`cutscenes/S02-police-arrival.jpg`)*

**触发**：序章 1 之后，淡入。
**叙事文字**：

> Sarah Whitcombe 给庄园做了三年秘书。
> 她每周日上午八点二十五分准时按响后厨的指纹锁，把 Elias Blackwood 当天的报纸、邮件和早餐一并送到书房门口。
>
> 风暴吹散之后，秋天的山谷一片清冽。
> 她比往常迟到了五分钟。

**GPT Image2 提示词**（先粘风格锚，再粘下面）：

```
SCENE: A wide cinematic shot of a curving wet gravel driveway leading up to
a grand 19th-century English Cotswolds manor at dawn. Three vehicles are
parked at the end of the drive at the foot of the front steps:
  - one marked Gloucestershire Police patrol car with reflective blue/yellow
    Battenburg livery and a slowly rotating blue light bar (the only color
    in the otherwise muted scene);
  - one unmarked dark navy detective saloon car;
  - one boxy white forensic van, just visible turning the corner from the
    gatehouse, headlights cutting through the thin morning mist.
The lawn on both sides is silver with dew, autumn leaves scattered across
the gravel. Heavy slate-blue clouds, mist drifting low across the field.
A single uniformed PC stands at the front steps writing in a notebook,
turned away from camera. No other people visible. Slight reflection of
the police blue light on the wet flagstones. The manor's stone facade is
heavy with ivy, two yellow-lit windows on the upper floor stand out in
the gloom. Shot from low/wide angle, dramatic perspective lines along the
driveway. Late autumn morning, ~08:50 AM.
```

---

### 序章·3 · 秘书的发现 *(新图：`cutscenes/S03-sarah-discovery.jpg`)*

**触发**：序章 2 之后。这是回溯——回到 21 分钟前。
**叙事文字**：

> 一小时前。
>
> 书房门把手在 Sarah 的手心打转。她敲了三声——这是规矩。
>
> 没有回应。
>
> 她推门进去。然后她做了三件事：
>
> 一，伸手摸 Elias 的颈动脉，没有；
> 二，退后两步，没碰任何东西；
> 三，从外套口袋里摸出手机，拨了 999。
>
> 她没有尖叫。

**GPT Image2 提示词**（粘风格锚 + 下面）：

```
SCENE: A close-mid portrait of Sarah Whitcombe, a slim woman in her mid-
twenties with shoulder-length brown hair, pale skin, wearing a knee-length
charcoal wool coat over a cream blouse. She stands frozen in a dimly-lit
manor corridor of dark oak panelling, just outside a heavy oak doorway.
The door behind her is open a crack; through the gap we can just glimpse
the corner of a writing desk and a tipped-over bronze object — nothing
graphic, only suggested. She is hugging a leather day-planner notebook
to her chest with both hands, knuckles white. Her face is paper-pale,
eyes wide open but unfocused, lips slightly parted. She is NOT crying.
She is in shock. Her phone is in her left hand, held away from her ear
but the screen is still lit with a 999 call duration counter. Morning
amber light from a tall window painting one side of her face; the other
side is in deep shadow. Cinematic composition, shallow depth of field,
the door behind her slightly out of focus. Mood: dread, suspended time.
SHE IS NOT FACING CAMERA DIRECTLY — three-quarter angle.
```

---

### 序章·4 · 书房现场 *(新图：`cutscenes/S04-the-study.jpg`)*

**触发**：序章 3 之后。
**叙事文字**：

> 书房不大。两面墙到顶的书架。
>
> Elias Blackwood，六十七岁，三度获奖作家。
> 他趴在自己的书桌上。右手仍然压住一张写满字的便笺。
> 笔记本电脑屏幕依然亮着，标题栏闪烁着 *Memoir_Chapter7.scriv*。
>
> 桌角那只张翅的青铜隼——三十年前他在伦敦古董行买的——
> 倒在波斯地毯上。隼的爪子上有暗色的污渍。
>
> 屋里没有打斗的痕迹。
>
> Elias 认识杀他的人。

**GPT Image2 提示词**：

```
SCENE: Wide cinematic interior shot of a Victorian-era writing study, the
crime scene. Two tall walls of dark oak bookshelves filled with leather-
bound books reaching to a high coffered ceiling. In the foreground, a
heavy mahogany writing desk: an open silver MacBook laptop (screen glow
washes the desk in pale blue), the title bar visible reading "Memoir_
Chapter7.scriv". Beside it, a half-finished glass of single-malt whisky.
A green-shaded brass banker's lamp casts a tight pool of amber light.
A bronze bookend shaped like a falcon with wings spread is TIPPED OVER
on the Persian rug at the desk's edge — the falcon's talons have a dark
stain (subtle, only suggested, NO GRAPHIC GORE). A single sheet of paper
lies on the desk under where a hand would have rested. The writer's
chair behind the desk is empty — pushed back slightly, as if someone
recently rose. NO BODY VISIBLE — composition framed so the chair occupant
is implied off-frame. Heavy velvet burgundy curtains half drawn over tall
mullioned windows; cold morning light filtering through. Dust motes in
the lamp beam. A small police evidence number "01" placard placed
discreetly next to the bookend. Mood: silent, cold, deliberate.
Cinematic painterly photography, BBC quality.
```

---

### 序章·5 · Brennan 抵达 *(新图：`cutscenes/S05-brennan-arrives.jpg`)*

**触发**：序章 4 之后。
**叙事文字**：

> 上午九点四十二分。
>
> DI James Brennan 站在书房门口。
> 四十出头，瘦削，西装比他的薪水级别贵半档。
>
> 他没有走进去——他在等鉴证组把脚印画完。
>
> 他不喜欢站在现场太久。
> 他喜欢看完照片之后回到办公桌前，慢慢看数据。
>
> 「数据胜过直觉。」他这样跟自己说了二十二年。

**GPT Image2 提示词**：

```
SCENE: Cinematic three-quarter portrait of DI James Brennan, a tall lean
British man in his mid-40s. He has dark hair greying at the temples,
several days of stubble, hooded weary eyes, a long oval face with sharp
cheekbones. He's wearing an expensive but slightly rumpled grey wool
overcoat over a navy suit and a loosened dark tie. He stands in profile
at a doorway in a manor corridor, NOT looking at camera. He's holding a
manila folder of police case papers under one arm and a paper cup of
black coffee in the other hand. Behind him, slightly out of focus, two
forensic officers in white Tyvek suits are kneeling on the carpet doing
evidence collection. Beyond them, the open doorway to a study — only a
sliver of warm interior lamplight is visible. Brennan is looking past
the threshold but not stepping in. His expression is one of weary
patience, no shock, no excitement — the expression of a detective who
has seen this scene fifty times. Morning amber light from a tall corridor
window streaks across his face from the right. Cinematic shallow focus,
painterly noir aesthetic.
```

---

### 序章·6 · 调查指挥所 *(新图：`cutscenes/S06-brennan-desk.jpg`)*

**触发**：序章 5 之后。
**叙事文字**：

> 一楼 Drawing Room。
>
> Brennan 让人在那张铺着绿呢的赌牌桌上摆好了笔记本电脑。
>
> 庄园的服务器仍在运行——昨晚风暴只打掉了对外的主路由。
> 读卡器、Wi-Fi、酒窖盘点、监控元数据……整夜的痕迹，都在硬盘上。
>
> 他抽出一根烟，又放回去。
> 他戒了八年，但每次案子开始的那一刻，手依然记得这个动作。
>
> 他拨通了一个号码。

**GPT Image2 提示词**：

```
SCENE: Wide cinematic interior shot of a Victorian drawing room being
used as a temporary police command post. A large round antique gaming
table covered in worn green felt sits in the center of the room — an
open silver MacBook on it glowing with a dark database query interface
(text faintly readable but no specific spoilers, just generic SQL syntax
in white on dark green). Beside the laptop: a stack of three manila
case files, a leather-bound notebook open with handwritten notes, a
silver cigarette case (closed), a glass ashtray (empty, clean), and
a half-cold mug of tea. DI Brennan sits at the table in a high-back
worn leather Chesterfield chair, in shirt sleeves now (overcoat draped
on the chair back), tie loosened further. He is in profile, looking down
at the laptop screen, one hand on the touchpad, the other holding an
old corded landline telephone handset to his ear — mid-call, lips parted
as if speaking. Late morning amber sunlight slants through tall mullioned
windows behind him, dust visible in the beams. The walls behind him hold
oil portraits of stern Victorian gentry, taxidermy game birds, a hunting
horn. A small evidence bag sealed with red tape sits on the corner of
the table. Mood: improvised command post, weight of investigation about
to begin. Cinematic painterly noir.
```

---

### 序章·7 · 案件标题卡（**无图，纯排版**）

**触发**：序章 6 之后。
**屏幕渐黑，居中浮现以下文字**：

```
─────────────────────────────────
        Gloucestershire CID
   Criminal Investigation Department
─────────────────────────────────
       CASE FILE BMM-2024-1019
        BLACKWOOD MANOR · 黑 木 庄 园
─────────────────────────────────
          [ 进入案卷 → ]
        [ENTER CASE FILE]
```

下方再小一行：

> 「我请你来——是因为我宁愿信一队会写 GROUP BY 的高中生，也不再信副巡警的『第六感』。」
> ——DI James Brennan, Gloucestershire CID

---

# Part 2 · 章节中关键节点播片（共 7 段）

每段在游戏过程中**特定时刻自动触发**，玩家完成对应 SQL 任务后插入。

---

### 节点·A · Marcus 的醉态 *（Ch6 通关后，"Marcus 排除"瞬间）*

**触发**：玩家通过 Ch6.3（Marcus 全程 Wi-Fi 在卧室 AP 上）后，自动播放。
**叙事文字**：

> Marcus Thorne，四十九岁，文学经纪人。
>
> 当晚零点十七分回房。
> 把领带拉松。倒了第三杯威士忌，没喝完。
> 给前妻发了那条短信——
>
> **"He's going to ruin me."**
>
> 然后他在床上睡死过去。
> 手机贴在身边的枕头上，整夜挂在 Wi-Fi 上没断过。
>
> 他不是凶手。
> 但他失去了未来二十年的合同。这对他来说，可能比死还糟。

**GPT Image2 提示词**：

```
SCENE: Cinematic medium shot of a guest bedroom in a manor, dimly lit.
Marcus Thorne, a man in his late 40s with thinning sandy hair and a
sharp angular face, lies slumped fully clothed on top of a heavy
four-poster bed. His grey suit is rumpled, tie undone hanging around
his neck, top three shirt buttons open. One shoe is off, lying on
the rug. His left arm hangs off the bed; his right hand is clutching
a smartphone face-up on the pillow next to his head, the screen still
faintly glowing with a half-typed SMS message visible. An empty crystal
whisky tumbler sits tipped on the nightstand beside a near-empty bottle
of Macallan. A small reading lamp casts amber light from the desk.
The window curtains are half-drawn, predawn blue light bleeding in.
Mood: exhausted, broken, drunk — NOT dangerous. The man is alive,
breathing, eyes closed. Composition shows his back as the primary
focus, with the phone clearly visible. NO BLOOD, NO INJURY.
Cinematic painterly noir, BBC drama aesthetic.
```

---

### 节点·B · Wi-Fi 信号失联 *（Ch6 自动连线触发后，Eleanor 67 分钟空窗显形瞬间）*

**触发**：玩家通过 Ch6.3 后第二段播片（紧接 A 之后）。
**叙事文字**：

> 同一时间，凌晨零点二十八分。
>
> Eleanor Wright 的手机最后一次连上档案室的 Wi-Fi。
>
> 然后——
>
> 静默。
>
> 整整六十七分钟。
> 凌晨零点二十八分到一点三十五分。
>
> 在那段时间里，她在哪里？
>
> 庄园里有一个房间，没有 Wi-Fi 覆盖。
> 一个房间，没有监控。
> 一个房间——也只有一个——连接着档案室和书房。
>
> 那条短走廊。

**GPT Image2 提示词**：

```
SCENE: Cinematic interior shot of a narrow, dim service corridor in an
old manor — the connecting passage between two rooms. Heavy oak panelling
on both walls, a worn red Turkish runner on the stone floor, a single
brass sconce providing dim yellow light. The corridor is about 2.5 meters
long, with a heavy oak door at each end — both doors closed. One door
has a small antique brass card-reader plate beside it (modern access
system grafted onto Victorian hardware). The corridor is empty. The air
feels still. Dust visible in the sconce's light cone. NO PEOPLE in the
image. The composition emphasizes the corridor as a "dead zone" — no
windows, no Wi-Fi, no surveillance camera in any corner. The frame is
slightly tight, claustrophobic. Time is unclear — could be midnight,
could be noon. Mood: silent, surveilled-but-unseen, a place to commit
or witness something terrible without leaving a trace.
Cinematic painterly noir, deep shadows.
```

---

### 节点·C · Mrs Hodge 的笔记本 *（Ch7 通关后，"偷听到的对话"全部解锁）*

**触发**：Ch7.3 通关。
**叙事文字**：

> Mrs Eileen Hodge 给 Ashford Manor 做了三十年管家。
>
> 她有一本墨绿色封皮的小本子，从不离身。
>
> 她说：「我并不偷听，先生。
> 只是有些话——客人们觉得在饭桌上轻声说就没人听到。
> 但厨房进出的脚步、玻璃杯放下的间隙、椅子挪动——
> 总有些瞬间，话会突然清晰。我只记下来。」
>
> 三十年间，她从未把那个本子给任何人看过。
>
> 直到今天。

**GPT Image2 提示词**：

```
SCENE: Close-up cinematic still life shot of an old hardcover green
cloth-bound notebook lying open on a scrubbed wooden kitchen table.
The pages are filled with neat copperplate cursive handwriting in
black fountain pen, with dates and times in the margins (visible
dates: "Sat 19 Oct 2024 — Dining Hall — 21:40 Dr Wright to Mr B."
etc., partially blurred, the SPECIFIC content not clearly readable
to the viewer). A few dried tea stains on one corner. A tortoiseshell
fountain pen lies beside the notebook with the cap off. A small lace
doily, a half-drunk cup of black tea in a chipped china cup with a
matching saucer, a sprig of dried lavender. A worn pair of reading
glasses folded next to the cup. The light is soft, late-morning,
filtering through a kitchen window from camera-left. NO PEOPLE
visible — just the still life. The mood is intimate, private,
secrets being preserved. Cinematic painterly photography. Top-down
or three-quarter angle. BBC mystery aesthetic.
```

---

### 节点·D · 档案室深处 *（Ch8 通关后，Eleanor 的"安静"被放大）*

**触发**：Ch8.3 通关。
**叙事文字**：

> 二楼最东侧的档案室。
> 没有监控。没有公开访客记录。
> 庄园里唯一一个房间——只有 Elias 本人和"授权传记作者" Eleanor Wright 能进。
>
> Eleanor 用了三年。
>
> 三年时间，她翻遍了 Blackwood 家族的每一页旧信、每一本旧账、
> 每一张她不被允许带走的领养记录。
>
> 她做这一切的时候，没有人怀疑她。
>
> 她是写传记的。
> 她当然要看这些。

**GPT Image2 提示词**：

```
SCENE: Cinematic interior shot of a private manor archive room — an
attic-converted study lined floor-to-ceiling with custom oak filing
cabinets, glass-fronted bookshelves, and antique map drawers. A single
desk in the center is buried under stacks of yellowed manila folders,
old leather diaries, faded photographs splayed out, a magnifying lamp
on an articulated arm, and a thick reference book about adoption
records open on a stand. The room is empty of people, but a chair
is pulled out slightly and a tea cup has gone cold on the desk corner —
someone was here recently and left abruptly. A small banker's lamp is
still on, casting a tight cone of amber light over the open papers.
The rest of the room is in deep blue shadow. Through a single narrow
window at the far end, predawn light is just beginning to glow.
A small antique key sits on top of one of the folders. The atmosphere
is one of obsessive, methodical, years-long research — a project
finished or about to be detonated. Cinematic painterly noir.
```

---

### 节点·E · 揭示瞬间 · Margaret 的脸 *（Ch9 通关，封存记录浮出水面）*

**触发**：Ch9.3 通关，家族树红色虚线手绘完成的同时播放。
**叙事文字**：

> Margaret Blackwood。
> 一九六四年生，一九八六年死。
> 二十二岁。
>
> 她的死因记录在郡医院档案里只有四个字——
> *self-inflicted*.
>
> 在她死前六年的某个春天，
> 十六岁的 Margaret 在 Cotswolds 小屋里生下了一个女孩。
>
> 那年是一九八〇年。
>
> 那个女孩——
> 四十四年后，坐在档案室里翻找自己生母的所有作品。
>
> 三年时间。
>
> 现在，她终于把所有东西都找齐了。

**GPT Image2 提示词**（这张图最重要——必须有"美丽 + 悲剧"的双重质感）：

```
SCENE: Cinematic medium portrait of MARGARET BLACKWOOD as a young woman
in 1985, age 21, one year before her suicide. She sits in profile at a
small wooden writing desk in a cottage interior. She has long dark wavy
hair, pale fine features, sad intelligent grey eyes. She wears a simple
cream Aran sweater and a long charcoal skirt. She is writing in a
hardcover notebook with a fountain pen, her hand small and graceful.
Beside her on the desk: a vase of dried autumn wildflowers, a worn
hardcover copy of Virginia Woolf's "A Room of One's Own", and a single
photograph face-down (a glimpse of a baby's hand visible at the edge —
the only suggestion of her child). The cottage window behind her shows
a misty Cotswolds field at golden hour. The image has the very faint
quality of an old photograph — slightly faded warm tones, subtle film
grain, white-margined "Polaroid" framing IF natural. She is NOT looking
at the camera. Mood: melancholic, gifted, alone, on the brink of being
lost to history. NO MAKEUP, NO GLAMOUR, JUST QUIET BEAUTY. The image
should feel like a still from a Merchant Ivory production of the late
1980s. Aspect ratio 3:4 (slightly portrait, suitable for framed photo).
```

**附加图**：如果可以，再生成一张 `cutscenes/E-margaret-handwriting.jpg` 的笔迹特写——Margaret 字迹的近景，写在泛黄的纸上，最后一行字迹颤抖到几乎不可辨。这张是 Ch11 结案献辞页的视觉点睛。

---

### 节点·F · Elias 的最后字句 *（Ch10 通关，Memo 解密瞬间）*

**触发**：Ch10.2 通关，文档打字机解密完成的同时播放一张静帧。
**叙事文字**：

> 凌晨零点三十八分。
>
> Elias 坐在书桌前，给自己写一张便条——
> 不为发给任何人，只为整理自己的想法。
>
> 「**Eleanor coming in 10 min. She knows. We will settle this.**
> **她有权利问。她没有权利毁了我。 —E.B.**」
>
> 他按下了 ⌘+S。
>
> 然后，自动保存系统忠实地在云端备份了这个文件——
> 连同它的预览图。
>
> 十三分钟后，
> 这个文件在他自己的笔记本上被删除。
>
> 那时候他已经死了至少三分钟。

**GPT Image2 提示词**：

```
SCENE: Extreme close-up cinematic still of an open silver MacBook
laptop on a dark mahogany desk. The screen shows a Scrivener text-
editor window with a single document open titled "Memo_PersonalNote.scriv"
The visible text in the document, in serif body font (rendered legibly
but slightly out of perfect focus, so the viewer reads with effort):

  "Eleanor coming in 10 min.
   She knows.
   We will settle this.
   Three years of her work,
   my biography — she has been
   looking for something.
   After tonight she will be told.
   She has a right to ask.
   She does not have a right to
   ruin me.

                          — E.B."

The cursor blinks at the end of the text. A small green-shaded
banker's lamp at the desk's edge casts amber light over the keyboard.
A man's hand (only partially visible, just fingers) is resting on
the trackpad — but the position is unnaturally still, slightly angled
wrong. Around the laptop on the desk: a half-finished whisky glass,
a fountain pen, a sealed envelope addressed "M.B. — 1985".
The rest of the room is in deep shadow. Time stamp at top of screen
reads "00:38". Mood: intimate, terrible, the moment before everything
ends. Cinematic painterly noir.
```

---

### 节点·G · 案件关闭 · 三个月后 *（Ch11 通关 + 结案报告之后的尾声）*

**触发**：玩家点击结案报告的 [关闭] 按钮后，**强制播放**这段终幕。
**叙事文字**：

> 三个月后。
>
> 二〇二五年一月。
>
> Whittaker & Hayes 出版社在伦敦发布了一本薄薄的小书。
> 封面是手绘的，一只张翅的隼，下面写着——
>
> *Notebooks 1983–1986*
> *by Margaret Blackwood*
>
> 扉页献辞：
>
> *"For my mother. 1964 — 1986."*
>
> 那本书卖了八千册。
> 没有任何 Blackwood 家族成员出现在新闻发布会上。
>
> 同一个月，
> Eleanor Wright 在 Bristol Crown Court 被起诉为二级谋杀罪。
> 她没有请辩护律师。
>
> 庭审记录第三十一页，她对法官说了一句话——
>
> 「他用了她三十八年。我只用了他一个晚上。」
>
> 然后她沉默了。
>
> 法官记录在案的最后一句话是：
> 「被告，请坐下。」

**GPT Image2 提示词**：

```
SCENE: A composite cinematic still — slightly painterly editorial
photography. The composition is split into two halves of the frame
by depth-of-focus rather than a hard line:

LEFT/FOREGROUND: A small published hardcover book lying on a worn
wooden table, dust jacket cream-colored with simple typography:

  "Notebooks 1983–1986
   Margaret Blackwood
   Whittaker & Hayes · 2025"

The book is slightly open, showing the title page with a hand-drawn
ink illustration of a falcon with wings spread (echoing the bronze
bookend motif from the case). Beside the book: a single white camellia
flower laid as memorial, a folded London Review of Books with a
visible review titled "The Voice We Lost", a pair of horn-rim reading
glasses.

RIGHT/BACKGROUND (out of focus): A formal Victorian-era English
courtroom — empty wooden benches, the high judge's dais visible,
high windows letting in dim grey light. The defendant's box stands
empty in the middle distance.

The two halves are connected by the light direction (cold North-
facing morning light) and the muted palette of cream, charcoal,
oxblood, and aged gold. NO PEOPLE visible. Mood: aftermath, the
weight of consequence, justice without satisfaction. Cinematic
painterly editorial, like a Sunday Times Magazine cover photo.
Aspect ratio 16:9.
```

---

## Part 3 · 实施清单

### 你需要生成的图片清单（共 9 张新图 + 复用 4 张旧图）

| 编号 | 文件名 | 用途 | 状态 |
|---|---|---|---|
| S01 | `portraits/Manor.png` | 序章·1 | ✅ 已有 |
| S02 | `cutscenes/S02-police-arrival.jpg` | 序章·2 警车 | 🆕 待生成 |
| S03 | `cutscenes/S03-sarah-discovery.jpg` | 序章·3 秘书发现 | 🆕 待生成 |
| S04 | `cutscenes/S04-the-study.jpg` | 序章·4 案发现场 | 🆕 待生成（也可复用 Study.png） |
| S05 | `cutscenes/S05-brennan-arrives.jpg` | 序章·5 Brennan 抵达 | 🆕 待生成 |
| S06 | `cutscenes/S06-brennan-desk.jpg` | 序章·6 指挥所 | 🆕 待生成 |
| A | `cutscenes/A-marcus-drunk.jpg` | 节点 A Marcus 醉态 | 🆕 待生成 |
| B | `cutscenes/B-corridor-deadzone.jpg` | 节点 B 信号盲区走廊 | 🆕 待生成 |
| C | `cutscenes/C-hodge-notebook.jpg` | 节点 C 管家笔记本 | 🆕 待生成 |
| D | `cutscenes/D-archive-room.jpg` | 节点 D 档案室深处 | 🆕 待生成 |
| E | `cutscenes/E-margaret-1985.jpg` | 节点 E Margaret 肖像 | 🆕 **最重要** |
| F | `cutscenes/F-elias-laptop-memo.jpg` | 节点 F 死前便条 | 🆕 待生成 |
| G | `cutscenes/G-book-and-courtroom.jpg` | 节点 G 终幕复合图 | 🆕 待生成 |

### 工作流程

1. **你**：把每段的"GPT Image2 提示词"（连同顶部风格锚）粘进 GPT Image2，生成图片
2. **你**：把图片下载到 `C:\Users\yaoke\Downloads\SQL\cutscenes\` 目录，按上面表的文件名命名
3. **你**：告诉我"图片已上传"
4. **我**：扩展 `story.js` 的 scene 系统，把每段播片接入对应触发点
5. **我**：测试并调整节奏

### 文字风格说明（仅供你参考）

我写的中文叙事文字**保持以下规则**：
- 用**逗号 + 换行**强调节奏（像电影剧本的节拍）
- **避免感叹号**——侦探小说不用感叹号，悬念靠句号的重量撑
- 关键名词加粗或斜体（在 markdown 里）
- 第三人称叙事，**克制、冷静、像旁白**
- 关键的"案件事实"用**陈述句**呈现，不带感情色彩
- 角色对白用 **「」**（中文方角引号），不用 ""

如果你觉得某段文字太冷／太热／要不要更长，告诉我具体哪段，我重写。

---

## 一句话总结

**13 段播片 + 9 张新图，把一份'SQL 题库'变成一部 90 分钟的英国侦探剧。**

你先去 GPT Image2 生成图片，每张给我一句简单回执（如"S02 已生成"）。等你全部生成完，我把 13 段播片接进游戏，节奏调到位。

每段播片的"按 ENTER 推进"、"自动播放下一段"、"跳过整段"按钮我都会做好——玩家既可以慢慢沉浸看完，也可以一键略过。
