/**
 * LocationPicker Component
 * Professional State → City dropdown for Nigerian locations
 * With ability to add custom locations
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  X,
  MapPin,
  Search,
  Check,
  Plus,
} from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  NIGERIAN_STATES,
  NIGERIAN_CITIES,
  NigerianState,
  getCitiesForState,
} from '@/lib/nigerianData';
import { cn } from '@/lib/cn';

interface LocationPickerProps {
  state: string | null;
  city: string | null;
  onStateChange: (state: string | null) => void;
  onCityChange: (city: string | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  allowCustom?: boolean;
  required?: boolean;
}

type PickerMode = 'state' | 'city';

export const LocationPicker: React.FC<LocationPickerProps> = ({
  state,
  city,
  onStateChange,
  onCityChange,
  placeholder = 'Select location',
  label,
  error,
  allowCustom = true,
  required = false,
}) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>('state');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Get display value
  const displayValue = useMemo(() => {
    if (city && state) {
      return `${city}, ${state}`;
    }
    if (state) {
      return state;
    }
    return '';
  }, [state, city]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (pickerMode === 'state') {
      if (!query) return [...NIGERIAN_STATES];
      return NIGERIAN_STATES.filter(s => s.toLowerCase().includes(query));
    } else {
      const cities = state ? getCitiesForState(state as NigerianState) : [];
      if (!query) return cities;
      return cities.filter(c => c.toLowerCase().includes(query));
    }
  }, [pickerMode, searchQuery, state]);

  const openPicker = (mode: PickerMode) => {
    setPickerMode(mode);
    setSearchQuery('');
    setShowAddCustom(false);
    setCustomValue('');
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectItem = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (pickerMode === 'state') {
      onStateChange(item);
      onCityChange(null); // Reset city when state changes
      setModalVisible(false);
      // Auto-open city picker after selecting state
      setTimeout(() => openPicker('city'), 300);
    } else {
      onCityChange(item);
      setModalVisible(false);
    }
  };

  const addCustomItem = () => {
    if (!customValue.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (pickerMode === 'state') {
      onStateChange(customValue.trim());
      onCityChange(null);
      setModalVisible(false);
      setTimeout(() => openPicker('city'), 300);
    } else {
      onCityChange(customValue.trim());
      setModalVisible(false);
    }

    setCustomValue('');
    setShowAddCustom(false);
  };

  const clearSelection = () => {
    onStateChange(null);
    onCityChange(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View>
      {label && (
        <Text className="text-gray-700 font-medium mb-1.5">
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      )}

      <View className="flex-row gap-2">
        {/* State Selector */}
        <Pressable
          onPress={() => openPicker('state')}
          className={cn(
            "flex-1 flex-row items-center justify-between px-4 py-3.5 rounded-xl border",
            error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
          )}
        >
          <View className="flex-row items-center flex-1">
            <MapPin size={18} color={state ? "#059669" : "#9CA3AF"} />
            <Text
              className={cn(
                "ml-2 flex-1",
                state ? "text-gray-900" : "text-gray-400"
              )}
              numberOfLines={1}
            >
              {state || 'State'}
            </Text>
          </View>
          <ChevronDown size={18} color="#9CA3AF" />
        </Pressable>

        {/* City Selector */}
        <Pressable
          onPress={() => state ? openPicker('city') : openPicker('state')}
          className={cn(
            "flex-1 flex-row items-center justify-between px-4 py-3.5 rounded-xl border",
            !state && "opacity-50",
            error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
          )}
        >
          <Text
            className={cn(
              "flex-1",
              city ? "text-gray-900" : "text-gray-400"
            )}
            numberOfLines={1}
          >
            {city || 'City/Area'}
          </Text>
          <ChevronDown size={18} color="#9CA3AF" />
        </Pressable>

        {/* Clear Button */}
        {(state || city) && (
          <Pressable
            onPress={clearSelection}
            className="w-11 h-11 items-center justify-center rounded-xl bg-gray-100"
          >
            <X size={18} color="#6B7280" />
          </Pressable>
        )}
      </View>

      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}

      {/* Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => setModalVisible(false)}
          />

          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            className="bg-white rounded-t-3xl"
            style={{ maxHeight: '80%', paddingBottom: insets.bottom }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">
                {pickerMode === 'state' ? 'Select State' : `Select City in ${state}`}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
              >
                <X size={18} color="#374151" />
              </Pressable>
            </View>

            {/* Search */}
            <View className="px-5 py-3">
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                <Search size={18} color="#9CA3AF" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={`Search ${pickerMode === 'state' ? 'state' : 'city'}...`}
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-gray-900"
                  autoCapitalize="words"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={16} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Items List */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredItems.map((item, index) => {
                const isSelected = pickerMode === 'state'
                  ? item === state
                  : item === city;

                return (
                  <Pressable
                    key={item}
                    onPress={() => selectItem(item)}
                    className={cn(
                      "flex-row items-center justify-between px-5 py-4 border-b border-gray-50",
                      isSelected && "bg-emerald-50"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-base",
                        isSelected ? "text-emerald-600 font-semibold" : "text-gray-900"
                      )}
                    >
                      {item}
                    </Text>
                    {isSelected && <Check size={20} color="#059669" />}
                  </Pressable>
                );
              })}

              {filteredItems.length === 0 && (
                <View className="py-8 items-center">
                  <Text className="text-gray-500">No results found</Text>
                </View>
              )}

              {/* Add Custom Option */}
              {allowCustom && (
                <View className="px-5 py-4 border-t border-gray-100">
                  {!showAddCustom ? (
                    <Pressable
                      onPress={() => setShowAddCustom(true)}
                      className="flex-row items-center"
                    >
                      <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center mr-3">
                        <Plus size={18} color="#059669" />
                      </View>
                      <Text className="text-emerald-600 font-medium">
                        Add custom {pickerMode === 'state' ? 'state' : 'city/area'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Animated.View entering={FadeIn}>
                      <Text className="text-gray-600 text-sm mb-2">
                        Enter custom {pickerMode === 'state' ? 'state' : 'city/area'}:
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          value={customValue}
                          onChangeText={setCustomValue}
                          placeholder={`E.g., ${pickerMode === 'state' ? 'Lagos' : 'Ikeja'}`}
                          placeholderTextColor="#9CA3AF"
                          className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                          autoCapitalize="words"
                          autoFocus
                        />
                        <Pressable
                          onPress={addCustomItem}
                          disabled={!customValue.trim()}
                          className={cn(
                            "px-4 py-3 rounded-xl",
                            customValue.trim()
                              ? "bg-emerald-500"
                              : "bg-gray-200"
                          )}
                        >
                          <Text
                            className={cn(
                              "font-semibold",
                              customValue.trim() ? "text-white" : "text-gray-400"
                            )}
                          >
                            Add
                          </Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  )}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default LocationPicker;
