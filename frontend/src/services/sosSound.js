import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

let currentSound = null;
let currentWebAudio = null;

const soundAsset = require('../../assets/sos-alert.wav');

async function playWebSOSSound() {
  try {
    const asset = Asset.fromModule(soundAsset);
    if (!asset.localUri && !asset.uri) {
      await asset.downloadAsync();
    }

    const audioUri = asset.localUri || asset.uri;
    if (!audioUri || typeof window === 'undefined' || typeof window.Audio !== 'function') {
      return;
    }

    if (currentWebAudio) {
      currentWebAudio.pause();
      currentWebAudio.currentTime = 0;
    }

    const audio = new window.Audio(audioUri);
    audio.preload = 'auto';
    currentWebAudio = audio;
    await audio.play();
  } catch (error) {
    console.warn('[SOS] Web audio playback failed:', error);
  }
}

async function playNativeSOSSound() {
  const { Audio } = await import('expo-av');

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  if (currentSound) {
    await currentSound.unloadAsync();
    currentSound = null;
  }

  const { sound } = await Audio.Sound.createAsync(soundAsset);
  currentSound = sound;

  sound.setOnPlaybackStatusUpdate(async (status) => {
    if (status?.didJustFinish) {
      await sound.unloadAsync();
      if (currentSound === sound) {
        currentSound = null;
      }
    }
  });

  await sound.playAsync();
}

export async function playSOSSound() {
  try {
    if (Platform.OS === 'web') {
      await playWebSOSSound();
      return;
    }

    await playNativeSOSSound();
  } catch (error) {
    console.warn('[SOS] Unable to play alert sound:', error);
  }
}
