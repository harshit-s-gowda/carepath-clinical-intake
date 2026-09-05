import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { I18nProvider, languageOptions, useI18n } from './i18n';

type Role = 'patient' | 'healthWorker' | 'clinician' | 'admin';
type Stage =
  | 'login'
  | 'welcome'
  | 'consent'
  | 'basics'
  | 'complaint'
  | 'adaptive'
  | 'history'
  | 'documents'
  | 'review'
  | 'submitted'
  | 'case';

type Draft = {
  name: string;
  age: string;
  gender: string;
  mobile: string;
  abha: string;
  concern: string;
  duration: string;
  cough: boolean | null;
  breathlessness: boolean | null;
  chills: boolean | null;
  diabetes: boolean | null;
  medication: string;
  careApproach: 'conventional' | 'ayurveda' | 'integrated';
  ayurvedaPrakriti: string;
  ayurvedaAgni: string;
  ayurvedaNidra: string;
  voiceCaptured: boolean;
  documentName: string | null;
  documentProcessed: boolean;
  consented: boolean;
  verified: boolean;
  finalized: boolean;
};

const STORAGE_KEY = 'carepath-case-draft';

const emptyDraft: Draft = {
  name: '',
  age: '',
  gender: '',
  mobile: '',
  abha: '',
  concern: '',
  duration: '',
  cough: null,
  breathlessness: null,
  chills: null,
  diabetes: null,
  medication: '',
  careApproach: 'conventional',
  ayurvedaPrakriti: '',
  ayurvedaAgni: '',
  ayurvedaNidra: '',
  voiceCaptured: false,
  documentName: null,
  documentProcessed: false,
  consented: false,
  verified: false,
  finalized: false,
};

const demoDraft: Draft = {
  ...emptyDraft,
  name: 'Rahul Kumar',
  age: '42',
  gender: 'Male',
  concern: 'Fever',
  duration: '3 days',
  cough: true,
  breathlessness: false,
  chills: true,
  diabetes: true,
  medication: 'Metformin 500 mg',
  voiceCaptured: true,
  documentName: 'Previous prescription.pdf',
  documentProcessed: true,
  consented: true,
};

function haptic() {
  if (Platform.OS !== 'web') {
    void Haptics.selectionAsync();
  }
}

function Logo({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.logoWrap}>
      <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
        <Feather name="git-merge" size={compact ? 16 : 19} color={colors.primaryForeground} />
      </View>
      {!compact && (
        <View>
          <Text style={[styles.logoTitle, { color: colors.foreground }]}>carepath</Text>
          <Text style={[styles.logoCaption, { color: colors.mutedForeground }]}>clinical intake</Text>
        </View>
      )}
    </View>
  );
}

function IconButton({
  icon,
  onPress,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  label: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
      ]}
    >
      <Feather name={icon} size={19} color={colors.foreground} />
    </Pressable>
  );
}

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'teal';
}) {
  const colors = useColors();
  const { t } = useI18n();
  const toneStyles = {
    neutral: { backgroundColor: colors.muted, color: colors.mutedForeground },
    success: { backgroundColor: `${colors.primary}20`, color: colors.primary },
    warning: { backgroundColor: `${colors.accent}70`, color: colors.accentForeground },
    danger: { backgroundColor: `${colors.destructive}18`, color: colors.destructive },
    teal: { backgroundColor: colors.secondary, color: colors.secondaryForeground },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: toneStyles.backgroundColor }]}>
      <Text style={[styles.pillText, { color: toneStyles.color }]}>
        {typeof children === 'string' ? t(children, children) : children}
      </Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        Keyboard.dismiss();
        haptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: secondary ? colors.secondary : colors.primary,
          borderColor: secondary ? colors.border : colors.primary,
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.primaryButtonText,
          { color: secondary ? colors.secondaryForeground : colors.primaryForeground },
        ]}
      >
        {t(label, label)}
      </Text>
      {icon && (
        <Feather
          name={icon}
          size={17}
          color={secondary ? colors.secondaryForeground : colors.primaryForeground}
        />
      )}
    </Pressable>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <View style={styles.sectionTitle}>
      {eyebrow && <Text style={[styles.eyebrow, { color: colors.primary }]}>{t(eyebrow, eyebrow)}</Text>}
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>{t(title, title)}</Text>
      {description && (
        <Text style={[styles.pageDescription, { color: colors.mutedForeground }]}>
          {t(description, description)}
        </Text>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
}) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t(label, label)}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={t(placeholder, placeholder)}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground },
        ]}
      />
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: selected ? colors.secondary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.primary : colors.input },
          selected && { backgroundColor: colors.primary },
        ]}
      >
        {selected && <View style={[styles.radioDot, { backgroundColor: colors.primaryForeground }]} />}
      </View>
      <Text style={[styles.choiceText, { color: colors.foreground }]}>{t(label, label)}</Text>
    </Pressable>
  );
}

function InfoCard({
  icon,
  title,
  text,
  tone = 'teal',
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  text: string;
  tone?: 'teal' | 'warning' | 'danger';
}) {
  const colors = useColors();
  const { t } = useI18n();
  const toneColor = tone === 'danger' ? colors.destructive : tone === 'warning' ? colors.accentForeground : colors.primary;
  return (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: tone === 'danger' ? `${colors.destructive}12` : tone === 'warning' ? `${colors.accent}55` : colors.secondary,
          borderColor: tone === 'danger' ? `${colors.destructive}35` : tone === 'warning' ? `${colors.accentForeground}20` : `${colors.primary}25`,
        },
      ]}
    >
      <View style={[styles.infoIcon, { backgroundColor: `${toneColor}20` }]}>
        <Feather name={icon} size={18} color={toneColor} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>{t(title, title)}</Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{t(text, text)}</Text>
      </View>
    </View>
  );
}

