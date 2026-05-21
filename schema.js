// Blackwood Manor case database — schema + seed (verbatim from PRD App A).
// DO NOT modify WiFiSessions row 17 timestamps — they are tuned so the
// Ch6 INNER JOIN reveals Eleanor's 00:28–01:35 Wi-Fi gap.
// Names + narrative are Chinese; structural enum values (PersonType,
// AccessType, Status, Genre, Action, RelationType, RecordStatus, …) stay
// English because the task SQL filters on them.
window.BMM_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE Persons (
    PersonID INTEGER NOT NULL,
    FullName VARCHAR(50) NOT NULL,
    Age INTEGER,
    PersonType VARCHAR(15) NOT NULL,
    Occupation VARCHAR(40),
    RelationToElias VARCHAR(40),
    RoomID INTEGER,
    BirthYear INTEGER,
    DeathYear INTEGER,
    Notes VARCHAR(200),
    PRIMARY KEY (PersonID)
);

CREATE TABLE Rooms (
    RoomID INTEGER NOT NULL,
    Name VARCHAR(40) NOT NULL,
    Wing VARCHAR(20) NOT NULL,
    Floor INTEGER NOT NULL,
    HasCCTV INTEGER NOT NULL DEFAULT 0,
    HasKeycard INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (RoomID)
);

CREATE TABLE KeycardAccess (
    LogID INTEGER NOT NULL,
    PersonID INTEGER NOT NULL,
    RoomID INTEGER NOT NULL,
    AccessTime DATETIME NOT NULL,
    Granted INTEGER NOT NULL,
    AccessType VARCHAR(20) NOT NULL,
    Notes VARCHAR(100),
    PRIMARY KEY (LogID)
);

CREATE TABLE WiFiSessions (
    SessionID INTEGER NOT NULL,
    PersonID INTEGER NOT NULL,
    APRoomID INTEGER NOT NULL,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME,
    DataMB DECIMAL(8,2),
    DeviceType VARCHAR(20),
    PRIMARY KEY (SessionID)
);

CREATE TABLE PhoneRecords (
    RecordID INTEGER NOT NULL,
    FromPersonID INTEGER NOT NULL,
    ToNumber VARCHAR(30) NOT NULL,
    ToName VARCHAR(50),
    RecordType VARCHAR(10) NOT NULL,
    StartTime DATETIME NOT NULL,
    DurationSec INTEGER,
    Content VARCHAR(200),
    PRIMARY KEY (RecordID)
);

CREATE TABLE WineBottles (
    BottleID INTEGER NOT NULL,
    Label VARCHAR(60) NOT NULL,
    Vintage INTEGER,
    ShelfLocation VARCHAR(20),
    PRIMARY KEY (BottleID)
);

CREATE TABLE WineCellarLog (
    LogID INTEGER NOT NULL,
    BottleID INTEGER NOT NULL,
    TakenByPersonID INTEGER NOT NULL,
    AccessTime DATETIME NOT NULL,
    PRIMARY KEY (LogID)
);

CREATE TABLE Books (
    BookID INTEGER NOT NULL,
    Title VARCHAR(80) NOT NULL,
    Author VARCHAR(50) NOT NULL,
    Year INTEGER,
    Genre VARCHAR(30),
    ShelfLocation VARCHAR(20),
    Status VARCHAR(20) NOT NULL DEFAULT 'Available',
    PRIMARY KEY (BookID)
);

CREATE TABLE LibraryCheckouts (
    CheckoutID INTEGER NOT NULL,
    BookID INTEGER NOT NULL,
    PersonID INTEGER NOT NULL,
    CheckoutDate DATE NOT NULL,
    ReturnDate DATE,
    PRIMARY KEY (CheckoutID)
);

CREATE TABLE SeatingChart (
    EventDate DATE NOT NULL,
    TableNo INTEGER NOT NULL,
    SeatNo INTEGER NOT NULL,
    PersonID INTEGER NOT NULL,
    PRIMARY KEY (EventDate, TableNo, SeatNo)
);

CREATE TABLE Conversations (
    ConvID INTEGER NOT NULL,
    SpeakerID INTEGER NOT NULL,
    ListenerID INTEGER,
    OverheardByID INTEGER NOT NULL,
    RoomID INTEGER NOT NULL,
    SpokenTime DATETIME NOT NULL,
    Snippet VARCHAR(200) NOT NULL,
    PRIMARY KEY (ConvID)
);

