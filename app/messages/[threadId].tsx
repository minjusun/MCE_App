import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';

export default function ThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  return <Screen title="Conversation" subtitle={threadId} planned="Messages with a collector." />;
}