function Progress({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressMeta}>
        <Text style={[styles.progressLabel, { color: colors.foreground }]}>{t(label, label)}</Text>
        <Text style={[styles.progressCount, { color: colors.mutedForeground }]}>
          {step} {t('of', 'of')} {total}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${Math.min((step / total) * 100, 100)}%` },
          ]}
        />
      </View>
    </View>
  );
}

function PatientFlow({
  draft,
  setDraft,
  stage,
  setStage,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  stage: Stage;
  setStage: React.Dispatch<React.SetStateAction<Stage>>;
}) {
  const colors = useColors();
  const { t } = useI18n();
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const go = (next: Stage) => {
    setError('');
    setStage(next);
  };

  const startVoice = () => {
    setVoiceBusy(true);
    setTimeout(() => {
      update({ voiceCaptured: true, concern: draft.concern || 'Fever' });
      setVoiceBusy(false);
    }, 1300);
  };

  const uploadDocument = async () => {
    setUploadBusy(true);
    setError('');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      update({ documentName: result.assets[0].fileName || 'Previous medical document.jpg' });
      setTimeout(() => update({ documentProcessed: true }), 1200);
    }
    setUploadBusy(false);
  };

  const renderFooter = (label: string, onPress: () => void, disabled = false) => (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 18) }]}>
      <PrimaryButton label={label} icon="arrow-right" onPress={onPress} disabled={disabled} />
      <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
        {t('You can pause and return anytime. Your answers stay on this device.')}
      </Text>
    </View>
  );

  if (stage === 'welcome') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroKicker}>
          <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.heroKickerText, { color: colors.primary }]}>{t('PRIVATE · PATIENT INTAKE')}</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Let’s make your visit{'\n'}
          <Text style={{ color: colors.primary }}>more useful.</Text>
        </Text>
        <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>
          Tell us what’s going on in your own words. We’ll organize it into a clear story for your care team.
        </Text>
        <View style={[styles.heroIllustration, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroCircleOne, { backgroundColor: `${colors.primaryForeground}15` }]} />
          <View style={[styles.heroCircleTwo, { backgroundColor: `${colors.primaryForeground}12` }]} />
          <View style={styles.heroNote}>
            <Feather name="check" size={19} color={colors.primaryForeground} />
            <Text style={[styles.heroNoteText, { color: colors.primaryForeground }]}>{t('Your story, clearly heard')}</Text>
          </View>
          <View style={styles.heroPath}>
            <View style={[styles.pathNode, { backgroundColor: colors.primaryForeground }]} />
            <View style={[styles.pathLine, { backgroundColor: `${colors.primaryForeground}70` }]} />
            <View style={[styles.pathNode, { backgroundColor: colors.accent }]} />
            <View style={[styles.pathLine, { backgroundColor: `${colors.primaryForeground}70` }]} />
            <View style={[styles.pathNode, { backgroundColor: colors.primaryForeground }]} />
          </View>
        </View>
        <View style={[styles.approachCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.questionLabel, { color: colors.foreground }]}>{t('Choose your care approach')}</Text>
          <Text style={[styles.approachIntro, { color: colors.mutedForeground }]}>
            {t('You can use conventional medicine, Ayurveda, or both in one care plan.')}
          </Text>
          <View style={styles.approachOptions}>
            {[
              {
                key: 'conventional' as const,
                icon: 'activity' as const,
                label: t('Conventional medicine (English medicine)'),
                text: t('Modern clinical assessment, medicines, and investigations'),
              },
              {
                key: 'ayurveda' as const,
                icon: 'sun' as const,
                label: t('Ayurveda'),
                text: t('Traditional wellness questions and Ayurveda context'),
              },
              {
                key: 'integrated' as const,
                icon: 'git-merge' as const,
                label: t('Both / integrated care'),
                text: t('Keep both approaches visible to your care team'),
              },
            ].map((option) => {
              const selected = draft.careApproach === option.key;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => update({ careApproach: option.key })}
                  style={[
                    styles.approachOption,
                    {
                      backgroundColor: selected ? colors.secondary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.approachIcon, { backgroundColor: selected ? colors.primary : colors.muted }]}>
                    <Feather name={option.icon} size={16} color={selected ? colors.primaryForeground : colors.primary} />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={[styles.approachTitle, { color: colors.foreground }]}>{option.label}</Text>
                    <Text style={[styles.approachText, { color: colors.mutedForeground }]}>{option.text}</Text>
                  </View>
                  {selected && <Feather name="check-circle" size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.valueList}>
          {[
             ['clock', t('Around 5 minutes'), t('A few focused questions before you see the doctor')],
             ['shield', t('Private by design'), t('Your consent is required before health details are collected')],
             ['users', t('Built for care teams'), t('Your doctor reviews every generated summary before using it')],
          ].map(([icon, title, text]) => (
            <View style={styles.valueRow} key={title}>
              <View style={[styles.valueIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={icon as keyof typeof Feather.glyphMap} size={17} color={colors.primary} />
              </View>
              <View style={styles.valueCopy}>
                <Text style={[styles.valueTitle, { color: colors.foreground }]}>{title}</Text>
                <Text style={[styles.valueText, { color: colors.mutedForeground }]}>{text}</Text>
              </View>
            </View>
          ))}
        </View>
         {renderFooter(t('Start a new case'), () => go('consent'))}
      </ScrollView>
    );
  }

  if (stage === 'consent') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Progress step={1} total={8} label="Before we begin" />
        <SectionTitle
           eyebrow={t('YOUR CHOICE MATTERS')}
          title="A quick note about your information"
          description="Please read this before sharing anything about your health."
        />
        <View style={[styles.consentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.consentSeal, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={23} color={colors.primary} />
          </View>
           <Text style={[styles.consentHeading, { color: colors.foreground }]}>{t('What you’re agreeing to')}</Text>
          {[
            ['We collect', 'Your answers, basic details, and any documents you choose to upload.'],
            ['Why we collect it', 'To help your care team understand your visit before the consultation.'],
            ['Who can see it', 'Only the care team responsible for your visit and authorized staff.'],
            ['How AI is used', 'AI may organize and summarize information. It does not diagnose or prescribe.'],
          ].map(([title, text]) => (
            <View style={styles.consentRow} key={title}>
              <View style={[styles.consentBullet, { backgroundColor: colors.primary }]} />
              <View style={styles.infoCopy}>
                <Text style={[styles.consentRowTitle, { color: colors.foreground }]}>{title}</Text>
                <Text style={[styles.consentRowText, { color: colors.mutedForeground }]}>{text}</Text>
              </View>
            </View>
          ))}
        </View>
        <Choice
          label="I understand and consent to use this information for my care"
          selected={draft.consented}
          onPress={() => update({ consented: !draft.consented })}
        />
        <InfoCard
          icon="lock"
           title={t('You stay in control')}
           text={t('You can stop, review, or ask a care team member for help at any point.')}
        />
         {renderFooter(t('Continue securely'), () => go('basics'), !draft.consented)}
      </ScrollView>
    );
  }

  if (stage === 'basics') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Progress step={2} total={8} label="About you" />
        <SectionTitle
          eyebrow="FIRST, THE BASICS"
          title="How should we address you?"
          description="These details help your care team identify the right record."
        />
         <Field label={t('Full name')} value={draft.name} onChangeText={(name) => update({ name })} placeholder="e.g. Rahul Kumar" />
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
             <Field label={t('Age')} value={draft.age} onChangeText={(age) => update({ age })} placeholder="42" keyboardType="number-pad" />
          </View>
          <View style={styles.fieldHalf}>
             <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('Gender')}</Text>
            <View style={styles.choiceRow}>
              {['Female', 'Male', 'Other'].map((gender) => (
                <Pressable
                  key={gender}
                  onPress={() => update({ gender })}
                  style={[
                    styles.smallChoice,
                    { backgroundColor: draft.gender === gender ? colors.secondary : colors.card, borderColor: draft.gender === gender ? colors.primary : colors.border },
                  ]}
                >
                 <Text style={[styles.smallChoiceText, { color: draft.gender === gender ? colors.primary : colors.mutedForeground }]}>{t(gender)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
         <Field label={t('Mobile number (optional)')} value={draft.mobile} onChangeText={(mobile) => update({ mobile })} placeholder="+91 00000 00000" keyboardType="phone-pad" />
         <Field label={t('ABHA ID (optional)')} value={draft.abha} onChangeText={(abha) => update({ abha })} placeholder="Enter if you have one" />
         <InfoCard icon="info" title={t('No ABHA? That’s okay.')} text={t('You can continue without it. We never invent or auto-fill an ABHA ID.')} />
        {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
         {renderFooter(t('Save and continue'), () => {
          if (!draft.name.trim() || !draft.age.trim()) {
            setError('Please add your name and age to continue.');
            return;
          }
          go('complaint');
        })}
      </ScrollView>
    );
  }

  if (stage === 'complaint') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Progress step={3} total={8} label="Your main concern" />
         <SectionTitle
           eyebrow={t('IN YOUR OWN WORDS')}
          title="What brought you in today?"
          description="Choose the closest match, or say it out loud. You can explain more next."
        />
        <View style={styles.complaintGrid}>
           {['Fever', 'Cough', 'Pain', 'Vomiting', 'Breathing difficulty', 'Other'].map((item) => (
            <Pressable
              key={item}
              onPress={() => update({ concern: item })}
              style={[
                styles.complaintOption,
                { backgroundColor: draft.concern === item ? colors.primary : colors.card, borderColor: draft.concern === item ? colors.primary : colors.border },
              ]}
            >
              <MaterialCommunityIcons
                name={item === 'Fever' ? 'thermometer' : item === 'Cough' ? 'weather-windy' : item === 'Pain' ? 'flash-outline' : item === 'Vomiting' ? 'stomach' : item === 'Breathing difficulty' ? 'lungs' : 'dots-horizontal-circle-outline'}
                size={23}
                color={draft.concern === item ? colors.primaryForeground : colors.primary}
              />
               <Text style={[styles.complaintText, { color: draft.concern === item ? colors.primaryForeground : colors.foreground }]}>{t(item)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.voiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.voiceIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name={voiceBusy ? 'radio' : 'mic-outline'} size={23} color={colors.accentForeground} />
          </View>
          <View style={styles.voiceCopy}>
             <Text style={[styles.voiceTitle, { color: colors.foreground }]}>{voiceBusy ? t('Listening…') : draft.voiceCaptured ? t('Voice answer captured') : t('Prefer to speak?')}</Text>
            <Text style={[styles.voiceText, { color: colors.mutedForeground }]}>
              {voiceBusy ? 'Say what you would tell your doctor.' : draft.voiceCaptured ? 'Review your answer before saving it.' : 'Use voice input and we’ll show you the words before they are saved.'}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Use voice input"
            onPress={startVoice}
            disabled={voiceBusy}
            style={[styles.micButton, { backgroundColor: colors.primary, opacity: voiceBusy ? 0.5 : 1 }]}
          >
            {voiceBusy ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Feather name={draft.voiceCaptured ? 'check' : 'mic'} size={18} color={colors.primaryForeground} />}
          </Pressable>
        </View>
        {draft.voiceCaptured && (
          <View style={[styles.transcription, { backgroundColor: colors.secondary, borderColor: `${colors.primary}25` }]}>
             <Text style={[styles.transcriptionLabel, { color: colors.primary }]}>{t('YOU SAID')}</Text>
            <Text style={[styles.transcriptionText, { color: colors.foreground }]}>“I have had fever and chills for three days.”</Text>
             <Text style={[styles.transcriptionHint, { color: colors.mutedForeground }]}>{t('This is a demo transcription. Review is required before saving.', 'This is a demo transcription. Review is required before saving.')}</Text>
          </View>
        )}
         {renderFooter(t('Answer a few follow-ups'), () => go('adaptive'), !draft.concern)}
      </ScrollView>
    );
  }

  if (stage === 'adaptive') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Progress step={4} total={8} label="A little more detail" />
        <SectionTitle
          eyebrow={`${draft.concern.toUpperCase()} FOLLOW-UP`}
          title="Help us understand the pattern"
          description="There are no right answers. Tell us what you’ve noticed."
        />
         <Text style={[styles.questionLabel, { color: colors.foreground }]}>{t('How long has this been happening?')}</Text>
        <View style={styles.durationRow}>
           {['Today', '2–3 days', '1 week', 'Longer'].map((duration) => (
            <Pressable
              key={duration}
              onPress={() => update({ duration })}
              style={[
                styles.durationChip,
                { backgroundColor: draft.duration === duration ? colors.primary : colors.card, borderColor: draft.duration === duration ? colors.primary : colors.border },
              ]}
            >
               <Text style={[styles.durationText, { color: draft.duration === duration ? colors.primaryForeground : colors.foreground }]}>{t(duration)}</Text>
            </Pressable>
          ))}
        </View>
         <Text style={[styles.questionLabel, { color: colors.foreground }]}>{t('Have you noticed any of these?')}</Text>
         <Choice label="Cough" selected={draft.cough === true} onPress={() => update({ cough: draft.cough === true ? null : true })} />
         <Choice label="Breathing difficulty" selected={draft.breathlessness === true} onPress={() => update({ breathlessness: draft.breathlessness === true ? null : true })} />
         <Choice label={t('Chills or feeling unusually cold', 'Chills or feeling unusually cold')} selected={draft.chills === true} onPress={() => update({ chills: draft.chills === true ? null : true })} />
        <InfoCard icon="help-circle" title="Not sure?" text="It’s okay to leave a question unanswered. Your doctor can ask you in person." />
         {renderFooter(t('Continue to health history'), () => go('history'), !draft.duration)}
      </ScrollView>
    );
  }

  if (stage === 'history') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Progress step={5} total={8} label="Health history" />
        <SectionTitle
          eyebrow="PAST AND PRESENT"
          title="A few health details"
          description="This helps your doctor see the full picture, not just today’s symptom."
        />
         <Text style={[styles.questionLabel, { color: colors.foreground }]}>{t('Have you ever been told you have diabetes?')}</Text>
        <View style={styles.choiceRowWide}>
          <Choice label="Yes" selected={draft.diabetes === true} onPress={() => update({ diabetes: true })} />
          <Choice label="No" selected={draft.diabetes === false} onPress={() => update({ diabetes: false })} />
        </View>
        {draft.diabetes === true && (
          <View style={[styles.historyDetail, { backgroundColor: colors.secondary }]}>
            <Feather name="calendar" size={17} color={colors.primary} />
           <Text style={[styles.historyDetailText, { color: colors.secondaryForeground }]}>{t('You can share the year with your doctor later.', 'You can share the year with your doctor later.')}</Text>
          </View>
        )}
         <Text style={[styles.questionLabel, { color: colors.foreground }]}>{t('Are you taking any regular medicines?')}</Text>
        <TextInput
          accessibilityLabel="Regular medicines"
          value={draft.medication}
          onChangeText={(medication) => update({ medication })}
          placeholder="Medicine name and dose, if you remember"
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground }]}
        />
         <View style={[styles.ayurvedaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
           <View style={styles.ayurvedaHeader}>
             <View style={[styles.moduleIcon, { backgroundColor: colors.accent }]}>
               <Feather name="sun" size={18} color={colors.accentForeground} />
             </View>
             <View style={styles.infoCopy}>
               <Text style={[styles.infoTitle, { color: colors.foreground }]}>{t('Ayurveda-focused context')}</Text>
               <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{t('Optional traditional wellness questions')}</Text>
             </View>
           </View>
           <Text style={[styles.ayurvedaNote, { color: colors.mutedForeground }]}>
             {t('These terms help the care team understand your routine and preferences. They are not a diagnosis.')}
           </Text>
           <Text style={[styles.questionLabel, { color: colors.foreground }]}>{t('Prakriti (body constitution)')}</Text>
           <View style={styles.choiceRowWide}>
             <Choice label={t('I know my Prakriti')} selected={draft.ayurvedaPrakriti === 'known'} onPress={() => update({ ayurvedaPrakriti: draft.ayurvedaPrakriti === 'known' ? '' : 'known' })} />
             <Choice label={t('Not sure')} selected={draft.ayurvedaPrakriti === 'unsure'} onPress={() => update({ ayurvedaPrakriti: draft.ayurvedaPrakriti === 'unsure' ? '' : 'unsure' })} />
           </View>
           <Text style={[styles.questionLabel, { color: colors.foreground }]}>{t('Agni (digestion)')}</Text>
           <View style={styles.choiceRowWide}>
             <Choice label={t('Steady')} selected={draft.ayurvedaAgni === 'steady'} onPress={() => update({ ayurvedaAgni: draft.ayurvedaAgni === 'steady' ? '' : 'steady' })} />
             <Choice label={t('Variable')} selected={draft.ayurvedaAgni === 'variable'} onPress={() => update({ ayurvedaAgni: draft.ayurvedaAgni === 'variable' ? '' : 'variable' })} />
             <Choice label={t('Low')} selected={draft.ayurvedaAgni === 'low'} onPress={() => update({ ayurvedaAgni: draft.ayurvedaAgni === 'low' ? '' : 'low' })} />
           </View>
           <Text style={[styles.questionLabel, { color: colors.foreground }]}>{t('Nidra (sleep)')}</Text>
           <View style={styles.choiceRowWide}>
             <Choice label={t('Restful')} selected={draft.ayurvedaNidra === 'restful'} onPress={() => update({ ayurvedaNidra: draft.ayurvedaNidra === 'restful' ? '' : 'restful' })} />
             <Choice label={t('Interrupted')} selected={draft.ayurvedaNidra === 'interrupted'} onPress={() => update({ ayurvedaNidra: draft.ayurvedaNidra === 'interrupted' ? '' : 'interrupted' })} />
             <Choice label={t('Difficulty sleeping')} selected={draft.ayurvedaNidra === 'difficulty'} onPress={() => update({ ayurvedaNidra: draft.ayurvedaNidra === 'difficulty' ? '' : 'difficulty' })} />
           </View>
         </View>
        <View style={[styles.moduleRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={[styles.moduleIcon, { backgroundColor: colors.accent }]}>
            <Feather name="sun" size={18} color={colors.accentForeground} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Ayurveda history</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Optional questions about sleep, food, and daily routine come next.</Text>
          </View>
          <Feather name="arrow-right" size={18} color={colors.mutedForeground} />
        </View>
         {renderFooter(t('Continue to documents'), () => go('documents'))}
      </ScrollView>
    );
  }

  if (stage === 'documents') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Progress step={6} total={8} label="Previous documents" />
        <SectionTitle
          eyebrow="OPTIONAL, BUT HELPFUL"
          title="Have an older report or prescription?"
          description="A clear photo or PDF can save you from repeating details. Upload only what you’re comfortable sharing."
        />
        <Pressable
          accessibilityLabel="Upload a medical document"
          onPress={uploadDocument}
          disabled={uploadBusy}
          style={({ pressed }) => [
            styles.uploadBox,
            { borderColor: colors.primary, backgroundColor: `${colors.primary}09`, opacity: pressed || uploadBusy ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.uploadIcon, { backgroundColor: colors.secondary }]}>
            {uploadBusy ? <ActivityIndicator color={colors.primary} /> : <Feather name="upload-cloud" size={22} color={colors.primary} />}
          </View>
          <Text style={[styles.uploadTitle, { color: colors.foreground }]}>{uploadBusy ? t('Opening your files…', 'Opening your files…') : t('Add a document', 'Add a document')}</Text>
          <Text style={[styles.uploadText, { color: colors.mutedForeground }]}>Photo, prescription, lab report, or PDF</Text>
          <Pill tone="teal">MAX 10 MB · PRIVATE</Pill>
        </Pressable>
        {draft.documentName && (
          <View style={[styles.documentRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.documentIcon, { backgroundColor: colors.accent }]}>
              <Feather name="file-text" size={19} color={colors.accentForeground} />
            </View>
            <View style={styles.infoCopy}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]} numberOfLines={1}>{draft.documentName}</Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{draft.documentProcessed ? 'Read and organized · review available' : 'Reading document…'}</Text>
            </View>
            {draft.documentProcessed ? <Feather name="check-circle" size={20} color={colors.primary} /> : <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        )}
        <InfoCard icon="cpu" title="What happens next" text="A safe processing layer reads the text and highlights possible values. Every extracted field shows its source and needs review." />
         {renderFooter(t('Review my case'), () => go('review'))}
      </ScrollView>
    );
  }

  if (stage === 'review') {
    const redFlag = draft.breathlessness === true;
    const careApproachLabel = draft.careApproach === 'ayurveda'
      ? t('Ayurveda')
      : draft.careApproach === 'integrated'
        ? t('Both / integrated care')
        : t('Conventional medicine (English medicine)');
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Progress step={7} total={8} label="Review before sharing" />
        <SectionTitle
          eyebrow="YOUR CASE SHEET"
          title="Does this look right?"
          description="This is the information your care team will receive. You can go back and change anything."
        />
        <View style={[styles.summaryHero, { backgroundColor: colors.primary }]}>
           <Text style={[styles.summaryHeroEyebrow, { color: `${colors.primaryForeground}B8` }]}>{t('AI-ORGANIZED DRAFT')}</Text>
          <Text style={[styles.summaryHeroText, { color: colors.primaryForeground }]}>
            {draft.age || '—'}-year-old {draft.gender.toLowerCase() || 'person'} reporting {draft.concern.toLowerCase() || 'a health concern'} for {draft.duration || 'an unspecified duration'}.
          </Text>
          <View style={styles.summarySource}>
            <Feather name="info" size={13} color={`${colors.primaryForeground}C8`} />
             <Text style={[styles.summarySourceText, { color: `${colors.primaryForeground}C8` }]}>{t('Organized from your answers · not a diagnosis')}</Text>
          </View>
        </View>
        {redFlag && (
           <InfoCard icon="alert-triangle" tone="danger" title={t('Potential red flag detected')} text={t('Breathing difficulty was reported. A doctor should review this promptly. This is not a diagnosis.', 'Breathing difficulty was reported. A doctor should review this promptly. This is not a diagnosis.')} />
        )}
        <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
           <ReviewLine label={t('Care approach')} value={careApproachLabel} />
           <ReviewLine label={t('Main concern', 'Main concern')} value={draft.concern ? t(draft.concern, draft.concern) : t('Not shared')} />
           <ReviewLine label={t('Duration', 'Duration')} value={draft.duration || t('Not shared')} />
           <ReviewLine label={t('Associated symptoms', 'Associated symptoms')} value={[draft.cough && t('Cough'), draft.chills && t('Chills', 'Chills')].filter(Boolean).join(', ') || t('None selected')} />
           <ReviewLine label={t('Past history', 'Past history')} value={draft.diabetes ? t('Diabetes reported', 'Diabetes reported') : t('No diabetes reported', 'No diabetes reported')} />
           <ReviewLine label={t('Medicines', 'Medicines')} value={draft.medication || t('None shared')} />
          {draft.documentName && <ReviewLine label="Document" value={draft.documentName} last />}
        </View>
        <View style={[styles.aiBoundary, { borderColor: colors.border }]}>
          <Feather name="shield" size={16} color={colors.primary} />
           <Text style={[styles.aiBoundaryText, { color: colors.mutedForeground }]}>{t('Your doctor remains the final decision-maker. Generated information is clearly marked for verification.')}</Text>
        </View>
         {renderFooter(t('Share with my care team'), () => {
          update({ verified: false });
          go('submitted');
        })}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.submittedMark, { backgroundColor: colors.secondary }]}>
        <Feather name="check" size={29} color={colors.primary} />
      </View>
       <Text style={[styles.submittedTitle, { color: colors.foreground }]}>{t('Your case is with the doctor')}</Text>
      <Text style={[styles.submittedBody, { color: colors.mutedForeground }]}>You’re all set, {draft.name.split(' ')[0] || 'there'}. Your case sheet has been added to today’s care queue.</Text>
      <View style={[styles.tokenCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.tokenLabel, { color: colors.mutedForeground }]}>YOUR TOKEN</Text>
          <Text style={[styles.tokenNumber, { color: colors.foreground }]}>104</Text>
        </View>
        <View style={[styles.tokenDivider, { backgroundColor: colors.border }]} />
        <View style={styles.tokenStatus}>
          <Pill tone="success">WAITING</Pill>
          <Text style={[styles.tokenHint, { color: colors.mutedForeground }]}>Updated just now</Text>
        </View>
      </View>
       <InfoCard icon="bell" title={t('What happens now')} text={t('The care team will review your information and call you when it’s your turn. Please stay nearby.')} />
      <View style={styles.submittedActions}>
         <PrimaryButton label={t('View my case')} secondary icon="file-text" onPress={() => go('review')} />
         <PrimaryButton label={t('Done')} icon="check" onPress={() => go('welcome')} />
      </View>
    </ScrollView>
  );
}

function ReviewLine({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <View style={[styles.reviewLine, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{t(label, label)}</Text>
      <Text style={[styles.reviewValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function ClinicianDashboard({ onOpenCase }: { onOpenCase: () => void }) {
  const colors = useColors();
  const { t } = useI18n();
  const [filter, setFilter] = useState('All');
  const queue = [
    { token: '104', name: 'Rahul Kumar', detail: '42 · Male · Fever', status: 'High priority', tone: 'danger' as const, time: 'Just now' },
    { token: '103', name: 'Meena Rao', detail: '36 · Female · Follow-up', status: 'Review', tone: 'warning' as const, time: '8 min ago' },
    { token: '102', name: 'Arjun Shah', detail: '28 · Male · Cough', status: 'Waiting', tone: 'teal' as const, time: '14 min ago' },
    { token: '101', name: 'Sana Iyer', detail: '61 · Female · Diabetes review', status: 'Completed', tone: 'success' as const, time: '32 min ago' },
  ];
  const visibleQueue = filter === 'All' ? queue : queue.filter((item) => item.status.toLowerCase().includes(filter.toLowerCase()));
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.dashboardGreeting}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>FRIDAY · 04 SEP 2026</Text>
          <Text style={[styles.dashboardTitle, { color: colors.foreground }]}>Good morning, Dr. Iyer</Text>
          <Text style={[styles.pageDescription, { color: colors.mutedForeground }]}>Here’s the care queue for today.</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.accentForeground }]}>AI</Text>
        </View>
      </View>
      <View style={styles.metricGrid}>
        {[
          ['12', 'Today’s OPD', 'users', colors.primary],
          ['04', 'Waiting', 'clock', colors.accentForeground],
          ['01', 'Priority', 'alert-triangle', colors.destructive],
        ].map(([value, label, icon, color]) => (
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]} key={label}>
            <Feather name={icon as keyof typeof Feather.glyphMap} size={17} color={color as string} />
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.queueHeader}>
        <View>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{t('Today’s queue')}</Text>
          <Text style={[styles.sectionSubheading, { color: colors.mutedForeground }]}>{t('Priority cases stay visible at the top.')}</Text>
        </View>
        <Pressable accessibilityLabel="Search queue" style={[styles.searchButton, { backgroundColor: colors.secondary }]}>
          <Feather name="search" size={18} color={colors.primary} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
         {['All', 'Waiting', 'Review', 'High', 'Completed'].map((item) => (
          <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterChip, { backgroundColor: filter === item ? colors.foreground : colors.card, borderColor: filter === item ? colors.foreground : colors.border }]}>
             <Text style={[styles.filterText, { color: filter === item ? colors.card : colors.mutedForeground }]}>{t(item)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.queueList}>
        {visibleQueue.map((item) => (
          <Pressable
            key={item.token}
            onPress={item.token === '104' ? onOpenCase : undefined}
            style={({ pressed }) => [styles.queueCard, { backgroundColor: colors.card, borderColor: item.status === 'High priority' ? `${colors.destructive}60` : colors.border, opacity: pressed ? 0.76 : 1 }]}
          >
            <View style={[styles.queueToken, { backgroundColor: item.status === 'High priority' ? `${colors.destructive}15` : colors.secondary }]}>
              <Text style={[styles.queueTokenLabel, { color: item.status === 'High priority' ? colors.destructive : colors.primary }]}>TOKEN</Text>
              <Text style={[styles.queueTokenNumber, { color: item.status === 'High priority' ? colors.destructive : colors.foreground }]}>{item.token}</Text>
            </View>
            <View style={styles.queueCopy}>
              <View style={styles.queueNameRow}>
                <Text style={[styles.queueName, { color: colors.foreground }]}>{item.name}</Text>
                <Pill tone={item.tone}>{t(item.status, item.status)}</Pill>
              </View>
              <Text style={[styles.queueDetail, { color: colors.mutedForeground }]}>{item.detail}</Text>
              <Text style={[styles.queueTime, { color: colors.mutedForeground }]}>{item.time}</Text>
            </View>
            {item.token === '104' && <Feather name="chevron-right" size={19} color={colors.primary} />}
          </Pressable>
        ))}
      </View>
      <View style={[styles.disclaimer, { backgroundColor: colors.secondary }]}>
        <Feather name="eye" size={15} color={colors.primary} />
         <Text style={[styles.disclaimerText, { color: colors.secondaryForeground }]}>{t('AI-organized details are marked in each case for your review.')}</Text>
      </View>
    </ScrollView>
  );
}

function DoctorCase({ onBack }: { onBack: () => void }) {
  const colors = useColors();
  const { t } = useI18n();
  const [verified, setVerified] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [note, setNote] = useState('');
  const timeline = [
    ['2018', 'Diabetes reported', 'Patient answer'],
    ['2024', 'Blood investigation', 'Previous prescription'],
    ['Today', 'Fever with cough and chills', 'Current consultation'],
  ];
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.caseTopBar}>
         <IconButton icon="arrow-left" label={t('Back to queue')} onPress={onBack} />
        <Pill tone={finalized ? 'success' : verified ? 'teal' : 'warning'}>{finalized ? 'FINALIZED' : verified ? 'VERIFIED' : 'REVIEW NEEDED'}</Pill>
         <IconButton icon="more-horizontal" label={t('More case options')} onPress={() => Alert.alert(t('Case options', 'Case options'), t('Audit history and authorized sharing controls are available here.', 'Audit history and authorized sharing controls are available here.'))} />
      </View>
      <View style={styles.patientHeader}>
        <View style={[styles.patientAvatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.patientAvatarText, { color: colors.primary }]}>RK</Text>
        </View>
        <View style={styles.patientIdentity}>
          <Text style={[styles.casePatientName, { color: colors.foreground }]}>Rahul Kumar</Text>
          <Text style={[styles.casePatientMeta, { color: colors.mutedForeground }]}>42 years · Male · Token 104</Text>
          <Text style={[styles.casePatientMeta, { color: colors.mutedForeground }]}>Case ID CP-2026-104</Text>
        </View>
        <Pill tone="danger">HIGH</Pill>
      </View>
      <View style={[styles.alertBanner, { backgroundColor: `${colors.destructive}12`, borderColor: `${colors.destructive}35` }]}>
        <Feather name="alert-triangle" size={20} color={colors.destructive} />
        <View style={styles.infoCopy}>
           <Text style={[styles.alertTitle, { color: colors.destructive }]}>{t('Potential red flag detected')}</Text>
           <Text style={[styles.alertText, { color: colors.foreground }]}>{t('Breathing difficulty was reported. Requires prompt clinical evaluation.', 'Breathing difficulty was reported. Requires prompt clinical evaluation.')}</Text>
           <Text style={[styles.alertHint, { color: colors.mutedForeground }]}>{t('Rule: symptom combination · Not a diagnosis', 'Rule: symptom combination · Not a diagnosis')}</Text>
        </View>
      </View>
      <View style={styles.caseSection}>
        <View style={styles.caseSectionHeader}>
           <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{t('AI case summary')}</Text>
           <Pill tone="warning">{t('VERIFY')}</Pill>
        </View>
        <View style={[styles.summaryPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryPanelText, { color: colors.foreground }]}>42-year-old male reporting fever for 3 days with cough and chills. History of diabetes reported. Currently reports metformin use.</Text>
          <View style={styles.sourceTag}>
            <Feather name="cpu" size={13} color={colors.primary} />
            <Text style={[styles.sourceTagText, { color: colors.primary }]}>Organized from patient answers and document text</Text>
          </View>
        </View>
      </View>
      <View style={styles.caseSection}>
        <View style={styles.caseSectionHeader}>
           <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{t('Clinical history')}</Text>
           <Pressable onPress={() => Alert.alert(t('Edit history', 'Edit history'), t('Edit mode is ready for the next review pass.', 'Edit mode is ready for the next review pass.'))}><Text style={[styles.textAction, { color: colors.primary }]}>{t('Edit')}</Text></Pressable>
        </View>
        <View style={[styles.detailGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ReviewLine label="Chief complaint" value="Fever" />
          <ReviewLine label="Duration" value="3 days" />
          <ReviewLine label="Associated symptoms" value="Cough · Chills" />
          <ReviewLine label="Past history" value="Diabetes reported" />
          <ReviewLine label="Medication" value="Metformin 500 mg" last />
        </View>
      </View>
      <View style={styles.caseSection}>
        <View style={styles.caseSectionHeader}>
           <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{t('Medical timeline')}</Text>
          <Feather name="clock" size={17} color={colors.mutedForeground} />
        </View>
        <View style={[styles.timeline, { borderColor: colors.border }]}>
          {timeline.map(([date, title, source], index) => (
            <View style={styles.timelineRow} key={date}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: index === timeline.length - 1 ? colors.accentForeground : colors.primary }]} />
                {index < timeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
              </View>
              <View style={styles.timelineCopy}>
                <Text style={[styles.timelineDate, { color: colors.primary }]}>{date}</Text>
                <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{title}</Text>
                <Text style={[styles.timelineSource, { color: colors.mutedForeground }]}>{source}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.caseSection}>
        <View style={styles.caseSectionHeader}>
           <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{t('Documents & extraction')}</Text>
           <Pill tone="success">{t('1 READY', '1 READY')}</Pill>
        </View>
        <View style={[styles.documentRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.documentIcon, { backgroundColor: colors.accent }]}><Feather name="file-text" size={19} color={colors.accentForeground} /></View>
          <View style={styles.infoCopy}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Previous prescription.pdf</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>OCR complete · 3 fields extracted</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
        <View style={[styles.extractionRow, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.extractionLabel, { color: colors.mutedForeground }]}>EXTRACTED</Text>
          <Text style={[styles.extractionValue, { color: colors.foreground }]}>Hb 9.2 g/dL · BP 150/95 · Metformin 500 mg</Text>
          <Text style={[styles.extractionSource, { color: colors.primary }]}>Source: Previous prescription.pdf · confidence 94%</Text>
        </View>
      </View>
      <View style={styles.caseSection}>
         <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{t('Doctor notes')}</Text>
        <TextInput
          accessibilityLabel="Doctor notes"
          value={note}
          onChangeText={setNote}
          placeholder="Add a note for the clinical record"
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground }]}
        />
      </View>
      <View style={styles.caseActions}>
         <PrimaryButton label={verified ? t('Information verified') : t('Verify information')} icon={verified ? 'check-circle' : 'check'} onPress={() => setVerified(true)} secondary={verified} />
         <PrimaryButton label={finalized ? t('Case finalized') : t('Finalize clinical case')} icon="arrow-up-right" onPress={() => {
          if (!verified) {
            Alert.alert('Verification required', 'Please verify the patient information before finalizing the case.');
            return;
          }
          setFinalized(true);
        }} disabled={finalized} />
      </View>
    </ScrollView>
  );
}

function AdminDashboard() {
  const colors = useColors();
  const { t } = useI18n();
  const modules = [
    ['users', 'User access', '12 active clinicians', true],
    ['list', 'Question templates', '24 questions · 3 languages', true],
    ['globe', 'Languages', 'English · Hindi · Kannada', true],
    ['alert-triangle', 'Red-flag rules', '6 configured rules', true],
    ['briefcase', 'Departments', 'OPD · General Medicine', true],
    ['activity', 'Audit logs', 'Last event 2 min ago', true],
  ] as const;
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
       <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('ADMIN CONSOLE · OVERVIEW')}</Text>
       <Text style={[styles.dashboardTitle, { color: colors.foreground }]}>{t('System, at a glance.')}</Text>
       <Text style={[styles.pageDescription, { color: colors.mutedForeground }]}>{t('Keep the care experience safe, current, and accountable.')}</Text>
      <View style={[styles.adminInsight, { backgroundColor: colors.foreground }]}>
        <View>
          <Text style={[styles.adminInsightLabel, { color: `${colors.card}99` }]}>CASES COMPLETED TODAY</Text>
          <Text style={[styles.adminInsightValue, { color: colors.card }]}>08</Text>
        </View>
        <View style={[styles.adminBars, { borderColor: `${colors.card}30` }]}>
          {[28, 40, 32, 54, 44, 68, 58].map((height, index) => <View key={index} style={[styles.adminBar, { height, backgroundColor: index === 6 ? colors.accent : `${colors.card}55` }]} />)}
        </View>
      </View>
       <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{t('Manage workspace')}</Text>
      <View style={styles.adminGrid}>
        {modules.map(([icon, title, text]) => (
          <Pressable key={title} onPress={() => Alert.alert(title, 'This workspace module is available to authorized administrators.')} style={({ pressed }) => [styles.adminCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}>
            <View style={[styles.adminIcon, { backgroundColor: colors.secondary }]}><Feather name={icon as keyof typeof Feather.glyphMap} size={18} color={colors.primary} /></View>
             <Text style={[styles.adminCardTitle, { color: colors.foreground }]}>{t(title, title)}</Text>
            <Text style={[styles.adminCardText, { color: colors.mutedForeground }]}>{text}</Text>
            <Feather name="arrow-up-right" size={16} color={colors.mutedForeground} style={styles.adminArrow} />
          </Pressable>
        ))}
      </View>
      <View style={[styles.disclaimer, { backgroundColor: colors.secondary }]}>
        <Feather name="shield" size={15} color={colors.primary} />
         <Text style={[styles.disclaimerText, { color: colors.secondaryForeground }]}>{t('All configuration changes are recorded in the audit log.')}</Text>
      </View>
    </ScrollView>
  );
}

function HealthWorkerDashboard({ onStart }: { onStart: () => void }) {
  const colors = useColors();
  const { t } = useI18n();
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
       <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('ASSISTED INTAKE · FRONT DESK')}</Text>
       <Text style={[styles.dashboardTitle, { color: colors.foreground }]}>{t('Make every patient feel heard.')}</Text>
       <Text style={[styles.pageDescription, { color: colors.mutedForeground }]}>{t('Register a patient, help with language or voice input, and keep their case moving.')}</Text>
      <View style={[styles.workerHero, { backgroundColor: colors.secondary }]}>
        <View style={[styles.workerHeroIcon, { backgroundColor: colors.card }]}>
          <Feather name="users" size={23} color={colors.primary} />
        </View>
        <Text style={[styles.workerHeroTitle, { color: colors.foreground }]}>3 patients assigned to you</Text>
        <Text style={[styles.workerHeroText, { color: colors.mutedForeground }]}>One patient is ready for assisted case-taking.</Text>
      </View>
      <View style={styles.workerQueue}>
        {[
          ['Priya Menon', 'New registration · Kannada preferred', 'NEW'],
          ['Vikram Das', 'Document upload support', 'DOCUMENT'],
        ].map(([name, detail, tag]) => (
          <View style={[styles.workerRow, { backgroundColor: colors.card, borderColor: colors.border }]} key={name}>
            <View style={[styles.workerAvatar, { backgroundColor: colors.accent }]}>
              <Text style={[styles.workerAvatarText, { color: colors.accentForeground }]}>{name.split(' ').map((part) => part[0]).join('')}</Text>
            </View>
            <View style={styles.infoCopy}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>{name}</Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{detail}</Text>
            </View>
            <Pill tone="teal">{tag}</Pill>
          </View>
        ))}
      </View>
       <PrimaryButton label={t('Start assisted intake')} icon="user-plus" onPress={onStart} />
       <InfoCard icon="shield" title={t('Patient consent still comes first')} text={t('The patient sees and confirms consent before any sensitive health information is collected.')} />
    </ScrollView>
  );
}

const roleOptions: Array<{
  key: Role;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
  idLabel: string;
  idPlaceholder: string;
}> = [
  {
    key: 'patient',
    label: 'Patient',
    icon: 'user',
    description: 'Prepare your story before meeting the care team',
    idLabel: 'Mobile number or ABHA ID',
    idPlaceholder: '+91 00000 00000',
  },
  {
    key: 'healthWorker',
    label: 'Health worker',
    icon: 'users',
    description: 'Support registration and assisted case-taking',
    idLabel: 'Health worker ID',
    idPlaceholder: 'e.g. HW-1042',
  },
  {
    key: 'clinician',
    label: 'Clinician',
    icon: 'activity',
    description: 'Review the queue and verify patient case sheets',
    idLabel: 'Medical registration ID',
    idPlaceholder: 'e.g. MMC-20481',
  },
  {
    key: 'admin',
    label: 'Administrator',
    icon: 'shield',
    description: 'Manage the workspace, rules, and audit activity',
    idLabel: 'Administrator email',
    idPlaceholder: 'admin@carepath.example',
  },
];

function RoleLogin({
  role,
  onRoleChange,
  onLogin,
}: {
  role: Role;
  onRoleChange: (role: Role) => void;
  onLogin: () => void;
}) {
  const colors = useColors();
  const { t } = useI18n();
  const selectedRole = roleOptions.find((option) => option.key === role) || roleOptions[0];
  const roleLabel = t(`role.${selectedRole.key}.label`, selectedRole.label);
  const roleDescription = t(`role.${selectedRole.key}.description`, selectedRole.description);
  const roleIdLabel = t(`role.${selectedRole.key}.idLabel`, selectedRole.idLabel);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setIdentifier('');
    setPassword('');
    setError('');
  }, [role]);

  const submit = () => {
    Keyboard.dismiss();
    if (!identifier.trim() || !password.trim()) {
      setError(`${t('Enter your', 'Enter your')} ${roleIdLabel.toLowerCase()} ${t('and password to continue', 'and password to continue')}`);
      return;
    }
    onLogin();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.loginContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.loginIntro}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('Secure care access').toUpperCase()}</Text>
        <Text style={[styles.loginTitle, { color: colors.foreground }]}>{t('Sign in to CarePath')}</Text>
        <Text style={[styles.pageDescription, { color: colors.mutedForeground }]}>
          {t('Choose your role to open the right workspace and sign-in experience')}
        </Text>
      </View>

      <View style={styles.roleLoginGrid}>
        {roleOptions.map((option) => {
          const selected = option.key === role;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onRoleChange(option.key)}
              style={[
                styles.roleLoginCard,
                {
                  backgroundColor: selected ? colors.secondary : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.roleLoginIcon, { backgroundColor: selected ? colors.primary : colors.muted }]}>
                <Feather name={option.icon} size={17} color={selected ? colors.primaryForeground : colors.primary} />
              </View>
              <Text style={[styles.roleLoginLabel, { color: colors.foreground }]}>{t(`role.${option.key}.label`, option.label)}</Text>
              <Text style={[styles.roleLoginHint, { color: colors.mutedForeground }]} numberOfLines={2}>{t(`role.${option.key}.description`, option.description)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.loginPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.loginPanelHeader}>
          <View style={[styles.loginPanelIcon, { backgroundColor: colors.accent }]}>
            <Feather name={selectedRole.icon} size={19} color={colors.accentForeground} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={[styles.loginPanelTitle, { color: colors.foreground }]}>{roleLabel} {t('sign in', 'sign in')}</Text>
            <Text style={[styles.loginPanelText, { color: colors.mutedForeground }]}>{roleDescription}</Text>
          </View>
        </View>

        <Field
          label={roleIdLabel}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={selectedRole.idPlaceholder}
          keyboardType={role === 'patient' ? 'phone-pad' : 'default'}
        />
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('Password or PIN')}</Text>
          <TextInput
            accessibilityLabel="Password or PIN"
            value={password}
            onChangeText={setPassword}
            placeholder={t('Enter your password')}
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground }]}
          />
        </View>
        {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
        <PrimaryButton label={`${t('Sign in as', 'Sign in as')} ${roleLabel}`} icon="arrow-right" onPress={submit} />
        <Text style={[styles.loginHint, { color: colors.mutedForeground }]}>{t('Preview mode: any non-empty credentials are accepted. Production authentication is not connected yet')}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => Alert.alert(t('Sign-in help'), t('Please contact your authorized CarePath workspace administrator.'))}
        style={styles.loginHelp}
      >
        <Feather name="help-circle" size={16} color={colors.primary} />
        <Text style={[styles.loginHelpText, { color: colors.primary }]}>{t('Need help signing in?')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function LanguagePicker({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const colors = useColors();
  const { language, setLanguage } = useI18n();
  return (
    <View style={styles.languagePickerWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose language"
        onPress={onToggle}
        style={[styles.languageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name="globe" size={16} color={colors.primary} />
        <Text style={[styles.languageButtonText, { color: colors.foreground }]}>
          {languageOptions.find((option) => option.key === language)?.nativeLabel}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedForeground} />
      </Pressable>
      {open && (
        <View style={[styles.languageMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {languageOptions.map((option) => (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: language === option.key }}
              onPress={() => {
                setLanguage(option.key);
                onToggle();
              }}
              style={[
                styles.languageOption,
                { backgroundColor: language === option.key ? colors.secondary : colors.card },
              ]}
            >
              <Text style={[styles.languageOptionNative, { color: colors.foreground }]}>{option.nativeLabel}</Text>
              <Text style={[styles.languageOptionEnglish, { color: colors.mutedForeground }]}>{option.label}</Text>
              {language === option.key && <Feather name="check" size={15} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function CarePathScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const [role, setRole] = useState<Role>('patient');
  const [stage, setStage] = useState<Stage>('login');
  const [authenticated, setAuthenticated] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const compact = width < 375;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<Draft>;
          setDraft({ ...emptyDraft, ...parsed });
        }
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft)).catch(() => undefined);
    }
  }, [draft, hydrated]);

  const headerLabel = useMemo(() => {
    if (!authenticated) return t('Secure sign in');
    if (role === 'patient') return stage === 'welcome' ? t('Welcome') : stage === 'submitted' ? t('Case submitted') : t('Patient intake');
    if (role === 'healthWorker') return stage === 'welcome' ? t('Assisted intake') : t('Patient intake');
    if (role === 'clinician') return stage === 'case' ? t('Patient case') : t('Care queue');
    return t('Admin workspace');
  }, [role, stage, t]);

  const switchRole = (nextRole: Role) => {
    haptic();
    setRole(nextRole);
    setAuthenticated(false);
    setStage('login');
  };

  const logout = () => {
    haptic();
    setAuthenticated(false);
    setStage('login');
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingScreen}><ActivityIndicator color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.appHeader}>
        <Logo compact={authenticated && (stage !== 'welcome' || role !== 'patient')} />
        <View style={styles.headerRight}>
          <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>{headerLabel}</Text>
          <IconButton icon="sun" label="Appearance settings" onPress={() => Alert.alert('Appearance', 'CarePath follows your device light or dark mode.')} />
          {authenticated && <IconButton icon="log-out" label="Sign out" onPress={logout} />}
        </View>
      </View>
      <View style={styles.languageBar}>
        <LanguagePicker open={languageOpen} onToggle={() => setLanguageOpen((current) => !current)} />
      </View>
      <View style={styles.content}>
        {!authenticated && <RoleLogin role={role} onRoleChange={switchRole} onLogin={() => { setAuthenticated(true); setStage('welcome'); }} />}
        {authenticated && role === 'patient' && <PatientFlow draft={draft} setDraft={setDraft} stage={stage} setStage={setStage} />}
        {authenticated && role === 'healthWorker' && (stage === 'welcome' ? <HealthWorkerDashboard onStart={() => setStage('consent')} /> : <PatientFlow draft={draft} setDraft={setDraft} stage={stage} setStage={setStage} />)}
        {authenticated && role === 'clinician' && (stage === 'case' ? <DoctorCase onBack={() => setStage('welcome')} /> : <ClinicianDashboard onOpenCase={() => setStage('case')} />)}
        {authenticated && role === 'admin' && <AdminDashboard />}
      </View>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return (
    <I18nProvider>
      <CarePathScreen />
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appHeader: { minHeight: 67, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageBar: { paddingHorizontal: 20, alignItems: 'flex-end', zIndex: 10 },
  languagePickerWrap: { position: 'relative', alignItems: 'flex-end' },
  languageButton: { minHeight: 34, borderRadius: 11, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  languageButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  languageMenu: { position: 'absolute', top: 40, right: 0, width: 166, borderRadius: 13, borderWidth: 1, padding: 5, zIndex: 20, shadowColor: '#0B3158', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  languageOption: { minHeight: 38, borderRadius: 9, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  languageOptionNative: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  languageOptionEnglish: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 10 },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoMark: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  logoTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.5 },
  logoCaption: { fontFamily: 'Inter_500Medium', fontSize: 8, letterSpacing: 1.1, textTransform: 'uppercase', marginTop: -1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headerLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  iconButton: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  roleSwitcher: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 12, padding: 3, gap: 2 },
  roleTab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  roleTabText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  loginContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  loginIntro: { marginBottom: 22 },
  loginTitle: { fontFamily: 'Inter_700Bold', fontSize: 31, lineHeight: 37, letterSpacing: -1.1, marginTop: 3 },
  approachCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginTop: 18, marginBottom: 20 },
  approachIntro: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: -5, marginBottom: 12 },
  approachOptions: { gap: 9 },
  approachOption: { minHeight: 64, borderWidth: 1, borderRadius: 13, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  approachIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  approachTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 2 },
  approachText: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  roleLoginGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  roleLoginCard: { width: '48.5%', minHeight: 124, borderRadius: 17, borderWidth: 1, padding: 12 },
  roleLoginIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  roleLoginLabel: { fontFamily: 'Inter_700Bold', fontSize: 13, marginBottom: 4 },
  roleLoginHint: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  loginPanel: { borderWidth: 1, borderRadius: 19, padding: 16 },
  loginPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 20 },
  loginPanelIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  loginPanelTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 3 },
  loginPanelText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  loginHint: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 13 },
  loginHelp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 18 },
  loginHelpText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 },
  heroKicker: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, marginBottom: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  heroKickerText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.25 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 35, lineHeight: 41, letterSpacing: -1.6, marginBottom: 13 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23, maxWidth: 355, marginBottom: 24 },
  heroIllustration: { height: 190, borderRadius: 25, overflow: 'hidden', justifyContent: 'flex-end', padding: 19, marginBottom: 28 },
  heroCircleOne: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -62, top: -105 },
  heroCircleTwo: { position: 'absolute', width: 130, height: 130, borderRadius: 65, left: -35, bottom: -70 },
  heroNote: { flexDirection: 'row', gap: 8, alignItems: 'center', zIndex: 1 },
  heroNoteText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  heroPath: { position: 'absolute', right: 30, top: 38, alignItems: 'center' },
  pathNode: { width: 20, height: 20, borderRadius: 10 },
  pathLine: { width: 2, height: 28 },
  valueList: { gap: 18 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  valueIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  valueCopy: { flex: 1 },
  valueTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 3 },
  valueText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  footer: { paddingTop: 26, gap: 11 },
  footerHint: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, paddingHorizontal: 12 },
  primaryButton: { minHeight: 54, borderRadius: 15, borderWidth: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  progressWrap: { marginTop: 6, marginBottom: 28 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  progressLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  progressCount: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  sectionTitle: { marginBottom: 23 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.15, marginBottom: 8 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 27, lineHeight: 32, letterSpacing: -0.8 },
  pageDescription: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 8 },
  consentCard: { borderRadius: 19, borderWidth: 1, padding: 18, marginBottom: 15 },
  consentSeal: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  consentHeading: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 17 },
  consentRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  consentBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  consentRowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 3 },
  consentRowText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  choice: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 7, height: 7, borderRadius: 4 },
  choiceText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19 },
  infoCard: { borderRadius: 15, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 11, marginTop: 13 },
  infoIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1 },
  infoTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 3 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  field: { marginBottom: 16 },
  fieldRow: { flexDirection: 'row', gap: 11 },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 7 },
  input: { height: 49, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontFamily: 'Inter_400Regular', fontSize: 14 },
  choiceRow: { flexDirection: 'row', gap: 5 },
  smallChoice: { flex: 1, minHeight: 49, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  smallChoiceText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 3 },
  complaintGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  complaintOption: { width: '48%', minHeight: 88, borderRadius: 16, borderWidth: 1, padding: 13, justifyContent: 'space-between' },
  complaintText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  voiceCard: { borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  voiceIcon: { width: 41, height: 41, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  voiceCopy: { flex: 1 },
  voiceTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 3 },
  voiceText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  micButton: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  transcription: { borderWidth: 1, borderRadius: 15, marginTop: 12, padding: 14 },
  transcriptionLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1, marginBottom: 6 },
  transcriptionText: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 },
  transcriptionHint: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 8 },
  questionLabel: { fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 20, marginBottom: 12, marginTop: 2 },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 27 },
  durationChip: { borderWidth: 1, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14 },
  durationText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  choiceRowWide: { flexDirection: 'row', gap: 9, marginBottom: 24 },
  historyDetail: { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -13, marginBottom: 23 },
  historyDetailText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  textArea: { minHeight: 88, borderRadius: 13, borderWidth: 1, padding: 13, textAlignVertical: 'top', fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 18 },
  ayurvedaCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 16 },
  ayurvedaHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 },
  ayurvedaNote: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginBottom: 14 },
  moduleRow: { borderWidth: 1, borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  moduleIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  uploadBox: { minHeight: 190, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 19, alignItems: 'center', justifyContent: 'center', padding: 20, marginBottom: 13 },
  uploadIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  uploadTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 4 },
  uploadText: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 11 },
  pill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, alignSelf: 'flex-start' },
  pillText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.55 },
  documentRow: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  documentIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryHero: { borderRadius: 19, padding: 17, marginBottom: 12 },
  summaryHeroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.05, marginBottom: 10 },
  summaryHeroText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 23 },
  summarySource: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 15 },
  summarySourceText: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  reviewCard: { borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, marginTop: 14 },
  reviewLine: { paddingVertical: 13, gap: 3 },
  reviewLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  reviewValue: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 },
  aiBoundary: { borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 13 },
  aiBoundaryText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  submittedMark: { width: 65, height: 65, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 25, marginBottom: 20 },
  submittedTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.8, maxWidth: 290 },
  submittedBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, marginTop: 10, maxWidth: 350 },
  tokenCard: { borderWidth: 1, borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center', marginTop: 25 },
  tokenLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1 },
  tokenNumber: { fontFamily: 'Inter_700Bold', fontSize: 35, letterSpacing: -1 },
  tokenDivider: { width: 1, height: 45, marginHorizontal: 21 },
  tokenStatus: { gap: 7, flex: 1 },
  tokenHint: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  submittedActions: { gap: 10, marginTop: 26 },
  dashboardGreeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10, marginBottom: 22 },
  dashboardTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.6, marginTop: 2 },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  metricGrid: { flexDirection: 'row', gap: 9, marginBottom: 29 },
  metricCard: { flex: 1, minHeight: 99, borderRadius: 16, borderWidth: 1, padding: 12, justifyContent: 'space-between' },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.6 },
  metricLabel: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeading: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.2 },
  sectionSubheading: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  searchButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  filterRow: { gap: 7, paddingVertical: 15 },
  filterChip: { borderWidth: 1, borderRadius: 19, paddingVertical: 8, paddingHorizontal: 13 },
  filterText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  queueList: { gap: 9 },
  queueCard: { borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  queueToken: { width: 53, height: 58, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  queueTokenLabel: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.7 },
  queueTokenNumber: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5, marginTop: 1 },
  queueCopy: { flex: 1 },
  queueNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  queueName: { fontFamily: 'Inter_700Bold', fontSize: 13, flexShrink: 1 },
  queueDetail: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  queueTime: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 5 },
  disclaimer: { borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  disclaimerText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  caseTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  patientHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 20 },
  patientAvatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  patientIdentity: { flex: 1 },
  casePatientName: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.4, marginBottom: 3 },
  casePatientMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 2 },
  alertBanner: { borderWidth: 1, borderRadius: 17, padding: 14, flexDirection: 'row', gap: 10, marginBottom: 25 },
  alertTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, marginBottom: 4 },
  alertText: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  alertHint: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 7 },
  caseSection: { marginBottom: 26 },
  caseSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  textAction: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  summaryPanel: { borderWidth: 1, borderRadius: 16, padding: 15 },
  summaryPanelText: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 21 },
  sourceTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13 },
  sourceTagText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  detailGrid: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  timeline: { borderLeftWidth: 0, paddingLeft: 3 },
  timelineRow: { flexDirection: 'row', minHeight: 72 },
  timelineRail: { width: 23, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { width: 1, flex: 1, marginTop: 4 },
  timelineCopy: { flex: 1, paddingLeft: 10 },
  timelineDate: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4 },
  timelineTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 3 },
  timelineSource: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  extractionRow: { borderRadius: 13, padding: 13, marginTop: 9 },
  extractionLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1, marginBottom: 5 },
  extractionValue: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  extractionSource: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 7 },
  caseActions: { gap: 10, paddingBottom: 16 },
  adminInsight: { borderRadius: 19, minHeight: 135, padding: 17, marginTop: 23, marginBottom: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adminInsightLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  adminInsightValue: { fontFamily: 'Inter_700Bold', fontSize: 45, letterSpacing: -2, marginTop: 5 },
  adminBars: { height: 82, width: 135, borderBottomWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingHorizontal: 5 },
  adminBar: { flex: 1, borderRadius: 4 },
  adminGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  adminCard: { width: '48.5%', minHeight: 137, borderWidth: 1, borderRadius: 16, padding: 13, position: 'relative' },
  adminIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  adminCardTitle: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  adminCardText: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 4, paddingRight: 8 },
  adminArrow: { position: 'absolute', right: 12, bottom: 12 },
  workerHero: { borderRadius: 19, padding: 17, marginTop: 23, marginBottom: 18 },
  workerHeroIcon: { width: 47, height: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  workerHeroTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, marginBottom: 4 },
  workerHeroText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  workerQueue: { gap: 9, marginBottom: 18 },
  workerRow: { borderWidth: 1, borderRadius: 15, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  workerAvatar: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  workerAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
});