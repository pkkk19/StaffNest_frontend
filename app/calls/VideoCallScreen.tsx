// // app/calls/VideoCallScreen.tsx
// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   Dimensions,
//   Platform,
//   ScrollView,
//   Modal,
//   TextInput,
//   FlatList,
// } from 'react-native';
// import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
// import { useVideo } from '@/contexts/VideoContext';
// import { HMSPeer } from '@100mslive/react-native-hms';

// const { width, height } = Dimensions.get('window');

// export const VideoCallScreen = () => {
//   const {
//     isInCall,
//     callType,
//     currentRoom,
//     localPeer,
//     remotePeers,
//     messages,
//     leaveRoom,
//     toggleMute,
//     toggleCamera,
//     toggleSpeaker,
//     switchCamera,
//     toggleScreenShare,
//     sendMessage,
//     raiseHand,
//     isLocalAudioMuted,
//     isLocalVideoMuted,
//     isScreenSharing,
//     isRecording,
//     isHandRaised,
//     showVideoScreen,
//     setShowVideoScreen,
//   } = useVideo();

//   const [messageInput, setMessageInput] = useState('');
//   const [showChat, setShowChat] = useState(false);
//   const [showParticipants, setShowParticipants] = useState(false);
//   const [callDuration, setCallDuration] = useState(0);
//   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   useEffect(() => {
//     if (isInCall) {
//       timerRef.current = setInterval(() => {
//         setCallDuration(prev => prev + 1);
//       }, 1000);
//     }

//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//       }
//     };
//   }, [isInCall]);

//   const formatDuration = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const handleSendMessage = () => {
//     if (messageInput.trim()) {
//       sendMessage(messageInput);
//       setMessageInput('');
//     }
//   };

//   const handleLeaveCall = () => {
//     leaveRoom();
//     setShowVideoScreen(false);
//   };

//   if (!isInCall || !showVideoScreen) {
//     return null;
//   }

//   // Render peer video/audio with proper null checks
//   const renderPeer = (peer: HMSPeer | null, isLocal: boolean = false) => {
//     if (!peer) return null;
    
//     const peerName = peer.name || 'Anonymous';
//     const handRaised = peer.metadata ? JSON.parse(peer.metadata)?.isHandRaised : false;
    
//     return (
//       <View key={peer.peerID} style={styles.peerContainer}>
//         <View style={[styles.videoTile, isLocal && styles.localTile]}>
//           {!isLocalVideoMuted || !isLocal ? (
//             <View style={styles.videoPlaceholder}>
//               <Ionicons name="videocam" size={40} color="#666" />
//               <Text style={styles.peerName}>
//                 {peerName} {isLocal ? '(You)' : ''}
//               </Text>
//               {handRaised && (
//                 <View style={styles.handRaisedBadge}>
//                   <FontAwesome5 name="hand-paper" size={16} color="white" />
//                 </View>
//               )}
//             </View>
//           ) : (
//             <View style={styles.audioOnlyTile}>
//               <View style={styles.avatar}>
//                 <Text style={styles.avatarText}>
//                   {peerName.charAt(0).toUpperCase()}
//                 </Text>
//               </View>
//               <Text style={styles.peerName}>
//                 {peerName} {isLocal ? '(You)' : ''}
//               </Text>
//               {isLocalAudioMuted && isLocal && (
//                 <View style={styles.mutedBadge}>
//                   <Ionicons name="mic-off" size={16} color="white" />
//                 </View>
//               )}
//             </View>
//           )}
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <Text style={styles.roomName}>
//             {currentRoom?.name || 'Video Call'}
//           </Text>
//           <Text style={styles.callInfo}>
//             {callType === 'screen' ? 'Screen Sharing' : 
//              callType === 'voice' ? 'Voice Call' : 'Video Call'} • {formatDuration(callDuration)}
//           </Text>
//         </View>
//         <View style={styles.headerRight}>
//           {isRecording && (
//             <View style={styles.recordingBadge}>
//               <View style={styles.recordingDot} />
//               <Text style={styles.recordingText}>REC</Text>
//             </View>
//           )}
//           <Text style={styles.participantCount}>
//             {remotePeers.length + (localPeer ? 1 : 0)} online
//           </Text>
//         </View>
//       </View>

//       {/* Main Video Area */}
//       <ScrollView style={styles.videoArea} contentContainerStyle={styles.videoGrid}>
//         {/* Local Peer */}
//         {renderPeer(localPeer, true)}
        
//         {/* Remote Peers */}
//         {remotePeers.map(peer => renderPeer(peer))}
        
//         {/* Empty state */}
//         {remotePeers.length === 0 && (
//           <View style={styles.waitingContainer}>
//             <Ionicons name="people" size={60} color="#666" />
//             <Text style={styles.waitingText}>
//               Waiting for others to join...
//             </Text>
//             <Text style={styles.roomIdText}>
//               Room: {currentRoom?.id?.substring(0, 8)}...
//             </Text>
//           </View>
//         )}
//       </ScrollView>

