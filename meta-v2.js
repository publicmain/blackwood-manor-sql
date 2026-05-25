// ============================================================
// Blackwood Manor v2 — Task script
// Each task = one 布伦南 beat: intro dialogue + the SQL the
// player must satisfy + 布伦南's outro. Tasks chain linearly;
// completing all 29 tasks closes the case.
// ============================================================

window.BMM2_TASKS = [
  // ---------- Ch 0 · Tutorial ----------
  {
    id: "0.1", chapter: 0, step: 1,
    title: "把工具拿熟",
    task: "庄园的数据库已经接进你的终端了。先做一件最简单的事：数一数 Persons 表里一共有多少人。",
    hint: `SELECT COUNT(*) FROM Persons;
没什么花样。把数字调出来就行。`,
    starter: `-- 先熟悉工具。
-- 数一数案件库里有多少人。

SELECT COUNT(*) FROM Persons;`,
    brennanIntro:
`在我们开始之前——你得熟悉手里的工具。
庄园的数据库我已经接进你那台终端了。先做件最简单的事：数一数库里一共有多少个人。
SELECT COUNT(*) FROM Persons。`,
    brennanOutro:
`十八个。家人、员工、宾客、还有死者。
好。可以正经工作了。`,
    grade: { anyQuery: true }, // any successful query passes Ch0
    rewards: { score: 5 }
  },

  // ---------- Ch 1 · 嫌疑人名册 ----------
  {
    id: "1.1", chapter: 1, step: 1,
    title: "找出昨晚的 Guest",
    task: "告诉我昨晚住在这里的 Guest 都是谁。Persons 表，PersonType = 'Guest'。我要看见七个名字。",
    hint: `Persons 表里 PersonType 字段。
SELECT FullName FROM Persons WHERE PersonType = '...';
应该返回 7 行。`,
    starter: `-- 第一件正经事。把昨晚的 Guest 名单调出来。
-- Persons 表 PersonType 字段记录身份。

SELECT FullName, Age, Occupation
FROM Persons
WHERE PersonType = '...';`,
    brennanIntro:
`正经第一件事。告诉我昨晚住在这里的 'Guest' 都是谁。Persons 表。PersonType = 'Guest'。
我要看见七个名字。`,
    brennanOutro:
`七个。这就是嫌疑池。
完整档案都归到你左边那栏了。点开看，但别指望现在能挖出什么——他们都还活着的时候没什么意思。死了一个之后才有。`,
    grade: { rows: 7, anyContains: "埃莉诺·赖特" },
    rewards: { score: 10 }
  },

  // ---------- Ch 2 · 死亡时间窗 ----------
  {
    id: "2.1", chapter: 2, step: 1,
    title: "ToD 内通过书房门禁的人",
    task: "法医把死亡时间锁定在 00:30 到 01:30 之间。我要知道这段时间里，谁通过了书房的门禁。Room 103。KeycardAccess 表。",
    hint: `WHERE RoomID = 103 AND AccessTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30'
应返回 2 行——一进一出。`,
    starter: `-- ToD 窗口：00:30 – 01:30
-- 谁的卡片碰过书房 (RoomID = 103) 读卡器？
-- 注意：时间要写完整日期，格式 '2024-10-20 00:30'

SELECT PersonID, AccessTime, AccessType
FROM KeycardAccess
WHERE RoomID = ___
  AND AccessTime BETWEEN '2024-10-20 ___' AND '2024-10-20 ___'
ORDER BY AccessTime;`,
    brennanIntro:
`法医刚把死亡时间窗锁在凌晨零点半到一点半。一小时。
我要知道这段时间里，谁通过书房的门禁。Room 103。KeycardAccess 表。`,
    brennanOutro:
`七号。把这个号码拿到 Persons 表里一翻——埃莉诺·赖特，传记作者，四十四岁，剑桥出身，有书房权限。
死亡时间窗那整整一个钟头，进出书房的门禁卡只有她这一张：零点四十八进，一点零二出。
但别急着给她定罪。门禁卡只证明"她到过现场"，不证明"她动了手"——在场的人，可能是凶手，也可能只是最后见到死者的人。
有了机会，还缺动机。下一步：查一查，谁怕这个人活着。`,
    grade: { rows: 2, anyContains: "2024-10-20 00:48" },
    rewards: { score: 10 }
  },

  // ---------- Ch 3 · 暗夜短讯（三步）----------
  {
    id: "3.1", chapter: 3, step: 1,
    title: "动机筛 · 含「毁」「失去」的短信",
    task: "周六到周日凌晨的电话短信。把含有「毁」或「失去」的短信调出来。标准的动机筛。",
    hint: `LIKE 配 % 通配，OR 接两个条件。
WHERE Content LIKE '%毁%' OR Content LIKE '%失去%'`,
    starter: `-- 动机筛：在 PhoneRecords.Content 里找「毁」/「失去」

SELECT FromPersonID, Content
FROM PhoneRecords
WHERE Content LIKE '%___%'
   OR Content LIKE '%___%';`,
    brennanIntro:
`电话短信。周六到周日凌晨。
我标准的动机筛——把含有「毁」或「失去」的短信调出来。`,
    brennanOutro:
`马库斯。两条。都给前妻。"他要毁了我。" 二十二年的合同，要被他一笔勾掉。
但 马库斯 不是凶手——他在 ToD 之前就走了。这是动机不是手段。`,
    grade: { rows: 2, anyContains: "毁" },
    rewards: { score: 10 }
  },
  {
    id: "3.2", chapter: 3, step: 2,
    title: "含「今夜」的短信",
    task: "把含「今夜」的所有短信再翻一遍。我想知道谁那晚有计划。",
    hint: `WHERE Content LIKE '%今夜%'
找的是一条 22:48 发出的短信。`,
    starter: `-- 含「今夜」的短信。

SELECT FromPersonID, StartTime, Content
FROM PhoneRecords
WHERE Content LIKE '%___%';`,
    brennanIntro:
`再追一条。把含「今夜」的所有短信翻出来。我想知道谁那晚有计划。`,
    brennanOutro:
`埃莉诺。她 22:48 发出："就在今夜。我什么都准备好了。最后几页。"
但是再翻她当天**全部**的短信——别只看晚上的。`,
    grade: { anyContains: "今夜" },
    rewards: { score: 8 }
  },
  {
    id: "3.3", chapter: 3, step: 3,
    title: "埃莉诺 当天全部短信",
    task: "埃莉诺 当天的全部短信——下午和晚上的都要。FromPersonID = 7。",
    hint: `WHERE FromPersonID = 7
应有 2 条。其中一条 14:22 的提到日记本。`,
    starter: `-- 埃莉诺 全天的短信。FromPersonID = 7.

SELECT StartTime, Content
FROM PhoneRecords
WHERE FromPersonID = ___;`,
    brennanIntro:
`再细。把 埃莉诺 当天**全部**的短信调出来。别只看晚上的。`,
    brennanOutro:
`下午两点二十二："我会带上那本日记。当着我的面，他抵赖不了。"
日记本？谁的日记本？她不是在写他的传记吗？
标记她。我们之后回来。`,
    grade: { anyContains: "日记" },
    rewards: { score: 8 }
  },

  // ---------- Ch 4 · 酒窖的诡影（五步）----------
  {
    id: "4.1", chapter: 4, step: 1,
    title: "酒窖访问次数",
    task: "酒窖。周六到周日凌晨三点之间一共开过多少次？算个数。",
    hint: `SELECT COUNT(*) FROM WineCellarLog;
就这么简单。`,
    starter: `-- 酒窖被进了多少次？

SELECT ___(*) FROM WineCellarLog;`,
    brennanIntro:
`酒窖。周六到周日凌晨三点之间一共开过多少次？算个数。`,
    brennanOutro:
`八次。按人分一下。`,
    grade: { rows: 1, firstColEquals: 8 },
    rewards: { score: 8 }
  },
  {
    id: "4.2", chapter: 4, step: 2,
    title: "按人聚合酒窖访问",
    task: "按人分组。每个人取了几次酒？JOIN Persons + WineCellarLog，GROUP BY 取酒者。",
    hint: `SELECT FullName, COUNT(*) AS Trips FROM WineCellarLog w JOIN Persons p ON p.PersonID = w.TakenByPersonID GROUP BY w.TakenByPersonID;`,
    starter: `-- 按人聚合：每个人取酒几次？

SELECT p.FullName, COUNT(*) AS Trips
FROM WineCellarLog w
JOIN Persons p ON p.PersonID = ___
GROUP BY w.TakenByPersonID
ORDER BY Trips DESC;`,
    brennanIntro:
`把它按取酒者分一下。每个人去过几次。`,
    brennanOutro:
`厨师六次——正常，备餐。薇薇安 一次——凌晨四十六分。
等等。她那时候应该在床上。她拿了什么？`,
    grade: { anyContainsCI: "薇薇安" },
    rewards: { score: 8 }
  },
  {
    id: "4.3", chapter: 4, step: 3,
    title: "薇薇安 取走了什么酒",
    task: "薇薇安 取的是哪瓶酒？JOIN WineCellarLog + WineBottles，WHERE 取酒者 = 2。",
    hint: `WHERE w.TakenByPersonID = 2 - 看 Label。`,
    starter: `-- 薇薇安 拿走的酒款。

SELECT b.Label, b.Vintage, b.ShelfLocation, w.AccessTime
FROM WineCellarLog w
JOIN WineBottles b ON b.BottleID = ___
WHERE w.TakenByPersonID = ___;`,
    brennanIntro:
`查 薇薇安 拿的是哪瓶。`,
    brennanOutro:
`Pétrus 1998。A-08 货架。市价过万英镑。
单瓶位。凌晨四十六分，**正在 ToD 窗口**，下到地下酒窖，拿一瓶超贵的酒。
她之后给谁发了短信？`,
    grade: { anyContainsCI: "Pétrus" },
    rewards: { score: 8 }
  },
  {
    id: "4.4", chapter: 4, step: 4,
    title: "薇薇安 之后发的短信",
    task: "薇薇安 接下来发了什么短信？FromPersonID = 2，按时间升序。",
    hint: `WHERE FromPersonID = 2 ORDER BY StartTime - 看最后一条。`,
    starter: `-- 薇薇安 当晚的短信。

SELECT StartTime, ToName, Content
FROM PhoneRecords
WHERE FromPersonID = ___
ORDER BY StartTime;`,
    brennanIntro:
`薇薇安 之后发了什么短信？`,
    brennanOutro:
`凌晨 00:54，她给律师发了："已经取回。那份草约重新回到我手里了。"
"取回"——是"它"，单数。她拿的不是酒。她拿的是藏在酒窖里的东西。
哪份合同？查 Contracts 表。`,
    grade: { anyContains: "取回" },
    rewards: { score: 8 }
  },
  {
    id: "4.5", chapter: 4, step: 5,
    title: "草稿合同",
    task: "查 Contracts 表，状态是 'Draft' 的合同。哪份在威胁 薇薇安？",
    hint: `WHERE Status = 'Draft' - 找标题包含「庄园」的那条。`,
    starter: `-- 找草稿合同。

SELECT Title, Counterparty, Amount, Notes
FROM Contracts
WHERE Status = '___';`,
    brennanIntro:
`查 Contracts 表。Draft 状态。哪份合同动了她的根？`,
    brennanOutro:
`一份「庄园终身使用权出售给 AlphaCorp 酒店集团」的草约。四百五十万英镑。
伊莱亚斯 准备把庄园使用权卖给酒店集团。薇薇安 会失去全部住居权。
她偷了草稿，藏在酒窖，今晚下去取回。她有动机——但她没杀人。她在 ToD 期间一直在酒窖和卧室。
标记她"已排除"。回头看下一个。`,
    grade: { anyContainsCI: "AlphaCorp" },
    rewards: { score: 10 }
  },

  // ---------- Ch 5 · 借阅卡上的痕迹（三步）----------
  {
    id: "5.1", chapter: 5, step: 1,
    title: "图书借阅 · 按人聚合",
    task: "图书馆。过去六个月所有借阅记录。借得最多的是谁？JOIN Persons + LibraryCheckouts，GROUP BY 借阅人，按次数降序。",
    hint: `SELECT p.FullName, COUNT(*) AS Borrowings FROM LibraryCheckouts lc JOIN Persons p ON p.PersonID = lc.PersonID GROUP BY lc.PersonID ORDER BY Borrowings DESC;
首行应该是 埃莉诺·赖特。`,
    starter: `-- 谁泡图书馆？借得最多。

SELECT p.FullName, COUNT(*) AS Borrowings
FROM LibraryCheckouts lc
JOIN Persons p ON p.PersonID = ___
GROUP BY lc.PersonID
ORDER BY Borrowings DESC;`,
    brennanIntro:
`图书馆。过去六个月所有借阅记录。
借得最多的是谁？`,
    brennanOutro:
`埃莉诺 八次，朱利安 六次，艾莉丝 四次。
埃莉诺 当头——意料之中，她在写传记。
但她到底借了什么。`,
    grade: { firstColEquals: "埃莉诺·赖特" },
    rewards: { score: 10 }
  },
  {
    id: "5.2", chapter: 5, step: 2,
    title: "埃莉诺 借了什么",
    task: "埃莉诺 借了什么书？JOIN LibraryCheckouts + Books，WHERE 借阅人 = 7。",
    hint: `WHERE lc.PersonID = 7
看 Title 列。玛格丽特的手稿、领养记录、剽窃相关的法律书都该出现。`,
    starter: `-- 埃莉诺 借出的书。

SELECT b.Title, b.Author, lc.CheckoutDate, lc.ReturnDate
FROM LibraryCheckouts lc
JOIN Books b ON b.BookID = ___
WHERE lc.PersonID = ___;`,
    brennanIntro:
`细看 埃莉诺 借的书。JOIN Books。`,
    brennanOutro:
`玛格丽特·布莱克伍德 的手稿。一份《格洛斯特郡领养记录 1975-1985》。一本讲剽窃与著作权的法律书。玛格丽特 一九八三到八六的封存日记。
还有《沉默时刻》——他的成名作。案发前四天借的。
这不是传记研究。这是案件准备。`,
    grade: { anyContainsCI: "玛格丽特" },
    rewards: { score: 10 }
  },
  {
    id: "5.3", chapter: 5, step: 3,
    title: "艾莉丝 借了什么",
    task: "艾莉丝 借了什么？她是 2023 年获奖者。WHERE 借阅人 = 5。",
    hint: `WHERE lc.PersonID = 5
她重复借了一本书——三次。`,
    starter: `-- 艾莉丝 借出的书。

SELECT b.Title, lc.CheckoutDate
FROM LibraryCheckouts lc
JOIN Books b ON b.BookID = ___
WHERE lc.PersonID = ___;`,
    brennanIntro:
`艾莉丝 借了什么？`,
    brennanOutro:
`《沉默时刻》三次。《剽窃与著作权》一次。
两个互不认识的女人，独立行动，对同一本书着迷，研究同一种法律问题。
标记她们两个。`,
    grade: { anyContains: "沉默时刻" },
    rewards: { score: 8 }
  },

  // ---------- Ch 6 · 行迹交错（三步，最后触发仪式）----------
  {
    id: "6.1", chapter: 6, step: 1,
    title: "马库斯 的刷卡时间线",
    task: "我得证明 马库斯 不是。马库斯 的完整刷卡时间线。INNER JOIN 三表：Persons + KeycardAccess + Rooms。",
    hint: `三表 JOIN。WHERE p.FullName = '马库斯·索恩' ORDER BY k.AccessTime;
应返回 8 行（包括 19:05 进餐厅那条）。`,
    starter: `-- 马库斯 那晚都去过哪？

SELECT p.FullName, k.AccessTime, r.Name, k.Notes
FROM KeycardAccess k
JOIN Persons p ON ___ = ___
JOIN Rooms r ON ___ = ___
WHERE p.FullName = '马库斯·索恩'
ORDER BY k.AccessTime;`,
    brennanIntro:
`我得证明 马库斯 不是。马库斯 完整时间线。INNER JOIN 三个表：Persons、KeycardAccess、Rooms。`,
    brennanOutro:
`宴会厅 → 客厅 → 东翼走廊 → 书房（拒）→ 书房（进）→ 离开 → 厨房 → 自己房间。
零点十七分回房。但他可能再溜出来。看他手机 WiFi。`,
    grade: { rows: 8, anyContains: "马库斯·索恩" },
    rewards: { score: 12 }
  },
  {
    id: "6.2", chapter: 6, step: 2,
    title: "马库斯 的 Wi-Fi 时间线",
    task: "马库斯 的全部 Wi-Fi 会话。JOIN WiFiSessions + Rooms，WHERE PersonID = 4。",
    hint: `WHERE w.PersonID = 4 ORDER BY w.StartTime;
看 EndTime 列——他长时间停在 301。`,
    starter: `-- 马库斯 的 Wi-Fi 会话。

SELECT w.StartTime, w.EndTime, r.Name AS AP, w.DataMB
FROM WiFiSessions w
JOIN Rooms r ON r.RoomID = w.APRoomID
WHERE w.PersonID = ___
ORDER BY w.StartTime;`,
    brennanIntro:
`他可能溜回去。看他手机 WiFi。`,
    brennanOutro:
`零点十八连上自己房间的 AP，一直到凌晨两点半。两个多小时不动。
他在喝酒发短信。**他没出过房间。** 马库斯 排除。
现在 埃莉诺 的 WiFi。`,
    grade: { anyContains: "00:18", anyContainsCI: "马库斯" },
    rewards: { score: 10 }
  },
  {
    id: "6.3", chapter: 6, step: 3, ritual: "ch6",
    title: "埃莉诺 的 Wi-Fi 时间线",
    task: "埃莉诺 的全部 Wi-Fi 会话。JOIN WiFiSessions + Rooms，WHERE PersonID = 7。",
    hint: `WHERE w.PersonID = 7
看相邻两条之间的 gap。`,
    starter: `-- 埃莉诺 的 Wi-Fi 会话。

SELECT w.StartTime, w.EndTime, r.Name AS AP, w.DataMB
FROM WiFiSessions w
JOIN Rooms r ON r.RoomID = w.APRoomID
WHERE w.PersonID = ___
ORDER BY w.StartTime;`,
    brennanIntro:
`现在 埃莉诺。她的 Wi-Fi。`,
    brennanOutro:
`二十三点十六分连档案室 AP。零点二十八分掉线。
之后——空白。
零点二十八到凌晨一点三十五。**六十七分钟。** 整个 ToD 窗口她的手机不在任何 AP 上。
她在哪？
......
把这个钉到白板上。最显眼的位置。`,
    brennanMood: `*[布伦南 在笔记本上画了一道线]*`,
    grade: { anyContainsCI: "埃莉诺", anyContains: "00:28" },
    rewards: { score: 15 }
  },

  // ---------- Ch 7 · 餐桌上的密语（三步）----------
  {
    id: "7.1", chapter: 7, step: 1,
    title: "Saturday 晚宴座次",
    task: "先看座次。SeatingChart + Persons，按 SeatNo 升序。",
    hint: `JOIN Persons ON p.PersonID = s.PersonID ORDER BY s.SeatNo;`,
    starter: `-- 周六晚宴座次。

SELECT s.SeatNo, p.FullName
FROM SeatingChart s
JOIN Persons p ON p.PersonID = s.PersonID
ORDER BY s.SeatNo;`,
    brennanIntro:
`周六晚宴。先看座次。`,
    brennanOutro:
`尴尬。前妻和现妻分坐 伊莱亚斯 两侧。
霍奇太太 的笔记本——她把听到的全记下来了。把全部对话调出来。`,
    grade: { rows: 8, anyContains: "伊莱亚斯·布莱克伍德" },
    rewards: { score: 8 }
  },
  {
    id: "7.2", chapter: 7, step: 2,
    title: "全部偷听对话",
    task: "Conversations 表全部。JOIN Persons 两次（说话人 + 听话人）+ Rooms。按 SpokenTime 升序。",
    hint: `JOIN Persons sp ON sp.PersonID = c.SpeakerID
LEFT JOIN Persons ls ON ls.PersonID = c.ListenerID
JOIN Rooms r ON r.RoomID = c.RoomID
应返回 10 行。`,
    starter: `-- 全部偷听到的对话。

SELECT c.SpokenTime, sp.FullName AS Speaker,
       ls.FullName AS Listener, r.Name AS Room, c.Snippet
FROM Conversations c
JOIN Persons sp ON ___ = ___
LEFT JOIN Persons ls ON ___ = ___
JOIN Rooms r ON ___ = ___
ORDER BY c.SpokenTime;`,
    brennanIntro:
`霍奇太太 的笔记本——她把听到的全记下来了。把全部对话调出来。`,
    brennanOutro:
`埃莉诺 对 伊莱亚斯，二十一点四十："今夜，宴会之后。档案室。什么都不要带。"
然后 伊莱亚斯 对 埃莉诺，二十二点三十，走廊上："你以为大理石牌子上刻了个名字，就算家人了。不是的。"
她说我是家人。他说不是。`,
    grade: { rows: 10, anyContains: "2024-10-19 16:20" },
    rewards: { score: 12 }
  },
  {
    id: "7.3", chapter: 7, step: 3,
    title: "伊莱亚斯 当晚所有发言",
    task: "伊莱亚斯 当晚说的话**全部**调出来。WHERE c.SpeakerID = 1。",
    hint: `WHERE c.SpeakerID = 1
应有 3 行。三个不同对话对象。`,
    starter: `-- 伊莱亚斯 当晚说的所有话。

SELECT c.SpokenTime, ls.FullName AS ToWhom, r.Name AS Room, c.Snippet
FROM Conversations c
LEFT JOIN Persons ls ON ls.PersonID = c.ListenerID
JOIN Rooms r ON r.RoomID = c.RoomID
WHERE c.SpeakerID = ___
ORDER BY c.SpokenTime;`,
    brennanIntro:
`伊莱亚斯 当晚说的话**全部**调出来。`,
    brennanOutro:
`三句话。
对 朱利安："我不觉得你有那种天分。"
对 马库斯："别得寸进尺。"
对 埃莉诺："名字刻在牌子上，不等于你就是家人。"
他在挑衅每个人。但对 埃莉诺 那句——「家人」——很具体。
标记她。我们之后必须查家族记录。`,
    grade: { rows: 3, anyContains: "大理石" },
    rewards: { score: 10 }
  },

  // ---------- Ch 8 · 沉默的房间（三步）----------
  {
    id: "8.1", chapter: 8, step: 1,
    title: "无 CCTV 的房间",
    task: "监控。哪些房间根本没装 CCTV？Rooms 表，HasCCTV = 0。",
    hint: `WHERE HasCCTV = 0`,
    starter: `-- 没装 CCTV 的房间。

SELECT RoomID, Name, Wing, Floor
FROM Rooms
WHERE HasCCTV = ___;`,
    brennanIntro:
`监控。哪些房间根本没装 CCTV？`,
    brennanOutro:
`书房。档案室。连接两者的走廊。
任何人从档案室经连接门进书房——完全不会被录。`,
    grade: { anyContainsCI: "书房" },
    rewards: { score: 8 }
  },
  {
    id: "8.2", chapter: 8, step: 2,
    title: "被删除的 CCTV",
    task: "有哪些 CCTV 录像是被删除的？CCTVFiles 表，FileStatus = 'Deleted'。把删除者也 JOIN 出来。",
    hint: `WHERE FileStatus = 'Deleted'
JOIN Persons ON p.PersonID = c.DeletedByID
应有 2 行。删除者是 伊莱亚斯 本人。`,
    starter: `-- 被删除的 CCTV 文件。

SELECT c.FileID, r.Name AS Room, c.RecordedStart,
       c.DeletedTime, p.FullName AS DeletedBy
FROM CCTVFiles c
JOIN Rooms r ON r.RoomID = c.RoomID
LEFT JOIN Persons p ON p.PersonID = c.DeletedByID
WHERE c.FileStatus = '___';`,
    brennanIntro:
`有哪些 CCTV 录像是被删除的？`,
    brennanOutro:
`东走廊。零点到两点的两个文件。删除者：**伊莱亚斯 本人。** 零点二十五分删的。
ToD 之前五分钟，他亲手清掉了能看见自己接见客人的录像。
他在为一场不希望被记录的会议做准备。`,
    grade: { rows: 2, anyContainsCI: "伊莱亚斯" },
    rewards: { score: 10 }
  },
  {
    id: "8.3", chapter: 8, step: 3,
    title: "ToD 期间 Wi-Fi 离线的嘉宾",
    task: "ToD 期间，所有嘉宾里谁的 WiFi 完全没活动？LEFT JOIN + IS NULL 经典套路。",
    hint: `SELECT p.FullName FROM Persons p
LEFT JOIN WiFiSessions w
  ON w.PersonID = p.PersonID
  AND w.StartTime < '2024-10-20 01:30'
  AND (w.EndTime > '2024-10-20 00:30' OR w.EndTime IS NULL)
WHERE p.PersonType = 'Guest' AND w.SessionID IS NULL;`,
    starter: `-- ToD 期间 (00:30–01:30) 完全没 Wi-Fi 活动的嘉宾。

SELECT p.FullName
FROM Persons p
LEFT JOIN WiFiSessions w
  ON w.PersonID = p.PersonID
  AND w.StartTime < '2024-10-20 01:30'
  AND (w.EndTime > '2024-10-20 00:30' OR w.EndTime IS NULL)
WHERE p.PersonType = '___'
  AND w.SessionID IS ___;`,
    brennanIntro:
`ToD 期间，所有嘉宾里谁的 WiFi 完全没活动？`,
    brennanOutro:
`埃莉诺 和 亨里克。两个人，整个 ToD 都不在 WiFi 上。
断网不等于有罪——但也不等于清白。"大概在睡觉"这种话我不接受。
下一步：把剩下每一个人的位置都钉死。能查证的不在场证明，我才认。`,
    grade: { rows: 2, firstColIn: ["埃莉诺·赖特", "亨里克·沃尔科夫"] },
    rewards: { score: 12 }
  },
  {
    id: "8.4", chapter: 8, step: 4,
    title: "逐一排除其余宾客",
    task: "把 ToD 窗口（00:30–01:30）里所有人的门禁记录全摊开。除了 埃莉诺，没有任何人的卡碰过书房。",
    hint: `不要按 RoomID 过滤——这次要看全部房间。
WHERE k.AccessTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30'
JOIN Persons + Rooms，ORDER BY AccessTime。`,
    starter: `-- ToD 窗口内的每一条门禁。谁在哪个房间？
-- 时间要写完整日期，格式 '2024-10-20 00:30'

SELECT p.FullName, r.Name AS Room, k.AccessTime, k.AccessType
FROM KeycardAccess k
JOIN Persons p ON p.PersonID = k.PersonID
JOIN Rooms   r ON r.RoomID   = k.RoomID
WHERE k.AccessTime BETWEEN '2024-10-20 ___' AND '2024-10-20 ___'
ORDER BY k.AccessTime;`,
    brennanIntro:
`8.3 给了我两个断网的人。光靠"没上网"我定不了谁。
换个硬证据——门禁。把 ToD 那一小时里，所有人刷过的每一扇门都摊开。
我要确认：除了 埃莉诺，没有第二个人靠近过书房。`,
    brennanOutro:
`看清楚了。ToD 那一小时，六个人，六个不在场——
朱利安 在 303。他跟 伊莱亚斯 三十年的过节是真的，可过节不等于在场。
艾莉丝 在 302。她被 伊莱亚斯 坑过一笔代笔费，动机也有——而她那条"我看到了什么"我追过了：零点四十八，她隔着东翼中庭看见 埃莉诺 往书房那侧去。她不是嫌疑人，是证人。
薇薇安 在 201 和酒窖之间往返。索菲娅 和 马库斯 在合计离婚的事，跟命案无关。亨里克 整夜在 305，他心里装的是怎么跟疏远的儿子和好。
六个人排干净了。整个 ToD 窗口，**只有 埃莉诺 一个人的卡碰了 Room 103**。
零点四十八进，一点零二出。书房那扇门，那一小时里属于她一个人。`,
    grade: { anyContains: "埃莉诺·赖特", anyContainsCI: "Study" },
    rewards: { score: 14 }
  },

  // ---------- Ch 9 · 名字背后的名字（三步，仪式）----------
  {
    id: "9.1", chapter: 9, step: 1,
    title: "伊莱亚斯 的公开家族",
    task: "家族树。先看 伊莱亚斯 的所有公开亲属。FamilyTree 表，PersonID = 1。JOIN Persons 拿名字。",
    hint: `WHERE ft.PersonID = 1
RecordStatus 这里默认只看 Public 即可。`,
    starter: `-- 伊莱亚斯 的所有公开家族关系。

SELECT p.FullName, ft.RelationType, ft.EffectiveYear
FROM FamilyTree ft
JOIN Persons p ON p.PersonID = ft.RelatedPersonID
WHERE ft.PersonID = ___;`,
    brennanIntro:
`家族树。先看 伊莱亚斯 的所有公开亲属。`,
    brennanOutro:
`父母都已故。前妻 薇薇安。现妻 索菲娅。妹妹 玛格丽特——一九六四到一九八六，自杀，二十二岁。
现在——所有 Parent 关系。每一条。**不要只看 Public 的。**`,
    grade: { anyContainsCI: "玛格丽特" },
    rewards: { score: 8 }
  },
  {
    id: "9.2", chapter: 9, step: 2,
    title: "全部 Parent 关系",
    task: "所有 Parent 关系。FamilyTree.RelationType = 'Parent'。RecordStatus 别只看 Public——封存的也要包括。",
    hint: `WHERE RelationType = 'Parent' AND RecordStatus IN ('Public', 'Sealed_Adoption')
明确写出 'Sealed_Adoption' 才能看到封存记录。`,
    starter: `-- 所有 Parent 关系，含封存档案。

SELECT p1.FullName AS Child, p2.FullName AS Parent,
       ft.RecordStatus, ft.EffectiveYear
FROM FamilyTree ft
JOIN Persons p1 ON p1.PersonID = ft.PersonID
JOIN Persons p2 ON p2.PersonID = ft.RelatedPersonID
WHERE ft.RelationType = '___'
  AND ft.RecordStatus IN ('Public', '___');`,
    brennanIntro:
`所有 Parent 关系。每一条。**不要只看 Public 的。**`,
    brennanOutro:
`看到了。埃莉诺 有两个法定父母——罗伯特 和 Patricia——还有一个**封存的**生母。
继续。把 玛格丽特 作为 Parent 的所有记录调出来。`,
    grade: { anyContainsCI: "Sealed_Adoption" },
    rewards: { score: 10 }
  },
  {
    id: "9.3", chapter: 9, step: 3, ritual: "ch9",
    title: "玛格丽特 是谁的母亲",
    task: "搜 玛格丽特 (PersonID = 14) 作为 Parent 的所有记录。RelatedPersonID = 14，RelationType = 'Parent'。RecordStatus 包含 'Sealed_Adoption'。",
    hint: `WHERE RelatedPersonID = 14 AND RelationType = 'Parent' AND RecordStatus = 'Sealed_Adoption'
应返回 1 行。埃莉诺·赖特。`,
    starter: `-- 谁是 玛格丽特 的子女？

SELECT p.FullName
FROM FamilyTree ft
JOIN Persons p ON p.PersonID = ft.PersonID
WHERE ft.RelatedPersonID = ___
  AND ft.RelationType = '___'
  AND ft.RecordStatus = '___';`,
    brennanIntro:
`搜 玛格丽特 作为 Parent 的所有记录。RelatedPersonID = 14。RelationType = 'Parent'。这一次——明着写 RecordStatus = 'Sealed_Adoption'。`,
    brennanOutro:
`埃莉诺·赖特。一九八〇年。Sealed_Adoption。
埃莉诺 是 玛格丽特 的女儿。玛格丽特 那时候十六岁。六年后她自杀了。
伊莱亚斯 是 玛格丽特 的兄弟。埃莉诺 是他的外甥女。
她当了他三年的传记作者。**他知道她是谁吗？**`,
    brennanMood: `*[布伦南 沉默了几秒。] 把她从"嫌疑"改成"重点嫌疑"。`,
    grade: { rows: 1, firstColEquals: "埃莉诺·赖特" },
    rewards: { score: 18 }
  },

  // ---------- Ch 10 · 被删除的告白（两步，仪式）----------
  {
    id: "10.1", chapter: 10, step: 1,
    title: "伊莱亚斯 的写作日志",
    task: "他的笔记本。Scrivener 自动保存日志。昨晚七点到凌晨两点之间全部。",
    hint: `SELECT * FROM WritingSoftwareLog ORDER BY EventTime;
看 Action 和 FileName 列。`,
    starter: `-- 伊莱亚斯 的写作日志。

SELECT EventTime, Action, FileName, PreviewText
FROM WritingSoftwareLog
ORDER BY EventTime;`,
    brennanIntro:
`他的笔记本。Scrivener 自动保存日志。昨晚七点到凌晨两点之间全部。`,
    brennanOutro:
`二十三点五十，第七章里他写："下个月我将公开……" ——他要公开承认《沉默时刻》里有 玛格丽特 的笔迹。
但往后看一行。零点三十，他存了另一个文件——GalaSpeech_FinalDraft。
"这本书是我的，每一个句子都是……那份回忆录草稿，本就不该离开我的书桌。"
同一个晚上，两份文件，意思正好相反。
第七章是写给 埃莉诺 看的——一个诱饵。颁奖宴上他打算当众反口。
零点三十八他写了张便条，零点五十一便条被删——那时他多半已经死了。`,
    grade: { rows: 8, anyContainsCI: "GalaSpeech_FinalDraft" },
    rewards: { score: 10 }
  },
  {
    id: "10.2", chapter: 10, step: 2, ritual: "ch10",
    title: "速生速灭的文件",
    task: "找出所有创建后 15 分钟内被删的文件。子查询或 EXISTS。",
    hint: `SQLite 时间相减：(julianday(d.EventTime) - julianday(s.EventTime)) * 24 * 60 是分钟数。
对每条 'Delete' 找同 FileName 的 'Save' 在 15 分钟内的。`,
    starter: `-- 创建后 15 分钟内就被删的文件。

SELECT DISTINCT d.FileName
FROM WritingSoftwareLog d
WHERE d.Action = 'Delete'
  AND EXISTS (
    SELECT 1 FROM WritingSoftwareLog s
    WHERE s.FileName = d.FileName
      AND s.Action = 'Save'
      AND (julianday(d.EventTime) - julianday(s.EventTime)) * 24 * 60 <= 15
      AND s.EventTime < d.EventTime
  );`,
    brennanIntro:
`找出所有创建后十五分钟内被删的文件。`,
    brennanOutro:
`Memo_PersonalNote。存活了十三分钟。
写于零点三十八。删除于零点五十一。
而且——删除那条记录的操作人不是 伊莱亚斯。日志的 PerformedByPersonID 字段记下了是谁的会话删的。
删除时间在死亡时间范围内。**凶手在现场，用死者的电脑删了它。**`,
    brennanMood: `*[布伦南 摘下眼镜揉了揉。] 还差最后一块——鉴证科的物证报告。`,
    grade: { rows: 1, firstColEquals: "Memo_PersonalNote.scriv" },
    rewards: { score: 15 }
  },
  {
    id: "10.3", chapter: 10, step: 3,
    title: "鉴证科的物证报告",
    task: "门禁和日志是数据，陪审团还要能放进证物袋的东西。把 PhysicalEvidence 整张表调出来——LEFT JOIN Persons 看每件物证比中了谁。",
    hint: `SELECT e.ItemName, e.Analysis, p.FullName AS MatchedTo
FROM PhysicalEvidence e
LEFT JOIN Persons p ON p.PersonID = e.MatchedPersonID;
留意 ItemName 里的"凶器"。`,
    starter: `-- 现场物证报告。凶器在哪，每件物证指向谁。

SELECT e.ItemName, e.Analysis, p.FullName AS MatchedTo
FROM PhysicalEvidence e
LEFT JOIN Persons p ON p.PersonID = ___;`,
    brennanIntro:
`门禁、Wi-Fi、家族记录、被删的便条——都是数据。
但陪审团要的是能放进证物袋的东西。鉴证科的物证报告到了。
把 PhysicalEvidence 调出来，LEFT JOIN 上 Persons——我要看凶器，和它身上的指纹比中了谁。`,
    brennanOutro:
`青铜猎鹰书挡——凶器。柄上一枚部分掌纹，比中 埃莉诺。撞击端是 伊莱亚斯 的血。
连接门门框上那缕羊毛纤维——埃莉诺 的外套。
地毯上那本 1985 年的日记——就是她自己短信里说"带来对质"的那一本。
还有尸检复核：死亡时间从一小时收窄到 00:50–01:05。
埃莉诺 零点四十八进书房、一点零二出来。死亡时间整段落在她在场的那十四分钟里。
01:02 之后那段空白——不再是问题。凶器，在她手里。`,
    brennanMood: `*[布伦南 把物证报告合上。] 现在我们去写最后一页。`,
    grade: { rows: 5, anyContainsCI: "凶器" },
    rewards: { score: 14 }
  },

  // ---------- Ch 11 · 最终证明（仪式）----------
  {
    id: "11.1", chapter: 11, step: 1, ritual: "ch11",
    title: "八列证据",
    task: "我要一行结果，八列。证明给检察官看。PersonID = 7。Suspect + PublicRelation + BloodRelation + StudyEntry + WiFiGap + HeldEvidenceBooks + DeletedFromVictimLaptop + WeaponEvidence。一条 SQL。完整证据链。",
    hint: `用相关子查询凑八列。SELECT p.FullName AS Suspect, p.RelationToElias AS PublicRelation, ...
每列对应一条之前章节里你已经独立查到的事实。
关键子查询：FamilyTree 找 Sealed_Adoption（生母）、KeycardAccess 找 Room 103 ToD 进入、
WiFiSessions 自联找空窗、LibraryCheckouts COUNT 未还的相关图书、WritingSoftwareLog
找 ToD 期间的 Delete 事件、PhysicalEvidence 找 ItemName 含'凶器'且 MatchedPersonID 命中的物证。`,
    starter: `-- 最终证明：八列。一行。埃莉诺·赖特 (PID 7)。
-- 每列对应之前某章查出来的一个事实。

SELECT
    p.FullName                                            AS Suspect,
    p.RelationToElias                                     AS PublicRelation,
    (SELECT '外甥女（封存：' || sm.FullName || ' 之女）'
     FROM   FamilyTree ft
     JOIN   Persons sm ON ft.RelatedPersonID = sm.PersonID
     WHERE  ft.PersonID = p.PersonID
       AND  ft.RecordStatus = 'Sealed_Adoption'
     LIMIT 1)                                             AS BloodRelation,
    (SELECT k.AccessTime
     FROM   KeycardAccess k
     WHERE  k.PersonID = p.PersonID
       AND  k.RoomID   = 103
       AND  k.AccessTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30'
     ORDER BY k.AccessTime LIMIT 1)                       AS StudyEntry,
    (SELECT MIN(w1.EndTime) || ' -> ' || MIN(w2.StartTime)
     FROM   WiFiSessions w1
     JOIN   WiFiSessions w2 ON w1.PersonID = w2.PersonID
                            AND w1.EndTime < w2.StartTime
     WHERE  w1.PersonID  = p.PersonID
       AND  w1.EndTime   >= '2024-10-20 00:00'
       AND  w2.StartTime <= '2024-10-20 02:00')           AS WiFiGap,
    (SELECT COUNT(*)
     FROM   LibraryCheckouts lc
     JOIN   Books b ON lc.BookID = b.BookID
     WHERE  lc.PersonID = p.PersonID
       AND  lc.ReturnDate IS NULL
       AND  (b.Author = '玛格丽特·布莱克伍德'
          OR b.Author = '伊莱亚斯·布莱克伍德'
          OR b.Genre  LIKE '%Sealed%'
          OR b.Title  LIKE '%领养%'))                     AS HeldEvidenceBooks,
    (SELECT wsl.FileName
     FROM   WritingSoftwareLog wsl
     WHERE  wsl.Action = 'Delete'
       AND  wsl.EventTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30'
     LIMIT 1)                                             AS DeletedFromVictimLaptop,
    (SELECT pe.ItemName
     FROM   PhysicalEvidence pe
     WHERE  pe.MatchedPersonID = p.PersonID
       AND  pe.ItemName LIKE '%凶器%'
     LIMIT 1)                                             AS WeaponEvidence
FROM   Persons p
WHERE  p.PersonID = ___;`,
    brennanIntro:
`我要一行结果，八列。证明给检察官看。
PersonID = 7。一次性。

1. 名字
2. 公开关系
3. 血亲关系（封存）
4. ToD 期间进入书房的时间
5. Wi-Fi 空窗起止
6. 持有的封存物证数
7. 案发期间从死者电脑删除的文件
8. 比中她指纹的凶器

一条 SQL。完整证据链。`,
    brennanOutro:
`好。我归档了。
逮捕令今天下午签发。下个月开庭。
玛格丽特·布莱克伍德。一九六四到一九八六。二十二岁自杀。
现在她的女儿要为她哥哥负责。
......
我们本该八章之前就破案了。
但那样的话，我们就不会知道为什么。`,
    brennanMood: `*[布伦南 看向窗外的雨。]*`,
    grade: {
      rows: 1,
      firstColEquals: "埃莉诺·赖特",
      requiredColumns: ["Suspect", "PublicRelation", "BloodRelation",
                        "StudyEntry", "WiFiGap", "HeldEvidenceBooks",
                        "DeletedFromVictimLaptop", "WeaponEvidence"]
    },
    rewards: { score: 25 }
  }
];

