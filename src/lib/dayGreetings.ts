const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const getDayName = (date = new Date()) => DAY_NAMES[date.getDay()];
export const getMonthName = (date = new Date()) => MONTH_NAMES[date.getMonth()];

export const getFormattedDate = (date = new Date()) => {
  const day = date.getDate();
  const suffix = [11, 12, 13].includes(day) ? "th" : ["st", "nd", "rd"][(day % 10) - 1] || "th";
  return `${getDayName(date)}, ${getMonthName(date)} ${day}${suffix}`;
};

const GREETINGS: Record<string, string[]> = {
  Monday: [
    "Happy Monday! Let's start the week strong 💪",
    "It's Monday — fresh start, fresh energy! 🌟",
  ],
  Tuesday: [
    "It's Tuesday! You're building momentum 🚀",
    "Happy Tuesday! Keep that energy going ✨",
  ],
  Wednesday: [
    "It's Wednesday — halfway through the week! 🎯",
    "Happy Hump Day! You're doing great 🐰",
  ],
  Thursday: [
    "It's Thursday — the weekend is almost here! 🌈",
    "Happy Thursday! One more day to go 💫",
  ],
  Friday: [
    "It's Friday! Let's finish the week strong 🎉",
    "TGIF! You've almost made it! 🥳",
  ],
  Saturday: [
    "Happy Saturday! Time to recharge 🌸",
    "It's Saturday — enjoy your weekend! ☀️",
  ],
  Sunday: [
    "Happy Sunday! A perfect day to plan ahead 📋",
    "It's Sunday — rest up and get ready for the week! 🌙",
  ],
};

export const getDayGreeting = (date = new Date()) => {
  const day = getDayName(date);
  const greetings = GREETINGS[day];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

export const getTimeOfDayGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};
