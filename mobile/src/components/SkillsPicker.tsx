/**
 * SkillsPicker Component
 * Professional searchable, categorized skills dropdown for Nigerian hustles
 * With ability to add custom skills
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
  Briefcase,
  Search,
  Check,
  Plus,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  SKILL_CATEGORIES,
  ALL_SKILLS,
  searchSkills,
  getSkillCategory,
} from '@/lib/nigerianData';
import { cn } from '@/lib/cn';

interface SkillsPickerProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  allowCustom?: boolean;
  required?: boolean;
  maxSkills?: number;
  singleSelect?: boolean; // For filter mode
}

type ViewMode = 'categories' | 'all' | 'search';

export const SkillsPicker: React.FC<SkillsPickerProps> = ({
  selectedSkills,
  onSkillsChange,
  placeholder = 'Select skills',
  label,
  error,
  allowCustom = true,
  required = false,
  maxSkills = 5,
  singleSelect = false,
}) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Get display value
  const displayValue = useMemo(() => {
    if (selectedSkills.length === 0) return '';
    if (selectedSkills.length === 1) return selectedSkills[0];
    return `${selectedSkills[0]} +${selectedSkills.length - 1} more`;
  }, [selectedSkills]);

  // Filter skills based on search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchSkills(searchQuery);
  }, [searchQuery]);

  const openPicker = () => {
    setSearchQuery('');
    setViewMode('categories');
    setExpandedCategory(null);
    setShowAddCustom(false);
    setCustomValue('');
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleSkill = (skill: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (singleSelect) {
      onSkillsChange([skill]);
      setModalVisible(false);
      return;
    }

    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter(s => s !== skill));
    } else {
      if (selectedSkills.length >= maxSkills) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (!customValue.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newSkill = customValue.trim();

    if (singleSelect) {
      onSkillsChange([newSkill]);
      setModalVisible(false);
    } else {
      if (!selectedSkills.includes(newSkill) && selectedSkills.length < maxSkills) {
        onSkillsChange([...selectedSkills, newSkill]);
      }
    }

    setCustomValue('');
    setShowAddCustom(false);
  };

  const removeSkill = (skill: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkillsChange(selectedSkills.filter(s => s !== skill));
  };

  const clearAll = () => {
    onSkillsChange([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleCategory = (categoryName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  const isSkillSelected = (skill: string) => selectedSkills.includes(skill);

  return (
    <View>
      {label && (
        <Text className="text-gray-700 font-medium mb-1.5">
          {label}
          {required && <Text className="text-red-500"> *</Text>}
          {!singleSelect && (
            <Text className="text-gray-400 font-normal"> (max {maxSkills})</Text>
          )}
        </Text>
      )}

      {/* Main Selector */}
      <Pressable
        onPress={openPicker}
        className={cn(
          "flex-row items-center justify-between px-4 py-3.5 rounded-xl border",
          error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
        )}
      >
        <View className="flex-row items-center flex-1">
          <Briefcase size={18} color={selectedSkills.length > 0 ? "#059669" : "#9CA3AF"} />
          <Text
            className={cn(
              "ml-2 flex-1",
              selectedSkills.length > 0 ? "text-gray-900" : "text-gray-400"
            )}
            numberOfLines={1}
          >
            {displayValue || placeholder}
          </Text>
        </View>
        <View className="flex-row items-center">
          {selectedSkills.length > 0 && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="mr-2"
            >
              <X size={16} color="#9CA3AF" />
            </Pressable>
          )}
          <ChevronDown size={18} color="#9CA3AF" />
        </View>
      </Pressable>

      {/* Selected Skills Tags */}
      {selectedSkills.length > 0 && !singleSelect && (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {selectedSkills.map(skill => (
            <Animated.View
              key={skill}
              entering={FadeIn}
              className="flex-row items-center bg-emerald-100 rounded-full px-3 py-1.5"
            >
              <Text className="text-emerald-700 text-sm font-medium mr-1">
                {skill}
              </Text>
              <Pressable onPress={() => removeSkill(skill)}>
                <X size={14} color="#047857" />
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}

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
            style={{ maxHeight: '85%', paddingBottom: insets.bottom }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <View>
                <Text className="text-lg font-bold text-gray-900">
                  {singleSelect ? 'Select Skill' : 'Select Skills'}
                </Text>
                {!singleSelect && (
                  <Text className="text-gray-500 text-sm">
                    {selectedSkills.length}/{maxSkills} selected
                  </Text>
                )}
              </View>
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
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setViewMode(text.trim() ? 'search' : 'categories');
                  }}
                  placeholder="Search skills/hustles..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-gray-900"
                  autoCapitalize="words"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setSearchQuery('');
                      setViewMode('categories');
                    }}
                  >
                    <X size={16} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* View Mode Tabs */}
            {!searchQuery && (
              <View className="flex-row px-5 mb-2">
                <Pressable
                  onPress={() => setViewMode('categories')}
                  className={cn(
                    "px-4 py-2 rounded-full mr-2",
                    viewMode === 'categories' ? "bg-emerald-500" : "bg-gray-100"
                  )}
                >
                  <Text
                    className={cn(
                      "font-medium",
                      viewMode === 'categories' ? "text-white" : "text-gray-600"
                    )}
                  >
                    By Category
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setViewMode('all')}
                  className={cn(
                    "px-4 py-2 rounded-full",
                    viewMode === 'all' ? "bg-emerald-500" : "bg-gray-100"
                  )}
                >
                  <Text
                    className={cn(
                      "font-medium",
                      viewMode === 'all' ? "text-white" : "text-gray-600"
                    )}
                  >
                    All Skills
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Content */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Search Results */}
              {viewMode === 'search' && (
                <>
                  {searchResults.length > 0 ? (
                    searchResults.map(skill => (
                      <SkillItem
                        key={skill}
                        skill={skill}
                        isSelected={isSkillSelected(skill)}
                        onPress={() => toggleSkill(skill)}
                        category={getSkillCategory(skill)}
                      />
                    ))
                  ) : (
                    <View className="py-8 items-center">
                      <Text className="text-gray-500">No skills found for "{searchQuery}"</Text>
                    </View>
                  )}
                </>
              )}

              {/* Categories View */}
              {viewMode === 'categories' && (
                <>
                  {SKILL_CATEGORIES.map(category => (
                    <View key={category.name}>
                      <Pressable
                        onPress={() => toggleCategory(category.name)}
                        className="flex-row items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100"
                      >
                        <View className="flex-row items-center">
                          <Text className="text-gray-900 font-semibold">
                            {category.name}
                          </Text>
                          <Text className="text-gray-400 text-sm ml-2">
                            ({category.skills.length})
                          </Text>
                        </View>
                        <ChevronRight
                          size={18}
                          color="#9CA3AF"
                          style={{
                            transform: [{
                              rotate: expandedCategory === category.name ? '90deg' : '0deg'
                            }]
                          }}
                        />
                      </Pressable>

                      {expandedCategory === category.name && (
                        <Animated.View entering={FadeIn}>
                          {category.skills.map(skill => (
                            <SkillItem
                              key={skill}
                              skill={skill}
                              isSelected={isSkillSelected(skill)}
                              onPress={() => toggleSkill(skill)}
                              indent
                            />
                          ))}
                        </Animated.View>
                      )}
                    </View>
                  ))}
                </>
              )}

              {/* All Skills View */}
              {viewMode === 'all' && (
                <>
                  {ALL_SKILLS.map(skill => (
                    <SkillItem
                      key={skill}
                      skill={skill}
                      isSelected={isSkillSelected(skill)}
                      onPress={() => toggleSkill(skill)}
                      category={getSkillCategory(skill)}
                    />
                  ))}
                </>
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
                        Add custom skill/hustle
                      </Text>
                    </Pressable>
                  ) : (
                    <Animated.View entering={FadeIn}>
                      <Text className="text-gray-600 text-sm mb-2">
                        Enter your skill/hustle:
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          value={customValue}
                          onChangeText={setCustomValue}
                          placeholder="E.g., Shoe Maker"
                          placeholderTextColor="#9CA3AF"
                          className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                          autoCapitalize="words"
                          autoFocus
                        />
                        <Pressable
                          onPress={addCustomSkill}
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

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Done Button */}
            {!singleSelect && selectedSkills.length > 0 && (
              <View className="px-5 py-4 border-t border-gray-100">
                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="bg-emerald-500 rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-bold text-base">
                    Done ({selectedSkills.length} selected)
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// Skill Item Component
interface SkillItemProps {
  skill: string;
  isSelected: boolean;
  onPress: () => void;
  category?: string | null;
  indent?: boolean;
}

const SkillItem: React.FC<SkillItemProps> = ({
  skill,
  isSelected,
  onPress,
  category,
  indent,
}) => (
  <Pressable
    onPress={onPress}
    className={cn(
      "flex-row items-center justify-between py-3.5 border-b border-gray-50",
      indent ? "px-8" : "px-5",
      isSelected && "bg-emerald-50"
    )}
  >
    <View className="flex-1">
      <Text
        className={cn(
          "text-base",
          isSelected ? "text-emerald-600 font-semibold" : "text-gray-900"
        )}
      >
        {skill}
      </Text>
      {category && !indent && (
        <Text className="text-gray-400 text-xs mt-0.5">{category}</Text>
      )}
    </View>
    {isSelected && <Check size={20} color="#059669" />}
  </Pressable>
);

export default SkillsPicker;