// ============================================================
// Grading function — flexible. Returns {pass, why}.
// ============================================================
window.BMM2_grade = function (task, result, rawQuery) {
  const g = task.grade || {};

  // Ch0 tutorial — any successful query passes.
  if (g.anyQuery) {
    return result && result.values && result.values.length >= 0
      ? { pass: true, why: "查询执行成功" }
      : { pass: false, why: "没有有效结果" };
  }
  if (!result || !result.columns || !result.values) {
    return { pass: false, why: "查询未返回结果集" };
  }
  const rows = result.values;
  const cols = result.columns;

  // Required column NAMES (Ch11 八列证据) — checked regardless of answer-key.
  if (g.requiredColumns) {
    for (const need of g.requiredColumns) {
      if (!cols.includes(need)) {
        return { pass: false, why: `缺列：${need}（八列证据缺一不可）` };
      }
    }
  }

  // ============================================================
  // STRICT answer-key comparison — the real anti-cheese gate.
  // Run the canonical SQL through the SAME anti-spoiler filter the
  // player's query went through, then compare:
  //   (1) exact row count, and
  //   (2) every value in the canonical result must appear in the
  //       player's result.
  // This rejects `SELECT *` (wrong row count) and wrong-row queries
  // (missing canonical values), while still allowing the player to
  // SELECT extra columns or use a different ORDER BY.
  // ============================================================
  const answer = window.BMM2_ANSWERS && window.BMM2_ANSWERS[task.id];
  if (answer && window.BMM2 && window.BMM2.db) {
    let canonRows = null;
    try {
      const state = window.BMM2.state || {};
      const filtered = window.BMM2_filterQuery
        ? window.BMM2_filterQuery(answer, state) : answer;
      const c = window.BMM2.db.exec(filtered);
      canonRows = (c[0] && c[0].values) ? c[0].values : [];
    } catch (e) {
      canonRows = null;   // canonical failed — fall back to heuristics below
    }
    if (canonRows) {
      // (1) Exact row count — this is the hard gate. It rejects
      //     `SELECT * FROM <wholeTable>` (wrong count) and any over- or
      //     under-broad WHERE.
      if (rows.length !== canonRows.length) {
        return {
          pass: false,
          why: `结果应为 ${canonRows.length} 行，你的查询返回了 ${rows.length} 行` +
               `——再检查 WHERE / JOIN 条件，别用 SELECT * 一次拉全表`
        };
      }
      // (2) Value direction — confirm the player fetched the RIGHT ROWS,
      //     tolerating column choice. Earlier this required the PLAYER's
      //     result to cover ≥50% of the CANONICAL's distinct values, which
      //     forced students to SELECT enough columns or judged them wrong;
      //     a student who correctly wrote `SELECT PersonID FROM ... WHERE …`
      //     and returned the right 2 rows (just one column) was rejected
      //     because their single value couldn't cover the canonical's
      //     5 distinct values.
      //
      //     The right test is the reverse: most of what the PLAYER returned
      //     should appear in the canonical's value set — proving their rows
      //     are real canonical rows (just possibly fewer columns). This
      //     still rejects "wrong rows" (player's values don't match canon)
      //     and `SELECT * FROM <wholeTable>` was already caught by (1).
      const playerVals = new Set();
      for (const r of rows) for (const c of r) playerVals.add(String(c));
      const canonVals = new Set();
      for (const r of canonRows) for (const c of r) canonVals.add(String(c));
      let fromCanon = 0;
      for (const v of playerVals) if (canonVals.has(v)) fromCanon++;
      const ratio = playerVals.size ? fromCanon / playerVals.size : 0;
      if (ratio < 0.5) {
        return {
          pass: false,
          why: "行数对了，但你返回的值大多不在标准答案里——" +
               "WHERE / JOIN 条件可能写错了，查到的不是正确的那些行"
        };
      }
      return { pass: true, why: "查询命中——结果正确" };
    }
  }

  // ---- Fallback heuristics (only if no answer-key is registered) ----
  if (g.rows !== undefined && rows.length !== g.rows) {
    return { pass: false, why: `期望 ${g.rows} 行，实际 ${rows.length} 行` };
  }
  if (g.minRows !== undefined && rows.length < g.minRows) {
    return { pass: false, why: `至少需要 ${g.minRows} 行，实际 ${rows.length} 行` };
  }
  if (g.firstColEquals !== undefined) {
    const v = rows[0] && rows[0][0];
    if (String(v) !== String(g.firstColEquals)) {
      return { pass: false, why: `首行首列应为 "${g.firstColEquals}"，实际 "${v}"` };
    }
  }
  if (g.firstColIn) {
    const v = String(rows[0] && rows[0][0]);
    if (!g.firstColIn.includes(v)) {
      return { pass: false, why: `首行首列 "${v}" 不在期望集合中` };
    }
  }
  if (g.anyContains) {
    const needle = String(g.anyContains);
    const hit = rows.some(r => r.some(c => c != null && String(c).indexOf(needle) >= 0));
    if (!hit) return { pass: false, why: `结果中应有包含 "${needle}" 的单元` };
  }
  if (g.anyContainsCI) {
    const needle = String(g.anyContainsCI).toLowerCase();
    const hit = rows.some(r => r.some(c => c != null && String(c).toLowerCase().indexOf(needle) >= 0));
    if (!hit) return { pass: false, why: `结果中应有包含 "${g.anyContainsCI}" 的单元` };
  }
  return { pass: true, why: "查询命中" };
};

