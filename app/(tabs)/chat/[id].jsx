import { useEffect, useState, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Modal, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Initials, Toast } from "../../../components/ui";
import { chatAPI, gigsAPI } from "../../../lib/api";
import { promptReport } from "../../../lib/report";
import { F, money } from "../../../lib/theme";
import { useC } from "../../../lib/ThemeContext";

export default function ChatThread() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [conv, setConv] = useState(null);
  const [gig, setGig] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sosOpen, setSosOpen] = useState(false);
  const [toast, setToast] = useState("");
  const scroller = useRef(null);

  useEffect(() => { (async () => {
    const convs = await chatAPI.getConversations();
    const c = convs.find((x) => x.id === id);
    setConv(c);
    setMsgs(await chatAPI.getMessages(id));
    await chatAPI.markRead(id);
    if (c?.gigId) setGig(await gigsAPI.getOne(c.gigId));
  })(); }, [id]);

  const shareGigDetails = async () => {
    if (!gig) return;
    const suffix = gig.payUnit === "hr" ? "/hr" : gig.payUnit === "day" ? "/day" : "";
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gig.area + ", Chennai")}`;
    const text = `${gig.title}\nPay: ${money(gig.payAmount)}${suffix}\nTime: ${gig.timing || gig.hrs}\nLocation: ${mapsLink}`;
    await Clipboard.setStringAsync(text);
    setToast("Gig details copied");
    setTimeout(() => setToast(""), 1800);
  };

  const send = async () => {
    if (!text.trim()) return;
    const m = await chatAPI.sendMessage(id, text.trim());
    setMsgs((prev) => [...prev, m]); setText("");
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="arrow-back" size={20} color={C.navy} /></Pressable>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 9 }}>
          <Initials text={conv?.initials || "?"} size={32} square bg={C.navy} color="#818cf8" />
          <View>
            <Text style={s.name}>{conv?.name}</Text>
            <Text style={s.gig}>{conv?.gigTitle}</Text>
          </View>
        </View>
        <Pressable onPress={shareGigDetails} hitSlop={8} style={{ marginRight: 4 }}><Ionicons name="share-outline" size={19} color={C.text2} /></Pressable>
        <Pressable onPress={() => setSosOpen(true)} hitSlop={8} style={{ marginRight: 4 }}><Ionicons name="alert-circle-outline" size={19} color={C.red} /></Pressable>
        <Pressable onPress={() => promptReport("message", id)} hitSlop={8}><Ionicons name="flag-outline" size={18} color={C.text3} /></Pressable>
      </View>

      <View style={s.notice}><Ionicons name="lock-closed" size={11} color={C.text3} /><Text style={s.noticeTxt}>This chat is for your {conv?.gigTitle} booking.</Text></View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <ScrollView ref={scroller} contentContainerStyle={{ padding: 16, gap: 8 }} showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}>
          {msgs.map((m) => (
            <View key={m.id} style={[s.bubble, m.fromMe ? s.mine : s.theirs]}>
              <Text style={[s.bubbleTxt, m.fromMe && { color: "#fff" }]}>{m.body}</Text>
              <Text style={[s.bubbleTime, m.fromMe && { color: "rgba(255,255,255,0.6)" }]}>{m.time}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={s.inputBar}>
          <TextInput value={text} onChangeText={setText} placeholder="Message…" placeholderTextColor={C.text3} style={s.input} multiline />
          <Pressable onPress={send} style={s.sendBtn}><Ionicons name="arrow-up" size={18} color="#fff" /></Pressable>
        </View>
      </KeyboardAvoidingView>

      <Toast message={toast} visible={!!toast} />

      <Modal visible={sosOpen} transparent animationType="fade" onRequestClose={() => setSosOpen(false)}>
        <View style={s.sosBackdrop}>
          <View style={s.sosCard}>
            <Ionicons name="alert-circle" size={34} color={C.red} />
            <Text style={s.sosTitle}>Emergency contact</Text>
            <Text style={s.sosBody}>In-app emergency contact feature coming soon. If you're in immediate danger, call emergency services now.</Text>
            <Pressable onPress={() => Linking.openURL("tel:112")} style={s.sosCallBtn}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={s.sosCallTxt}>Call 112</Text>
            </Pressable>
            <Pressable onPress={() => setSosOpen(false)} style={{ marginTop: 12 }}>
              <Text style={s.sosClose}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  topbar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  name: { fontFamily: F.bold, fontSize: 14, color: C.text },
  gig: { fontFamily: F.med, fontSize: 11, color: C.indigo },
  notice: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 7, backgroundColor: C.surface2 },
  noticeTxt: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
  bubble: { maxWidth: "78%", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16 },
  mine: { alignSelf: "flex-end", backgroundColor: C.indigo, borderBottomRightRadius: 4 },
  theirs: { alignSelf: "flex-start", backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleTxt: { fontFamily: F.reg, fontSize: 14, color: C.text, lineHeight: 20 },
  bubbleTime: { fontFamily: F.reg, fontSize: 10, color: C.text3, marginTop: 3, alignSelf: "flex-end" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 9, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline, backgroundColor: C.surface },
  input: { flex: 1, fontFamily: F.reg, fontSize: 14, color: C.text, backgroundColor: C.surface2, borderRadius: 20, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, maxHeight: 100, minHeight: 40 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.indigo, alignItems: "center", justifyContent: "center" },
  sosBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 28 },
  sosCard: { backgroundColor: C.surface, borderRadius: 18, padding: 24, alignItems: "center", width: "100%" },
  sosTitle: { fontFamily: F.bold, fontSize: 16, color: C.text, marginTop: 10 },
  sosBody: { fontFamily: F.reg, fontSize: 13, color: C.text2, textAlign: "center", lineHeight: 19, marginTop: 8 },
  sosCallBtn: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.red, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, marginTop: 18 },
  sosCallTxt: { fontFamily: F.bold, fontSize: 14, color: "#fff" },
  sosClose: { fontFamily: F.med, fontSize: 13, color: C.text2 },
});
