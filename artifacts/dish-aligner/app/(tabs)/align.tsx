import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Satellite = { name: string; longitude: number; direction: string };
type Coordinates = { latitude: number; longitude: number };

const SATELLITES: Satellite[] = [
  { name: 'نايلسات 201', longitude: -7, direction: '7° غرب' },
  { name: 'عربسات بدر 6', longitude: 26, direction: '26° شرق' },
  { name: 'هوت بيرد 13B', longitude: 13, direction: '13° شرق' },
  { name: 'سهيل سات 2', longitude: 25.5, direction: '25.5° شرق' },
  { name: 'تركسات 5A', longitude: 42, direction: '42° شرق' },
];

function calculateAlignment(coords: Coordinates, satellite: Satellite) {
  const latitude = (coords.latitude * Math.PI) / 180;
  const delta = ((satellite.longitude - coords.longitude) * Math.PI) / 180;
  const earthRatio = 0.1512;
  const cosPsi = Math.cos(latitude) * Math.cos(delta);
  const elevation = Math.atan2(cosPsi - earthRatio, Math.sqrt(1 - cosPsi ** 2)) * (180 / Math.PI);
  const azimuth = (Math.atan2(Math.sin(delta), -Math.sin(latitude) * Math.cos(delta)) * (180 / Math.PI) + 360) % 360;
  const lnbSkew = Math.atan2(Math.sin(delta), Math.tan(latitude)) * (180 / Math.PI);
  return {
    azimuth: Math.round(azimuth * 10) / 10,
    elevation: Math.round(elevation * 10) / 10,
    lnbSkew: Math.round(lnbSkew * 10) / 10,
  };
}

function ResultCard({ icon, label, value, unit }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string; unit: string }) {
  const colors = useColors();
  return (
    <View style={[styles.resultCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={[styles.resultIcon, { backgroundColor: colors.secondary }]}>
        <MaterialCommunityIcons name={icon} size={21} color={colors.primary} />
      </View>
      <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.resultValue, { color: colors.foreground }]}>{value}<Text style={[styles.resultUnit, { color: colors.primary }]}> {unit}</Text></Text>
    </View>
  );
}

