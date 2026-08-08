import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

function formatDegrees(value: number) {
  return `${Math.round(value)}°`;
}

function SensorCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  detail: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.sensorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sensorIcon, { backgroundColor: colors.secondary }]}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.sensorLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.sensorValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.sensorDetail, { color: colors.mutedForeground }]}>{detail}</Text>
    </View>
  );
}

export default function MeasurementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [accelerometer, setAccelerometer] = useState({ x: 0, y: 0, z: 1 });
  const [magnetometer, setMagnetometer] = useState({ x: 0, y: 0, z: 0 });
  const [hasCompass, setHasCompass] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let accelerationSubscription: { remove: () => void } | undefined;
    let magnetometerSubscription: { remove: () => void } | undefined;
    let mounted = true;

    const startSensors = async () => {
      const [accelerometerAvailable, magnetometerAvailable] = await Promise.all([
        Accelerometer.isAvailableAsync(),
        Magnetometer.isAvailableAsync(),
      ]);
      if (!mounted) return;

      if (accelerometerAvailable) {
        Accelerometer.setUpdateInterval(120);
        accelerationSubscription = Accelerometer.addListener(setAccelerometer);
      }
      if (magnetometerAvailable) {
        setHasCompass(true);
        Magnetometer.setUpdateInterval(180);
        magnetometerSubscription = Magnetometer.addListener(setMagnetometer);
      }
    };

    startSensors().catch(() => setHasCompass(false));
    return () => {
      mounted = false;
      accelerationSubscription?.remove();
      magnetometerSubscription?.remove();
    };
  }, []);

  const pitch = useMemo(
    () => Math.atan2(-accelerometer.x, Math.sqrt(accelerometer.y ** 2 + accelerometer.z ** 2)) * (180 / Math.PI),
    [accelerometer],
  );
  const roll = useMemo(
    () => Math.atan2(accelerometer.y, accelerometer.z) * (180 / Math.PI),
    [accelerometer],
  );
  const heading = useMemo(() => {
    const degrees = Math.atan2(magnetometer.y, magnetometer.x) * (180 / Math.PI);
    return (degrees + 360) % 360;
  }, [magnetometer]);

  const refreshSensors = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setIsRefreshing(false), 650);
  };

  const openSettings = () => {
    if (Platform.OS !== 'web') Linking.openSettings().catch(() => undefined);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 112 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>DISH ALIGN</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>ضبط الطبق بثقة</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            أدوات دقيقة تساعدك في كل خطوة
          </Text>
        </View>
        <Pressable
          accessibilityLabel="تحديث القراءات"
          testID="refresh-sensors"
          onPress={refreshSensors}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {isRefreshing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={21} color={colors.primary} />
          )}
        </Pressable>
      </View>

      <View style={[styles.statusBanner, { backgroundColor: colors.secondary }]}>
        <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
        <View style={styles.statusCopy}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>قراءات مباشرة</Text>
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            حرّك الهاتف ببطء للحصول على قراءة مستقرة
          </Text>
        </View>
        <MaterialCommunityIcons name="signal-cellular-3" size={20} color={colors.primary} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>أدوات القياس</Text>
      <View style={styles.sensorGrid}>
        <SensorCard icon="angle-acute" label="ميلان الطبق" value={formatDegrees(Math.abs(pitch))} detail="Pitch / رأسي" />
        <SensorCard icon="axis-z-rotate-clockwise" label="ميلان جانبي" value={formatDegrees(Math.abs(roll))} detail="Roll / أفقي" />
        <SensorCard
          icon="compass-outline"
          label="البوصلة"
          value={hasCompass ? formatDegrees(heading) : 'غير متاحة'}
          detail={hasCompass ? 'الشمال المغناطيسي' : 'الجهاز لا يدعمها'}
        />
        <SensorCard icon="speedometer" label="ثبات الجهاز" value={Math.abs(pitch) < 4 && Math.abs(roll) < 4 ? 'ممتاز' : 'حرّك أقل'} detail="ضع الهاتف على الذراع" />
      </View>

      <View style={[styles.tipCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={[styles.tipIcon, { backgroundColor: colors.accent }]}>
          <Ionicons name="bulb-outline" size={22} color={colors.accentForeground} />
        </View>
        <View style={styles.tipBody}>
          <Text style={[styles.tipTitle, { color: colors.foreground }]}>نصيحة للمعايرة</Text>
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
            أبعد الهاتف عن المعادن والكابلات، ثم حرّكه على شكل رقم 8 لمعايرة البوصلة.
          </Text>
          {!hasCompass && (
            <Pressable onPress={openSettings} testID="open-settings">
              <Text style={[styles.linkText, { color: colors.primary }]}>راجع إعدادات المستشعرات</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.quickCard, { backgroundColor: colors.primary }]}>
        <View style={styles.quickCopy}>
          <Text style={[styles.quickEyebrow, { color: colors.primaryForeground }]}>جاهز للبدء؟</Text>
          <Text style={[styles.quickTitle, { color: colors.primaryForeground }]}>احسب اتجاه قمر صناعي</Text>
          <Text style={[styles.quickText, { color: colors.primaryForeground }]}>
            استخدم موقعك واختر القمر للحصول على الزوايا المطلوبة.
          </Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={46} color={colors.primaryForeground} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2.4, marginBottom: 7 },
  title: { fontSize: 29, fontWeight: '700', textAlign: 'right' },
  subtitle: { fontSize: 14, marginTop: 5, textAlign: 'right' },
  iconButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  statusBanner: { borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 27 },
  liveDot: { width: 9, height: 9, borderRadius: 5, marginRight: 11 },
  statusCopy: { flex: 1 },
  statusTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  statusText: { fontSize: 12, marginTop: 3, textAlign: 'right' },
  sectionTitle: { fontSize: 19, fontWeight: '700', textAlign: 'right', marginBottom: 13 },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, justifyContent: 'space-between' },
  sensorCard: { width: '48%', minHeight: 153, borderRadius: 18, borderWidth: 1, padding: 14 },
  sensorIcon: { width: 37, height: 37, borderRadius: 12, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
  sensorLabel: { fontSize: 12, textAlign: 'right', marginTop: 11 },
  sensorValue: { fontSize: 25, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  sensorDetail: { fontSize: 11, textAlign: 'right', marginTop: 3 },
  tipCard: { borderRadius: 18, borderWidth: 1, padding: 15, flexDirection: 'row', marginTop: 21 },
  tipIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tipBody: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  tipText: { fontSize: 12, lineHeight: 19, textAlign: 'right', marginTop: 4 },
  linkText: { fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 8 },
  quickCard: { borderRadius: 21, padding: 19, flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  quickCopy: { flex: 1 },
  quickEyebrow: { fontSize: 12, fontWeight: '700', textAlign: 'right', opacity: 0.75 },
  quickTitle: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  quickText: { fontSize: 12, lineHeight: 18, textAlign: 'right', marginTop: 5, opacity: 0.82 },
});
