// Blackwood Manor case database — schema + seed (verbatim from PRD App A).
// DO NOT modify WiFiSessions row 17 timestamps — they are tuned so the
// Ch6 INNER JOIN reveals Eleanor's 00:28–01:35 Wi-Fi gap.
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
( 1, 'Elias Blackwood',   67, 'Victim',     'Author',          'Self',            103, 1957, 2024, 'Three-time Blackwood Prize founder. Found dead in Study at 08:30 Sun.'),
( 2, 'Vivienne Ashford',  52, 'Guest',      'Manor Owner',     'Ex-wife',         201, 1972, NULL, 'Inherited Ashford Manor. Divorced Elias 2016.'),
( 3, 'Sophia Blackwood',  32, 'Guest',      'Former Editor',   'Wife',            102, 1992, NULL, 'Met Elias as editor 2018. Married 2020.'),
( 4, 'Marcus Thorne',     49, 'Guest',      'Literary Agent',  'Agent of 22 yrs', 301, 1975, NULL, 'Recently divorced. Heavy drinker.'),
( 5, 'Iris Chen',         29, 'Guest',      'Author',          'Protégée',        302, 1995, NULL, 'Won 2023 Blackwood Prize. Quiet.'),
( 6, 'Julian Hartley',    58, 'Guest',      'Author',          'Rival',           303, 1966, NULL, 'Runner-up 2021, 2022, 2023. Wife died 2023.'),
( 7, 'Eleanor Wright',    44, 'Guest',      'Biographer',      'Authorized biographer', 304, 1980, NULL, 'Working on Elias biography for 3 yrs. Trinity Cambridge.'),
( 8, 'Henrik Volkov',     61, 'Guest',      'Critic',          'Critic',          305, 1963, NULL, 'Has trashed Elias''s last 4 novels. Russian-born.'),
( 9, 'Mrs Eileen Hodge',  58, 'Staff',      'Housekeeper',     'Staff',           502, 1966, NULL, 'Keeps a detailed notebook of guest behavior.'),
(10, 'Mr Albert Pemberton',62,'Staff',      'Butler',          'Staff',           502, 1962, NULL, 'CCTV system admin.'),
(11, 'Anton Volkov',      28, 'Staff',      'Gardener',        'Staff',           501, 1996, NULL, 'Henrik Volkov''s estranged son.'),
(12, 'Chef Pierre Dubois',45, 'Staff',      'Chef',            'Staff',           502, 1979, NULL, 'Catered the gala.'),
(13, 'Sarah Whitcombe',   26, 'Staff',      'Secretary',       'Elias''s assistant',NULL, 1998, NULL, 'Off-site Sat night. Arrived Sun 08:25 — discovered body.'),
(14, 'Margaret Blackwood',NULL,'Historical','Aspiring Author', 'Sister (deceased)',NULL,1964, 1986, 'Elias''s younger sister. Suicide at 22.'),
(15, 'Charles Blackwood', NULL,'Historical','Solicitor',       'Father (deceased)',NULL,1932, 2002, 'Father of Elias and Margaret.'),
(16, 'Henrietta Blackwood',NULL,'Historical','Homemaker',      'Mother (deceased)',NULL,1935, 2018, 'Mother of Elias and Margaret.'),
(17, 'Robert Wright',     NULL,'Historical','Schoolmaster',    'Adoptive father (Eleanor)',NULL,1940,2010,'Eleanor''s legal father.'),
(18, 'Patricia Wright',   NULL,'Historical','Librarian',       'Adoptive mother (Eleanor)',NULL,1942,2008,'Eleanor''s legal mother.');

