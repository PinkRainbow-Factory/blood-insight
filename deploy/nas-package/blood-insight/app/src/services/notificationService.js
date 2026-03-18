import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const LAB_REMINDER_IDS = [11001, 11002, 11003];
const MEDICATION_REMINDER_BASE_ID = 12000;
const MEDICATION_ID_LIMIT = 80;

function getPlugin() {
  if (Capacitor.getPlatform() === "web") {
    return null;
  }

  return LocalNotifications;
}

function buildScheduleDate(date, time) {
  if (!date) {
    return null;
  }

  const candidate = new Date(`${date}T${time || "09:00"}:00`);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }

  return candidate;
}

function weekdayFromDate(date) {
  return date.getDay() === 0 ? 1 : date.getDay() + 1;
}

function weekdaysFromPreset(daysPreset) {
  const maps = {
    daily: [],
    weekdays: [2, 3, 4, 5, 6],
    weekends: [1, 7],
    mwf: [2, 4, 6],
    tts: [3, 5, 7]
  };

  return maps[daysPreset] || [];
}

async function ensurePermissions(plugin) {
  const permissionState = await plugin.checkPermissions();
  const displayPermission = permissionState.display === "granted"
    ? permissionState
    : await plugin.requestPermissions();

  if (displayPermission.display !== "granted") {
    throw new Error("기기 알림 권한이 허용되지 않아 알림을 예약할 수 없습니다.");
  }
}

function buildLabReminderNotifications({ strategy, scheduledAt, diseaseName, displayName, reportId, diseaseCode }) {
  const owner = displayName || "사용자";
  const diseasePrefix = diseaseName ? `${diseaseName} 관련 ` : "";
  const baseBody = `${owner}님의 ${diseasePrefix}혈액검사 일정을 확인해 주세요.`;

  if (strategy === "weekly-check") {
    return [
      {
        id: LAB_REMINDER_IDS[0],
        title: "Blood Insight Agent",
        body: `${owner}님의 이번 주 혈액검사·증상 체크 시간입니다.`,
        schedule: {
          on: {
            weekday: weekdayFromDate(scheduledAt),
            hour: scheduledAt.getHours(),
            minute: scheduledAt.getMinutes()
          },
          repeats: true
        },
        extra: {
          type: "weekly-check",
          targetView: "dashboard",
          reportId,
          diseaseCode
        }
      }
    ];
  }

  const notifications = [
    {
      id: LAB_REMINDER_IDS[0],
      title: "Blood Insight Agent",
      body: baseBody,
      schedule: {
        at: scheduledAt,
        allowWhileIdle: true
      },
      extra: {
        type: "lab-reminder-day-of",
        targetView: reportId ? "report" : diseaseCode ? "disease" : "report",
        reportId,
        diseaseCode
      }
    }
  ];

  if (strategy === "day-before-and-day-of") {
    const dayBefore = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);
    if (dayBefore.getTime() > Date.now()) {
      notifications.unshift({
        id: LAB_REMINDER_IDS[1],
        title: "Blood Insight Agent",
        body: `${owner}님의 ${diseasePrefix}혈액검사 일정이 내일 예정되어 있습니다. 준비할 항목을 확인해 주세요.`,
        schedule: {
          at: dayBefore,
          allowWhileIdle: true
        },
        extra: {
          type: "lab-reminder-day-before",
          targetView: reportId ? "report" : diseaseCode ? "disease" : "report",
          reportId,
          diseaseCode
        }
      });
    }
  }

  return notifications;
}

function buildMedicationNotifications({ reminders, medicationText, displayName, reportId, diseaseCode }) {
  const notifications = reminders
    .filter((item) => item?.time)
    .slice(0, 8)
    .flatMap((item, index) => {
      const [hour, minute] = String(item.time || "").split(":").map((value) => Number(value));
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
        return [];
      }

      const label = item.label?.trim() || medicationText || `복약 ${index + 1}`;
      const dose = item.dose?.trim();
      const note = item.note?.trim();
      const mealTiming = item.mealTiming === "before_meal" ? "식전" : item.mealTiming === "empty_stomach" ? "공복" : "식후";
      const description = [label, dose, mealTiming, note].filter(Boolean).join(" · ");
      const weekdays = weekdaysFromPreset(item.daysPreset);

      if (!weekdays.length) {
        return [{
          id: MEDICATION_REMINDER_BASE_ID + index + 1,
          title: "Blood Insight Agent",
          body: `${displayName || "사용자"}님의 ${description} 복약/치료 시간입니다.`,
          schedule: {
            on: {
              hour,
              minute
            },
            repeats: true
          },
          extra: {
            type: "medication-reminder",
            targetView: diseaseCode ? "disease" : "schedule",
            reportId,
            diseaseCode,
            medicationLabel: label
          }
        }];
      }

      return weekdays.map((weekday, weekdayIndex) => ({
        id: MEDICATION_REMINDER_BASE_ID + index * 10 + weekdayIndex + 1,
        title: "Blood Insight Agent",
        body: `${displayName || "사용자"}님의 ${description} 복약/치료 시간입니다.`,
        schedule: {
          on: {
            weekday,
            hour,
            minute
          },
          repeats: true
        },
        extra: {
          type: "medication-reminder",
          targetView: diseaseCode ? "disease" : "schedule",
          reportId,
          diseaseCode,
          medicationLabel: label
        }
      }));
    })
    .filter(Boolean);

  return notifications.slice(0, MEDICATION_ID_LIMIT);
}

