const LIFEOS_QUOTES = [
  'Discipline is choosing between what you want now and what you want most.',
  'Small daily improvements lead to staggering long-term results.',
  'You do not rise to the level of your goals. You fall to the level of your systems.',
  'The pain of discipline weighs ounces; the pain of regret weighs tons.',
  'Consistency turns ordinary days into a remarkable life.',
];

function getDailyQuote() {
  const dayIndex = new Date().getDate() % LIFEOS_QUOTES.length;
  return LIFEOS_QUOTES[dayIndex];
}
