import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Linking, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Initials, Chip, Button } from "../../../components/ui";
import RentalMap from "../../../components/RentalMap";
import { postsAPI } from "../../../lib/api";
import { promptReport } from "../../../lib/report";
import { money, C, F } from "../../../lib/theme";

export default function PostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    (async () => {
      setPost(await postsAPI.getOne(id));
      setComments(await postsAPI.getComments(id));
    })();
  }, [id]);

  if (!post) return <View style={s.center}><ActivityIndicator color={C.indigo} /></View>;

  if (post.type === "rental") return <RentalDetail post={post} comments={comments} setComments={setComments} router={router} id={id} />;

  // ── Regular post detail ───────────────────────────────────────────────────
  const send = async () => {
    if (!text.trim()) return;
    const c = await postsAPI.addComment(id, text.trim());
    setComments((prev) => [...prev, c]); setText("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="arrow-back" size={20} color={C.navy} />
          <Text style={s.back}>Community</Text>
        </Pressable>
        <Pressable onPress={() => promptReport("post", post.id)} hitSlop={8}><Ionicons name="flag-outline" size={18} color={C.text3} /></Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Initials text={post.initials} size={34} bg={C.surface2} color={C.text2} />
            <View style={{ flex: 1 }}>
              <Text style={s.author}>{post.authorName}</Text>
              <Text style={s.sub}>{post.area} · {post.postedAgo} ago</Text>
            </View>
          </View>
          <Text style={s.pTitle}>{post.title}</Text>
          <Text style={s.pBody}>{post.body}</Text>

          <View style={s.divider} />
          <Text style={s.cTitle}>{comments.length} comment{comments.length !== 1 ? "s" : ""}</Text>
          {comments.map((c) => (
            <View key={c.id} style={s.comment}>
              <Initials text={(c.who || "?")[0]} size={26} bg={C.surface2} color={C.text2} />
              <View style={{ flex: 1 }}>
                <Text style={s.cWho}>{c.who} <Text style={s.cAgo}>· {c.ago}</Text></Text>
                <Text style={s.cBody}>{c.body}</Text>
              </View>
              <Pressable onPress={() => promptReport("comment", c.id)} hitSlop={8}><Ionicons name="flag-outline" size={12} color={C.text3} /></Pressable>
            </View>
          ))}
          {comments.length === 0 ? <Text style={s.empty}>Be the first to comment.</Text> : null}
        </ScrollView>

        <View style={s.inputBar}>
          <TextInput value={text} onChangeText={setText} placeholder="Add a comment…" placeholderTextColor={C.text3} style={s.input} />
          <Pressable onPress={send} style={s.sendBtn}><Ionicons name="arrow-up" size={18} color="#fff" /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Rental Detail ─────────────────────────────────────────────────────────────
function RentalDetail({ post, comments, setComments, router, id }) {
  const [text, setText] = useState("");
  const heroColor = post.heroColor || C.navy;
  const hasPhotos = post.photos?.length > 0;

  const send = async () => {
    if (!text.trim()) return;
    const c = await postsAPI.addComment(id, text.trim());
    setComments((prev) => [...prev, c]); setText("");
  };

  const callOwner = () => {
    if (post.ownerPhone) {
      Alert.alert("Contact owner", post.ownerPhone, [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Linking.openURL(`tel:${post.ownerPhone.replace(/\s/g, "")}`) },
      ]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Topbar */}
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="arrow-back" size={20} color={C.navy} />
          <Text style={s.back}>Rentals</Text>
        </Pressable>
        <Pressable onPress={() => promptReport("post", post.id)} hitSlop={8}>
          <Ionicons name="flag-outline" size={18} color={C.text3} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

          {/* ── Photo Hero / Gallery ── */}
          <View style={rd.heroWrap}>
            {hasPhotos ? (
              <Image source={{ uri: post.photos[0] }} style={rd.heroImg} resizeMode="cover" />
            ) : (
              <View style={[rd.heroImg, { backgroundColor: heroColor, alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="home" size={80} color="rgba(255,255,255,0.08)" />
              </View>
            )}
            {/* dark overlay */}
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 110, backgroundColor: "rgba(0,0,0,0.45)" }} />
            <View style={{ position: "absolute", bottom: 110, left: 0, right: 0, height: 50, backgroundColor: "rgba(0,0,0,0.18)" }} />

            {/* Price overlay */}
            <View style={rd.priceOverlay}>
              <Text style={rd.priceHero}>{money(post.rent)}<Text style={rd.priceUnit}>/mo</Text></Text>
              <View style={rd.availPill}>
                <Ionicons name="calendar-outline" size={11} color="#fff" />
                <Text style={rd.availTxt}>{post.availableFrom || "Contact owner"}</Text>
              </View>
            </View>

            {/* Verified badge */}
            {post.verified && (
              <View style={rd.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color={C.green} />
                <Text style={rd.verifiedTxt}>Verified owner</Text>
              </View>
            )}

            {/* Photo count */}
            {(post.photoCount || 0) > 0 && (
              <View style={rd.photoCount}>
                <Ionicons name="camera-outline" size={11} color="#fff" />
                <Text style={rd.photoCountTxt}>{post.photoCount} photos</Text>
              </View>
            )}
          </View>

          <View style={{ padding: 18 }}>
            {/* Title */}
            <Text style={rd.title}>{post.title}</Text>
            <View style={rd.metaRow}>
              <Ionicons name="location-outline" size={13} color={C.text3} />
              <Text style={rd.metaTxt}>{post.area}, Chennai</Text>
              <Text style={rd.sep}>·</Text>
              <Ionicons name="time-outline" size={13} color={C.text3} />
              <Text style={rd.metaTxt}>{post.postedAgo} ago</Text>
            </View>

            {/* Stats grid */}
            <View style={rd.statsGrid}>
              <StatCell icon="bed-outline" label="Bedrooms" val={post.bedrooms} />
              <StatCell icon="water-outline" label="Bathrooms" val={post.bathrooms} />
              <StatCell icon="layers-outline" label="Floor" val={post.floor || "—"} />
              <StatCell icon="sparkles-outline" label="Furnished" val={post.furnished || post.rentalType} />
            </View>

            {/* Amenities */}
            {post.amenities?.length > 0 && (
              <View style={rd.section}>
                <Text style={rd.sectionLabel}>Amenities</Text>
                <View style={rd.amenityRow}>
                  {post.amenities.map((a) => (
                    <View key={a} style={rd.amenityChip}>
                      <Ionicons name="checkmark-circle" size={13} color={C.green} />
                      <Text style={rd.amenityTxt}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Description */}
            <View style={rd.section}>
              <Text style={rd.sectionLabel}>About this place</Text>
              <Text style={rd.bodyTxt}>{post.body}</Text>
            </View>

            {/* Map */}
            {post.coords && (
              <View style={rd.section}>
                <Text style={rd.sectionLabel}>Location</Text>
                <RentalMap rentals={[post]} height={220} />
                <Text style={{ fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 6 }}>
                  Exact address shared after owner confirms interest.
                </Text>
              </View>
            )}

            {/* Owner */}
            <View style={rd.ownerCard}>
              <Initials text={post.initials} size={40} bg={C.indigoSoft} color={C.indigo} />
              <View style={{ flex: 1 }}>
                <Text style={rd.ownerName}>{post.authorName}</Text>
                <Text style={rd.ownerSub}>Property owner · {post.area}</Text>
              </View>
              {post.verified && <Ionicons name="shield-checkmark" size={18} color={C.green} />}
            </View>

            {/* CTA buttons */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Pressable onPress={callOwner} style={[rd.ctaBtn, { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }]}>
                <Ionicons name="call-outline" size={16} color={C.navy} />
                <Text style={[rd.ctaTxt, { color: C.navy }]}>Call owner</Text>
              </Pressable>
              <Pressable style={[rd.ctaBtn, { flex: 1.4, backgroundColor: C.indigo }]}>
                <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                <Text style={[rd.ctaTxt, { color: "#fff" }]}>Send inquiry</Text>
              </Pressable>
            </View>

            {/* Comments */}
            <View style={rd.section}>
              <Text style={rd.sectionLabel}>{comments.length} comment{comments.length !== 1 ? "s" : ""}</Text>
              {comments.map((c) => (
                <View key={c.id} style={s.comment}>
                  <Initials text={(c.who || "?")[0]} size={26} bg={C.surface2} color={C.text2} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.cWho}>{c.who} <Text style={s.cAgo}>· {c.ago}</Text></Text>
                    <Text style={s.cBody}>{c.body}</Text>
                  </View>
                  <Pressable onPress={() => promptReport("comment", c.id)} hitSlop={8}><Ionicons name="flag-outline" size={12} color={C.text3} /></Pressable>
                </View>
              ))}
              {comments.length === 0 ? <Text style={s.empty}>No comments yet.</Text> : null}
            </View>
          </View>
        </ScrollView>

        <View style={s.inputBar}>
          <TextInput value={text} onChangeText={setText} placeholder="Ask the owner something…" placeholderTextColor={C.text3} style={s.input} />
          <Pressable onPress={send} style={s.sendBtn}><Ionicons name="arrow-up" size={18} color="#fff" /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatCell({ icon, label, val }) {
  return (
    <View style={rd.statCell}>
      <Ionicons name={icon} size={18} color={C.indigo} />
      <Text style={rd.statVal}>{val}</Text>
      <Text style={rd.statLabel}>{label}</Text>
    </View>
  );
}

const rd = StyleSheet.create({
  heroWrap: { height: 240, position: "relative" },
  heroImg: { width: "100%", height: "100%" },
  priceOverlay: { position: "absolute", bottom: 14, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  priceHero: { fontFamily: F.bold, fontSize: 28, color: "#fff" },
  priceUnit: { fontFamily: F.reg, fontSize: 15, color: "rgba(255,255,255,0.75)" },
  availPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.3)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  availTxt: { fontFamily: F.med, fontSize: 11, color: "#fff" },
  verifiedBadge: { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  verifiedTxt: { fontFamily: F.med, fontSize: 11, color: C.green },
  photoCount: { position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.48)", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  photoCountTxt: { fontFamily: F.med, fontSize: 11, color: "#fff" },
  title: { fontFamily: F.bold, fontSize: 19, color: C.text, marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 16 },
  metaTxt: { fontFamily: F.reg, fontSize: 12, color: C.text3 },
  sep: { color: C.text3, fontSize: 12 },
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 18 },
  statCell: { flex: 1, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 12, padding: 12, alignItems: "center", gap: 4 },
  statVal: { fontFamily: F.bold, fontSize: 14, color: C.text },
  statLabel: { fontFamily: F.reg, fontSize: 10, color: C.text3, textAlign: "center" },
  section: { marginBottom: 20 },
  sectionLabel: { fontFamily: F.bold, fontSize: 13, color: C.text, marginBottom: 10 },
  bodyTxt: { fontFamily: F.reg, fontSize: 14, color: C.text2, lineHeight: 22 },
  amenityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  amenityTxt: { fontFamily: F.med, fontSize: 12, color: C.green },
  ownerCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 14, padding: 14 },
  ownerName: { fontFamily: F.bold, fontSize: 14, color: C.text },
  ownerSub: { fontFamily: F.reg, fontSize: 12, color: C.text3, marginTop: 2 },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 13, borderRadius: 12 },
  ctaTxt: { fontFamily: F.bold, fontSize: 14 },
});

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  back: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  author: { fontFamily: F.bold, fontSize: 13, color: C.text },
  sub: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 1 },
  pTitle: { fontFamily: F.bold, fontSize: 18, color: C.text, marginBottom: 6 },
  pBody: { fontFamily: F.reg, fontSize: 14, color: C.text2, lineHeight: 22 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 18 },
  cTitle: { fontFamily: F.bold, fontSize: 13, color: C.text, marginBottom: 12 },
  comment: { flexDirection: "row", gap: 9, marginBottom: 14, alignItems: "flex-start" },
  cWho: { fontFamily: F.bold, fontSize: 12, color: C.text },
  cAgo: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
  cBody: { fontFamily: F.reg, fontSize: 13, color: C.text2, lineHeight: 19, marginTop: 2 },
  empty: { fontFamily: F.reg, fontSize: 13, color: C.text3 },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline, backgroundColor: C.surface },
  input: { flex: 1, fontFamily: F.reg, fontSize: 14, color: C.text, backgroundColor: C.surface2, borderRadius: 99, paddingHorizontal: 15, height: 40 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.indigo, alignItems: "center", justifyContent: "center" },
});
