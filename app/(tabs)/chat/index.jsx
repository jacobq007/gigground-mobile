import { useEffect, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Skeleton, FadeIn, Empty } from "../../../components/ui";
import { chatAPI } from "../../../lib/api";
import { F } from "../../../lib/theme";
import { useC } from "../../../lib/ThemeContext";

export default function ChatList() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const [chats, setChats] = useState(null);

  const load = useCallback(async () => { setChats(await chatAPI.getConversations()); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.head}><Text style={s.title}>Messages</Text></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18 }} showsVerticalScrollIndicator={false}>
        {!chats ? <View style={{ gap: 10, marginTop: 8 }}>{[1, 2].map((i) => <Skeleton key={i} height={60} />)}</View> :
          chats.length === 0 ? (
            <Empty icon={<Ionicons name="chatbubbles-outline" size={40} color={C.text3} />} title="No messages yet"
              subtitle="When a hirer accepts you for a gig, a chat opens here automatically." />
          ) : chats.map((c, i) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <FadeIn key={c.id} delay={i * 40}>
                <Pressable onPress={() => router.push(`/(tabs)/chat/${c.id}`)} style={[s.row, i < chats.length - 1 && s.border]}>
                  <Initials text={c.initials} size={46} square bg={C.navy} color="#818cf8" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={s.name} numberOfLines={1}>{c.name}</Text>
                      <Text style={s.time}>{last?.time}</Text>
                    </View>
                    <Text style={s.gig}>{c.gigTitle}</Text>
                    <Text style={s.preview} numberOfLines={1}>{last?.fromMe ? "You: " : ""}{last?.body}</Text>
                  </View>
                  {c.unread > 0 ? <View style={s.unread}><Text style={s.unreadTxt}>{c.unread}</Text></View> : null}
                </Pressable>
              </FadeIn>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  head: { paddingHorizontal: 18, paddingVertical: 8 },
  title: { fontFamily: F.bold, fontSize: 18, color: C.text },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  name: { fontFamily: F.bold, fontSize: 14, color: C.text, flex: 1 },
  time: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
  gig: { fontFamily: F.med, fontSize: 11, color: C.indigo, marginTop: 1 },
  preview: { fontFamily: F.reg, fontSize: 13, color: C.text2, marginTop: 2 },
  unread: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.indigo, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  unreadTxt: { color: "#fff", fontFamily: F.bold, fontSize: 10 },
});