INSERT INTO Rooms VALUES
(101, 'Master Suite (Elias)',  'East', 2, 0, 1),
(102, 'Master Annex (Sophia)', 'East', 2, 0, 1),
(103, 'Study',                 'East', 2, 0, 1),
(104, 'Library',               'Main', 1, 1, 1),
(105, 'Drawing Room',          'Main', 1, 1, 0),
(201, 'Ashford Suite',         'West', 2, 0, 1),
(301, 'Guest Room — Thorne',   'Guest',3, 0, 1),
(302, 'Guest Room — Chen',     'Guest',3, 0, 1),
(303, 'Guest Room — Hartley',  'Guest',3, 0, 1),
(304, 'Guest Room — Wright',   'Guest',3, 0, 1),
(305, 'Guest Room — Volkov',   'Guest',3, 0, 1),
(401, 'Wine Cellar',           'Sub',  -1,1, 1),
(402, 'Kitchen',               'Main', 1, 1, 0),
(403, 'Dining Hall',           'Main', 1, 1, 0),
(404, 'Conservatory',          'Main', 1, 1, 0),
(405, 'Archive',               'East', 2, 0, 1),
(406, 'Archive→Study Door',    'East', 2, 0, 1),
(501, 'Garden Cottage',        'Grounds',1,0, 1),
(502, 'Staff Quarters',        'Service',1,1, 0),
(601, 'Main Hall',             'Main', 1, 1, 0),
(602, 'East Corridor',         'East', 2, 1, 0),
(603, 'West Corridor',         'West', 2, 1, 0),
(604, 'Guest Corridor',        'Guest',3, 1, 0);

