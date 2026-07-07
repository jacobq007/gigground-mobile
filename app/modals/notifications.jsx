import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Empty } from "../../components/ui";
import { notificationsAPI } from "../../lib/api";
import { C, F } from "../../lib/theme";

const ICON = {
  accepted: ["checkmark-circle", C.green], applied: ["paper-plane", C.indigo],
  hired: ["checkmark-circle", C.green], shortlisted: ["star", C.amber],
  declined: ["close-circle", C.red], expired: ["hourglass", C.text3],
  message: ["chatbubble", C.indigo], gig: ["briefcase", C.amber],
  review: ["star", C.amber], community: ["people", C.text2],
};

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = useState(null);

  useEffect(() => { (async () => setItems(await notificationsAPI.getAll()))(); }, []);
  const markAll = async () => { await notificationsAPI.markAllRead(); setItems(await notificationsAPI.getAll()); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>Notifications</Text>
        <Pressable onPress={markAll} hitSlop={8}><Text style={s.mark}>Mark all</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
        {items && items.length === 0 ? <Empty icon={<Ionicons name="notifications-off-outline" size={36} color={C.text3} />} title="You're all caught up" /> :
          (items || []).map((n) => {
            const [ic, color] = ICON[n.type] || ["ellipse", C.text2];
            return (
              <View key={n.id} style={[s.row, !n.read && s.unread]}>
                <View style={[s.iconWrap, { backgroundColor: color + "1a" }]}><Ionicons name={ic} size={16} color={color} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{n.title}</Text>
                  <Text style={s.body}>{n.body}</Text>
                  <Text style={s.ago}>{n.postedAgo} ago</Text>
                </View>
                {!n.read ? <View style={s.dot} /> : null}
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  mark: { fontFamily: F.med, fontSize: 13, color: C.indigo },
  row: { flexDirection: "row", gap: 11, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12, alignItems: "flex-start" },
  unread: { backgroundColor: C.surface },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: F.bold, fontSize: 13, color: C.text },
  body: { fontFamily: F.reg, fontSize: 13, color: C.text2, marginTop: 1, lineHeight: 18 },
  ago: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.indigo, marginTop: 5 },
});
