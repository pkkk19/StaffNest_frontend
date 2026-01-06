// app/components/common/WheelPicker.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface WheelPickerProps {
  items: { label: string; value: any }[];
  selectedValue: any;
  onValueChange: (value: any) => void;
  height?: number;
  itemHeight?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({
  items,
  selectedValue,
  onValueChange,
  height = 200,
  itemHeight = 44,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = items.findIndex(item => item.value === selectedValue);
    if (scrollViewRef.current && index >= 0) {
      scrollViewRef.current.scrollTo({ y: index * itemHeight, animated: false });
    }
  }, [selectedValue]);

  const handleScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / itemHeight);
    const selectedItem = items[Math.max(0, Math.min(items.length - 1, index))];
    if (selectedItem) {
      onValueChange(selectedItem.value);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.centerIndicator, { top: height / 2 - itemHeight / 2 }]} />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
      >
        {items.map((item, index) => {
          const isSelected = item.value === selectedValue;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.item, { height: itemHeight }]}
              onPress={() => {
                onValueChange(item.value);
                scrollViewRef.current?.scrollTo({ y: index * itemHeight, animated: true });
              }}
            >
              <Text style={[
                styles.itemText,
                isSelected && styles.itemTextSelected
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    paddingVertical: 80,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  itemTextSelected: {
    fontSize: 24,
    color: '#000',
    fontWeight: '600',
  },
  centerIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    zIndex: -1,
  },
});