INSERT INTO KeycardAccess VALUES
(  1, 2, 403, '2024-10-19 18:55', 1, 'Entry', 'Aperitif gathering'),
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
( 13, 8, 305, '2024-10-19 22:35', 1, 'Entry', 'Did not exit until next morning'),
( 14, 5, 404, '2024-10-19 22:42', 1, 'Entry', 'Conservatory'),
( 15, 6, 401, '2024-10-19 22:45', 1, 'Entry', 'Took a Bordeaux'),
( 16, 6, 303, '2024-10-19 22:52', 1, 'Entry', NULL),
( 17, 2, 201, '2024-10-19 23:00', 1, 'Entry', NULL),
( 18, 4, 105, '2024-10-19 23:05', 1, 'Entry', 'Drawing room — drinking'),
( 19, 7, 405, '2024-10-19 23:15', 1, 'Entry', 'Archive — claimed late-night research'),
( 20, 1, 101, '2024-10-19 23:28', 1, 'Exit',  NULL),
( 21, 1, 103, '2024-10-19 23:30', 1, 'Entry', 'Elias enters Study'),
( 22, 4, 602, '2024-10-19 23:40', 1, 'Entry', 'East Corridor — Marcus heading to Elias''s wing'),
( 23, 4, 103, '2024-10-19 23:42', 0, 'Denied','Marcus card not authorized for Study'),
( 24, 4, 103, '2024-10-19 23:44', 1, 'Entry', 'Door opened from inside by Elias'),
( 25, 4, 103, '2024-10-19 23:58', 1, 'Exit',  'Marcus leaves Study'),
( 26, 4, 402, '2024-10-20 00:08', 1, 'Entry', 'Kitchen — Marcus seen with coffee mug'),
( 27, 4, 301, '2024-10-20 00:17', 1, 'Entry', 'Marcus retires'),
( 28, 6, 104, '2024-10-20 00:08', 1, 'Entry', NULL),
( 29, 6, 303, '2024-10-20 00:35', 1, 'Entry', NULL),
( 30, 5, 404, '2024-10-20 00:12', 1, 'Exit',  NULL),
( 31, 5, 104, '2024-10-20 00:15', 1, 'Entry', 'Library — overlaps Julian by 20 min'),
( 32, 5, 302, '2024-10-20 00:42', 1, 'Entry', NULL),
( 33, 2, 201, '2024-10-20 00:43', 1, 'Exit',  NULL),
( 34, 2, 401, '2024-10-20 00:46', 1, 'Entry', 'Wine cellar'),
( 35, 2, 401, '2024-10-20 00:50', 1, 'Exit',  NULL),
( 36, 2, 201, '2024-10-20 00:53', 1, 'Entry', NULL),
( 37, 7, 406, '2024-10-20 00:48', 1, 'Override', 'Archive→Study connecting door — biographer override authorization'),
( 38, 7, 103, '2024-10-20 00:48', 1, 'Entry',    'Entered Study via connecting door'),
( 39, 7, 103, '2024-10-20 01:02', 1, 'Exit',     'Left Study via connecting door'),
( 40, 7, 406, '2024-10-20 01:02', 1, 'Override', 'Back to Archive'),
( 41, 7, 405, '2024-10-20 01:15', 1, 'Exit',     'Eleanor leaves Archive officially'),
( 42, 7, 304, '2024-10-20 01:19', 1, 'Entry',    NULL),
( 43,10, 601, '2024-10-19 23:50', 1, 'Entry', 'Butler nightly rounds'),
( 44,10, 104, '2024-10-19 23:55', 1, 'Entry', NULL),
( 45,10, 502, '2024-10-20 00:30', 1, 'Entry', 'Pemberton retires'),
( 46,11, 501, '2024-10-19 22:00', 1, 'Entry', 'Anton in cottage all night'),
( 47, 9, 502, '2024-10-19 23:25', 1, 'Entry', 'Mrs Hodge retires'),
( 48,13, 601, '2024-10-20 08:25', 1, 'Entry', 'Sarah arrives'),
( 49,13, 103, '2024-10-20 08:30', 1, 'Entry', 'Door unlocked — finds body');

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
( 1, 4, '+44 7700 900221', 'Caroline Thorne (ex-wife)', 'SMS', '2024-10-19 23:15', NULL, 'He''s going to ruin me. 20 years and he just signs me off like rubbish.'),
( 2, 5, '+44 7700 900118', NULL,                       'Call','2024-10-19 21:50', 487,  NULL),
( 3, 7, '+44 7700 900304', NULL,                       'SMS', '2024-10-19 22:48', NULL, 'Tonight. I''ve prepared everything. Final pages.'),
( 4, 8, '+44 7700 900411', 'Anton Volkov',             'SMS', '2024-10-19 19:30', NULL, 'Anton — I''d like to talk. Please. Just five minutes.'),
( 5, 2, '+44 20 7946 0011','Edmund Pryce QC (lawyer)', 'Call','2024-10-19 22:00', 842,  NULL),
( 6, 4, '+44 7700 900303', 'Sophia Blackwood',         'SMS', '2024-10-20 00:20', NULL, 'We need to talk. Tomorrow. Properly this time.'),
( 7, 3, '+44 7700 900301', 'Marcus Thorne',            'SMS', '2024-10-20 00:22', NULL, 'Yes.'),
( 8, 6, '+44 7700 900555', 'Margaret Hartley Memorial Fund','SMS','2024-10-19 21:00',NULL,'Reminder: anniversary candle lit at home. Mum would be proud.'),
( 9, 4, '+44 7700 900221', 'Caroline Thorne (ex-wife)', 'SMS', '2024-10-19 21:48', NULL, 'I might lose everything. He''s changing agents.'),
(10, 7, '+44 7700 900304', NULL,                       'SMS', '2024-10-19 14:22', NULL, 'I''ll bring the diary. He won''t deny it to my face.'),
(11, 5, '+44 7700 900118', NULL,                       'SMS', '2024-10-20 00:50', NULL, 'I saw something. Will tell tomorrow. Don''t reply tonight.'),
(12, 2, '+44 20 7946 0011','Edmund Pryce QC (lawyer)', 'SMS', '2024-10-20 00:54', NULL, 'Recovered it. The draft is in my possession again.'),
(13, 8, '+44 7700 900411', 'Anton Volkov',             'SMS', '2024-10-19 22:01', NULL, 'I understand. I won''t ask again. — H.');

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
( 1, 'The Silent Hours',                 'Elias Blackwood',  1987, 'Literary Fiction', 'EB-01', 'Available'),
( 2, 'Whispers Through the Pines',       'Elias Blackwood',  1992, 'Literary Fiction', 'EB-02', 'Available'),
( 3, 'The Long Goodbye to Sussex',       'Elias Blackwood',  2001, 'Literary Fiction', 'EB-03', 'Available'),
( 4, 'Annotated Margaret B. (manuscript)', 'Margaret Blackwood',1985,'Literary Fiction (Unpublished)','Archive Box 12','Manuscript'),
( 5, 'Notebooks 1983–1986',              'Margaret Blackwood',1986,'Diary (Sealed)',   'Archive Box 13','Sealed'),
( 6, 'Poisons in Modern Literature',     'James Symons',     2018, 'Reference',        'REF-44', 'Available'),
( 7, 'The Detective''s Companion',       'A.K. Patel',       2019, 'Reference',        'REF-45', 'Available'),
( 8, 'Plagiarism and Authorship',        'D.M. Foster',      2015, 'Law',              'LAW-11', 'Available'),
( 9, 'Estate Planning in Practice',      'Sir Henry Crowne', 2020, 'Law',              'LAW-12', 'Available'),
(10, 'The Hartley Trilogy Volume I',     'Julian Hartley',   2018, 'Literary Fiction', 'JH-01', 'Available'),
(11, 'Dark Iris',                        'Iris Chen',        2023, 'Literary Fiction', 'IC-01', 'Available'),
(12, 'Blackwood Family History 1820–1990','Anonymous',       1991, 'Reference',        'EB-FAM-01','Available'),
(13, 'Russian Critics on English Letters','Henrik Volkov',   2014, 'Criticism',        'HV-01', 'Available'),
(14, 'Adoption Records of Gloucestershire 1975-1985','HM Govt Open Records',1990,'Reference','EB-FAM-02','Available');

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
( 1, 1, 6, 10, 403, '2024-10-19 19:45', 'Quietly between us — I don''t think you have it in you, Julian. Not the talent.'),
( 2, 5, 7, 9,  403, '2024-10-19 20:30', 'He doesn''t know I have copies of everything.'),
( 3, 4, 3, 12, 403, '2024-10-19 21:15', 'It can''t go on like this, Sophia. He''s burning everything.'),
( 4, 7, 1, 9,  403, '2024-10-19 21:40', 'Tonight, after the gala. The Archive. Bring nothing.'),
( 5, 1, 4, 10, 403, '2024-10-19 22:05', 'You''ll get what''s in the agreement, Marcus. Don''t push your luck.'),
( 6, 1, 7, 9,  601, '2024-10-19 22:30', 'You think a name on a marble plaque makes you family. It doesn''t.'),
( 7, 2, 1, 10, 105, '2024-10-19 22:55', 'If you sell this house out from under me, I will see you in court for a decade.'),
( 8, 8, 11, 9, 601, '2024-10-19 19:32', 'Anton — please. I know I have no right.'),
( 9, 6, 1, 10, 403, '2024-10-19 19:48', 'You don''t get to decide what I am. You decided that thirty years ago.'),
(10, 7, 5, 9,  104, '2024-10-19 16:20', 'Don''t ask me how I know. Just know that he knows you read it.');

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
( 1, '2024-10-19 16:42', 'Save',  'Memoir_Chapter7.scriv', 11820, 'Chapter Seven — I have always said my sister Margaret was a delicate girl, untouched by ambition. That was the kinder telling. The truer one is harder to write...', 1),
( 2, '2024-10-19 23:35', 'Save',  'Memoir_Chapter7.scriv', 12450, '...so unlike my sister, I never feared a blank page. She had the curse of doubt. I had the gift of certainty. And now, as I prepare to reveal her true contribution to The Silent Hours, I wonder whether her ghost will rise to thank me or to curse me...', 1),
( 3, '2024-10-19 23:50', 'Edit',  'Memoir_Chapter7.scriv', 13200, '...the manuscript she left at the cottage in 1985 — I have it still. I will reveal next month that some passages of The Silent Hours owed their breath to her marginalia. A footnote. A footnote in the literature of a man who wrote a masterpiece despite his sister, not because of her...', 1),
( 4, '2024-10-20 00:25', 'Save',  'GalaSpeech.scriv',      4860,  'My dear friends — I have lived three lives in writing. The first was a borrowed one. Tonight I want to talk about how we forgive ourselves for what we take...', 1),
( 5, '2024-10-20 00:30', 'Save',  'GalaSpeech_FinalDraft.scriv', 5400, 'FINAL — to be delivered Sunday 8pm. There has been a whisper this season that another hand shaped The Silent Hours. Let me end it tonight, plainly: the book is mine, every sentence of it. I will grieve my sister in private and sign my name in public. The memoir draft was never meant to leave my desk — it was a rehearsal of a confession I do not intend to make.', 1),
( 6, '2024-10-20 00:38', 'Save',  'Memo_PersonalNote.scriv',1840,  'Eleanor coming in 10 min. She knows. We will settle this. Three years of her work, my biography — she has been looking for something. After tonight she will be told. She has a right to ask. She does not have a right to ruin me. — E.B.', 1),
( 7, '2024-10-20 00:51', 'Delete','Memo_PersonalNote.scriv',NULL,  '[file deleted; autosave preview retained]', 7),
( 8, '2024-10-20 00:56', 'Save',  'Memoir_Chapter7.scriv', 13200, '[no content change; final autosave timestamp before laptop closed]', 1);