CREATE TABLE CCTVFiles (
    FileID INTEGER NOT NULL,
    RoomID INTEGER NOT NULL,
    RecordedStart DATETIME NOT NULL,
    DurationSec INTEGER NOT NULL,
    FileStatus VARCHAR(15) NOT NULL,
    DeletedByID INTEGER,
    DeletedTime DATETIME,
    PRIMARY KEY (FileID)
);

CREATE TABLE FamilyTree (
    RecordID INTEGER NOT NULL,
    PersonID INTEGER NOT NULL,
    RelatedPersonID INTEGER NOT NULL,
    RelationType VARCHAR(30) NOT NULL,
    RecordStatus VARCHAR(20) NOT NULL DEFAULT 'Public',
    EffectiveYear INTEGER,
    PRIMARY KEY (RecordID)
);

CREATE TABLE WritingSoftwareLog (
    LogID INTEGER NOT NULL,
    EventTime DATETIME NOT NULL,
    Action VARCHAR(15) NOT NULL,
    FileName VARCHAR(80) NOT NULL,
    CharCount INTEGER,
    PreviewText VARCHAR(400),
    PerformedByPersonID INTEGER,
    PRIMARY KEY (LogID)
);

CREATE TABLE PhysicalEvidence (
    EvidenceID INTEGER NOT NULL,
    ItemName VARCHAR(60) NOT NULL,
    FoundInRoomID INTEGER,
    CollectedTime DATETIME,
    Analysis VARCHAR(220),
    MatchedPersonID INTEGER,
    PRIMARY KEY (EvidenceID)
);

CREATE TABLE Contracts (
    ContractID INTEGER NOT NULL,
    Title VARCHAR(80) NOT NULL,
    Counterparty VARCHAR(50),
    DraftedDate DATE NOT NULL,
    Status VARCHAR(15) NOT NULL,
    Amount DECIMAL(12,2),
    Notes VARCHAR(200),
    PRIMARY KEY (ContractID)
);

CREATE TABLE PrizeHistory (
    Year INTEGER NOT NULL,
    WinnerPersonID INTEGER,
    RunnerUpID INTEGER,
    BookTitle VARCHAR(80),
    PRIMARY KEY (Year)
);

INSERT INTO Persons VALUES
( 1, '伊莱亚斯·布莱克伍德', 67, 'Victim',     '作家',        '死者本人',          103, 1957, 2024, '黑木文学奖创办人，三度获奖作家。周日 08:30 被发现死于书房。'),
( 2, '薇薇安·阿什福德',   52, 'Guest',      '庄园主人',    '前妻',              201, 1972, NULL, '阿什福德庄园继承人。2016 年与伊莱亚斯离婚。'),
( 3, '索菲娅·布莱克伍德', 32, 'Guest',      '前编辑',      '现任妻子',          102, 1992, NULL, '2018 年以编辑身份结识伊莱亚斯，2020 年结婚。'),
( 4, '马库斯·索恩',       49, 'Guest',      '文学经纪人',  '合作 22 年的经纪人', 301, 1975, NULL, '近期离婚，酗酒严重。'),
( 5, '艾莉丝·陈',         29, 'Guest',      '作家',        '门生',              302, 1995, NULL, '2023 年黑木文学奖得主。寡言。'),
( 6, '朱利安·哈特利',     58, 'Guest',      '作家',        '宿敌',              303, 1966, NULL, '2021、2022、2023 连续三年亚军。妻子 2023 年去世。'),
( 7, '埃莉诺·赖特',       44, 'Guest',      '传记作者',    '授权传记作者',      304, 1980, NULL, '为伊莱亚斯写传记三年。剑桥三一学院出身。'),
( 8, '亨里克·沃尔科夫',   61, 'Guest',      '评论家',      '评论家',            305, 1963, NULL, '把伊莱亚斯最近四部小说骂得体无完肤。俄裔。'),
( 9, '艾琳·霍奇太太',     58, 'Staff',      '管家',        '庄园员工',          502, 1966, NULL, '随身带着一本记录宾客言行的笔记本。'),
(10, '阿尔伯特·彭伯顿',   62, 'Staff',      '男管家',      '庄园员工',          502, 1962, NULL, 'CCTV 监控系统管理员。'),
(11, '安东·沃尔科夫',     28, 'Staff',      '园丁',        '庄园员工',          501, 1996, NULL, '评论家亨里克·沃尔科夫疏远的儿子。'),
(12, '皮埃尔·杜布瓦',     45, 'Staff',      '主厨',        '庄园员工',          502, 1979, NULL, '承办了周六的颁奖晚宴。'),
(13, '萨拉·惠特科姆',     26, 'Staff',      '秘书',        '伊莱亚斯的助理',    NULL, 1998, NULL, '周六夜不在庄园。周日 08:25 抵达——发现尸体。'),
(14, '玛格丽特·布莱克伍德',NULL,'Historical','有抱负的作家','妹妹（已故）',      NULL, 1964, 1986, '伊莱亚斯的妹妹。22 岁自杀。'),
(15, '查尔斯·布莱克伍德', NULL,'Historical', '律师',        '父亲（已故）',      NULL, 1932, 2002, '伊莱亚斯与玛格丽特的父亲。'),
(16, '亨丽埃塔·布莱克伍德',NULL,'Historical','家庭主妇',    '母亲（已故）',      NULL, 1935, 2018, '伊莱亚斯与玛格丽特的母亲。'),
(17, '罗伯特·赖特',       NULL,'Historical', '中学校长',    '养父（埃莉诺）',    NULL, 1940, 2010, '埃莉诺法律意义上的父亲。'),
(18, '帕特里夏·赖特',     NULL,'Historical', '图书管理员',  '养母（埃莉诺）',    NULL, 1942, 2008, '埃莉诺法律意义上的母亲。');

