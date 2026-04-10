import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FiX } from '../../../utils/iconCompat';

const screen = Dimensions.get('window');

const ImageModal = ({ viewerImage, imageLoading, onLoadStart, onLoadEnd, onClose }) => (
  <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation?.()}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{viewerImage?.label || 'Issue Image'}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FiX size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.zoomWrap}
          contentContainerStyle={styles.zoomContent}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          bouncesZoom
        >
          {viewerImage?.uri ? (
            <>
              {imageLoading ? (
                <View style={styles.modalLoader}>
                  <ActivityIndicator size="large" color="#ffffff" />
                </View>
              ) : null}
              <Image
                source={{ uri: viewerImage.uri }}
                style={styles.fullImage}
                resizeMode="contain"
                onLoadStart={onLoadStart}
                onLoadEnd={onLoadEnd}
              />
            </>
          ) : null}
        </ScrollView>
        <Text style={styles.modalHint}>Tap outside or use the close button to exit.</Text>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.94)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  modalCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#020617',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomWrap: {
    flex: 1,
  },
  zoomContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fullImage: {
    width: screen.width - 48,
    height: screen.height * 0.7,
  },
  modalLoader: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    zIndex: 2,
  },
  modalHint: {
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
});

export default ImageModal;
