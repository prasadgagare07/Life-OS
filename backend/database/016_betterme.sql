-- ==========================================
-- BETTERME — Habits & Personal Growth
-- Daily habit grid (habit + date completion),
-- plus three simple checklists: Things to
-- Learn, Things to Master, Character & Values.
-- ==========================================

CREATE TABLE IF NOT EXISTS betterme_habits (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    position    INTEGER NOT NULL,
    archived    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS betterme_habit_completion (
    id          SERIAL PRIMARY KEY,
    habit_id    INTEGER NOT NULL REFERENCES betterme_habits(id) ON DELETE CASCADE,
    entry_date  DATE NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('done','missed')),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(habit_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_betterme_completion_date
ON betterme_habit_completion(entry_date);

CREATE TABLE IF NOT EXISTS betterme_list_items (
    id          SERIAL PRIMARY KEY,
    category    TEXT NOT NULL CHECK (category IN ('learn','master','character')),
    text        TEXT NOT NULL,
    position    INTEGER NOT NULL,
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    archived    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_betterme_list_category
ON betterme_list_items(category);


-- ==========================================
-- SEED DATA — only runs once, on an empty table,
-- so it never overwrites anything you've since
-- renamed, reordered, added, or deleted.
-- ==========================================

INSERT INTO betterme_habits (name, position)
SELECT * FROM (VALUES
  ('Brush teeth 2 times — morning + night', 1),
  ('Wake up on time', 2),
  ('Sleep on time', 3),
  ('Drink 5 litres of water/day', 4),
  ('Take a bath regularly', 5),
  ('Wear clean clothes', 6),
  ('Hair care — oil + towel', 7),
  ('Dandruff care / shampoo regularly', 8),
  ('No junk food + control unnecessary food', 9),
  ('10,000+ steps', 10),
  ('Exercise — 30 min', 11),
  ('Go outside once a day', 12),
  ('Meditation — 5 min', 13),
  ('1 hour without mobile', 14),
  ('Read 10 pages a day', 15),
  ('Mirror talk + eye contact practice', 16),
  ('Practice good body language', 17),
  ('Practice speaking clearly', 18),
  ('Practice listening more than speaking', 19),
  ('Keep your surroundings/room clean', 20),
  ('Review your day before sleep', 21),
  ('Plan tomorrow before sleep', 22),
  ('Avoid wasting money unnecessarily', 23),
  ('Do 1 thing for my long-term goal', 24)
) AS seed(name, position)
WHERE NOT EXISTS (SELECT 1 FROM betterme_habits);


INSERT INTO betterme_list_items (category, text, position)
SELECT * FROM (VALUES
  ('learn', 'How to talk to anyone and gain respect', 1),
  ('learn', 'How to maintain good eye contact', 2),
  ('learn', 'English speaking', 3),
  ('learn', 'How to increase your respect/personality', 4),
  ('learn', 'How to become more socially confident', 5),
  ('learn', 'How to communicate confidently', 6),
  ('learn', 'How to listen more effectively', 7),
  ('learn', 'Body language', 8),
  ('learn', 'Public speaking', 9),
  ('learn', 'Storytelling', 10),
  ('learn', 'How to start and maintain conversations', 11),
  ('learn', 'How to handle criticism', 12),
  ('learn', 'How to control emotions', 13),
  ('learn', 'How to negotiate', 14),
  ('learn', 'How to think and speak clearly', 15),
  ('learn', 'How to become a better leader', 16),
  ('learn', 'How to improve general knowledge', 17),
  ('learn', 'How to improve financial knowledge', 18),
  ('learn', 'How to behave professionally', 19),
  ('learn', 'How to become more disciplined', 20)
) AS seed(category, text, position)
WHERE NOT EXISTS (SELECT 1 FROM betterme_list_items WHERE category = 'learn');


INSERT INTO betterme_list_items (category, text, position)
SELECT * FROM (VALUES
  ('master', 'Perfect two-wheeler driving', 1),
  ('master', 'Perfect four-wheeler driving', 2),
  ('master', 'Swimming', 3),
  ('master', 'Basic cooking', 4),
  ('master', 'Basic vehicle maintenance', 5),
  ('master', 'Basic first aid', 6),
  ('master', 'Basic home repairs', 7),
  ('master', 'Know how to use basic tools', 8),
  ('master', 'Basic self-defense', 9),
  ('master', 'Good financial management', 10),
  ('master', 'Managing bank accounts, UPI and cards', 11),
  ('master', 'Travelling alone confidently', 12),
  ('master', 'Navigating using maps', 13),
  ('master', 'Communicating with strangers/professionals', 14),
  ('master', 'Handling emergencies', 15),
  ('master', 'Dressing appropriately for different situations', 16),
  ('master', 'Basic grooming', 17),
  ('master', 'Maintaining important documents', 18),
  ('master', 'Cooking at least 5–10 good meals', 19),
  ('master', 'Taking care of yourself independently', 20)
) AS seed(category, text, position)
WHERE NOT EXISTS (SELECT 1 FROM betterme_list_items WHERE category = 'master');


INSERT INTO betterme_list_items (category, text, position)
SELECT * FROM (VALUES
  ('character', 'Pray before eating', 1),
  ('character', 'Say thank you when someone helps you', 2),
  ('character', 'Respect elders and treat everyone with basic respect', 3),
  ('character', 'Never unnecessarily insult or humiliate someone', 4),
  ('character', 'Keep your word', 5),
  ('character', 'Don''t lie when the truth is uncomfortable', 6),
  ('character', 'Don''t speak badly about someone behind their back', 7),
  ('character', 'Leave a place cleaner than you found it', 8),
  ('character', 'Put things back where they belong', 9),
  ('character', 'Help someone without expecting something in return', 10),
  ('character', 'Give full attention when someone is talking to you', 11),
  ('character', 'Don''t use your phone while someone is seriously talking to you', 12),
  ('character', 'Control your anger before responding', 13),
  ('character', 'Admit when you are wrong', 14),
  ('character', 'Apologize when you genuinely make a mistake', 15),
  ('character', 'Don''t show off unnecessarily', 16),
  ('character', 'Don''t spend money just to impress people', 17),
  ('character', 'Be comfortable doing things alone', 18),
  ('character', 'Remember important things people tell you', 19),
  ('character', 'Celebrate other people''s success without jealousy', 20),
  ('character', 'Never stop learning', 21),
  ('character', 'Keep your promises to yourself', 22),
  ('character', 'Do the right thing even when nobody is watching', 23),
  ('character', 'Before sleeping, ask: "Did I become better today?"', 24)
) AS seed(category, text, position)
WHERE NOT EXISTS (SELECT 1 FROM betterme_list_items WHERE category = 'character');

-- ==========================================
-- DEFAULT BETTERME GOALS
-- ==========================================

INSERT INTO betterme_goals
    (title, goal_type, deadline, reward)
SELECT
    '50k bank balance',
    'monthly',
    NULL,
    'Celebrate with a nice dinner'
WHERE NOT EXISTS (
    SELECT 1
    FROM betterme_goals
    WHERE title = '50k bank balance'
);


INSERT INTO betterme_goals
    (title, goal_type, deadline, reward)
SELECT
    'Daily clean eating',
    'monthly',
    NULL,
    'Favourite healthy meal'
WHERE NOT EXISTS (
    SELECT 1
    FROM betterme_goals
    WHERE title = 'Daily clean eating'
);


INSERT INTO betterme_goals
    (title, goal_type, deadline, reward)
SELECT
    'Job preparation',
    'monthly',
    NULL,
    'Movie night / relaxing evening'
WHERE NOT EXISTS (
    SELECT 1
    FROM betterme_goals
    WHERE title = 'Job preparation'
);


INSERT INTO betterme_goals
    (title, goal_type, deadline, reward)
SELECT
    '20 lakh bank balance',
    'yearly',
    NULL,
    'Big personal celebration'
WHERE NOT EXISTS (
    SELECT 1
    FROM betterme_goals
    WHERE title = '20 lakh bank balance'
);


INSERT INTO betterme_goals
    (title, goal_type, deadline, reward)
SELECT
    'Body in shape',
    'yearly',
    NULL,
    'Buy something you really wanted'
WHERE NOT EXISTS (
    SELECT 1
    FROM betterme_goals
    WHERE title = 'Body in shape'
);


INSERT INTO betterme_goals
    (title, goal_type, deadline, reward)
SELECT
    'Confidence on Next Level',
    'yearly',
    NULL,
    'Special day / experience'
WHERE NOT EXISTS (
    SELECT 1
    FROM betterme_goals
    WHERE title = 'Confidence on Next Level'
);


INSERT INTO betterme_goals
    (title, goal_type, deadline, reward)
SELECT
    'Join gym & be financially better',
    'other',
    NULL,
    'New gym clothes or equipment'
WHERE NOT EXISTS (
    SELECT 1
    FROM betterme_goals
    WHERE title = 'Join gym & be financially better'
);