INSERT INTO Rooms VALUES
(101, '主人套房（伊莱亚斯）', 'East', 2, 0, 1),
(102, '主人配房（索菲娅）',   'East', 2, 0, 1),
(103, '书房',               'East', 2, 0, 1),
(104, '图书馆',             'Main', 1, 1, 1),
(105, '客厅',               'Main', 1, 1, 0),
(201, '阿什福德套房',       'West', 2, 0, 1),
(301, '客房——索恩',        'Guest',3, 0, 1),
(302, '客房——陈',          'Guest',3, 0, 1),
(303, '客房——哈特利',      'Guest',3, 0, 1),
(304, '客房——赖特',        'Guest',3, 0, 1),
(305, '客房——沃尔科夫',    'Guest',3, 0, 1),
(401, '酒窖',               'Sub',  -1,1, 1),
(402, '厨房',               'Main', 1, 1, 0),
(403, '宴会厅',             'Main', 1, 1, 0),
(404, '温室',               'Main', 1, 1, 0),
(405, '档案室',             'East', 2, 0, 1),
(406, '档案室→书房连接门',  'East', 2, 0, 1),
(501, '花园小屋',           'Grounds',1,0, 1),
(502, '仆役区',             'Service',1,1, 0),
(601, '正厅',               'Main', 1, 1, 0),
(602, '东翼走廊',           'East', 2, 1, 0),
(603, '西翼走廊',           'West', 2, 1, 0),
(604, '宾客区走廊',         'Guest',3, 1, 0);