export async function registerNotificationActionListener(listener) {
  const plugin = getPlugin();
  if (!plugin) {
    return null;
  }

  return plugin.addListener("localNotificationActionPerformed", (event) => {
    listener?.(event);
  });
}

export async function scheduleLabReminder({ date, time, diseaseName, displayName, strategy = "day-before-and-day-of", reportId, diseaseCode }) {
  const scheduledAt = buildScheduleDate(date, time);
  if (!scheduledAt) {
    throw new Error("다음 혈액검사 예정일을 먼저 입력해 주세요.");
  }

  if (strategy !== "weekly-check" && scheduledAt.getTime() <= Date.now()) {
    throw new Error("알림 시점은 현재보다 이후여야 합니다.");
  }

  const plugin = getPlugin();
  if (!plugin) {
    return {
      ok: false,
      message: "웹에서는 기기 알림 예약을 지원하지 않습니다. Android 앱에서 사용해 주세요."
    };
  }

  await ensurePermissions(plugin);
  await plugin.cancel({ notifications: LAB_REMINDER_IDS.map((id) => ({ id })) });
  const notifications = buildLabReminderNotifications({ strategy, scheduledAt, diseaseName, displayName, reportId, diseaseCode });
  await plugin.schedule({ notifications });

  if (strategy === "weekly-check") {
    return {
      ok: true,
      message: `매주 ${scheduledAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 증상/검사 체크 알림을 예약했습니다.`
    };
  }

  if (strategy === "day-before-and-day-of") {
    return {
      ok: true,
      message: `${scheduledAt.toLocaleString("ko-KR")} 기준 전날 + 당일 알림을 예약했습니다.`
    };
  }

  return {
    ok: true,
    message: `${scheduledAt.toLocaleString("ko-KR")} 알림을 예약했습니다.`
  };
}

export async function cancelLabReminder() {
  const plugin = getPlugin();
  if (!plugin) {
    return { ok: false, message: "웹에서는 기기 알림을 사용하지 않습니다." };
  }

  await plugin.cancel({ notifications: LAB_REMINDER_IDS.map((id) => ({ id })) });
  return {
    ok: true,
    message: "예약된 혈액검사 알림을 제거했습니다."
  };
}

export async function scheduleMedicationReminder({ reminders, time, medicationText, displayName, reportId, diseaseCode }) {
  const normalizedReminders = Array.isArray(reminders) && reminders.length
    ? reminders
    : time
      ? [{ label: medicationText || "복약", time }]
      : [];

  if (!normalizedReminders.length) {
    throw new Error("복약 알림 시간을 하나 이상 추가해 주세요.");
  }

  const plugin = getPlugin();
  if (!plugin) {
    return { ok: false, message: "웹에서는 기기 알림 예약을 지원하지 않습니다. Android 앱에서 사용해 주세요." };
  }

  await ensurePermissions(plugin);
  await plugin.cancel({
    notifications: Array.from({ length: MEDICATION_ID_LIMIT }, (_, index) => ({ id: MEDICATION_REMINDER_BASE_ID + index + 1 }))
  });

  const notifications = buildMedicationNotifications({ reminders: normalizedReminders, medicationText, displayName, reportId, diseaseCode });
  if (!notifications.length) {
    throw new Error("복약 알림 시간 형식을 다시 확인해 주세요.");
  }

  await plugin.schedule({ notifications });

  return {
    ok: true,
    message: `${notifications.length}개의 복약 알림을 매일 반복으로 예약했습니다.`
  };
}

export async function cancelMedicationReminder() {
  const plugin = getPlugin();
  if (!plugin) {
    return { ok: false, message: "웹에서는 기기 알림을 사용하지 않습니다." };
  }

  await plugin.cancel({
    notifications: Array.from({ length: MEDICATION_ID_LIMIT }, (_, index) => ({ id: MEDICATION_REMINDER_BASE_ID + index + 1 }))
  });
  return {
    ok: true,
    message: "예약된 복약 알림을 모두 제거했습니다."
  };
}
