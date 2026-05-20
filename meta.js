// Chapter metadata, hints, grading rules, whiteboard text.
// All learner-facing copy lives here. All strings use backticks to allow
// freely embedded "" and '' from the case fiction.

window.BMM_META = {
  chapters: [
    {
      id: 1, concept: `SELECT / WHERE`,
      title: `建立人员名册`,
      goal: `找出所有 PersonType = 'Guest' 的人，列出 FullName 和 Age。`,
      expect: `应返回 7 行（嫌疑人）。`,
      hint:
`Persons 表里 PersonType 字段。先看看有哪些值。
SELECT FullName, Age FROM Persons WHERE PersonType = ?

提示：游客是这一夜的嫌疑人。员工与历史人物先放一边。`,
      starter:
`-- 第 1 章：把这一夜在场的"嫌疑人"列出来。
-- Persons 表 PersonType 字段记录了每个人的身份类型。

SELECT FullName, Age FROM Persons WHERE PersonType = '...';`
    },
    {
      id: 2, concept: `ORDER BY / BETWEEN`,
      title: `死亡时间窗口`,
      goal: `找出在 ToD (00:30–01:30) 内进入书房 (RoomID = 103) 的所有人，列出 PersonID, AccessTime。`,
      expect: `应返回 2 行；首行 AccessTime 为 2024-10-20 00:48。`,
      hint:
`用 KeycardAccess 表，配合 BETWEEN。
WHERE RoomID = 103 AND AccessTime BETWEEN ... AND ...

注意：ToD 起点是 '2024-10-20 00:30:00'，终点 '2024-10-20 01:30:00'。
注意要 AccessType = 'Entry' 还是不要？想清楚 —— 离开也是访问的一种。`,
      starter:
`-- 第 2 章：死亡时间在 00:30–01:30 之间。
-- 谁的卡片在这段时间里碰过书房 (RoomID = 103) 的读卡器？

SELECT PersonID, AccessTime
FROM KeycardAccess
WHERE RoomID = ___
  AND AccessTime BETWEEN '___' AND '___'
ORDER BY AccessTime;`
    },
    {
      id: 3, concept: `LIKE (模糊匹配)`,
      title: `暴风雨前的短信`,
      goal: `在 PhoneRecords 里找内容含 'ruin' 或 'lose' 的短信，列出 FromPersonID, Content。`,
      expect: `应返回 2 行；首行 FromPersonID = 4。`,
      hint:
`用 LIKE 配 % 做模糊匹配，OR 把两个条件接起来。
WHERE Content LIKE '%ruin%' OR Content LIKE '%lose%'`,
      starter:
`-- 第 3 章：动机往往藏在用词里。
-- "ruin"、"lose" —— 谁的手机说过这些字眼？

SELECT FromPersonID, Content
FROM PhoneRecords
WHERE Content LIKE '%___%' OR Content LIKE '%___%';`
    },
    {
      id: 4, concept: `聚合 (COUNT)`,
      title: `酒窖访问次数`,
      goal: `数一数 WineCellarLog 共有几条记录。`,
      expect: `应返回 1 行 1 列，值为 8。`,
      hint:
`COUNT(*) 是行数最直接的写法。
SELECT COUNT(*) FROM WineCellarLog;`,
      starter:
`-- 第 4 章：酒窖这一夜被进了几次？

SELECT ___(*) FROM WineCellarLog;`
    },
    {
      id: 5, concept: `GROUP BY / HAVING`,
      title: `借阅图谱`,
      goal: `按人统计借书次数，列出 FullName 与 Borrowings (COUNT)，借得最多的放最上。`,
      expect: `应返回 6 行；首行 FullName 为 Eleanor Wright。`,
      hint:
`需要 JOIN Persons 与 LibraryCheckouts，然后 GROUP BY PersonID。
ORDER BY COUNT(*) DESC 让借得最多的人排第一。

注意结果应有 6 行 —— 所有出现在 LibraryCheckouts 里的人。Elias 自己也算。`,
      starter:
`-- 第 5 章：谁泡图书馆？
-- JOIN Persons 和 LibraryCheckouts，按人聚合。

SELECT p.FullName, COUNT(*) AS Borrowings
FROM Persons p
JOIN LibraryCheckouts lc ON ___ = ___
GROUP BY p.PersonID
ORDER BY Borrowings DESC;`
    },
    {
      id: 6, concept: `INNER JOIN`,
      title: `Marcus 的时间线`,
      goal: `用 JOIN 拼出 Marcus Thorne 当晚所有刷卡 + 房间名，列出 FullName, AccessTime, Name, Notes，按时间升序。`,
      expect: `应返回 7 行；任一行 FullName 含 'Marcus Thorne'。`,
      hint:
`三表 JOIN：Persons p × KeycardAccess k × Rooms r。
WHERE p.FullName = 'Marcus Thorne'
ORDER BY k.AccessTime;

跑完之后 —— 再看看时间线 Wi-Fi 层。Eleanor 那一段空白是不是太长了？`,
      starter:
`-- 第 6 章：INNER JOIN 三张表。
-- Marcus 那晚都去过哪？

SELECT p.FullName, k.AccessTime, r.Name, k.Notes
FROM KeycardAccess k
JOIN Persons p ON ___ = ___
JOIN Rooms r ON ___ = ___
WHERE p.FullName = 'Marcus Thorne'
ORDER BY k.AccessTime;`
    },
    {
      id: 7, concept: `多表 JOIN`,
      title: `偷听对话`,
      goal: `把 Conversations 与 Persons (两次：说话人、听话人) 和 Rooms join 起来。列出 Snippet, SpokenTime 等；按 SpokenTime 升序。`,
      expect: `应返回 10 行；首行 SpokenTime 为 2024-10-19 16:20。`,
      hint:
`Persons 表 JOIN 两次 —— 一次给 SpeakerID，一次给 ListenerID。给两次别名 (例如 sp, ls)。

SELECT sp.FullName AS Speaker, ls.FullName AS Listener, c.Snippet, r.Name, c.SpokenTime
FROM Conversations c
JOIN Persons sp ON ...
LEFT JOIN Persons ls ON ...
JOIN Rooms r ON ...
ORDER BY c.SpokenTime;`,
      starter:
`-- 第 7 章：把对话表 + 人 + 房间拼起来。
-- 谁在哪里、对谁说了什么？

SELECT sp.FullName AS Speaker,
       ls.FullName AS Listener,
       c.Snippet,
       r.Name,
       c.SpokenTime
FROM Conversations c
JOIN Persons sp  ON ___ = ___
LEFT JOIN Persons ls ON ___ = ___
JOIN Rooms r ON ___ = ___
ORDER BY c.SpokenTime;`
    },
    {
      id: 8, concept: `LEFT JOIN + IS NULL`,
      title: `Wi-Fi 离线者`,
      goal: `找出 ToD 期间 (00:30–01:30) 完全没有 Wi-Fi 会话的嘉宾 (Guest)，列出 FullName。`,
      expect: `应返回 2 行；首行 FullName 为 Eleanor Wright 或 Henrik Volkov。`,
      hint:
`LEFT JOIN 用于找"没有匹配的"。
关键是 ON 子句里把"重叠 ToD 窗口"的条件写进去，再 WHERE 那侧 IS NULL。

SELECT p.FullName
FROM Persons p
LEFT JOIN WiFiSessions w
  ON w.PersonID = p.PersonID
  AND w.StartTime < '2024-10-20 01:30'
  AND (w.EndTime > '2024-10-20 00:30' OR w.EndTime IS NULL)
WHERE p.PersonType = 'Guest' AND w.SessionID IS NULL;`,
      starter:
`-- 第 8 章：ToD 期间，谁的手机/电脑完全没连 Wi-Fi？
-- LEFT JOIN + IS NULL 经典套路。

SELECT p.FullName
FROM Persons p
LEFT JOIN WiFiSessions w
  ON w.PersonID = p.PersonID
  AND w.StartTime < '2024-10-20 01:30'
  AND (w.EndTime > '2024-10-20 00:30' OR w.EndTime IS NULL)
WHERE p.PersonType = '___'
  AND w.SessionID IS NULL;`
    },
    {
      id: 9, concept: `自联 (Self-join)`,
      title: `Margaret 的所有 Parent 关系`,
      goal: `在 FamilyTree 里找出 RelatedPersonID = 14 (Margaret Blackwood) 且 RelationType = 'Parent' 的记录，对应 PersonID 不是 Elias、不是历史人物 —— 是谁？列 FullName。`,
      expect: `应返回 1 行；FullName 为 Eleanor Wright。`,
      hint:
`FamilyTree 表里 RecordStatus 有不止一种值。默认有些查询会被 Public/Sealed 过滤掉。
检查：是否限制了 RecordStatus = 'Public'？答案藏在 Sealed_Adoption 行里。

把 FamilyTree 和 Persons join：
WHERE ft.RelatedPersonID = 14 AND ft.RelationType = 'Parent' AND p.PersonType = 'Guest'`,
      starter:
`-- 第 9 章：Margaret Blackwood (PersonID = 14) 的"父母"是 Charles + Henrietta。
-- 但 FamilyTree 表里 Parent 这一关系是对称的 —— Margaret 是某人的母亲呢？
-- RecordStatus 不止一种值。把 Sealed 也算进来。

SELECT p.FullName
FROM FamilyTree ft
JOIN Persons p ON ft.PersonID = p.PersonID
WHERE ft.RelatedPersonID = ___
  AND ft.RelationType = '___'
  AND p.PersonType = 'Guest';`
    },
    {
      id: 10, concept: `子查询 (Subquery)`,
      title: `速生速灭的文件`,
      goal: `找出在 WritingSoftwareLog 里被创建 (Save) 后 15 分钟内 被 Delete 的文件。列出 FileName。`,
      expect: `应返回 1 行；FileName 为 Memo_PersonalNote.scriv。`,
      hint:
`想清楚：先找出所有 'Delete' 行，对每条 Delete 找有没有同一 FileName 的 'Save' 行在它之前 ≤15 分钟内。
用 EXISTS 或子查询都行。

SQLite 时间相减：(julianday(a) - julianday(b)) * 24 * 60 是分钟数。`,
      starter:
`-- 第 10 章：哪些文件创建后 15 分钟内就被删？

SELECT DISTINCT d.FileName
FROM WritingSoftwareLog d
WHERE d.Action = 'Delete'
  AND EXISTS (
    SELECT 1 FROM WritingSoftwareLog s
    WHERE s.FileName = d.FileName
      AND s.Action = 'Save'
      AND (julianday(d.EventTime) - julianday(s.EventTime)) * 24 * 60 <= 15
      AND s.EventTime < d.EventTime
  );`
    },
    {
      id: 11, concept: `综合查询`,
      title: `七列证据`,
      goal: `拼出 嫌疑人 + 与 Margaret 的生物关系 两列，过滤到只剩与 Margaret 有 Parent 关系且是 Guest 的人。结果应为一行：Suspect = Eleanor Wright。`,
      expect: `应返回 1 行；Suspect 列首值为 Eleanor Wright；列名含 BloodRelation。`,
      hint:
`把 Persons 与 FamilyTree 做 JOIN，加上 RecordStatus IN ('Public','Sealed_Adoption')。
SELECT p.FullName AS Suspect, ft.RelationType || ' (' || ft.RecordStatus || ')' AS BloodRelation
FROM Persons p
JOIN FamilyTree ft ON ft.PersonID = p.PersonID
WHERE ft.RelatedPersonID = 14
  AND p.PersonType = 'Guest';`,
      starter:
`-- 第 11 章：综合查询。
-- 把 "谁是 Guest 且与 Margaret 有亲生关系" 这一列拼出来。

SELECT p.FullName AS Suspect,
       ft.RelationType || ' (' || ft.RecordStatus || ')' AS BloodRelation
FROM Persons p
JOIN FamilyTree ft ON ft.PersonID = p.PersonID
WHERE ft.RelatedPersonID = ___
  AND p.PersonType = '___';`
    }
  ],

  // Whiteboard summary text — VERBATIM from PRD §9.2.
  whiteboard: {
    1:  `案件人员名册建立 · 7 名嫌疑人 / 5 名员工 / 3 名已故家族成员（含 Margaret，1964–1986）。`,
    2:  `ToD 窗口内书房唯一访客：Eleanor Wright（00:48 进，01:02 出，经"档案室连接门"）。Marcus 23:58 离开书房，比 ToD 起点早 32 分钟。`,
    3:  `Marcus 财务动机已存档（"He's going to ruin me"）。Eleanor 出现两条耐人寻味的短信。Henrik 排除（与儿子的家事）。`,
    4:  `Vivienne 凌晨 00:46 入酒窖取酒。她 00:54 发短信给律师："Recovered it. The draft is in my possession again."`,
    5:  `Eleanor 6 个月内借出：Margaret 手稿、领养档案、剽窃法律书、《沉默时刻》。其中 5 本未还。Iris 三借《沉默时刻》。`,
    6:  `Marcus 排除（00:18–02:30 手机 Wi-Fi 持续在客房 301 AP）。Eleanor 的 Wi-Fi 在 00:28 与 01:35 之间有一段 67 分钟空窗。`,
    7:  `Eleanor 21:40 与 Elias 的私下约定："今夜，宴会之后。档案室。" Elias 22:30 在走廊否认："你以为名字刻在大理石牌上就是家人了。"`,
    8:  `书房、档案室、连接门走廊均无 CCTV。东走廊监控被 Elias 本人 00:25 删除。ToD 全程 Wi-Fi 离线的嘉宾：Eleanor + Henrik。`,
    9:  `【封存档案解密】Eleanor Wright 的生母为 Margaret Blackwood（1980 年领养，记录封存 44 年）。`,
    10: `Elias 死前 17 分钟在笔记本上写下："Eleanor coming in 10 min. She knows." 该文件 13 分钟后被删除（00:51）。`,
    11: `七列证据全部命中。案件关闭。`
  },

  // Grading rules — verbatim from PRD App E (lightly normalized).
  rules: {
    1:  { rows: 7,  cols: ["FullName"],
          firstColIn: ["Vivienne Ashford","Sophia Blackwood","Marcus Thorne","Iris Chen","Julian Hartley","Eleanor Wright","Henrik Volkov"] },
    2:  { rows: 2,  cols: ["AccessTime"],
          anyRowContains: "2024-10-20 00:48" },
    3:  { rows: 2,  cols: ["Content"],
          anyRowContainsCI: "ruin" },
    4:  { rows: 1,  cols: [],
          firstColEquals: 8 },
    5:  { rows: 6,  cols: ["FullName"],
          firstColEquals: "Eleanor Wright" },
    6:  { rows: 7,  cols: ["AccessTime"],
          anyRowContains: "Marcus Thorne" },
    7:  { rows: 10, cols: ["Snippet"],
          anyRowContains: "2024-10-19 16:20" },
    8:  { rows: 2,  cols: ["FullName"],
          firstColIn: ["Eleanor Wright","Henrik Volkov"] },
    9:  { rows: 1,  cols: ["FullName"],
          firstColEquals: "Eleanor Wright" },
    10: { rows: 1,  cols: ["FileName"],
          firstColEquals: "Memo_PersonalNote.scriv" },
    11: { rows: 1,  cols: ["Suspect","BloodRelation"],
          firstColEquals: "Eleanor Wright" }
  }
};

