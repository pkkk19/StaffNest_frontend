// app/chat/components/TypingIndicator.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useChatTheme } from '../hooks/useChatTheme';

interface TypingIndicatorProps {
  isTyping: boolean;
  typingUser?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isTyping, 
  typingUser = 'Someone' 
}) => {
  const { colors, isDark } = useChatTheme();
  const styles = createStyles(colors, isDark);
  
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isTyping) return;

    const createAnimation = (dotAnim: Animated.Value, delay: number = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createAnimation(dot1Anim);
    const animation2 = createAnimation(dot2Anim, 150);
    const animation3 = createAnimation(dot3Anim, 300);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    };
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <View style={styles.container}>
      <View style={styles.typingBubble}>
        <Animated.View 
          style={[
            styles.dot, 
            { 
              opacity: dot1Anim,
              transform: [{
                translateY: dot1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4]
                })
              }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { 
              opacity: dot2Anim,
              transform: [{
                translateY: dot2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4]
                })
              }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { 
              opacity: dot3Anim,
              transform: [{
                translateY: dot3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4]
                })
              }]
            }
          ]} 
        />
      </View>
      <View style={styles.textContainer}>
        <Animated.Text 
          style={[
            styles.typingText,
            { 
              opacity: dot1Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1]
              })
            }
          ]}
        >
          {typingUser} is typing
        </Animated.Text>
        <Animated.Text 
          style={[
            styles.typingDots,
            { 
              opacity: dot1Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1]
              })
            }
          ]}
        >
          ...
        </Animated.Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 56,
    marginBottom: 12,
    marginTop: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: colors.otherUserBubble,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textTertiary,
    marginHorizontal: 2,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  typingText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  typingDots: {
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 1,
  },
});