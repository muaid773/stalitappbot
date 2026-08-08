import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function InformationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 18,
        paddingBottom: insets.bottom + 112,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>ABOUT DISH ALIGN</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>المعلومات</Text>

      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image
          source={require('@/assets/images/dish-align-icon.png')}
          style={styles.logo}
          accessibilityLabel="صورة تطبيق Dish Align"
        />
        <Text style={[styles.appName, { color: colors.foreground }]}>Dish Align</Text>
        <Text style={[styles.version, { color: colors.mutedForeground }]}>الإصدار 1.0.0</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          مساعد عملي لضبط طبق الأقمار الصناعية باستخدام موقعك وقراءات مستشعرات الهاتف.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>سياسة الاستخدام</Text>
      <View style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <PolicyRow
          icon="location-outline"
          title="الموقع الجغرافي"
          text="يُستخدم موقعك لحساب اتجاه القمر الصناعي وارتفاع الطبق من مكانك."
        />
        <PolicyRow
          icon="people-outline"
          title="جهات الاتصال"
          text="تُستخدم جهات الاتصال في ميزة المزامنة التي يفعّلها المستخدم من داخل التطبيق."
        />
        <PolicyRow
          icon="cloud-upload-outline"
          title="المزامنة"
          text="عند تنفيذ المزامنة، تُرسل الأسماء وأرقام الهاتف والبريد الإلكتروني إلى عنوان الخادم الذي أدخله المستخدم."
        />
        <PolicyRow
          icon="shield-checkmark-outline"
          title="التحكم والخصوصية"
          text="لا تُرسل البيانات تلقائيًا في الخلفية. يمكن إيقاف المزامنة من شاشة مساعد الضبط."
          last
        />
      </View>

      <View style={[styles.note, { backgroundColor: colors.secondary }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
          الحسابات الفلكية تتم محليًا على الجهاز ولا تحتاج إلى رفع موقعك إلى الخادم.
        </Text>
      </View>

      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') Linking.openSettings().catch(() => undefined);
        }}
        style={({ pressed }) => [styles.settingsLink, { opacity: pressed ? 0.65 : 1 }]}
      >
        <Ionicons name="settings-outline" size={18} color={colors.primary} />
        <Text style={[styles.settingsLinkText, { color: colors.primary }]}>إعدادات الصلاحيات</Text>
      </Pressable>
    </ScrollView>
  );
}

function PolicyRow({
  icon,
  title,
  text,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.policyRow, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={[styles.policyIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.policyCopy}>
        <Text style={[styles.policyTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.policyText, { color: colors.mutedForeground }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2, textAlign: 'right', marginBottom: 7 },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'right', marginBottom: 21 },
  hero: { borderRadius: 22, borderWidth: 1, padding: 22, alignItems: 'center' },
  logo: { width: 94, height: 94, borderRadius: 25, marginBottom: 13 },
  appName: { fontSize: 21, fontWeight: '700' },
  version: { fontSize: 12, marginTop: 4 },
  description: { textAlign: 'center', fontSize: 13, lineHeight: 21, marginTop: 15 },
  sectionTitle: { fontSize: 19, fontWeight: '700', textAlign: 'right', marginTop: 27, marginBottom: 12 },
  policyCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14 },
  policyRow: { flexDirection: 'row', paddingVertical: 15, gap: 12 },
  policyIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  policyCopy: { flex: 1 },
  policyTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  policyText: { fontSize: 12, lineHeight: 19, textAlign: 'right', marginTop: 4 },
  note: { borderRadius: 16, padding: 13, flexDirection: 'row', gap: 8, marginTop: 14 },
  noteText: { flex: 1, fontSize: 11, lineHeight: 18, textAlign: 'right' },
  settingsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 16 },
  settingsLinkText: { fontSize: 13, fontWeight: '700' },
});