// Grading function — returns {pass: bool, why: string}
window.BMM_grade = function(chId, result) {
  const rule = window.BMM_META.rules[chId];
  if (!rule) return { pass: false, why: "未知章节" };
  if (!result || !result.columns || !result.values) {
    return { pass: false, why: "查询未返回结果集（也许只是 CREATE / 错误）" };
  }
  const cols = result.columns;
  const rows = result.values;

  if (rows.length !== rule.rows) {
    return { pass: false, why: `期望 ${rule.rows} 行，实际 ${rows.length} 行` };
  }
  for (const need of rule.cols || []) {
    if (!cols.includes(need)) {
      return { pass: false, why: `期望列名包含 ${need}（你的结果列：${cols.join(", ")}）` };
    }
  }
  if (rule.firstColEquals !== undefined) {
    const v = rows[0][0];
    if (String(v) !== String(rule.firstColEquals)) {
      return { pass: false, why: `首行首列应为 ${rule.firstColEquals}，实际 ${v}` };
    }
  }
  if (rule.firstColIn) {
    const v = rows[0][0];
    if (!rule.firstColIn.includes(String(v))) {
      return { pass: false, why: `首行首列 ${v} 不在期望集合中` };
    }
  }
  if (rule.anyRowContains) {
    const needle = String(rule.anyRowContains);
    const hit = rows.some(r => r.some(c => c != null && String(c).indexOf(needle) >= 0));
    if (!hit) return { pass: false, why: `结果中应有包含 "${needle}" 的单元` };
  }
  if (rule.anyRowContainsCI) {
    const needle = String(rule.anyRowContainsCI).toLowerCase();
    const hit = rows.some(r => r.some(c => c != null && String(c).toLowerCase().indexOf(needle) >= 0));
    if (!hit) return { pass: false, why: `结果中应有包含 "${rule.anyRowContainsCI}" 的单元` };
  }
  return { pass: true, why: "查询命中" };
};
