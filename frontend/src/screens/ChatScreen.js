import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { uploadDocument, uploadImage } from '../services/cloudinaryService';

const DESKTOP_BREAKPOINT = 920;
const SUPPORTS_NATIVE_DRIVER = Platform.OS !== 'web';
const REACTION_OPTIONS = ['👍', '❤️', '😂', '🔥', '👏'];
const BACK_ICON = '\u2190';
const ATTACH_ICON = '\uD83D\uDCCE';
const SEND_ICON = '\u27A4';

const getTimestampValue = (ts) => {
  if (!ts) return 0;
  const value = ts?.toDate ? ts.toDate() : ts;
  return new Date(value).getTime() || 0;
};

const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const date = new Date(ts?.toDate ? ts.toDate() : ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const resolveFileName = (item) => {
  if (item?.mediaName) return item.mediaName;
  if (!item?.mediaUrl) return 'Attachment';
  try {
    const cleanUrl = item.mediaUrl.split('?')[0];
    const parts = cleanUrl.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'Attachment');
  } catch {
    return 'Attachment';
  }
};

const openExternalUrl = async (url) => {
  if (!url) return;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    console.error('[Chat] open url error:', error);
    Alert.alert('Unable to open file', 'Please try again in a moment.');
  }
};

const downloadExternalUrl = async (url, fileName) => {
  if (!url) return;
  try {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    console.error('[Chat] download error:', error);
    Alert.alert('Unable to download', 'Please try again in a moment.');
  }
};

const HoverCard = ({ children, style, disabled, onPress }) => (
  <Pressable
    disabled={disabled}
    onPress={onPress}
    style={({ hovered, pressed }) => [
      style,
      hovered && !disabled ? styles.hoverLift : null,
      pressed ? styles.pressedCard : null,
    ]}
  >
    {children}
  </Pressable>
);

const MemberItem = ({ item, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.85}
    style={styles.memberItem}
  >
    {item.profileImageUrl ? (
      <Image source={{ uri: item.profileImageUrl }} style={styles.memberAvatarImage} />
    ) : (
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {item.name ? item.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
    )}
    {item.isTyping ? <View style={styles.memberTypingDot} /> : null}
    <View style={styles.memberInfo}>
      <Text numberOfLines={1} style={styles.memberName}>{item.name || 'Resident'}</Text>
      <Text numberOfLines={1} style={styles.memberRole}>
        {item.role === 'admin' ? 'Admin' : `Flat ${item.flat || '-'}`}
      </Text>
    </View>
    <Text style={styles.memberMeta}>{item.isTyping ? 'Typing...' : 'Active'}</Text>
  </TouchableOpacity>
);

const AttachmentActions = ({ onExpand, onDownload, light }) => (
  <View style={styles.attachmentActions}>
    <TouchableOpacity
      onPress={onDownload}
      activeOpacity={0.85}
      style={[styles.attachmentAction, light ? styles.attachmentActionLight : null]}
    >
      <Text style={[styles.attachmentActionText, light ? styles.attachmentActionTextDark : null]}>
        Download
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onExpand}
      activeOpacity={0.85}
      style={[styles.attachmentAction, light ? styles.attachmentActionLight : null]}
    >
      <Text style={[styles.attachmentActionText, light ? styles.attachmentActionTextDark : null]}>
        Expand
      </Text>
    </TouchableOpacity>
  </View>
);

