import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import isBetween from "dayjs/plugin/isBetween.js";
import fr from "dayjs/locale/fr.js";

// Load French locale
dayjs.locale(fr);

// Extend dayjs with UTC and Timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

// Set default timezone if needed
dayjs.tz.setDefault("Europe/Brussels");

export default dayjs;