INSERT INTO KeycardAccess VALUES
(  1, 2, 403, '2024-10-19 18:55', 1, 'Entry', '餐前酒会'),
(  2, 3, 403, '2024-10-19 18:58', 1, 'Entry', NULL),
(  3, 1, 403, '2024-10-19 19:02', 1, 'Entry', NULL),
(  4, 4, 403, '2024-10-19 19:05', 1, 'Entry', NULL),
(  5, 5, 403, '2024-10-19 19:08', 1, 'Entry', NULL),
(  6, 6, 403, '2024-10-19 19:10', 1, 'Entry', NULL),
(  7, 7, 403, '2024-10-19 19:14', 1, 'Entry', NULL),
(  8, 8, 403, '2024-10-19 19:18', 1, 'Entry', NULL),
( 10, 1, 403, '2024-10-19 22:08', 1, 'Exit', NULL),
( 11, 1, 101, '2024-10-19 22:15', 1, 'Entry', NULL),
( 12, 3, 102, '2024-10-19 22:22', 1, 'Entry', NULL),
( 13, 8, 305, '2024-10-19 22:35', 1, 'Entry', '直到次日清晨才离开'),
( 14, 5, 404, '2024-10-19 22:42', 1, 'Entry', '温室'),
( 15, 6, 401, '2024-10-19 22:45', 1, 'Entry', '取走一瓶波尔多'),
( 16, 6, 303, '2024-10-19 22:52', 1, 'Entry', NULL),
( 17, 2, 201, '2024-10-19 23:00', 1, 'Entry', NULL),
( 18, 4, 105, '2024-10-19 23:05', 1, 'Entry', '客厅——饮酒'),
( 19, 7, 405, '2024-10-19 23:15', 1, 'Entry', '档案室——自称深夜查资料'),
( 20, 1, 101, '2024-10-19 23:28', 1, 'Exit',  NULL),
( 21, 1, 103, '2024-10-19 23:30', 1, 'Entry', '伊莱亚斯进入书房'),
( 22, 4, 602, '2024-10-19 23:40', 1, 'Entry', '东翼走廊——马库斯前往伊莱亚斯所在的侧翼'),
( 23, 4, 103, '2024-10-19 23:42', 0, 'Denied','马库斯的门卡无书房权限'),
( 24, 4, 103, '2024-10-19 23:44', 1, 'Entry', '门由伊莱亚斯从里面打开'),
( 25, 4, 103, '2024-10-19 23:58', 1, 'Exit',  '马库斯离开书房'),
( 26, 4, 402, '2024-10-20 00:08', 1, 'Entry', '厨房——有人看到马库斯端着咖啡杯'),
( 27, 4, 301, '2024-10-20 00:17', 1, 'Entry', '马库斯回房休息'),
( 28, 6, 104, '2024-10-20 00:08', 1, 'Entry', NULL),
( 29, 6, 303, '2024-10-20 00:35', 1, 'Entry', NULL),
( 30, 5, 404, '2024-10-20 00:12', 1, 'Exit',  NULL),
( 31, 5, 104, '2024-10-20 00:15', 1, 'Entry', '图书馆——与朱利安重叠 20 分钟'),
( 32, 5, 302, '2024-10-20 00:42', 1, 'Entry', NULL),
( 33, 2, 201, '2024-10-20 00:43', 1, 'Exit',  NULL),
( 34, 2, 401, '2024-10-20 00:46', 1, 'Entry', '酒窖'),
( 35, 2, 401, '2024-10-20 00:50', 1, 'Exit',  NULL),
( 36, 2, 201, '2024-10-20 00:53', 1, 'Entry', NULL),
( 37, 7, 406, '2024-10-20 00:48', 1, 'Override', '档案室→书房连接门——传记作者越权授权'),
( 38, 7, 103, '2024-10-20 00:48', 1, 'Entry',    '经连接门进入书房'),
( 39, 7, 103, '2024-10-20 01:02', 1, 'Exit',     '经连接门离开书房'),
( 40, 7, 406, '2024-10-20 01:02', 1, 'Override', '返回档案室'),
( 41, 7, 405, '2024-10-20 01:15', 1, 'Exit',     '埃莉诺正式离开档案室'),
( 42, 7, 304, '2024-10-20 01:19', 1, 'Entry',    NULL),
( 43,10, 601, '2024-10-19 23:50', 1, 'Entry', '男管家夜间巡查'),
( 44,10, 104, '2024-10-19 23:55', 1, 'Entry', NULL),
( 45,10, 502, '2024-10-20 00:30', 1, 'Entry', '彭伯顿回房休息'),
( 46,11, 501, '2024-10-19 22:00', 1, 'Entry', '安东整夜待在花园小屋'),
( 47, 9, 502, '2024-10-19 23:25', 1, 'Entry', '霍奇太太回房休息'),
( 48,13, 601, '2024-10-20 08:25', 1, 'Entry', '萨拉抵达'),
( 49,13, 103, '2024-10-20 08:30', 1, 'Entry', '门已开锁——发现尸体');

INSERT INTO WiFiSessions VALUES
( 1, 1, 103, '2024-10-19 23:32', '2024-10-20 00:56', 412.3, 'Laptop'),
( 2, 3, 102, '2024-10-19 22:25', '2024-10-20 01:24', 1842.5, 'Tablet'),
( 3, 3, 102, '2024-10-19 23:50', '2024-10-19 23:52', 0.4,    'Phone'),
( 4, 3, 102, '2024-10-20 00:21', '2024-10-20 00:24', 1.2,    'Phone'),
( 5, 4, 105, '2024-10-19 23:05', '2024-10-19 23:38', 22.1,  'Phone'),
( 6, 4, 301, '2024-10-20 00:18', '2024-10-20 02:30', 8.5,   'Phone'),
( 7, 5, 404, '2024-10-19 22:45', '2024-10-20 00:11', 156.7, 'Phone'),
( 8, 5, 104, '2024-10-20 00:16', '2024-10-20 00:41', 67.3,  'Phone'),
( 9, 5, 302, '2024-10-20 00:43', '2024-10-20 03:00', 12.0,  'Phone'),
(10, 6, 303, '2024-10-19 22:55', '2024-10-20 00:05', 8.2,   'Phone'),
(11, 6, 104, '2024-10-20 00:09', '2024-10-20 00:34', 0.9,   'Phone'),
(12, 6, 303, '2024-10-20 00:36', '2024-10-20 02:00', 4.1,   'Phone'),
(13, 8, 305, '2024-10-19 22:38', '2024-10-19 23:02', 5.5,   'Phone'),
(14, 2, 201, '2024-10-19 23:01', '2024-10-19 23:55', 14.3,  'Phone'),
(15, 2, 201, '2024-10-20 00:55', '2024-10-20 02:10', 3.8,   'Phone'),
(16, 7, 405, '2024-10-19 23:16', '2024-10-20 00:28', 18.4,  'Phone'),
(17, 7, 304, '2024-10-20 01:35', '2024-10-20 02:45', 6.7,   'Phone');