const MessageItem = ({
  item,
  isMe,
  isHighlighted,
  navigation,
  onLongPress,
  onPreviewImage,
  onDownloadMedia,
}) => {
  const [deletedForMe, setDeletedForMe] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      }),
    ]).start();
  }, [fade, translateY]);

  if (deletedForMe) return null;

  const hasImage = item.mediaType === 'image' && !!item.mediaUrl;
  const hasFile = item.mediaType !== 'image' && !!item.mediaUrl;
  const reactionEntries = Object.entries(item.reactions || {}).filter(
    ([, users]) => Array.isArray(users) && users.length > 0
  );

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isMe ? styles.messageRowRight : styles.messageRowLeft,
        { opacity: fade, transform: [{ translateY }] },
      ]}
    >
      {!isMe ? (
        <TouchableOpacity
          onPress={() => navigation?.navigate?.('ProfileScreen', { userId: item.senderId })}
          activeOpacity={0.85}
          style={styles.messageAvatarWrap}
        >
          {item.senderProfileUrl ? (
            <Image source={{ uri: item.senderProfileUrl }} style={styles.messageAvatarImage} />
          ) : (
            <View style={styles.messageAvatarFallback}>
              <Text style={styles.messageAvatarFallbackText}>
                {item.senderName ? item.senderName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        onLongPress={() => !item.isDeleted && onLongPress(item, setDeletedForMe)}
        delayLongPress={220}
        activeOpacity={0.92}
        style={[
          styles.messageBubble,
          isMe ? styles.messageBubbleRight : styles.messageBubbleLeft,
          isHighlighted ? styles.messageBubbleHighlighted : null,
        ]}
      >
        {item.isPinned ? (
          <View style={[styles.pinnedChip, isMe ? styles.pinnedChipRight : null]}>
            <Text style={[styles.pinnedChipText, isMe ? styles.pinnedChipTextRight : null]}>
              PINNED
            </Text>
          </View>
        ) : null}

        {!isMe ? (
          <Text style={styles.senderName}>
            {item.senderName || 'Resident'}
            {item.senderRole === 'admin' ? '  Admin' : ''}
          </Text>
        ) : null}

        {item.isDeleted ? (
          <Text style={styles.deletedText}>This message was deleted</Text>
        ) : (
          <>
            {hasImage ? (
              <View style={styles.mediaBlock}>
                <TouchableOpacity
                  onPress={() => onPreviewImage(item)}
                  activeOpacity={0.9}
                  style={styles.imageWrap}
                >
                  <Image source={{ uri: item.mediaUrl }} style={styles.chatImage} resizeMode="cover" />
                </TouchableOpacity>
                <AttachmentActions
                  onExpand={() => onPreviewImage(item)}
                  onDownload={() => onDownloadMedia(item)}
                  light={!isMe}
                />
              </View>
            ) : null}

            {hasFile ? (
              <View style={[styles.fileCard, isMe ? styles.fileCardRight : null]}>
                <View style={styles.fileIconBadge}>
                  <Text style={styles.fileIconText}>{item.mediaType === 'pdf' ? 'PDF' : 'FILE'}</Text>
                </View>
                <View style={styles.fileInfo}>
                  <Text numberOfLines={1} style={[styles.fileName, isMe ? styles.fileNameRight : null]}>
                    {resolveFileName(item)}
                  </Text>
                  <Text style={[styles.fileSubLabel, isMe ? styles.fileSubLabelRight : null]}>
                    Tap to open attachment
                  </Text>
                </View>
                <TouchableOpacity onPress={() => openExternalUrl(item.mediaUrl)} activeOpacity={0.85}>
                  <Text style={[styles.fileOpenText, isMe ? styles.fileOpenTextRight : null]}>Open</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {!!item.text ? (
              <Text style={[styles.messageText, isMe ? styles.messageTextRight : styles.messageTextLeft]}>
                {item.text}
              </Text>
            ) : null}
          </>
        )}

        {reactionEntries.length > 0 ? (
          <View style={styles.reactionStrip}>
            {reactionEntries.map(([emoji, users]) => (
              <View key={`${item.id}_${emoji}`} style={styles.reactionPill}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{users.length}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.messageMetaRow}>
          <Text style={[styles.messageTime, isMe ? styles.messageTimeRight : styles.messageTimeLeft]}>
            {formatTime(item.timestamp)}
          </Text>
          {isMe && !item.isDeleted ? (
            <>
              <Text style={styles.messageStatusText}>
                {item.seenBy && item.seenBy.length > 0 ? 'Read' : 'Sent'}
              </Text>
              <Text style={styles.messageTick}>{item.seenBy && item.seenBy.length > 0 ? '✓✓' : '✓'}</Text>
            </>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SidebarPanel = ({
  files,
  isDesktop,
  media,
  members,
  navigation,
  onPreviewImage,
  onOpenFile,
  onClose,
}) => (
  <View style={[styles.sidebarRoot, isDesktop ? styles.sidebarDesktop : styles.sidebarMobile]}>
    {!isDesktop ? (
      <View style={styles.sidebarModalHeader}>
        <View>
          <Text style={styles.sidebarModalTitle}>Chat Details</Text>
          <Text style={styles.sidebarModalSubtitle}>Members, media, and files</Text>
        </View>
        <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.sidebarCloseButton}>
          <Text style={styles.sidebarCloseButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    ) : null}

    <ScrollView
      style={styles.sidebarScroll}
      contentContainerStyle={styles.sidebarScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <HoverCard style={styles.sidebarCard} disabled={!isDesktop}>
        <View style={styles.sidebarHeaderRow}>
          <Text style={styles.sidebarTitle}>Members</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{members.length}</Text>
          </View>
        </View>
        <Text style={styles.sidebarSubtitle}>Approved residents in this society</Text>
        <View style={styles.memberList}>
          {members.length === 0 ? (
            <Text style={styles.sidebarEmptyText}>No members found yet.</Text>
          ) : (
            members.map((member) => (
              <MemberItem
                key={member.id}
                item={member}
                onPress={() => navigation?.navigate?.('ProfileScreen', { userId: member.id })}
              />
            ))
          )}
        </View>
      </HoverCard>

      <HoverCard style={styles.sidebarCard} disabled={!isDesktop}>
        <View style={styles.sidebarHeaderRow}>
          <Text style={styles.sidebarTitle}>Shared Media</Text>
          <Text style={styles.sidebarCaption}>Latest 6</Text>
        </View>
        {media.length === 0 ? (
          <Text style={styles.sidebarEmptyText}>Images shared in chat will appear here.</Text>
        ) : (
          <View style={styles.mediaGrid}>
            {media.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => onPreviewImage(item)}
                activeOpacity={0.9}
                style={styles.mediaThumb}
              >
                <Image source={{ uri: item.mediaUrl }} style={styles.mediaThumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </HoverCard>

      <HoverCard style={styles.sidebarCard} disabled={!isDesktop}>
        <View style={styles.sidebarHeaderRow}>
          <Text style={styles.sidebarTitle}>Files</Text>
          <Text style={styles.sidebarCaption}>{files.length}</Text>
        </View>
        {files.length === 0 ? (
          <Text style={styles.sidebarEmptyText}>Uploaded documents will appear here.</Text>
        ) : (
          files.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onOpenFile(item)}
              activeOpacity={0.88}
              style={styles.fileListRow}
            >
              <View style={styles.fileListBadge}>
                <Text style={styles.fileListBadgeText}>{item.mediaType === 'pdf' ? 'PDF' : 'FILE'}</Text>
              </View>
              <View style={styles.fileListInfo}>
                <Text numberOfLines={1} style={styles.fileListTitle}>{resolveFileName(item)}</Text>
                <Text numberOfLines={1} style={styles.fileListMeta}>
                  {item.senderName || 'Resident'} · {formatTime(item.timestamp)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </HoverCard>
    </ScrollView>
  </View>
);

export default function ChatScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const { user, userData } = useAuth();

  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [typists, setTypists] = useState([]);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [dismissedPinnedId, setDismissedPinnedId] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [selectedSetDeleted, setSelectedSetDeleted] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showSidebarModal, setShowSidebarModal] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState(null);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const seenMessageIdsRef = useRef(new Set());
  const lastPinnedIdRef = useRef(null);
  const markSeenRef = useRef(() => {});
  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    viewableItems.forEach(({ item }) => {
      markSeenRef.current(item);
    });
  });

  const typingMemberIds = useMemo(() => new Set(typists.map((item) => item.userId)), [typists]);

  const membersWithStatus = useMemo(
    () => members.map((member) => ({ ...member, isTyping: typingMemberIds.has(member.id) })),
    [members, typingMemberIds]
  );

  const sharedMedia = useMemo(
    () =>
      [...messages]
        .filter((item) => item.mediaType === 'image' && item.mediaUrl)
        .sort((a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp))
        .slice(0, 6),
    [messages]
  );

  const sharedFiles = useMemo(
    () =>
      [...messages]
        .filter((item) => item.mediaType && item.mediaType !== 'image' && item.mediaUrl)
        .sort((a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp))
        .slice(0, 6),
    [messages]
  );

  const pinnedBannerVisible = pinnedMessage && dismissedPinnedId !== pinnedMessage.id;

  const scrollToLatest = (animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd?.({ animated });
    });
  };

  const scrollToMessage = (messageId) => {
    const index = messages.findIndex((message) => message.id === messageId);
    if (index < 0) {
      scrollToLatest();
      return;
    }

    setFocusedMessageId(messageId);
    flatListRef.current?.scrollToIndex?.({ animated: true, index, viewPosition: 0.5 });
    setTimeout(() => {
      setFocusedMessageId((current) => (current === messageId ? null : current));
    }, 1600);
  };

  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setIsMuted(!!snap.data().isMuted);
    });
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!userData?.societyId) return undefined;

    const messagesQuery = query(
      collection(db, 'chats', userData.societyId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const membersQuery = query(
      collection(db, 'users'),
      where('societyId', '==', userData.societyId),
      where('status', '==', 'approved')
    );
    const typingQuery = query(
      collection(db, 'typingStatus'),
      where('societyId', '==', userData.societyId)
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const nextMessages = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      setMessages(nextMessages);
      const latestPinned = [...nextMessages]
        .filter((item) => item.isPinned)
        .sort((a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp))[0];
      setPinnedMessage(latestPinned || null);
    }, (error) => console.error('[Chat] messages error:', error));

    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      const nextMembers = snapshot.docs
        .map((entry) => ({ id: entry.id, ...entry.data() }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setMembers(nextMembers);
    }, (error) => console.error('[Chat] members error:', error));

    const unsubTyping = onSnapshot(typingQuery, (snapshot) => {
      const nextTypists = snapshot.docs
        .map((entry) => ({ id: entry.id, ...entry.data() }))
        .filter((entry) => entry.userId !== user.uid && entry.isTyping);
      setTypists(nextTypists);
    }, (error) => console.error('[Chat] typing error:', error));

    return () => {
      unsubMessages();
      unsubMembers();
      unsubTyping();
    };
  }, [user?.uid, userData?.societyId]);

  useEffect(() => {
    if (!messages.length) return;
    scrollToLatest(false);
  }, [messages.length]);

  useEffect(() => {
    if (!pinnedMessage?.id) {
      lastPinnedIdRef.current = null;
      return;
    }
    if (lastPinnedIdRef.current !== pinnedMessage.id) {
      setDismissedPinnedId(null);
      lastPinnedIdRef.current = pinnedMessage.id;
    }
  }, [pinnedMessage?.id]);

  useEffect(() => {
    if (!isDesktop) return;
    setShowSidebarModal(false);
    setShowAttachmentMenu(false);
  }, [isDesktop]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (userData?.societyId && user?.uid) {
      setDoc(doc(db, 'typingStatus', `${userData.societyId}_${user.uid}`), { isTyping: false }, { merge: true }).catch(() => {});
    }
  }, [user?.uid, userData?.societyId]);

  const handleSend = async (mediaUrl = null, mediaType = null, mediaName = null) => {
    const text = inputText.trim();
    if ((!text && !mediaUrl) || !userData?.societyId || !user?.uid) return;

    setInputText('');
    setShowAttachmentMenu(false);

    const payload = {
      text,
      senderId: user.uid,
      senderName: userData.name || 'Unknown',
      senderProfileUrl: userData.profileImageUrl || '',
      senderRole: userData.role || 'resident',
      societyId: userData.societyId,
      timestamp: Date.now(),
      seenBy: [],
      reactions: {},
      isDeleted: false,
    };

    if (mediaUrl) {
      payload.mediaUrl = mediaUrl;
      payload.mediaType = mediaType;
      payload.mediaName = mediaName;
    }

    try {
      await addDoc(collection(db, 'chats', userData.societyId, 'messages'), payload);
      await setDoc(doc(db, 'typingStatus', `${userData.societyId}_${user.uid}`), { isTyping: false }, { merge: true });
      scrollToLatest();
    } catch (error) {
      console.error('[Chat] send error:', error);
      Alert.alert('Unable to send', 'Please try again.');
    }
  };

  const handleTyping = (text) => {
    setInputText(text);
    if (!userData?.societyId || !user?.uid) return;

    const typingRef = doc(db, 'typingStatus', `${userData.societyId}_${user.uid}`);
    if (text.trim()) {
      setDoc(typingRef, {
        userId: user.uid,
        name: userData.name || 'Resident',
        isTyping: true,
        societyId: userData.societyId,
      }, { merge: true }).catch(() => {});

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setDoc(typingRef, { isTyping: false }, { merge: true }).catch(() => {});
      }, 1500);
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setDoc(typingRef, { isTyping: false }, { merge: true }).catch(() => {});
  };

  const uploadAndSend = async (source, type, isWeb, mediaName) => {
    setUploadingMedia(true);
    try {
      let mediaUrl = '';
      if (type === 'image') {
        mediaUrl = isWeb
          ? await uploadImage(source)
          : await uploadImage({ uri: source, type: 'image/jpeg', name: mediaName || 'chat_image.jpg' });
      } else {
        mediaUrl = await uploadDocument(source);
      }
      if (mediaUrl) await handleSend(mediaUrl, type, mediaName);
    } catch (error) {
      console.error('[Chat] upload error:', error);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handlePickImage = async () => {
    if (isMuted || uploadingMedia) return;
    setShowAttachmentMenu(false);
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
          const file = event.target.files?.[0];
          if (file) await uploadAndSend(file, 'image', true, file.name || 'image');
        };
        input.click();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.72,
      });
      if (!result.canceled && result.assets?.length) {
        await uploadAndSend(result.assets[0].uri, 'image', false, 'chat_image.jpg');
      }
    } catch (error) {
      console.error('[Chat] pick image error:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handlePickDocument = async () => {
    if (isMuted || uploadingMedia) return;
    setShowAttachmentMenu(false);
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx';
        input.onchange = async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const fileType = file.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'file';
          await uploadAndSend(file, fileType, true, file.name || 'attachment');
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.length) {
        const fileAsset = result.assets[0];
        const fileType = fileAsset.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'file';
        await uploadAndSend(fileAsset.uri, fileType, false, fileAsset.name || 'attachment');
      }
    } catch (error) {
      console.error('[Chat] pick document error:', error);
      Alert.alert('Error', 'Failed to pick file.');
    }
  };

  const handleLongPress = (item, setDelFn) => {
    setSelectedMsg(item);
    setSelectedSetDeleted(() => setDelFn);
    setActionModalVisible(true);
  };

  const handleReaction = async (emoji) => {
    if (!selectedMsg || !userData?.societyId || !user?.uid) return;
    setActionModalVisible(false);
    const messageRef = doc(db, 'chats', userData.societyId, 'messages', selectedMsg.id);
    const currentUsers = (selectedMsg.reactions || {})[emoji] || [];
    try {
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: currentUsers.includes(user.uid) ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (error) {
      console.error('[Chat] reaction error:', error);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMsg || selectedMsg.senderId !== user?.uid || !userData?.societyId) return;
    setActionModalVisible(false);
    try {
      await updateDoc(doc(db, 'chats', userData.societyId, 'messages', selectedMsg.id), {
        text: 'This message was deleted',
        isDeleted: true,
        mediaUrl: '',
        mediaType: null,
      });
    } catch (error) {
      console.error('[Chat] delete error:', error);
    }
  };

  const togglePinForMessage = async (message) => {
    if (!message || !userData?.societyId) return;
    try {
      await updateDoc(doc(db, 'chats', userData.societyId, 'messages', message.id), {
        isPinned: !message.isPinned,
      });
    } catch (error) {
      console.error('[Chat] pin error:', error);
    }
  };

  const handlePinMessage = async () => {
    if (!selectedMsg) return;
    setActionModalVisible(false);
    await togglePinForMessage(selectedMsg);
  };

  const handlePinnedClose = async () => {
    if (!pinnedMessage) return;
    if (userData?.role === 'admin') {
      await togglePinForMessage(pinnedMessage);
      return;
    }
    setDismissedPinnedId(pinnedMessage.id);
  };

  const handleDownloadMedia = async (item) => {
    await downloadExternalUrl(item.mediaUrl, resolveFileName(item));
  };

  const markSeen = async (item) => {
    if (
      !item ||
      item.senderId === user?.uid ||
      item.isDeleted ||
      (item.seenBy || []).includes(user?.uid) ||
      seenMessageIdsRef.current.has(item.id) ||
      !userData?.societyId
    ) {
      return;
    }

    seenMessageIdsRef.current.add(item.id);
    try {
      await updateDoc(doc(db, 'chats', userData.societyId, 'messages', item.id), {
        seenBy: arrayUnion(user.uid),
      });
    } catch (error) {
      seenMessageIdsRef.current.delete(item.id);
      console.error('[Chat] seen error:', error);
    }
  };

  useEffect(() => {
    markSeenRef.current = markSeen;
  });

  const typingLabel = useMemo(() => {
    if (!typists.length) return '';
    if (typists.length === 1) return `${typists[0].name || 'Someone'} is typing...`;
    if (typists.length === 2) return `${typists[0].name || 'Someone'} and ${typists[1].name || 'someone'} are typing...`;
    return `${typists.length} people are typing...`;
  }, [typists]);

  const handleGoBack = () => {
    setShowAttachmentMenu(false);
    navigation?.goBack?.();
  };

  const openDetailsPanel = () => {
    setShowAttachmentMenu(false);
    setShowSidebarModal(true);
  };

  const closeDetailsPanel = () => {
    setShowSidebarModal(false);
  };

  const pageHeaderOffset = 70;

  const chatContent = (
    <View style={[styles.chatContainer, !isDesktop ? styles.chatContainerMobile : null, !isDesktop ? styles.chatContainerOverlay : null]}>
      <View style={styles.chatMain}>
        {!isDesktop ? (
          <View style={styles.mobileHeader}>
            <TouchableOpacity onPress={handleGoBack} activeOpacity={0.85} style={styles.mobileBackButton}>
              <Text style={styles.mobileBackIcon}>{BACK_ICON}</Text>
              <Text style={styles.mobileHeaderTitle}>Community Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openDetailsPanel} activeOpacity={0.88} style={styles.detailsButton}>
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {pinnedBannerVisible ? (
          <View style={styles.pinnedBanner}>
            <TouchableOpacity onPress={() => scrollToMessage(pinnedMessage.id)} activeOpacity={0.88} style={styles.pinnedBannerBody}>
              <View style={styles.pinnedMarker} />
              <View style={styles.pinnedContent}>
                <Text style={styles.pinnedLabel}>Pinned message</Text>
                <Text numberOfLines={1} style={styles.pinnedText}>{pinnedMessage.text || resolveFileName(pinnedMessage)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePinnedClose} activeOpacity={0.85} style={styles.pinnedClose}>
              <Text style={styles.pinnedCloseText}>{userData?.role === 'admin' ? 'Unpin' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <KeyboardAvoidingView style={styles.chatPanel} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.messagesCard}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MessageItem
                  item={item}
                  isMe={item.senderId === user?.uid}
                  isHighlighted={focusedMessageId === item.id}
                  navigation={navigation}
                  onLongPress={handleLongPress}
                  onPreviewImage={setPreviewItem}
                  onDownloadMedia={handleDownloadMedia}
                />
              )}
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollToLatest(false)}
              onViewableItemsChanged={onViewableItemsChangedRef.current}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              onScrollToIndexFailed={(info) => {
                flatListRef.current?.scrollToOffset?.({ animated: true, offset: Math.max(0, info.averageItemLength * info.index) });
                setTimeout(() => scrollToMessage(messages[info.index]?.id), 180);
              }}
              ListEmptyComponent={(
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>Start the conversation</Text>
                  <Text style={styles.emptyStateText}>Messages, photos, and files will appear here instantly.</Text>
                </View>
              )}
            />
          </View>

          {typingLabel ? (
            <View style={styles.typingBar}>
              <View style={styles.typingPulse} />
              <Text style={styles.typingText}>{typingLabel}</Text>
            </View>
          ) : null}

          <View style={styles.composerWrap}>
            {showAttachmentMenu ? (
              <View style={styles.attachmentMenu}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={0.88}
                  disabled={isMuted || uploadingMedia}
                  style={[styles.attachmentMenuButton, (isMuted || uploadingMedia) ? styles.attachmentMenuButtonDisabled : null]}
                >
                  <Text style={styles.attachmentMenuTitle}>Upload Image</Text>
                  <Text style={styles.attachmentMenuSubtitle}>Share a photo from your device</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePickDocument}
                  activeOpacity={0.88}
                  disabled={isMuted || uploadingMedia}
                  style={[styles.attachmentMenuButton, (isMuted || uploadingMedia) ? styles.attachmentMenuButtonDisabled : null]}
                >
                  <Text style={styles.attachmentMenuTitle}>Upload File</Text>
                  <Text style={styles.attachmentMenuSubtitle}>Share PDF, DOC, XLS, or text files</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.chatInput}>
              <TouchableOpacity
                onPress={() => setShowAttachmentMenu((value) => !value)}
                activeOpacity={0.85}
                disabled={isMuted || uploadingMedia}
                style={[styles.attachButton, (isMuted || uploadingMedia) ? styles.attachButtonDisabled : null]}
              >
                <Text style={styles.attachButtonText}>{ATTACH_ICON}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={handleTyping}
                onFocus={() => setShowAttachmentMenu(false)}
                placeholder={isMuted ? 'Muted by admin' : 'Type a message'}
                placeholderTextColor="#94a3b8"
                multiline
                editable={!isMuted && !uploadingMedia}
              />
              <TouchableOpacity
                onPress={() => handleSend()}
                activeOpacity={0.9}
                disabled={!inputText.trim() || uploadingMedia || isMuted}
                style={[styles.sendButton, (!inputText.trim() || uploadingMedia || isMuted) ? styles.sendButtonDisabled : null]}
              >
                {uploadingMedia ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.sendButtonText}>{SEND_ICON}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {isDesktop ? (
        <SidebarPanel
          files={sharedFiles}
          isDesktop
          media={sharedMedia}
          members={membersWithStatus}
          navigation={navigation}
          onPreviewImage={setPreviewItem}
          onOpenFile={(item) => openExternalUrl(item.mediaUrl)}
        />
      ) : null}

      {showSidebarModal && !isDesktop ? (
        <Pressable style={styles.inlineOverlay} onPress={closeDetailsPanel}>
          <Pressable style={styles.sidebarModalCard} onPress={(event) => event.stopPropagation?.()}>
            <SidebarPanel
              files={sharedFiles}
              isDesktop={false}
              media={sharedMedia}
              members={membersWithStatus}
              navigation={navigation}
              onPreviewImage={(item) => {
                closeDetailsPanel();
                setPreviewItem(item);
              }}
              onOpenFile={(item) => openExternalUrl(item.mediaUrl)}
              onClose={closeDetailsPanel}
            />
          </Pressable>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isDesktop ? <View style={styles.screenShell}>{chatContent}</View> : <View style={styles.mobileChatPlaceholder} />}

      {!isDesktop ? (
        <Modal visible transparent animationType="none" onRequestClose={() => navigation?.goBack?.()}>
          <View style={styles.mobileChatModalRoot}>
            <View style={[styles.mobileChatHeaderGap, { height: pageHeaderOffset }]} />
            <View style={styles.mobileChatStage}>{chatContent}</View>
          </View>
        </Modal>
      ) : null}

      <Modal visible={!!previewItem} transparent animationType="fade" onRequestClose={() => setPreviewItem(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewItem(null)}>
          <Pressable style={styles.previewCard} onPress={(event) => event.stopPropagation?.()}>
            {previewItem?.mediaUrl ? <Image source={{ uri: previewItem.mediaUrl }} style={styles.previewImage} resizeMode="contain" /> : null}
            <View style={styles.previewFooter}>
              <View style={styles.previewMeta}>
                <Text numberOfLines={1} style={styles.previewTitle}>{previewItem?.senderName || 'Resident'}</Text>
                <Text style={styles.previewSubtitle}>{formatTime(previewItem?.timestamp)}</Text>
              </View>
              <View style={styles.previewActions}>
                <TouchableOpacity onPress={() => previewItem && handleDownloadMedia(previewItem)} activeOpacity={0.85} style={styles.previewActionButton}>
                  <Text style={styles.previewActionText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPreviewItem(null)} activeOpacity={0.85} style={[styles.previewActionButton, styles.previewActionButtonMuted]}>
                  <Text style={[styles.previewActionText, styles.previewActionTextMuted]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={actionModalVisible} transparent animationType="fade" onRequestClose={() => setActionModalVisible(false)}>
        <Pressable style={styles.modalOverlayDark} onPress={() => setActionModalVisible(false)}>
          <Pressable style={styles.actionSheet} onPress={(event) => event.stopPropagation?.()}>
            <View style={styles.reactionRow}>
              {REACTION_OPTIONS.map((emoji) => (
                <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} activeOpacity={0.85} style={styles.emojiButton}>
                  <Text style={styles.emojiButtonText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sheetDivider} />
            <TouchableOpacity onPress={() => { selectedSetDeleted?.(true); setActionModalVisible(false); }} activeOpacity={0.85} style={styles.sheetRow}>
              <Text style={styles.sheetRowText}>Delete for me</Text>
            </TouchableOpacity>
            {selectedMsg?.senderId === user?.uid ? (
              <TouchableOpacity onPress={handleDeleteForEveryone} activeOpacity={0.85} style={styles.sheetRow}>
                <Text style={[styles.sheetRowText, styles.sheetRowDanger]}>Delete for everyone</Text>
              </TouchableOpacity>
            ) : null}
            {userData?.role === 'admin' ? (
              <TouchableOpacity onPress={handlePinMessage} activeOpacity={0.85} style={styles.sheetRow}>
                <Text style={styles.sheetRowText}>{selectedMsg?.isPinned ? 'Unpin message' : 'Pin message'}</Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const SHADOW = Platform.select({
  web: {
    boxShadow: '0px 14px 32px rgba(15, 23, 42, 0.12)',
  },
  default: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff',
    overflow: 'hidden',
  },
  screenShell: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  mobileChatPlaceholder: {
    flex: 1,
  },
  mobileChatModalRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mobileChatHeaderGap: {
    backgroundColor: 'transparent',
  },
  mobileChatStage: {
    flex: 1,
    overflow: 'hidden',
  },
  chatContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#ffffff',
    ...SHADOW,
  },
  chatContainerMobile: {
    borderRadius: 0,
    ...Platform.select({
      web: {
        boxShadow: 'none',
      },
      default: {
        shadowOpacity: 0,
        elevation: 0,
      },
    }),
  },
  chatContainerOverlay: {
    height: '100%',
  },
  mobileHeader: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mobileBackButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileBackIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  mobileHeaderTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  chatMain: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#ffffff',
  },
  detailsButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
  },
  pinnedBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pinnedBannerBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedMarker: {
    width: 10,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#0284c7',
  },
  pinnedContent: {
    flex: 1,
    marginLeft: 12,
  },
  pinnedLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369a1',
    textTransform: 'uppercase',
  },
  pinnedText: {
    marginTop: 4,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  pinnedClose: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  pinnedCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  chatPanel: {
    flex: 1,
    minHeight: 0,
  },
  messagesCard: {
    flex: 1,
    minHeight: 0,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 90,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageAvatarWrap: {
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  messageAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  messageAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarFallbackText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3730a3',
  },
  messageBubble: {
    maxWidth: '72%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  messageBubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 8,
  },
  messageBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
    borderColor: '#4f46e5',
    borderBottomRightRadius: 8,
  },
  messageBubbleHighlighted: {
    borderColor: '#38bdf8',
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 0px 1px rgba(56, 189, 248, 0.18), 0px 12px 24px rgba(56, 189, 248, 0.18)',
      },
      default: {
        shadowColor: '#38bdf8',
        shadowOpacity: 0.16,
        shadowRadius: 14,
      },
    }),
  },
  pinnedChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    marginBottom: 8,
  },
  pinnedChipRight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pinnedChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.4,
  },
  pinnedChipTextRight: {
    color: '#ffffff',
  },
  senderName: {
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextLeft: {
    color: '#0f172a',
  },
  messageTextRight: {
    color: '#ffffff',
  },
  deletedText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  mediaBlock: {
    marginBottom: 8,
  },
  imageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  chatImage: {
    width: 240,
    height: 180,
    backgroundColor: '#dbeafe',
  },
  attachmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  attachmentActionLight: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  attachmentActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  attachmentActionTextDark: {
    color: '#1e3a8a',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 8,
  },
  fileCardRight: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  fileIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  fileNameRight: {
    color: '#ffffff',
  },
  fileSubLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  fileSubLabelRight: {
    color: '#dbeafe',
  },
  fileOpenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  fileOpenTextRight: {
    color: '#ffffff',
  },
  reactionStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  messageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  messageTime: {
    fontSize: 11,
  },
  messageTimeLeft: {
    color: '#64748b',
  },
  messageTimeRight: {
    color: '#dbeafe',
  },
  messageStatusText: {
    fontSize: 11,
    color: '#e0e7ff',
  },
  messageTick: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  typingBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  typingPulse: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  typingText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  composerWrap: {
    position: 'relative',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        position: 'sticky',
        bottom: 0,
        zIndex: 30,
      },
      default: {},
    }),
  },
  attachmentMenu: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 68,
    padding: 8,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    gap: 8,
    ...SHADOW,
    zIndex: 20,
  },
  attachmentMenuButton: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  attachmentMenuButtonDisabled: {
    opacity: 0.55,
  },
  attachmentMenuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  attachmentMenuSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  attachButtonDisabled: {
    opacity: 0.45,
  },
  attachButtonText: {
    fontSize: 18,
    color: '#334155',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#0f172a',
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  sidebarRoot: {
    backgroundColor: '#ffffff',
  },
  sidebarDesktop: {
    width: 300,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  sidebarMobile: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  sidebarModalHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sidebarModalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  sidebarCloseButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  sidebarCloseButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarScrollContent: {
    padding: 16,
    gap: 16,
  },
  sidebarCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOW,
  },
  hoverLift: {
    transform: [{ translateY: -2 }],
  },
  pressedCard: {
    transform: [{ translateY: 0 }],
  },
  sidebarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sidebarSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
  },
  sidebarCaption: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  memberList: {
    marginTop: 14,
    gap: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#eef2f7',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  memberTypingDot: {
    position: 'absolute',
    left: 44,
    top: 42,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  memberRole: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748b',
  },
  memberMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  sidebarEmptyText: {
    marginTop: 14,
    fontSize: 13,
    color: '#94a3b8',
  },
  mediaGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaThumb: {
    width: 78,
    height: 78,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#dbeafe',
  },
  mediaThumbImage: {
    width: '100%',
    height: '100%',
  },
  fileListRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#eef2f7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileListBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileListBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  fileListInfo: {
    flex: 1,
  },
  fileListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  fileListMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    paddingTop: 120,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#64748b',
    textAlign: 'center',
  },
  inlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    justifyContent: 'flex-end',
    padding: 12,
    zIndex: 40,
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.46)',
    justifyContent: 'flex-end',
  },
  sidebarModalCard: {
    maxHeight: '82%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewCard: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  previewImage: {
    width: '100%',
    height: 420,
    backgroundColor: '#020617',
  },
  previewFooter: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  previewMeta: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  previewSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#cbd5e1',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  previewActionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#2563eb',
  },
  previewActionButtonMuted: {
    backgroundColor: '#e2e8f0',
  },
  previewActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  previewActionTextMuted: {
    color: '#0f172a',
  },
  actionSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  emojiButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonText: {
    fontSize: 26,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  sheetRow: {
    paddingVertical: 14,
  },
  sheetRowText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sheetRowDanger: {
    color: '#dc2626',
  },
});
