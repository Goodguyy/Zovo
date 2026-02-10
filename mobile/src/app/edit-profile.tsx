import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';
import { LocationPicker } from '@/components/LocationPicker';
import { SkillsPicker } from '@/components/SkillsPicker';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAppStore((s) => s.currentUser);
  const login = useAppStore((s) => s.login);

  const [name, setName] = useState(currentUser?.name || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentUser?.skills || []);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Parse current area into state and city
  React.useEffect(() => {
    if (currentUser?.area) {
      const parts = currentUser.area.split(', ');
      if (parts.length === 2) {
        setSelectedCity(parts[0]);
        setSelectedState(parts[1]);
      } else {
        setSelectedState(currentUser.area);
      }
    }
  }, [currentUser?.area]);

  const selectedArea = selectedCity && selectedState
    ? `${selectedCity}, ${selectedState}`
    : selectedCity || selectedState || '';

  const handleSave = async () => {
    if (!currentUser?.id) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (selectedSkills.length === 0) {
      Alert.alert('Error', 'Please select at least one skill');
      return;
    }

    if (!selectedArea) {
      Alert.alert('Error', 'Please select your service area');
      return;
    }

    setIsSaving(true);

    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase not configured');
      }

      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          whatsapp: whatsapp.trim() || currentUser.phone,
          skills: selectedSkills,
          area: selectedArea,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update local state
      login({
        ...currentUser,
        name: name.trim(),
        whatsapp: whatsapp.trim() || currentUser.phone,
        skills: selectedSkills,
        area: selectedArea,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.log('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    name !== currentUser?.name ||
    whatsapp !== currentUser?.whatsapp ||
    JSON.stringify(selectedSkills) !== JSON.stringify(currentUser?.skills) ||
    selectedArea !== currentUser?.area;

  if (!currentUser) {
    router.back();
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <LinearGradient
          colors={['#059669', '#047857']}
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 16,
            paddingHorizontal: 16,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              >
                <ArrowLeft size={22} color="#fff" />
              </Pressable>
              <Text className="text-white text-xl font-bold ml-4">Edit Profile</Text>
            </View>
            <Pressable
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-4 py-2 rounded-full flex-row items-center ${
                hasChanges && !isSaving ? 'bg-white' : 'bg-white/30'
              }`}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <>
                  <Check size={18} color={hasChanges ? '#059669' : '#fff'} />
                  <Text
                    className={`ml-1.5 font-semibold ${
                      hasChanges ? 'text-emerald-600' : 'text-white/70'
                    }`}
                  >
                    Save
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Animated.View entering={FadeInDown.delay(0)} className="mb-4">
            <Text className="text-gray-900 font-semibold mb-2">
              Display Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              className="bg-white rounded-xl px-4 py-3.5 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </Animated.View>

          {/* WhatsApp */}
          <Animated.View entering={FadeInDown.delay(50)} className="mb-4">
            <Text className="text-gray-900 font-semibold mb-2">
              WhatsApp Number
            </Text>
            <TextInput
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder={currentUser.phone}
              keyboardType="phone-pad"
              className="bg-white rounded-xl px-4 py-3.5 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
            <Text className="text-gray-400 text-xs mt-1">
              Customers will contact you on this number
            </Text>
          </Animated.View>

          {/* Skills */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-4">
            <SkillsPicker
              selectedSkills={selectedSkills}
              onSkillsChange={setSelectedSkills}
              label="Skills"
              required
              maxSkills={5}
              allowCustom
            />
          </Animated.View>

          {/* Location */}
          <Animated.View entering={FadeInDown.delay(150)} className="mb-4">
            <LocationPicker
              state={selectedState}
              city={selectedCity}
              onStateChange={setSelectedState}
              onCityChange={setSelectedCity}
              label="Service Area"
              required
              allowCustom
            />
          </Animated.View>

          {/* Info */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="bg-blue-50 rounded-xl p-4 mt-2"
          >
            <Text className="text-blue-800 font-semibold text-sm mb-1">
              Profile Tips
            </Text>
            <Text className="text-blue-700 text-xs leading-5">
              • Use your real name for trust{'\n'}
              • Add all skills you offer{'\n'}
              • Pick the area where you work most{'\n'}
              • Keep your WhatsApp number updated
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}
