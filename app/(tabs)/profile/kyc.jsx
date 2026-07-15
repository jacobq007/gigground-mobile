import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Button, Field } from "../../../components/ui";
import { useAuth } from "../../../lib/AuthContext";
import { kycAPI } from "../../../lib/api";
import { F } from "../../../lib/theme";
import { useC } from "../../../lib/ThemeContext";

const ID_TYPES = ["Aadhaar", "PAN", "Driving licence", "Voter ID"];

export default function Kyc() {
  const C = useC();
  const s = makeStyles(C);
  const router = useRouter();
  const { refresh } = useAuth();
  const [status, setStatus] = useState("unverified");
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [idType, setIdType] = useState("Aadhaar");
  const [idImg, setIdImg] = useState(null);
  const [selfie, setSelfie] = useState(null);

  useEffect(() => { (async () => setStatus((await kycAPI.getStatus()).status))(); }, []);

  const pick = async (setter, camera) => {
    const fn = camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    if (camera) { const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) return; }
    const r = await fn({ quality: 0.5, allowsEditing: true });
    if (!r.canceled) setter(r.assets[0].uri);
  };

  const submit = async () => {
    await kycAPI.submit({ fullName, dob, idType, idImg, selfie });
    setStatus("pending");
    await refresh();
  };
  const devVerify = async () => { await kycAPI.devVerify(); setStatus("verified"); await refresh(); };

  if (status !== "unverified") {
    const verified = status === "verified";
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        <Topbar router={router} s={s} C={C} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={[s.bigIcon, { backgroundColor: verified ? C.greenSoft : "#FEF3E2" }]}>
            <Ionicons name={verified ? "shield-checkmark" : "time-outline"} size={34} color={verified ? C.green : C.amber} />
          </View>
          <Text style={s.bigTitle}>{verified ? "You're verified" : "Verification under review"}</Text>
          <Text style={s.bigSub}>{verified ? "Your verified badge now shows on your profile and gigs." : "We're checking your documents. This usually takes a few hours."}</Text>
          {!verified ? <Pressable onPress={devVerify} style={{ marginTop: 20 }}><Text style={s.dev}>(demo) mark as verified</Text></Pressable> : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <Topbar router={router} s={s} C={C} />
      <View style={s.steps}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <View style={[s.stepDot, step >= n && s.stepDotOn]}><Text style={[s.stepNum, step >= n && { color: "#fff" }]}>{n}</Text></View>
            {n < 3 ? <View style={[s.stepLine, step > n && { backgroundColor: C.indigo }]} /> : null}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={{ gap: 14 }}>
            <Text style={s.stepTitle}>Personal details</Text>
            <Field label="Full name (as on ID)" value={fullName} onChangeText={setFullName} />
            <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="DD / MM / YYYY" />
            <Button title="Continue" onPress={() => setStep(2)} disabled={!fullName} />
          </View>
        )}
        {step === 2 && (
          <View style={{ gap: 14 }}>
            <Text style={s.stepTitle}>Upload your ID</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {ID_TYPES.map((t) => (
                <Pressable key={t} onPress={() => setIdType(t)} style={[s.idChip, idType === t && s.idChipOn]}>
                  <Text style={[s.idChipTxt, idType === t && { color: C.indigo }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => pick(setIdImg, false)} style={s.upload}>
              {idImg ? <Image source={{ uri: idImg }} style={s.preview} /> : (
                <><Ionicons name="cloud-upload-outline" size={26} color={C.text3} /><Text style={s.uploadTxt}>Tap to upload {idType}</Text></>
              )}
            </Pressable>
            <Button title="Continue" onPress={() => setStep(3)} disabled={!idImg} />
          </View>
        )}
        {step === 3 && (
          <View style={{ gap: 14 }}>
            <Text style={s.stepTitle}>Take a selfie</Text>
            <Text style={s.note}>This helps us confirm it's really you.</Text>
            <Pressable onPress={() => pick(setSelfie, true)} style={s.upload}>
              {selfie ? <Image source={{ uri: selfie }} style={s.preview} /> : (
                <><Ionicons name="camera-outline" size={26} color={C.text3} /><Text style={s.uploadTxt}>Open camera</Text></>
              )}
            </Pressable>
            <Button title="Submit for verification" onPress={submit} disabled={!selfie} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Topbar({ router, s, C }) {
  return (
    <View style={s.topbar}>
      <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="arrow-back" size={20} color={C.navy} /></Pressable>
      <Text style={s.h}>KYC verification</Text>
      <View style={{ width: 20 }} />
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  steps: { flexDirection: "row", paddingHorizontal: 24, paddingVertical: 18 },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" },
  stepDotOn: { backgroundColor: C.indigo },
  stepNum: { fontFamily: F.bold, fontSize: 12, color: C.text3 },
  stepLine: { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: 4 },
  stepTitle: { fontFamily: F.bold, fontSize: 18, color: C.text },
  note: { fontFamily: F.reg, fontSize: 13, color: C.text2, marginTop: -8 },
  idChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  idChipOn: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  idChipTxt: { fontFamily: F.med, fontSize: 13, color: C.text2 },
  upload: { borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed", borderRadius: 14, height: 170, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.surface, overflow: "hidden" },
  uploadTxt: { fontFamily: F.med, fontSize: 13, color: C.text3 },
  preview: { width: "100%", height: "100%" },
  bigIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  bigTitle: { fontFamily: F.bold, fontSize: 20, color: C.text, textAlign: "center" },
  bigSub: { fontFamily: F.reg, fontSize: 14, color: C.text2, textAlign: "center", marginTop: 8, lineHeight: 21 },
  dev: { fontFamily: F.med, fontSize: 12, color: C.indigo, textDecorationLine: "underline" },
});