export default function AlignmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [latitudeText, setLatitudeText] = useState('');
  const [longitudeText, setLongitudeText] = useState('');
  const [selectedSatellite, setSelectedSatellite] = useState(SATELLITES[0]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSatellites, setShowSatellites] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateAlignment> | null>(null);
  const [locating, setLocating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [serverUrl, setServerUrl] = useState('');

  const locationLabel = useMemo(() => {
    if (!coords) return 'لم يتم تحديد الموقع';
    return `${coords.latitude.toFixed(4)}° ، ${coords.longitude.toFixed(4)}°`;
  }, [coords]);

  const useCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('الموقع غير متاح', 'استخدم حقلي خط العرض والطول على الويب.');
      return;
    }
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('نحتاج إلى موقعك', 'اسمح بالموقع لاستخدامه في حساب اتجاه القمر.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoords(next);
      setLatitudeText(next.latitude.toFixed(6));
      setLongitudeText(next.longitude.toFixed(6));
      setShowLocationModal(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('تعذر تحديد الموقع', 'أدخل الإحداثيات يدويًا أو حاول مرة أخرى.');
    } finally {
      setLocating(false);
    }
  };

  const saveManualLocation = () => {
    const latitude = Number(latitudeText.replace(',', '.'));
    const longitude = Number(longitudeText.replace(',', '.'));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      Alert.alert('إحداثيات غير صحيحة', 'خط العرض من -90 إلى 90، وخط الطول من -180 إلى 180.');
      return;
    }
    setCoords({ latitude, longitude });
    setShowLocationModal(false);
  };

  const calculate = async () => {
    if (!coords) {
      setShowLocationModal(true);
      return;
    }
    setResult(calculateAlignment(coords, selectedSatellite));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const syncContacts = async () => {
    if (!syncEnabled) {
      Alert.alert('المزامنة متوقفة', 'فعّل زر الموافقة أولًا بعد قراءة ما سيتم إرساله.');
      return;
    }
    if (!serverUrl.trim()) {
      Alert.alert('أدخل عنوان الخادم', 'مثال: https://example.com/api/contacts');
      return;
    }
    setSyncing(true);
    try {
      const permission = await Contacts.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('لم تتم الموافقة', 'لا يمكن قراءة جهات الاتصال دون إذنك.');
        return;
      }
      const response = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      const payload = {
        consent: true,
        source: 'dish-aligner',
        sentAt: new Date().toISOString(),
        contacts: response.data.map((contact) => ({
          name: contact.name,
          phones: (contact.phoneNumbers ?? []).map((phone) => phone.number).filter(Boolean),
          emails: (contact.emails ?? []).map((email) => email.email).filter(Boolean),
        })),
      };
      const res = await fetch(serverUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('server');
      Alert.alert('اكتملت المزامنة', `تم إرسال ${payload.contacts.length} جهة اتصال إلى الخادم.`);
    } catch {
      Alert.alert('تعذر الإرسال', 'تحقق من عنوان الخادم واتصال الإنترنت ثم حاول مجددًا.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 112 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>ALIGNMENT ASSISTANT</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>مساعد الضبط</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>احصل على الزوايا المناسبة من موقعك إلى القمر</Text>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>1. موقع الطبق</Text>
      <Pressable
        testID="choose-location"
        onPress={() => setShowLocationModal(true)}
        style={({ pressed }) => [styles.locationButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={[styles.locationIcon, { backgroundColor: colors.secondary }]}>
          <Ionicons name="location" size={22} color={colors.primary} />
        </View>
        <View style={styles.locationCopy}>
          <Text style={[styles.locationLabel, { color: colors.mutedForeground }]}>موقعك الحالي</Text>
          <Text style={[styles.locationValue, { color: colors.foreground }]}>{locationLabel}</Text>
        </View>
        <Ionicons name="chevron-back" size={19} color={colors.mutedForeground} />
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 26 }]}>2. القمر الصناعي</Text>
      <Pressable
        testID="choose-satellite"
        onPress={() => setShowSatellites((value) => !value)}
        style={({ pressed }) => [styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={[styles.satelliteMark, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons name="satellite-variant" size={22} color={colors.accentForeground} />
        </View>
        <View style={styles.locationCopy}>
          <Text style={[styles.locationLabel, { color: colors.mutedForeground }]}>القمر المختار</Text>
          <Text style={[styles.locationValue, { color: colors.foreground }]}>{selectedSatellite.name}</Text>
        </View>
        <Ionicons name={showSatellites ? 'chevron-up' : 'chevron-down'} size={19} color={colors.mutedForeground} />
      </Pressable>
      {showSatellites && (
        <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SATELLITES.map((satellite) => (
            <Pressable
              key={satellite.name}
              onPress={() => {
                setSelectedSatellite(satellite);
                setShowSatellites(false);
                setResult(null);
              }}
              style={[styles.satelliteOption, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.satelliteDirection, { color: colors.mutedForeground }]}>{satellite.direction}</Text>
              <Text style={[styles.satelliteName, { color: colors.foreground }]}>{satellite.name}</Text>
              {selectedSatellite.name === satellite.name && <Ionicons name="checkmark-circle" size={19} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        testID="calculate-alignment"
        onPress={calculate}
        style={({ pressed }) => [styles.calculateButton, { backgroundColor: colors.primary, opacity: pressed ? 0.76 : 1 }]}
      >
        <Ionicons name="navigate" size={21} color={colors.primaryForeground} />
        <Text style={[styles.calculateText, { color: colors.primaryForeground }]}>احسب اتجاه الطبق</Text>
      </Pressable>

      {result && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <View style={[styles.successDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.resultsHint, { color: colors.mutedForeground }]}>نتائج محسوبة لموقعك</Text>
            <Text style={[styles.resultsTitle, { color: colors.foreground }]}>زاوية التوجيه</Text>
          </View>
          <View style={styles.resultsGrid}>
            <ResultCard icon="compass-outline" label="اتجاه الطبق" value={String(result.azimuth)} unit="°" />
            <ResultCard icon="angle-acute" label="ارتفاع الطبق" value={String(result.elevation)} unit="°" />
            <ResultCard icon="rotate-3d" label="ميلان LNB" value={String(result.lnbSkew)} unit="°" />
            <ResultCard icon="satellite-uplink" label="القمر" value={selectedSatellite.name.split(' ')[0]} unit="" />
          </View>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            استخدم البوصلة من قسم القياس، ثم اضبط الطبق تدريجيًا مع اختبار الإشارة من جهاز الاستقبال.
          </Text>
        </View>
      )}

      <View style={[styles.syncCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.syncHeader}>
          <View style={[styles.syncIcon, { backgroundColor: colors.secondary }]}>
            <Ionicons name="cloud-upload-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.syncHeaderCopy}>
            <Text style={[styles.syncTitle, { color: colors.foreground }]}>مزامنة جهات الاتصال</Text>
            <Text style={[styles.syncSubtitle, { color: colors.mutedForeground }]}>اختيارية وتتم يدويًا فقط</Text>
          </View>
          <Pressable
            testID="toggle-contact-sync"
            accessibilityRole="switch"
            accessibilityState={{ checked: syncEnabled }}
            onPress={() => setSyncEnabled((value) => !value)}
            style={[styles.toggle, { backgroundColor: syncEnabled ? colors.primary : colors.secondary }]}
          >
            <View style={[styles.toggleThumb, { backgroundColor: syncEnabled ? colors.primaryForeground : colors.mutedForeground, alignSelf: syncEnabled ? 'flex-end' : 'flex-start' }]} />
          </Pressable>
        </View>
        <Text style={[styles.syncNotice, { color: colors.mutedForeground }]}>
          عند التفعيل والمزامنة، سيرسل التطبيق الاسم وأرقام الهاتف والبريد الإلكتروني إلى العنوان الذي تدخله. لا يتم الإرسال تلقائيًا ولا في الخلفية.
        </Text>
        {syncEnabled && (
          <>
            <TextInput
              testID="sync-server-url"
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://example.com/api/contacts"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.serverInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
            />
            <Pressable
              testID="sync-contacts"
              onPress={syncContacts}
              disabled={syncing}
              style={({ pressed }) => [styles.syncButton, { borderColor: colors.primary, opacity: pressed || syncing ? 0.65 : 1 }]}
            >
              {syncing ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="sync-outline" size={18} color={colors.primary} />}
              <Text style={[styles.syncButtonText, { color: colors.primary }]}>{syncing ? 'جارٍ الإرسال...' : 'مزامنة الآن'}</Text>
            </Pressable>
          </>
        )}
      </View>

      <Modal visible={showLocationModal} transparent animationType="slide" onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowLocationModal(false)} accessibilityLabel="إغلاق">
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>حدد موقع الطبق</Text>
            </View>
            <Pressable onPress={useCurrentLocation} disabled={locating} style={[styles.gpsButton, { backgroundColor: colors.primary }]}>
              {locating ? <ActivityIndicator color={colors.primaryForeground} /> : <Ionicons name="locate" size={21} color={colors.primaryForeground} />}
              <Text style={[styles.gpsButtonText, { color: colors.primaryForeground }]}>استخدم موقعي الحالي</Text>
            </Pressable>
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>أو أدخل الإحداثيات يدويًا</Text>
            <View style={styles.coordinateRow}>
              <TextInput value={latitudeText} onChangeText={setLatitudeText} keyboardType="numbers-and-punctuation" placeholder="خط العرض" placeholderTextColor={colors.mutedForeground} style={[styles.coordinateInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]} />
              <TextInput value={longitudeText} onChangeText={setLongitudeText} keyboardType="numbers-and-punctuation" placeholder="خط الطول" placeholderTextColor={colors.mutedForeground} style={[styles.coordinateInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]} />
            </View>
            <Pressable onPress={saveManualLocation} style={[styles.saveButton, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.saveButtonText, { color: colors.primary }]}>حفظ الموقع</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2, textAlign: 'right', marginBottom: 7 },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'right' },
  subtitle: { fontSize: 14, textAlign: 'right', marginTop: 5, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  locationButton: { minHeight: 74, borderRadius: 18, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center' },
  locationIcon: { width: 43, height: 43, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  locationCopy: { flex: 1 },
  locationLabel: { fontSize: 11, textAlign: 'right' },
  locationValue: { fontSize: 15, fontWeight: '600', textAlign: 'right', marginTop: 3 },
  dropdown: { minHeight: 74, borderRadius: 18, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center' },
  satelliteMark: { width: 43, height: 43, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dropdownMenu: { borderWidth: 1, borderRadius: 17, overflow: 'hidden', marginTop: 7 },
  satelliteOption: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, gap: 9 },
  satelliteName: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  satelliteDirection: { fontSize: 11 },
  calculateButton: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 21 },
  calculateText: { fontSize: 16, fontWeight: '700' },
  resultsSection: { marginTop: 28 },
  resultsHeader: { alignItems: 'flex-end', position: 'relative' },
  successDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', right: 0, top: 4 },
  resultsHint: { fontSize: 12, paddingRight: 16 },
  resultsTitle: { fontSize: 20, fontWeight: '700', marginTop: 5 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, justifyContent: 'space-between', marginTop: 14 },
  resultCard: { width: '48%', minHeight: 135, borderWidth: 1, borderRadius: 18, padding: 13, alignItems: 'flex-end' },
  resultIcon: { width: 35, height: 35, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  resultLabel: { fontSize: 12, marginTop: 10 },
  resultValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  resultUnit: { fontSize: 13, fontWeight: '600' },
  disclaimer: { fontSize: 12, textAlign: 'right', lineHeight: 19, marginTop: 13 },
  syncCard: { borderRadius: 19, borderWidth: 1, padding: 15, marginTop: 28 },
  syncHeader: { flexDirection: 'row', alignItems: 'center' },
  syncIcon: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  syncHeaderCopy: { flex: 1 },
  syncTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  syncSubtitle: { fontSize: 11, textAlign: 'right', marginTop: 3 },
  toggle: { width: 45, height: 26, borderRadius: 14, padding: 3 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10 },
  syncNotice: { fontSize: 11, lineHeight: 18, textAlign: 'right', marginTop: 12 },
  serverInput: { height: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, marginTop: 12, textAlign: 'left', fontSize: 12 },
  syncButton: { height: 44, borderRadius: 13, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 10 },
  syncButtonText: { fontSize: 13, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.58)' },
  modal: { borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 21, paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
  modalTitle: { fontSize: 20, fontWeight: '700', textAlign: 'right' },
  gpsButton: { height: 54, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  gpsButtonText: { fontSize: 15, fontWeight: '700' },
  orText: { textAlign: 'center', fontSize: 12, marginVertical: 17 },
  coordinateRow: { flexDirection: 'row', gap: 10 },
  coordinateInput: { flex: 1, height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, fontSize: 13, textAlign: 'right' },
  saveButton: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  saveButtonText: { fontSize: 14, fontWeight: '700' },
});