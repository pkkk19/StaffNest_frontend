// app/components/stories/StoryEditor.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { 
  X, 
  Type, 
  PenTool, 
  Smile, 
  Filter, 
  Check,
  ChevronLeft,
  ChevronRight,
  Palette,
  AlignCenter,
  AlignLeft,
  AlignRight,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryEditorProps {
  mediaUri: string;
  type: 'image' | 'video';
  onClose: () => void;
  onSave: (editedUri: string) => void;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
  mediaUri,
  type,
  onClose,
  onSave,
}) => {
  const [activeTool, setActiveTool] = useState<'text' | 'draw' | 'sticker' | 'filter' | null>(null);
  const [texts, setTexts] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    fontSize: number;
    fontFamily: string;
    alignment: 'left' | 'center' | 'right';
  }>>([]);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(24);
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  
  const textInputRef = useRef<TextInput>(null);

  const colors = [
    '#FFFFFF', '#000000', '#3B82F6', '#EF4444', '#10B981',
    '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  const fonts = [
    'System',
    'Inter',
    'Roboto',
    'Montserrat',
    'OpenSans'
  ];

  const handleAddText = () => {
    if (currentText.trim()) {
      const newText = {
        id: Date.now().toString(),
        text: currentText,
        x: SCREEN_WIDTH / 2 - 100,
        y: SCREEN_HEIGHT / 2 - 50,
        color: textColor,
        fontSize: fontSize,
        fontFamily: fonts[0],
        alignment: textAlignment
      };
      setTexts([...texts, newText]);
      setCurrentText('');
      setActiveTool(null);
    }
  };

  const renderToolPanel = () => {
    switch (activeTool) {
      case 'text':
        return (
          <View style={styles.toolPanel}>
            <View style={styles.toolHeader}>
              <Text style={styles.toolTitle}>Add Text</Text>
              <TouchableOpacity onPress={() => setActiveTool(null)}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder="Type your text..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={currentText}
              onChangeText={setCurrentText}
              multiline
              autoFocus
            />
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
              {colors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }]}
                  onPress={() => setTextColor(color)}
                >
                  {textColor === color && (
                    <Check size={16} color={color === '#FFFFFF' ? '#000000' : '#FFFFFF'} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.textControls}>
              <View style={styles.fontSizeControl}>
                <TouchableOpacity onPress={() => setFontSize(Math.max(16, fontSize - 4))}>
                  <Text style={styles.controlButton}>A-</Text>
                </TouchableOpacity>
                <Text style={styles.fontSizeText}>{fontSize}</Text>
                <TouchableOpacity onPress={() => setFontSize(Math.min(48, fontSize + 4))}>
                  <Text style={styles.controlButton}>A+</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.alignmentControls}>
                <TouchableOpacity 
                  onPress={() => setTextAlignment('left')}
                  style={[styles.alignmentButton, textAlignment === 'left' && styles.alignmentButtonActive]}
                >
                  <AlignLeft size={20} color={textAlignment === 'left' ? '#3B82F6' : '#FFFFFF'} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setTextAlignment('center')}
                  style={[styles.alignmentButton, textAlignment === 'center' && styles.alignmentButtonActive]}
                >
                  <AlignCenter size={20} color={textAlignment === 'center' ? '#3B82F6' : '#FFFFFF'} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setTextAlignment('right')}
                  style={[styles.alignmentButton, textAlignment === 'right' && styles.alignmentButtonActive]}
                >
                  <AlignRight size={20} color={textAlignment === 'right' ? '#3B82F6' : '#FFFFFF'} />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddText}
              disabled={!currentText.trim()}
            >
              <Text style={styles.addButtonText}>Add Text</Text>
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: mediaUri }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Render added texts */}
      {texts.map(text => (
        <Text
          key={text.id}
          style={[
            styles.addedText,
            {
              position: 'absolute',
              left: text.x,
              top: text.y,
              color: text.color,
              fontSize: text.fontSize,
              fontFamily: text.fontFamily,
              textAlign: text.alignment,
            }
          ]}
        >
          {text.text}
        </Text>
      ))}
      
      {/* Tool panel */}
      {activeTool && (
        <Animated.View style={styles.toolPanelContainer}>
          {renderToolPanel()}
        </Animated.View>
      )}
      
      {/* Top toolbar */}
      <View style={styles.topToolbar}>
        <TouchableOpacity style={styles.toolbarButton} onPress={onClose}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.toolbarTitle}>Edit Story</Text>
        
        <TouchableOpacity style={styles.toolbarButton} onPress={() => onSave(mediaUri)}>
          <Check size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Bottom toolbar */}
      <View style={styles.bottomToolbar}>
        <TouchableOpacity 
          style={[styles.toolButton, activeTool === 'text' && styles.activeToolButton]}
          onPress={() => setActiveTool(activeTool === 'text' ? null : 'text')}
        >
          <Type size={24} color={activeTool === 'text' ? '#3B82F6' : '#FFFFFF'} />
          <Text style={[styles.toolLabel, activeTool === 'text' && styles.activeToolLabel]}>Text</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolButton, activeTool === 'draw' && styles.activeToolButton]}
          onPress={() => setActiveTool(activeTool === 'draw' ? null : 'draw')}
        >
          <PenTool size={24} color={activeTool === 'draw' ? '#3B82F6' : '#FFFFFF'} />
          <Text style={[styles.toolLabel, activeTool === 'draw' && styles.activeToolLabel]}>Draw</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolButton, activeTool === 'sticker' && styles.activeToolButton]}
          onPress={() => setActiveTool(activeTool === 'sticker' ? null : 'sticker')}
        >
          <Smile size={24} color={activeTool === 'sticker' ? '#3B82F6' : '#FFFFFF'} />
          <Text style={[styles.toolLabel, activeTool === 'sticker' && styles.activeToolLabel]}>Sticker</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolButton, activeTool === 'filter' && styles.activeToolButton]}
          onPress={() => setActiveTool(activeTool === 'filter' ? null : 'filter')}
        >
          <Filter size={24} color={activeTool === 'filter' ? '#3B82F6' : '#FFFFFF'} />
          <Text style={[styles.toolLabel, activeTool === 'filter' && styles.activeToolLabel]}>Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomToolbar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  toolButton: {
    alignItems: 'center',
    padding: 8,
  },
  activeToolButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
  },
  toolLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  activeToolLabel: {
    color: '#3B82F6',
  },
  toolPanelContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
  },
  toolPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    minHeight: 60,
  },
  colorPicker: {
    marginBottom: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  fontSizeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  alignmentControls: {
    flexDirection: 'row',
  },
  alignmentButton: {
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  alignmentButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addedText: {
    position: 'absolute',
    padding: 8,
    borderRadius: 4,
  },
});