INSERT INTO PhoneRecords VALUES
( 1, 4, '+44 7700 900221', '卡罗琳·索恩（前妻）',       'SMS', '2024-10-19 23:15', NULL, '他要毁了我。二十年，他就这样把我一笔勾销，像扔垃圾一样。'),
( 2, 5, '+44 7700 900118', NULL,                       'Call','2024-10-19 21:50', 487,  NULL),
( 3, 7, '+44 7700 900304', NULL,                       'SMS', '2024-10-19 22:48', NULL, '就在今夜。我什么都准备好了。最后几页。'),
( 4, 8, '+44 7700 900411', '安东·沃尔科夫',             'SMS', '2024-10-19 19:30', NULL, '安东——我想谈谈。求你了。只要五分钟。'),
( 5, 2, '+44 20 7946 0011','埃德蒙·普莱斯（御用大律师）','Call','2024-10-19 22:00', 842,  NULL),
( 6, 4, '+44 7700 900303', '索菲娅·布莱克伍德',         'SMS', '2024-10-20 00:20', NULL, '我们得谈谈。明天。这次要好好谈。'),
( 7, 3, '+44 7700 900301', '马库斯·索恩',               'SMS', '2024-10-20 00:22', NULL, '好。'),
( 8, 6, '+44 7700 900555', '玛格丽特·哈特利纪念基金',   'SMS', '2024-10-19 21:00', NULL, '提醒：家中已点燃周年纪念蜡烛。妈妈会为你骄傲的。'),
( 9, 4, '+44 7700 900221', '卡罗琳·索恩（前妻）',       'SMS', '2024-10-19 21:48', NULL, '我可能会失去一切。他要换经纪人了。'),
(10, 7, '+44 7700 900304', NULL,                       'SMS', '2024-10-19 14:22', NULL, '我会带上那本日记。当着我的面，他抵赖不了。'),
(11, 5, '+44 7700 900118', NULL,                       'SMS', '2024-10-20 00:50', NULL, '我看到了一些东西。明天再说。今夜别回。'),
(12, 2, '+44 20 7946 0011','埃德蒙·普莱斯（御用大律师）','SMS', '2024-10-20 00:54', NULL, '已经取回。那份草约重新回到我手里了。'),
(13, 8, '+44 7700 900411', '安东·沃尔科夫',             'SMS', '2024-10-19 22:01', NULL, '我明白了。我不会再问了。——H。');

INSERT INTO WineBottles VALUES
( 1, 'Château Margaux',         2005, 'A-12'),
( 2, 'Pétrus',                  1998, 'A-08'),
( 3, 'Domaine Leroy Burgundy',  1995, 'B-04'),
( 4, 'Bordeaux Saint-Émilion',  2010, 'C-21'),
( 5, 'Château Mouton Rothschild',1986, 'A-15'),
( 6, 'Krug Grande Cuvée',       2008, 'D-01'),
( 7, 'Sancerre Loire',          2019, 'E-07'),
( 8, 'Tokaji Aszú',             2003, 'F-02');

INSERT INTO WineCellarLog VALUES
( 1, 6, 12, '2024-10-19 14:30'),
( 2, 1, 12, '2024-10-19 15:00'),
( 3, 5, 12, '2024-10-19 15:15'),
( 4, 7, 12, '2024-10-19 15:45'),
( 5, 8, 12, '2024-10-19 16:10'),
( 6, 4, 12, '2024-10-19 19:30'),
( 7, 6, 6,  '2024-10-19 22:45'),
( 8, 2, 2,  '2024-10-20 00:46');

