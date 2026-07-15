export const TIME_ZONE = "Asia/Manila";
export const formatInTimeZone = (value: string | Date) => new Intl.DateTimeFormat("en-PH", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