//       {/* Controls */}
//       <View style={styles.controlsContainer}>
//         <TouchableOpacity 
//           style={[styles.controlButton, isLocalAudioMuted && styles.controlButtonActive]} 
//           onPress={toggleMute}
//         >
//           <Ionicons 
//             name={isLocalAudioMuted ? "mic-off" : "mic"} 
//             size={24} 
//             color="white" 
//           />
//           <Text style={styles.controlText}>Mic</Text>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           style={[styles.controlButton, isLocalVideoMuted && styles.controlButtonActive]} 
//           onPress={toggleCamera}
//         >
//           <Ionicons 
//             name={isLocalVideoMuted ? "videocam-off" : "videocam"} 
//             size={24} 
//             color="white" 
//           />
//           <Text style={styles.controlText}>Camera</Text>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           style={[styles.controlButton, isScreenSharing && styles.controlButtonActive]} 
//           onPress={toggleScreenShare}
//         >
//           <Ionicons 
//             name="desktop-outline" 
//             size={24} 
//             color="white" 
//           />
//           <Text style={styles.controlText}>Share</Text>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           style={[styles.controlButton, isHandRaised && styles.controlButtonActive]} 
//           onPress={raiseHand}
//         >
//           <FontAwesome5 
//             name="hand-paper" 
//             size={20} 
//             color="white" 
//           />
//           <Text style={styles.controlText}>Hand</Text>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           style={styles.controlButton} 
//           onPress={() => setShowChat(!showChat)}
//         >
//           <Ionicons name="chatbubble-outline" size={24} color="white" />
//           <Text style={styles.controlText}>Chat</Text>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           style={[styles.controlButton, styles.leaveButton]} 
//           onPress={handleLeaveCall}
//         >
//           <Ionicons name="call" size={24} color="white" />
//           <Text style={styles.controlText}>Leave</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Chat Modal */}
//       <Modal
//         visible={showChat}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setShowChat(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Chat ({messages.length})</Text>
//               <TouchableOpacity onPress={() => setShowChat(false)}>
//                 <Ionicons name="close" size={24} color="#666" />
//               </TouchableOpacity>
//             </View>
            
//             <FlatList
//               data={messages}
//               keyExtractor={(item, index) => index.toString()}
//               renderItem={({ item }) => (
//                 <View style={styles.messageItem}>
//                   <Text style={styles.messageSender}>{item.sender?.name || 'Anonymous'}:</Text>
//                   <Text style={styles.messageText}>{item.message}</Text>
//                 </View>
//               )}
//               style={styles.messageList}
//             />
            
//             <View style={styles.messageInputContainer}>
//               <TextInput
//                 style={styles.messageInput}
//                 value={messageInput}
//                 onChangeText={setMessageInput}
//                 placeholder="Type a message..."
//                 placeholderTextColor="#999"
//               />
//               <TouchableOpacity 
//                 style={styles.sendButton} 
//                 onPress={handleSendMessage}
//               >
//                 <Ionicons name="send" size={20} color="white" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 1000,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: Platform.OS === 'ios' ? 50 : 30,
//     paddingBottom: 15,
//     backgroundColor: 'rgba(0,0,0,0.9)',
//     borderBottomWidth: 1,
//     borderBottomColor: '#333',
//   },
//   headerLeft: {
//     flex: 1,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   roomName: {
//     fontSize: 18,
//     color: 'white',
//     fontWeight: '600',
//   },
//   callInfo: {
//     fontSize: 14,
//     color: '#4CAF50',
//     marginTop: 2,
//   },
//   recordingBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F44336',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//     marginRight: 10,
//   },
//   recordingDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: 'white',
//     marginRight: 4,
//   },
//   recordingText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   participantCount: {
//     fontSize: 14,
//     color: '#ccc',
//   },
//   videoArea: {
//     flex: 1,
//     backgroundColor: '#1a1a1a',
//   },
//   videoGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     padding: 10,
//   },
//   peerContainer: {
//     width: width > 500 ? '48%' : '100%',
//     aspectRatio: 4/3,
//     margin: 4,
//   },
//   videoTile: {
//     flex: 1,
//     backgroundColor: '#2a2a2a',
//     borderRadius: 10,
//     overflow: 'hidden',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   localTile: {
//     borderWidth: 2,
//     borderColor: '#007AFF',
//   },
//   videoPlaceholder: {
//     alignItems: 'center',
//   },
//   peerName: {
//     color: 'white',
//     fontSize: 14,
//     marginTop: 8,
//     fontWeight: '500',
//   },
//   handRaisedBadge: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     backgroundColor: '#FF9800',
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   audioOnlyTile: {
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   avatarText: {
//     color: 'white',
//     fontSize: 32,
//     fontWeight: '600',
//   },
//   mutedBadge: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     backgroundColor: '#F44336',
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   waitingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   waitingText: {
//     fontSize: 18,
//     color: '#ccc',
//     marginTop: 20,
//     textAlign: 'center',
//   },
//   roomIdText: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 10,
//   },
//   controlsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingVertical: 20,
//     paddingHorizontal: 10,
//     backgroundColor: 'rgba(0,0,0,0.9)',
//     borderTopWidth: 1,
//     borderTopColor: '#333',
//   },
//   controlButton: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     backgroundColor: '#333',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   controlButtonActive: {
//     backgroundColor: '#444',
//   },
//   leaveButton: {
//     backgroundColor: '#F44336',
//   },
//   controlText: {
//     color: 'white',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     backgroundColor: '#1a1a1a',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     height: '60%',
//     padding: 20,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#333',
//   },
//   modalTitle: {
//     fontSize: 20,
//     color: 'white',
//     fontWeight: '600',
//   },
//   messageList: {
//     flex: 1,
//     marginBottom: 15,
//   },
//   messageItem: {
//     backgroundColor: '#2a2a2a',
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 8,
//   },
//   messageSender: {
//     color: '#007AFF',
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 2,
//   },
//   messageText: {
//     color: 'white',
//     fontSize: 16,
//   },
//   messageInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   messageInput: {
//     flex: 1,
//     backgroundColor: '#2a2a2a',
//     color: 'white',
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     borderRadius: 25,
//     fontSize: 16,
//     marginRight: 10,
//   },
//   sendButton: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });