-- Starter content for the Vision Board, matching the 8 categories from
-- the user's original poster design. Only runs if the board is empty,
-- so it never overwrites anything you've already added or removed.

INSERT INTO vision_goals (title, description, category, image_url, sort_order)
SELECT * FROM (VALUES
  ('Achieve ₹50,00,000',            'Build long-term savings and investments',      'Financial Dreams',  'https://loremflickr.com/800/600/money,wealth,gold', 1),
  ('Become financially independent','No longer dependent on a single income',       'Financial Dreams',  NULL, 2),
  ('Earn ₹5,00,000 / month',        'Multiple income streams',                      'Financial Dreams',  NULL, 3),
  ('Build income through Job + Freelancing + AI + Coding', NULL,                    'Financial Dreams',  NULL, 4),

  ('Bungalow',                      'Chincholi, Tal. Rahuri, Maharashtra, India',   'Dream Home',         'https://loremflickr.com/800/600/luxury,house,villa', 1),
  ('Private gym',                   NULL,                                           'Dream Home',         NULL, 2),
  ('Beautiful garden',              NULL,                                           'Dream Home',         NULL, 3),
  ('24x7 personal office',          NULL,                                           'Dream Home',         NULL, 4),

  ('Buy on Gudi Padwa 2027',        NULL,                                           'Dream Bike',         'https://loremflickr.com/800/600/motorcycle,bike', 1),
  ('Best of that time, like Pulsar',NULL,                                           'Dream Bike',         NULL, 2),
  ('Matte black & grey',            NULL,                                           'Dream Bike',         NULL, 3),

  ('Premium luxury car',            NULL,                                           'Dream Car',          'https://loremflickr.com/800/600/luxury,car', 1),
  ('Shape & structure like BMW',    NULL,                                           'Dream Car',          NULL, 2),
  ('Final model decided later',     NULL,                                           'Dream Car',          NULL, 3),

  ('Travel across India',           NULL,                                           'World Travel',       'https://loremflickr.com/800/600/travel,world,landmark', 1),
  ('Visit many countries',          NULL,                                           'World Travel',       NULL, 2),
  ('Experience different cultures', NULL,                                           'World Travel',       NULL, 3),
  ('Create unforgettable memories', NULL,                                           'World Travel',       NULL, 4),

  ('English fluency',               NULL,                                           'Skills to Master',   'https://loremflickr.com/800/600/technology,brain,ai', 1),
  ('Artificial Intelligence',       NULL,                                           'Skills to Master',   NULL, 2),
  ('Public speaking',               NULL,                                           'Skills to Master',   NULL, 3),
  ('Leadership',                    NULL,                                           'Skills to Master',   NULL, 4),
  ('Communication',                 NULL,                                           'Skills to Master',   NULL, 5),
  ('Negotiation',                   NULL,                                           'Skills to Master',   NULL, 6),

  ('Dream physique',                NULL,                                           'Fitness Goals',      'https://loremflickr.com/800/600/fitness,gym,muscle', 1),
  ('Six-pack abs',                  NULL,                                           'Fitness Goals',      NULL, 2),
  ('Strong, healthy & fit',         NULL,                                           'Fitness Goals',      NULL, 3),
  ('Discipline in daily routine',   NULL,                                           'Fitness Goals',      NULL, 4),

  ('Help orphans',                  NULL,                                           'Purpose & Impact',   'https://loremflickr.com/800/600/family,charity,help', 1),
  ('Help old age homes',            NULL,                                           'Purpose & Impact',   NULL, 2),
  ('Help Gau Shala',                NULL,                                           'Purpose & Impact',   NULL, 3),
  ('Make my family generational wealth', NULL,                                     'Purpose & Impact',   NULL, 4)
) AS seed(title, description, category, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM vision_goals);
