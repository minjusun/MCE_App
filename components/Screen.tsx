import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Placeholder note shown until the screen is built. */
  planned?: string;
  children?: ReactNode;
};

/** Page shell: title, optional subtitle, content. Matches the wireframe's page header. */
export function Screen({ title, subtitle, planned, children }: Props) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {planned ? (
        <View style={styles.planned}>
          <Text style={styles.plannedLabel}>Planned</Text>
          <Text style={styles.plannedText}>{planned}</Text>
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.xs, paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: fontWeight.semibold },
  subtitle: { color: colors.text2, fontSize: fontSize.body },
  planned: { gap: spacing.xs, padding: spacing.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radius.lg },
  plannedLabel: { color: colors.text3, fontSize: fontSize.caption, fontWeight: fontWeight.medium },
  plannedText: { color: colors.text2, fontSize: fontSize.body },
});
