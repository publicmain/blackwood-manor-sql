# 黑木庄园谋杀案 · SQL 答案册（教师参考）

> 全 12 章 · 31 关。每条 SQL 都已对齐游戏内评分逻辑（行数 / 首列 / 关键字）。
> 防剧透说明：第 9、10 章涉及封存数据，必须**按顺序**完成——前一关通关后，
> 引擎才会解锁封存领养记录、备忘录预览、物证表。

---

## 第 0 章 · 工具熟悉

**0.1 把工具拿熟**
```sql
SELECT COUNT(*) FROM Persons;
```

## 第 1 章 · 嫌疑人名册

**1.1 找出昨晚的 Guest**
```sql
SELECT FullName, Age, Occupation
FROM Persons
WHERE PersonType = 'Guest';
```

## 第 2 章 · 死亡时间窗

**2.1 ToD 内通过书房门禁的人**
```sql
SELECT PersonID, AccessTime, AccessType
FROM KeycardAccess
WHERE RoomID = 103
  AND AccessTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30'
ORDER BY AccessTime;
```

## 第 3 章 · 暗夜短讯

**3.1 动机筛 · 含 ruin/lose 的短信**
```sql
SELECT FromPersonID, Content
FROM PhoneRecords
WHERE Content LIKE '%ruin%'
   OR Content LIKE '%lose%';
```

**3.2 含 tonight 的短信**
```sql
SELECT FromPersonID, StartTime, Content
FROM PhoneRecords
WHERE Content LIKE '%tonight%';
```

**3.3 Eleanor 当天全部短信**
```sql
SELECT StartTime, Content
FROM PhoneRecords
WHERE FromPersonID = 7;
```

## 第 4 章 · 酒窖的诡影

**4.1 酒窖访问次数**
```sql
SELECT COUNT(*) FROM WineCellarLog;
```

**4.2 按人聚合酒窖访问**
```sql
SELECT p.FullName, COUNT(*) AS Trips
FROM WineCellarLog w
JOIN Persons p ON p.PersonID = w.TakenByPersonID
GROUP BY w.TakenByPersonID
ORDER BY Trips DESC;
```

**4.3 Vivienne 取走了什么酒**
```sql
SELECT b.Label, b.Vintage, b.ShelfLocation, w.AccessTime
FROM WineCellarLog w
JOIN WineBottles b ON b.BottleID = w.BottleID
WHERE w.TakenByPersonID = 2;
```

**4.4 Vivienne 之后发的短信**
```sql
SELECT StartTime, ToName, Content
FROM PhoneRecords
WHERE FromPersonID = 2
ORDER BY StartTime;
```

**4.5 草稿合同**
```sql
SELECT Title, Counterparty, Amount, Notes
FROM Contracts
WHERE Status = 'Draft';
```

## 第 5 章 · 借阅卡上的痕迹

**5.1 图书借阅 · 按人聚合**
```sql
SELECT p.FullName, COUNT(*) AS Borrowings
FROM LibraryCheckouts lc
JOIN Persons p ON p.PersonID = lc.PersonID
GROUP BY lc.PersonID
ORDER BY Borrowings DESC;
```

**5.2 Eleanor 借了什么**
```sql
SELECT b.Title, b.Author, lc.CheckoutDate, lc.ReturnDate
FROM LibraryCheckouts lc
JOIN Books b ON b.BookID = lc.BookID
WHERE lc.PersonID = 7;
```

**5.3 Iris 借了什么**
```sql
SELECT b.Title, lc.CheckoutDate
FROM LibraryCheckouts lc
JOIN Books b ON b.BookID = lc.BookID
WHERE lc.PersonID = 5;
```

## 第 6 章 · 行迹交错

**6.1 Marcus 的刷卡时间线**
```sql
SELECT p.FullName, k.AccessTime, r.Name, k.Notes
FROM KeycardAccess k
JOIN Persons p ON p.PersonID = k.PersonID
JOIN Rooms   r ON r.RoomID   = k.RoomID
WHERE p.FullName = 'Marcus Thorne'
ORDER BY k.AccessTime;
```

**6.2 Marcus 的 Wi-Fi 时间线**
```sql
SELECT w.StartTime, w.EndTime, r.Name AS AP, w.DataMB
FROM WiFiSessions w
JOIN Rooms r ON r.RoomID = w.APRoomID
WHERE w.PersonID = 4
ORDER BY w.StartTime;
```

**6.3 Eleanor 的 Wi-Fi 时间线**
```sql
SELECT w.StartTime, w.EndTime, r.Name AS AP, w.DataMB
FROM WiFiSessions w
JOIN Rooms r ON r.RoomID = w.APRoomID
WHERE w.PersonID = 7
ORDER BY w.StartTime;
```

## 第 7 章 · 餐桌上的密语

**7.1 Saturday 晚宴座次**
```sql
SELECT s.SeatNo, p.FullName
FROM SeatingChart s
JOIN Persons p ON p.PersonID = s.PersonID
ORDER BY s.SeatNo;
```

**7.2 全部偷听对话**
```sql
SELECT c.SpokenTime, sp.FullName AS Speaker,
       ls.FullName AS Listener, r.Name AS Room, c.Snippet
FROM Conversations c
JOIN Persons sp ON sp.PersonID = c.SpeakerID
LEFT JOIN Persons ls ON ls.PersonID = c.ListenerID
JOIN Rooms r ON r.RoomID = c.RoomID
ORDER BY c.SpokenTime;
```