INSERT INTO Books VALUES
( 1, '沉默时刻',                   '伊莱亚斯·布莱克伍德', 1987, 'Literary Fiction', 'EB-01', 'Available'),
( 2, '松林间的低语',               '伊莱亚斯·布莱克伍德', 1992, 'Literary Fiction', 'EB-02', 'Available'),
( 3, '告别苏塞克斯',               '伊莱亚斯·布莱克伍德', 2001, 'Literary Fiction', 'EB-03', 'Available'),
( 4, '玛格丽特·B 手稿（附注本）',   '玛格丽特·布莱克伍德', 1985,'Literary Fiction (Unpublished)','Archive Box 12','Manuscript'),
( 5, '笔记本 1983–1986',           '玛格丽特·布莱克伍德', 1986,'Diary (Sealed)',   'Archive Box 13','Sealed'),
( 6, '现代文学中的毒物',           '詹姆斯·西蒙斯',       2018, 'Reference',        'REF-44', 'Available'),
( 7, '侦探手册',                   'A.K. 帕特尔',         2019, 'Reference',        'REF-45', 'Available'),
( 8, '剽窃与著作权',               'D.M. 福斯特',         2015, 'Law',              'LAW-11', 'Available'),
( 9, '遗产规划实务',               '亨利·克朗爵士',       2020, 'Law',              'LAW-12', 'Available'),
(10, '哈特利三部曲 卷一',          '朱利安·哈特利',       2018, 'Literary Fiction', 'JH-01', 'Available'),
(11, '暗色鸢尾',                   '艾莉丝·陈',           2023, 'Literary Fiction', 'IC-01', 'Available'),
(12, '布莱克伍德家族史 1820–1990', '佚名',                1991, 'Reference',        'EB-FAM-01','Available'),
(13, '俄国评论家论英国文学',       '亨里克·沃尔科夫',     2014, 'Criticism',        'HV-01', 'Available'),
(14, '格洛斯特郡领养记录 1975-1985','英国政府公开档案',   1990, 'Reference',        'EB-FAM-02','Available');

INSERT INTO LibraryCheckouts VALUES
( 1,  1, 1, '2024-04-12', '2024-04-15'),
( 2,  6, 6, '2024-04-20', '2024-05-02'),
( 3,  7, 6, '2024-05-05', '2024-05-12'),
( 4,  1, 5, '2024-05-10', '2024-05-25'),
( 5,  8, 5, '2024-05-15', '2024-06-01'),
( 6, 12, 7, '2024-05-20', '2024-06-15'),
( 7,  6, 6, '2024-06-08', '2024-06-20'),
( 8,  9, 2, '2024-06-12', '2024-06-30'),
( 9,  1, 5, '2024-07-02', '2024-07-18'),
(10,  4, 7, '2024-07-05', NULL),
(11, 12, 7, '2024-07-20', '2024-08-15'),
(12,  6, 6, '2024-08-01', '2024-08-14'),
(13,  7, 6, '2024-08-15', '2024-08-28'),
(14,  9, 2, '2024-08-20', '2024-09-10'),
(15, 14, 7, '2024-08-25', NULL),
(16,  1, 5, '2024-09-05', '2024-09-22'),
(17,  8, 7, '2024-09-12', '2024-10-01'),
(18, 13, 8, '2024-09-15', '2024-10-10'),
(19,  5, 7, '2024-09-28', NULL),
(20,  6, 6, '2024-10-02', '2024-10-15'),
(21,  4, 7, '2024-10-10', NULL),
(22,  1, 7, '2024-10-15', NULL);

INSERT INTO SeatingChart VALUES
('2024-10-19', 1, 1, 1),
('2024-10-19', 1, 2, 3),
('2024-10-19', 1, 3, 4),
('2024-10-19', 1, 4, 8),
('2024-10-19', 1, 5, 6),
('2024-10-19', 1, 6, 5),
('2024-10-19', 1, 7, 7),
('2024-10-19', 1, 8, 2);