// ============================================================
// Answer key — canonical SQL per task. The grader runs these and
// compares row count + value set against the player's result.
// ============================================================
window.BMM2_ANSWERS = {
  "0.1": "SELECT COUNT(*) FROM Persons",
  "1.1": "SELECT FullName, Age, Occupation FROM Persons WHERE PersonType = 'Guest'",
  "2.1": "SELECT PersonID, AccessTime, AccessType FROM KeycardAccess WHERE RoomID = 103 AND AccessTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30' ORDER BY AccessTime",
  "3.1": "SELECT FromPersonID, Content FROM PhoneRecords WHERE Content LIKE '%毁%' OR Content LIKE '%失去%'",
  "3.2": "SELECT FromPersonID, StartTime, Content FROM PhoneRecords WHERE Content LIKE '%今夜%'",
  "3.3": "SELECT StartTime, Content FROM PhoneRecords WHERE FromPersonID = 7",
  "4.1": "SELECT COUNT(*) FROM WineCellarLog",
  "4.2": "SELECT p.FullName, COUNT(*) AS Trips FROM WineCellarLog w JOIN Persons p ON p.PersonID = w.TakenByPersonID GROUP BY w.TakenByPersonID ORDER BY Trips DESC",
  "4.3": "SELECT b.Label, b.Vintage, b.ShelfLocation, w.AccessTime FROM WineCellarLog w JOIN WineBottles b ON b.BottleID = w.BottleID WHERE w.TakenByPersonID = 2",
  "4.4": "SELECT StartTime, ToName, Content FROM PhoneRecords WHERE FromPersonID = 2 ORDER BY StartTime",
  "4.5": "SELECT Title, Counterparty, Amount, Notes FROM Contracts WHERE Status = 'Draft'",
  "5.1": "SELECT p.FullName, COUNT(*) AS Borrowings FROM LibraryCheckouts lc JOIN Persons p ON p.PersonID = lc.PersonID GROUP BY lc.PersonID ORDER BY Borrowings DESC",
  "5.2": "SELECT b.Title, b.Author, lc.CheckoutDate, lc.ReturnDate FROM LibraryCheckouts lc JOIN Books b ON b.BookID = lc.BookID WHERE lc.PersonID = 7",
  "5.3": "SELECT b.Title, lc.CheckoutDate FROM LibraryCheckouts lc JOIN Books b ON b.BookID = lc.BookID WHERE lc.PersonID = 5",
  "6.1": "SELECT p.FullName, k.AccessTime, r.Name, k.Notes FROM KeycardAccess k JOIN Persons p ON p.PersonID = k.PersonID JOIN Rooms r ON r.RoomID = k.RoomID WHERE p.FullName = '马库斯·索恩' ORDER BY k.AccessTime",
  "6.2": "SELECT w.StartTime, w.EndTime, r.Name AS AP, w.DataMB FROM WiFiSessions w JOIN Rooms r ON r.RoomID = w.APRoomID WHERE w.PersonID = 4 ORDER BY w.StartTime",
  "6.3": "SELECT w.StartTime, w.EndTime, r.Name AS AP, w.DataMB FROM WiFiSessions w JOIN Rooms r ON r.RoomID = w.APRoomID WHERE w.PersonID = 7 ORDER BY w.StartTime",
  "7.1": "SELECT s.SeatNo, p.FullName FROM SeatingChart s JOIN Persons p ON p.PersonID = s.PersonID ORDER BY s.SeatNo",
  "7.2": "SELECT c.SpokenTime, sp.FullName AS Speaker, ls.FullName AS Listener, r.Name AS Room, c.Snippet FROM Conversations c JOIN Persons sp ON sp.PersonID = c.SpeakerID LEFT JOIN Persons ls ON ls.PersonID = c.ListenerID JOIN Rooms r ON r.RoomID = c.RoomID ORDER BY c.SpokenTime",
  "7.3": "SELECT c.SpokenTime, ls.FullName AS ToWhom, r.Name AS Room, c.Snippet FROM Conversations c LEFT JOIN Persons ls ON ls.PersonID = c.ListenerID JOIN Rooms r ON r.RoomID = c.RoomID WHERE c.SpeakerID = 1 ORDER BY c.SpokenTime",
  "8.1": "SELECT RoomID, Name, Wing, Floor FROM Rooms WHERE HasCCTV = 0",
  "8.2": "SELECT c.FileID, r.Name AS Room, c.RecordedStart, c.DeletedTime, p.FullName AS DeletedBy FROM CCTVFiles c JOIN Rooms r ON r.RoomID = c.RoomID LEFT JOIN Persons p ON p.PersonID = c.DeletedByID WHERE c.FileStatus = 'Deleted'",
  "8.3": "SELECT p.FullName FROM Persons p LEFT JOIN WiFiSessions w ON w.PersonID = p.PersonID AND w.StartTime < '2024-10-20 01:30' AND (w.EndTime > '2024-10-20 00:30' OR w.EndTime IS NULL) WHERE p.PersonType = 'Guest' AND w.SessionID IS NULL",
  "8.4": "SELECT p.FullName, r.Name AS Room, k.AccessTime, k.AccessType FROM KeycardAccess k JOIN Persons p ON p.PersonID = k.PersonID JOIN Rooms r ON r.RoomID = k.RoomID WHERE k.AccessTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30' ORDER BY k.AccessTime",
  "9.1": "SELECT p.FullName, ft.RelationType, ft.EffectiveYear FROM FamilyTree ft JOIN Persons p ON p.PersonID = ft.RelatedPersonID WHERE ft.PersonID = 1",
  "9.2": "SELECT p1.FullName AS Child, p2.FullName AS Parent, ft.RecordStatus, ft.EffectiveYear FROM FamilyTree ft JOIN Persons p1 ON p1.PersonID = ft.PersonID JOIN Persons p2 ON p2.PersonID = ft.RelatedPersonID WHERE ft.RelationType = 'Parent' AND ft.RecordStatus IN ('Public', 'Sealed_Adoption')",
  "9.3": "SELECT p.FullName FROM FamilyTree ft JOIN Persons p ON p.PersonID = ft.PersonID WHERE ft.RelatedPersonID = 14 AND ft.RelationType = 'Parent' AND ft.RecordStatus = 'Sealed_Adoption'",
  "10.1": "SELECT EventTime, Action, FileName, PreviewText FROM WritingSoftwareLog ORDER BY EventTime",
  "10.2": "SELECT DISTINCT d.FileName FROM WritingSoftwareLog d WHERE d.Action = 'Delete' AND EXISTS (SELECT 1 FROM WritingSoftwareLog s WHERE s.FileName = d.FileName AND s.Action = 'Save' AND (julianday(d.EventTime) - julianday(s.EventTime)) * 24 * 60 <= 15 AND s.EventTime < d.EventTime)",
  "10.3": "SELECT e.ItemName, e.Analysis, p.FullName AS MatchedTo FROM PhysicalEvidence e LEFT JOIN Persons p ON p.PersonID = e.MatchedPersonID",
  "11.1": "SELECT p.FullName AS Suspect, p.RelationToElias AS PublicRelation, (SELECT '外甥女（封存：' || sm.FullName || ' 之女）' FROM FamilyTree ft JOIN Persons sm ON ft.RelatedPersonID = sm.PersonID WHERE ft.PersonID = p.PersonID AND ft.RecordStatus = 'Sealed_Adoption' LIMIT 1) AS BloodRelation, (SELECT k.AccessTime FROM KeycardAccess k WHERE k.PersonID = p.PersonID AND k.RoomID = 103 AND k.AccessTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30' ORDER BY k.AccessTime LIMIT 1) AS StudyEntry, (SELECT MIN(w1.EndTime) || ' -> ' || MIN(w2.StartTime) FROM WiFiSessions w1 JOIN WiFiSessions w2 ON w1.PersonID = w2.PersonID AND w1.EndTime < w2.StartTime WHERE w1.PersonID = p.PersonID AND w1.EndTime >= '2024-10-20 00:00' AND w2.StartTime <= '2024-10-20 02:00') AS WiFiGap, (SELECT COUNT(*) FROM LibraryCheckouts lc JOIN Books b ON lc.BookID = b.BookID WHERE lc.PersonID = p.PersonID AND lc.ReturnDate IS NULL AND (b.Author = '玛格丽特·布莱克伍德' OR b.Author = '伊莱亚斯·布莱克伍德' OR b.Genre LIKE '%Sealed%' OR b.Title LIKE '%领养%')) AS HeldEvidenceBooks, (SELECT wsl.FileName FROM WritingSoftwareLog wsl WHERE wsl.Action = 'Delete' AND wsl.EventTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30' LIMIT 1) AS DeletedFromVictimLaptop, (SELECT pe.ItemName FROM PhysicalEvidence pe WHERE pe.MatchedPersonID = p.PersonID AND pe.ItemName LIKE '%凶器%' LIMIT 1) AS WeaponEvidence FROM Persons p WHERE p.PersonID = 7"
};

