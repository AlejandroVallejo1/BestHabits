import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { ensureToken } from "./src/lib/bootstrap";

const Stack = createNativeStackNavigator();
const client = new QueryClient();

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { ensureToken().then(() => setReady(true)); }, []);
  if (!ready) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator/></View>;
  return (
    <QueryClientProvider client={client}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
