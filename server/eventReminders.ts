import { storage } from "./storage";
import { broadcastToGroup } from "./websocket";

// Track sent reminders to prevent duplicates: "eventId-minutesBefore"
const sentReminders = new Set<string>();

const REMINDER_INTERVALS = [24 * 60, 60]; // 24 hours and 1 hour in minutes

export function startEventReminders() {
  // Check every 5 minutes
  setInterval(checkAndSendReminders, 5 * 60 * 1000);
  console.log("[EventReminders] Started — checking every 5 minutes");
}

async function checkAndSendReminders() {
  try {
    const now = Date.now();

    // Get events in the next 25 hours (covers both 24h and 1h reminders)
    const upcoming = await storage.getEvents({
      startDate: new Date(now).toISOString(),
      endDate: new Date(now + 25 * 60 * 60 * 1000).toISOString(),
      status: "published",
    });

    for (const event of upcoming) {
      const eventStart = new Date(event.startDate).getTime();
      const minutesUntilStart = (eventStart - now) / (60 * 1000);

      for (const reminderMinutes of REMINDER_INTERVALS) {
        const key = `${event.id}-${reminderMinutes}`;

        // Check if we're within the window for this reminder
        // e.g., for 60min reminder, fire when between 55-65 minutes before event
        if (
          minutesUntilStart <= reminderMinutes + 5 &&
          minutesUntilStart >= reminderMinutes - 5 &&
          !sentReminders.has(key)
        ) {
          sentReminders.add(key);

          // Get groups associated with this event
          const groups = await storage.getEventGroups(event.id);

          for (const group of groups) {
            broadcastToGroup(group.id, {
              type: "event_reminder",
              event: {
                id: event.id,
                title: event.title,
                startDate: event.startDate,
                location: event.location,
              },
              reminderMinutes,
            });
          }

          if (groups.length > 0) {
            console.log(
              `[EventReminders] Sent ${reminderMinutes}min reminder for "${event.title}" to ${groups.length} group(s)`
            );
          }
        }
      }
    }

    // Cleanup old entries (events that have already passed)
    const keysToCheck = Array.from(sentReminders);
    for (const key of keysToCheck) {
      const eventId = key.split("-")[0];
      const event = await storage.getEvent(eventId);
      if (!event || new Date(event.startDate).getTime() < now) {
        sentReminders.delete(key);
      }
    }
  } catch (err) {
    console.error("[EventReminders] Error checking reminders:", err);
  }
}