**7.3 Elias 当晚所有发言**
```sql
SELECT c.SpokenTime, ls.FullName AS ToWhom, r.Name AS Room, c.Snippet
FROM Conversations c
LEFT JOIN Persons ls ON ls.PersonID = c.ListenerID
JOIN Rooms r ON r.RoomID = c.RoomID
WHERE c.SpeakerID = 1
ORDER BY c.SpokenTime;
```

## 第 8 章 · 沉默的房间

**8.1 无 CCTV 的房间**
```sql
SELECT RoomID, Name, Wing, Floor
FROM Rooms
WHERE HasCCTV = 0;
```

**8.2 被删除的 CCTV**
```sql
SELECT c.FileID, r.Name AS Room, c.RecordedStart,
       c.DeletedTime, p.FullName AS DeletedBy
FROM CCTVFiles c
JOIN Rooms r ON r.RoomID = c.RoomID
LEFT JOIN Persons p ON p.PersonID = c.DeletedByID
WHERE c.FileStatus = 'Deleted';
```

**8.3 ToD 期间 Wi-Fi 离线的嘉宾**
```sql
SELECT p.FullName
FROM Persons p
LEFT JOIN WiFiSessions w
  ON w.PersonID = p.PersonID
 AND w.StartTime < '2024-10-20 01:30'
 AND (w.EndTime > '2024-10-20 00:30' OR w.EndTime IS NULL)
WHERE p.PersonType = 'Guest'
  AND w.SessionID IS NULL;
```

**8.4 逐一排除其余宾客**
```sql
SELECT p.FullName, r.Name AS Room, k.AccessTime, k.AccessType
FROM KeycardAccess k
JOIN Persons p ON p.PersonID = k.PersonID
JOIN Rooms   r ON r.RoomID   = k.RoomID
WHERE k.AccessTime BETWEEN '2024-10-20 00:30' AND '2024-10-20 01:30'
ORDER BY k.AccessTime;
```

## 第 9 章 · 名字背后的名字（仪式）

**9.1 Elias 的公开家族**
```sql
SELECT p.FullName, ft.RelationType, ft.EffectiveYear
FROM FamilyTree ft
JOIN Persons p ON p.PersonID = ft.RelatedPersonID
WHERE ft.PersonID = 1;
```

**9.2 全部 Parent 关系**
```sql
SELECT p1.FullName AS Child, p2.FullName AS Parent,
       ft.RecordStatus, ft.EffectiveYear
FROM FamilyTree ft
JOIN Persons p1 ON p1.PersonID = ft.PersonID
JOIN Persons p2 ON p2.PersonID = ft.RelatedPersonID
WHERE ft.RelationType = 'Parent'
  AND ft.RecordStatus IN ('Public', 'Sealed_Adoption');
```
> 关键：`'Sealed_Adoption'` 字面必须写出，否则防剧透重写器会过滤掉封存行。

**9.3 Margaret 是谁的母亲**
```sql
SELECT p.FullName
FROM FamilyTree ft
JOIN Persons p ON p.PersonID = ft.PersonID
WHERE ft.RelatedPersonID = 14
  AND ft.RelationType = 'Parent'
  AND ft.RecordStatus = 'Sealed_Adoption';
```

## 第 10 章 · 被删除的告白（仪式）

**10.1 Elias 的写作日志**
```sql
SELECT EventTime, Action, FileName, PreviewText
FROM WritingSoftwareLog
ORDER BY EventTime;
```

**10.2 速生速灭的文件**
```sql
SELECT DISTINCT d.FileName
FROM WritingSoftwareLog d
WHERE d.Action = 'Delete'
  AND EXISTS (
    SELECT 1 FROM WritingSoftwareLog s
    WHERE s.FileName = d.FileName
      AND s.Action = 'Save'
      AND (julianday(d.EventTime) - julianday(s.EventTime)) * 24 * 60 <= 15
      AND s.EventTime < d.EventTime
  );
```

**10.3 鉴证科的物证报告**
```sql
SELECT e.ItemName, e.Analysis, p.FullName AS MatchedTo
FROM PhysicalEvidence e
LEFT JOIN Persons p ON p.PersonID = e.MatchedPersonID;
```

## 第 11 章 · 最终证明（仪式）

**11.1 八列证据**
```sql
SELECT
    p.FullName                                            AS Suspect,
    p.RelationToElias                                     AS PublicRelation,
    (SELECT 'Niece (Sealed: daughter of ' || sm.FullName || ')'
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
       AND  (b.Author = 'Margaret Blackwood'
          OR b.Author = 'Elias Blackwood'
          OR b.Genre  LIKE '%Sealed%'
          OR b.Title  LIKE '%Adoption%'))                 AS HeldEvidenceBooks,
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
WHERE  p.PersonID = 7;
```

---

## 案件结论

凶手 **Eleanor Wright（PersonID 7）**。她是 Margaret Blackwood 的私生女、Elias 的外甥女（封存领养记录）。
动机：Elias 抄袭 Margaret 手稿写成《沉默时刻》，且打算在颁奖宴上公开反口（GalaSpeech_FinalDraft）。
机会：00:48 经连接门进书房、01:02 离开，其余六名宾客均有可查证的不在场证明。
手段：青铜猎鹰书挡，柄部掌纹比中 Eleanor；尸检复核将死亡时间收窄到 00:50–01:05。

## 速通提示

控制台跳关：
```js
BMM2.state.completedTasks = ["0.1","1.1","2.1","3.1","3.2","3.3","4.1","4.2","4.3","4.4","4.5","5.1","5.2","5.3","6.1","6.2","6.3","7.1","7.2","7.3","8.1","8.2","8.3","8.4","9.1","9.2","9.3","10.1","10.2","10.3"];
BMM2_workspace.save(); location.reload();
```
重置存档：`localStorage.removeItem('bm_v2_state'); location.reload();`
