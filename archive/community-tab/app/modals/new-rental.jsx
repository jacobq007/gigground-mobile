import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Image,
  TouchableOpacity, Alert, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Button, Field } from "../../components/ui";
import AreaPicker from "../../components/AreaPicker";
import { useAuth } from "../../lib/AuthContext";
import { postsAPI } from "../../lib/api";
import { C, F } from "../../lib/theme";

const RENTAL_TYPES = ["Room", "PG", "1BHK", "2BHK", "3BHK", "Villa"];
const FURNISHED_OPTS = ["Unfurnished", "Semi-furnished", "Fully furnished"];
const AMENITY_OPTS = [
  "AC", "WiFi", "Parking", "Lift", "Power backup",
  "24hr water", "CCTV", "Security", "Gym", "Laundry",
  "Meals included", "Modular kitchen",
];
const FLOORS = ["Ground", "1st floor", "2nd floor", "3rd floor", "4th floor", "5th+ floor", "Top floor"];

export default function NewRental() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [rent, setRent] = useState("");
  const [desc, setDesc] = useState("");
  const [rentalType, setRentalType] = useState("2BHK");
  const [furnished, setFurnished] = useState("Semi-furnished");
  const [floor, setFloor] = useState("2nd floor");
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [amenities, setAmenities] = useState([]);
  const [area, setArea] = useState(user?.area || "");
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);

  const toggleAmenity = (a) =>
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  const pickPhoto = async () => {
    if (photos.length >= 6) { Alert.alert("Max 6 photos"); return; }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: Platform.OS !== "web",
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const uris = result.assets.map((a) => a.uri).slice(0, 6 - photos.length);
        setPhotos((prev) => [...prev, ...uris]);
      }
    } catch {
      Alert.alert("Could not open photo library");
    }
  };

  const removePhoto = (idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!title || !rent || !area) {
      Alert.alert("Fill in title, rent, and area first"); return;
    }
    setBusy(true);
    await postsAPI.create({
      type: "rental",
      title,
      body: desc,
      area,
      rent: parseInt(rent) || 0,
      rentalType,
      furnished,
      floor,
      bedrooms,
      bathrooms,
      amenities,
      photos,
      photoCount: photos.length,
      availableFrom: "Immediate",
      verified: false,
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={22} color={C.navy} /></Pressable>
        <Text style={s.h}>List your rental</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Photos */}
        <Text style={s.lbl}>Photos <Text style={s.hint}>(up to 6)</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }} contentContainerStyle={{ gap: 10 }}>
          {photos.map((uri, idx) => (
            <View key={idx} style={s.photoThumb}>
              <Image source={{ uri }} style={s.photoImg} />
              <Pressable onPress={() => removePhoto(idx)} style={s.removeBtn}>
                <Ionicons name="close-circle" size={20} color="#fff" />
              </Pressable>
              {idx === 0 && <View style={s.mainBadge}><Text style={s.mainBadgeTxt}>Cover</Text></View>}
            </View>
          ))}
          {photos.length < 6 && (
            <Pressable onPress={pickPhoto} style={s.addPhoto}>
              <Ionicons name="camera-outline" size={26} color={C.text3} />
              <Text style={s.addPhotoTxt}>Add photo</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={{ gap: 14 }}>
          {/* Title */}
          <Field label="Listing title" value={title} onChangeText={setTitle} placeholder="e.g. 2BHK near Anna Nagar metro" />

          {/* Rent */}
          <Field label="Monthly rent (₹)" value={rent} onChangeText={setRent} keyboardType="number-pad" placeholder="18000" />

          {/* Rental type */}
          <View>
            <Text style={s.lbl}>Property type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {RENTAL_TYPES.map((t) => (
                <Pressable key={t} onPress={() => setRentalType(t)} style={[s.pill, rentalType === t && s.pillOn]}>
                  <Text style={[s.pillTxt, rentalType === t && s.pillTxtOn]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Furnished */}
          <View>
            <Text style={s.lbl}>Furnished status</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {FURNISHED_OPTS.map((f) => (
                <Pressable key={f} onPress={() => setFurnished(f)} style={[s.fBtn, furnished === f && s.fBtnOn, { flex: 1 }]}>
                  <Text style={[s.fTxt, furnished === f && s.fTxtOn]}>{f}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bedrooms + bathrooms */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.lbl}>Bedrooms</Text>
              <View style={s.stepper}>
                <Pressable onPress={() => setBedrooms((n) => Math.max(1, n - 1))} style={s.stepBtn}><Ionicons name="remove" size={18} color={C.navy} /></Pressable>
                <Text style={s.stepVal}>{bedrooms}</Text>
                <Pressable onPress={() => setBedrooms((n) => Math.min(6, n + 1))} style={s.stepBtn}><Ionicons name="add" size={18} color={C.navy} /></Pressable>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.lbl}>Bathrooms</Text>
              <View style={s.stepper}>
                <Pressable onPress={() => setBathrooms((n) => Math.max(1, n - 1))} style={s.stepBtn}><Ionicons name="remove" size={18} color={C.navy} /></Pressable>
                <Text style={s.stepVal}>{bathrooms}</Text>
                <Pressable onPress={() => setBathrooms((n) => Math.min(4, n + 1))} style={s.stepBtn}><Ionicons name="add" size={18} color={C.navy} /></Pressable>
              </View>
            </View>
          </View>

          {/* Floor */}
          <View>
            <Text style={s.lbl}>Floor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {FLOORS.map((f) => (
                <Pressable key={f} onPress={() => setFloor(f)} style={[s.pill, floor === f && s.pillOn]}>
                  <Text style={[s.pillTxt, floor === f && s.pillTxtOn]}>{f}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Amenities */}
          <View>
            <Text style={s.lbl}>Amenities <Text style={s.hint}>(select all that apply)</Text></Text>
            <View style={s.amenityGrid}>
              {AMENITY_OPTS.map((a) => {
                const on = amenities.includes(a);
                return (
                  <Pressable key={a} onPress={() => toggleAmenity(a)} style={[s.amenityBtn, on && s.amenityBtnOn]}>
                    <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={14} color={on ? C.green : C.text3} />
                    <Text style={[s.amenityTxt, on && s.amenityTxtOn]}>{a}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <Field label="Description" value={desc} onChangeText={setDesc} multiline placeholder="Describe the place — nearby landmarks, house rules, who it's ideal for…" />

          {/* Area */}
          <View>
            <Text style={s.lbl}>Area / Location</Text>
            <AreaPicker value={area} onChange={setArea} height={180} />
            <Text style={s.areaNote}><Ionicons name="information-circle-outline" size={12} color={C.text3} /> Exact address shared with interested tenants after you accept.</Text>
          </View>

          <Button title={busy ? "Listing…" : "Publish listing"} onPress={submit} disabled={busy || !title || !rent} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  h: { fontFamily: F.bold, fontSize: 15, color: C.text },
  lbl: { fontFamily: F.med, fontSize: 12, color: C.text2, marginBottom: 8 },
  hint: { fontFamily: F.reg, fontSize: 11, color: C.text3 },
  photoThumb: { width: 90, height: 90, borderRadius: 10, overflow: "hidden", position: "relative" },
  photoImg: { width: "100%", height: "100%" },
  removeBtn: { position: "absolute", top: 4, right: 4 },
  mainBadge: { position: "absolute", bottom: 4, left: 4, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  mainBadgeTxt: { fontFamily: F.bold, fontSize: 9, color: "#fff" },
  addPhoto: { width: 90, height: 90, borderRadius: 10, borderWidth: 1, borderColor: C.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: C.surface },
  addPhotoTxt: { fontFamily: F.med, fontSize: 10, color: C.text3 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  pillOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  pillTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  pillTxtOn: { color: C.indigo },
  fBtn: { paddingVertical: 10, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  fBtnOn: { backgroundColor: C.indigoSoft, borderColor: C.indigo },
  fTxt: { fontFamily: F.med, fontSize: 11, color: C.text2, textAlign: "center" },
  fTxtOn: { color: C.indigo },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 4 },
  stepBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stepVal: { fontFamily: F.bold, fontSize: 18, color: C.text },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  amenityBtnOn: { backgroundColor: "#F0FDF4", borderColor: C.green },
  amenityTxt: { fontFamily: F.med, fontSize: 12, color: C.text2 },
  amenityTxtOn: { color: C.green },
  areaNote: { fontFamily: F.reg, fontSize: 11, color: C.text3, marginTop: 6 },
});
