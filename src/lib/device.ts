import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';

export async function captureReceiptPhoto(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 82,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      promptLabelHeader: 'Receipt Photo',
      promptLabelPhoto: 'Choose from Photos',
      promptLabelPicture: 'Take Photo',
    });
    return photo.dataUrl ?? null;
  } catch (error) {
    console.warn('Receipt capture cancelled or unavailable:', error);
    return null;
  }
}

export async function lightHaptic() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics are best-effort and unavailable in some browsers.
  }
}

export async function getNetworkOnline() {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
}

export async function scheduleDailyReminder() {
  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1001,
        title: 'Joddi',
        body: 'บันทึกรายรับรายจ่ายวันนี้ก่อนลืม',
        schedule: {
          on: { hour: 20, minute: 0 },
          repeats: true,
        },
      },
    ],
  });
}

export async function cancelDailyReminder() {
  await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
}