INSERT INTO Conversations VALUES
( 1, 1, 6, 10, 403, '2024-10-19 19:45', '私下跟你说——我不觉得你有这个天分，朱利安。没有那种才华。'),
( 2, 5, 7, 9,  403, '2024-10-19 20:30', '他不知道我留着一切的副本。'),
( 3, 4, 3, 12, 403, '2024-10-19 21:15', '不能再这样下去了，索菲娅。他在把一切都烧掉。'),
( 4, 7, 1, 9,  403, '2024-10-19 21:40', '今夜，颁奖礼之后。档案室。什么都别带。'),
( 5, 1, 4, 10, 403, '2024-10-19 22:05', '协议上写了什么，你就拿什么，马库斯。别得寸进尺。'),
( 6, 1, 7, 9,  601, '2024-10-19 22:30', '你以为大理石牌子上刻了个名字，就算家人了。不是的。'),
( 7, 2, 1, 10, 105, '2024-10-19 22:55', '你要是把这房子从我脚下卖掉，我会和你打十年官司。'),
( 8, 8, 11, 9, 601, '2024-10-19 19:32', '安东——求你了。我知道我没有这个资格。'),
( 9, 6, 1, 10, 403, '2024-10-19 19:48', '你没资格决定我是什么。三十年前你就替我决定了。'),
(10, 7, 5, 9,  104, '2024-10-19 16:20', '别问我怎么知道的。你只要知道——他知道你读过它。');

INSERT INTO CCTVFiles VALUES
( 1, 601, '2024-10-19 18:00', 3600, 'Intact',  NULL, NULL),
( 2, 403, '2024-10-19 19:00', 10800,'Intact',  NULL, NULL),
( 3, 104, '2024-10-19 22:00', 3600, 'Intact',  NULL, NULL),
( 4, 401, '2024-10-19 22:00', 3600, 'Intact',  NULL, NULL),
( 5, 104, '2024-10-19 23:00', 3600, 'Intact',  NULL, NULL),
( 6, 602, '2024-10-19 23:00', 3600, 'Intact',  NULL, NULL),
( 7, 602, '2024-10-20 00:00', 3600, 'Deleted', 1, '2024-10-20 00:25'),
( 8, 602, '2024-10-20 01:00', 3600, 'Deleted', 1, '2024-10-20 00:25'),
( 9, 601, '2024-10-19 23:00', 3600, 'Intact',  NULL, NULL),
(10, 104, '2024-10-20 00:00', 3600, 'Intact',  NULL, NULL),
(11, 104, '2024-10-20 01:00', 3600, 'Intact',  NULL, NULL),
(12, 401, '2024-10-20 00:00', 3600, 'Intact',  NULL, NULL),
(13, 403, '2024-10-19 22:00', 3600, 'Intact',  NULL, NULL),
(14, 601, '2024-10-20 00:00', 3600, 'Intact',  NULL, NULL),
(15, 601, '2024-10-20 01:00', 3600, 'Intact',  NULL, NULL),
(16, 601, '2024-10-20 02:00', 3600, 'Intact',  NULL, NULL);

INSERT INTO FamilyTree VALUES
( 1, 1,15, 'Parent',   'Public',         1957),
( 2, 1,16, 'Parent',   'Public',         1957),
( 3, 1,14, 'Sibling',  'Public',         1964),
( 4,14,15, 'Parent',   'Public',         1964),
( 5,14,16, 'Parent',   'Public',         1964),
( 6, 1, 2, 'ExSpouse', 'Public',         1990),
( 7, 2, 1, 'ExSpouse', 'Public',         1990),
( 8, 1, 3, 'Spouse',   'Public',         2020),
( 9, 3, 1, 'Spouse',   'Public',         2020),
(10, 7,17, 'Parent',   'Public',         1980),
(11, 7,18, 'Parent',   'Public',         1980),
(12,11, 8, 'Parent',   'Public',         1996),
(13, 7,14, 'Parent',   'Sealed_Adoption',1980);

