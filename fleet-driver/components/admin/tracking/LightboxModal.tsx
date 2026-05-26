import React from 'react';
import {
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import { X } from 'lucide-react-native';

interface LightboxModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/95 items-center justify-center p-4"
      >
        <TouchableOpacity
          onPress={onClose}
          className="absolute top-12 right-6 p-2.5 bg-white/10 rounded-full"
        >
          <X size={20} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-[70%] rounded-2xl border border-white/10"
          resizeMode="contain"
        />
      </TouchableOpacity>
    </Modal>
  );
};
