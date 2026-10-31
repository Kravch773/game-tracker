import { Stack, useLocalSearchParams } from "expo-router";
import { Library } from "@/components/Library";

export default function UserScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return (
    <>
      <Stack.Screen options={{ title: username }} />
      <Library username={username} />
    </>
  );
}