INSERT INTO WritingSoftwareLog VALUES
( 1, '2024-10-19 16:42', 'Save',  'Memoir_Chapter7.scriv', 11820, '第七章——我一直说，我的妹妹玛格丽特是个纤弱的姑娘，与抱负无缘。那是比较仁慈的说法。真实的版本，更难写下……', 1),
( 2, '2024-10-19 23:35', 'Save',  'Memoir_Chapter7.scriv', 12450, '……与我妹妹不同，我从不畏惧空白的稿纸。她背负着怀疑的诅咒，我拥有笃定的天赋。如今，当我准备揭示她对《沉默时刻》的真正贡献时，我不知道她的魂灵会升起来感谢我，还是诅咒我……', 1),
( 3, '2024-10-19 23:50', 'Edit',  'Memoir_Chapter7.scriv', 13200, '……她 1985 年留在小屋里的那份手稿——我至今仍留着。下个月我将公开：《沉默时刻》中有些段落，呼吸来自她的旁注。一个脚注。一个脚注，写进一个不靠妹妹、反而是不顾妹妹才写出杰作的男人的文学里……', 1),
( 4, '2024-10-20 00:25', 'Save',  'GalaSpeech.scriv',      4860,  '亲爱的朋友们——我在写作中活过三段人生。第一段是借来的。今夜我想谈谈，我们如何原谅自己所拿走的东西……', 1),
( 5, '2024-10-20 00:30', 'Save',  'GalaSpeech_FinalDraft.scriv', 5400, '终稿——周日晚 8 点宣读。这一季有一种私语，说《沉默时刻》出自另一只手。今夜让我把它了结，把话说清楚：这本书是我的，每一个句子都是。我会私下哀悼我的妹妹，并在公开场合签上我的名字。那份回忆录草稿本就不该离开我的书桌——它只是一次彩排，彩排一场我并不打算做出的忏悔。', 1),
( 6, '2024-10-20 00:38', 'Save',  'Memo_PersonalNote.scriv',1840,  '埃莉诺十分钟后到。她知道了。我们会把这件事了结。三年来她做我的传记——她一直在找什么东西。今夜过后她会被告知。她有权利发问。但她没有权利毁掉我。——E.B.', 1),
( 7, '2024-10-20 00:51', 'Delete','Memo_PersonalNote.scriv',NULL,  '[文件已删除；自动保存预览已保留]', 7),
( 8, '2024-10-20 00:56', 'Save',  'Memoir_Chapter7.scriv', 13200, '[内容无变化；笔记本电脑关闭前的最后一次自动保存时间戳]', 1);

INSERT INTO PhysicalEvidence VALUES
( 1, '青铜隼形书挡（凶器）', 103, '2024-10-20 09:30', '柄部提取到一枚部分掌纹，与人员档案 #7 比对一致；撞击端检出死者血迹。这是杀死伊莱亚斯的钝器。', 7),
( 2, '死者尸检 · 法医复核', 103, '2024-10-20 11:00', '尸温、尸僵与胃容物三项交叉，将死亡时间从 00:30–01:30 收窄至 00:50–01:05。', NULL),
( 3, '1985 年手写日记本', 103, '2024-10-20 09:35', '书房地毯上一本玛格丽特·布莱克伍德的旧日记；封皮纤维与人员档案 #7 当晚随身物品一致——即埃莉诺自述"带来对质"的那本。', 7),
( 4, '深灰羊毛纤维', 406, '2024-10-20 10:10', '档案室↔书房连接门门框上一缕羊毛纤维，与人员档案 #7 当晚所穿外套一致。', 7),
( 5, '白兰地酒杯', 105, '2024-10-20 09:40', '客厅矮几上的玻璃杯，指纹与人员档案 #4 一致；位置与案发现场无关，排除嫌疑。', 4);

INSERT INTO Contracts VALUES
( 1, '庄园终身使用权出售——AlphaCorp 酒店有限公司', 'AlphaCorp 酒店有限公司', '2024-10-05', 'Draft',     4500000.00, '出售伊莱亚斯的庄园终身使用权；薇薇安将彻底失去居住权。'),
( 2, '经纪代理协议终止——马库斯·索恩',  '马库斯·索恩',        '2024-10-12', 'Draft',     200000.00,  '遣散费按合同下限设定；马库斯将损失约 200 万英镑的未来佣金。'),
( 3, 'M·布莱克伍德手稿出版（由 E·布莱克伍德附注）', '布莱克伍德庄园（遗产）', '2024-10-09', 'Draft', 0.00, '玛格丽特遗作在伊莱亚斯附注下的身后出版。埃莉诺将于周六颁奖礼上得知此事。'),
( 4, '代笔披露协议——艾莉丝·陈',    '艾莉丝·陈',           '2024-09-22', 'Draft',     500000.00,  '为让艾莉丝对其在《松林间的低语》中未署名的贡献保持沉默而达成的和解。'),
( 5, '现行经纪代理协议（仍有效）',                '马库斯·索恩',       '2002-06-01', 'Signed',    15.00,      '所有文学收入抽成 15%。'),
( 6, '现行婚姻协议（婚前协议）',              '索菲娅·布莱克伍德',    '2020-04-14', 'Signed',    1000000.00, '和解金上限 100 万英镑，若由索菲娅主动提出分居则全部丧失。');

INSERT INTO PrizeHistory VALUES
(2018, NULL, 6, '多部作品'),
(2019, NULL, NULL, NULL),
(2020, NULL, NULL, NULL),
(2021, NULL, 6, '哈特利三部曲 卷一'),
(2022, NULL, 6, '哈特利三部曲 卷二'),
(2023, 5,    6, '暗色鸢尾'),
(2024, NULL, NULL, NULL);
`;
