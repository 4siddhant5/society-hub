import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView
} from "react-native";
import { db } from "../config/firebase";
import {
  collection, addDoc, query, orderBy, where,
  onSnapshot, doc, updateDoc, arrayUnion, arrayRemove,
  setDoc, deleteDoc, getDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, uploadDocument } from '../services/cloudinaryService';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts?.toDate ? ts.toDate() : ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

// ─── MemberItem ─────────────────────────────────────────────────────────────
const MemberItem = ({ item }) => (
  <View style={styles.memberItem}>
    <View style={styles.memberAvatar}>
      <Text style={styles.memberAvatarText}>
        {item.name ? item.name.charAt(0).toUpperCase() : '?'}
      </Text>
      {item.isOnline && <View style={styles.onlineDot} />}
    </View>
    <View style={styles.memberInfo}>
      <Text style={styles.memberName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.memberRole}>{item.role === 'admin' ? '⭐ Admin' : `Flat ${item.flat || '–'}`}</Text>
    </View>
  </View>
);

// ─── MessageItem ─────────────────────────────────────────────────────────────
const MessageItem = ({ item, isMe, user, navigation, onLongPress }) => {
  const [deletedForMe, setDeletedForMe] = useState(false);
  if (deletedForMe) return null;

  const openMedia = (url) => {
    if (Platform.OS === 'web') window.open(url, '_blank');
  };

  return (
    <View style={[styles.msgWrapper, isMe ? styles.myWrapper : styles.otherWrapper]}>
      {!isMe && (
        <TouchableOpacity
          onPress={() => navigation.navigate('ProfileScreen', { userId: item.senderId })}
          style={styles.avatarContainer}
        >
          {item.senderProfileUrl ? (
            <Image source={{ uri: item.senderProfileUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.fallbackAvatar}>
              <Text style={styles.fallbackAvatarText}>
                {item.senderName ? item.senderName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onLongPress={() => !item.isDeleted && onLongPress(item, setDeletedForMe)}
        delayLongPress={200}
        activeOpacity={0.9}
        style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}
      >
        {!isMe && (
          <Text style={styles.senderName}>
            {item.senderName}{item.senderRole === 'admin' ? ' · Admin' : ''}
          </Text>
        )}
        {item.isDeleted ? (
          <Text style={styles.deletedText}>This message was deleted</Text>
        ) : (
          <>
            {item.mediaType === 'image' && !!item.mediaUrl && (
              <TouchableOpacity onPress={() => openMedia(item.mediaUrl)} style={styles.mediaWrap}>
                <Image source={{ uri: item.mediaUrl }} style={styles.chatImage} resizeMode="cover" />
              </TouchableOpacity>
            )}
            {item.mediaType === 'pdf' && !!item.mediaUrl && (
              <TouchableOpacity onPress={() => openMedia(item.mediaUrl)} style={styles.pdfCard}>
                <Text style={{ fontSize: 20 }}>📄</Text>
                <Text style={styles.pdfName} numberOfLines={1}>{item.mediaName || 'Document.pdf'}</Text>
              </TouchableOpacity>
            )}
            {!!item.text && (
              <Text style={[styles.msgText, isMe ? styles.myText : styles.otherText]}>
                {item.text}
              </Text>
            )}
          </>
        )}
        <View style={styles.metaRow}>
          <Text style={[styles.timeLabel, isMe ? styles.myTime : styles.otherTime]}>
            {formatTime(item.timestamp)}
          </Text>
          {isMe && !item.isDeleted && (
            <Text style={styles.seenTick}>
              {item.seenBy && item.seenBy.length > 0 ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main ChatScreen ──────────────────────────────────────────────────────────
export default function ChatScreen({ navigation }) {
  const { user, userData } = useAuth();

  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [typists, setTypists] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);

  const [selectedMsg, setSelectedMsg] = useState(null);
  const [selectedSetDeleted, setSelectedSetDeleted] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const flatListRef = useRef();
  const typingTimeoutRef = useRef(null);

  // ── Mute listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setIsMuted(snap.data().isMuted || false);
    });
    return unsub;
  }, [user?.uid]);

  // ── Messages listener ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userData?.societyId) return;
    console.log('Chat using societyId:', userData.societyId);

    const qMsgs = query(
      collection(db, 'chats', userData.societyId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubMsgs = onSnapshot(qMsgs, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log('[Chat] messages loaded:', msgs.length);
      setMessages(msgs);
      const pinned = msgs.filter(m => m.isPinned).sort((a, b) => {
        const tA = a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp;
        const tB = b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp;
        return tB - tA;
      })[0];
      setPinnedMessage(pinned || null);
    }, (e) => console.error('[Chat] messages error:', e));

    // ── Members ────────────────────────────────────────────────────────────
    const qMembers = query(
      collection(db, 'users'),
      where('societyId', '==', userData.societyId),
      where('status', '==', 'approved')
    );
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setMembers(list);
    }, (e) => console.error('[Chat] members error:', e));

    // ── Typing ─────────────────────────────────────────────────────────────
    // Disabled: requires composite Firestore index (societyId + isTyping).
    // const qTyping = query(
    //   collection(db, 'typingStatus'),
    //   where('societyId', '==', userData.societyId),
    //   where('isTyping', '==', true)
    // );
    // const unsubTyping = onSnapshot(qTyping, (snap) => {
    //   setTypists(
    //     snap.docs.map(d => ({ id: d.id, ...d.data() }))
    //       .filter(t => t.userId !== user.uid)
    //   );
    // }, () => { });

    return () => { unsubMsgs(); unsubMembers(); };
  }, [userData?.societyId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (mediaUrl = null, mediaType = null, mediaName = null) => {
    const text = inputText.trim();
    if (!text && !mediaUrl) return;
    setInputText('');

    let profileImageUrl = userData.profileImageUrl || '';

    const payload = {
      text,
      senderId: user.uid,
      senderName: userData.name || 'Unknown',
      senderProfileUrl: profileImageUrl,
      senderRole: userData.role || 'resident',
      societyId: userData.societyId,
      timestamp: Date.now(),
      seenBy: [],
      reactions: {},
      isDeleted: false,
    };
    if (mediaUrl) { payload.mediaUrl = mediaUrl; payload.mediaType = mediaType; payload.mediaName = mediaName; }

    try {
      await addDoc(collection(db, 'chats', userData.societyId, 'messages'), payload);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e) { console.error('[Chat] send error:', e); }
  };

  // ── Typing indicator ───────────────────────────────────────────────────────
  const handleTyping = async (text) => {
    setInputText(text);
    if (!userData?.societyId) return;
    const tRef = doc(db, 'typingStatus', `${userData.societyId}_${user.uid}`);
    if (text.trim().length > 0) {
      await setDoc(tRef, { userId: user.uid, name: userData.name, isTyping: true, societyId: userData.societyId }, { merge: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setDoc(tRef, { isTyping: false }, { merge: true }), 1500);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      await setDoc(tRef, { isTyping: false }, { merge: true });
    }
  };

  // ── Media upload ───────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) await uploadAndSend(file, 'image', true);
        };
        input.click();
      } else {
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
        if (!res.canceled) await uploadAndSend(res.assets[0].uri, 'image', false);
      }
    } catch { Alert.alert('Error', 'Failed to pick image'); }
  };

  const uploadAndSend = async (src, type, isWeb) => {
    setUploadingMedia(true);
    try {
      let url = '';
      if (type === 'image') url = isWeb ? await uploadImage(src) : await uploadImage({ uri: src, type: 'image/jpeg', name: 'chat_image.jpg' });
      else url = await uploadDocument(src);
      if (url) await handleSend(url, type, isWeb ? src.name : 'document.pdf');
    } catch { Alert.alert('Error', `Failed to upload ${type}`); }
    finally { setUploadingMedia(false); }
  };

  // ── Reactions / Actions ────────────────────────────────────────────────────
  const handleLongPress = (item, setDelFn) => {
    setSelectedMsg(item);
    setSelectedSetDeleted(() => setDelFn);
    setActionModalVisible(true);
  };

  const handleReaction = async (emoji) => {
    if (!selectedMsg) return;
    setActionModalVisible(false);
    const ref = doc(db, 'chats', userData.societyId, 'messages', selectedMsg.id);
    const cur = (selectedMsg.reactions || {})[emoji] || [];
    try {
      await updateDoc(ref, {
        [`reactions.${emoji}`]: cur.includes(user.uid) ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (e) { console.error(e); }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMsg || selectedMsg.senderId !== user.uid) return;
    setActionModalVisible(false);
    try {
      await updateDoc(doc(db, 'chats', userData.societyId, 'messages', selectedMsg.id), {
        text: 'This message was deleted', isDeleted: true, mediaUrl: '', mediaType: null
      });
    } catch (e) { console.error(e); }
  };

  const handlePinMessage = async () => {
    if (!selectedMsg) return;
    setActionModalVisible(false);
    try {
      await updateDoc(doc(db, 'chats', userData.societyId, 'messages', selectedMsg.id), { isPinned: !selectedMsg.isPinned });
    } catch (e) { console.error(e); }
  };

  // ── Seen by ────────────────────────────────────────────────────────────────
  const markSeen = (item) => {
    if (!item.isDeleted && (!item.seenBy || !item.seenBy.includes(user.uid))) {
      updateDoc(doc(db, 'chats', userData.societyId, 'messages', item.id), { seenBy: arrayUnion(user.uid) }).catch(() => { });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Pinned banner */}
      {pinnedMessage && (
        <TouchableOpacity
          style={styles.pinnedBanner}
          onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
        >
          <Text style={{ fontSize: 14 }}>📌</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.pinnedLabel}>Pinned Message</Text>
            <Text style={styles.pinnedText} numberOfLines={1}>
              {pinnedMessage.text || 'Media attachment'}
            </Text>
          </View>
          <TouchableOpacity style={styles.membersToggle} onPress={() => setShowMembers(v => !v)}>
            <Text style={styles.membersToggleText}>
              {showMembers ? 'Chat' : `👥 ${members.length}`}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Top bar with member toggle when no pinned */}
      {!pinnedMessage && (
        <View style={styles.chatTopBar}>
          <Text style={styles.chatTopTitle}>Community Chat</Text>
          <TouchableOpacity style={styles.membersToggle} onPress={() => setShowMembers(v => !v)}>
            <Text style={styles.membersToggleText}>
              {showMembers ? '← Chat' : `👥 ${members.length} members`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.chatArea}>
        {/* Members panel */}
        {showMembers ? (
          <View style={styles.membersPanel}>
            <Text style={styles.membersPanelTitle}>Members ({members.length})</Text>
            <FlatList
              data={members}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <MemberItem item={item} />}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No members found</Text>}
            />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                if (item.senderId !== user.uid) markSeen(item);
                return (
                  <MessageItem
                    item={item}
                    isMe={item.senderId === user.uid}
                    user={user}
                    navigation={navigation}
                    onLongPress={handleLongPress}
                  />
                );
              }}
              contentContainerStyle={styles.msgList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyChatIcon}>💬</Text>
                  <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
                </View>
              }
            />

            {typists.length > 0 ? (
              <View style={styles.typingBar}>
                <Text style={styles.typingText}>
                  {typists.length === 1
                    ? `${typists[0].name} is typing…`
                    : `${typists.length} people are typing…`}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputBar}>
              <TouchableOpacity onPress={handlePickImage} style={styles.attachBtn}>
                <Text style={{ fontSize: 20 }}>📎</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder={isMuted ? 'Muted by Admin' : 'Write a message…'}
                value={inputText}
                onChangeText={handleTyping}
                multiline
                editable={!isMuted && !uploadingMedia}
              />
              <TouchableOpacity
                onPress={() => handleSend()}
                style={[styles.sendBtn, (!inputText.trim() && !uploadingMedia) && styles.sendBtnOff]}
                disabled={!inputText.trim() && !uploadingMedia}
              >
                {uploadingMedia
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.sendBtnText}>➤</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>

      {/* Action modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setActionModalVisible(false)}>
          <View style={styles.actionSheet}>
            <View style={styles.reactionRow}>
              {['👍', '❤️', '😂', '🔥', '👏'].map(emoji => (
                <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.emojiBtn}>
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.sheetRow}
              onPress={() => { selectedSetDeleted?.(true); setActionModalVisible(false); }}
            >
              <Text style={styles.sheetRowText}>Delete for me</Text>
            </TouchableOpacity>
            {selectedMsg?.senderId === user.uid && (
              <TouchableOpacity style={styles.sheetRow} onPress={handleDeleteForEveryone}>
                <Text style={[styles.sheetRowText, { color: '#ef4444' }]}>Delete for everyone</Text>
              </TouchableOpacity>
            )}
            {userData?.role === 'admin' && (
              <TouchableOpacity style={styles.sheetRow} onPress={handlePinMessage}>
                <Text style={styles.sheetRowText}>
                  {selectedMsg?.isPinned ? 'Unpin message' : '📌 Pin message'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Top bar
  chatTopBar: {
    flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'space-between',
  },
  chatTopTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  membersToggle: {
    backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  membersToggleText: { fontSize: 13, color: '#2563eb', fontWeight: '700' },

  // Pinned banner
  pinnedBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb',
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#fef3c7',
  },
  pinnedLabel: { fontSize: 11, fontWeight: '700', color: '#d97706' },
  pinnedText: { fontSize: 13, color: '#451a03' },

  // Chat area
  chatArea: { flex: 1 },

  // Members panel
  membersPanel: { flex: 1, backgroundColor: '#fff', padding: 16 },
  membersPanelTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  memberItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative',
  },
  memberAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e',
    borderWidth: 2, borderColor: '#fff',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  memberRole: { fontSize: 12, color: '#64748b', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },

  // Messages
  msgList: { padding: 16, paddingBottom: 8 },
  msgWrapper: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  myWrapper: { justifyContent: 'flex-end' },
  otherWrapper: { justifyContent: 'flex-start' },
  avatarCircle: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#64748b',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Profile avatar (restored)
  avatarContainer: { marginRight: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  fallbackAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center',
  },
  fallbackAvatarText: { color: '#fff', fontWeight: 'bold' },
  bubble: {
    maxWidth: '78%', padding: 12, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  myBubble: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 4 },
  msgText: { fontSize: 15, lineHeight: 21 },
  myText: { color: '#fff' },
  otherText: { color: '#1e293b' },
  deletedText: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 },
  timeLabel: { fontSize: 10 },
  myTime: { color: '#bfdbfe' },
  otherTime: { color: '#94a3b8' },
  seenTick: { fontSize: 11, color: '#bfdbfe' },

  // Media
  mediaWrap: { marginBottom: 6, borderRadius: 10, overflow: 'hidden' },
  chatImage: { width: 220, height: 160, backgroundColor: '#e2e8f0' },
  pdfCard: {
    flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 6,
    alignItems: 'center', gap: 8, width: 200,
  },
  pdfName: { fontSize: 13, fontWeight: '600', color: '#1e293b', flex: 1 },

  // Typing
  typingBar: { paddingHorizontal: 20, paddingBottom: 6 },
  typingText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },

  // Input
  inputBar: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 10,
    borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center',
  },
  attachBtn: { padding: 8 },
  textInput: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 8, fontSize: 15,
    maxHeight: 100, borderWidth: 1, borderColor: '#e2e8f0', marginHorizontal: 8,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: '#cbd5e1' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Action modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  reactionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  emojiBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 8 },
  sheetRow: { paddingVertical: 14 },
  sheetRowText: { fontSize: 16, fontWeight: '600', color: '#1e293b' },

  // Empty chat
  emptyChat: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyChatIcon: { fontSize: 40, marginBottom: 12 },
  emptyChatText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
});