// ============================================================
// Task briefs — plain-language explanation for every task, aimed at
// students with weak comprehension. Three fields:
//   goal — 这一步具体要做什么
//   why  — 为什么要查它（它对破案有什么用）
//   gain — 查完之后你得到了什么（成果，破案前进了一步）
// ============================================================
window.BMM2_BRIEF = {
  "0.1": {
    goal: "先试用一下查询工具——数一数案件数据库里一共登记了多少人。",
    why:  "这一步只是热身，让你熟悉怎么写一条 SQL、怎么点运行、结果长什么样。",
    gain: "数据库里一共有 18 个人。工具会用了，可以正式开始办案。"
  },
  "1.1": {
    goal: "把昨晚住在庄园里的 7 位客人（Guest）全部查出来。",
    why:  "凶案发生时这 7 个人都在庄园。在排除之前，他们每个人都有嫌疑——这就是我们的「嫌疑人名单」。",
    gain: "锁定了 7 名嫌疑人。传记作者 埃莉诺·赖特 也在其中。"
  },
  "2.1": {
    goal: "查出死亡时间段（00:30–01:30）里，谁刷门禁卡进出了书房。",
    why:  "凶案现场就是书房。案发那关键一小时里，门卡碰过书房的人，最值得怀疑。",
    gain: "那一小时里，只有 埃莉诺·赖特 的门卡进出过书房——00:48 进、01:02 出。"
  },
  "3.1": {
    goal: "在当晚的短信里，找出含有 “ruin”（毁掉）或 “lose”（失去）的内容。",
    why:  "谁想杀 伊莱亚斯？先看谁怕被他「毁掉」或「失去」什么——我们在找杀人动机。",
    gain: "马库斯 给前妻发了两条短信，怕 伊莱亚斯 毁掉他的生计。这是动机——但有动机不等于动了手。"
  },
  "3.2": {
    goal: "找出所有含 “tonight”（今晚）的短信。",
    why:  "想知道案发当晚谁「有计划」。短信里特意提到「今晚」的人，当晚多半要做点什么。",
    gain: "埃莉诺 在 22:48 发了短信：「今夜。我准备好了一切。最后的篇章。」她当晚有所行动。"
  },
  "3.3": {
    goal: "把 埃莉诺（7 号）当天发出的所有短信都查出来。",
    why:  "埃莉诺 的短信透出她有计划，值得把她一整天的短信都翻一遍。",
    gain: "下午 14:22 她说「我会带上日记本，他没法当我面否认」——她带着某样东西去对质。"
  },
  "4.1": {
    goal: "数一数案发前后，酒窖一共被进入了多少次。",
    why:  "酒窖在地下、恒温，深夜正常没人去。先看看那一晚有没有异常。",
    gain: "酒窖那晚被进入了 8 次。需要再看看，分别都是谁下去的。"
  },
  "4.2": {
    goal: "按「取酒的人」分组，看每个人各去了酒窖几次。",
    why:  "8 次访问里，要挑出那个深夜本不该出现在酒窖的人。",
    gain: "大多数是厨师备餐。但 薇薇安 在凌晨 00:46（正值案发时段）单独下去了一趟。"
  },
  "4.3": {
    goal: "查出 薇薇安 那一趟从酒窖取走的是哪瓶酒。",
    why:  "案发时段她特意下到酒窖，到底拿了什么？这关系到她有没有作案。",
    gain: "一瓶市价过万英镑的 Pétrus——但她真正要取的，是藏在酒架后面的东西。"
  },
  "4.4": {
    goal: "查 薇薇安 取酒之后发出的短信。",
    why:  "她从酒窖出来后做了什么、跟谁说了什么？短信会说话。",
    gain: "她给律师发：「拿回来了，草稿又回到我手里。」她拿的不是酒，是一份合同。"
  },
  "4.5": {
    goal: "在合同表里，找出状态是 “Draft”（草稿）的合同。",
    why:  "薇薇安 口中的「草稿」到底是什么合同？这决定了她的动机有多强。",
    gain: "一份要把庄园卖给酒店集团的草稿——薇薇安 会失去住处。她有动机，但案发时一直在酒窖和卧室，排除。"
  },
  "5.1": {
    goal: "看过去半年图书馆的借阅记录，找出借书最多的人。",
    why:  "有人可能在为某件事偷偷做「功课」。借书最多的人，最值得关注。",
    gain: "埃莉诺 借得最多（8 次）。得看看，她到底借了些什么书。"
  },
  "5.2": {
    goal: "查出 埃莉诺 借过的所有书。",
    why:  "她借了这么多书，是在研究什么？书单会暴露她的真实目的。",
    gain: "全是 玛格丽特 的手稿、领养档案、关于抄袭的法律书——这不是写传记，是在准备一桩案子。"
  },
  "5.3": {
    goal: "查出 艾莉丝（5 号，2023 年获奖者）借过的书。",
    why:  "看看除了 埃莉诺，还有没有别人也在研究类似的东西。",
    gain: "艾莉丝 反复借 伊莱亚斯 的成名作《沉默时刻》——两个互不相识的女人，盯着同一本书。"
  },
  "6.1": {
    goal: "用三张表连接，查出 马库斯 当晚完整的刷卡轨迹。",
    why:  "马库斯 有动机。先把他案发时的行踪查清楚——到底是排除他，还是锁定他。",
    gain: "马库斯 零点十七分回了自己房间。但还要确认：他之后没有再溜出来。"
  },
  "6.2": {
    goal: "查 马库斯 的手机 Wi-Fi 连接记录。",
    why:  "门禁只记录刷卡那一下；Wi-Fi 能证明他人有没有「一直」待在房间里。",
    gain: "他的手机从零点十八起一直连着自己房间的 Wi-Fi 到凌晨两点半——他没出过房间。马库斯 排除。"
  },
  "6.3": {
    goal: "查 埃莉诺 的手机 Wi-Fi 连接记录。",
    why:  "同样的方法用在 埃莉诺 身上——案发那一小时，她的手机在哪？",
    gain: "她的手机 00:28 掉线、直到 01:35 才重连——整个案发一小时，她不在任何 Wi-Fi 上。她在哪？"
  },
  "7.1": {
    goal: "查出周六晚宴的座位安排。",
    why:  "想知道晚宴上谁挨着谁坐——人物关系和当晚的气氛，都藏在座次里。",
    gain: "前妻和现妻分坐 伊莱亚斯 两侧，气氛尴尬。而管家把全程的对话都记进了笔记本。"
  },
  "7.2": {
    goal: "把管家笔记本里记下的所有偷听到的对话都调出来。",
    why:  "管家记录了宾客的私下交谈——这些没人想被听见的话里，藏着真相。",
    gain: "埃莉诺 约 伊莱亚斯「今夜，档案室」；伊莱亚斯 当面对她说「名字刻在牌子上，不等于你就是家人」。"
  },
  "7.3": {
    goal: "单独查出 伊莱亚斯 当晚说过的每一句话。",
    why:  "死者最后说了什么、对谁说的，往往就是案件的关键。",
    gain: "他对每个人都很刻薄，但对 埃莉诺 那句「家人」格外针对——是时候去查家族记录了。"
  },
  "8.1": {
    goal: "查出庄园里哪些房间没有安装监控摄像头。",
    why:  "凶手会挑没有监控的地方动手。先找出这些「盲区」。",
    gain: "书房、档案室、以及连接两者的那条走廊——全都没有监控。"
  },
  "8.2": {
    goal: "查出哪些监控录像被删除了，以及是谁删的。",
    why:  "有人删录像，就说明有人想藏住什么。",
    gain: "案发前 5 分钟，伊莱亚斯 本人删掉了能拍到自己接见客人的录像——他在为一场秘密会面做准备。"
  },
  "8.3": {
    goal: "用 LEFT JOIN，找出案发时段手机完全没有 Wi-Fi 活动的客人。",
    why:  "Wi-Fi 全程离线，说明这个人的手机（很可能人也）不在任何有信号的房间里。",
    gain: "埃莉诺 和 亨里克 两人离线。光凭「离线」还不够定罪，得继续排查。"
  },
  "8.4": {
    goal: "摊开案发那一小时里所有人的门禁刷卡记录。",
    why:  "要给检察官一个交代——逐一证明：除了 埃莉诺，没有第二个人靠近过书房。",
    gain: "其余六名客人都有可查证的不在场位置。整个案发窗口，只有 埃莉诺 的卡碰过书房。"
  },
  "9.1": {
    goal: "查家族关系表，列出 伊莱亚斯 所有「公开的」亲属。",
    why:  "伊莱亚斯 那句「家人」很可疑。先把他公开的家族关系理清楚。",
    gain: "父母已故，还有前妻、现妻，和一个 1986 年 22 岁自杀的妹妹——玛格丽特。"
  },
  "9.2": {
    goal: "查所有「父母」关系——这一次要把被封存的领养记录也包括进来。",
    why:  "普通查询看不到封存记录。必须在 SQL 里明确写出 'Sealed_Adoption'，它才会现身。",
    gain: "一条被封存了 44 年的领养记录浮出水面——埃莉诺 有一位被封存的「生母」。"
  },
  "9.3": {
    goal: "查出 玛格丽特（14 号）作为「母亲」的那条封存记录。",
    why:  "那条封存记录指向 玛格丽特。她，究竟是谁的生母？",
    gain: "埃莉诺 是 玛格丽特 的女儿，也就是 伊莱亚斯 的外甥女——而她当了整整三年他的传记作者。"
  },
  "10.1": {
    goal: "查出 伊莱亚斯 笔记本电脑上写作软件的全部保存记录。",
    why:  "死者最后在写什么、改什么、删什么，会直接说明他当晚的处境。",
    gain: "第七章他写着要「公开认错」，但 GalaSpeech 终稿却写着要「当众反口」——他一直在演戏。"
  },
  "10.2": {
    goal: "找出「创建后 15 分钟内」就被删除的文件。",
    why:  "正常人不会刚写完就删。速生速灭的文件，往往正是有人想藏住的东西。",
    gain: "一张便条，00:38 写下、00:51 被删——而那时 伊莱亚斯 多半已经死了。是凶手删的。"
  },
  "10.3": {
    goal: "查鉴证科采集的现场物证，看每一件分别比中了谁。",
    why:  "门禁和日志都是数据。陪审团还需要能放进证物袋的硬证据——尤其是凶器。",
    gain: "凶器青铜书挡上的掌纹比中 埃莉诺；尸检把死亡时间收窄到 00:50–01:05，正好落在她在书房的那段时间里。"
  },
  "11.1": {
    goal: "用一条 SQL 查出八列证据，集中呈交给检察官。",
    why:  "这是最后一步——把前面查到的每一条线索，拼成一条完整、无可辩驳的证据链。",
    gain: "八列证据全部指向 埃莉诺·赖特。动机、机会、手段俱全。案件告破。"
  }
};

// ============================================================
// Anti-spoiler query rewriting (defense at the SQL source).
// We pre-rewrite the user's SQL by REPLACING table references with
// redacted sub-selects, so the spoiler data never enters the result
// set in the first place — no matter which columns the user selects.
// ============================================================
window.BMM2_filterQuery = function (rawQuery, state) {
  // Reset side-channel hint so the previous query's hint doesn't leak.
  // runQuery reads window.__bmFilterHint after calling us, and surfaces
  // it in the result banner so the student understands why the table
  // looks empty / shorter than expected.
  window.__bmFilterHint = "";
  const hints = [];
  const q = String(rawQuery || "");
  const ql = q.toLowerCase();
  const ch9Done = state.completedTasks && state.completedTasks.includes("9.3");
  const ch10Done = state.completedTasks && state.completedTasks.includes("10.2");
  let out = q;

  // (1) FamilyTree → exclude Sealed_Adoption rows unless explicitly invoked
  //     OR Ch9 completed.  The whole row vanishes from any SELECT, JOIN,
  //     COUNT, etc. against FamilyTree.
  if (!ch9Done && ql.indexOf("sealed_adoption") < 0) {
    const before = out;
    out = out.replace(
      /\bFamilyTree\b/gi,
      "(SELECT RecordID, PersonID, RelatedPersonID, RelationType, RecordStatus, EffectiveYear FROM FamilyTree WHERE RecordStatus != 'Sealed_Adoption')"
    );
    if (out !== before) hints.push("FamilyTree 里有些记录被「封存」，要等第 9 章查到那条线索后才会现身——现在看到的只是公开部分。");
  }

  // (2) WritingSoftwareLog → until Ch10 completes, mask the Memo preview
  //     text AND the actor of the Delete event (PerformedByPersonID = 7
  //     would otherwise spoil the killer). Same column shape preserved.
  if (!ch10Done) {
    const before = out;
    out = out.replace(
      /\bWritingSoftwareLog\b/gi,
      "(SELECT LogID, EventTime, Action, FileName, CharCount, " +
      "CASE WHEN FileName LIKE 'Memo_PersonalNote%' THEN '[ENCRYPTED]' ELSE PreviewText END AS PreviewText, " +
      "CASE WHEN Action = 'Delete' THEN NULL ELSE PerformedByPersonID END AS PerformedByPersonID " +
      "FROM WritingSoftwareLog)"
    );
    if (out !== before) hints.push("WritingSoftwareLog 里某些备忘录还没解密，删除操作的执行者也暂时空着——第 10 章完成后就齐了。");
  }

  // (3) PhysicalEvidence → forensic lab results are not available until the
  //     player reaches the Ch10 forensics beat. Before then the table reads
  //     as empty ("evidence still in processing"), so a curious early
  //     SELECT * can't reveal the bookend → 埃莉诺 match.
  if (!ch10Done) {
    const before = out;
    out = out.replace(
      /\bPhysicalEvidence\b/gi,
      "(SELECT EvidenceID, ItemName, FoundInRoomID, CollectedTime, Analysis, MatchedPersonID FROM PhysicalEvidence WHERE 1 = 0)"
    );
    if (out !== before) hints.push("PhysicalEvidence（鉴证科物证）还在化验中，要到第 10 章结束后才会出结果——不是你 WHERE 写错。");
  }
  if (hints.length) window.__bmFilterHint = hints.join(" ");
  return out;
};

// Kept for backward-compat with any old call sites: identity passthrough.
window.BMM2_filterResult = function (result) { return result; };

// ============================================================
// Keyword highlight list — these terms get the gold-underline
// treatment in conversation snippets, document previews, etc.
// ============================================================
window.BMM2_KEYWORDS = [
  "日记","家人","档案室","颁奖","手稿","玛格丽特","妹妹",
  "毁","失去","律师","血","封存","领养","脚注",
  "沉默时刻","剽窃","今夜","传记","埃莉诺","大理石","凶器"
];
