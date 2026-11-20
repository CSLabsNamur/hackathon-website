import dayjs from "dayjs";
import fr from "dayjs/locale/fr.js";
import duration from "dayjs/plugin/duration.js";
import isBetween from "dayjs/plugin/isBetween.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);

dayjs.locale(fr);
dayjs.tz.setDefault("Europe/Brussels");

export default dayjs;
