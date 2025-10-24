import { View, Text, FlatList, Pressable } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "../lib/api";

export default function HomeScreen() {
  const qc = useQueryClient();
  const { data: score } = useQuery({ queryKey: ["score"], queryFn: () => fetchJson("/score") });
  const { data: insights } = useQuery({ queryKey: ["insights"], queryFn: () => fetchJson("/insights") });

  async function onSync() {
    await fetchJson("/sync", { method: "POST" });
    qc.invalidateQueries({ queryKey: ["score"] });
    qc.invalidateQueries({ queryKey: ["insights"] });
  }

  return (
    <View style={{ flex:1, padding:16, gap:12 }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>Tu salud financiera</Text>
      <Text style={{ fontSize:18 }}>Score: {score?.value ?? "..."}</Text>

      <Pressable onPress={onSync} style={{ padding:12, borderWidth:1, borderRadius:12, alignSelf:"flex-start" }}>
        <Text>Sincronizar</Text>
      </Pressable>

      <FlatList
        data={insights ?? []}
        keyExtractor={(i:any) => i.id}
        renderItem={({ item }: any) => (
          <View style={{ padding:12, borderWidth:1, borderRadius:12, marginBottom:10 }}>
            <Text style={{ fontWeight:"700" }}>{item.title}</Text>
            <Text>{item.body}</Text>
          </View>
        )}
      />
    </View>
  );
}