INSERT INTO PhysicalEvidence VALUES
( 1, 'Bronze Falcon Bookend (凶器)', 103, '2024-10-20 09:30', '柄部提取到一枚部分掌纹，与人员档案 #7 比对一致；撞击端检出死者血迹。这是杀死 Elias 的钝器。', 7),
( 2, '死者尸检 · 法医复核', 103, '2024-10-20 11:00', '尸温、尸僵与胃容物三项交叉，将死亡时间从 00:30–01:30 收窄至 00:50–01:05。', NULL),
( 3, '1985 年手写日记本', 103, '2024-10-20 09:35', '书房地毯上一本 Margaret Blackwood 的旧日记；封皮纤维与人员档案 #7 当晚随身物品一致——即 Eleanor 自述"带来对质"的那本。', 7),
( 4, '深灰羊毛纤维', 406, '2024-10-20 10:10', '档案室↔书房连接门门框上一缕羊毛纤维，与人员档案 #7 当晚所穿外套一致。', 7),
( 5, '白兰地酒杯', 105, '2024-10-20 09:40', 'Drawing Room 矮几上的玻璃杯，指纹与人员档案 #4 一致；位置与案发现场无关，排除嫌疑。', 4);

INSERT INTO Contracts VALUES
( 1, 'Manor Lifetime Usage Sale — AlphaCorp Hotels Ltd', 'AlphaCorp Hotels Ltd', '2024-10-05', 'Draft',     4500000.00, 'Sale of Elias''s lifetime usage rights to manor; Vivienne would lose tenancy entirely.'),
( 2, 'Termination of Agency Agreement — Marcus Thorne',  'Marcus Thorne',        '2024-10-12', 'Draft',     200000.00,  'Severance set at floor of contract; Marcus loses ~£2M future commission.'),
( 3, 'Publication of M. Blackwood Manuscripts (annotated by E. Blackwood)', 'Blackwood Estate', '2024-10-09', 'Draft', 0.00, 'Posthumous publication of Margaret''s writings under Elias''s annotation. Eleanor would learn of this Saturday at gala.'),
( 4, 'Ghostwriting Disclosure Agreement — Iris Chen',    'Iris Chen',           '2024-09-22', 'Draft',     500000.00,  'Settlement to keep Iris silent about her unattributed contributions to Whispers Through the Pines.'),
( 5, 'Existing Agent Agreement (extant)',                'Marcus Thorne',       '2002-06-01', 'Signed',    15.00,      '15 percent commission on all literary income.'),
( 6, 'Existing Marriage Contract (prenup)',              'Sophia Blackwood',    '2020-04-14', 'Signed',    1000000.00, '£1M cap on settlement, full forfeit if separation initiated by Sophia.');

INSERT INTO PrizeHistory VALUES
(2018, NULL, 6, 'Various'),
(2019, NULL, NULL, NULL),
(2020, NULL, NULL, NULL),
(2021, NULL, 6, 'The Hartley Trilogy I'),
(2022, NULL, 6, 'The Hartley Trilogy II'),
(2023, 5,    6, 'Dark Iris'),
(2024, NULL, NULL, NULL);
`;
