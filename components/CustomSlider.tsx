// components/CustomSlider.tsx
import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, // Added Text import
  PanResponder, 
  Animated, 
  GestureResponderEvent, 
  PanResponderGestureState,
  StyleSheet,
  StyleProp,
  ViewStyle
} from 'react-native';

export interface CustomSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  thumbStyle?: StyleProp<ViewStyle>;
  trackStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  width?: number;
  height?: number;
  showValueIndicator?: boolean;
  thumbSize?: number; // Added thumbSize as a prop
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onValueChange,
  onSlidingComplete,
  minimumValue,
  maximumValue,
  step = 1,
  minimumTrackTintColor = '#3B82F6',
  maximumTrackTintColor = '#D1D5DB',
  thumbTintColor = '#3B82F6',
  thumbStyle,
  trackStyle,
  style,
  disabled = false,
  width = 300,
  height = 40,
  showValueIndicator = false,
  thumbSize = 24, // Default thumb size
}) => {
  const sliderWidth = width;
  const [isSliding, setIsSliding] = useState(false);
  const [containerWidth, setContainerWidth] = useState(sliderWidth);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(3)).current;
  const containerRef = useRef<View>(null);
  
  // Calculate percentage based on value
  const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;
  const thumbPosition = Math.max(0, Math.min(containerWidth - thumbSize, (percentage / 100) * (containerWidth - thumbSize)));
  
  const handleContainerLayout = () => {
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (width > 0) {
        setContainerWidth(width);
      }
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (event: GestureResponderEvent) => {
      if (disabled) return;
      setIsSliding(true);
      
      // Animate thumb on press
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          useNativeDriver: true,
        }),
        Animated.spring(shadowAnim, {
          toValue: 6,
          useNativeDriver: false,
        }),
      ]).start();
      
      // Handle tap to set value
      handleTouch(event);
    },
    onPanResponderMove: (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (disabled) return;
      
      handleTouch(event);
    },
    onPanResponderRelease: () => {
      if (disabled) return;
      setIsSliding(false);
      
      // Animate thumb back to normal
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(shadowAnim, {
          toValue: 3,
          useNativeDriver: false,
        }),
      ]).start();
      
      if (onSlidingComplete) {
        onSlidingComplete(value);
      }
    },
    onPanResponderTerminate: () => {
      if (disabled) return;
      setIsSliding(false);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(shadowAnim, {
          toValue: 3,
          useNativeDriver: false,
        }),
      ]).start();
    },
  });

  const handleTouch = (event: GestureResponderEvent) => {
    if (!containerRef.current) return;
    
    containerRef.current.measure((x, y, width, height, pageX, pageY) => {
      const touchX = event.nativeEvent.pageX - pageX;
      const newThumbPosition = Math.max(0, Math.min(width - thumbSize, touchX - (thumbSize / 2)));
      const newPercentage = newThumbPosition / (width - thumbSize);
      let newValue = minimumValue + (newPercentage * (maximumValue - minimumValue));
      
      // Apply step if provided
      if (step > 0) {
        newValue = Math.round(newValue / step) * step;
      }
      
      // Clamp value to min/max
      newValue = Math.max(minimumValue, Math.min(maximumValue, newValue));
      
      // Only update if value changed
      if (Math.abs(newValue - value) > 0.01) {
        onValueChange(newValue);
      }
    });
  };

  // Format value for display
  const formatValue = (val: number) => {
    if (step >= 1) {
      return Math.round(val).toString();
    }
    return val.toFixed(step.toString().split('.')[1]?.length || 1);
  };

  return (
    <View 
      ref={containerRef}
      onLayout={handleContainerLayout}
      style={[
        styles.container,
        { width: sliderWidth, height },
        style
      ]}
    >
      {/* Track Background */}
      <View style={[
        styles.track,
        { backgroundColor: maximumTrackTintColor },
        trackStyle
      ]}>
        {/* Filled Track */}
        <View 
          style={[
            styles.filledTrack,
            { 
              width: `${percentage}%`,
              backgroundColor: minimumTrackTintColor,
            }
          ]} 
        />
      </View>
      
      {/* Value Indicator (optional) */}
      {showValueIndicator && isSliding && (
        <View style={[
          styles.valueIndicator,
          { 
            left: thumbPosition,
            bottom: thumbSize + 10, // Fixed: using thumbSize prop
          }
        ]}>
          <View style={styles.valueIndicatorTriangle} />
          <View style={styles.valueIndicatorBox}>
            <Text style={styles.valueIndicatorText}>{formatValue(value)}</Text>
          </View>
        </View>
      )}
      
      {/* Thumb */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            left: thumbPosition,
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: thumbTintColor,
            transform: [{ scale: scaleAnim }],
            shadowRadius: shadowAnim,
          },
          thumbStyle
        ]}
      >
        <View style={styles.thumbInner} />
      </Animated.View>
      
      {/* Step markers (optional, for visual reference) */}
      {step > 0 && (maximumValue - minimumValue) / step <= 10 && (
        <View style={styles.stepsContainer}>
          {Array.from({ length: Math.floor((maximumValue - minimumValue) / step) + 1 }).map((_, index) => {
            const stepValue = minimumValue + (index * step);
            const stepPercentage = ((stepValue - minimumValue) / (maximumValue - minimumValue)) * 100;
            return (
              <View
                key={index}
                style={[
                  styles.stepMarker,
                  { left: `${stepPercentage}%` }
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  filledTrack: {
    height: '100%',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  valueIndicator: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -50 }],
  },
  valueIndicatorTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
  },
  valueIndicatorBox: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: -1,
  },
  valueIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stepsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  stepMarker: {
    position: 'absolute',
    width: 2,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    top: -3,
    transform: [{ translateX: -1 }],
  },
});

export default CustomSlider;